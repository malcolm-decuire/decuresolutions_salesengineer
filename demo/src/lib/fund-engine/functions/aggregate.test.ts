import { describe, expect, it } from 'vitest'

import {
  countIfs,
  forecastLinear,
  matchesCriterion,
  maxIfs,
  minIfs,
  round,
  roundDown,
  sumIfs,
  sumproduct,
} from './aggregate'

describe('aggregate workbook functions', () => {
  it('evaluates paired criteria ranges with operators and wildcards', () => {
    const groups = ['Hold', 'Flip', 'Hold', 'Hold']
    const years = [2025, 2025, 2026, 2027]
    const values = [10, 20, 30, 40]
    expect(sumIfs(values, [groups, years], ['H*', '>=2026'])).toBe(70)
    expect(countIfs([groups, years], ['<>Flip', '>2025'])).toBe(2)
    expect(maxIfs(values, [groups], ['Hold'])).toBe(40)
    expect(minIfs(values, [groups], ['Hold'])).toBe(10)
    expect(matchesCriterion('H*', '~H~*')).toBe(true)
  })

  it('calculates SUMPRODUCT and rejects shape mismatches', () => {
    expect(sumproduct([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(() => sumproduct([1], [1, 2])).toThrow(/identical lengths/)
  })

  it('calculates a least-squares linear forecast', () => {
    expect(forecastLinear(4, [2, 4, 6], [1, 2, 3])).toBe(8)
    expect(() => forecastLinear(4, [2, 4], [1, 1])).toThrow(/zero variance/)
  })

  it('uses spreadsheet rounding away from zero and ROUNDDOWN toward zero', () => {
    expect(round(1.25, 1)).toBe(1.3)
    expect(round(-1.25, 1)).toBe(-1.3)
    expect(roundDown(1.29, 1)).toBe(1.2)
    expect(roundDown(-1.29, 1)).toBe(-1.2)
  })
})
