import { NextResponse } from 'next/server'

import { WORKBOOK_SHEETS } from '../../../../lib/fund-engine/manifest'
import { loadSourceBaselineGrid } from '../../../../lib/fund-engine/source-baseline-node'
import { formatForCell } from '../../../../lib/fund-engine/cell-formats'
import { loadCellFormats } from '../../../../lib/fund-engine/cell-formats-node'
import { parseModelInputs } from '../../../../lib/fund-engine/model-contract'
import { executeScenarioWorkbook } from '../../../../lib/fund-engine/scenario-runtime'
import type { ModelGrid } from '../../../../lib/fund-engine/grid'

export const runtime = 'nodejs'

export function GET(request: Request) {
  return explorerResponse(request, loadSourceBaselineGrid().grid, 'exact-source-snapshot')
}

export async function POST(request: Request) {
  const parsed = await scenarioGrid(request)
  if ('response' in parsed) return parsed.response
  return explorerResponse(request, parsed.grid, parsed.sourceMode)
}

function explorerResponse(request: Request, grid: ModelGrid, sourceMode: string) {
  const url = new URL(request.url)
  const sheetQuery = url.searchParams.get('sheet') ?? WORKBOOK_SHEETS[0].id
  const sheet = WORKBOOK_SHEETS.find((candidate) => candidate.id === sheetQuery || candidate.name === sheetQuery)
  if (!sheet) return NextResponse.json({ error: { code: 'UNKNOWN_SHEET', message: `Unknown workbook sheet ${sheetQuery}.` } }, { status: 404 })

  const startRow = integerParameter(url, 'startRow', 1)
  const rowCount = integerParameter(url, 'rowCount', 25)
  const startColumn = integerParameter(url, 'startColumn', 1)
  const columnCount = integerParameter(url, 'columnCount', 12)
  if (startRow < 1 || startColumn < 1 || rowCount < 1 || rowCount > 100 || columnCount < 1 || columnCount > 24) {
    return NextResponse.json({ error: { code: 'INVALID_RANGE', message: 'Rows must be 1-100 and columns must be 1-24 using one-based start coordinates.' } }, { status: 400 })
  }
  if (startRow > sheet.rows || startColumn > sheet.columns) {
    return NextResponse.json({ error: { code: 'RANGE_OUT_OF_BOUNDS', message: 'The requested range starts outside the sheet used range.' } }, { status: 404 })
  }

  const endRow = Math.min(sheet.rows, startRow + rowCount - 1)
  const endColumn = Math.min(sheet.columns, startColumn + columnCount - 1)
  const formats = loadCellFormats()
  const rows = []
  for (let row = startRow; row <= endRow; row += 1) {
    const cells = []
    for (let column = startColumn; column <= endColumn; column += 1) {
      cells.push({
        coordinate: `${columnLabel(column)}${row}`,
        row,
        column,
        value: grid.get({ sheet: sheet.id, row, column }),
        format: formatForCell(formats, sheet.name, row, column),
      })
    }
    rows.push({ row, cells })
  }

  return NextResponse.json({
    schemaVersion: 1,
    sourceMode,
    sheet: { id: sheet.id, name: sheet.name, hidden: sheet.hidden, rows: sheet.rows, columns: sheet.columns },
    range: { startRow, endRow, startColumn, endColumn, rowCount: endRow - startRow + 1, columnCount: endColumn - startColumn + 1 },
    columns: Array.from({ length: endColumn - startColumn + 1 }, (_, index) => ({ index: startColumn + index, label: columnLabel(startColumn + index) })),
    rows,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

async function scenarioGrid(request: Request): Promise<Readonly<{ grid: ModelGrid; sourceMode: string }> | Readonly<{ response: NextResponse }>> {
  let body: unknown
  try { body = await request.json() } catch { return { response: NextResponse.json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' } }, { status: 400 }) } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { response: NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'The request body must be an object.' } }, { status: 400 }) }
  const requestBody = body as Record<string, unknown>
  const parsed = parseModelInputs(requestBody.inputs)
  if (parsed.issues.length) return { response: NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'One or more model inputs are invalid.', fields: parsed.issues } }, { status: 422 }) }
  const lockedDate = typeof requestBody.lockedDate === 'string' ? requestBody.lockedDate : '2025-03-01'
  const result = executeScenarioWorkbook(parsed.inputs, new Date(`${lockedDate}T00:00:00.000Z`))
  if (result.blockedCircularComponent || result.execution?.unsettledComponents) return { response: NextResponse.json({ error: { code: 'SCENARIO_NOT_CURRENT', message: 'Explorer remains locked because the scenario did not settle.' } }, { status: 409 }) }
  return { grid: result.grid, sourceMode: result.changedInputCount ? 'recalculated-scenario' : 'exact-source-snapshot' }
}

const integerParameter = (url: URL, name: string, fallback: number): number => {
  const raw = url.searchParams.get(name)
  if (raw === null) return fallback
  const value = Number(raw)
  return Number.isInteger(value) ? value : Number.NaN
}

function columnLabel(column: number): string {
  let value = column
  let result = ''
  while (value > 0) {
    value -= 1
    result = String.fromCharCode(65 + value % 26) + result
    value = Math.floor(value / 26)
  }
  return result
}
