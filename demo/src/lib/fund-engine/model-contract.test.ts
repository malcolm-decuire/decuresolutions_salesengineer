import { describe, expect, it } from 'vitest'
import { MODEL_INPUT_FIELDS, parseModelInputs } from './model-contract'

describe('workbook input contract', () => {
  it('maps every published field to a unique source cell', () => {
    expect(MODEL_INPUT_FIELDS).toHaveLength(169)
    expect(new Set(MODEL_INPUT_FIELDS.map((field) => field.id)).size).toBe(MODEL_INPUT_FIELDS.length)
    expect(new Set(MODEL_INPUT_FIELDS.map((field) => `${field.address.sheet}:${field.address.row}:${field.address.column}`)).size).toBe(MODEL_INPUT_FIELDS.length)
  })

  it('covers every documented assumptions group and workbook validation', () => {
    expect(Object.fromEntries(['fund', 'fees', 'capital', 'waterfall', 'strategy', 'seasonality'].map((group) => [group, MODEL_INPUT_FIELDS.filter((field) => field.group === group).length]))).toEqual({
      fund: 2,
      fees: 7,
      capital: 6,
      waterfall: 12,
      strategy: 84,
      seasonality: 58,
    })
    expect(MODEL_INPUT_FIELDS.find((field) => field.id === 'fundTerm')).toMatchObject({ defaultValue: 15, maximum: 15, integer: true })
    expect(MODEL_INPUT_FIELDS.find((field) => field.id === 'distributionFrequency')).toMatchObject({ options: ['Monthly', 'Quarterly', 'Annually'] })
    expect(MODEL_INPUT_FIELDS.find((field) => field.address.row === 14 && field.address.column === 5)).toMatchObject({ options: ['Yes', 'No'] })
    expect(MODEL_INPUT_FIELDS.filter((field) => field.group === 'seasonality' && field.valueType === 'enum')).toHaveLength(48)
  })

  it('accepts workbook defaults and preserves typed values', () => {
    const parsed = parseModelInputs(Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, field.defaultValue])))
    expect(parsed.issues).toEqual([])
    expect(parsed.inputs).toHaveLength(MODEL_INPUT_FIELDS.length)
  })
})
