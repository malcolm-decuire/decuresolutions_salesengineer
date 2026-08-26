# Integration notes

## Portfolio entry point

The homepage Investment Expertise collection includes an `Investment Fund Model` card. Its CTA routes to `/fund-model`, the dedicated location for the assumptions-first model wizard.

The route contract is:

1. Fund Assumptions
2. Validate Inputs
3. Calculate Full Model
4. Charts & Results
5. Sheet Explorer

The `/fund-model` route is not part of this calculation-engine skeleton milestone. It must not expose charts or workbook outputs until the scenario has passed validation, calculation, and institutional checks.

## Verification at packaging

- `npx tsc --noEmit -p demo/tsconfig.json`: passed
- `npx eslint src/lib/fund-engine src/app/page.tsx` from `demo/`: passed
- `npm run build`: passed with Next.js 16.2.10
- Repository-wide lint still contains pre-existing failures outside this skeleton's files; those are not hidden by the targeted clean result.

## Artifact scope

The package contains the framework-independent TypeScript engine skeleton, its public documentation, the updated homepage card definition, and the source audit/build plan. It is architecture scaffolding, not a claim of workbook formula parity. Formula extraction, compiled family implementations, golden-cell parity, wizard UI, and full scenario coverage remain gated implementation phases.
