import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const [workbookArgument, seedArgument] = process.argv.slice(2)
if (!workbookArgument || !seedArgument) {
  console.error('Usage: node scripts/audit-workbook-input-styles.mjs <workbook.xlsx> <seed.ndjson>')
  process.exit(1)
}

const workbookPath = resolve(workbookArgument)
const stylesXml = execFileSync('unzip', ['-p', workbookPath, 'xl/styles.xml'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const cellXfsBody = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1]
if (!cellXfsBody) throw new Error('Workbook styles are missing cellXfs')
const styles = [...cellXfsBody.matchAll(/<xf\b([^>]*)\/>|<xf\b([^>]*)>([\s\S]*?)<\/xf>/g)].map((match, index) => {
  const attributes = Object.fromEntries([...(match[1] ?? match[2]).matchAll(/([\w:]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]))
  const body = match[3] ?? ''
  const protection = /<protection\b([^>]*)\/>/.exec(body)?.[1] ?? ''
  const protectionAttributes = Object.fromEntries([...protection.matchAll(/([\w:]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]))
  return { index, fontId: Number(attributes.fontId ?? 0), fillId: Number(attributes.fillId ?? 0), borderId: Number(attributes.borderId ?? 0), numFmtId: Number(attributes.numFmtId ?? 0), locked: protectionAttributes.locked !== '0' }
})

const byStyle = new Map()
const lines = createInterface({ input: createReadStream(resolve(seedArgument), { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of lines) {
  if (!line) continue
  const record = JSON.parse(line)
  if (record.sheet !== 'Fund Assumptions') continue
  const values = byStyle.get(record.styleIndex) ?? []
  values.push({ address: record.address, value: record.value })
  byStyle.set(record.styleIndex, values)
}
const report = [...byStyle].map(([styleIndex, records]) => ({
  style: styles[styleIndex],
  count: records.length,
  samples: records.slice(0, 12),
})).sort((left, right) => left.style.index - right.style.index)
console.log(JSON.stringify({ styleCount: styles.length, unlockedStyleCount: styles.filter((style) => !style.locked).length, fundAssumptionStyles: report }, null, 2))
