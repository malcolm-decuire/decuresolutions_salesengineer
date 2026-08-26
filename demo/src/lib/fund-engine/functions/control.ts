import { dateFromSerial, serialFromDate } from '../dates'
import type { CellValue } from '../types'

export const and = (values: readonly boolean[]): boolean => values.every(Boolean)

export const or = (values: readonly boolean[]): boolean => values.some(Boolean)

export const ifValue = <T>(condition: boolean, whenTrue: () => T, whenFalse: () => T): T =>
  condition ? whenTrue() : whenFalse()

export const ifError = <T>(operation: () => T, fallback: () => T): T => {
  try {
    const result = operation()
    return isCellError(result) ? fallback() : result
  } catch {
    return fallback()
  }
}

export const arrayFormula = <T>(value: T): T => value

export const arrayConstrain = <T>(matrix: readonly (readonly T[])[], rowCount: number, columnCount: number): T[][] => {
  const rows = Math.trunc(rowCount)
  const columns = Math.trunc(columnCount)
  if (rows < 0 || columns < 0) throw new RangeError('ARRAY_CONSTRAIN dimensions must be non-negative')
  return matrix.slice(0, rows).map((row) => row.slice(0, columns))
}

export const date = (year: number, month: number, day: number): number => {
  const wholeYear = Math.trunc(year)
  const wholeMonth = Math.trunc(month)
  const wholeDay = Math.trunc(day)
  const value = new Date(Date.UTC(wholeYear, wholeMonth - 1, wholeDay))
  if (!Number.isFinite(value.getTime())) throw new RangeError('Invalid DATE arguments')
  return serialFromDate(value)
}

export const month = (serial: number): number => dateFromSerial(serial).getUTCMonth() + 1

export const year = (serial: number): number => dateFromSerial(serial).getUTCFullYear()

export const today = (now: Date): number => serialFromDate(now)

export const text = (value: number, format: string): string => {
  if (format.toLowerCase() === 'mmmm') {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long' }).format(dateFromSerial(value))
  }
  if (format.toLowerCase() === 'dddd') {
    return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' }).format(dateFromSerial(value))
  }
  throw new RangeError(`Unsupported workbook TEXT format: ${format}`)
}

const isCellError = <T>(value: T): boolean =>
  typeof value === 'object' && value !== null && 'type' in value && (value as CellValue).type === 'error'
