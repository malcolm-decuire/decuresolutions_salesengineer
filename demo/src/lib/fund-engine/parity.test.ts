import { describe, expect, it } from 'vitest'

import { TypedModelGrid } from './grid'
import type { GoldenCell } from './manifest'
import { compareGoldenCells } from './parity'
import { sheetId, type CellAddress } from './types'

const sheet = sheetId('test')
const address = (row: number): CellAddress => ({ sheet, row, column: 1 })

describe('golden-cell parity', () => {
  it('uses tolerances for numbers and exact semantics for other cell values', () => {
    const grid = new TypedModelGrid([{ id: sheet, rows: 6, columns: 1 }])
    grid.set(address(1), { type: 'number', value: 100.00001 })
    grid.set(address(2), { type: 'string', value: '' })
    grid.set(address(3), { type: 'boolean', value: true })
    grid.set(address(4), { type: 'error', code: '#REF!', detail: 'actual detail does not affect Excel error identity' })
    grid.set(address(5), { type: 'date', serial: 45_658 })

    const golden: GoldenCell[] = [
      { address: address(1), expected: { type: 'number', value: 100 }, relativeTolerance: 0.000001 },
      { address: address(2), expected: { type: 'string', value: '' } },
      { address: address(3), expected: { type: 'boolean', value: true } },
      { address: address(4), expected: { type: 'error', code: '#REF!' } },
      { address: address(5), expected: { type: 'date', serial: 45_658 } },
      { address: address(6), expected: { type: 'blank' } },
    ]

    expect(compareGoldenCells(grid, golden)).toMatchObject({
      status: 'pass',
      compared: 6,
      matched: 6,
      excluded: 0,
      mismatchCount: 0,
    })
  })

  it('reports type mismatches, honors exclusions, and caps retained details', () => {
    const grid = new TypedModelGrid([{ id: sheet, rows: 3, columns: 1 }])
    grid.set(address(1), { type: 'number', value: 1 })
    grid.set(address(2), { type: 'number', value: 2 })
    grid.set(address(3), { type: 'string', value: '' })

    const report = compareGoldenCells(
      grid,
      [
        { address: address(1), expected: { type: 'number', value: 9 } },
        { address: address(2), expected: { type: 'number', value: 9 } },
        { address: address(3), expected: { type: 'blank' } },
      ],
      [{ address: address(2), reason: 'approved dead cell' }],
      { maxMismatches: 1 },
    )

    expect(report).toMatchObject({
      status: 'fail',
      compared: 2,
      matched: 0,
      excluded: 1,
      mismatchCount: 2,
      truncated: true,
    })
    expect(report.mismatches).toHaveLength(1)
    expect(report.mismatches[0].difference).toBe(8)
  })
})
