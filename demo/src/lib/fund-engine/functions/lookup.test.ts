import { describe, expect, it } from 'vitest'

import { index, matchExact, vlookupExact } from './lookup'

describe('exact workbook lookup functions', () => {
  const table = [
    ['Hold', 7],
    ['Flip', 3],
  ] as const

  it('uses one-based INDEX coordinates', () => {
    expect(index(table, 2, 2)).toBe(3)
    expect(() => index(table, 0, 1)).toThrow(/outside/)
  })

  it('uses case-insensitive exact MATCH semantics required by the source', () => {
    expect(matchExact('hold', ['Hold', 'Flip'])).toBe(1)
    expect(() => matchExact('Missing', ['Hold', 'Flip'])).toThrow(/did not find/)
  })

  it('uses exact VLOOKUP semantics required by the source', () => {
    expect(vlookupExact('flip', table, 2)).toBe(3)
    expect(() => vlookupExact('Missing', table, 2)).toThrow(/did not find/)
  })
})
