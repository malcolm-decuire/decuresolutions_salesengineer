import { describe, expect, it } from 'vitest'
import { GET, POST } from './route'
import { MODEL_INPUT_FIELDS } from '../../../../lib/fund-engine/model-contract'

describe('GET /api/model/audit', () => {
  it('publishes the audit index', async () => {
    const response = GET(new Request('http://localhost/api/model/audit'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ status: 'available', sourceMode: 'exact-source-snapshot' })
  })

  it('returns an exact value and formula-family trace for a source cell', async () => {
    const response = GET(new Request('http://localhost/api/model/audit?sheet=Fund%20Assumptions&cell=E41'))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      address: { sheetId: 'fund-assumptions', sheetName: 'Fund Assumptions', cell: 'E41', row: 41, column: 5 },
      value: { type: 'number', value: 1.243751248 },
      formula: { digest: '4a3e4edd943da3afe7eee852959a0080646ccff4e6d74911afaad1aafcf940a4' },
      provenance: { sourceCoordinate: 'Fund Assumptions!E41', precedentsPublished: true },
    })
    expect(body.precedents.length).toBeGreaterThan(0)
  })

  it('audits the recalculated scenario value using the submitted inputs', async () => {
    const inputs = Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, field.id === 'fundAssumptions_d29' ? 0.06 : field.defaultValue]))
    const response = await POST(new Request('http://localhost/api/model/audit?sheet=Fund%20Assumptions&cell=D29', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inputs, lockedDate: '2025-03-01' }),
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.sourceMode).toBe('recalculated-scenario')
    expect(body.value).toEqual({ type: 'number', value: 0.06 })
    expect(body.provenance.sourceCoordinate).toBe('Fund Assumptions!D29')
  })
})
