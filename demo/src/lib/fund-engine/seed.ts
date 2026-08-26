import { ENCODED_WORKBOOK_SEED, WORKBOOK_SEED_RECORD_COUNT } from './generated/workbook-seed'
import type { ModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import type { CellErrorCode, CellValue } from './types'

export const seedWorkbookGrid = (grid: ModelGrid): void => {
  if (ENCODED_WORKBOOK_SEED.length !== WORKBOOK_SEED_RECORD_COUNT) {
    throw new Error('Generated workbook seed count does not match its manifest')
  }
  for (const [sheetIndex, row, column, kind, value] of ENCODED_WORKBOOK_SEED) {
    const sheet = WORKBOOK_SHEETS[sheetIndex]
    if (!sheet) throw new Error(`Generated workbook seed references unknown sheet index ${sheetIndex}`)
    grid.set({ sheet: sheet.id, row, column }, decodeValue(kind, value))
  }
}

const decodeValue = (kind: 'n' | 's' | 'b' | 'e', value: number | string | boolean): CellValue => {
  if (kind === 'n') return { type: 'number', value: value as number }
  if (kind === 's') return { type: 'string', value: value as string }
  if (kind === 'b') return { type: 'boolean', value: value as boolean }
  return { type: 'error', code: value as CellErrorCode }
}
