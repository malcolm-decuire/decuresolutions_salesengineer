import { describe, expect, it, vi } from 'vitest'

import { serialFromDate } from '../dates'
import type { CellValue } from '../types'
import { and, arrayConstrain, arrayFormula, date, ifError, ifValue, month, or, text, today, year } from './control'

describe('control and scalar workbook functions', () => {
  it('short-circuits IF branches', () => {
    const unused = vi.fn(() => 'wrong')
    expect(ifValue(true, () => 'right', unused)).toBe('right')
    expect(unused).not.toHaveBeenCalled()
  })

  it('catches thrown and typed cell errors with IFERROR', () => {
    expect(
      ifError(
        () => {
          throw new Error('bad')
        },
        () => 7,
      ),
    ).toBe(7)
    expect(
      ifError<CellValue>(
        () => ({ type: 'error', code: '#REF!' as const }),
        () => ({ type: 'number', value: 0 }),
      ),
    ).toEqual({
      type: 'number',
      value: 0,
    })
  })

  it('implements boolean and array wrappers without changing vector values', () => {
    expect(and([true, true])).toBe(true)
    expect(or([false, true])).toBe(true)
    expect(arrayFormula([1, 2])).toEqual([1, 2])
    expect(
      arrayConstrain(
        [
          [1, 2],
          [3, 4],
        ],
        1,
        1,
      ),
    ).toEqual([[1]])
  })

  it('uses serial dates and the source TEXT weekday format deterministically', () => {
    const serial = date(2026, 8, 22)
    expect(year(serial)).toBe(2026)
    expect(month(serial)).toBe(8)
    expect(text(serial, 'dddd')).toBe('Saturday')
    expect(today(new Date('2026-08-22T23:59:59Z'))).toBe(serialFromDate(new Date('2026-08-22T00:00:00Z')))
  })

  it('normalizes DATE month and day overflow like Excel', () => {
    expect(date(2035, -1, 1)).toBe(date(2034, 11, 1))
  })

  it('formats the workbook month-name TEXT pattern', () => {
    expect(text(date(2025, 4, 1), 'mmmm')).toBe('April')
  })
})
