import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";

const [
  inputArgument,
  outputArgument = ".scratch/workbook-contract.json",
  goldenArgument,
  seedArgument,
  formulaArgument,
] = process.argv.slice(2);

if (!inputArgument) {
  console.error(
    "Usage: npm run extract:model -- <workbook.xlsx> [output.json]",
  );
  process.exit(1);
}

const inputPath = resolve(inputArgument);
const outputPath = resolve(outputArgument);
const goldenPath = resolve(
  goldenArgument ??
    `${outputPath.slice(0, -extname(outputPath).length)}.golden.ndjson`,
);
const outputStem = outputPath.slice(0, -extname(outputPath).length);
const seedPath = resolve(seedArgument ?? `${outputStem}.seed.ndjson`);
const formulaPath = resolve(formulaArgument ?? `${outputStem}.formulas.ndjson`);
const source = readFileSync(inputPath);

const readEntry = (entry) =>
  execFileSync("unzip", ["-p", inputPath, entry], {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const decodeXml = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");

const attributes = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map((match) => [
      match[1],
      decodeXml(match[2]),
    ]),
  );

const workbookXml = readEntry("xl/workbook.xml");
const sharedStringsXml = readEntry("xl/sharedStrings.xml");
const sharedStrings = [
  ...sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g),
].map((match) =>
  [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((text) => decodeXml(text[1]))
    .join(""),
);
const relationshipsXml = readEntry("xl/_rels/workbook.xml.rels");
const relationshipTargets = new Map(
  [...relationshipsXml.matchAll(/<Relationship\b[^>]*\/>/g)].map((match) => {
    const value = attributes(match[0]);
    return [value.Id, value.Target];
  }),
);

const sheetDefinitions = [...workbookXml.matchAll(/<sheet\b[^>]*\/>/g)].map(
  (match, order) => {
    const value = attributes(match[0]);
    return {
      order,
      name: value.name,
      state: value.state ?? "visible",
      entry: `xl/${relationshipTargets.get(value["r:id"])}`,
    };
  },
);

const parseCellAddress = (address) => {
  const match = /^([A-Z]+)(\d+)$/.exec(address);
  if (!match) throw new Error(`Unsupported cell address: ${address}`);
  return { row: Number(match[2]), column: columnNumber(match[1]) };
};

const normalizeFormula = (formula, originAddress) => {
  const origin = parseCellAddress(originAddress);
  return decodeXml(formula)
    .replaceAll(
      /(?<![A-Z0-9_.])((?:'[^']+'|[A-Z_][A-Z0-9 _(),&.-]*)!)?(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Z0-9_])/gi,
      (_, sheetPrefix = "", absoluteColumn, columnLettersValue, absoluteRow, rowValue) => {
        const column = columnNumber(columnLettersValue.toUpperCase());
        const row = Number(rowValue);
        const rowToken = absoluteRow ? `R${row}` : `R[${row - origin.row}]`;
        const columnToken = absoluteColumn
          ? `C${column}`
          : `C[${column - origin.column}]`;
        return `${sheetPrefix.toUpperCase()}${rowToken}${columnToken}`;
      },
    )
    .replaceAll(/\s+/g, "")
    .toUpperCase();
};

const translateSharedFormula = (formula, anchorAddress, targetAddress) => {
  const anchor = parseCellAddress(anchorAddress);
  const target = parseCellAddress(targetAddress);
  const rowDelta = target.row - anchor.row;
  const columnDelta = target.column - anchor.column;
  return decodeXml(formula).replaceAll(
    /(?<![A-Z0-9_.])((?:'[^']+'|[A-Z_][A-Z0-9 _(),&.-]*)!)?(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Z0-9_])/gi,
    (_, sheetPrefix = "", absoluteColumn, columnLettersValue, absoluteRow, rowValue) => {
      const column = columnNumber(columnLettersValue.toUpperCase()) + (absoluteColumn ? 0 : columnDelta);
      const row = Number(rowValue) + (absoluteRow ? 0 : rowDelta);
      if (column < 1 || row < 1) return `${sheetPrefix}#REF!`;
      return `${sheetPrefix}${absoluteColumn}${columnLetters(column)}${absoluteRow}${row}`;
    },
  );
};

const formulaFunctions = (formula) => {
  const expression = decodeXml(formula)
    .replaceAll(/"(?:[^"]|"")*"/g, "")
    .replaceAll(/'(?:[^']|'')*'!/g, "");
  return [
    ...expression.matchAll(
      /(?<![A-Z0-9_.])(?:_xlfn\.)?([A-Z_][A-Z0-9_.]*)\s*\(/gi,
    ),
  ].map((match) => match[1].toUpperCase());
};

const columnNumber = (letters) =>
  [...letters].reduce(
    (total, character) => total * 26 + character.charCodeAt(0) - 64,
    0,
  );

const columnLetters = (number) => {
  let value = number;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
};

const parseDimension = (xml) => {
  const match = xml.match(/<dimension\b[^>]*ref="([^"]+)"/);
  if (match) return match[1];

  let maximumRow = 0;
  let maximumColumn = 0;
  for (const cell of xml.matchAll(/<c\b[^>]*\br="([A-Z]+)(\d+)"/g)) {
    maximumColumn = Math.max(maximumColumn, columnNumber(cell[1]));
    maximumRow = Math.max(maximumRow, Number(cell[2]));
  }
  return maximumRow && maximumColumn
    ? `A1:${columnLetters(maximumColumn)}${maximumRow}`
    : null;
};

const parseCachedValue = (cellAttributes, body) => {
  if (cellAttributes.t === "inlineStr") {
    const inline = [...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join("");
    return { type: "string", value: inline };
  }
  const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
  if (value === undefined) return { type: "blank" };
  const decoded = decodeXml(value);
  if (cellAttributes.t === "b")
    return { type: "boolean", value: decoded === "1" };
  if (cellAttributes.t === "e") return { type: "error", value: decoded };
  if (cellAttributes.t === "s")
    return { type: "string", value: sharedStrings[Number(decoded)] ?? "" };
  if (cellAttributes.t === "str") return { type: "string", value: decoded };
  const number = Number(decoded);
  return Number.isFinite(number)
    ? { type: "number", value: number }
    : { type: "string", value: decoded };
};

const cachedFormulaRecords = [];
const seedRecords = [];
const formulaSourceRecords = [];

const sheetContracts = sheetDefinitions.map((sheet) => {
  const xml = readEntry(sheet.entry);
  const cells = [
    ...xml.matchAll(/<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g),
  ].map((match) => ({
    attributes: attributes(`<c ${match[1] ?? match[2] ?? ""}>`),
    body: match[3] ?? "",
  }));
  const formulaCells = cells
    .map((cell) => {
      const formula = cell.body.match(
        /<f\b([^>]*)\/>|<f\b([^>]*)>([\s\S]*?)<\/f>/,
      );
      if (!formula) return null;
      return {
        address: cell.attributes.r,
        styleIndex: Number(cell.attributes.s ?? 0),
        attributes: attributes(`<f ${formula[1] ?? formula[2] ?? ""}>`),
        formula: formula[3] ? decodeXml(formula[3]) : null,
        cached: parseCachedValue(cell.attributes, cell.body),
      };
    })
    .filter(Boolean);
  const formulaAddresses = new Set(formulaCells.map((cell) => cell.address));
  for (const cell of cells) {
    if (formulaAddresses.has(cell.attributes.r)) continue;
    const value = parseCachedValue(cell.attributes, cell.body);
    if (value.type === "blank") continue;
    seedRecords.push({
      sheet: sheet.name,
      address: cell.attributes.r,
      styleIndex: Number(cell.attributes.s ?? 0),
      value,
    });
  }
  const familyCounts = new Map();
  const functionCounts = new Map();
  const sharedAnchors = new Map();
  let formulaAnchors = 0;
  let sharedFormulaReferences = 0;

  for (const cell of formulaCells) {
    if (cell.formula) {
      formulaAnchors += 1;
      for (const name of formulaFunctions(cell.formula)) {
        functionCounts.set(name, (functionCounts.get(name) ?? 0) + 1);
      }
      if (cell.attributes.t === "shared" && cell.attributes.si !== undefined) {
        sharedAnchors.set(cell.attributes.si, {
          address: cell.address,
          formula: cell.formula,
          normalized: normalizeFormula(cell.formula, cell.address),
        });
      }
      formulaSourceRecords.push({
        sheet: sheet.name,
        address: cell.address,
        styleIndex: cell.styleIndex,
        formula: cell.formula,
        formulaType: cell.attributes.t ?? "scalar",
        sharedIndex:
          cell.attributes.si === undefined ? null : Number(cell.attributes.si),
        appliesTo: cell.attributes.ref ?? cell.address,
      });
    } else if (cell.attributes.t === "shared") {
      sharedFormulaReferences += 1;
    }
  }

  for (const cell of formulaCells) {
    const sharedAnchor = sharedAnchors.get(cell.attributes.si);
    const effectiveFormula = cell.formula ?? (
      cell.attributes.t === "shared" && sharedAnchor
        ? translateSharedFormula(sharedAnchor.formula, sharedAnchor.address, cell.address)
        : null
    );
    const normalized = cell.formula
      ? normalizeFormula(cell.formula, cell.address)
      : cell.attributes.t === "shared"
        ? sharedAnchors.get(cell.attributes.si)?.normalized
        : undefined;
    const normalizedTemplate = normalized ?? "#UNRESOLVED_FORMULA";
    const digest = sha256(normalizedTemplate);
    const current = familyCounts.get(digest);
    familyCounts.set(digest, {
      digest,
      normalizedTemplate,
      count: (current?.count ?? 0) + 1,
      exampleFormula:
        current?.exampleFormula ??
        effectiveFormula ??
        null,
      exampleAddress: current?.exampleAddress ?? cell.address,
    });
    cachedFormulaRecords.push({
      sheet: sheet.name,
      address: cell.address,
      styleIndex: cell.styleIndex,
      cached: cell.cached,
      formulaFamilyDigest: digest,
      sharedIndex:
        cell.attributes.t === "shared" ? Number(cell.attributes.si) : null,
    });
  }

  return {
    order: sheet.order,
    name: sheet.name,
    state: sheet.state,
    dimension: parseDimension(xml),
    cellCount: cells.length,
    formulaCellCount: formulaCells.length,
    formulaAnchorCount: formulaAnchors,
    sharedFormulaReferenceCount: sharedFormulaReferences,
    validationCount: [...xml.matchAll(/<dataValidation\b/g)].length,
    validations: [
      ...xml.matchAll(
        /<dataValidation\b([^>]*)>([\s\S]*?)<\/dataValidation>|<dataValidation\b([^>]*)\/>/g,
      ),
    ]
      .map((match) => {
        const metadata = attributes(
          `<dataValidation ${match[1] ?? match[3] ?? ""}>`,
        );
        const body = match[2] ?? "";
        return {
          range: metadata.sqref ?? null,
          type: metadata.type ?? null,
          operator: metadata.operator ?? null,
          allowBlank: metadata.allowBlank === "1",
          formula1: decodeXml(
            body.match(/<formula1>([\s\S]*?)<\/formula1>/)?.[1] ?? "",
          ),
          formula2: decodeXml(
            body.match(/<formula2>([\s\S]*?)<\/formula2>/)?.[1] ?? "",
          ),
        };
      })
      .sort((left, right) =>
        String(left.range).localeCompare(String(right.range)),
      ),
    mergedRangeCount: [...xml.matchAll(/<mergeCell\b/g)].length,
    functionCounts: Object.fromEntries(
      [...functionCounts.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    formulaFamilies: [...familyCounts.values()].sort((left, right) =>
      left.digest.localeCompare(right.digest),
    ),
  };
});

const archiveEntries = execFileSync("unzip", ["-Z1", inputPath], {
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

const goldenNdjson =
  cachedFormulaRecords.map((record) => JSON.stringify(record)).join("\n") +
  "\n";
const seedNdjson =
  seedRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
const formulaNdjson =
  formulaSourceRecords.map((record) => JSON.stringify(record)).join("\n") +
  "\n";
const cachedTypeGroups = new Map();
for (const record of cachedFormulaRecords) {
  cachedTypeGroups.set(
    record.cached.type,
    (cachedTypeGroups.get(record.cached.type) ?? 0) + 1,
  );
}
const cachedValueTypes = Object.fromEntries(
  [...cachedTypeGroups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  ),
);
const workbookFunctionGroups = new Map();
for (const sheet of sheetContracts) {
  for (const [name, count] of Object.entries(sheet.functionCounts)) {
    workbookFunctionGroups.set(
      name,
      (workbookFunctionGroups.get(name) ?? 0) + count,
    );
  }
}
const workbookFunctionCounts = Object.fromEntries(
  [...workbookFunctionGroups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  ),
);

const contract = {
  schemaVersion: 1,
  source: {
    fileName: basename(inputPath),
    byteLength: source.byteLength,
    sha256: sha256(source),
  },
  workbook: {
    sheetCount: sheetContracts.length,
    formulaCellCount: sheetContracts.reduce(
      (total, sheet) => total + sheet.formulaCellCount,
      0,
    ),
    validationCount: sheetContracts.reduce(
      (total, sheet) => total + sheet.validationCount,
      0,
    ),
    chartCount: archiveEntries.filter((entry) =>
      /^xl\/charts\/chart\d+\.xml$/.test(entry),
    ).length,
    commentPartCount: archiveEntries.filter((entry) =>
      /^xl\/comments\d+\.xml$/.test(entry),
    ).length,
    cachedFormulaOracle: {
      recordCount: cachedFormulaRecords.length,
      sha256: sha256(goldenNdjson),
      valueTypes: cachedValueTypes,
    },
    seedOracle: {
      recordCount: seedRecords.length,
      sha256: sha256(seedNdjson),
    },
    formulaSourceOracle: {
      recordCount: formulaSourceRecords.length,
      sha256: sha256(formulaNdjson),
    },
    functionCounts: workbookFunctionCounts,
  },
  sheets: sheetContracts,
};

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(dirname(goldenPath), { recursive: true });
mkdirSync(dirname(seedPath), { recursive: true });
mkdirSync(dirname(formulaPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(contract, null, 2)}\n`);
writeFileSync(goldenPath, goldenNdjson);
writeFileSync(seedPath, seedNdjson);
writeFileSync(formulaPath, formulaNdjson);
console.log(
  JSON.stringify({
    outputPath,
    goldenPath,
    seedPath,
    formulaPath,
    source: contract.source,
    workbook: contract.workbook,
  }),
);
