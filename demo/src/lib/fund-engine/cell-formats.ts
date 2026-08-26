export type CellFormatKind = 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text'
export type CellFormat = Readonly<{ numFmtId: number; code: string; kind: CellFormatKind }>
export type CellFormatRun = Readonly<{ startColumn: number; endColumn: number; style: number }>
export type CellFormatIndex = Readonly<{
  sheets: readonly string[]
  styles: readonly CellFormat[]
  rows: ReadonlyMap<string, readonly CellFormatRun[]>
  runCount: number
}>

const HEADER_BYTES = 16

export const decodeCellFormats = (bytes: Uint8Array): CellFormatIndex => {
  if (bytes.byteLength < HEADER_BYTES) throw new Error('Cell-format artifact is shorter than its header')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (magic !== 'RFMT') throw new Error(`Invalid cell-format artifact magic ${magic}`)
  const version = view.getUint32(4, true)
  if (version !== 1) throw new Error(`Unsupported cell-format artifact version ${version}`)
  const runCount = view.getUint32(8, true)
  const metadataLength = view.getUint32(12, true)
  if (HEADER_BYTES + metadataLength + runCount * 9 !== bytes.byteLength) throw new Error('Cell-format artifact size does not match its header')
  const metadata = JSON.parse(new TextDecoder().decode(bytes.subarray(HEADER_BYTES, HEADER_BYTES + metadataLength))) as { version: number; sheets: unknown; styles: unknown }
  if (metadata.version !== version || !Array.isArray(metadata.sheets) || metadata.sheets.some((value) => typeof value !== 'string')) throw new Error('Cell-format sheet metadata is invalid')
  if (!Array.isArray(metadata.styles) || metadata.styles.some((value) => !validFormat(value))) throw new Error('Cell-format style metadata is invalid')
  const rows = new Map<string, CellFormatRun[]>()
  let offset = HEADER_BYTES + metadataLength
  for (let index = 0; index < runCount; index += 1) {
    const sheetIndex = view.getUint8(offset)
    const row = view.getUint16(offset + 1, true)
    const run = { startColumn: view.getUint16(offset + 3, true), endColumn: view.getUint16(offset + 5, true), style: view.getUint16(offset + 7, true) }
    offset += 9
    if (sheetIndex >= metadata.sheets.length || run.style >= metadata.styles.length || row < 1 || run.startColumn < 1 || run.endColumn < run.startColumn) throw new Error(`Cell-format run ${index} is invalid`)
    const key = `${sheetIndex}:${row}`
    const existing = rows.get(key)
    if (existing) existing.push(run)
    else rows.set(key, [run])
  }
  return { sheets: metadata.sheets as string[], styles: metadata.styles as CellFormat[], rows, runCount }
}

export const formatForCell = (index: CellFormatIndex, sheetName: string, row: number, column: number): CellFormat => {
  const sheetIndex = index.sheets.indexOf(sheetName)
  const fallback = index.styles[0] ?? { numFmtId: 0, code: 'General', kind: 'general' as const }
  if (sheetIndex < 0) return fallback
  const runs = index.rows.get(`${sheetIndex}:${row}`)
  if (!runs) return fallback
  let low = 0
  let high = runs.length - 1
  while (low <= high) {
    const middle = (low + high) >>> 1
    const run = runs[middle]
    if (column < run.startColumn) high = middle - 1
    else if (column > run.endColumn) low = middle + 1
    else return index.styles[run.style] ?? fallback
  }
  return fallback
}

const validFormat = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return Number.isInteger(item.numFmtId) && typeof item.code === 'string' && ['general', 'number', 'currency', 'percent', 'date', 'text'].includes(String(item.kind))
}
