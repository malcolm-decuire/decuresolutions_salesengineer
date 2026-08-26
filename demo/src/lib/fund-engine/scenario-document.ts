import { WORKBOOK_SOURCE_SHA256 } from './generated/workbook-seed'
import { MODEL_INPUT_FIELDS } from './model-contract'

export const SCENARIO_DOCUMENT_VERSION = 1 as const
export const SCENARIO_STORAGE_KEY = 'decure-fund-model:scenario:v1'

export type ScenarioDocument = Readonly<{
  schemaVersion: typeof SCENARIO_DOCUMENT_VERSION
  modelVersion: '0.1.0'
  sourceSha256: typeof WORKBOOK_SOURCE_SHA256
  lockedDate: '2025-03-01'
  savedAt: string
  inputs: Readonly<Record<string, string>>
}>

export const createScenarioDocument = (inputs: Readonly<Record<string, string>>, savedAt = new Date().toISOString()): ScenarioDocument => ({
  schemaVersion: SCENARIO_DOCUMENT_VERSION,
  modelVersion: '0.1.0',
  sourceSha256: WORKBOOK_SOURCE_SHA256,
  lockedDate: '2025-03-01',
  savedAt,
  inputs: Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, inputs[field.id] ?? String(field.defaultValue)])),
})

export const parseScenarioDocument = (raw: string): ScenarioDocument => {
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object') throw new Error('Scenario file must contain a JSON object.')
  const document = value as Partial<ScenarioDocument>
  if (document.schemaVersion !== SCENARIO_DOCUMENT_VERSION) throw new Error('Unsupported scenario file version.')
  if (document.sourceSha256 !== WORKBOOK_SOURCE_SHA256) throw new Error('Scenario file belongs to a different workbook source.')
  if (!document.inputs || typeof document.inputs !== 'object') throw new Error('Scenario file has no inputs object.')

  const inputs: Record<string, string> = {}
  for (const field of MODEL_INPUT_FIELDS) {
    const input = document.inputs[field.id]
    if (typeof input !== 'string') throw new Error(`Scenario input ${field.id} is missing or invalid.`)
    inputs[field.id] = input
  }
  return createScenarioDocument(inputs, typeof document.savedAt === 'string' ? document.savedAt : new Date().toISOString())
}
