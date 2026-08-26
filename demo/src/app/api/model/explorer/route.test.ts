import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../lib/fund-engine/source-baseline-node', () => ({
  loadSourceBaselineGrid: () => ({
    grid: { get: ({ row, column }: { row: number; column: number }) => ({ type: 'number', value: row * 100 + column }) },
  }),
}))
vi.mock('../../../../lib/fund-engine/cell-formats-node', () => ({
  loadCellFormats: () => ({ sheets: [], styles: [], rows: new Map(), runCount: 0 }),
}))
vi.mock('../../../../lib/fund-engine/scenario-runtime', () => ({
  executeScenarioWorkbook: () => ({
    grid: { get: ({ row, column }: { row: number; column: number }) => ({ type: 'number', value: row === 29 && column === 4 ? 0.06 : row * 100 + column }) },
    changedInputCount: 1,
  }),
}))

import { GET, POST } from './route'
import { MODEL_INPUT_FIELDS } from '../../../../lib/fund-engine/model-contract'

describe('model explorer route', () => {
  it('returns a bounded source-addressed grid window', async () => {
    const response = GET(new Request('http://localhost/api/model/explorer?sheet=Fund%20Assumptions&startRow=2&rowCount=2&startColumn=2&columnCount=3'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.range).toMatchObject({ startRow: 2, endRow: 3, startColumn: 2, endColumn: 4 })
    expect(body.columns.map((column: { label: string }) => column.label)).toEqual(['B', 'C', 'D'])
    expect(body.rows[0].cells[0]).toMatchObject({ coordinate: 'B2', row: 2, column: 2, value: { type: 'number', value: 202 }, format: { kind: 'general', code: 'General' } })
  })

  it('rejects oversized windows', async () => {
    const response = GET(new Request('http://localhost/api/model/explorer?rowCount=101'))
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('INVALID_RANGE')
  })

  it('returns the recalculated scenario grid rather than the frozen baseline', async () => {
    const inputs = Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, field.id === 'fundAssumptions_d29' ? 0.06 : field.defaultValue]))
    const response = await POST(new Request('http://localhost/api/model/explorer?sheet=Fund%20Assumptions&startRow=29&rowCount=1&startColumn=4&columnCount=1', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inputs }),
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.sourceMode).toBe('recalculated-scenario')
    expect(body.rows[0].cells[0].value).toEqual({ type: 'number', value: 0.06 })
  })
})
