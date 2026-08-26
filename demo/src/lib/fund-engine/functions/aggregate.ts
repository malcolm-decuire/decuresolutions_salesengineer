export type CriteriaValue = boolean | number | string | null
export type Criterion = boolean | number | string

export const sum = (values: readonly number[]): number => values.reduce((total, value) => total + finite(value), 0)

export const average = (values: readonly number[]): number => {
  if (values.length === 0) throw new RangeError('AVERAGE requires at least one numeric value')
  return sum(values) / values.length
}

export const minimum = (values: readonly number[]): number => {
  if (values.length === 0) return 0
  return Math.min(...values.map(finite))
}

export const maximum = (values: readonly number[]): number => {
  if (values.length === 0) return 0
  return Math.max(...values.map(finite))
}

export const countIfs = (
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
): number => {
  const length = assertCriteriaShape(criteriaRanges, criteria)
  let count = 0
  for (let index = 0; index < length; index += 1) {
    if (criteriaRanges.every((range, rangeIndex) => matchesCriterion(range[index], criteria[rangeIndex]))) count += 1
  }
  return count
}

export const sumIfs = (
  sumRange: readonly number[],
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
): number => {
  const length = assertCriteriaShape(criteriaRanges, criteria)
  if (sumRange.length !== length) throw new RangeError('SUMIFS ranges must have identical lengths')
  let total = 0
  for (let index = 0; index < length; index += 1) {
    if (criteriaRanges.every((range, rangeIndex) => matchesCriterion(range[index], criteria[rangeIndex]))) {
      total += finite(sumRange[index])
    }
  }
  return total
}

export const sumproduct = (...arrays: readonly (readonly number[])[]): number => {
  if (arrays.length === 0) throw new RangeError('SUMPRODUCT requires at least one array')
  const length = arrays[0].length
  if (arrays.some((array) => array.length !== length))
    throw new RangeError('SUMPRODUCT arrays must have identical lengths')
  let total = 0
  for (let index = 0; index < length; index += 1) {
    total += arrays.reduce((product, array) => product * finite(array[index]), 1)
  }
  return total
}

export const maxIfs = (
  maxRange: readonly number[],
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
): number => filteredExtreme(maxRange, criteriaRanges, criteria, maximum)

export const minIfs = (
  minRange: readonly number[],
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
): number => filteredExtreme(minRange, criteriaRanges, criteria, minimum)

export const forecastLinear = (x: number, knownYs: readonly number[], knownXs: readonly number[]): number => {
  finite(x)
  if (knownYs.length !== knownXs.length || knownYs.length === 0) {
    throw new RangeError('FORECAST.LINEAR requires equally sized, non-empty known ranges')
  }
  const meanX = average(knownXs)
  const meanY = average(knownYs)
  let numerator = 0
  let denominator = 0
  for (let index = 0; index < knownXs.length; index += 1) {
    const deltaX = finite(knownXs[index]) - meanX
    numerator += deltaX * (finite(knownYs[index]) - meanY)
    denominator += deltaX * deltaX
  }
  if (denominator === 0) throw new RangeError('FORECAST.LINEAR known x values cannot have zero variance')
  return meanY + (numerator / denominator) * (x - meanX)
}

export const round = (value: number, digits = 0): number => {
  const factor = 10 ** Math.trunc(digits)
  return Math.sign(value) * (Math.floor(Math.abs(value) * factor + 0.5) / factor)
}

export const roundDown = (value: number, digits = 0): number => {
  const factor = 10 ** Math.trunc(digits)
  return Math.trunc(value * factor) / factor
}

export const matchesCriterion = (value: CriteriaValue, criterion: Criterion): boolean => {
  if (typeof criterion === 'number' || typeof criterion === 'boolean') return value === criterion
  const operatorMatch = criterion.match(/^(<=|>=|<>|=|<|>)(.*)$/)
  const operator = operatorMatch?.[1] ?? '='
  const operandText = operatorMatch?.[2] ?? criterion
  const numericOperand = operandText.trim() === '' ? null : Number(operandText)
  const operand: CriteriaValue =
    numericOperand !== null && Number.isFinite(numericOperand) ? numericOperand : operandText

  if (typeof value === 'number' && typeof operand === 'number') {
    if (operator === '<=') return value <= operand
    if (operator === '>=') return value >= operand
    if (operator === '<>') return value !== operand
    if (operator === '<') return value < operand
    if (operator === '>') return value > operand
    return value === operand
  }

  const comparable = value === null ? '' : String(value)
  if (operator === '<>') return !wildcardMatch(comparable, String(operand))
  if (operator !== '=') return false
  return wildcardMatch(comparable, String(operand))
}

const filteredExtreme = (
  valueRange: readonly number[],
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
  operation: (values: readonly number[]) => number,
): number => {
  const length = assertCriteriaShape(criteriaRanges, criteria)
  if (valueRange.length !== length) throw new RangeError('IFS ranges must have identical lengths')
  const matched: number[] = []
  for (let index = 0; index < length; index += 1) {
    if (criteriaRanges.every((range, rangeIndex) => matchesCriterion(range[index], criteria[rangeIndex]))) {
      matched.push(finite(valueRange[index]))
    }
  }
  return operation(matched)
}

const assertCriteriaShape = (
  criteriaRanges: readonly (readonly CriteriaValue[])[],
  criteria: readonly Criterion[],
): number => {
  if (criteriaRanges.length === 0 || criteriaRanges.length !== criteria.length) {
    throw new RangeError('Criteria ranges and criteria must be paired')
  }
  const length = criteriaRanges[0].length
  if (criteriaRanges.some((range) => range.length !== length))
    throw new RangeError('Criteria ranges must have identical lengths')
  return length
}

const wildcardMatch = (value: string, pattern: string): boolean => {
  let expression = ''
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    if (character === '~' && index + 1 < pattern.length) {
      expression += escapeRegex(pattern[++index])
    } else if (character === '*') expression += '.*'
    else if (character === '?') expression += '.'
    else expression += escapeRegex(character)
  }
  return new RegExp(`^${expression}$`, 'i').test(value)
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const finite = (value: number): number => {
  if (!Number.isFinite(value)) throw new RangeError('Formula arguments must be finite numbers')
  return value
}
