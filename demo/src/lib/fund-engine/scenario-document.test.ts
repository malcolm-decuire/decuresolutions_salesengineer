import { describe, expect, it } from 'vitest'

import { MODEL_INPUT_FIELDS } from './model-contract'
import { createScenarioDocument, parseScenarioDocument } from './scenario-document'

const defaults = Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, String(field.defaultValue)]))

describe('scenario document', () => {
  it('round trips every workbook input with deterministic metadata', () => {
    const document = createScenarioDocument(defaults, '2026-08-23T20:00:00.000Z')
    expect(parseScenarioDocument(JSON.stringify(document))).toEqual(document)
    expect(Object.keys(document.inputs)).toHaveLength(169)
  })

  it('rejects files from a different workbook source', () => {
    const document = createScenarioDocument(defaults)
    expect(() => parseScenarioDocument(JSON.stringify({ ...document, sourceSha256: '0'.repeat(64) }))).toThrow('different workbook source')
  })

  it('rejects incomplete input payloads', () => {
    const document = createScenarioDocument(defaults)
    expect(() => parseScenarioDocument(JSON.stringify({ ...document, inputs: {} }))).toThrow('missing or invalid')
  })
})
