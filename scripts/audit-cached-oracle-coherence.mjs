import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'

const [formulaArgument, goldenArgument] = process.argv.slice(2)
if (!formulaArgument || !goldenArgument) {
  console.error('Usage: node scripts/audit-cached-oracle-coherence.mjs <formulas.ndjson> <golden.ndjson>')
  process.exit(1)
}

const readRecords = async (path) => {
  const records = []
  const lines = createInterface({ input: createReadStream(resolve(path), { encoding: 'utf8' }), crlfDelay: Infinity })
  for await (const line of lines) if (line) records.push(JSON.parse(line))
  return records
}

const formulas = await readRecords(formulaArgument)
const golden = await readRecords(goldenArgument)
const cached = new Map(golden.map((record) => [`${record.sheet}!${record.address}`, record.cached]))
const directReference = /^(?:'((?:[^']|'')+)'|([^'!]+))?!?\$?([A-Z]+)\$?(\d+)$/
const contradictions = []

for (const record of formulas) {
  if (record.formulaType !== 'scalar' || record.address !== record.appliesTo) continue
  const match = directReference.exec(record.formula.trim())
  if (!match) continue
  const targetSheet = (match[1]?.replaceAll("''", "'") ?? match[2] ?? record.sheet).trim()
  const targetAddress = `${match[3]}${match[4]}`
  const actual = cached.get(`${record.sheet}!${record.address}`)
  const referenced = cached.get(`${targetSheet}!${targetAddress}`)
  if (!actual || !referenced || matches(actual, referenced)) continue
  contradictions.push({
    formulaCell: `${record.sheet}!${record.address}`,
    formula: record.formula,
    referencedCell: `${targetSheet}!${targetAddress}`,
    cachedFormulaValue: actual,
    cachedReferencedValue: referenced,
  })
}

console.log(JSON.stringify({
  auditedScalarFormulaAnchors: formulas.filter((record) => record.formulaType === 'scalar').length,
  directReferenceContradictionCount: contradictions.length,
  contradictions,
}))

function matches(left, right) {
  if (left.type !== right.type) return false
  if (left.type === 'number') return Math.abs(Number(left.value) - Number(right.value)) <= Math.max(1e-7, Math.abs(Number(right.value)) * 1e-9)
  return left.value === right.value
}
