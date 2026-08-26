import { WORKBOOK_CHARTS } from './generated/workbook-charts'
import type { ModelGrid } from './grid'
import { sourceSheetId } from './formula-regions'
import type { CellValue } from './types'

export type WorkbookChartResult = Readonly<{
  id: string
  title: string
  type: 'stacked-column'
  sourcePart: string
  categories: readonly CellValue[]
  categorySource: string
  series: readonly Readonly<{ name: string; values: readonly CellValue[]; source: string }>[]
}>

export const projectWorkbookCharts = (grid: ModelGrid): readonly WorkbookChartResult[] =>
  WORKBOOK_CHARTS.map((chart) => ({
    id: chart.id,
    title: chart.title,
    type: chart.type,
    sourcePart: chart.part,
    categories: readHorizontalRange(grid, chart.categories),
    categorySource: chart.categories.formula,
    series: chart.series.map((series) => ({ name: series.name, values: readHorizontalRange(grid, series.values), source: series.values.formula })),
  }))

type HorizontalRange = Readonly<{ sheet: string; startRow: number; endRow: number; startColumn: number; endColumn: number }>

const readHorizontalRange = (grid: ModelGrid, range: HorizontalRange): readonly CellValue[] => {
  if (range.startRow !== range.endRow) throw new Error('Workbook chart projection supports one-row source ranges only')
  const sheet = sourceSheetId(range.sheet)
  return Array.from({ length: range.endColumn - range.startColumn + 1 }, (_, index) =>
    grid.get({ sheet, row: range.startRow, column: range.startColumn + index }),
  )
}
