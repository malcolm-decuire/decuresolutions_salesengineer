'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'

import { WORKBOOK_SHEETS } from '@/lib/fund-engine/manifest'
import { MODEL_INPUT_FIELDS } from '@/lib/fund-engine/model-contract'
import { createScenarioDocument, parseScenarioDocument, SCENARIO_STORAGE_KEY } from '@/lib/fund-engine/scenario-document'

type Assumptions = Record<string, string>
type UiCellValue = Readonly<{ type: string; value?: number | string | boolean; serial?: number; code?: string }>
type RunOutput = Readonly<{ value: UiCellValue; source: Readonly<{ sheet: string; row: number; column: number }> }>
type RunChart = Readonly<{ id: string; title: string; type: 'stacked-column'; sourcePart: string; categories: readonly UiCellValue[]; categorySource: string; categoryFormat: Readonly<{ kind: string; code: string }>; series: readonly Readonly<{ name: string; values: readonly UiCellValue[]; source: string }>[] }>
type RunResult = Readonly<{
  status: 'valid' | 'invalid'
  current: boolean
  sourceMode: string
  changedInputCount: number
  timings: Readonly<{ totalMs: number; calculateMs: number }>
  checks: readonly Readonly<{ id: string; label: string; status: 'pass' | 'fail'; severity: string; actual?: number; expected?: number }>[]
  outputs: Readonly<Record<string, RunOutput>>
  charts: readonly RunChart[]
}>

type Step = 'assumptions' | 'validate' | 'calculate' | 'results' | 'explorer' | 'audit'
type ExplorerResponse = Readonly<{
  sheet: Readonly<{ id: string; name: string; hidden: boolean; rows: number; columns: number }>
  range: Readonly<{ startRow: number; endRow: number; startColumn: number; endColumn: number }>
  columns: readonly Readonly<{ index: number; label: string }>[]
  rows: readonly Readonly<{ row: number; cells: readonly Readonly<{ coordinate: string; value: Readonly<{ type: string; value?: number | string | boolean; serial?: number; code?: string }>; format: Readonly<{ kind: 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text'; code: string }> }>[] }>[]
}>
type AuditResponse = Readonly<{
  address: Readonly<{ sheetId: string; sheetName: string; cell: string; row: number; column: number }>
  value: Readonly<{ type: string; value?: number | string | boolean; code?: string }>
  format?: ExplorerResponse['rows'][number]['cells'][number]['format']
  formula: Readonly<{ familyId: string; digest: string; template: string; templateOrigin: Readonly<{ row: number; column: number }>; familyCellCount: number }> | null
  precedents: readonly Readonly<{ kind: 'cell' | 'range'; sheetId: string; sheetName: string; start: Readonly<{ row: number; column: number; coordinate: string }>; end: Readonly<{ row: number; column: number; coordinate: string }>; cellCount: number }>[]
  provenance: Readonly<{ sourceCoordinate: string; precedentsPublished: boolean; directReferenceCount: number; referencedCellCount: number }>
}>

const steps: { id: Step; short: string; label: string }[] = [
  { id: 'assumptions', short: '1', label: 'Assumptions' },
  { id: 'validate', short: '2', label: 'Validate' },
  { id: 'calculate', short: '3', label: 'Calculate' },
  { id: 'results', short: '4', label: 'Results' },
  { id: 'explorer', short: '5', label: 'Explorer' },
  { id: 'audit', short: '6', label: 'Audit' },
]

const defaults: Assumptions = Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [field.id, String(field.defaultValue)]))

const modelInputs = (values: Assumptions) => Object.fromEntries(MODEL_INPUT_FIELDS.map((field) => [
  field.id,
  field.valueType === 'number' ? Number(values[field.id]) : values[field.id],
]))

const fieldMeta = MODEL_INPUT_FIELDS.map((field) => ({
  key: field.id,
  label: field.label,
  unit: field.unit ?? '',
  source: `Fund Assumptions!${columnLabel(field.address.column)}${field.address.row}`,
  inputMode: field.valueType === 'enum' ? 'text' as const : field.integer ? 'numeric' as const : 'decimal' as const,
  definition: field,
}))

const inputGroups = [
  { id: 'fund', label: 'Fund structure', description: 'Term and investment-period controls.' },
  { id: 'fees', label: 'Fees & reinvestment', description: 'Fund-level fees and reinvestment policy.' },
  { id: 'capital', label: 'Capital & distributions', description: 'Commitments, reserves, and distribution timing.' },
  { id: 'waterfall', label: 'Investor waterfall', description: 'Six source tiers with hurdle and GP participation.' },
  { id: 'strategy', label: 'Deal strategies', description: 'Buy and Flip, Buy/Rent/Sell, and Buy and Hold assumptions.' },
  { id: 'seasonality', label: 'Rates & seasonality', description: 'Weekly-rate, occupancy, and monthly season matrices.' },
] as const

function validate(values: Assumptions) {
  const issues: string[] = []
  for (const field of MODEL_INPUT_FIELDS) {
    const raw = values[field.id]
    if (field.valueType === 'enum') {
      if (!field.options?.includes(raw)) issues.push(`${field.label} must be one of ${field.options?.join(', ')}.`)
      continue
    }
    const value = Number(raw)
    if (!Number.isFinite(value)) issues.push(`${field.label} must be a number.`)
    else if (field.integer && !Number.isInteger(value)) issues.push(`${field.label} must be a whole number.`)
    else if (field.minimum !== undefined && value < field.minimum) issues.push(`${field.label} must be at least ${field.minimum}.`)
    else if (field.maximum !== undefined && value > field.maximum) issues.push(`${field.label} must be at most ${field.maximum}.`)
  }
  return issues
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

const outputMeta = [
  { id: 'totalCommitments', label: 'Total commitments', format: 'currency' },
  { id: 'investedEquity', label: 'Invested equity', format: 'currency' },
  { id: 'netCashFlow', label: 'Net cash flow', format: 'currency' },
  { id: 'totalReturn', label: 'Total return', format: 'currency' },
  { id: 'lpIrr', label: 'LP IRR', format: 'percent' },
  { id: 'gpIrr', label: 'GP IRR', format: 'percent' },
  { id: 'equityMultiple', label: 'Equity multiple', format: 'multiple' },
] as const

const formatOutput = (output: RunOutput | undefined, format: typeof outputMeta[number]['format']): string => {
  if (!output || output.value.type !== 'number' || typeof output.value.value !== 'number') return output?.value.type === 'string' ? String(output.value.value ?? '') : '—'
  if (format === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(output.value.value)
  if (format === 'percent') return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(output.value.value)
  return `${output.value.value.toFixed(2)}×`
}

const chartColors = ['#792a62', '#d8913a', '#287d72'] as const

function InfoDisclosure({ label, children }: { label: string; children: ReactNode }) {
  return <details className="relative inline-block align-middle">
    <summary className="grid size-7 cursor-pointer list-none place-items-center rounded-full border border-mauve-200 bg-white text-xs font-bold text-[#792a62] marker:content-none hover:border-[#792a62]/40" aria-label={label}>i</summary>
    <div className="absolute right-0 z-30 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-mauve-200 bg-white p-3 text-left text-xs font-normal leading-5 text-mauve-600 shadow-xl">{children}</div>
  </details>
}

function ResultsPanel({ result, onOpenSheet }: { result: RunResult; onOpenSheet: (sheetId: string) => void }) {
  return <div className="space-y-6 p-4 lg:p-6">
    <section aria-labelledby="result-cards-heading">
      <div className="flex items-end justify-between gap-3"><div><div className="flex items-center gap-2"><h2 id="result-cards-heading" className="font-semibold">Portfolio result cards</h2><InfoDisclosure label="About portfolio result readiness">These values are trusted only when the run is marked Current and every critical check passes. Final availability requires all 169 controls, XLSX round-trip verification, and viewport evidence.</InfoDisclosure></div><p className="mt-1 text-xs text-mauve-500">Tap any card for its exact workbook source.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">Current</span></div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {outputMeta.map((item) => {
          const output = result.outputs[item.id]
          return <details key={item.id} className="group rounded-2xl border border-mauve-200 bg-[#fbfafb] p-4 open:col-span-2 open:border-[#792a62]/30 lg:open:col-span-1">
            <summary className="cursor-pointer list-none marker:content-none"><span className="flex items-center justify-between gap-2 text-[11px] font-semibold text-mauve-600"><span>{item.label}</span><span className="text-[#792a62] group-open:rotate-45">＋</span></span><span className="mt-2 block text-lg font-semibold tracking-tight text-[#17232b] lg:text-xl">{formatOutput(output, item.format)}</span></summary>
            <p className="mt-3 border-t border-mauve-200 pt-3 font-mono text-[10px] text-mauve-500">{output ? `${output.source.sheet}!${columnLabel(output.source.column)}${output.source.row}` : 'Source unavailable'}</p>
          </details>
        })}
      </div>
    </section>

    <section aria-labelledby="sheet-cards-heading">
      <div className="flex items-center gap-2"><h2 id="sheet-cards-heading" className="font-semibold">Explore workbook tabs</h2><InfoDisclosure label="About workbook tab data">Explorer is recomputed statelessly from the same validated inputs for a recalculated scenario; it never substitutes frozen default cells.</InfoDisclosure></div>
      <p className="mt-1 text-xs text-mauve-500">Card navigation stays available on phone, tablet, and desktop for the current validated grid.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {WORKBOOK_SHEETS.map((sheet, index) => <button key={sheet.id} type="button" onClick={() => onOpenSheet(sheet.id)} className="min-h-24 rounded-2xl border border-mauve-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#792a62]/40 hover:shadow-md"><span className="text-[10px] font-bold text-[#792a62]">{String(index + 1).padStart(2, '0')}</span><span className="mt-2 block text-xs font-semibold leading-4">{sheet.name}</span><span className="mt-1 block text-[10px] text-mauve-500">{sheet.hidden ? 'Hidden source tab' : `${sheet.rows.toLocaleString()} × ${sheet.columns}`}</span></button>)}
      </div>
    </section>

    <section aria-labelledby="charts-heading">
      <div><div className="flex items-center gap-2"><h2 id="charts-heading" className="font-semibold">Workbook charts</h2><InfoDisclosure label="About chart readiness">Charts use exact workbook series and calculated-grid values. They unlock only for a current run; final release remains gated by scenario parity and screenshot evidence.</InfoDisclosure></div><p className="mt-1 text-xs text-mauve-500">Exact four stacked-column chart contracts with accessible data tables.</p></div>
      <div className="mt-4 space-y-4">{result.charts.map((chart, index) => <WorkbookChartCard key={chart.id} chart={chart} defaultOpen={index === 0} />)}</div>
    </section>
  </div>
}

function WorkbookChartCard({ chart, defaultOpen }: { chart: RunChart; defaultOpen: boolean }) {
  return <details open={defaultOpen || undefined} className="group overflow-hidden rounded-2xl border border-mauve-200 bg-white shadow-sm">
    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none"><span className="grid size-8 place-items-center rounded-full bg-[#792a62]/10 text-sm font-bold text-[#792a62] group-open:rotate-90">›</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{chart.title}</span><span className="block text-[10px] text-mauve-500">{chart.categories.length} periods · {chart.series.length} exact series</span></span><span className="rounded-full bg-mauve-50 px-2 py-1 text-[10px] font-semibold text-mauve-600">Chart</span></summary>
    <div className="border-t border-mauve-200 p-4">
      <StackedColumnChart chart={chart} />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{chart.series.map((series, index) => <span key={series.name} className="flex items-center gap-1.5 text-[10px] text-mauve-600"><span className="size-2.5 rounded-sm" style={{ backgroundColor: chartColors[index] }} />{series.name}</span>)}</div>
      <details className="mt-4 rounded-xl bg-mauve-50"><summary className="min-h-11 cursor-pointer px-3 py-3 text-xs font-semibold">Accessible data table & source ranges</summary><div className="max-h-72 overflow-auto border-t border-mauve-200"><table className="min-w-max text-xs"><thead className="sticky top-0 bg-white"><tr><th className="px-3 py-2 text-left">Period</th>{chart.series.map((series) => <th key={series.name} className="px-3 py-2 text-right">{series.name}</th>)}</tr></thead><tbody>{chart.categories.map((category, categoryIndex) => <tr key={categoryIndex} className="border-t border-mauve-100"><th className="px-3 py-2 text-left font-medium">{displayChartCategory(category, chart.categoryFormat)}</th>{chart.series.map((series) => <td key={series.name} className="px-3 py-2 text-right tabular-nums">{formatChartNumber(cellNumber(series.values[categoryIndex]))}</td>)}</tr>)}</tbody></table></div><p className="p-3 font-mono text-[9px] text-mauve-500">Categories: {chart.categorySource}<br />{chart.series.map((series) => `${series.name}: ${series.source}`).join(' · ')}</p></details>
    </div>
  </details>
}

function StackedColumnChart({ chart }: { chart: RunChart }) {
  const values = chart.categories.map((_, index) => chart.series.map((series) => cellNumber(series.values[index])))
  const largestStack = Math.max(1, ...values.flatMap((period) => [period.filter((value) => value > 0).reduce((total, value) => total + value, 0), Math.abs(period.filter((value) => value < 0).reduce((total, value) => total + value, 0))]))
  const width = Math.max(340, chart.categories.length * (chart.categories.length > 24 ? 12 : 28))
  const height = 220
  const baseline = 108
  const chartHeight = 86
  const barWidth = Math.max(5, Math.min(18, width / chart.categories.length - 5))
  return <div className="overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin]" role="img" aria-label={`${chart.title}, stacked column chart with ${chart.categories.length} periods and ${chart.series.length} series`}>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block min-w-full" aria-hidden="true">
      <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="#cfc5cc" strokeWidth="1" />
      {values.map((period, periodIndex) => {
        const x = periodIndex * (width / values.length) + (width / values.length - barWidth) / 2
        let positiveY = baseline
        let negativeY = baseline
        return <g key={periodIndex}>{period.map((value, seriesIndex) => {
          const segmentHeight = Math.abs(value) / largestStack * chartHeight
          const y = value >= 0 ? positiveY - segmentHeight : negativeY
          if (value >= 0) positiveY = y
          else negativeY += segmentHeight
          return <rect key={seriesIndex} x={x} y={y} width={barWidth} height={Math.max(segmentHeight, value === 0 ? 0 : 1)} rx="1" fill={chartColors[seriesIndex]}><title>{`${displayChartCategory(chart.categories[periodIndex], chart.categoryFormat)} · ${chart.series[seriesIndex].name}: ${formatChartNumber(value)}`}</title></rect>
        })}{(chart.categories.length <= 24 || periodIndex % 12 === 0) ? <text x={x + barWidth / 2} y="211" textAnchor="middle" fontSize="8" fill="#74656f">{displayChartCategory(chart.categories[periodIndex], chart.categoryFormat)}</text> : null}</g>
      })}
    </svg>
  </div>
}

const cellNumber = (value: UiCellValue | undefined): number => value?.type === 'number' && typeof value.value === 'number' ? value.value : value?.type === 'date' && typeof value.serial === 'number' ? value.serial : 0
const formatChartNumber = (value: number): string => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'USD' }).format(value)
const displayChartCategory = (value: UiCellValue, format?: RunChart['categoryFormat']): string => {
  const raw = value.type === 'date' ? value.serial : value.value
  if (typeof raw === 'number' && format?.kind === 'date') return formatExcelDate(raw, format.code)
  return raw === undefined ? '—' : String(raw)
}

function Stepper({ active, unlocked, onSelect }: { active: Step; unlocked: Set<Step>; onSelect: (step: Step) => void }) {
  return (
    <ol className="flex min-w-max items-start gap-2 px-1 lg:min-w-0 lg:flex-1 lg:justify-center" aria-label="Model workflow">
      {steps.map((step) => {
        const current = step.id === active
        const available = unlocked.has(step.id)
        return (
          <li key={step.id} className="flex w-16 flex-col items-center gap-1 lg:w-24">
            <button
              type="button"
              disabled={!available}
              onClick={() => onSelect(step.id)}
              aria-current={current ? 'step' : undefined}
              aria-label={`${step.label}${available ? '' : ' (locked)'}`}
              className={`grid size-8 place-items-center rounded-full border text-xs font-bold ${
                current
                  ? 'border-[#792a62] bg-[#792a62] text-white'
                  : available
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-mauve-300 bg-white text-mauve-400'
              } disabled:cursor-not-allowed`}
            >
              {available && !current && step.id !== 'assumptions' ? '✓' : step.short}
            </button>
            <span className={`text-[10px] font-medium ${current ? 'text-[#792a62]' : 'text-mauve-500'}`}>{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ExplorerPanel({ sheetId, initialCell, onSelectSheet, onAudit, scenarioRequest }: { sheetId: string; initialCell?: Readonly<{ row: number; column: number }>; onSelectSheet: (sheetId: string) => void; onAudit: (sheet: string, cell: string) => void; scenarioRequest?: unknown }) {
  const [startRow, setStartRow] = useState(initialCell ? Math.floor((initialCell.row - 1) / 25) * 25 + 1 : 1)
  const [startColumn, setStartColumn] = useState(initialCell ? Math.floor((initialCell.column - 1) / 12) * 12 + 1 : 1)
  const [data, setData] = useState<ExplorerResponse | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/model/explorer?sheet=${encodeURIComponent(sheetId)}&startRow=${startRow}&rowCount=25&startColumn=${startColumn}&columnCount=12`, scenarioRequest ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(scenarioRequest), signal: controller.signal } : { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body?.error?.message ?? 'Explorer range failed to load.')
        setData(body as ExplorerResponse)
        setState('ready')
      })
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') setState('error') })
    return () => controller.abort()
  }, [sheetId, startRow, startColumn, scenarioRequest])

  return <div className="p-5 lg:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">{data?.sheet.name ?? 'Loading sheet…'}</h2><p className="mt-1 text-xs text-mauve-500">Exact source-snapshot cells · click a coordinate for audit detail in the next gate.</p></div>
      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${state === 'ready' ? 'bg-emerald-50 text-emerald-700' : state === 'loading' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{state}</span>
    </div>
    <details className="mt-4 rounded-2xl border border-mauve-200 bg-[#fbfafb] lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs font-semibold marker:content-none"><span>Workbook tab cards</span><span className="text-[#792a62]">Change sheet ＋</span></summary>
      <div className="grid grid-cols-2 gap-2 border-t border-mauve-200 p-3">{WORKBOOK_SHEETS.map((sheet, index) => <button key={sheet.id} type="button" onClick={() => onSelectSheet(sheet.id)} className={`min-h-20 rounded-xl border p-3 text-left ${sheet.id === sheetId ? 'border-[#792a62] bg-[#792a62] text-white' : 'border-mauve-200 bg-white'}`}><span className="text-[9px] font-bold opacity-70">{String(index + 1).padStart(2, '0')}</span><span className="mt-1 block text-[11px] font-semibold leading-4">{sheet.name}</span></button>)}</div>
    </details>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={startRow === 1 || state === 'loading'} onClick={() => { setState('loading'); setStartRow(Math.max(1, startRow - 25)) }} className="min-h-11 rounded-full border border-mauve-200 px-4 text-xs font-semibold disabled:opacity-40">← 25 rows</button>
      <button type="button" disabled={!data || data.range.endRow >= data.sheet.rows || state === 'loading'} onClick={() => { setState('loading'); setStartRow(startRow + 25) }} className="min-h-11 rounded-full border border-mauve-200 px-4 text-xs font-semibold disabled:opacity-40">25 rows →</button>
      <button type="button" disabled={startColumn === 1 || state === 'loading'} onClick={() => { setState('loading'); setStartColumn(Math.max(1, startColumn - 12)) }} className="min-h-11 rounded-full border border-mauve-200 px-4 text-xs font-semibold disabled:opacity-40">← columns</button>
      <button type="button" disabled={!data || data.range.endColumn >= data.sheet.columns || state === 'loading'} onClick={() => { setState('loading'); setStartColumn(startColumn + 12) }} className="min-h-11 rounded-full border border-mauve-200 px-4 text-xs font-semibold disabled:opacity-40">columns →</button>
    </div>
    {state === 'error' ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">The selected workbook range could not be loaded.</p> : null}
    <div className="mt-4 max-h-[62vh] overflow-auto rounded-xl border border-mauve-200">
      <table className="min-w-max border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-mauve-50"><tr><th className="sticky left-0 z-20 min-w-16 border-b border-r border-mauve-200 bg-mauve-50 px-3 py-2 text-right">Row</th>{data?.columns.map((column) => <th key={column.index} className="min-w-28 border-b border-r border-mauve-200 px-3 py-2 text-center font-mono">{column.label}</th>)}</tr></thead>
        <tbody>{data?.rows.map((row) => <tr key={row.row}><th className="sticky left-0 border-b border-r border-mauve-200 bg-mauve-50 px-3 py-2 text-right font-mono text-mauve-500">{row.row}</th>{row.cells.map((cell) => <td key={cell.coordinate} className="max-w-48 border-b border-r border-mauve-100 p-0 text-right tabular-nums"><button type="button" onClick={() => onAudit(data.sheet.id, cell.coordinate)} title={`Audit ${data.sheet.name}!${cell.coordinate} · ${cell.format.code}`} className="min-h-9 w-full truncate px-3 py-2 text-right hover:bg-[#792a62]/5 hover:text-[#792a62]">{formatExplorerCell(cell.value, cell.format)}</button></td>)}</tr>)}</tbody>
      </table>
    </div>
    {data ? <p className="mt-3 font-mono text-[10px] text-mauve-500">Rows {data.range.startRow}–{data.range.endRow} · Columns {columnLabel(data.range.startColumn)}–{columnLabel(data.range.endColumn)} · Used range {data.sheet.rows}×{data.sheet.columns}</p> : null}
  </div>
}

function AuditPanel({ sheetId, cell, onExplore, scenarioRequest }: { sheetId: string; cell: string; onExplore: (sheetId: string, row: number, column: number) => void; scenarioRequest?: unknown }) {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/model/audit?sheet=${encodeURIComponent(sheetId)}&cell=${encodeURIComponent(cell)}`, scenarioRequest ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(scenarioRequest), signal: controller.signal } : { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body?.error?.message ?? 'Audit lookup failed.')
        setData(body as AuditResponse)
        setState('ready')
      })
      .catch((error) => { if (error instanceof Error && error.name !== 'AbortError') setState('error') })
    return () => controller.abort()
  }, [sheetId, cell, scenarioRequest])
  return <div className="space-y-4 p-5 lg:p-6">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Cell audit</h2><p className="mt-1 font-mono text-xs text-mauve-500">{data?.provenance.sourceCoordinate ?? `${sheetId}!${cell}`}</p></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${state === 'ready' ? 'bg-emerald-50 text-emerald-700' : state === 'loading' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{state}</span></div>
    {data ? <>
      <section className="rounded-2xl border border-mauve-200 bg-[#fbfafb] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-mauve-500">Typed value</p><p className="mt-2 text-2xl font-semibold">{formatExplorerCell(data.value, data.format)}</p><p className="mt-1 font-mono text-[10px] text-mauve-500">{data.value.type} · {data.format?.code ?? 'General'}</p></section>
      <section className="rounded-2xl border border-mauve-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-mauve-500">Formula provenance</p>{data.formula ? <><code className="mt-3 block overflow-x-auto rounded-xl bg-[#17232b] p-3 text-xs text-white">={data.formula.template}</code><dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><dt className="text-mauve-500">Family</dt><dd className="mt-1 font-mono">{data.formula.familyId}</dd></div><div><dt className="text-mauve-500">Family cells</dt><dd className="mt-1 font-mono">{data.formula.familyCellCount.toLocaleString()}</dd></div><div><dt className="text-mauve-500">Template origin</dt><dd className="mt-1 font-mono">{columnLabel(data.formula.templateOrigin.column)}{data.formula.templateOrigin.row}</dd></div><div><dt className="text-mauve-500">Digest</dt><dd className="mt-1 truncate font-mono" title={data.formula.digest}>{data.formula.digest}</dd></div></dl></> : <p className="mt-3 text-sm text-mauve-500">Seed/input cell — no formula family.</p>}</section>
      <section className="rounded-2xl border border-mauve-200 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-mauve-500">Direct precedents</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{data.provenance.directReferenceCount} references · {data.provenance.referencedCellCount.toLocaleString()} cells</span></div>{data.precedents.length ? <ul className="mt-3 space-y-2">{data.precedents.map((precedent) => <li key={`${precedent.sheetId}:${precedent.start.coordinate}:${precedent.end.coordinate}`}><button type="button" onClick={() => onExplore(precedent.sheetId, precedent.start.row, precedent.start.column)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-mauve-50 px-3 text-left text-xs hover:bg-[#792a62]/5"><span><span className="font-semibold">{precedent.sheetName}</span><span className="ml-2 font-mono text-mauve-500">{precedent.start.coordinate}{precedent.kind === 'range' ? `:${precedent.end.coordinate}` : ''}</span></span><span className="text-mauve-500">{precedent.cellCount.toLocaleString()} cell{precedent.cellCount === 1 ? '' : 's'} →</span></button></li>)}</ul> : <p className="mt-3 text-sm text-mauve-500">No direct cell references.</p>}</section>
    </> : null}
    {state === 'error' ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">The selected cell audit could not be loaded.</p> : null}
  </div>
}

function formatExplorerCell(value: ExplorerResponse['rows'][number]['cells'][number]['value'], format?: ExplorerResponse['rows'][number]['cells'][number]['format']): string {
  if (value.type === 'number' && typeof value.value === 'number') {
    if (format?.kind === 'date') return formatExcelDate(value.value, format.code)
    if (format?.kind === 'percent') return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: decimalPlaces(format.code, 2) }).format(value.value)
    if (format?.kind === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimalPlaces(format.code, 0), maximumFractionDigits: decimalPlaces(format.code, 0) }).format(value.value)
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimalPlaces(format?.code ?? '', 6) }).format(value.value)
  }
  if (value.type === 'error') return value.code ?? '#ERROR!'
  if (value.value === undefined) return ''
  return String(value.value)
}

const decimalPlaces = (code: string, fallback: number): number => Math.min(6, code.match(/0\.([0#]+)/)?.[1].length ?? fallback)
const formatExcelDate = (serial: number, code: string): string => {
  const date = new Date(Date.UTC(1899, 11, 30 + serial))
  const lowered = code.toLowerCase()
  const options: Intl.DateTimeFormatOptions = lowered.includes('d')
    ? { month: lowered.includes('mmmm') ? 'long' : lowered.includes('mmm') ? 'short' : 'numeric', day: 'numeric', year: lowered.includes('yy') ? 'numeric' : undefined, timeZone: 'UTC' }
    : { month: lowered.includes('mmmm') ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' }
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

export default function FundModelPage() {
  const [assumptions, setAssumptions] = useState(defaults)
  const [step, setStep] = useState<Step>('assumptions')
  const [validated, setValidated] = useState(false)
  const [issues, setIssues] = useState<string[]>([])
  const [showSources, setShowSources] = useState(false)
  const [annual, setAnnual] = useState(true)
  const [runState, setRunState] = useState<'idle' | 'running' | 'complete' | 'error'>('idle')
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [runError, setRunError] = useState('')
  const [selectedSheet, setSelectedSheet] = useState(WORKBOOK_SHEETS[0].id)
  const [auditTarget, setAuditTarget] = useState({ sheetId: WORKBOOK_SHEETS[0].id as string, cell: 'E41' })
  const [explorerTarget, setExplorerTarget] = useState<Readonly<{ row: number; column: number }> | undefined>()
  const [scenarioNotice, setScenarioNotice] = useState('Scenario changes save automatically on this device.')
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(SCENARIO_STORAGE_KEY)
    if (!saved) return
    queueMicrotask(() => {
      try {
        setAssumptions(parseScenarioDocument(saved).inputs)
        setScenarioNotice('Restored the last local scenario. Revalidate before calculation.')
      } catch {
        window.localStorage.removeItem(SCENARIO_STORAGE_KEY)
        setScenarioNotice('Ignored an incompatible local scenario and restored workbook defaults.')
      }
    })
  }, [])

  useEffect(() => {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(createScenarioDocument(assumptions)))
  }, [assumptions])
  const scenarioRequest = useMemo(() => runResult?.sourceMode === 'recalculated-scenario'
    ? { scenarioId: 'web-default', lockedDate: '2025-03-01', inputs: modelInputs(assumptions) }
    : undefined, [assumptions, runResult?.sourceMode])

  const unlocked = (() => {
    const value = new Set<Step>(['assumptions'])
    if (validated) {
      value.add('validate')
      value.add('calculate')
    }
    if (runState === 'complete' && runResult?.current) {
      value.add('results')
      value.add('explorer')
      value.add('audit')
    }
    return value
  })()

  const selectStep = (nextStep: Step) => {
    if (unlocked.has(nextStep)) setStep(nextStep)
  }

  const workflowProgress = runState === 'complete' ? 100 : runState === 'running' ? 58 : validated ? 34 : 17
  const workflowLabel = runState === 'complete'
    ? 'Calculation and critical checks passed — Results, Explorer, and Audit are unlocked.'
    : runState === 'running'
      ? 'Calculating affected workbook cells — downstream views remain locked until checks pass.'
      : validated
        ? 'Inputs passed validation — calculate the model to unlock Explorer.'
        : 'Complete the assumptions and run validation to continue.'

  const edit = (key: keyof Assumptions, value: string) => {
    setAssumptions((current) => ({ ...current, [key]: value }))
    setValidated(false)
    setIssues([])
    setRunState('idle')
    setRunResult(null)
    setRunError('')
    setStep('assumptions')
  }

  const exportScenario = () => {
    const blob = new Blob([`${JSON.stringify(createScenarioDocument(assumptions), null, 2)}\n`], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'real-estate-fund-scenario.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setScenarioNotice('Scenario JSON exported. This is an input file, not the final XLSX export.')
  }

  const importScenario = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const document = parseScenarioDocument(await file.text())
      setAssumptions(document.inputs)
      setValidated(false)
      setIssues([])
      setRunState('idle')
      setRunResult(null)
      setRunError('')
      setStep('assumptions')
      setScenarioNotice(`Imported ${file.name}. Validate and recalculate before viewing results.`)
    } catch (error) {
      setScenarioNotice(error instanceof Error ? error.message : 'Scenario import failed.')
    }
  }

  const runValidation = () => {
    const nextIssues = validate(assumptions)
    setIssues(nextIssues)
    setValidated(nextIssues.length === 0)
    setStep('validate')
  }

  const calculate = async () => {
    const nextIssues = validate(assumptions)
    if (nextIssues.length) {
      setIssues(nextIssues)
      setValidated(false)
      setStep('validate')
      return
    }
    setRunState('running')
    setRunError('')
    setStep('calculate')
    try {
      const inputs = modelInputs(assumptions)
      const response = await fetch('/api/model/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenarioId: 'web-default', lockedDate: '2025-03-01', inputs }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error?.message ?? 'The model run failed.')
      const result = body as RunResult
      setRunResult(result)
      if (!result.current || result.status !== 'valid') {
        const failed = result.checks.filter((check) => check.severity === 'critical' && check.status === 'fail').map((check) => check.label)
        setRunState('error')
        setRunError(`Results remain locked because critical checks failed${failed.length ? `: ${failed.join('; ')}` : '.'}`)
        setStep('calculate')
        return
      }
      setRunState('complete')
      setStep('results')
    } catch (error) {
      setRunState('error')
      setRunError(error instanceof Error ? error.message : 'The model run failed.')
    }
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-mauve-200 bg-[#17232b] text-white lg:flex lg:min-h-dvh lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Decure Solutions</p>
          <p className="mt-1 font-semibold">Investment Fund Model</p>
        </div>
        <div className="px-4 py-4">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">Workbook sheets</p>
          <nav className="mt-3 space-y-1" aria-label="Workbook sheets">
            {WORKBOOK_SHEETS.map((sheet, index) => (
              <button
                key={sheet.id}
                disabled={index > 0 && !unlocked.has('explorer')}
                onClick={() => { setSelectedSheet(sheet.id); setExplorerTarget(undefined); selectStep(index === 0 ? 'assumptions' : 'explorer') }}
                className={`flex min-h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-xs ${
                  (index === 0 && step === 'assumptions') || (index > 0 && step === 'explorer')
                    ? 'bg-[#792a62] text-white'
                    : index === 0 || unlocked.has('explorer') ? 'text-white/80 hover:bg-white/10' : 'text-white/45'
                }`}
                title={index > 0 ? 'Complete assumptions and calculation to unlock' : undefined}
              >
                <span className="w-5 font-mono text-[10px]">{String(index + 1).padStart(2, '0')}</span>
                <span>{sheet.name}</span>
                {index > 0 ? <span className="ml-auto">⌕</span> : null}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-4 text-xs text-white/55">
          <p>Model engine scaffold v0.1.0</p>
          <p className="mt-1">Financial outputs locked</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-mauve-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 lg:px-6">
            <Link href="/#asset-management-expertise" className="grid size-11 place-items-center rounded-full border border-mauve-200" aria-label="Back to portfolio">
              ←
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Investment Fund Model</p>
              <p className="text-[11px] text-mauve-500">Exact workbook engine · locked date 2025-03-01</p>
            </div>
            <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${runState === 'complete' ? 'bg-emerald-50 text-emerald-800' : runState === 'running' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>{runState === 'complete' ? 'Current' : runState === 'running' ? 'Calculating' : 'Inputs required'}</span>
          </div>
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-[10px] font-medium text-amber-900 lg:px-6"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><span><strong>Preview build:</strong> exact default snapshot + 7 trusted controls. Final availability follows 169/169 recalculation, XLSX round trip, and iPhone/desktop evidence.</span><InfoDisclosure label="About preview availability">This early Vercel candidate is for iterative review. It must not be represented as the final client-facing model until every listed release gate passes.</InfoDisclosure></div></div>
          <div className="overflow-x-auto border-t border-mauve-100 px-3 py-2 [scrollbar-width:none] lg:flex lg:justify-center">
            <Stepper active={step} unlocked={unlocked} onSelect={selectStep} />
          </div>
          <div className="border-t border-mauve-100 bg-[#fbfafb] px-4 py-2 lg:px-6" aria-live="polite">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${runState === 'complete' ? 'bg-emerald-100 text-emerald-700' : runState === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {runState === 'complete' ? '✓' : runState === 'running' ? <span className="block size-3 animate-spin rounded-full border-2 border-blue-700 border-r-transparent" /> : '!'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-mauve-200" role="progressbar" aria-label="Workbook workflow progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={workflowProgress}>
                  <div className={`h-full rounded-full transition-[width] duration-500 ${runState === 'complete' ? 'bg-emerald-600' : runState === 'running' ? 'animate-pulse bg-blue-600' : 'bg-amber-500'}`} style={{ width: `${workflowProgress}%` }} />
                </div>
                <p className="mt-1 truncate text-[10px] font-medium text-mauve-600 sm:text-xs">{workflowLabel}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-mauve-500">{workflowProgress}%</span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 pb-28 lg:p-6 lg:pb-10">
          <div className={`mb-5 rounded-2xl border p-4 ${runState === 'complete' ? 'border-emerald-200 bg-emerald-50' : runState === 'error' ? 'border-red-200 bg-red-50' : validated ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`} role="status">
            <div className="flex items-start gap-3">
              <span className="text-lg">{runState === 'complete' ? '✓' : runState === 'running' ? '◌' : '!'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{runState === 'complete' ? 'Calculation current · critical engine gates passed' : runState === 'running' ? 'Calculating the affected workbook dependency graph' : runState === 'error' ? 'Calculation failed' : validated ? 'Inputs validated · ready to calculate' : 'Results locked'}</p>
                <p className="mt-1 text-xs text-mauve-600">
                  {runState === 'complete'
                    ? `${runResult?.sourceMode === 'exact-source-snapshot' ? 'Exact source snapshot' : 'Recalculated scenario'} completed in ${Math.round(runResult?.timings.totalMs ?? 0)} ms.`
                    : runState === 'running'
                      ? 'Charts and results remain stale and locked until calculation and critical checks finish.'
                      : runState === 'error'
                        ? runError
                        : validated ? 'Run the full model to unlock current results and the sheet explorer.' : 'Complete and validate Fund Assumptions before the full model can calculate.'}
                </p>
                {validated && runState !== 'running' && runState !== 'complete' ? <button onClick={calculate} className="mt-3 min-h-11 rounded-full bg-[#792a62] px-5 text-sm font-semibold text-white">Calculate Full Model →</button> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="overflow-hidden rounded-3xl border border-mauve-200 bg-white shadow-sm" aria-labelledby="assumptions-heading">
              <div className="border-b border-mauve-200 p-5 lg:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#792a62]">Step {steps.findIndex((item) => item.id === step) + 1} of 6</p>
                <h1 id="assumptions-heading" className="mt-2 text-2xl font-semibold tracking-tight lg:text-3xl">{steps.find((item) => item.id === step)?.label}</h1>
                <p className="mt-2 max-w-2xl text-sm/6 text-mauve-600">
                  {runState === 'complete' ? 'Current outputs are tied to exact workbook coordinates and remain valid until an assumption changes.' : 'Configure workbook-derived fund, fee, capital, and strategy drivers. Source coordinates are visible for auditability.'}
                </p>
              </div>

              {step === 'results' && runResult ? <ResultsPanel result={runResult} onOpenSheet={(sheetId) => { setSelectedSheet(sheetId as typeof selectedSheet); setExplorerTarget(undefined); setStep('explorer') }} /> : step === 'explorer' ? <ExplorerPanel key={`${selectedSheet}:${explorerTarget?.row ?? 1}:${explorerTarget?.column ?? 1}`} sheetId={selectedSheet} initialCell={explorerTarget} scenarioRequest={scenarioRequest} onSelectSheet={(sheetId) => { setSelectedSheet(sheetId as typeof selectedSheet); setExplorerTarget(undefined) }} onAudit={(sheetId, cell) => { setAuditTarget({ sheetId, cell }); setStep('audit') }} /> : step === 'audit' ? <AuditPanel key={`${auditTarget.sheetId}:${auditTarget.cell}`} sheetId={auditTarget.sheetId} cell={auditTarget.cell} scenarioRequest={scenarioRequest} onExplore={(sheetId, row, column) => { setSelectedSheet(sheetId as typeof selectedSheet); setExplorerTarget({ row, column }); setStep('explorer') }} /> : <form className="divide-y divide-mauve-100" onSubmit={(event) => { event.preventDefault(); runValidation() }}>
                <div className="p-5 lg:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div><div className="flex items-center gap-2"><h2 className="font-semibold">Workbook source controls</h2><InfoDisclosure label="About input availability">Seven controls recalculate outside the undefined source cycle. The other 162 are visible but locked until their circular dependency behavior is independently solved and verified.</InfoDisclosure></div><p className="mt-1 text-xs text-mauve-500">169 source cells · 7 trusted recalculation controls · 162 locked at the source circularity boundary.</p></div>
                    <button type="button" onClick={() => setShowSources((value) => !value)} className="min-h-11 rounded-full px-3 text-xs font-semibold text-[#792a62] hover:bg-mauve-50">
                      {showSources ? 'Hide sources' : 'Show sources'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {inputGroups.map((group, groupIndex) => {
                      const fields = fieldMeta.filter((field) => field.definition.group === group.id)
                      return <details key={group.id} open={groupIndex < 3 ? true : undefined} className="group rounded-2xl border border-mauve-200 bg-[#fbfafb]">
                        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 marker:content-none">
                          <span className="grid size-7 place-items-center rounded-full bg-mauve-100 text-xs font-bold text-[#792a62] group-open:rotate-90">›</span>
                          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{group.label}</span><span className="block text-xs text-mauve-500">{group.description}</span></span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-mauve-600">{fields.length} cells</span>
                        </summary>
                        <div className="grid gap-4 border-t border-mauve-200 p-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <label key={field.key} className="block rounded-2xl border border-mauve-200 bg-white p-4 focus-within:border-[#792a62] focus-within:ring-2 focus-within:ring-[#792a62]/10">
                        <span className="flex items-start justify-between gap-3 text-sm font-semibold">
                          {field.label}
                          <span className="text-[10px] font-medium uppercase tracking-wide text-mauve-400">{field.unit}</span>
                        </span>
                        <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${field.definition.recalculation === 'trusted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{field.definition.recalculation === 'trusted' ? 'Trusted recalculation' : 'Locked · source circularity'}</span>
                        {field.definition.valueType === 'enum' ? (
                          <select disabled={field.definition.recalculation !== 'trusted'} value={assumptions[field.key]} onChange={(event) => edit(field.key, event.target.value)} className="mt-3 min-h-11 w-full rounded-xl border border-mauve-200 bg-white px-3 text-base outline-none focus:border-[#792a62] disabled:cursor-not-allowed disabled:bg-mauve-50 disabled:text-mauve-500">
                            {field.definition.options?.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input
                            disabled={field.definition.recalculation !== 'trusted'}
                            value={assumptions[field.key]}
                            onChange={(event) => edit(field.key, event.target.value)}
                            inputMode={field.inputMode}
                            className="mt-3 min-h-11 w-full rounded-xl border border-mauve-200 bg-white px-3 text-base outline-none focus:border-[#792a62] disabled:cursor-not-allowed disabled:bg-mauve-50 disabled:text-mauve-500"
                          />
                        )}
                        {showSources ? <span className="mt-2 block font-mono text-[10px] text-mauve-500">{field.source}</span> : null}
                      </label>
                    ))}
                        </div>
                      </details>
                    })}
                  </div>
                </div>

                <div className="p-5 lg:p-6">
                  {runResult ? (
                    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {outputMeta.map((item) => {
                        const output = runResult.outputs[item.id]
                        return (
                          <article key={item.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <p className="text-xs font-semibold text-mauve-600">{item.label}</p>
                            <p className="mt-2 text-xl font-semibold tracking-tight text-[#17232b]">{formatOutput(output, item.format)}</p>
                            <p className="mt-2 font-mono text-[10px] text-mauve-500">{output ? `${output.source.sheet}!${columnLabel(output.source.column)}${output.source.row}` : 'Source unavailable'}</p>
                          </article>
                        )
                      })}
                    </div>
                  ) : null}
                  <h2 className="font-semibold">Workbook detail preview</h2>
                  <p className="mt-1 text-xs text-mauve-500">Annual rows are the default. Monthly expansion is presentation-only.</p>
                  <div className="mt-4 flex rounded-xl border border-mauve-200 bg-mauve-50 p-1 text-xs font-semibold">
                    <button type="button" onClick={() => setAnnual(true)} className={`min-h-11 flex-1 rounded-lg ${annual ? 'bg-[#792a62] text-white' : 'text-mauve-600'}`}>Annual</button>
                    <button type="button" onClick={() => setAnnual(false)} className={`min-h-11 flex-1 rounded-lg ${!annual ? 'bg-[#792a62] text-white' : 'text-mauve-600'}`}>Expand monthly</button>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-mauve-200">
                    <table className="min-w-[620px] w-full text-left text-xs">
                      <thead className="bg-mauve-50 text-mauve-600">
                        <tr><th className="sticky left-0 bg-mauve-50 px-3 py-3">Schedule row</th>{(annual ? ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']).map((period) => <th key={period} className="px-3 py-3 text-right">{period}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-mauve-100 text-mauve-500">
                        {['› Contributions', '› Investments', '› Net distributions', '› NAV roll-forward'].map((row) => (
                          <tr key={row}><th className="sticky left-0 bg-white px-3 py-3 font-medium text-mauve-700">{row}</th>{(annual ? [1,2,3,4,5] : [1,2,3,4,5,6]).map((cell) => <td key={cell} className="px-3 py-3 text-right">{runResult ? 'Available in explorer' : 'Locked'}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="hidden items-center justify-between gap-4 bg-mauve-50 p-5 lg:flex lg:p-6">
                  <div className="flex gap-2">
                    {step !== 'assumptions' ? <button type="button" onClick={() => selectStep('assumptions')} className="min-h-11 rounded-full border border-mauve-200 bg-white px-4 text-sm font-semibold text-mauve-700">← Back to Inputs</button> : null}
                    <button type="button" onClick={() => { setAssumptions(defaults); setValidated(false); setRunResult(null); setRunState('idle'); setStep('assumptions') }} className="min-h-11 rounded-full px-4 text-sm font-semibold text-mauve-600 hover:bg-white">Reset defaults</button>
                  </div>
                  {validated ? <button type="button" onClick={calculate} disabled={runState === 'running'} className="min-h-11 rounded-full bg-[#792a62] px-6 text-sm font-semibold text-white hover:bg-[#63214f] disabled:opacity-60">{runState === 'running' ? 'Calculating…' : 'Calculate Full Model →'}</button> : <button type="submit" className="min-h-11 rounded-full bg-[#792a62] px-6 text-sm font-semibold text-white hover:bg-[#63214f]">Validate Inputs →</button>}
                </div>
              </form>}
            </section>

            <aside className="space-y-5">
              <section className="rounded-3xl border border-mauve-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><h2 className="font-semibold">Validation</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${issues.length ? 'bg-red-50 text-red-700' : validated ? 'bg-emerald-50 text-emerald-700' : 'bg-mauve-100 text-mauve-600'}`}>{issues.length ? `${issues.length} errors` : validated ? 'Passed' : 'Not run'}</span></div>
                {issues.length ? <ul className="mt-4 space-y-3 text-sm text-red-700">{issues.map((issue) => <li key={issue} className="rounded-xl bg-red-50 p-3">{issue}</li>)}</ul> : <p className="mt-3 text-sm/6 text-mauve-500">Validation checks required fields, property count, leverage, fund term, and capital commitments before the engine can run.</p>}
              </section>
              <section className="rounded-3xl border border-mauve-200 bg-white p-5 shadow-sm" aria-labelledby="scenario-file-heading">
                <div className="flex items-center gap-2"><h2 id="scenario-file-heading" className="font-semibold">Scenario file</h2><InfoDisclosure label="About scenario files">Scenario JSON stores all 169 input values with the workbook source hash. Import always invalidates prior results. Native XLSX export remains a separate final-release gate.</InfoDisclosure></div>
                <p className="mt-2 text-xs/5 text-mauve-500" aria-live="polite">{scenarioNotice}</p>
                <input ref={importInput} type="file" accept="application/json,.json" onChange={importScenario} className="sr-only" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => importInput.current?.click()} className="min-h-11 rounded-full border border-mauve-200 px-3 text-xs font-semibold text-mauve-700">Import JSON</button>
                  <button type="button" onClick={exportScenario} className="min-h-11 rounded-full bg-[#17232b] px-3 text-xs font-semibold text-white">Export JSON</button>
                </div>
              </section>
              <section className="rounded-3xl border border-mauve-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">Institutional checks</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {(runResult?.checks ?? [
                    { id: 'parity', label: 'Workbook parity', status: 'locked' },
                    { id: 'dependency', label: 'Dependency graph', status: 'locked' },
                    { id: 'errors', label: 'Formula errors', status: 'locked' },
                    { id: 'exclusions', label: 'Exclusion ledger', status: 'locked' },
                  ]).map((check) => <li key={check.id} className="flex items-center justify-between gap-3"><span>{check.label}</span><span className={`text-xs font-semibold ${check.status === 'pass' ? 'text-emerald-700' : check.status === 'fail' ? 'text-red-700' : 'text-mauve-400'}`}>{check.status === 'pass' ? 'Passed' : check.status === 'fail' ? 'Failed' : 'Locked'}</span></li>)}
                </ul>
              </section>
            </aside>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-mauve-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="flex gap-2">
            {step !== 'assumptions' ? <button onClick={() => selectStep('assumptions')} className="min-h-12 rounded-full border border-mauve-200 bg-white px-4 text-sm font-semibold text-mauve-700" aria-label="Back to assumptions">←</button> : null}
            <button disabled={runState === 'running'} onClick={validated ? calculate : runValidation} className="min-h-12 flex-1 rounded-full bg-[#792a62] px-5 text-sm font-semibold text-white shadow-lg shadow-[#792a62]/20 disabled:opacity-60">{runState === 'running' ? 'Calculating…' : validated ? 'Calculate Full Model →' : 'Validate Inputs →'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
