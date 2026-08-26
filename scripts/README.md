# Workbook contract extraction

Run the deterministic, read-only extractor against the supplied workbook:

```bash
npm run extract:model -- /absolute/path/to/model.xlsx .scratch/workbook-contract.json .scratch/workbook-golden.ndjson .scratch/workbook-seed.ndjson .scratch/workbook-formulas.ndjson
```

The compact JSON records the source hash, sheet order/visibility/dimensions, formula-cell and shared-formula counts, normalized formula-family hashes with examples, workbook function usage, exact validation rules, merged ranges, charts, comment parts, and payload digests. Deterministic NDJSON sidecars preserve every formula cell's cached typed value, every non-formula seed value (including shared strings), and every raw scalar/shared/array formula anchor. The sidecars can be hundreds of megabytes for an institutional model, so the original workbook and generated artifacts remain untracked until the acceptance oracle and exclusion ledger are approved.

The extractor intentionally shells out only to the standard `unzip` executable and does not recalculate or rewrite the workbook. Cached cell values remain untouched as the parity oracle.

Compile the extracted seed values and validations into the TypeScript engine:

```bash
npm run compile:model-seed -- .scratch/workbook-seed.ndjson .scratch/workbook-contract.json demo/src/lib/fund-engine/generated/workbook-seed.ts
```

Compile reference-aware formula families into deterministic rectangular execution
regions. The compiler rejects any artifact whose rectangle areas do not account
for every source formula cell exactly once:

```bash
npm run compile:model-regions -- .scratch/workbook-contract.json .scratch/workbook-golden.ndjson demo/src/lib/fund-engine/generated/workbook-formula-regions.json
```

Audit whether cached direct-reference formulas agree with the cells they
reference. This is a separate source-coherence gate from calculated parity:

```bash
npm run audit:model-cache -- .scratch/workbook-formulas.ndjson .scratch/workbook-golden.ndjson
```

Compile the approved circular/stale-cache family boundary into the compact
source-snapshot artifact used by the runtime. Generate the family-key manifest
with the gated Vitest diagnostic first, then compile its cached values:

```bash
SOURCE_SNAPSHOT_KEYS_PATH=.scratch/source-snapshot-family-keys.json npm test -- formula-dependencies.test.ts
npm run compile:model-snapshot -- .scratch/source-snapshot-family-keys.json .scratch/workbook-golden.ndjson demo/src/lib/fund-engine/generated/source-snapshot.json
```
