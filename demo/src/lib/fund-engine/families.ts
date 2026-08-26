import type { ModelGrid } from './grid'
import type { CellProvenance, FamilyId, ModelScenario } from './types'

export type FamilyExecutionContext = Readonly<{
  grid: ModelGrid
  scenario: ModelScenario
  now: Date
  recordProvenance(provenance: CellProvenance): void
}>

export interface CalculationFamily {
  readonly id: FamilyId
  readonly dependencies: readonly FamilyId[]
  evaluate(context: FamilyExecutionContext): void | Promise<void>
}

export class CalculationFamilyRegistry {
  private readonly families = new Map<FamilyId, CalculationFamily>()

  register(family: CalculationFamily): this {
    if (this.families.has(family.id)) throw new Error(`Calculation family already registered: ${family.id}`)
    this.families.set(family.id, family)
    return this
  }

  all(): readonly CalculationFamily[] {
    return [...this.families.values()]
  }
}

