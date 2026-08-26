import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Region = {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
};

type Family = {
  compiledCellCount: number;
  expectedCellCount: number;
  regions: Region[];
};

type RegionArtifact = {
  formulaCellCount: number;
  familyCount: number;
  regionCount: number;
  families: Family[];
};

const artifactPath = new URL(
  "./generated/workbook-formula-regions.json",
  import.meta.url,
);
const source = readFileSync(artifactPath);
const artifact = JSON.parse(source.toString("utf8")) as RegionArtifact;

describe("compiled workbook formula regions", () => {
  it("is the deterministic source artifact", () => {
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "d3c4fd06792e52eb1ff5373af280c9e4c46b2da4e20275cfbec99d6ab651e8f9",
    );
    expect(artifact.familyCount).toBe(823);
    expect(artifact.regionCount).toBe(1_015);
  });

  it("covers every formula cell exactly by family area", () => {
    const regionArea = (region: Region) =>
      (region.endRow - region.startRow + 1) *
      (region.endColumn - region.startColumn + 1);

    for (const family of artifact.families) {
      const area = family.regions.reduce(
        (total, region) => total + regionArea(region),
        0,
      );
      expect(area).toBe(family.expectedCellCount);
      expect(family.compiledCellCount).toBe(family.expectedCellCount);
    }

    expect(
      artifact.families.reduce(
        (total, family) => total + family.compiledCellCount,
        0,
      ),
    ).toBe(1_175_711);
    expect(artifact.formulaCellCount).toBe(1_175_711);
  });
});
