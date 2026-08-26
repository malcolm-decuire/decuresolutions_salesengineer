import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const [seedArgument, outputArgument] = process.argv.slice(2)
if (!seedArgument || !outputArgument) {
  console.error('Usage: node scripts/compile-model-inputs.mjs <seed.ndjson> <output.ts>')
  process.exit(1)
}

const records = readFileSync(resolve(seedArgument), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
const assumptions = records.filter((record) => record.sheet === 'Fund Assumptions')
const cells = new Map(assumptions.map((record) => [record.address, record.value.value]))
const selected = new Set()

const add = (address) => selected.add(address)
const addRange = (columns, rows) => {
  for (const row of rows) for (const column of columns) add(`${column}${row}`)
}

// The source workbook has no sheet protection or unlocked-cell metadata. These are
// its explicit assumptions tables: scalar fund drivers, capital/waterfall inputs,
// the three strategy columns, and the complete seasonality matrices. Formula cells
// are intentionally absent from the seed oracle and therefore cannot enter this list.
for (const address of ['E4', 'E6', ...Array.from({ length: 9 }, (_, index) => `E${index + 8}`), 'E25', 'E26', 'C19', 'D19']) add(address)
addRange(['C', 'D'], [29, 30, 31, 32, 33, 34])
addRange(['H', 'I', 'J'], [4, 5, 6, 7, 10, 11, 12, 13, 15, 16, 19, 21, 23, 24, 26, 27, 28, 29, 30, 31, 32, 35, 36, 37, 38, 39, 40, 41])
addRange(['M', 'N'], [3, 4, 5, 6, 7])
addRange(['M', 'N', 'O', 'P'], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21])

const parseAddress = (address) => {
  const [, letters, rowText] = /^([A-Z]+)(\d+)$/.exec(address) ?? []
  if (!letters) throw new Error(`Invalid address ${address}`)
  return { row: Number(rowText), column: [...letters].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0) }
}

const strategyNames = { H: 'Buy and Flip', I: 'Buy, Rent and Sell', J: 'Buy and Hold' }
const groupAndLabel = (address) => {
  const { row, column } = parseAddress(address)
  if (column === 5) {
    const label = String(cells.get(`B${row}`))
    const group = row <= 7 ? 'fund' : row <= 14 ? 'fees' : 'capital'
    return { group, label }
  }
  if (address === 'C19') return { group: 'capital', label: 'LP commitment share' }
  if (address === 'D19') return { group: 'capital', label: 'LP commitment target' }
  if ((column === 3 || column === 4) && row >= 29 && row <= 34) {
    return { group: 'waterfall', label: `${cells.get(`B${row}`)} — ${cells.get(`${column === 3 ? 'C' : 'D'}28`)}` }
  }
  if (column >= 8 && column <= 10) {
    const columnLetter = String.fromCharCode(64 + column)
    return { group: 'strategy', label: `${cells.get(`G${row}`)} — ${strategyNames[columnLetter]}` }
  }
  if ((column === 13 || column === 14) && row <= 7) {
    return { group: 'seasonality', label: `${cells.get(`L${row}`)} — ${column === 13 ? 'weekly rate' : 'occupancy'}` }
  }
  return { group: 'seasonality', label: `${cells.get(`L${row}`)} — week ${column - 12}` }
}

const existingIds = {
  E4: 'fundTerm', E6: 'investmentPeriod', E8: 'fundExpenses', E9: 'assetManagementFee',
  E10: 'constructionManagementFee', E11: 'propertyManagementFee', E15: 'minimumCashReserve',
  E16: 'interestOnCash', E25: 'distributionDelay', E26: 'distributionFrequency',
  H4: 'buyFlipYearZeroDeals', I4: 'buyRentSellYearZeroDeals', J4: 'buyHoldYearZeroDeals',
}

const percentPattern = /%|rate|ltv|occupancy|fee|commission|commitment share|commitment target|discount|increase|costs|insurance|tax/i
const integerPattern = /life of fund|duration|year 0 deals|stabilized|max origination|\bterm\b|construction period|\blag\b|\bmonths?\b|hold period/i
const currencyPattern = /weekly rate|deal size|cash reserve/i
const enumOptions = (address) => {
  if (address === 'E14') return ['Yes', 'No']
  if (address === 'E26') return ['Monthly', 'Quarterly', 'Annually']
  if (/^[M-P](1\d|20|21)$/.test(address)) return ['Off Season', 'Low', 'Mid', 'Peak', 'Super Peak ']
  return undefined
}

const fields = [...selected].map((address) => {
  if (!cells.has(address)) throw new Error(`Selected input ${address} is absent from the corrected seed oracle`)
  const value = cells.get(address)
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error(`Unsupported input value at ${address}`)
  const { row, column } = parseAddress(address)
  const { group, label } = groupAndLabel(address)
  const options = enumOptions(address)
  const isCurrency = currencyPattern.test(label)
  const isPercent = !isCurrency && percentPattern.test(label)
  const unit = isCurrency ? 'USD' : isPercent ? '%' : integerPattern.test(label) ? 'count' : undefined
  return {
    id: existingIds[address] ?? `fundAssumptions_${address.toLowerCase()}`,
    label,
    group,
    row,
    column,
    valueType: options ? 'enum' : 'number',
    defaultValue: value,
    ...(unit ? { unit } : {}),
    ...(typeof value === 'number' ? { minimum: 0 } : {}),
    ...(isPercent && typeof value === 'number' && value <= 1 ? { maximum: 1 } : {}),
    ...(integerPattern.test(label) ? { integer: true } : {}),
    ...(address === 'E4' ? { maximum: 15, integer: true } : {}),
    ...(options ? { options } : {}),
  }
})

const output = `// Generated by scripts/compile-model-inputs.mjs from the corrected seed oracle. Do not edit by hand.\nexport const GENERATED_MODEL_INPUT_FIELDS = ${JSON.stringify(fields, null, 2)} as const\n`
mkdirSync(dirname(resolve(outputArgument)), { recursive: true })
writeFileSync(resolve(outputArgument), output)
console.log(JSON.stringify({ output: resolve(outputArgument), fields: fields.length, groups: Object.fromEntries(Object.entries(Object.groupBy(fields, (field) => field.group)).map(([group, values]) => [group, values.length])) }))
