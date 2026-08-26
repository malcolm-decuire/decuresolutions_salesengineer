import { describe, expect, it } from 'vitest'

import { dateUtc, datedifMonths, edate, eomonth, serialFromDate, weeknumSunday } from './dates'

describe('Google Sheets compatible date helpers', () => {
  it('clamps EDATE at month end', () => {
    expect(edate(serialFromDate(dateUtc(2024, 1, 31)), 1)).toBe(serialFromDate(dateUtc(2024, 2, 29)))
    expect(edate(serialFromDate(dateUtc(2025, 1, 31)), 1)).toBe(serialFromDate(dateUtc(2025, 2, 28)))
  })

  it('returns month ends', () => {
    expect(eomonth(serialFromDate(dateUtc(2025, 1, 15)), 0)).toBe(serialFromDate(dateUtc(2025, 1, 31)))
    expect(eomonth(serialFromDate(dateUtc(2025, 1, 15)), 1)).toBe(serialFromDate(dateUtc(2025, 2, 28)))
  })

  it('counts whole months for DATEDIF m', () => {
    expect(datedifMonths(serialFromDate(dateUtc(2025, 1, 31)), serialFromDate(dateUtc(2025, 2, 28)))).toBe(0)
    expect(datedifMonths(serialFromDate(dateUtc(2025, 1, 15)), serialFromDate(dateUtc(2026, 1, 15)))).toBe(12)
  })

  it('uses Sunday-start WEEKNUM type 1', () => {
    expect(weeknumSunday(serialFromDate(dateUtc(2025, 1, 1)))).toBe(1)
    expect(weeknumSunday(serialFromDate(dateUtc(2025, 1, 5)))).toBe(2)
  })
})
