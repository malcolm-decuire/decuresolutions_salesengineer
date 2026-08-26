import type { FormulaNode, FormulaRangeReference, FormulaReference } from './formula-parser'
import { WORKBOOK_SHEETS } from './manifest'
import { sourceSheetId } from './formula-regions'
import type { CellAddress, SheetId } from './types'

export type FormulaPrecedent = Readonly<{
  kind: 'cell' | 'range'
  sheetId: SheetId
  sheetName: string
  start: Readonly<{ row: number; column: number; coordinate: string }>
  end: Readonly<{ row: number; column: number; coordinate: string }>
  cellCount: number
}>

const sheetsById = new Map(WORKBOOK_SHEETS.map((sheet) => [sheet.id, sheet]))
const sheetsByName = new Map(WORKBOOK_SHEETS.map((sheet) => [sheet.name, sheet]))

export const extractFormulaPrecedents = (
  node: FormulaNode,
  origin: CellAddress,
  templateOrigin: CellAddress,
): readonly FormulaPrecedent[] => {
  const precedents = new Map<string, FormulaPrecedent>()
  const visit = (current: FormulaNode): void => {
    if (current.kind === 'reference') {
      const address = resolveCell(current, origin, templateOrigin)
      const sheet = requiredSheet(address.sheet)
      const precedent = rangePrecedent(sheet.id, sheet.name, address.row, address.row, address.column, address.column)
      precedents.set(precedentKey(precedent), precedent)
      return
    }
    if (current.kind === 'range') {
      const precedent = resolveRange(current.start, current.end, origin, templateOrigin)
      precedents.set(precedentKey(precedent), precedent)
      return
    }
    if (current.kind === 'unary' || current.kind === 'percent') visit(current.operand)
    else if (current.kind === 'binary') { visit(current.left); visit(current.right) }
    else if (current.kind === 'call') current.arguments.forEach(visit)
  }
  visit(node)
  return [...precedents.values()]
}

const resolveRange = (
  start: FormulaRangeReference,
  end: FormulaRangeReference,
  origin: CellAddress,
  templateOrigin: CellAddress,
): FormulaPrecedent => {
  const sheetName = start.sheet ?? end.sheet
  const sheet = sheetName ? sheetsByName.get(sheetName) : requiredSheet(origin.sheet)
  if (!sheet) throw new Error(`Formula precedent references unknown sheet ${sheetName}`)
  if (start.kind === 'reference' && end.kind === 'reference') {
    const first = resolveCell(start, origin, templateOrigin, sheet.id)
    const last = resolveCell(end, origin, templateOrigin, sheet.id)
    return rangePrecedent(sheet.id, sheet.name, first.row, last.row, first.column, last.column)
  }
  if (start.kind === 'row-reference' && end.kind === 'row-reference') {
    const firstRow = start.absoluteRow ? start.row : origin.row + start.row - templateOrigin.row
    const lastRow = end.absoluteRow ? end.row : origin.row + end.row - templateOrigin.row
    return rangePrecedent(sheet.id, sheet.name, firstRow, lastRow, 1, sheet.columns)
  }
  if (start.kind === 'column-reference' && end.kind === 'column-reference') {
    const firstColumn = start.absoluteColumn ? start.column : origin.column + start.column - templateOrigin.column
    const lastColumn = end.absoluteColumn ? end.column : origin.column + end.column - templateOrigin.column
    return rangePrecedent(sheet.id, sheet.name, 1, sheet.rows, firstColumn, lastColumn)
  }
  throw new Error('Formula precedent range endpoints use incompatible axes')
}

const resolveCell = (reference: FormulaReference, origin: CellAddress, templateOrigin: CellAddress, inheritedSheet?: SheetId): CellAddress => ({
  sheet: reference.sheet ? sourceSheetId(reference.sheet) : inheritedSheet ?? origin.sheet,
  row: reference.absoluteRow ? reference.row : origin.row + reference.row - templateOrigin.row,
  column: reference.absoluteColumn ? reference.column : origin.column + reference.column - templateOrigin.column,
})

const rangePrecedent = (
  sheetId: SheetId,
  sheetName: string,
  firstRow: number,
  lastRow: number,
  firstColumn: number,
  lastColumn: number,
): FormulaPrecedent => {
  const startRow = Math.min(firstRow, lastRow)
  const endRow = Math.max(firstRow, lastRow)
  const startColumn = Math.min(firstColumn, lastColumn)
  const endColumn = Math.max(firstColumn, lastColumn)
  return {
    kind: startRow === endRow && startColumn === endColumn ? 'cell' : 'range',
    sheetId,
    sheetName,
    start: { row: startRow, column: startColumn, coordinate: `${columnLabel(startColumn)}${startRow}` },
    end: { row: endRow, column: endColumn, coordinate: `${columnLabel(endColumn)}${endRow}` },
    cellCount: (endRow - startRow + 1) * (endColumn - startColumn + 1),
  }
}

const precedentKey = (precedent: FormulaPrecedent): string =>
  `${precedent.sheetId}:${precedent.start.row}:${precedent.start.column}:${precedent.end.row}:${precedent.end.column}`

const requiredSheet = (id: SheetId) => {
  const sheet = sheetsById.get(id)
  if (!sheet) throw new Error(`Formula precedent references unknown sheet ${id}`)
  return sheet
}

const columnLabel = (column: number): string => {
  let value = column
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(65 + value % 26) + result
    value = Math.floor(value / 26)
  }
  return result
}
