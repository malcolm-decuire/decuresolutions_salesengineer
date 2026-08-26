import { describe, expect, it } from 'vitest'
import { sourceSheetId } from './formula-regions'
import { clearSourceBaselineCacheForTests, loadSourceBaselineGrid } from './source-baseline-node'
import { executeScenarioWorkbook } from './scenario-runtime'

describe('scenario workbook runtime', () => {
  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH))(
    'blocks an assumption edit that crosses the undefined source circularity boundary',
    () => {
      clearSourceBaselineCacheForTests()
      const baseline = loadSourceBaselineGrid(process.env.SOURCE_BASELINE_PATH!)
      const assumptions = sourceSheetId('Fund Assumptions')
      const input = { sheet: assumptions, row: 4, column: 5 }
      const dependent = { sheet: assumptions, row: 5, column: 5 }
      const untouched = { sheet: assumptions, row: 2, column: 2 }
      const beforeUntouched = baseline.grid.get(untouched)
      const result = executeScenarioWorkbook(
        [{ address: input, value: 14 }],
        new Date('2025-03-01T00:00:00Z'),
        process.env.SOURCE_BASELINE_PATH!,
      )
      console.info(JSON.stringify({
        totalMs: result.totalMs,
        baseline: result.baseline.timings,
        plan: {
          directFamilyCount: result.plan.directFamilyCount,
          affectedFamilyCount: result.plan.affectedFamilyCount,
          affectedComponentCount: result.plan.affectedComponentCount,
          affectedCellCount: result.plan.affectedCellCount,
        },
        executionMs: result.execution?.durationMs,
        topSlowComponents: result.execution?.topSlowComponents.slice(0, 10),
      }))
      expect(result.changedInputCount).toBe(1)
      expect(result.grid.get(input)).toEqual({ type: 'number', value: 14 })
      expect(result.grid.get(dependent)).toEqual(baseline.grid.get(dependent))
      expect(result.grid.get(untouched)).toEqual(beforeUntouched)
      expect(result.execution).toBeUndefined()
      expect(result.blockedCircularComponent).toEqual({ familyCount: 67, cellCount: 20_336 })
      expect(result.plan.affectedFamilyCount).toBeGreaterThan(0)
      expect(result.plan.affectedFamilyCount).toBeLessThanOrEqual(823)
    },
    120_000,
  )

  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH))('does not calculate when supplied inputs equal the baseline', () => {
    const result = executeScenarioWorkbook(
      [{ address: { sheet: sourceSheetId('Fund Assumptions'), row: 4, column: 5 }, value: 15 }],
      new Date('2025-03-01T00:00:00Z'),
      process.env.SOURCE_BASELINE_PATH!,
    )
    expect(result.changedInputCount).toBe(0)
    expect(result.plan.affectedFamilyCount).toBe(0)
    expect(result.execution).toBeUndefined()
  })

  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH))('rejects an input targeting a formula output', () => {
    expect(() => executeScenarioWorkbook(
      [{ address: { sheet: sourceSheetId('Fund Assumptions'), row: 5, column: 5 }, value: 1 }],
      new Date('2025-03-01T00:00:00Z'),
      process.env.SOURCE_BASELINE_PATH!,
    )).toThrow(/targets a formula cell/)
  })
})
