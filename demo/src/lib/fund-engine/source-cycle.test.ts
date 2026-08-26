import { describe, expect, it } from 'vitest'

import { formulaFamilyComponents } from './formula-dependencies'
import { loadRuntimeFormulaFamilies } from './formula-regions'

describe('source workbook circular component', () => {
  it('locks the exact 67-family / 20,336-cell circular contract', () => {
    const components = formulaFamilyComponents(loadRuntimeFormulaFamilies())
    const cycles = components.filter((component) => component.length > 1)
    const sourceCycle = cycles.find((component) => component.length === 67)
    expect(sourceCycle).toBeDefined()
    expect(sourceCycle!.reduce((total, family) => total + family.cellCount, 0)).toBe(20_336)
    if (process.env.REPORT_SOURCE_CYCLE === '1') console.info(JSON.stringify(sourceCycle!.map((family) => ({
      id: family.id,
      sheet: family.sourceSheetName,
      formula: family.formula,
      templateOrigin: `${family.templateColumn}:${family.templateRow}`,
      cellCount: family.cellCount,
      regions: family.regions,
    }))))
  })
})
