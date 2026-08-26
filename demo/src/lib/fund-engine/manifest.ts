import { sheetId, type CellAddress, type CellValue, type FamilyId, type SheetId } from './types'

export type SheetRole = 'assumptions' | 'calculation' | 'chart-data' | 'output'

export type SheetManifest = Readonly<{
  id: SheetId
  name: string
  order: number
  rows: number
  columns: number
  hidden: boolean
  role: SheetRole
}>

export type FamilyManifest = Readonly<{
  id: FamilyId
  dependencies: readonly FamilyId[]
  outputSheets: readonly SheetId[]
}>

export type GoldenCell = Readonly<{
  address: CellAddress
  expected: CellValue
  absoluteTolerance?: number
  relativeTolerance?: number
}>

export type ModelManifest = Readonly<{
  schemaVersion: 1
  modelVersion: string
  sourceSha256: string
  sheets: readonly SheetManifest[]
  families: readonly FamilyManifest[]
  goldenCells: readonly GoldenCell[]
  parityExclusions: readonly Readonly<{ address: CellAddress; reason: string }>[]
}>

export const WORKBOOK_SHEETS: readonly SheetManifest[] = [
  { id: sheetId('fund-assumptions'), name: 'Fund Assumptions', order: 0, rows: 241, columns: 31, hidden: false, role: 'assumptions' },
  { id: sheetId('investor-cash-flows'), name: 'Investor Cash Flows', order: 1, rows: 388, columns: 202, hidden: false, role: 'calculation' },
  { id: sheetId('charts'), name: 'Charts', order: 2, rows: 5, columns: 201, hidden: true, role: 'chart-data' },
  { id: sheetId('aggregate-fund-cash-flows'), name: 'Aggregate Fund Cash Flows', order: 3, rows: 259, columns: 199, hidden: false, role: 'calculation' },
  { id: sheetId('annual-roll-up'), name: 'Annual Roll Up', order: 4, rows: 1000, columns: 40, hidden: false, role: 'output' },
  { id: sheetId('p-and-l-by-group'), name: 'P&L By Group', order: 5, rows: 51, columns: 21, hidden: false, role: 'output' },
  { id: sheetId('buy-and-hold'), name: 'Buy and Hold', order: 6, rows: 2311, columns: 189, hidden: false, role: 'calculation' },
  { id: sheetId('buy-rent-and-sell'), name: 'Buy, Rent and Sell', order: 7, rows: 2312, columns: 189, hidden: false, role: 'calculation' },
  { id: sheetId('buy-and-flip'), name: 'Buy and Flip', order: 8, rows: 2312, columns: 189, hidden: false, role: 'calculation' },
  { id: sheetId('static'), name: 'Static (Dont Touch)', order: 9, rows: 1000, columns: 77, hidden: true, role: 'calculation' },
]

export const assertManifest = (manifest: ModelManifest): void => {
  if (manifest.schemaVersion !== 1) throw new Error(`Unsupported manifest schema ${manifest.schemaVersion}`)
  if (!/^[a-f\d]{64}$/i.test(manifest.sourceSha256)) throw new Error('Manifest requires a SHA-256 source hash')
  const names = new Set<string>()
  const ids = new Set<SheetId>()
  for (const sheet of manifest.sheets) {
    if (names.has(sheet.name) || ids.has(sheet.id)) throw new Error(`Duplicate sheet in manifest: ${sheet.name}`)
    names.add(sheet.name)
    ids.add(sheet.id)
  }
  for (const family of manifest.families) {
    for (const sheet of family.outputSheets) {
      if (!ids.has(sheet)) throw new Error(`Family ${family.id} targets unknown sheet ${sheet}`)
    }
  }
}

