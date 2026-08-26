import { datedifMonths, edate, eomonth, weeknumSunday } from './dates'
import { average, countIfs, forecastLinear, maximum, maxIfs, minimum, minIfs, round, roundDown, sum, sumIfs, sumproduct, type CriteriaValue, type Criterion } from './functions/aggregate'
import { and, date, month, or, text, today, year } from './functions/control'
import { fv, pmt, xirr } from './functions/financial'
import { index, matchExact, vlookupExact, type LookupValue } from './functions/lookup'
import type { FormulaArray, FormulaEvaluationValue } from './formula-evaluator'
import type { CellErrorCode, CellValue } from './types'

export type WorkbookFunctionCache = Readonly<{
  sumIfsIndexes: WeakMap<FormulaArray, WeakMap<FormulaArray, ReadonlyMap<string, number>>>
}>

export const callWorkbookFunction = (
  name: string,
  arguments_: readonly FormulaEvaluationValue[],
  now = new Date(),
  cache?: WorkbookFunctionCache,
): FormulaEvaluationValue => {
  const propagated = firstError(arguments_)
  if (propagated) return propagated
  try {
    switch (name.toUpperCase()) {
      case 'SUM': return numberValue(sum(arguments_.flatMap(numericVector)))
      case 'AVERAGE': return numberValue(average(arguments_.flatMap(numericVector)))
      case 'MIN': return numberValue(minimum(arguments_.flatMap(numericVector)))
      case 'MAX': return numberValue(maximum(arguments_.flatMap(numericVector)))
      case 'COUNTIFS': return numberValue(countIfs(pairedRanges(arguments_), pairedCriteria(arguments_)))
      case 'SUMIFS': return numberValue(cachedSumIfs(arguments_, cache) ?? sumIfs(alignedNumericVector(arguments_[0]), pairedRanges(arguments_.slice(1)), pairedCriteria(arguments_.slice(1))))
      case 'MAXIFS': return numberValue(maxIfs(alignedNumericVector(arguments_[0]), pairedRanges(arguments_.slice(1)), pairedCriteria(arguments_.slice(1))))
      case 'MINIFS': return numberValue(minIfs(alignedNumericVector(arguments_[0]), pairedRanges(arguments_.slice(1)), pairedCriteria(arguments_.slice(1))))
      case 'SUMPRODUCT': return numberValue(sumproduct(...arguments_.map(alignedNumericVector)))
      case 'INDEX': return valueAtIndex(arguments_)
      case 'MATCH': return numberValue(matchExact(lookupScalar(arguments_[0]), lookupVector(arguments_[1])))
      case 'VLOOKUP': return fromLookup(vlookupExact(lookupScalar(arguments_[0]), lookupMatrix(arguments_[1]), requiredNumber(arguments_[2])))
      case 'ARRAYFORMULA': return arguments_[0]
      case 'ARRAY_CONSTRAIN': return matrix(arguments_[0]).slice(0, Math.trunc(requiredNumber(arguments_[1]))).map((row) => row.slice(0, Math.trunc(requiredNumber(arguments_[2]))))
      case 'AND': return booleanValue(and(arguments_.flatMap(booleanVector)))
      case 'OR': return booleanValue(or(arguments_.flatMap(booleanVector)))
      case 'DATE': return numberValue(date(requiredNumber(arguments_[0]), requiredNumber(arguments_[1]), requiredNumber(arguments_[2])))
      case 'DATEDIF': {
        if (requiredString(arguments_[2]).toUpperCase() !== 'M') throw new RangeError('Only workbook DATEDIF month units are supported')
        return numberValue(datedifMonths(requiredNumber(arguments_[0]), requiredNumber(arguments_[1])))
      }
      case 'EDATE': return numberValue(edate(requiredNumber(arguments_[0]), requiredNumber(arguments_[1])))
      case 'EOMONTH': return numberValue(eomonth(requiredNumber(arguments_[0]), requiredNumber(arguments_[1])))
      case 'WEEKNUM': return numberValue(weeknumSunday(requiredNumber(arguments_[0])))
      case 'MONTH': return numberValue(month(requiredNumber(arguments_[0])))
      case 'YEAR': return numberValue(year(requiredNumber(arguments_[0])))
      case 'TODAY': return numberValue(today(now))
      case 'TEXT': return stringValue(text(requiredNumber(arguments_[0]), requiredString(arguments_[1])))
      case 'ROUND': return numberValue(round(requiredNumber(arguments_[0]), requiredNumber(arguments_[1])))
      case 'ROUNDDOWN': return numberValue(roundDown(requiredNumber(arguments_[0]), requiredNumber(arguments_[1])))
      case 'FORECAST.LINEAR': {
        const [knownYs, knownXs] = pairedNumericVectors(arguments_[1], arguments_[2])
        return numberValue(forecastLinear(requiredNumber(arguments_[0]), knownYs, knownXs))
      }
      case 'PMT': return numberValue(pmt(requiredNumber(arguments_[0]), requiredNumber(arguments_[1]), requiredNumber(arguments_[2]), arguments_[3] ? requiredNumber(arguments_[3]) : 0, arguments_[4] ? requiredBoolean(arguments_[4]) : false))
      case 'FV': return numberValue(fv(requiredNumber(arguments_[0]), requiredNumber(arguments_[1]), requiredNumber(arguments_[2]), arguments_[3] ? requiredNumber(arguments_[3]) : 0, arguments_[4] ? requiredBoolean(arguments_[4]) : false))
      case 'XIRR': return numberValue(xirr(numericVector(arguments_[0]), numericVector(arguments_[1]), arguments_[2] ? requiredNumber(arguments_[2]) : 0.1))
      default: return errorValue('#NAME?', `Unsupported workbook function ${name}`)
    }
  } catch (error) {
    return errorValue(error instanceof RangeError && /MATCH|VLOOKUP/.test(error.message) ? '#N/A' : '#VALUE!', error instanceof Error ? error.message : 'Unknown function error')
  }
}

const cachedSumIfs = (arguments_: readonly FormulaEvaluationValue[], cache?: WorkbookFunctionCache): number | undefined => {
  if (!cache || arguments_.length !== 3 || !Array.isArray(arguments_[0]) || !Array.isArray(arguments_[1])) return undefined
  const criterion = pairedCriteria(arguments_.slice(1))[0]
  if (typeof criterion === 'string' && /^(?:<=|>=|<>|=|<|>)|[*?~]/.test(criterion)) return undefined
  const sumRange = arguments_[0] as FormulaArray
  const criteriaRange = arguments_[1] as FormulaArray
  let byCriteriaRange = cache.sumIfsIndexes.get(sumRange)
  if (!byCriteriaRange) {
    byCriteriaRange = new WeakMap()
    cache.sumIfsIndexes.set(sumRange, byCriteriaRange)
  }
  let index = byCriteriaRange.get(criteriaRange)
  if (!index) {
    const sums = alignedNumericVector(sumRange)
    const criteria = criteriaVector(criteriaRange)
    if (sums.length !== criteria.length) throw new RangeError('SUMIFS ranges must have identical lengths')
    const grouped = new Map<string, number>()
    for (let position = 0; position < sums.length; position += 1) {
      const key = criterionKey(criteria[position])
      grouped.set(key, (grouped.get(key) ?? 0) + sums[position])
    }
    index = grouped
    byCriteriaRange.set(criteriaRange, index)
  }
  return index.get(criterionKey(criterion)) ?? 0
}

const criterionKey = (value: CriteriaValue | Criterion): string =>
  value === null ? 'string:' : typeof value === 'string' ? `string:${value.toUpperCase()}` : `${typeof value}:${String(value)}`

const valueAtIndex = (arguments_: readonly FormulaEvaluationValue[]): CellValue =>
  index(matrix(arguments_[0]), requiredNumber(arguments_[1]), arguments_[2] ? requiredNumber(arguments_[2]) : 1)

const pairedRanges = (arguments_: readonly FormulaEvaluationValue[]): readonly (readonly CriteriaValue[])[] => {
  if (arguments_.length % 2 !== 0) throw new RangeError('Criteria ranges and criteria must be paired')
  return arguments_.filter((_, index_) => index_ % 2 === 0).map(criteriaVector)
}

const pairedCriteria = (arguments_: readonly FormulaEvaluationValue[]): readonly Criterion[] =>
  arguments_.filter((_, index_) => index_ % 2 === 1).map((value) => {
    const scalar = scalarValue(value)
    if (scalar.type === 'blank') return ''
    if (scalar.type === 'date') return scalar.serial
    if (scalar.type === 'boolean' || scalar.type === 'number' || scalar.type === 'string') return scalar.value
    throw new RangeError(`Invalid criterion ${scalar.code}`)
  })

const matrix = (value: FormulaEvaluationValue): FormulaArray => Array.isArray(value) ? value : [[value as CellValue]]
const flatten = (value: FormulaEvaluationValue): readonly CellValue[] => matrix(value).flat()
const scalarValue = (value: FormulaEvaluationValue): CellValue => flatten(value)[0]

const numericVector = (value: FormulaEvaluationValue): readonly number[] =>
  flatten(value).flatMap((cell) => cell.type === 'number' ? [cell.value] : cell.type === 'date' ? [cell.serial] : [])

const alignedNumericVector = (value: FormulaEvaluationValue): readonly number[] =>
  flatten(value).map((cell) => cell.type === 'number' ? cell.value : cell.type === 'date' ? cell.serial : 0)

const pairedNumericVectors = (left: FormulaEvaluationValue, right: FormulaEvaluationValue): [number[], number[]] => {
  const leftCells = flatten(left)
  const rightCells = flatten(right)
  if (leftCells.length !== rightCells.length) throw new RangeError('Paired numeric ranges must have identical lengths')
  const leftValues: number[] = []
  const rightValues: number[] = []
  for (let index_ = 0; index_ < leftCells.length; index_ += 1) {
    const leftNumber = optionalNumber(leftCells[index_])
    const rightNumber = optionalNumber(rightCells[index_])
    if (leftNumber === undefined || rightNumber === undefined) continue
    leftValues.push(leftNumber)
    rightValues.push(rightNumber)
  }
  return [leftValues, rightValues]
}

const optionalNumber = (cell: CellValue): number | undefined =>
  cell.type === 'number' ? cell.value : cell.type === 'date' ? cell.serial : undefined

const criteriaVector = (value: FormulaEvaluationValue): readonly CriteriaValue[] =>
  flatten(value).map((cell) => cell.type === 'blank' ? null : cell.type === 'date' ? cell.serial : cell.type === 'error' ? null : cell.value)

const lookupScalar = (value: FormulaEvaluationValue): LookupValue => {
  const cell = scalarValue(value)
  if (cell.type === 'blank') return null
  if (cell.type === 'date') return cell.serial
  if (cell.type === 'error') throw new RangeError(cell.code)
  return cell.value
}

const lookupVector = (value: FormulaEvaluationValue): readonly LookupValue[] => flatten(value).map((cell) => lookupScalar(cell))
const lookupMatrix = (value: FormulaEvaluationValue): readonly (readonly LookupValue[])[] => matrix(value).map((row) => row.map((cell) => lookupScalar(cell)))
const fromLookup = (value: LookupValue): CellValue => value === null ? { type: 'blank' } : typeof value === 'boolean' ? { type: 'boolean', value } : typeof value === 'number' ? { type: 'number', value } : { type: 'string', value }

const requiredNumber = (value: FormulaEvaluationValue): number => {
  const cell = scalarValue(value)
  if (cell.type === 'number') return cell.value
  if (cell.type === 'date') return cell.serial
  if (cell.type === 'boolean') return Number(cell.value)
  if (cell.type === 'blank') return 0
  if (cell.type === 'string' && Number.isFinite(Number(cell.value))) return Number(cell.value)
  throw new RangeError('Expected a numeric function argument')
}

const requiredString = (value: FormulaEvaluationValue): string => {
  const cell = scalarValue(value)
  if (cell.type === 'string') return cell.value
  if (cell.type === 'blank') return ''
  if (cell.type === 'number') return String(cell.value)
  if (cell.type === 'date') return String(cell.serial)
  if (cell.type === 'boolean') return cell.value ? 'TRUE' : 'FALSE'
  throw new RangeError(cell.code)
}

const requiredBoolean = (value: FormulaEvaluationValue): boolean => {
  const cell = scalarValue(value)
  if (cell.type === 'boolean') return cell.value
  if (cell.type === 'number') return cell.value !== 0
  if (cell.type === 'blank') return false
  if (cell.type === 'string' && /^(TRUE|FALSE)$/i.test(cell.value)) return /^TRUE$/i.test(cell.value)
  throw new RangeError('Expected a boolean function argument')
}

const booleanVector = (value: FormulaEvaluationValue): readonly boolean[] => flatten(value).map((cell) => requiredBoolean(cell))

const firstError = (values: readonly FormulaEvaluationValue[]): CellValue | undefined => {
  for (const value of values) {
    const error = flatten(value).find((cell) => cell.type === 'error')
    if (error) return error
  }
  return undefined
}

const numberValue = (value: number): CellValue => ({ type: 'number', value })
const booleanValue = (value: boolean): CellValue => ({ type: 'boolean', value })
const stringValue = (value: string): CellValue => ({ type: 'string', value })
const errorValue = (code: CellErrorCode, detail: string): CellValue => ({ type: 'error', code, detail })
