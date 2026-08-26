import type { CalculationFamily, FamilyExecutionContext } from './families'
import type { FamilyId } from './types'

export class DependencyGraphError extends Error {
  constructor(message: string, readonly families: readonly FamilyId[]) {
    super(message)
    this.name = 'DependencyGraphError'
  }
}

export const orderFamilies = (families: readonly CalculationFamily[]): readonly CalculationFamily[] => {
  const byId = new Map(families.map((family) => [family.id, family]))
  if (byId.size !== families.length) throw new DependencyGraphError('Duplicate calculation family ids', [])

  const indegree = new Map<FamilyId, number>()
  const dependents = new Map<FamilyId, FamilyId[]>()
  for (const family of families) {
    indegree.set(family.id, family.dependencies.length)
    for (const dependency of family.dependencies) {
      if (!byId.has(dependency)) throw new DependencyGraphError(`Missing dependency ${dependency} required by ${family.id}`, [family.id])
      dependents.set(dependency, [...(dependents.get(dependency) ?? []), family.id])
    }
  }

  const ready = families.filter((family) => indegree.get(family.id) === 0).map((family) => family.id)
  const ordered: CalculationFamily[] = []
  while (ready.length > 0) {
    const id = ready.shift()
    if (!id) break
    const family = byId.get(id)
    if (!family) throw new DependencyGraphError(`Unknown ready family ${id}`, [id])
    ordered.push(family)
    for (const dependent of dependents.get(id) ?? []) {
      const next = (indegree.get(dependent) ?? 0) - 1
      indegree.set(dependent, next)
      if (next === 0) ready.push(dependent)
    }
  }

  if (ordered.length !== families.length) {
    const cyclic = families.filter((family) => (indegree.get(family.id) ?? 0) > 0).map((family) => family.id)
    throw new DependencyGraphError(`Calculation dependency cycle detected: ${cyclic.join(', ')}`, cyclic)
  }
  return ordered
}

export const evaluateFamilies = async (
  families: readonly CalculationFamily[],
  context: FamilyExecutionContext,
): Promise<void> => {
  for (const family of orderFamilies(families)) await family.evaluate(context)
}

