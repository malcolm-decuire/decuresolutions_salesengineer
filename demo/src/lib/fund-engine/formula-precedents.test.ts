import { describe, expect, it } from 'vitest'
import { parseFormula } from './formula-parser'
import { extractFormulaPrecedents } from './formula-precedents'
import { sourceSheetId } from './formula-regions'
import { loadRuntimeFormulaFamilies } from './formula-regions'
import { WORKBOOK_SHEETS } from './manifest'

describe('formula precedent extraction', () => {
  it('shifts relative references while preserving absolute anchors and ranges', () => {
    const sheet = sourceSheetId('Fund Assumptions')
    const precedents = extractFormulaPrecedents(
      parseFormula("A1+$B$2+SUM('Investor Cash Flows'!E68:GD69)"),
      { sheet, row: 12, column: 8 },
      { sheet, row: 10, column: 7 },
    )
    expect(precedents).toEqual([
      expect.objectContaining({ kind: 'cell', sheetName: 'Fund Assumptions', start: expect.objectContaining({ coordinate: 'B3' }) }),
      expect.objectContaining({ kind: 'cell', sheetName: 'Fund Assumptions', start: expect.objectContaining({ coordinate: 'B2' }) }),
      expect.objectContaining({ kind: 'range', sheetName: 'Investor Cash Flows', start: expect.objectContaining({ coordinate: 'F70' }), end: expect.objectContaining({ coordinate: 'GE71' }), cellCount: 364 }),
    ])
  })

  it('expands whole-column ranges against source sheet bounds without enumerating cells', () => {
    const sheet = sourceSheetId('Fund Assumptions')
    const [precedent] = extractFormulaPrecedents(parseFormula("'P&L By Group'!A:C"), { sheet, row: 1, column: 1 }, { sheet, row: 1, column: 1 })
    expect(precedent).toMatchObject({ sheetName: 'P&L By Group', start: { coordinate: 'A1' }, end: { coordinate: 'C51' }, cellCount: 153 })
  })

  it('resolves precedents for every compiled region boundary inside workbook bounds', () => {
    const bounds = new Map(WORKBOOK_SHEETS.map((sheet) => [sheet.id, sheet]))
    let auditedOrigins = 0
    for (const family of loadRuntimeFormulaFamilies()) {
      for (const region of family.regions) {
        for (const [row, column] of [[region.startRow, region.startColumn], [region.endRow, region.endColumn]]) {
          const precedents = extractFormulaPrecedents(family.ast, { sheet: family.sheet, row, column }, { sheet: family.sheet, row: family.templateRow, column: family.templateColumn })
          for (const precedent of precedents) {
            const sheet = bounds.get(precedent.sheetId)
            expect(sheet, `${family.id} references an unknown sheet`).toBeDefined()
            expect(precedent.start.row, `${family.id} has an invalid start row`).toBeGreaterThanOrEqual(1)
            expect(precedent.start.column, `${family.id} has an invalid start column`).toBeGreaterThanOrEqual(1)
            expect(precedent.end.row, `${family.id} exceeds ${sheet?.name} rows`).toBeLessThanOrEqual(sheet!.rows)
            expect(precedent.end.column, `${family.id} exceeds ${sheet?.name} columns`).toBeLessThanOrEqual(sheet!.columns)
          }
          auditedOrigins += 1
        }
      }
    }
    expect(auditedOrigins).toBe(2_030)
  })
})
