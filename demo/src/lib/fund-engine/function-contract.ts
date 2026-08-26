export const WORKBOOK_FUNCTION_COUNTS = {
  AND: 1_623,
  ARRAY_CONSTRAIN: 48,
  ARRAYFORMULA: 48,
  AVERAGE: 1,
  COUNTIFS: 186,
  DATE: 6,
  DATEDIF: 540,
  EDATE: 732,
  EOMONTH: 734,
  'FORECAST.LINEAR': 900,
  FV: 3,
  IF: 122_610,
  IFERROR: 1_715,
  INDEX: 1_143,
  MATCH: 2_286,
  MAX: 1_625,
  MAXIFS: 70,
  MIN: 2_880,
  MINIFS: 3,
  MONTH: 1_441,
  OR: 546,
  PMT: 3,
  ROUND: 12,
  ROUNDDOWN: 6,
  SUM: 1_444,
  SUMIFS: 220_528,
  SUMPRODUCT: 1_620,
  TEXT: 5,
  TODAY: 2,
  VLOOKUP: 2,
  WEEKNUM: 4,
  XIRR: 3,
  YEAR: 673,
} as const

export type WorkbookFunctionName = keyof typeof WORKBOOK_FUNCTION_COUNTS

export const WORKBOOK_FUNCTIONS = Object.freeze(
  Object.keys(WORKBOOK_FUNCTION_COUNTS).sort(),
) as readonly WorkbookFunctionName[]

export const IMPLEMENTED_WORKBOOK_FUNCTIONS = Object.freeze([
  'AND',
  'ARRAYFORMULA',
  'ARRAY_CONSTRAIN',
  'AVERAGE',
  'COUNTIFS',
  'DATE',
  'DATEDIF',
  'EDATE',
  'EOMONTH',
  'FORECAST.LINEAR',
  'FV',
  'IF',
  'IFERROR',
  'INDEX',
  'MATCH',
  'MAX',
  'MAXIFS',
  'MIN',
  'MINIFS',
  'MONTH',
  'OR',
  'PMT',
  'ROUND',
  'ROUNDDOWN',
  'SUM',
  'SUMIFS',
  'SUMPRODUCT',
  'TEXT',
  'TODAY',
  'VLOOKUP',
  'WEEKNUM',
  'XIRR',
  'YEAR',
] satisfies readonly WorkbookFunctionName[])

export type FunctionCoverage = Readonly<{
  required: readonly WorkbookFunctionName[]
  implemented: readonly WorkbookFunctionName[]
  missing: readonly WorkbookFunctionName[]
  complete: boolean
}>

export const workbookFunctionCoverage = (): FunctionCoverage => {
  const implemented = new Set<WorkbookFunctionName>(IMPLEMENTED_WORKBOOK_FUNCTIONS)
  const missing = WORKBOOK_FUNCTIONS.filter((name) => !implemented.has(name))
  return {
    required: WORKBOOK_FUNCTIONS,
    implemented: IMPLEMENTED_WORKBOOK_FUNCTIONS,
    missing,
    complete: missing.length === 0,
  }
}
