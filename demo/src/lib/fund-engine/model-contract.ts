import { sheetId, type CellAddress, type InputValue, type ModelInput } from './types'
import { GENERATED_MODEL_INPUT_FIELDS } from './generated/model-inputs'

export type ModelInputField = Readonly<{
  id: string
  label: string
  group: 'fund' | 'fees' | 'capital' | 'waterfall' | 'strategy' | 'seasonality'
  address: CellAddress
  valueType: 'number' | 'enum'
  defaultValue: InputValue
  unit?: string
  minimum?: number
  maximum?: number
  integer?: boolean
  options?: readonly string[]
  recalculation: 'trusted' | 'source-circularity-blocked'
}>

export const TRUSTED_RECALCULATION_INPUT_IDS = Object.freeze([
  'fundAssumptions_d19',
  'fundAssumptions_d29',
  'fundAssumptions_d30',
  'fundAssumptions_d31',
  'fundAssumptions_d32',
  'fundAssumptions_d33',
  'fundAssumptions_d34',
] as const)
const trustedRecalculationIds = new Set<string>(TRUSTED_RECALCULATION_INPUT_IDS)

const assumptions = sheetId('fund-assumptions')
type GeneratedField = Readonly<{
  id: string
  label: string
  group: ModelInputField['group']
  row: number
  column: number
  valueType: 'number' | 'enum'
  defaultValue: number | string
  unit?: string
  minimum?: number
  maximum?: number
  integer?: boolean
  options?: readonly string[]
}>

export const MODEL_INPUT_FIELDS: readonly ModelInputField[] = Object.freeze(
  (GENERATED_MODEL_INPUT_FIELDS as readonly GeneratedField[]).map((field) => ({
    ...field,
    address: { sheet: assumptions, row: field.row, column: field.column },
    recalculation: trustedRecalculationIds.has(field.id) ? 'trusted' as const : 'source-circularity-blocked' as const,
  })),
)

export type ModelInputIssue = Readonly<{ field: string; code: string; message: string }>

export const parseModelInputs = (raw: unknown): Readonly<{ inputs: readonly ModelInput[]; issues: readonly ModelInputIssue[] }> => {
  if (raw === undefined) return { inputs: [], issues: [] }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { inputs: [], issues: [{ field: 'inputs', code: 'INVALID_TYPE', message: 'inputs must be an object keyed by model field id.' }] }
  }
  const values = raw as Record<string, unknown>
  const byId = new Map(MODEL_INPUT_FIELDS.map((field_) => [field_.id, field_]))
  const inputs: ModelInput[] = []
  const issues: ModelInputIssue[] = []
  for (const id of Object.keys(values)) {
    const definition = byId.get(id)
    if (!definition) {
      issues.push({ field: id, code: 'UNKNOWN_FIELD', message: `Unknown model input ${id}.` })
      continue
    }
    const value = values[id]
    if (definition.valueType === 'enum') {
      if (typeof value !== 'string' || !definition.options?.includes(value)) {
        issues.push({ field: id, code: 'INVALID_OPTION', message: `${definition.label} must be one of ${definition.options?.join(', ')}.` })
        continue
      }
      inputs.push({ address: definition.address, value })
      continue
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      issues.push({ field: id, code: 'INVALID_NUMBER', message: `${definition.label} must be a finite number.` })
      continue
    }
    if (definition.integer && !Number.isInteger(value)) issues.push({ field: id, code: 'NOT_INTEGER', message: `${definition.label} must be a whole number.` })
    else if (definition.minimum !== undefined && value < definition.minimum) issues.push({ field: id, code: 'BELOW_MINIMUM', message: `${definition.label} must be at least ${definition.minimum}.` })
    else if (definition.maximum !== undefined && value > definition.maximum) issues.push({ field: id, code: 'ABOVE_MAXIMUM', message: `${definition.label} must be at most ${definition.maximum}.` })
    else inputs.push({ address: definition.address, value })
  }
  return { inputs, issues }
}
