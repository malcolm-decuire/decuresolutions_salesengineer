# Enterprise fund-model engine skeleton

This package is the framework-independent calculation boundary for the workbook port. It is deliberately separate from React, Next.js route handlers, and presentation state so the same deterministic engine can run in tests, CI, a Vercel Node function, or a future worker process.

## Public contract

`FundModelEngine.run(scenario)` creates a fresh grid, seeds workbook constants/cached inputs, applies validated scenario inputs, evaluates registered formula families in topological order, runs institutional checks, and returns immutable status/timing metadata. Output projection and cell-level audit readers are the next adapters to build; they should consume the calculated grid without mutating it.

## Module boundaries

| Module | Responsibility |
|---|---|
| `types.ts` | Branded identifiers, exact cell union, scenarios, provenance, checks, run results |
| `grid.ts` | Dense numeric storage plus sparse typed values; strict one-based bounds |
| `manifest.ts` | Versioned workbook/sheet/family/golden/exclusion contract |
| `functions/registry.ts` | Explicit, replaceable Google-Sheets-compatible function implementations |
| `families.ts` | Vectorized calculation-family plugin contract and duplicate protection |
| `solver.ts` | Dependency validation, Kahn ordering, missing-dependency and cycle failures |
| `checks.ts` | Independently registered financial and structural assertions |
| `engine.ts` | Deterministic orchestration, date locking, phase timing, final validity |

## Required next implementation layers

1. **Extractor:** reproducibly convert the workbook into a signed manifest, constants, input schema, family templates, golden cells, chart mappings, outline groups, validations, comments, and the explicit 48-cell exclusion ledger.
2. **Reference/date/function libraries:** implement and independently test A1/range semantics, whole-row references, blank versus `""`, date serials, and the full pinned function inventory.
3. **Compiled families:** register typed, vectorized implementations for Static, three deal engines, Aggregate Fund Cash Flows, Investor Cash Flows/waterfall, Annual Roll Up, P&L, Charts, and Fund Assumption outputs.
4. **Parity adapter:** compare every calculated cell to the oracle with exact type rules and numeric tolerances; fail closed on unapproved exclusions.
5. **Projection adapter:** map engine cells to annual-first/expandable monthly sheet views without altering calculation state.
6. **Audit adapter:** expose source cell, formula template, precedents, family, units, model version, and checks to authorized users.

## Enterprise invariants

- One engine run owns one grid; there is no cross-request mutable calculation state.
- Every sheet and family is declared in a source-hashed, versioned manifest.
- Unknown sheets, out-of-bounds cells, duplicate families, missing dependencies, graph cycles, non-finite numbers, invalid locked dates, and unsupported functions fail explicitly.
- A scenario edit produces a new run. UI results remain stale until that run returns valid checks.
- Formula errors are typed cell values, never JavaScript `NaN` or thrown control flow.
- Hidden sheets are calculation layers, not omitted layers.
- Presentation collapsing is metadata only. It cannot change calculations or parity coverage.
- Production publication is gated on golden parity, scenario tests, financial checks, performance, and deterministic screenshots.

## Open-source quality gates

- Strict TypeScript and lint with no framework imports in this package.
- Unit/property tests for grids, references, dates, formulas, solver, checks, and edge cases.
- Golden and metamorphic scenario tests, including deterministic locked dates.
- Reproducible artifact hashes and model semantic versioning.
- Public API documentation, architectural decision records, contribution/security policies, SPDX-compatible licensing review, changelog, and benchmark reports.
- CI matrices across supported Node releases plus Vercel Preview integration tests.

