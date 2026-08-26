import type { ModelGrid } from './grid'
import type { FormulaNode, FormulaRangeReference, FormulaReference } from './formula-parser'
import { BLANK, sheetId, type CellAddress, type CellErrorCode, type CellValue } from './types'

export type FormulaArray = readonly (readonly CellValue[])[]
export type FormulaEvaluationValue = CellValue | FormulaArray
type FormulaRangeCacheEntry = Readonly<{
  sheet: CellAddress['sheet']; startRow: number; endRow: number; startColumn: number; endColumn: number; value: FormulaArray
}>
export type FormulaRangeCache = Readonly<{
  entries: Map<string, FormulaRangeCacheEntry>
  boundsBySheet: Map<CellAddress['sheet'], { startRow: number; endRow: number; startColumn: number; endColumn: number }>
}>
export const createFormulaRangeCache = (): FormulaRangeCache => ({ entries: new Map(), boundsBySheet: new Map() })

export type FormulaEvaluatorContext = Readonly<{
  grid: ModelGrid
  origin: CellAddress
  templateOrigin?: CellAddress
  now: Date
  sheetBounds?: Readonly<Record<string, Readonly<{ rows: number; columns: number }>>>
  resolveSheet?(name: string): CellAddress['sheet']
  callFunction(name: string, arguments_: readonly FormulaEvaluationValue[]): FormulaEvaluationValue
  recordPrecedent?(address: CellAddress): void
  rangeCache?: FormulaRangeCache
}>

export const evaluateFormula = (node: FormulaNode, context: FormulaEvaluatorContext): FormulaEvaluationValue => {
  switch (node.kind) {
    case 'number': return { type: 'number', value: node.value }
    case 'string': return { type: 'string', value: node.value }
    case 'boolean': return { type: 'boolean', value: node.value }
    case 'error': return cellError(node.code)
    case 'reference': return readReference(node, context)
    case 'row-reference':
    case 'column-reference': throw new Error('Whole-axis references are only valid inside ranges')
    case 'range': return readRange(node.start, node.end, context)
    case 'unary': return unary(node.operator, scalar(evaluateFormula(node.operand, context)))
    case 'percent': return numeric(scalar(evaluateFormula(node.operand, context)), (value) => value / 100)
    case 'binary': return binary(node.operator, scalar(evaluateFormula(node.left, context)), scalar(evaluateFormula(node.right, context)))
    case 'call': {
      if (node.name === 'IF') {
        const condition = truthy(scalar(evaluateFormula(node.arguments[0], context)))
        return evaluateFormula(node.arguments[condition ? 1 : 2] ?? { kind: 'boolean', value: condition }, context)
      }
      if (node.name === 'IFERROR') {
        const primary = evaluateFormula(node.arguments[0], context)
        if (scalar(primary).type !== 'error') return primary
        return node.arguments[1] ? evaluateFormula(node.arguments[1], context) : BLANK
      }
      return context.callFunction(node.name, node.arguments.map((argument) => evaluateFormula(argument, context)))
    }
  }
}

const readReference = (reference: FormulaReference, context: FormulaEvaluatorContext): CellValue => {
  const address = resolveCell(reference, context.origin, context.templateOrigin ?? context.origin, context.resolveSheet)
  context.recordPrecedent?.(address)
  return context.grid.get(address)
}

const readRange = (
  start: FormulaRangeReference,
  end: FormulaRangeReference,
  context: FormulaEvaluatorContext,
): FormulaArray => {
  const sheetName = start.sheet ?? end.sheet
  const sheet = sheetName ? (context.resolveSheet?.(sheetName) ?? sheetId(sheetName)) : context.origin.sheet
  const bounds = rangeBounds(start, end, context)
  const cacheKey = `${sheet}:${bounds.startRow}:${bounds.endRow}:${bounds.startColumn}:${bounds.endColumn}`
  const cached = context.rangeCache?.entries.get(cacheKey)
  if (cached) return cached.value
  const values: CellValue[][] = []
  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    const outputRow: CellValue[] = []
    for (let column = bounds.startColumn; column <= bounds.endColumn; column += 1) {
      const address = { sheet, row, column }
      context.recordPrecedent?.(address)
      outputRow.push(context.grid.get(address))
    }
    values.push(outputRow)
  }
  if (context.rangeCache) {
    context.rangeCache.entries.set(cacheKey, { sheet, ...bounds, value: values })
    const aggregate = context.rangeCache.boundsBySheet.get(sheet)
    if (!aggregate) context.rangeCache.boundsBySheet.set(sheet, { ...bounds })
    else {
      aggregate.startRow = Math.min(aggregate.startRow, bounds.startRow)
      aggregate.endRow = Math.max(aggregate.endRow, bounds.endRow)
      aggregate.startColumn = Math.min(aggregate.startColumn, bounds.startColumn)
      aggregate.endColumn = Math.max(aggregate.endColumn, bounds.endColumn)
    }
  }
  return values
}

export const invalidateFormulaRangeCache = (cache: FormulaRangeCache, address: CellAddress): void => {
  const aggregate = cache.boundsBySheet.get(address.sheet)
  if (!aggregate || address.row < aggregate.startRow || address.row > aggregate.endRow || address.column < aggregate.startColumn || address.column > aggregate.endColumn) return
  for (const [key, entry] of cache.entries) {
    if (
      entry.sheet === address.sheet &&
      address.row >= entry.startRow && address.row <= entry.endRow &&
      address.column >= entry.startColumn && address.column <= entry.endColumn
    ) cache.entries.delete(key)
  }
}

const rangeBounds = (start: FormulaRangeReference, end: FormulaRangeReference, context: FormulaEvaluatorContext) => {
  const origin = context.origin
  const templateOrigin = context.templateOrigin ?? origin
  if (start.kind === 'reference' && end.kind === 'reference') {
    const first = resolveCell(start, origin, templateOrigin, context.resolveSheet)
    const last = resolveCell(end, origin, templateOrigin, context.resolveSheet)
    return normalizedBounds(first.row, last.row, first.column, last.column)
  }
  if (start.kind === 'row-reference' && end.kind === 'row-reference') {
    const bounds = context.sheetBounds?.[start.sheet ?? end.sheet ?? origin.sheet]
    if (!bounds) throw new Error('Whole-row range evaluation requires declared sheet bounds')
    const firstRow = start.absoluteRow ? start.row : origin.row + start.row - templateOrigin.row
    const lastRow = end.absoluteRow ? end.row : origin.row + end.row - templateOrigin.row
    return normalizedBounds(firstRow, lastRow, 1, bounds.columns)
  }
  if (start.kind === 'column-reference' && end.kind === 'column-reference') {
    const bounds = context.sheetBounds?.[start.sheet ?? end.sheet ?? origin.sheet]
    if (!bounds) throw new Error('Whole-column range evaluation requires declared sheet bounds')
    const firstColumn = start.absoluteColumn ? start.column : origin.column + start.column - templateOrigin.column
    const lastColumn = end.absoluteColumn ? end.column : origin.column + end.column - templateOrigin.column
    return normalizedBounds(1, bounds.rows, firstColumn, lastColumn)
  }
  throw new Error('Range endpoints must use the same reference axis')
}

const normalizedBounds = (firstRow: number, lastRow: number, firstColumn: number, lastColumn: number) => ({
  startRow: Math.min(firstRow, lastRow),
  endRow: Math.max(firstRow, lastRow),
  startColumn: Math.min(firstColumn, lastColumn),
  endColumn: Math.max(firstColumn, lastColumn),
})

const resolveCell = (reference: FormulaReference, origin: CellAddress, templateOrigin: CellAddress, resolveSheet?: (name: string) => CellAddress['sheet']): CellAddress => ({
  sheet: reference.sheet ? (resolveSheet?.(reference.sheet) ?? sheetId(reference.sheet)) : origin.sheet,
  row: reference.absoluteRow ? reference.row : origin.row + reference.row - templateOrigin.row,
  column: reference.absoluteColumn ? reference.column : origin.column + reference.column - templateOrigin.column,
})

const scalar = (value: FormulaEvaluationValue): CellValue => Array.isArray(value) ? value[0]?.[0] ?? BLANK : value as CellValue

const unary = (operator: '+' | '-', value: CellValue): CellValue =>
  numeric(value, (number) => operator === '-' ? -number : number)

const numeric = (value: CellValue, operation: (number: number) => number): CellValue => {
  if (value.type === 'error') return value
  const number = coerceNumber(value)
  if (number === undefined) return cellError('#VALUE!')
  const result = operation(number)
  return Number.isFinite(result) ? { type: 'number', value: result } : cellError('#NUM!')
}

const binary = (operator: Extract<FormulaNode, { kind: 'binary' }>['operator'], left: CellValue, right: CellValue): CellValue => {
  if (left.type === 'error') return left
  if (right.type === 'error') return right
  if (['=', '<>', '<', '<=', '>', '>='].includes(operator)) {
    const comparison = compare(left, right)
    const value = operator === '=' ? comparison === 0 : operator === '<>' ? comparison !== 0 : operator === '<' ? comparison < 0 : operator === '<=' ? comparison <= 0 : operator === '>' ? comparison > 0 : comparison >= 0
    return { type: 'boolean', value }
  }
  if (operator === '&') return { type: 'string', value: `${display(left)}${display(right)}` }
  const leftNumber = coerceNumber(left)
  const rightNumber = coerceNumber(right)
  if (leftNumber === undefined || rightNumber === undefined) return cellError('#VALUE!')
  if (operator === '/' && rightNumber === 0) return cellError('#DIV/0!')
  const value = operator === '+' ? leftNumber + rightNumber : operator === '-' ? leftNumber - rightNumber : operator === '*' ? leftNumber * rightNumber : operator === '/' ? leftNumber / rightNumber : leftNumber ** rightNumber
  return Number.isFinite(value) ? { type: 'number', value } : cellError('#NUM!')
}

const coerceNumber = (value: CellValue): number | undefined => value.type === 'number' ? value.value : value.type === 'date' ? value.serial : value.type === 'blank' ? 0 : value.type === 'boolean' ? Number(value.value) : value.type === 'string' && value.value.trim() === '' ? 0 : value.type === 'string' && Number.isFinite(Number(value.value)) ? Number(value.value) : undefined
const truthy = (value: CellValue): boolean => value.type === 'boolean' ? value.value : value.type === 'blank' ? false : value.type === 'number' ? value.value !== 0 : value.type === 'string' ? value.value.length > 0 : value.type === 'date' ? value.serial !== 0 : false
const display = (value: CellValue): string => value.type === 'blank' ? '' : value.type === 'boolean' ? (value.value ? 'TRUE' : 'FALSE') : value.type === 'number' ? String(value.value) : value.type === 'date' ? String(value.serial) : value.type === 'string' ? value.value : value.code
const compare = (left: CellValue, right: CellValue): number => {
  if (left.type === 'string' || right.type === 'string') {
    if (left.type === 'string' && right.type === 'string') return left.value.toUpperCase().localeCompare(right.value.toUpperCase())
    return left.type === 'string' ? 1 : -1
  }
  const leftNumber = coerceNumber(left)
  const rightNumber = coerceNumber(right)
  if (leftNumber !== undefined && rightNumber !== undefined) return leftNumber - rightNumber
  return display(left).toUpperCase().localeCompare(display(right).toUpperCase())
}
const cellError = (code: string): CellValue => ({ type: 'error', code: (['#DIV/0!', '#N/A', '#NAME?', '#NUM!', '#REF!', '#VALUE!'].includes(code) ? code : '#VALUE!') as CellErrorCode })
