import { NextResponse } from 'next/server'

import { MODEL_INPUT_FIELDS, WORKBOOK_FUNCTION_COUNTS, WORKBOOK_SHEETS, workbookFunctionCoverage } from '@/lib/fund-engine'

export const runtime = 'nodejs'

export function GET() {
  const functionCoverage = workbookFunctionCoverage()
  return NextResponse.json(
    {
      schemaVersion: 1,
      status: 'compiled-source-snapshot',
      financialOutputsAvailable: true,
      assumptions: {
        source: 'workbook-derived-cell-contract',
        fields: MODEL_INPUT_FIELDS,
        recalculation: { trustedFields: 7, sourceCircularityBlockedFields: 162 },
        documentedInputRegions: [
          { sheet: 'Fund Assumptions', range: 'E3:E16', role: 'primary fund assumptions' },
          {
            sheet: 'Fund Assumptions',
            range: 'C19:C34',
            role: 'fund structure and waterfall region; includes output-linked cells requiring extraction classification',
          },
          { sheet: 'Fund Assumptions', range: 'G:J', role: 'three-strategy assumption columns' },
          { sheet: 'Fund Assumptions', range: 'L2:P21', role: 'seasonal rates and occupancy tables' },
        ],
      },
      sheets: WORKBOOK_SHEETS.map(({ id, name, order, hidden, role, rows, columns }) => ({
        id,
        name,
        order,
        hidden,
        role,
        dimensions: { rows, columns },
      })),
      functionContract: {
        sourceFormulaCells: 1_175_711,
        required: functionCoverage.required,
        implemented: functionCoverage.implemented,
        missing: functionCoverage.missing,
        complete: functionCoverage.complete,
        anchorOccurrences: WORKBOOK_FUNCTION_COUNTS,
      },
      gates: ['assumptions', 'validate', 'calculate', 'results', 'explorer', 'audit'],
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
      },
    },
  )
}
