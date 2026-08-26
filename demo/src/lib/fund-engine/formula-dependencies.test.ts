import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { affectedFormulaComponents, deriveFamilyDependencies, formulaFamilyComponents } from './formula-dependencies'
import { loadRuntimeFormulaFamilies, sourceSheetId } from './formula-regions'
import { SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS } from './source-snapshot-manifest'

describe('formula family dependencies', () => {
  it('derives precedent families from compiled reference rectangles', () => {
    const families = loadRuntimeFormulaFamilies()
    const dependencies = deriveFamilyDependencies(families)
    expect(dependencies.size).toBe(823)
    expect([...dependencies.values()].reduce((total, values) => total + values.size, 0)).toBeGreaterThan(0)
    for (const [id, values] of dependencies) expect(values.has(id)).toBe(false)
  })

  it('orders every family through an acyclic component graph', () => {
    const families = loadRuntimeFormulaFamilies()
    const components = formulaFamilyComponents(families)
    expect(components.flat()).toHaveLength(823)
    expect(new Set(components.flat().map((family) => family.id)).size).toBe(823)
    expect(Math.max(...components.map((component) => component.length))).toBeGreaterThan(1)
  })

  it('selects a downstream component closure for an edited assumption', () => {
    const families = loadRuntimeFormulaFamilies()
    const plan = affectedFormulaComponents(families, [
      { sheet: sourceSheetId('Fund Assumptions'), row: 4, column: 5 },
    ])
    expect(plan.directFamilyCount).toBeGreaterThan(0)
    expect(plan.affectedFamilyCount).toBeGreaterThanOrEqual(plan.directFamilyCount)
    expect(plan.affectedFamilyCount).toBeLessThanOrEqual(823)
    expect(plan.affectedComponentCount).toBe(plan.components.length)
    expect(plan.affectedCellCount).toBeGreaterThan(0)
    expect(new Set(plan.components.flat().map((family) => family.id)).size).toBe(plan.affectedFamilyCount)
  })

  it('returns an empty plan for an unreferenced label cell', () => {
    const plan = affectedFormulaComponents(loadRuntimeFormulaFamilies(), [
      { sheet: sourceSheetId('Fund Assumptions'), row: 2, column: 2 },
    ])
    expect(plan).toMatchObject({ directFamilyCount: 0, affectedFamilyCount: 0, affectedComponentCount: 0, affectedCellCount: 0 })
    expect(plan.components).toEqual([])
  })

  it.runIf(process.env.DIAGNOSE_CYCLIC_COMPONENTS === '1')('prints cyclic component formulas', () => {
    const components = formulaFamilyComponents(loadRuntimeFormulaFamilies()).filter((component) => component.length > 1)
    console.info(JSON.stringify(components.map((component) => ({
      size: component.length,
      families: component.map(({ id, formula, regions }) => ({ id, formula, regions })),
    }))))
    expect(components.length).toBeGreaterThan(0)
  })

  it.runIf(Boolean(process.env.SOURCE_SNAPSHOT_KEYS_PATH))('writes the deterministic snapshot family boundary', () => {
    const components = formulaFamilyComponents(loadRuntimeFormulaFamilies())
    const sourceCycle = components.find((component) => component.length === 67)
    expect(sourceCycle).toBeDefined()
    const keys = [...new Set([
      ...sourceCycle!.map((family) => `${family.sourceSheetName}:${family.digest}`),
      ...SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS,
    ])].sort()
    writeFileSync(process.env.SOURCE_SNAPSHOT_KEYS_PATH!, `${JSON.stringify({ version: 1, familyKeys: keys }, null, 2)}\n`)
    expect(keys).toHaveLength(102)
  })
})
