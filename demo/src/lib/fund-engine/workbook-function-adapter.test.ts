import { describe, expect, it } from 'vitest'
import { callWorkbookFunction } from './workbook-function-adapter'

const numbers = (...values: number[]) => [values.map((value) => ({ type: 'number' as const, value }))]

describe('AST workbook function adapter', () => {
  it('preserves aligned ranges for conditional aggregates', () => {
    expect(callWorkbookFunction('SUMIFS', [numbers(10, 20, 30), numbers(1, 2, 2), { type: 'string', value: '>=2' }])).toEqual({ type: 'number', value: 50 })
    expect(callWorkbookFunction('COUNTIFS', [numbers(1, 2, 2), { type: 'number', value: 2 }])).toEqual({ type: 'number', value: 2 })
  })

  it('preserves matrix shape for INDEX and VLOOKUP', () => {
    const table = [[{ type: 'string' as const, value: 'A' }, { type: 'number' as const, value: 7 }], [{ type: 'string' as const, value: 'B' }, { type: 'number' as const, value: 9 }]]
    expect(callWorkbookFunction('INDEX', [table, { type: 'number', value: 2 }, { type: 'number', value: 2 }])).toEqual({ type: 'number', value: 9 })
    expect(callWorkbookFunction('VLOOKUP', [{ type: 'string', value: 'b' }, table, { type: 'number', value: 2 }, { type: 'boolean', value: false }])).toEqual({ type: 'number', value: 9 })
  })

  it('propagates typed input errors before function execution', () => {
    expect(callWorkbookFunction('SUM', [numbers(1, 2), { type: 'error', code: '#REF!' }])).toEqual({ type: 'error', code: '#REF!' })
  })

  it('adapts deterministic date, logical, text, and rounding functions', () => {
    const now = new Date('2025-04-15T18:00:00Z')
    expect(callWorkbookFunction('TODAY', [], now)).toEqual({ type: 'number', value: 45762 })
    expect(callWorkbookFunction('AND', [{ type: 'boolean', value: true }, numbers(1, 2)])).toEqual({ type: 'boolean', value: true })
    expect(callWorkbookFunction('ROUND', [{ type: 'number', value: 1.235 }, { type: 'number', value: 2 }])).toEqual({ type: 'number', value: 1.24 })
    expect(callWorkbookFunction('TEXT', [{ type: 'number', value: 45762 }, { type: 'string', value: 'dddd' }])).toEqual({ type: 'string', value: 'Tuesday' })
  })

  it('adapts finance and vector forecast arguments', () => {
    expect(callWorkbookFunction('PMT', [{ type: 'number', value: 0 }, { type: 'number', value: 10 }, { type: 'number', value: 100 }])).toEqual({ type: 'number', value: -10 })
    expect(callWorkbookFunction('FORECAST.LINEAR', [{ type: 'number', value: 4 }, numbers(2, 4, 6), numbers(1, 2, 3)])).toEqual({ type: 'number', value: 8 })
  })
})
