import type { FormulaNode, FormulaRangeReference } from './formula-parser'
import { sourceSheetId, type FormulaRegion, type RuntimeFormulaFamily } from './formula-regions'
import { WORKBOOK_SHEETS } from './manifest'
import type { CellAddress, FamilyId, SheetId } from './types'

type DependencyMap = ReadonlyMap<FamilyId, ReadonlySet<FamilyId>>
type LocatedRegion = Readonly<{ familyId: FamilyId; region: FormulaRegion }>

export type AffectedFormulaPlan = Readonly<{
  directFamilyCount: number
  affectedFamilyCount: number
  affectedComponentCount: number
  affectedCellCount: number
  components: readonly (readonly RuntimeFormulaFamily[])[]
}>

const sheetBounds = new Map(WORKBOOK_SHEETS.map((sheet) => [sheet.id, { rows: sheet.rows, columns: sheet.columns }]))

export const deriveFamilyDependencies = (families: readonly RuntimeFormulaFamily[]): DependencyMap => {
  const outputs = new Map<SheetId, LocatedRegion[]>()
  for (const family of families) {
    const regions = outputs.get(family.sheet) ?? []
    regions.push(...family.regions.map((region) => ({ familyId: family.id, region })))
    outputs.set(family.sheet, regions)
  }

  return new Map(families.map((family) => {
    const dependencies = new Set<FamilyId>()
    for (const precedent of precedentRegions(family)) {
      for (const output of outputs.get(precedent.sheet) ?? []) {
        if (output.familyId !== family.id && intersects(precedent.region, output.region)) {
          dependencies.add(output.familyId)
        }
      }
    }
    return [family.id, dependencies]
  }))
}

export const orderFormulaFamilies = (
  families: readonly RuntimeFormulaFamily[],
  dependencies: DependencyMap = deriveFamilyDependencies(families),
): readonly RuntimeFormulaFamily[] => {
  const byId = new Map(families.map((family) => [family.id, family]))
  const remaining = new Map([...dependencies].map(([id, values]) => [id, new Set(values)]))
  const ready = families.filter((family) => (remaining.get(family.id)?.size ?? 0) === 0).map((family) => family.id).sort()
  const ordered: RuntimeFormulaFamily[] = []
  while (ready.length) {
    const id = ready.shift()!
    const family = byId.get(id)
    if (!family) throw new Error(`Unknown formula family ${id}`)
    ordered.push(family)
    for (const [candidate, values] of remaining) {
      if (!values.delete(id) || values.size !== 0 || ordered.some((entry) => entry.id === candidate) || ready.includes(candidate)) continue
      ready.push(candidate)
      ready.sort()
    }
  }
  if (ordered.length !== families.length) {
    const unresolved = families.filter((family) => !ordered.some((entry) => entry.id === family.id))
    throw new Error(`Formula family dependency cycle contains ${unresolved.length} families`)
  }
  return ordered
}

export const formulaFamilyComponents = (
  families: readonly RuntimeFormulaFamily[],
  dependencies: DependencyMap = deriveFamilyDependencies(families),
): readonly (readonly RuntimeFormulaFamily[])[] => {
  const byId = new Map(families.map((family) => [family.id, family]))
  const indexes = new Map<FamilyId, number>()
  const lowLinks = new Map<FamilyId, number>()
  const stack: FamilyId[] = []
  const onStack = new Set<FamilyId>()
  const components: FamilyId[][] = []
  let nextIndex = 0

  const connect = (id: FamilyId): void => {
    indexes.set(id, nextIndex)
    lowLinks.set(id, nextIndex)
    nextIndex += 1
    stack.push(id)
    onStack.add(id)
    for (const dependency of dependencies.get(id) ?? []) {
      if (!indexes.has(dependency)) {
        connect(dependency)
        lowLinks.set(id, Math.min(lowLinks.get(id)!, lowLinks.get(dependency)!))
      } else if (onStack.has(dependency)) lowLinks.set(id, Math.min(lowLinks.get(id)!, indexes.get(dependency)!))
    }
    if (lowLinks.get(id) !== indexes.get(id)) return
    const component: FamilyId[] = []
    while (stack.length) {
      const member = stack.pop()!
      onStack.delete(member)
      component.push(member)
      if (member === id) break
    }
    components.push(component.sort())
  }
  for (const family of families) if (!indexes.has(family.id)) connect(family.id)

  const componentByFamily = new Map(components.flatMap((component, index) => component.map((id) => [id, index] as const)))
  const componentDependencies = components.map(() => new Set<number>())
  for (const [id, values] of dependencies) {
    const target = componentByFamily.get(id)!
    for (const dependency of values) {
      const source = componentByFamily.get(dependency)!
      if (source !== target) componentDependencies[target].add(source)
    }
  }
  const remaining = new Set(components.map((_, index) => index))
  const ordered: RuntimeFormulaFamily[][] = []
  while (remaining.size) {
    const ready = [...remaining].filter((index) => [...componentDependencies[index]].every((dependency) => !remaining.has(dependency))).sort((left, right) => left - right)
    if (!ready.length) throw new Error('Component dependency graph is cyclic')
    for (const index of ready) {
      ordered.push(components[index].map((id) => byId.get(id)!))
      remaining.delete(index)
    }
  }
  return ordered
}

export const affectedFormulaComponents = (
  families: readonly RuntimeFormulaFamily[],
  changedAddresses: readonly CellAddress[],
  dependencies: DependencyMap = deriveFamilyDependencies(families),
): AffectedFormulaPlan => {
  const uniqueAddresses = new Map(changedAddresses.map((address) => [`${address.sheet}:${address.row}:${address.column}`, address]))
  const directFamilies = new Set<FamilyId>()
  for (const family of families) {
    const precedents = precedentRegions(family)
    if ([...uniqueAddresses.values()].some((address) => precedents.some((precedent) => contains(precedent, address)))) {
      directFamilies.add(family.id)
    }
  }

  const components = formulaFamilyComponents(families, dependencies)
  const componentByFamily = new Map(components.flatMap((component, index) => component.map((family) => [family.id, index] as const)))
  const downstreamComponents = components.map(() => new Set<number>())
  for (const [consumer, upstreamFamilies] of dependencies) {
    const consumerComponent = componentByFamily.get(consumer)
    if (consumerComponent === undefined) throw new Error(`Dependency graph references unknown consumer ${consumer}`)
    for (const upstream of upstreamFamilies) {
      const upstreamComponent = componentByFamily.get(upstream)
      if (upstreamComponent === undefined) throw new Error(`Dependency graph references unknown upstream family ${upstream}`)
      if (upstreamComponent !== consumerComponent) downstreamComponents[upstreamComponent].add(consumerComponent)
    }
  }
  const affectedComponents = new Set([...directFamilies].map((id) => componentByFamily.get(id)!))
  const queue = [...affectedComponents]
  while (queue.length) {
    const current = queue.shift()!
    for (const downstream of downstreamComponents[current]) {
      if (affectedComponents.has(downstream)) continue
      affectedComponents.add(downstream)
      queue.push(downstream)
    }
  }
  const selected = components.filter((_, index) => affectedComponents.has(index))
  return {
    directFamilyCount: directFamilies.size,
    affectedFamilyCount: selected.reduce((total, component) => total + component.length, 0),
    affectedComponentCount: selected.length,
    affectedCellCount: selected.flat().reduce((total, family) => total + family.cellCount, 0),
    components: selected,
  }
}

const precedentRegions = (family: RuntimeFormulaFamily): readonly Readonly<{ sheet: SheetId; region: FormulaRegion }>[] => {
  const precedents: { sheet: SheetId; region: FormulaRegion }[] = []
  visit(family.ast, (start, end = start) => {
    for (const output of family.regions) precedents.push(resolveRange(family, output, start, end))
  })
  return precedents
}

const contains = (precedent: Readonly<{ sheet: SheetId; region: FormulaRegion }>, address: CellAddress): boolean =>
  precedent.sheet === address.sheet &&
  address.row >= precedent.region.startRow && address.row <= precedent.region.endRow &&
  address.column >= precedent.region.startColumn && address.column <= precedent.region.endColumn

const visit = (node: FormulaNode, add: (start: FormulaRangeReference, end?: FormulaRangeReference) => void): void => {
  if (node.kind === 'reference' || node.kind === 'row-reference' || node.kind === 'column-reference') return add(node)
  if (node.kind === 'range') return add(node.start, node.end)
  if (node.kind === 'unary' || node.kind === 'percent') return visit(node.operand, add)
  if (node.kind === 'binary') { visit(node.left, add); visit(node.right, add); return }
  if (node.kind === 'call') for (const argument of node.arguments) visit(argument, add)
}

const resolveRange = (family: RuntimeFormulaFamily, output: FormulaRegion, start: FormulaRangeReference, end: FormulaRangeReference) => {
  const sheet = sourceSheetId(start.sheet ?? end.sheet ?? family.sourceSheetName)
  const bounds = sheetBounds.get(sheet)
  if (!bounds) throw new Error(`Missing bounds for precedent sheet ${sheet}`)
  if (start.kind === 'row-reference' && end.kind === 'row-reference') {
    const first = axis(start.row, start.absoluteRow, output.startRow, output.endRow, family.templateRow)
    const last = axis(end.row, end.absoluteRow, output.startRow, output.endRow, family.templateRow)
    return { sheet, region: rectangle([Math.min(first[0], last[0]), Math.max(first[1], last[1])], [1, bounds.columns]) }
  }
  if (start.kind === 'column-reference' && end.kind === 'column-reference') {
    const first = axis(start.column, start.absoluteColumn, output.startColumn, output.endColumn, family.templateColumn)
    const last = axis(end.column, end.absoluteColumn, output.startColumn, output.endColumn, family.templateColumn)
    return { sheet, region: rectangle([1, bounds.rows], [Math.min(first[0], last[0]), Math.max(first[1], last[1])]) }
  }
  if (start.kind !== 'reference' || end.kind !== 'reference') throw new Error('Mixed reference-axis range')
  const startRows = axis(start.row, start.absoluteRow, output.startRow, output.endRow, family.templateRow)
  const endRows = axis(end.row, end.absoluteRow, output.startRow, output.endRow, family.templateRow)
  const startColumns = axis(start.column, start.absoluteColumn, output.startColumn, output.endColumn, family.templateColumn)
  const endColumns = axis(end.column, end.absoluteColumn, output.startColumn, output.endColumn, family.templateColumn)
  return { sheet, region: rectangle([Math.min(startRows[0], endRows[0]), Math.max(startRows[1], endRows[1])], [Math.min(startColumns[0], endColumns[0]), Math.max(startColumns[1], endColumns[1])]) }
}

const axis = (coordinate: number, absolute: boolean, outputStart: number, outputEnd: number, template: number): [number, number] =>
  absolute ? [coordinate, coordinate] : [outputStart + coordinate - template, outputEnd + coordinate - template]
const rectangle = (rows: [number, number], columns: [number, number]): FormulaRegion => ({ startRow: rows[0], endRow: rows[1], startColumn: columns[0], endColumn: columns[1] })
const intersects = (left: FormulaRegion, right: FormulaRegion): boolean => left.startRow <= right.endRow && left.endRow >= right.startRow && left.startColumn <= right.endColumn && left.endColumn >= right.startColumn
