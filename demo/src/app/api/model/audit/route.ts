import { NextResponse } from 'next/server'

import { loadRuntimeFormulaFamilies } from '../../../../lib/fund-engine/formula-regions'
import { extractFormulaPrecedents } from '../../../../lib/fund-engine/formula-precedents'
import { WORKBOOK_SHEETS } from '../../../../lib/fund-engine/manifest'
import { loadSourceBaselineGrid } from '../../../../lib/fund-engine/source-baseline-node'
import { formatForCell } from '../../../../lib/fund-engine/cell-formats'
import { loadCellFormats } from '../../../../lib/fund-engine/cell-formats-node'
import { parseModelInputs } from '../../../../lib/fund-engine/model-contract'
import { executeScenarioWorkbook } from '../../../../lib/fund-engine/scenario-runtime'
import type { ModelGrid } from '../../../../lib/fund-engine/grid'

export const runtime = 'nodejs'

export function GET(request: Request) {
  return auditResponse(request, loadSourceBaselineGrid().grid, 'exact-source-snapshot')
}

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } }, { status: 400 }) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be an object.' } }, { status: 400 })
  const requestBody = body as Record<string, unknown>
  const parsed = parseModelInputs(requestBody.inputs)
  if (parsed.issues.length) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'One or more model inputs are invalid.', fields: parsed.issues } }, { status: 422 })
  const lockedDate = typeof requestBody.lockedDate === 'string' ? requestBody.lockedDate : '2025-03-01'
  const result = executeScenarioWorkbook(parsed.inputs, new Date(`${lockedDate}T00:00:00.000Z`))
  if (result.blockedCircularComponent || result.execution?.unsettledComponents) return NextResponse.json({ error: { code: 'SCENARIO_NOT_CURRENT', message: 'Audit remains locked because the scenario did not settle.' } }, { status: 409 })
  return auditResponse(request, result.grid, result.changedInputCount ? 'recalculated-scenario' : 'exact-source-snapshot')
}

function auditResponse(request: Request, grid: ModelGrid, sourceMode: string) {
  const url = new URL(request.url)
  const sheetQuery = url.searchParams.get('sheet')
  const cellQuery = url.searchParams.get('cell')
  if (!sheetQuery && !cellQuery) {
    return NextResponse.json({
      schemaVersion: 1,
      status: 'available',
      sourceMode,
      capabilities: ['cell-value', 'formula-template', 'formula-family', 'template-origin', 'source-coordinate'],
      sheets: WORKBOOK_SHEETS.map(({ id, name, order, hidden, rows, columns }) => ({ id, name, order, hidden, rows, columns })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (!sheetQuery || !cellQuery) {
    return NextResponse.json({ error: { code: 'MISSING_QUERY', message: 'Both sheet and cell query parameters are required.' } }, { status: 400 })
  }
  const sheet = WORKBOOK_SHEETS.find((candidate) => candidate.id === sheetQuery || candidate.name === sheetQuery)
  if (!sheet) return NextResponse.json({ error: { code: 'UNKNOWN_SHEET', message: `Unknown workbook sheet ${sheetQuery}.` } }, { status: 404 })
  const match = /^([A-Z]+)([1-9]\d*)$/i.exec(cellQuery)
  if (!match) return NextResponse.json({ error: { code: 'INVALID_CELL', message: 'cell must be an A1-style coordinate.' } }, { status: 400 })
  const column = [...match[1].toUpperCase()].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
  const row = Number(match[2])
  if (row > sheet.rows || column > sheet.columns) return NextResponse.json({ error: { code: 'CELL_OUT_OF_BOUNDS', message: `${sheet.name}!${cellQuery.toUpperCase()} is outside the used range.` } }, { status: 404 })
  const address = { sheet: sheet.id, row, column }
  const family = loadRuntimeFormulaFamilies().find((candidate) => candidate.sheet === sheet.id && candidate.regions.some((region) =>
    row >= region.startRow && row <= region.endRow && column >= region.startColumn && column <= region.endColumn,
  ))
  const precedents = family ? extractFormulaPrecedents(family.ast, address, { sheet: family.sheet, row: family.templateRow, column: family.templateColumn }) : []
  return NextResponse.json({
    schemaVersion: 1,
    sourceMode,
    address: { sheetId: sheet.id, sheetName: sheet.name, cell: cellQuery.toUpperCase(), row, column },
    value: grid.get(address),
    format: formatForCell(loadCellFormats(), sheet.name, row, column),
    formula: family ? {
      familyId: family.id,
      digest: family.digest,
      template: family.formula,
      templateOrigin: { row: family.templateRow, column: family.templateColumn },
      familyCellCount: family.cellCount,
    } : null,
    precedents,
    provenance: { sourceCoordinate: `${sheet.name}!${cellQuery.toUpperCase()}`, precedentsPublished: true, directReferenceCount: precedents.length, referencedCellCount: precedents.reduce((total, precedent) => total + precedent.cellCount, 0) },
  }, { headers: { 'Cache-Control': 'no-store' } })
}
