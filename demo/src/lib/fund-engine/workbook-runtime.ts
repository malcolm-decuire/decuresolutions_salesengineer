import { createFormulaRangeCache, evaluateFormula, invalidateFormulaRangeCache, type FormulaEvaluationValue, type FormulaRangeCache } from './formula-evaluator'
import { loadRuntimeFormulaFamilies, sourceSheetId, type RuntimeFormulaFamily } from './formula-regions'
import type { ModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import type { CellAddress, CellErrorCode, CellValue } from './types'
import { callWorkbookFunction, type WorkbookFunctionCache } from './workbook-function-adapter'

export type WorkbookComponentExecution = Readonly<{
  stats: WorkbookExecutionStats
  componentCount: number
  cyclicComponentCount: number
  componentPasses: number
  unsettledComponents: number
  unsettledCellCount: number
  unsettledCellSamples: readonly string[]
  unsettledPassDiagnostics: readonly Readonly<{ familyCount: number; cellCount: number; passes: readonly Readonly<{ pass: number; changedCells: number; maximumNumericDelta: number }>[] }>[]
  durationMs: number
  topSlowComponents: readonly Readonly<{ familyCount: number; cellCount: number; durationMs: number; familySamples: readonly string[] }>[]
}>

export type WorkbookExecutionStats = Readonly<{
  familyCount: number
  regionCount: number
  cellCount: number
  errorCount: number
  errorsByCode: Readonly<Record<string, number>>
  topErrorFamilies: readonly Readonly<{ familyId: string; errorCount: number }>[]
  errorSamples: readonly Readonly<{ familyId: string; row: number; column: number; code: string; detail?: string }>[]
}>

const bounds = Object.fromEntries(WORKBOOK_SHEETS.flatMap((sheet) => [
  [sheet.name, { rows: sheet.rows, columns: sheet.columns }],
  [sheet.id, { rows: sheet.rows, columns: sheet.columns }],
]))

export const executeWorkbookFamilies = (
  grid: ModelGrid,
  now: Date,
  families: readonly RuntimeFormulaFamily[] = loadRuntimeFormulaFamilies(),
): WorkbookExecutionStats => {
  let regionCount = 0
  let cellCount = 0
  let errorCount = 0
  const errorsByCode: Record<string, number> = {}
  const familyErrors = new Map<string, number>()
  const errorSamples: { familyId: string; row: number; column: number; code: string; detail?: string }[] = []
  for (const family of families) {
    const vectorizedCellCount = executeVectorizedGroupedSumFamily(grid, family)
    if (vectorizedCellCount !== undefined) {
      regionCount += family.regions.length
      cellCount += vectorizedCellCount
      continue
    }
    const rangeCache = createFormulaRangeCache()
    const functionCache: WorkbookFunctionCache = { sumIfsIndexes: new WeakMap() }
    for (const region of family.regions) {
      regionCount += 1
      for (let row = region.startRow; row <= region.endRow; row += 1) {
        for (let column = region.startColumn; column <= region.endColumn; column += 1) {
          const origin = { sheet: family.sheet, row, column }
          const value = evaluateFamilyCell(grid, now, family, origin, undefined, rangeCache, functionCache)
          grid.set(origin, value)
          invalidateFormulaRangeCache(rangeCache, origin)
          cellCount += 1
          if (value.type === 'error') {
            errorCount += 1
            errorsByCode[value.code] = (errorsByCode[value.code] ?? 0) + 1
            familyErrors.set(family.id, (familyErrors.get(family.id) ?? 0) + 1)
            if (errorSamples.length < 30) {
              errorSamples.push({ familyId: family.id, row, column, code: value.code, ...(value.detail ? { detail: value.detail } : {}) })
            }
          }
        }
      }
    }
  }
  const topErrorFamilies = [...familyErrors.entries()]
    .map(([familyId_, familyErrorCount]) => ({ familyId: familyId_, errorCount: familyErrorCount }))
    .sort((left, right) => right.errorCount - left.errorCount || left.familyId.localeCompare(right.familyId))
    .slice(0, 20)
  return { familyCount: families.length, regionCount, cellCount, errorCount, errorsByCode, topErrorFamilies, errorSamples }
}

type VectorizedGroupedSumConfig = Readonly<{
  sourceStartRow: number
  sourceEndRow: number
  outputStartRow: number
  outputEndRow: number
  outputStartColumn: number
  outputEndColumn: number
  cutoff?: Readonly<{ headerRow: number; comparisonColumn: number; comparisonStartRow: number }>
}>

const vectorizedGroupedSumFamilies: Readonly<Record<string, VectorizedGroupedSumConfig>> = Object.freeze({
  '22f5c30507b1bfff49885355a8e627f84bcbbf6668a2f8d08a4722ca37ce3963': {
    sourceStartRow: 590, sourceEndRow: 1342, outputStartRow: 1344, outputEndRow: 1523, outputStartColumn: 8, outputEndColumn: 187,
  },
  'fea30b49ad6407cfc670943159ed3681dd65344cb5b7508b95a1d265734c0158': {
    sourceStartRow: 589, sourceEndRow: 1340, outputStartRow: 1342, outputEndRow: 1521, outputStartColumn: 8, outputEndColumn: 187,
    cutoff: { headerRow: 3, comparisonColumn: 5, comparisonStartRow: 8 },
  },
  'c21723a66d616d709d9c13d64c9be730bb9ca400de8969c19c38965d6aec204e': {
    sourceStartRow: 590, sourceEndRow: 1341, outputStartRow: 1343, outputEndRow: 1522, outputStartColumn: 8, outputEndColumn: 187,
  },
})

const executeVectorizedGroupedSumFamily = (grid: ModelGrid, family: RuntimeFormulaFamily): number | undefined => {
  const config = vectorizedGroupedSumFamilies[family.digest]
  if (!config || family.regions.length !== 1) return undefined
  const region = family.regions[0]
  if (
    region.startRow !== config.outputStartRow || region.endRow !== config.outputEndRow ||
    region.startColumn !== config.outputStartColumn || region.endColumn !== config.outputEndColumn
  ) throw new Error(`Vectorized family ${family.id} no longer matches its locked region contract`)
  const criteriaKeys: string[] = []
  for (let row = config.sourceStartRow; row <= config.sourceEndRow; row += 1) {
    const key = groupedCriterionKey(grid.get({ sheet: family.sheet, row, column: 1 }))
    if (key === undefined) return undefined
    criteriaKeys.push(key)
  }
  const outputKeys: string[] = []
  for (let row = config.outputStartRow; row <= config.outputEndRow; row += 1) {
    const key = groupedCriterionKey(grid.get({ sheet: family.sheet, row, column: 1 }))
    if (key === undefined) return undefined
    outputKeys.push(key)
  }
  let written = 0
  for (let column = config.outputStartColumn; column <= config.outputEndColumn; column += 1) {
    const grouped = new Map<string, number>()
    for (let row = config.sourceStartRow, index = 0; row <= config.sourceEndRow; row += 1, index += 1) {
      const value = groupedNumericValue(grid.get({ sheet: family.sheet, row, column }))
      if (value === undefined) return undefined
      const key = criteriaKeys[index]
      grouped.set(key, (grouped.get(key) ?? 0) + value)
    }
    const header = config.cutoff ? groupedComparableNumber(grid.get({ sheet: family.sheet, row: config.cutoff.headerRow, column })) : undefined
    if (config.cutoff && header === undefined) return undefined
    for (let row = config.outputStartRow, index = 0; row <= config.outputEndRow; row += 1, index += 1) {
      if (config.cutoff) {
        const comparison = groupedComparableNumber(grid.get({
          sheet: family.sheet,
          row: config.cutoff.comparisonStartRow + index,
          column: config.cutoff.comparisonColumn,
        }))
        if (comparison === undefined) return undefined
        if (header! > comparison) {
          grid.set({ sheet: family.sheet, row, column }, { type: 'string', value: '' })
          written += 1
          continue
        }
      }
      const sum = grouped.get(outputKeys[index]) ?? 0
      grid.set({ sheet: family.sheet, row, column }, sum === 0 ? { type: 'string', value: '' } : { type: 'number', value: sum })
      written += 1
    }
  }
  return written
}

const groupedCriterionKey = (value: CellValue): string | undefined => {
  if (value.type === 'blank') return 'string:'
  if (value.type === 'date') return `number:${value.serial}`
  if (value.type === 'number') return `number:${value.value}`
  if (value.type === 'boolean') return `boolean:${value.value}`
  if (value.type === 'string') return `string:${value.value.toUpperCase()}`
  return undefined
}

const groupedNumericValue = (value: CellValue): number | undefined => {
  if (value.type === 'number') return value.value
  if (value.type === 'date') return value.serial
  if (value.type === 'error') return undefined
  return 0
}

const groupedComparableNumber = (value: CellValue): number | undefined => {
  if (value.type === 'number') return value.value
  if (value.type === 'date') return value.serial
  return undefined
}

const groupedArithmeticNumber = (value: CellValue): number | undefined => {
  if (value.type === 'number') return value.value
  if (value.type === 'date') return value.serial
  if (value.type === 'blank') return 0
  if (value.type === 'boolean') return Number(value.value)
  if (value.type === 'string' && value.value.trim() === '') return 0
  if (value.type === 'string' && Number.isFinite(Number(value.value))) return Number(value.value)
  return undefined
}

export const executeWorkbookComponents = (
  grid: ModelGrid,
  now: Date,
  components: readonly (readonly RuntimeFormulaFamily[])[],
  maximumPasses = 8,
): WorkbookComponentExecution => {
  const executionStartedAt = performance.now()
  if (!Number.isInteger(maximumPasses) || maximumPasses < 1) throw new RangeError('maximumPasses must be a positive integer')
  let componentPasses = 0
  let unsettledComponents = 0
  let unsettledCellCount = 0
  const unsettledCellSamples: string[] = []
  const unsettledPassDiagnostics: { familyCount: number; cellCount: number; passes: { pass: number; changedCells: number; maximumNumericDelta: number }[] }[] = []
  let cyclicComponentCount = 0
  const componentDurations: { familyCount: number; cellCount: number; durationMs: number; familySamples: string[] }[] = []

  for (const component of components) {
    const componentStartedAt = performance.now()
    const componentCellCount = component.reduce((total, family) => total + family.cellCount, 0)
    const cyclic = component.length > 1
    if (cyclic) cyclicComponentCount += 1
    const vectorizedComponentCellCount = executeVectorizedBalanceInterestComponent(grid, component)
    if (vectorizedComponentCellCount !== undefined) {
      if (vectorizedComponentCellCount !== componentCellCount) throw new Error('Vectorized component cell count does not match its family contract')
      componentPasses += 1
      componentDurations.push({ familyCount: component.length, cellCount: componentCellCount, durationMs: performance.now() - componentStartedAt, familySamples: component.map((family) => family.id) })
      continue
    }
    if (!cyclic) {
      executeWorkbookFamilies(grid, now, component)
      componentPasses += 1
      componentDurations.push({ familyCount: 1, cellCount: componentCellCount, durationMs: performance.now() - componentStartedAt, familySamples: [component[0].id] })
      continue
    }
    const nodes = componentCells(component)
    const byAddress = new Map(nodes.map((node) => [addressKey(node.address), node]))
    const dependencies = new Map(nodes.map((node) => {
      const values = new Set<string>()
      evaluateFamilyCell(grid, now, node.family, node.address, (precedent) => {
        const key = addressKey(precedent)
        if (key !== addressKey(node.address) && byAddress.has(key)) values.add(key)
      })
      return [addressKey(node.address), values]
    }))
    const remaining = new Set(byAddress.keys())
    while (remaining.size) {
      const ready = [...remaining].filter((key) => [...dependencies.get(key)!].every((dependency) => !remaining.has(dependency)))
      if (!ready.length) break
      ready.sort(compareAddressKeys)
      for (const key of ready) {
        const node = byAddress.get(key)!
        grid.set(node.address, evaluateFamilyCell(grid, now, node.family, node.address))
        remaining.delete(key)
      }
    }
    componentPasses += 1
    if (!remaining.size) {
      componentDurations.push({ familyCount: component.length, cellCount: componentCellCount, durationMs: performance.now() - componentStartedAt, familySamples: component.slice(0, 3).map((family) => family.id) })
      continue
    }

    let settled = false
    const passDiagnostics: { pass: number; changedCells: number; maximumNumericDelta: number }[] = []
    for (let pass = 0; pass < maximumPasses; pass += 1) {
      let changed = false
      let changedCells = 0
      let maximumNumericDelta = 0
      for (const key of [...remaining].sort(compareAddressKeys)) {
        const node = byAddress.get(key)!
        const before = grid.get(node.address)
        const after = evaluateFamilyCell(grid, now, node.family, node.address)
        if (!sameCellValue(before, after)) {
          changed = true
          changedCells += 1
        }
        if (before.type === 'number' && after.type === 'number') maximumNumericDelta = Math.max(maximumNumericDelta, Math.abs(before.value - after.value))
        grid.set(node.address, after)
      }
      passDiagnostics.push({ pass: pass + 1, changedCells, maximumNumericDelta })
      componentPasses += 1
      if (!changed) {
        settled = true
        break
      }
    }
    if (!settled) {
      unsettledComponents += 1
      unsettledCellCount += remaining.size
      unsettledPassDiagnostics.push({ familyCount: component.length, cellCount: remaining.size, passes: passDiagnostics })
      for (const key of [...remaining].sort(compareAddressKeys)) {
        if (unsettledCellSamples.length >= 30) break
        unsettledCellSamples.push(key)
      }
    }
    componentDurations.push({ familyCount: component.length, cellCount: componentCellCount, durationMs: performance.now() - componentStartedAt, familySamples: component.slice(0, 3).map((family) => family.id) })
  }

  const durationMs = performance.now() - executionStartedAt
  return {
    stats: collectWorkbookStats(grid, components.flat()),
    componentCount: components.length,
    cyclicComponentCount,
    componentPasses,
    unsettledComponents,
    unsettledCellCount,
    unsettledCellSamples,
    unsettledPassDiagnostics,
    durationMs,
    topSlowComponents: componentDurations.sort((left, right) => right.durationMs - left.durationMs).slice(0, 20),
  }
}

type VectorizedBalanceInterestConfig = Readonly<{
  sheetName: string
  balanceDigest: string
  interestDigest: string
  balanceStartRow: number
  balanceStartColumn: number
  interestStartRow: number
  rateRow: number
  interestErrorFallback: '' | 0
  cellCount: number
}>

const vectorizedBalanceInterestComponents: readonly VectorizedBalanceInterestConfig[] = Object.freeze([
  {
    sheetName: 'Buy and Hold',
    balanceDigest: '6318f37f76ca0cfd87e7e40aeb9a73d61d4170d125f258ff1bed7159d62f2365',
    interestDigest: '5bf4b9108854d172b37dbffeed6b1ce2fb734057ec220222b771ad41323797b1',
    balanceStartRow: 1536, balanceStartColumn: 8, interestStartRow: 1719, rateRow: 1534, interestErrorFallback: 0, cellCount: 64_800,
  },
  {
    sheetName: 'Buy, Rent and Sell',
    balanceDigest: '6318f37f76ca0cfd87e7e40aeb9a73d61d4170d125f258ff1bed7159d62f2365',
    interestDigest: '4d02edc7ac7c7e8b7bb54215ac0828adc1b1bf45326eaed490a819add7b5ba80',
    balanceStartRow: 1538, balanceStartColumn: 8, interestStartRow: 1721, rateRow: 1536, interestErrorFallback: '', cellCount: 64_800,
  },
  {
    sheetName: 'Buy and Flip',
    balanceDigest: '6318f37f76ca0cfd87e7e40aeb9a73d61d4170d125f258ff1bed7159d62f2365',
    interestDigest: '1032e853c235915c929411c761869dae96d67e8e514d1ad201c50b2dff8b73d4',
    balanceStartRow: 1537, balanceStartColumn: 9, interestStartRow: 1720, rateRow: 1535, interestErrorFallback: '', cellCount: 64_620,
  },
])

const executeVectorizedBalanceInterestComponent = (
  grid: ModelGrid,
  component: readonly RuntimeFormulaFamily[],
): number | undefined => {
  if (component.length !== 2) return undefined
  const digests = new Set(component.map((family) => family.digest))
  const config = vectorizedBalanceInterestComponents.find((candidate) =>
    component.every((family) => family.sourceSheetName === candidate.sheetName) &&
    digests.has(candidate.balanceDigest) && digests.has(candidate.interestDigest),
  )
  if (!config) return undefined
  const family = component[0]
  const rows = 180
  const startColumn = 8
  const endColumn = 187
  const rate = groupedComparableNumber(grid.get({ sheet: family.sheet, row: config.rateRow, column: 4 }))
  if (rate === undefined) return undefined
  for (let index = 0; index < rows; index += 1) {
    const balanceRow = config.balanceStartRow + index
    const interestRow = config.interestStartRow + index
    const active = groupedComparableNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: 1 }))
    const initialBalance = groupedComparableNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: 2 }))
    const maturity = groupedComparableNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: 3 }))
    const principalPayment = groupedComparableNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: 4 }))
    const startDate = groupedComparableNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: 5 }))
    const interestDate = groupedComparableNumber(grid.get({ sheet: family.sheet, row: interestRow, column: 2 }))
    if ([active, initialBalance, maturity, principalPayment, startDate, interestDate].some((value) => value === undefined)) return undefined
    for (let column = startColumn; column <= endColumn; column += 1) {
      const monthEnd = groupedComparableNumber(grid.get({ sheet: family.sheet, row: 3, column }))
      const monthStart = groupedComparableNumber(grid.get({ sheet: family.sheet, row: 4, column }))
      if (monthEnd === undefined || monthStart === undefined) return undefined
      let balance = grid.get({ sheet: family.sheet, row: balanceRow, column })
      if (column >= config.balanceStartColumn) {
        if (active === 0 || monthEnd >= maturity! || monthEnd < startDate!) balance = { type: 'string', value: '' }
        else if (monthEnd === startDate) balance = { type: 'number', value: initialBalance! }
        else {
          const previousBalance = groupedArithmeticNumber(grid.get({ sheet: family.sheet, row: balanceRow, column: column - 1 }))
          const previousInterest = groupedArithmeticNumber(grid.get({ sheet: family.sheet, row: interestRow, column: column - 1 }))
          balance = previousBalance === undefined || previousInterest === undefined
            ? { type: 'error', code: '#VALUE!', detail: 'Vectorized balance recurrence requires numeric prior-period values' }
            : { type: 'number', value: previousBalance - (principalPayment! + previousInterest) }
        }
        grid.set({ sheet: family.sheet, row: balanceRow, column }, balance)
      }

      const header8 = grid.get({ sheet: family.sheet, row: 8, column })
      const currentBalance = groupedComparableNumber(balance)
      let interest: CellValue
      if (header8.type === 'error' || balance.type === 'error') {
        interest = config.interestErrorFallback === 0 ? { type: 'number', value: 0 } : { type: 'string', value: '' }
      } else {
        const eligible = interestDate! >= monthStart
        const firstInner = header8.type === 'string' && header8.value === '' ? 0 : eligible && currentBalance !== undefined ? currentBalance * rate / 12 : 0
        if (-firstInner === 0) interest = { type: 'string', value: '' }
        else {
          const finalInner = balance.type === 'string' && balance.value === '' ? 0 : eligible && currentBalance !== undefined ? currentBalance * rate / 12 : 0
          interest = { type: 'number', value: -finalInner }
        }
      }
      grid.set({ sheet: family.sheet, row: interestRow, column }, interest)
    }
  }
  return config.cellCount
}

export const executeWorkbookSheetOrder = (
  grid: ModelGrid,
  now: Date,
  families: readonly RuntimeFormulaFamily[] = loadRuntimeFormulaFamilies(),
): WorkbookExecutionStats => {
  const familyOrder = new Map(families.map((family, index) => [family.id, index]))
  const rows = new Map<string, { family: RuntimeFormulaFamily; startColumn: number; endColumn: number }[]>()
  for (const family of families) {
    for (const region of family.regions) {
      for (let row = region.startRow; row <= region.endRow; row += 1) {
        const key = `${family.sheet}:${row}`
        const intervals = rows.get(key) ?? []
        intervals.push({ family, startColumn: region.startColumn, endColumn: region.endColumn })
        rows.set(key, intervals)
      }
    }
  }
  const regionCount = families.reduce((total, family) => total + family.regions.length, 0)
  let cellCount = 0
  let errorCount = 0
  const errorsByCode: Record<string, number> = {}
  const familyErrors = new Map<string, number>()
  const errorSamples: { familyId: string; row: number; column: number; code: string; detail?: string }[] = []
  for (const sheet of [...WORKBOOK_SHEETS].sort((left, right) => left.order - right.order)) {
    for (let row = 1; row <= sheet.rows; row += 1) {
      const intervals = (rows.get(`${sheet.id}:${row}`) ?? []).sort(
        (left, right) => left.startColumn - right.startColumn || (familyOrder.get(left.family.id)! - familyOrder.get(right.family.id)!),
      )
      for (const interval of intervals) {
        for (let column = interval.startColumn; column <= interval.endColumn; column += 1) {
          const origin = { sheet: interval.family.sheet, row, column }
          const value = evaluateFamilyCell(grid, now, interval.family, origin)
          grid.set(origin, value)
          cellCount += 1
          if (value.type === 'error') {
            errorCount += 1
            errorsByCode[value.code] = (errorsByCode[value.code] ?? 0) + 1
            familyErrors.set(interval.family.id, (familyErrors.get(interval.family.id) ?? 0) + 1)
            if (errorSamples.length < 30) errorSamples.push({ familyId: interval.family.id, row, column, code: value.code, ...(value.detail ? { detail: value.detail } : {}) })
          }
        }
      }
    }
  }
  const topErrorFamilies = [...familyErrors.entries()].map(([familyId_, familyErrorCount]) => ({ familyId: familyId_, errorCount: familyErrorCount })).sort((left, right) => right.errorCount - left.errorCount).slice(0, 20)
  return { familyCount: families.length, regionCount, cellCount, errorCount, errorsByCode, topErrorFamilies, errorSamples }
}

const evaluateFamilyCell = (
  grid: ModelGrid,
  now: Date,
  family: RuntimeFormulaFamily,
  origin: CellAddress,
  recordPrecedent?: (address: CellAddress) => void,
  rangeCache?: FormulaRangeCache,
  functionCache?: WorkbookFunctionCache,
): CellValue => {
  try {
    return scalar(evaluateFormula(family.ast, {
      grid,
      origin,
      templateOrigin: { sheet: family.sheet, row: family.templateRow, column: family.templateColumn },
      now,
      sheetBounds: bounds,
      resolveSheet: sourceSheetId,
      recordPrecedent,
      rangeCache,
      callFunction: (name, arguments_) => callWorkbookFunction(name, arguments_, now, functionCache),
    }))
  } catch (error) {
    return { type: 'error', code: error instanceof RangeError ? '#REF!' : '#VALUE!', detail: error instanceof Error ? error.message : 'Unknown formula evaluation failure' }
  }
}

type ComponentCell = Readonly<{ family: RuntimeFormulaFamily; address: CellAddress }>
const componentCells = (families: readonly RuntimeFormulaFamily[]): readonly ComponentCell[] => families.flatMap((family) =>
  family.regions.flatMap((region) => {
    const cells: ComponentCell[] = []
    for (let row = region.startRow; row <= region.endRow; row += 1) {
      for (let column = region.startColumn; column <= region.endColumn; column += 1) cells.push({ family, address: { sheet: family.sheet, row, column } })
    }
    return cells
  }),
)
const addressKey = ({ sheet, row, column }: CellAddress): string => `${sheet}:${row}:${column}`
const compareAddressKeys = (left: string, right: string): number => {
  const [leftSheet, leftRow, leftColumn] = left.split(':')
  const [rightSheet, rightRow, rightColumn] = right.split(':')
  return leftSheet.localeCompare(rightSheet) || Number(leftColumn) - Number(rightColumn) || Number(leftRow) - Number(rightRow)
}

const scalar = (value: FormulaEvaluationValue): CellValue =>
  Array.isArray(value) ? value[0]?.[0] ?? { type: 'blank' } : value as CellValue

const sameCellValue = (left: CellValue, right: CellValue): boolean => {
  if (left.type !== right.type) return false
  if (left.type === 'blank' && right.type === 'blank') return true
  if (left.type === 'number' && right.type === 'number') {
    if (Object.is(left.value, right.value)) return true
    return Math.abs(left.value - right.value) <= Math.max(1e-9, Math.max(Math.abs(left.value), Math.abs(right.value)) * 1e-12)
  }
  if (left.type === 'string' && right.type === 'string') return left.value === right.value
  if (left.type === 'boolean' && right.type === 'boolean') return left.value === right.value
  if (left.type === 'date' && right.type === 'date') return left.serial === right.serial
  if (left.type === 'error' && right.type === 'error') return left.code === right.code && left.detail === right.detail
  return false
}

const collectWorkbookStats = (grid: ModelGrid, families: readonly RuntimeFormulaFamily[]): WorkbookExecutionStats => {
  let regionCount = 0
  let cellCount = 0
  let errorCount = 0
  const errorsByCode: Record<string, number> = {}
  const familyErrors = new Map<string, number>()
  const errorSamples: { familyId: string; row: number; column: number; code: string; detail?: string }[] = []
  for (const family of families) {
    for (const region of family.regions) {
      regionCount += 1
      for (let row = region.startRow; row <= region.endRow; row += 1) {
        for (let column = region.startColumn; column <= region.endColumn; column += 1) {
          cellCount += 1
          const value = grid.get({ sheet: family.sheet, row, column })
          if (value.type !== 'error') continue
          errorCount += 1
          errorsByCode[value.code] = (errorsByCode[value.code] ?? 0) + 1
          familyErrors.set(family.id, (familyErrors.get(family.id) ?? 0) + 1)
          if (errorSamples.length < 30) errorSamples.push({ familyId: family.id, row, column, code: value.code, ...(value.detail ? { detail: value.detail } : {}) })
        }
      }
    }
  }
  const topErrorFamilies = [...familyErrors.entries()]
    .map(([familyId_, familyErrorCount]) => ({ familyId: familyId_, errorCount: familyErrorCount }))
    .sort((left, right) => right.errorCount - left.errorCount || left.familyId.localeCompare(right.familyId))
    .slice(0, 20)
  return { familyCount: families.length, regionCount, cellCount, errorCount, errorsByCode, topErrorFamilies, errorSamples }
}

export const runtimeError = (code: CellErrorCode, detail: string): CellValue => ({ type: 'error', code, detail })
