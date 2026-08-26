import { describe, expect, it } from 'vitest'

import { fv, pmt, xirr } from './financial'

describe('financial functions', () => {
  it('preserves PMT sign convention', () => {
    expect(-pmt(0.06 / 12, 360, 300_000)).toBeCloseTo(1_798.6516, 4)
    expect(pmt(0, 10, 100)).toBe(-10)
  })

  it('calculates future value', () => {
    expect(fv(0.05, 10, 0, -100)).toBeCloseTo(162.8894627, 7)
  })

  it('solves irregular annual return', () => {
    expect(xirr([-100, 110], [45_658, 46_023])).toBeCloseTo(0.1, 7)
  })

  it('fails without both cash-flow signs', () => {
    expect(() => xirr([100, 110], [45_658, 46_023])).toThrow(/positive and one negative/)
  })

  it('finds a negative irregular return with the bracketed fallback', () => {
    expect(xirr([-100, 40], [45_000, 45_365])).toBeCloseTo(-0.6, 6)
  })
})
