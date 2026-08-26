import { describe, expect, it } from 'vitest'
import { formulaFamilyComponents } from './formula-dependencies'
import { loadRuntimeFormulaFamilies } from './formula-regions'
import { SOURCE_SNAPSHOT_ARTIFACT_MANIFEST } from './source-snapshot'
import { SOURCE_CACHE_CONTRADICTIONS, SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS } from './source-snapshot-manifest'

describe('source snapshot contract', () => {
  it('locks the exact circular and downstream stale-cache boundary', () => {
    const components = formulaFamilyComponents(loadRuntimeFormulaFamilies())
    const sourceCycle = components.filter((component) => component.length === 67)
    expect(sourceCycle).toHaveLength(1)
    expect(new Set(SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS).size).toBe(35)
    expect(sourceCycle[0].length + SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS.length).toBe(102)
    expect(SOURCE_CACHE_CONTRADICTIONS).toHaveLength(3)
  })

  it('locks the generated snapshot artifact manifest', () => {
    expect(SOURCE_SNAPSHOT_ARTIFACT_MANIFEST).toEqual({
      version: 1,
      familyKeyCount: 102,
      recordCount: 61_135,
      familyKeysSha256: '5b40ae2013a963f3bec8dfc4299a9d18b6989bec6c3f78edb4b26ba56d10f0d4',
      valuesSha256: '3370f86f255311fa8da36067af7af64c0cb263c55a97ee2a0fd56f3a0cb11a6a',
    })
  })
})
