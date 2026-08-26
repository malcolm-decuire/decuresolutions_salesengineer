import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const [workbookArgument, outputArgument] = process.argv.slice(2)
if (!workbookArgument || !outputArgument) {
  console.error('Usage: node scripts/compile-cell-formats.mjs <workbook.xlsx> <output.bin.gz>')
  process.exit(1)
}

const workbookPath = resolve(workbookArgument)
const outputPath = resolve(outputArgument)
const readEntry = (entry) => execFileSync('unzip', ['-p', workbookPath, entry], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
const decodeXml = (value) => value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&apos;', "'")
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:]+)="([^"]*)"/g)].map((match) => [match[1], decodeXml(match[2])]))
const columnNumber = (letters) => [...letters].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)

const workbookXml = readEntry('xl/workbook.xml')
const relationshipsXml = readEntry('xl/_rels/workbook.xml.rels')
const relationships = new Map([...relationshipsXml.matchAll(/<Relationship\b[^>]*\/>/g)].map((match) => {
  const value = attributes(match[0])
  return [value.Id, value.Target]
}))
const sheets = [...workbookXml.matchAll(/<sheet\b[^>]*\/>/g)].map((match) => {
  const value = attributes(match[0])
  return { name: value.name, entry: `xl/${relationships.get(value['r:id'])}` }
})

const stylesXml = readEntry('xl/styles.xml')
const customFormats = new Map([...stylesXml.matchAll(/<numFmt\b[^>]*\/>/g)].map((match) => {
  const value = attributes(match[0])
  return [Number(value.numFmtId), value.formatCode]
}))
const cellXfsBody = stylesXml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1]
if (!cellXfsBody) throw new Error('Workbook styles are missing cellXfs')
const styleFormats = [...cellXfsBody.matchAll(/<xf\b[^>]*(?:\/>|>)/g)].map((match) => {
  const value = attributes(match[0])
  const numFmtId = Number(value.numFmtId ?? 0)
  const code = customFormats.get(numFmtId) ?? builtinFormat(numFmtId)
  return { numFmtId, code, kind: classifyFormat(numFmtId, code) }
})

const runs = []
for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex += 1) {
  const xml = readEntry(sheets[sheetIndex].entry)
  let active = null
  for (const match of xml.matchAll(/<c\b([^>]*)>/g)) {
    const value = attributes(`<c ${match[1]}>`)
    const address = /^([A-Z]+)(\d+)$/.exec(value.r ?? '')
    if (!address) continue
    const row = Number(address[2])
    const column = columnNumber(address[1])
    const style = Number(value.s ?? 0)
    if (row > 65_535 || column > 65_535 || style > 65_535) throw new Error(`Cell format address exceeds binary bounds: ${sheets[sheetIndex].name}!${value.r}`)
    if (active && active.sheetIndex === sheetIndex && active.row === row && active.endColumn + 1 === column && active.style === style) active.endColumn = column
    else {
      active = { sheetIndex, row, startColumn: column, endColumn: column, style }
      runs.push(active)
    }
  }
}

const metadata = Buffer.from(JSON.stringify({ version: 1, sheets: sheets.map((sheet) => sheet.name), styles: styleFormats }), 'utf8')
const binary = Buffer.allocUnsafe(16 + metadata.length + runs.length * 9)
binary.write('RFMT', 0, 4, 'ascii')
binary.writeUInt32LE(1, 4)
binary.writeUInt32LE(runs.length, 8)
binary.writeUInt32LE(metadata.length, 12)
metadata.copy(binary, 16)
let offset = 16 + metadata.length
for (const run of runs) {
  binary.writeUInt8(run.sheetIndex, offset)
  binary.writeUInt16LE(run.row, offset + 1)
  binary.writeUInt16LE(run.startColumn, offset + 3)
  binary.writeUInt16LE(run.endColumn, offset + 5)
  binary.writeUInt16LE(run.style, offset + 7)
  offset += 9
}
const compressed = gzipSync(binary, { level: 9 })
writeFileSync(outputPath, compressed)
console.log(JSON.stringify({ outputPath, runCount: runs.length, styleCount: styleFormats.length, binaryBytes: binary.length, compressedBytes: compressed.length, binarySha256: sha256(binary), compressedSha256: sha256(compressed) }))

function sha256(value) { return createHash('sha256').update(value).digest('hex') }
function builtinFormat(id) {
  const formats = { 0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 14: 'm/d/yy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'm/d/yy h:mm', 37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)', 49: '@' }
  return formats[id] ?? 'General'
}
function classifyFormat(id, code) {
  const normalized = code.replaceAll(/"[^"]*"/g, '').replaceAll(/\\./g, '').toLowerCase()
  if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47) || /(^|[^a-z])[dmyhs]+([^a-z]|$)/.test(normalized)) return 'date'
  if (normalized.includes('%')) return 'percent'
  if (/[$€£¥]|\[\$/.test(code)) return 'currency'
  if (id === 49 || code === '@') return 'text'
  if (/[0#?]/.test(code)) return 'number'
  return 'general'
}
