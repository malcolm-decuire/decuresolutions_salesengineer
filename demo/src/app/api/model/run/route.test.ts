import { describe, expect, it } from 'vitest'
import { POST } from './route'

describe('POST /api/model/run', () => {
  it('returns an exact, current baseline run with source-addressed outputs', async () => {
    const response = await POST(new Request('http://localhost/api/model/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scenarioId: 'default', lockedDate: '2025-03-01', inputs: {} }),
    }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      schemaVersion: 1,
      sourceMode: 'exact-source-snapshot',
      scenarioId: 'default',
      status: 'valid',
      current: true,
      changedInputCount: 0,
      affected: { families: 0, components: 0, cells: 0 },
    })
    expect(body.outputs.totalCommitments).toMatchObject({
      value: { type: 'number', value: 87_982_036.95 },
      source: { sheet: 'fund-assumptions', row: 21, column: 5 },
    })
    expect(body.outputs.equityMultiple.value).toEqual({ type: 'number', value: 1.243751248 })
    expect(body.charts).toHaveLength(4)
    expect(body.charts.map((chart: { title: string; categories: unknown[] }) => [chart.title, chart.categories.length])).toEqual([
      ['Total Fund Cash Flows', 16],
      ['Funding Overview', 180],
      ['Cumulative Funding Overview', 16],
      ['Cumulative Fund Cash Flows', 16],
    ])
    expect(body.charts.flatMap((chart: { series: unknown[] }) => chart.series)).toHaveLength(12)
    expect(body.checks.every((check: { status: string }) => check.status === 'pass')).toBe(true)
  })

  it('returns structured validation errors for unknown or invalid fields', async () => {
    const response = await POST(new Request('http://localhost/api/model/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: { fundTerm: 16, madeUpField: 1 } }),
    }))
    const body = await response.json()
    expect(response.status).toBe(422)
    expect(body.error.code).toBe('VALIDATION_FAILED')
    expect(body.error.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'fundTerm', code: 'ABOVE_MAXIMUM' }),
      expect.objectContaining({ field: 'madeUpField', code: 'UNKNOWN_FIELD' }),
    ]))
  })

  it('returns a trusted recalculated scenario for a control outside the source cycle', async () => {
    const response = await POST(new Request('http://localhost/api/model/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: { fundAssumptions_d29: 0.06 } }),
    }))
    const body = await response.json()
    expect(body).toMatchObject({ status: 'valid', current: true, changedInputCount: 1, sourceMode: 'recalculated-scenario' })
    expect(body.checks.filter((check: { severity: string }) => check.severity === 'critical').every((check: { status: string }) => check.status === 'pass')).toBe(true)
    expect(body.diagnostics?.unsettledComponents ?? 0).toBe(0)
  })

  it.runIf(process.env.SCENARIO_AUDIT === '1')('keeps every assumptions group locked when the source circular component does not settle', async () => {
    const scenarios = [
      ['fund', { fundTerm: 14 }],
      ['fees', { assetManagementFee: 0.02 }],
      ['capital', { minimumCashReserve: 600_000 }],
      ['waterfall', { fundAssumptions_c29: 0.055 }],
      ['strategy', { buyFlipYearZeroDeals: 4 }],
      ['seasonality', { fundAssumptions_m21: 'Low' }],
    ] as const
    const selectedScenarios = process.env.CYCLE_ONLY === '1' ? scenarios.slice(0, 1) : scenarios
    const failures: string[] = []
    for (const [group, inputs] of selectedScenarios) {
      const response = await POST(new Request('http://localhost/api/model/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ inputs }) }))
      const body = await response.json()
      if (process.env.CYCLE_DIAGNOSTIC === '1' && group === 'fund') console.info(JSON.stringify(body.diagnostics))
      if (!body.current) failures.push(group)
      expect(body, group).toMatchObject({ changedInputCount: 1, sourceMode: 'recalculated-scenario' })
      expect(Object.values(body.outputs).every((output) => {
        const value = (output as { value: { type: string; value?: number } }).value
        return value.type !== 'number' || Number.isFinite(value.value)
      }), group).toBe(true)
    }
    expect(failures).toEqual(selectedScenarios.map(([group]) => group))
  }, 180_000)
})
