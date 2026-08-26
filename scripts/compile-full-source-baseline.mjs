import { createHash } from 'node:crypto'
import { createReadStream, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const [goldenArgument, outputArgument] = process.argv.slice(2)
if (!goldenArgument || !outputArgument) {
  console.error('Usage: node scripts/compile-full-source-baseline.mjs <golden.ndjson> <output.bin.gz>')
  process.exit(1)
}

const goldenPath = resolve(goldenArgument)
const outputPath = resolve(outputArgument)
const sheetIndexes = new Map()
const sheetNames = []
const records = []
const strings = new Map()
const stringValues = []

const lines = createInterface({ input: createReadStream(goldenPath, { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of lines) {
  if (!line) continue
  const source = JSON.parse(line)
  let sheetIndex = sheetIndexes.get(source.sheet)
  if (sheetIndex === undefined) {
    sheetIndex = sheetNames.length
    if (sheetIndex > 255) throw new Error('Baseline format supports at most 256 sheets')
    sheetIndexes.set(source.sheet, sheetIndex)
    sheetNames.push(source.sheet)
  }
  const match = /^([A-Z]+)(\d+)$/.exec(source.address)
  if (!match) throw new Error(`Invalid address ${source.sheet}!${source.address}`)
  const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
  const row = Number(match[2])
  if (row > 65_535 || column > 65_535) throw new Error(`Address exceeds baseline coordinate width: ${source.sheet}!${source.address}`)
  const cached = source.cached
  if (cached.type === 'number') records.push({ sheetIndex, row, column, tag: 1, value: Number(cached.value) })
  else if (cached.type === 'boolean') records.push({ sheetIndex, row, column, tag: cached.value ? 3 : 2 })
  else if (cached.type === 'string') {
    const value = String(cached.value ?? '')
    let valueIndex = strings.get(value)
    if (valueIndex === undefined) {
      valueIndex = stringValues.length
      strings.set(value, valueIndex)
      stringValues.push(value)
    }
    records.push({ sheetIndex, row, column, tag: 4, valueIndex })
  } else if (cached.type === 'error') {
    const value = String(cached.value)
    let valueIndex = strings.get(value)
    if (valueIndex === undefined) {
      valueIndex = stringValues.length
      strings.set(value, valueIndex)
      stringValues.push(value)
    }
    records.push({ sheetIndex, row, column, tag: 5, valueIndex })
  } else if (cached.type === 'blank') records.push({ sheetIndex, row, column, tag: 0 })
  else throw new Error(`Unsupported cached type ${cached.type}`)
}

const metadata = Buffer.from(JSON.stringify({ version: 1, sheetNames, stringValues }), 'utf8')
const recordBytes = records.reduce((total, record) => total + 6 + (record.tag === 1 ? 8 : record.tag >= 4 ? 4 : 0), 0)
const binary = Buffer.allocUnsafe(16 + metadata.length + recordBytes)
binary.write('RFMB', 0, 4, 'ascii')
binary.writeUInt32LE(1, 4)
binary.writeUInt32LE(records.length, 8)
binary.writeUInt32LE(metadata.length, 12)
metadata.copy(binary, 16)
let offset = 16 + metadata.length
for (const record of records) {
  binary.writeUInt8(record.sheetIndex, offset)
  binary.writeUInt16LE(record.row, offset + 1)
  binary.writeUInt16LE(record.column, offset + 3)
  binary.writeUInt8(record.tag, offset + 5)
  offset += 6
  if (record.tag === 1) {
    binary.writeDoubleLE(record.value, offset)
    offset += 8
  } else if (record.tag >= 4) {
    binary.writeUInt32LE(record.valueIndex, offset)
    offset += 4
  }
}
const compressed = gzipSync(binary, { level: 9 })
writeFileSync(outputPath, compressed)
console.log(JSON.stringify({
  outputPath,
  recordCount: records.length,
  sheetCount: sheetNames.length,
  uniqueStringCount: stringValues.length,
  binaryBytes: binary.length,
  compressedBytes: compressed.length,
  binarySha256: createHash('sha256').update(binary).digest('hex'),
  compressedSha256: createHash('sha256').update(compressed).digest('hex'),
}))
