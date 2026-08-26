import { createHash } from "node:crypto";
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const [contractArgument, goldenArgument, outputArgument] = process.argv.slice(2);

if (!contractArgument || !goldenArgument || !outputArgument) {
  console.error(
    "Usage: node scripts/compile-formula-regions.mjs <contract.json> <golden.ndjson> <output.json>",
  );
  process.exit(1);
}

const contractPath = resolve(contractArgument);
const goldenPath = resolve(goldenArgument);
const outputPath = resolve(outputArgument);
const contract = JSON.parse(readFileSync(contractPath, "utf8"));

const columnNumber = (letters) =>
  [...letters].reduce(
    (total, character) => total * 26 + character.charCodeAt(0) - 64,
    0,
  );

const parseAddress = (address) => {
  const match = /^([A-Z]+)(\d+)$/.exec(address);
  if (!match) throw new Error(`Unsupported cell address: ${address}`);
  return { row: Number(match[2]), column: columnNumber(match[1]) };
};

const pointsByFamily = new Map();
let formulaCellCount = 0;
const lines = createInterface({
  input: createReadStream(goldenPath, { encoding: "utf8" }),
  crlfDelay: Infinity,
});

for await (const line of lines) {
  if (!line) continue;
  const record = JSON.parse(line);
  const key = `${record.sheet}\u0000${record.formulaFamilyDigest}`;
  const family = pointsByFamily.get(key) ?? new Map();
  const { row, column } = parseAddress(record.address);
  const columns = family.get(row) ?? [];
  columns.push(column);
  family.set(row, columns);
  pointsByFamily.set(key, family);
  formulaCellCount += 1;
}

const templates = new Map(
  contract.sheets.flatMap((sheet) =>
    sheet.formulaFamilies.map((family) => [
      `${sheet.name}\u0000${family.digest}`,
      {
        sheet: sheet.name,
        digest: family.digest,
        normalizedTemplate: family.normalizedTemplate,
        exampleAddress: family.exampleAddress,
        exampleFormula: family.exampleFormula,
        expectedCellCount: family.count,
      },
    ]),
  ),
);

const regionsForRows = (rows) => {
  const open = new Map();
  const regions = [];
  for (const row of [...rows.keys()].sort((left, right) => left - right)) {
    const columns = [...new Set(rows.get(row))].sort((left, right) => left - right);
    const spans = [];
    for (const column of columns) {
      const current = spans.at(-1);
      if (current && column === current.endColumn + 1) current.endColumn = column;
      else spans.push({ startColumn: column, endColumn: column });
    }

    const seen = new Set();
    for (const span of spans) {
      const key = `${span.startColumn}:${span.endColumn}`;
      seen.add(key);
      const existing = open.get(key);
      if (existing && existing.endRow === row - 1) existing.endRow = row;
      else {
        const region = { startRow: row, endRow: row, ...span };
        regions.push(region);
        open.set(key, region);
      }
    }
    for (const key of open.keys()) {
      if (!seen.has(key)) open.delete(key);
    }
  }
  return regions;
};

const families = [...pointsByFamily.entries()]
  .map(([key, rows]) => {
    const template = templates.get(key);
    if (!template) throw new Error(`Missing family template for ${key}`);
    const regions = regionsForRows(rows);
    const compiledCellCount = regions.reduce(
      (total, region) =>
        total +
        (region.endRow - region.startRow + 1) *
          (region.endColumn - region.startColumn + 1),
      0,
    );
    if (compiledCellCount !== template.expectedCellCount) {
      throw new Error(
        `Family ${key} covers ${compiledCellCount}, expected ${template.expectedCellCount}`,
      );
    }
    return { ...template, compiledCellCount, regions };
  })
  .sort(
    (left, right) =>
      left.sheet.localeCompare(right.sheet) || left.digest.localeCompare(right.digest),
  );

const compiledCellCount = families.reduce(
  (total, family) => total + family.compiledCellCount,
  0,
);
if (compiledCellCount !== formulaCellCount) {
  throw new Error(
    `Compiled regions cover ${compiledCellCount}, expected ${formulaCellCount}`,
  );
}

const artifact = {
  schemaVersion: 1,
  sourceContractSha256: createHash("sha256")
    .update(readFileSync(contractPath))
    .digest("hex"),
  formulaCellCount,
  familyCount: families.length,
  regionCount: families.reduce((total, family) => total + family.regions.length, 0),
  families,
};
const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serialized);
console.log(
  JSON.stringify({
    outputPath,
    formulaCellCount: artifact.formulaCellCount,
    familyCount: artifact.familyCount,
    regionCount: artifact.regionCount,
    sha256: createHash("sha256").update(serialized).digest("hex"),
  }),
);
