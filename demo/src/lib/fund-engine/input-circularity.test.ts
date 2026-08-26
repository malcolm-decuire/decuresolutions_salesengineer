import { describe, expect, it } from 'vitest'

import { affectedFormulaComponents, deriveFamilyDependencies } from './formula-dependencies'
import { loadRuntimeFormulaFamilies } from './formula-regions'
import { MODEL_INPUT_FIELDS, TRUSTED_RECALCULATION_INPUT_IDS } from './model-contract'

describe('editable input circularity audit', () => {
  it('locks the 162 inputs that cross the undefined source cycle and identifies seven safe controls', () => {
    const families = loadRuntimeFormulaFamilies()
    const dependencies = deriveFamilyDependencies(families)
    const results = MODEL_INPUT_FIELDS.map((field) => {
      const plan = affectedFormulaComponents(families, [field.address], dependencies)
      const cycle = plan.components.find((component) => component.length === 67)
      return { id: field.id, group: field.group, reachesSourceCycle: Boolean(cycle) }
    })
    expect(results).toHaveLength(169)
    expect(new Set(results.map((result) => result.group))).toEqual(new Set(['fund', 'fees', 'capital', 'waterfall', 'strategy', 'seasonality']))
    expect(results.filter((result) => result.reachesSourceCycle)).toHaveLength(162)
    expect(results.filter((result) => !result.reachesSourceCycle).map((result) => result.id)).toEqual(TRUSTED_RECALCULATION_INPUT_IDS)
    expect(MODEL_INPUT_FIELDS.filter((field) => field.recalculation === 'trusted').map((field) => field.id)).toEqual(TRUSTED_RECALCULATION_INPUT_IDS)
  })
})
