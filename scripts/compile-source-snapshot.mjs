import { createHash } from 'node:crypto'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const [keysArgument, goldenArgument, outputArgument] = process.argv.slice(2)
if (!keysArgument || !goldenArgument || !outputArgument) {
  console.error('Usage: node scripts/compile-source-snapshot.mjs <family-keys.json> <golden.ndjson> <output.json>')
  process.exit(1)
}

const keysPath = resolve(keysArgument)
const goldenPath = resolve(goldenArgument)
const outputPath = resolve(outputArgument)
const familyKeys = JSON.parse(readFileSync(keysPath, 'utf8')).familyKeys
if (!Array.isArray(familyKeys) || familyKeys.some((key) => typeof key !== 'string')) throw new Error('Invalid snapshot family-key manifest')
const selected = new Set(familyKeys)
const records = []
const seenFamilies = new Set()
const lines = createInterface({ input: createReadStream(goldenPath, { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of lines) {
  if (!line) continue
  const record = JSON.parse(line)
  const familyKey = `${record.sheet}:${record.formulaFamilyDigest}`
  if (!selected.has(familyKey)) continue
  seenFamilies.add(familyKey)
  records.push([record.sheet, record.address, record.cached.type, record.cached.value ?? null])
}
const missing = familyKeys.filter((key) => !seenFamilies.has(key))
if (missing.length) throw new Error(`Snapshot families missing from golden oracle: ${missing.join(', ')}`)
const canonicalRecords = JSON.stringify(records)
const artifact = {
  version: 1,
  familyKeyCount: familyKeys.length,
  familyKeysSha256: sha256(`${familyKeys.join('\n')}\n`),
  recordCount: records.length,
  valuesSha256: sha256(canonicalRecords),
  records,
}
writeFileSync(outputPath, `${JSON.stringify(artifact)}\n`)
console.log(JSON.stringify({ outputPath, ...artifact, records: undefined }))

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}
