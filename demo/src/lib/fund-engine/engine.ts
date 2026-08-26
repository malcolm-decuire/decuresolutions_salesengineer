import { runChecks, hasCriticalFailures, type ModelCheckDefinition } from './checks'
import type { CalculationFamily } from './families'
import { evaluateFamilies } from './solver'
import { assertManifest, type ModelManifest } from './manifest'
import type { CellProvenance, EngineRunResult, EngineTiming, ModelScenario } from './types'
import { TypedModelGrid, type ModelGrid } from './grid'

export type FundModelEngineDependencies = Readonly<{
  manifest: ModelManifest
  families: readonly CalculationFamily[]
  checks: readonly ModelCheckDefinition[]
  seedGrid(grid: ModelGrid): void | Promise<void>
  applyInputs(grid: ModelGrid, scenario: ModelScenario): void | Promise<void>
  clock?: () => Date
}>

export class FundModelEngine {
  constructor(private readonly dependencies: FundModelEngineDependencies) {
    assertManifest(dependencies.manifest)
  }

  async run(scenario: ModelScenario): Promise<EngineRunResult> {
    const timings: EngineTiming[] = []
    const provenance = new Map<string, CellProvenance>()
    const startedAt = performance.now()
    const grid = new TypedModelGrid(
      this.dependencies.manifest.sheets.map(({ id, rows, columns }) => ({ id, rows, columns })),
    )

    await this.measure('seed-grid', timings, () => this.dependencies.seedGrid(grid))
    await this.measure('apply-inputs', timings, () => this.dependencies.applyInputs(grid, scenario))
    const now = this.resolveCalculationDate(scenario)
    await this.measure('calculate', timings, () =>
      evaluateFamilies(this.dependencies.families, {
        grid,
        scenario,
        now,
        recordProvenance: (entry) => provenance.set(addressKey(entry.address), entry),
      }),
    )
    const checks = await this.measure('checks', timings, () => runChecks(this.dependencies.checks, { grid, scenario }))
    timings.push({ phase: 'total', durationMs: performance.now() - startedAt })

    return {
      scenarioId: scenario.id,
      modelVersion: this.dependencies.manifest.modelVersion,
      status: hasCriticalFailures(checks) ? 'invalid' : 'valid',
      checks,
      timings,
      calculatedAt: now.toISOString(),
    }
  }

  private resolveCalculationDate(scenario: ModelScenario): Date {
    const date = scenario.lockedDate ? new Date(`${scenario.lockedDate}T00:00:00.000Z`) : (this.dependencies.clock?.() ?? new Date())
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid lockedDate: ${scenario.lockedDate}`)
    return date
  }

  private async measure<T>(phase: string, timings: EngineTiming[], operation: () => T | Promise<T>): Promise<T> {
    const startedAt = performance.now()
    const result = await operation()
    timings.push({ phase, durationMs: performance.now() - startedAt })
    return result
  }
}

const addressKey = ({ sheet, row, column }: CellProvenance['address']): string => `${sheet}:${row}:${column}`

