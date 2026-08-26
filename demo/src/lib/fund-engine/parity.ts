import type { GridReader } from './grid'
import type { GoldenCell } from './manifest'
import type { CellAddress, CellValue } from './types'

export type ParityExclusion = Readonly<{
  address: CellAddress
  reason: string
}>

export type ParityMismatch = Readonly<{
  address: CellAddress
  actual: CellValue
  expected: CellValue
  difference?: number
  tolerance?: number
  reason: string
}>

export type ParityReport = Readonly<{
  status: 'pass' | 'fail'
  compared: number
  matched: number
  excluded: number
  mismatchCount: number
  mismatches: readonly ParityMismatch[]
  truncated: boolean
}>

export type ParityOptions = Readonly<{
  maxMismatches?: number
}>

const addressKey = ({ sheet, row, column }: CellAddress): string => `${sheet}:${row}:${column}`

export const compareGoldenCells = (
  grid: GridReader,
  goldenCells: Iterable<GoldenCell>,
  exclusions: Iterable<ParityExclusion> = [],
  options: ParityOptions = {},
): ParityReport => {
  const exclusionKeys = new Set([...exclusions].map(({ address }) => addressKey(address)))
  const mismatchLimit = options.maxMismatches ?? 100
  if (!Number.isInteger(mismatchLimit) || mismatchLimit < 0)
    throw new RangeError('maxMismatches must be a non-negative integer')

  let compared = 0
  let matched = 0
  let excluded = 0
  let mismatchCount = 0
  const mismatches: ParityMismatch[] = []

  for (const golden of goldenCells) {
    if (exclusionKeys.has(addressKey(golden.address))) {
      excluded += 1
      continue
    }
    compared += 1
    const actual = grid.get(golden.address)
    const comparison = compareCellValues(actual, golden.expected, golden.absoluteTolerance, golden.relativeTolerance)
    if (comparison.match) {
      matched += 1
      continue
    }
    mismatchCount += 1
    if (mismatches.length < mismatchLimit) {
      mismatches.push({
        address: golden.address,
        actual,
        expected: golden.expected,
        difference: comparison.difference,
        tolerance: comparison.tolerance,
        reason: comparison.reason,
      })
    }
  }

  return {
    status: mismatchCount === 0 ? 'pass' : 'fail',
    compared,
    matched,
    excluded,
    mismatchCount,
    mismatches,
    truncated: mismatchCount > mismatches.length,
  }
}

type CellComparison = Readonly<{
  match: boolean
  reason: string
  difference?: number
  tolerance?: number
}>

const compareCellValues = (
  actual: CellValue,
  expected: CellValue,
  absoluteTolerance = 0,
  relativeTolerance = 0,
): CellComparison => {
  if (actual.type !== expected.type)
    return { match: false, reason: `type mismatch: ${actual.type} !== ${expected.type}` }

  if (actual.type === 'blank') return { match: true, reason: 'exact blank match' }
  if (actual.type === 'boolean' && expected.type === 'boolean') {
    return { match: actual.value === expected.value, reason: 'exact boolean comparison' }
  }
  if (actual.type === 'string' && expected.type === 'string') {
    return { match: actual.value === expected.value, reason: 'exact string comparison' }
  }
  if (actual.type === 'error' && expected.type === 'error') {
    return { match: actual.code === expected.code, reason: 'exact error-code comparison' }
  }

  const actualNumber =
    actual.type === 'date' || actual.type === 'number' ? (actual.type === 'date' ? actual.serial : actual.value) : NaN
  const expectedNumber =
    expected.type === 'date' || expected.type === 'number'
      ? expected.type === 'date'
        ? expected.serial
        : expected.value
      : NaN
  const difference = Math.abs(actualNumber - expectedNumber)
  const tolerance = Math.max(
    absoluteTolerance,
    relativeTolerance * Math.max(Math.abs(actualNumber), Math.abs(expectedNumber)),
  )
  return {
    match: difference <= tolerance,
    difference,
    tolerance,
    reason: difference <= tolerance ? 'numeric value within tolerance' : 'numeric value outside tolerance',
  }
}
