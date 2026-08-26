# Fund Model Validation Logic

This document is the architectural contract for deciding whether a model run is safe to expose. It must be updated whenever calculation, validation, solver, output-locking, or workbook-parity behavior changes.

## Non-negotiable rule

A completed calculation is not automatically a valid calculation.

Results, charts, exports, and downstream sheet views may be marked **current** only when every critical gate passes. A run that reaches an iteration limit, contains an unsettled dependency component, violates a workbook check, or lacks required parity evidence is invalid and remains locked.

## Source authority

The supplied workbook's hash-verified cached values are the numerical oracle for the untouched scenario. The source workbook currently contains:

- 10 worksheets;
- 1,175,711 cached formula values;
- one source-circular component covering 67 formula families and 20,336 cells;
- 162 exposed inputs that cross that circular boundary;
- 7 independently recalculable inputs: `Fund Assumptions!D19` and `D29:D34`.

The `.xlsx` does not declare `iterate`, `iterateCount`, `iterateDelta`, or a calculation chain. Therefore, no undocumented Excel application setting may be treated as source truth.

## Run state machine

```text
INPUTS_EDITED
    |
    v
RESULTS_STALE
    |
    v
SCHEMA_AND_DOMAIN_VALIDATION
    | fail --------------------------> INVALID / DOWNSTREAM LOCKED
    v
DEPENDENCY_PLAN
    |
    +-- no approved circular path ---> SOURCE_CIRCULARITY_UNDEFINED / LOCKED
    v
DETERMINISTIC_CALCULATION
    | unsettled / limit reached -----> INVALID / DOWNSTREAM LOCKED
    v
CRITICAL_WORKBOOK_CHECKS
    | fail --------------------------> INVALID / DOWNSTREAM LOCKED
    v
PARITY_AND_TRACEABILITY_GATES
    | fail --------------------------> INVALID / DOWNSTREAM LOCKED
    v
VALID + CURRENT
    |
    +--> Results
    +--> Charts
    +--> Sheet Explorer
    +--> Audit
    +--> Export (when separately approved)
```

Any input change, including a property-count change, returns the state to `RESULTS_STALE` and invalidates all derived views.

## Validation layers

### 1. Request and input validation

Before calculation:

- require `application/json`;
- reject malformed or non-object request bodies;
- require all 169 source inputs and their expected identifiers;
- enforce value type, enum membership, units, bounds, date rules, and cross-field constraints;
- reject an invalid locked calculation date;
- reject scenario documents with an unsupported schema version, a different workbook hash, or an incomplete payload.

Input failures return a field-addressable validation response and must not invoke calculation.

### 2. Dependency validation

The engine builds the affected dependency plan from changed inputs, condenses formula families into strongly connected components, and calculates only the affected closure.

Cycle protection must:

- identify the exact component rather than report a generic engine error;
- distinguish acyclic work from genuinely mutually dependent cells;
- preserve family IDs, source regions, cell counts, and representative coordinates;
- prevent downstream values from being labeled current when the approved circular policy is absent or fails.

### 3. Calculation settlement

Every cyclic pass records:

- pass number;
- changed-cell count;
- maximum numeric delta;
- affected family and cell counts;
- representative unsettled cells;
- duration.

A cyclic component passes only if every value satisfies the approved stopping rule before the iteration limit. Reaching the iteration limit is a failure, not convergence.

Non-finite values, formula errors outside the approved source ledger, oscillation, divergence, or a changing active error set fail the run.

### 4. Workbook-native checks

At minimum, every current run must prove:

- workbook deal-count checks equal `Good` for all three strategy columns;
- annual total fund cash flow ties to its component rows within the approved currency tolerance;
- annual total capital deployed ties to LP, GP, and reinvestment components within the approved currency tolerance;
- no unapproved formula errors exist;
- the source-native `#REF!` exclusion ledger remains exactly scoped and does not grow;
- waterfall tiers, LP/GP allocations, fund-level totals, date roll-forwards, signs, units, and property counts remain internally consistent.

Checks are typed as `critical` or `info`. Every critical check must pass for `status: valid` and `current: true`.

### 5. Numerical parity

Parity has two separate gates:

1. **Frozen baseline parity** — the untouched web scenario must reproduce the source workbook's hash-verified cached values.
2. **Edited-scenario parity** — circular inputs remain locked until controlled desktop-Excel fixtures reproduce material outputs and checks under the same declared iteration policy.

Parity comparisons must declare coordinate, expected value, actual value, absolute delta, relative delta where meaningful, unit, and tolerance. Aggregate KPIs alone are insufficient; material intermediate schedules and waterfall flows must also be sampled.

## Approved circular-solver decision

The approved direction is a deterministic, versioned circular solver. The first candidate is **Excel-compatible iterative recalculation**, not a generic simultaneous equation solver.

Initial experimental policy:

| Parameter | Initial value |
| --- | ---: |
| Maximum iterations | 100 |
| Maximum change | 0.001 |
| Calculation order | Explicit, deterministic workbook/sheet/family/cell order |
| Limit reached | Fail |
| Non-finite result | Fail |
| Oscillation or divergence | Fail |

The 100 / 0.001 settings are Microsoft's documented Excel defaults and are an initial test policy, not proof of the workbook author's intent. The solver version and all parameters must be included in run diagnostics and scenario/export manifests.

The experimental solver may unlock the 162 circular inputs only after all of the following pass:

- deterministic repeatability across repeated runs;
- convergence before the limit for the baseline and controlled edits;
- frozen baseline parity;
- edited-scenario parity against desktop-Excel fixtures;
- all critical workbook checks;
- performance and request-budget gates;
- regression tests proving stale and failed runs remain locked.

If Excel-compatible iteration does not converge, an algebraic, Newton-style, or other simultaneous solver requires a separate versioned business-policy approval. Such a solver must be labeled a web-model economic policy and must not be represented as Excel behavior.

## API validity contract

The model-run API is authoritative for downstream availability:

```ts
current = criticalChecks.every((check) => check.status === 'pass')
status = current ? 'valid' : 'invalid'
```

A successful HTTP response does not imply a financially valid run. Responses must carry the model version, source mode, scenario ID, locked calculation time, changed-input count, affected graph size, solver policy/version, diagnostics, checks, outputs, and chart data. Invalid runs must not expose stale outputs as current.

## Audit and traceability

Every exposed value must be traceable to:

- source workbook hash and model version;
- scenario ID and exact validated inputs;
- source coordinate and formula family;
- dependency precedents;
- calculation timestamp derived from the locked date;
- solver policy and convergence diagnostics;
- validation/check results;
- cached-baseline, recalculated-scenario, or blocked provenance.

The Sheet Explorer defaults to annual columns and parent rows. Monthly columns, child rows, source row numbers, coordinates, formulas, and precedents are progressive disclosures; hiding them visually must never remove their audit provenance.

## Test obligations

Changes to validation or calculation require tests for the affected behavior and, where applicable:

- valid default workflow;
- malformed request and invalid field handling;
- trusted input recalculation;
- circular-input blocking or approved convergence;
- stale-result locking after every input class;
- non-convergence and iteration-limit failure;
- critical-check failure;
- deterministic repeatability;
- baseline and edited-fixture parity;
- Explorer/Audit scenario provenance;
- iPhone 12 mini (`375x812`) and desktop (`1440x900`) screenshots for user-visible milestones.

## Change control

Any change to the following is a model-policy change and requires a version bump, test evidence, and explicit review:

- solver algorithm, order, maximum iterations, or tolerance;
- workbook hash or generated formula families;
- validation bounds or cross-field rules;
- critical check definitions or tolerances;
- approved error ledger;
- output coordinates, chart series, or waterfall logic;
- rules that mark results current, stale, valid, or locked.

## Implementation map

- `demo/src/lib/fund-engine/model-contract.ts` — input classification and recalculation trust boundary.
- `demo/src/lib/fund-engine/formula-dependencies.ts` — dependency graph and strongly connected components.
- `demo/src/lib/fund-engine/scenario-runtime.ts` — affected plan and circular-boundary enforcement.
- `demo/src/lib/fund-engine/workbook-runtime.ts` — component execution and pass diagnostics.
- `demo/src/lib/fund-engine/source-snapshot.ts` — exact cached-baseline execution path.
- `demo/src/lib/fund-engine/source-snapshot-manifest.ts` — locked source-cycle closure and contradiction ledger.
- `demo/src/app/api/model/run/route.ts` — API validation, checks, validity, diagnostics, and output gating.
- `demo/src/lib/fund-engine/input-circularity.test.ts` — exhaustive 162/7 input classification proof.
- `demo/src/lib/fund-engine/source-cycle.test.ts` — 67-family / 20,336-cell source-cycle contract.

## Supporting evidence

- `RESEARCH/REAL_ESTATE_FUND_SOURCE_CIRCULARITY.md` in the Buzz workspace documents the source loop and measured failed experiments.
- [Microsoft: Change formula recalculation, iteration, or precision in Excel](https://support.microsoft.com/en-us/office/change-formula-recalculation-iteration-or-precision-in-excel-73f7c1fb-e4b8-4d07-9d72-4aef2d7d60c6)
- [Microsoft: Excel performance guidance for circular references](https://learn.microsoft.com/en-us/office/vba/excel/concepts/excel-performance/excel-tips-for-optimizing-performance-obstructions)

