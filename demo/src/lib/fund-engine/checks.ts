import type { ModelGrid } from './grid'
import type { ModelCheck, ModelScenario } from './types'

export type CheckContext = Readonly<{
  grid: ModelGrid
  scenario: ModelScenario
}>

export interface ModelCheckDefinition {
  readonly id: string
  evaluate(context: CheckContext): ModelCheck | Promise<ModelCheck>
}

export const runChecks = async (
  definitions: readonly ModelCheckDefinition[],
  context: CheckContext,
): Promise<readonly ModelCheck[]> => Promise.all(definitions.map((definition) => definition.evaluate(context)))

export const hasCriticalFailures = (checks: readonly ModelCheck[]): boolean =>
  checks.some((check) => check.status === 'fail' && (check.severity === 'critical' || check.severity === 'error'))

