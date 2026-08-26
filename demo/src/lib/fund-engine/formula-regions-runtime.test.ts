import { describe, expect, it } from 'vitest'
import { loadRuntimeFormulaFamilies } from './formula-regions'

describe('runtime formula families', () => {
  it('loads and parses the complete deterministic region artifact', () => {
    const families = loadRuntimeFormulaFamilies()
    expect(families).toHaveLength(823)
    expect(families.reduce((total, family) => total + family.regions.length, 0)).toBe(1_015)
    expect(families.reduce((total, family) => total + family.cellCount, 0)).toBe(1_175_711)
    expect(new Set(families.map((family) => family.id)).size).toBe(823)
  })
})
