import { affectedFormulaComponents, type AffectedFormulaPlan } from './formula-dependencies'
import { loadRuntimeFormulaFamilies, type RuntimeFormulaFamily } from './formula-regions'
import type { ModelGrid } from './grid'
import { loadSourceBaselineGrid, type SourceBaselineLoad } from './source-baseline-node'
import type { CellAddress, CellValue, ModelInput } from './types'
import { executeWorkbookComponents, type WorkbookComponentExecution } from './workbook-runtime'

export type ScenarioWorkbookExecution = Readonly<{
  grid: ModelGrid
  baseline: Omit<SourceBaselineLoad, 'grid'>
  plan: AffectedFormulaPlan
  execution?: WorkbookComponentExecution
  blockedCircularComponent?: Readonly<{ familyCount: number; cellCount: number }>
  inputCount: number
  changedInputCount: number
  totalMs: number
}>

export const executeScenarioWorkbook = (
  inputs: readonly ModelInput[],
  now: Date,
  artifactPath?: string,
  families: readonly RuntimeFormulaFamily[] = loadRuntimeFormulaFamilies(),
): ScenarioWorkbookExecution => {
  const startedAt = performance.now()
  if (Number.isNaN(now.getTime())) throw new Error('Scenario calculation date is invalid')
  const loaded = loadSourceBaselineGrid(artifactPath)
  const { grid, ...baseline } = loaded
  const changedAddresses: CellAddress[] = []
  const seen = new Set<string>()
  for (const input of inputs) {
    const key = `${input.address.sheet}:${input.address.row}:${input.address.column}`
    if (seen.has(key)) throw new Error(`Scenario contains duplicate input ${key}`)
    seen.add(key)
    if (isFormulaOutput(input.address, families)) throw new Error(`Scenario input ${key} targets a formula cell`)
    const value = inputCell(input.value)
    if (!sameCellValue(grid.get(input.address), value)) changedAddresses.push(input.address)
    grid.set(input.address, value)
  }
  const plan = affectedFormulaComponents(families, changedAddresses)
  const sourceCircularComponent = plan.components.find((component) => component.length === 67)
  const blockedCircularComponent = sourceCircularComponent
    ? { familyCount: sourceCircularComponent.length, cellCount: sourceCircularComponent.reduce((total, family) => total + family.cellCount, 0) }
    : undefined
  const execution = plan.components.length && !blockedCircularComponent ? executeWorkbookComponents(grid, now, plan.components, 16) : undefined
  return {
    grid,
    baseline,
    plan,
    execution,
    blockedCircularComponent,
    inputCount: inputs.length,
    changedInputCount: changedAddresses.length,
    totalMs: performance.now() - startedAt,
  }
}

const isFormulaOutput = (address: CellAddress, families: readonly RuntimeFormulaFamily[]): boolean => families.some((family) =>
  family.sheet === address.sheet && family.regions.some((region) =>
    address.row >= region.startRow && address.row <= region.endRow &&
    address.column >= region.startColumn && address.column <= region.endColumn,
  ),
)

const inputCell = (value: ModelInput['value']): CellValue => {
  if (value === null) return { type: 'blank' }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Scenario inputs cannot contain non-finite numbers')
    return { type: 'number', value }
  }
  if (typeof value === 'boolean') return { type: 'boolean', value }
  return { type: 'string', value }
}

const sameCellValue = (left: CellValue, right: CellValue): boolean => {
  if (left.type !== right.type) return false
  if (left.type === 'blank' && right.type === 'blank') return true
  if (left.type === 'number' && right.type === 'number') return Object.is(left.value, right.value)
  if (left.type === 'string' && right.type === 'string') return left.value === right.value
  if (left.type === 'boolean' && right.type === 'boolean') return left.value === right.value
  if (left.type === 'date' && right.type === 'date') return left.serial === right.serial
  if (left.type === 'error' && right.type === 'error') return left.code === right.code && left.detail === right.detail
  return false
}
