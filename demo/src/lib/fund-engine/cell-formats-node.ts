import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'

import { decodeCellFormats, type CellFormatIndex } from './cell-formats'

export const CELL_FORMAT_FILE_MANIFEST = Object.freeze({
  compressedBytes: 166_384,
  compressedSha256: 'a4b9955bf2f2654bceb24ba4e8b28f907129e2e1ec1c60405e4be99fe1a98bd2',
  binaryBytes: 707_795,
  binarySha256: 'd03089107c8e0d202b59f9d2292415c5de0c8bf65e65c7368796d713520f6fbc',
  runCount: 74_516,
  styleCount: 669,
})

let cached: CellFormatIndex | undefined

export const loadCellFormats = (artifactPath = join(process.cwd(), 'public', 'model', 'cell-formats.bin.gz')): CellFormatIndex => {
  if (cached) return cached
  const compressed = readFileSync(artifactPath)
  verify(compressed, CELL_FORMAT_FILE_MANIFEST.compressedBytes, CELL_FORMAT_FILE_MANIFEST.compressedSha256, 'compressed')
  const binary = gunzipSync(compressed)
  verify(binary, CELL_FORMAT_FILE_MANIFEST.binaryBytes, CELL_FORMAT_FILE_MANIFEST.binarySha256, 'binary')
  const index = decodeCellFormats(binary)
  if (index.runCount !== CELL_FORMAT_FILE_MANIFEST.runCount || index.styles.length !== CELL_FORMAT_FILE_MANIFEST.styleCount) throw new Error('Cell-format artifact contract mismatch')
  cached = index
  return index
}

const verify = (value: Uint8Array, expectedBytes: number, expectedHash: string, label: string) => {
  if (value.byteLength !== expectedBytes) throw new Error(`Cell-format ${label} size mismatch`)
  const hash = createHash('sha256').update(value).digest('hex')
  if (hash !== expectedHash) throw new Error(`Cell-format ${label} hash mismatch`)
}
