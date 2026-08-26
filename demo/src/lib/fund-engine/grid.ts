import { BLANK, type CellAddress, type CellValue, type SheetId } from './types'

export interface GridReader {
  get(address: CellAddress): CellValue
}

export interface GridWriter {
  set(address: CellAddress, value: CellValue): void
}

export interface ModelGrid extends GridReader, GridWriter {
  clone(): ModelGrid
  hasSheet(sheet: SheetId): boolean
}

type SheetStorage = {
  readonly rows: number
  readonly columns: number
  readonly numbers: Float64Array
  readonly numericMask: Uint8Array
  readonly sparse: Map<number, CellValue>
}

export type GridSheetDefinition = Readonly<{
  id: SheetId
  rows: number
  columns: number
}>

const assertCoordinate = (address: CellAddress, sheet: SheetStorage): number => {
  if (!Number.isInteger(address.row) || !Number.isInteger(address.column) || address.row < 1 || address.column < 1) {
    throw new RangeError(`Invalid one-based cell coordinate ${address.row}:${address.column}`)
  }
  if (address.row > sheet.rows || address.column > sheet.columns) {
    throw new RangeError(`Cell ${address.row}:${address.column} is outside the declared sheet bounds`)
  }
  return (address.row - 1) * sheet.columns + address.column - 1
}

export class TypedModelGrid implements ModelGrid {
  private readonly sheets: Map<SheetId, SheetStorage>

  constructor(definitions: readonly GridSheetDefinition[], sheets?: Map<SheetId, SheetStorage>) {
    if (sheets) {
      this.sheets = sheets
      return
    }

    const unique = new Set(definitions.map(({ id }) => id))
    if (unique.size !== definitions.length) throw new Error('Sheet ids must be unique')

    this.sheets = new Map(
      definitions.map(({ id, rows, columns }) => {
        if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) {
          throw new RangeError(`Invalid grid dimensions for ${id}`)
        }
        const size = rows * columns
        return [id, { rows, columns, numbers: new Float64Array(size), numericMask: new Uint8Array(size), sparse: new Map() }]
      }),
    )
  }

  hasSheet(sheet: SheetId): boolean {
    return this.sheets.has(sheet)
  }

  get(address: CellAddress): CellValue {
    const sheet = this.requireSheet(address.sheet)
    const index = assertCoordinate(address, sheet)
    if (sheet.numericMask[index] === 1) return { type: 'number', value: sheet.numbers[index] }
    return sheet.sparse.get(index) ?? BLANK
  }

  set(address: CellAddress, value: CellValue): void {
    const sheet = this.requireSheet(address.sheet)
    const index = assertCoordinate(address, sheet)
    if (value.type === 'number') {
      if (!Number.isFinite(value.value)) throw new RangeError('Non-finite numbers must be represented as typed cell errors')
      sheet.numbers[index] = value.value
      sheet.numericMask[index] = 1
      sheet.sparse.delete(index)
      return
    }
    sheet.numericMask[index] = 0
    if (value.type === 'blank') sheet.sparse.delete(index)
    else sheet.sparse.set(index, value)
  }

  clone(): ModelGrid {
    const copies = new Map<SheetId, SheetStorage>()
    for (const [id, sheet] of this.sheets) {
      copies.set(id, {
        rows: sheet.rows,
        columns: sheet.columns,
        numbers: sheet.numbers.slice(),
        numericMask: sheet.numericMask.slice(),
        sparse: new Map(sheet.sparse),
      })
    }
    return new TypedModelGrid([], copies)
  }

  private requireSheet(id: SheetId): SheetStorage {
    const sheet = this.sheets.get(id)
    if (!sheet) throw new Error(`Unknown sheet: ${id}`)
    return sheet
  }
}
