import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { TypedModelGrid, type ModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import { seedWorkbookGrid } from './seed'
import { hydrateSourceBaseline, type SourceBaselineManifest } from './source-baseline'

export const SOURCE_BASELINE_FILE_MANIFEST = Object.freeze({
  version: 1,
  recordCount: 1_175_711,
  compressedBytes: 3_288_703,
  binaryBytes: 13_859_228,
  binarySha256: '27d8b55ad52df0e74a92a197cb2ade4a2406e658f421d3b2731385495ca54b77',
  compressedSha256: '6891c893c7084b9958184d675ad0518b13039fb07581745db5aa87cd117e2c8d',
})

export type SourceBaselineLoad = Readonly<{
  grid: ModelGrid
  manifest: SourceBaselineManifest
  cold: boolean
  timings: Readonly<{
    readMs: number
    verifyCompressedMs: number
    decompressMs: number
    verifyBinaryMs: number
    hydrateMs: number
    cloneMs: number
    totalMs: number
  }>
}>

let cachedBaseline: Readonly<{ grid: ModelGrid; manifest: SourceBaselineManifest }> | undefined

export const loadSourceBaselineGrid = (artifactPath = defaultArtifactPath()): SourceBaselineLoad => {
  const startedAt = performance.now()
  if (cachedBaseline) {
    const cloneStartedAt = performance.now()
    const grid = cachedBaseline.grid.clone()
    const cloneMs = performance.now() - cloneStartedAt
    return {
      grid,
      manifest: cachedBaseline.manifest,
      cold: false,
      timings: { readMs: 0, verifyCompressedMs: 0, decompressMs: 0, verifyBinaryMs: 0, hydrateMs: 0, cloneMs, totalMs: performance.now() - startedAt },
    }
  }

  const readStartedAt = performance.now()
  const compressed = readFileSync(artifactPath)
  const readMs = performance.now() - readStartedAt
  if (compressed.length !== SOURCE_BASELINE_FILE_MANIFEST.compressedBytes) throw new Error('Source baseline compressed size does not match its manifest')
  const compressedVerifyStartedAt = performance.now()
  assertSha256(compressed, SOURCE_BASELINE_FILE_MANIFEST.compressedSha256, 'compressed')
  const verifyCompressedMs = performance.now() - compressedVerifyStartedAt
  const decompressStartedAt = performance.now()
  const binary = gunzipSync(compressed)
  const decompressMs = performance.now() - decompressStartedAt
  if (binary.length !== SOURCE_BASELINE_FILE_MANIFEST.binaryBytes) throw new Error('Source baseline binary size does not match its manifest')
  const binaryVerifyStartedAt = performance.now()
  assertSha256(binary, SOURCE_BASELINE_FILE_MANIFEST.binarySha256, 'binary')
  const verifyBinaryMs = performance.now() - binaryVerifyStartedAt
  const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
  seedWorkbookGrid(grid)
  const hydrateStartedAt = performance.now()
  const manifest = hydrateSourceBaseline(grid, binary)
  const hydrateMs = performance.now() - hydrateStartedAt
  if (manifest.recordCount !== SOURCE_BASELINE_FILE_MANIFEST.recordCount) throw new Error('Source baseline record count does not match its manifest')
  cachedBaseline = { grid, manifest }
  const cloneStartedAt = performance.now()
  const clonedGrid = grid.clone()
  const cloneMs = performance.now() - cloneStartedAt
  return {
    grid: clonedGrid,
    manifest,
    cold: true,
    timings: { readMs, verifyCompressedMs, decompressMs, verifyBinaryMs, hydrateMs, cloneMs, totalMs: performance.now() - startedAt },
  }
}

export const clearSourceBaselineCacheForTests = (): void => {
  cachedBaseline = undefined
}

const defaultArtifactPath = (): string => join(process.cwd(), 'public', 'model', 'source-baseline.bin.gz')

const assertSha256 = (bytes: Uint8Array, expected: string, label: string): void => {
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== expected) throw new Error(`Source baseline ${label} SHA-256 mismatch: ${actual}`)
}
