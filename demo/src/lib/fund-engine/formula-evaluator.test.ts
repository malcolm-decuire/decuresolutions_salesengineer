import { describe, expect, it, vi } from 'vitest'
import { evaluateFormula } from './formula-evaluator'
import { parseFormula } from './formula-parser'
import { TypedModelGrid } from './grid'
import { sheetId, type CellAddress } from './types'

const sheet = sheetId('Sheet1')
const address = (row: number, column: number): CellAddress => ({ sheet, row, column })

describe('formula AST evaluator', () => {
  it('shifts relative references while preserving absolute anchors', () => {
    const grid = new TypedModelGrid([{ id: sheet, rows: 10, columns: 10 }])
    grid.set(address(4, 4), { type: 'number', value: 7 })
    grid.set(address(1, 1), { type: 'number', value: 11 })
    const result = evaluateFormula(parseFormula('A1+$A$1'), {
      grid,
      templateOrigin: address(2, 2),
      origin: address(5, 5),
      now: new Date('2025-01-01T00:00:00Z'),
      callFunction: vi.fn(),
    })
    expect(result).toEqual({ type: 'number', value: 18 })
  })

  it('short-circuits IF branches', () => {
    const callFunction = vi.fn()
    const result = evaluateFormula(parseFormula('IF(TRUE,42,UNSUPPORTED())'), {
      grid: new TypedModelGrid([{ id: sheet, rows: 1, columns: 1 }]),
      origin: address(1, 1),
      now: new Date('2025-01-01T00:00:00Z'),
      callFunction,
    })
    expect(result).toEqual({ type: 'number', value: 42 })
    expect(callFunction).not.toHaveBeenCalled()
  })

  it('propagates Excel arithmetic errors', () => {
    const result = evaluateFormula(parseFormula('10/0'), {
      grid: new TypedModelGrid([{ id: sheet, rows: 1, columns: 1 }]),
      origin: address(1, 1),
      now: new Date('2025-01-01T00:00:00Z'),
      callFunction: vi.fn(),
    })
    expect(result).toEqual({ type: 'error', code: '#DIV/0!' })
  })

  it('does not equate numeric zero with a formula-produced empty string', () => {
    const result = evaluateFormula(parseFormula('0=""'), {
      grid: new TypedModelGrid([{ id: sheet, rows: 1, columns: 1 }]),
      origin: address(1, 1),
      now: new Date('2025-01-01T00:00:00Z'),
      callFunction: vi.fn(),
    })
    expect(result).toEqual({ type: 'boolean', value: false })
  })
})
