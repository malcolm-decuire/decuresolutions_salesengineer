import type { ModelGrid } from './grid'
import { sourceSheetId } from './formula-regions'
import type { CellErrorCode, CellValue } from './types'

export type SourceBaselineManifest = Readonly<{
  version: number
  recordCount: number
  sheetNames: readonly string[]
  uniqueStringCount: number
}>

const MAGIC = 'RFMB'
const HEADER_BYTES = 16

export const hydrateSourceBaseline = (grid: ModelGrid, bytes: Uint8Array): SourceBaselineManifest => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (bytes.byteLength < HEADER_BYTES) throw new Error('Source baseline is shorter than its header')
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  if (magic !== MAGIC) throw new Error(`Invalid source baseline magic ${magic}`)
  const version = view.getUint32(4, true)
  if (version !== 1) throw new Error(`Unsupported source baseline version ${version}`)
  const recordCount = view.getUint32(8, true)
  const metadataLength = view.getUint32(12, true)
  if (HEADER_BYTES + metadataLength > bytes.byteLength) throw new Error('Source baseline metadata exceeds the artifact bounds')
  const metadata = JSON.parse(new TextDecoder().decode(bytes.subarray(HEADER_BYTES, HEADER_BYTES + metadataLength))) as {
    version: number
    sheetNames: unknown
    stringValues: unknown
  }
  if (metadata.version !== version) throw new Error('Source baseline metadata version does not match its header')
  if (!Array.isArray(metadata.sheetNames) || metadata.sheetNames.some((value) => typeof value !== 'string')) {
    throw new Error('Source baseline contains invalid sheet metadata')
  }
  if (!Array.isArray(metadata.stringValues) || metadata.stringValues.some((value) => typeof value !== 'string')) {
    throw new Error('Source baseline contains invalid string-table metadata')
  }

  const sheetNames = metadata.sheetNames as string[]
  const stringValues = metadata.stringValues as string[]
  let offset = HEADER_BYTES + metadataLength
  for (let index = 0; index < recordCount; index += 1) {
    if (offset + 6 > bytes.byteLength) throw new Error(`Source baseline record ${index} exceeds the artifact bounds`)
    const sheetIndex = view.getUint8(offset)
    const row = view.getUint16(offset + 1, true)
    const column = view.getUint16(offset + 3, true)
    const tag = view.getUint8(offset + 5)
    offset += 6
    const sheetName = sheetNames[sheetIndex]
    if (sheetName === undefined) throw new Error(`Source baseline record ${index} references unknown sheet index ${sheetIndex}`)
    let value: CellValue
    if (tag === 0) value = { type: 'blank' }
    else if (tag === 1) {
      if (offset + 8 > bytes.byteLength) throw new Error(`Source baseline numeric record ${index} exceeds the artifact bounds`)
      value = { type: 'number', value: view.getFloat64(offset, true) }
      offset += 8
    } else if (tag === 2 || tag === 3) value = { type: 'boolean', value: tag === 3 }
    else if (tag === 4 || tag === 5) {
      if (offset + 4 > bytes.byteLength) throw new Error(`Source baseline string record ${index} exceeds the artifact bounds`)
      const stringIndex = view.getUint32(offset, true)
      offset += 4
      const raw = stringValues[stringIndex]
      if (raw === undefined) throw new Error(`Source baseline record ${index} references unknown string index ${stringIndex}`)
      value = tag === 4 ? { type: 'string', value: raw } : { type: 'error', code: raw as CellErrorCode }
    } else throw new Error(`Source baseline record ${index} has unknown value tag ${tag}`)
    grid.set({ sheet: sourceSheetId(sheetName), row, column }, value)
  }
  if (offset !== bytes.byteLength) throw new Error(`Source baseline contains ${bytes.byteLength - offset} trailing bytes`)
  return { version, recordCount, sheetNames, uniqueStringCount: stringValues.length }
}
