export type SheetId = string & { readonly __brand: 'SheetId' }
export type FamilyId = string & { readonly __brand: 'FamilyId' }
export type ScenarioId = string & { readonly __brand: 'ScenarioId' }

export type CellAddress = Readonly<{
  sheet: SheetId
  row: number
  column: number
}>

export type CellErrorCode = '#DIV/0!' | '#N/A' | '#NAME?' | '#NUM!' | '#REF!' | '#VALUE!'

export type CellValue =
  | Readonly<{ type: 'blank' }>
  | Readonly<{ type: 'boolean'; value: boolean }>
  | Readonly<{ type: 'date'; serial: number }>
  | Readonly<{ type: 'error'; code: CellErrorCode; detail?: string }>
  | Readonly<{ type: 'number'; value: number }>
  | Readonly<{ type: 'string'; value: string }>

export type InputValue = boolean | number | string | null

export type ModelInput = Readonly<{
  address: CellAddress
  value: InputValue
}>

export type ModelScenario = Readonly<{
  id: ScenarioId
  lockedDate?: string
  inputs: readonly ModelInput[]
}>

export type CellProvenance = Readonly<{
  address: CellAddress
  familyId: FamilyId
  formulaTemplate?: string
  precedents: readonly CellAddress[]
}>

export type CheckSeverity = 'critical' | 'error' | 'warning' | 'info'

export type ModelCheck = Readonly<{
  id: string
  label: string
  severity: CheckSeverity
  status: 'pass' | 'fail' | 'not-run'
  actual?: CellValue
  expected?: CellValue
  difference?: number
  tolerance?: number
  source?: CellAddress
  message?: string
}>

export type EngineTiming = Readonly<{
  phase: string
  durationMs: number
}>

export type EngineRunResult = Readonly<{
  scenarioId: ScenarioId
  modelVersion: string
  status: 'valid' | 'invalid'
  checks: readonly ModelCheck[]
  timings: readonly EngineTiming[]
  calculatedAt: string
}>

export const sheetId = (value: string): SheetId => value as SheetId
export const familyId = (value: string): FamilyId => value as FamilyId
export const scenarioId = (value: string): ScenarioId => value as ScenarioId

export const BLANK: CellValue = Object.freeze({ type: 'blank' })

