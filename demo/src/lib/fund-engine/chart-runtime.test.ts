import { describe, expect, it } from 'vitest'
import { projectWorkbookCharts } from './chart-runtime'
import type { ModelGrid } from './grid'

describe('workbook chart projection', () => {
  it('preserves all four source charts, twelve series, and exact category lengths', () => {
    const grid = { get: ({ row, column }: { row: number; column: number }) => ({ type: 'number', value: row * 1_000 + column }) } as unknown as ModelGrid
    const charts = projectWorkbookCharts(grid)
    expect(charts).toHaveLength(4)
    expect(charts.flatMap((chart) => chart.series)).toHaveLength(12)
    expect(charts.map((chart) => chart.categories.length)).toEqual([16, 180, 16, 16])
    expect(charts[0]).toMatchObject({ title: 'Total Fund Cash Flows', type: 'stacked-column', categorySource: "'Annual Roll Up'!$C$3:$R$3" })
    expect(charts[1].series.map((series) => series.name)).toEqual(['Capital Called', 'Internal Funding', 'Total Funding Required'])
    expect(charts.every((chart) => chart.series.every((series) => series.values.length === chart.categories.length))).toBe(true)
  })
})
