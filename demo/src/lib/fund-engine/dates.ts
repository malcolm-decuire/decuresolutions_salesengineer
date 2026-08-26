const MILLIS_PER_DAY = 86_400_000
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)

export const dateFromSerial = (serial: number): Date => {
  if (!Number.isFinite(serial)) throw new RangeError(`Invalid date serial: ${serial}`)
  return new Date(EXCEL_EPOCH_UTC + Math.trunc(serial) * MILLIS_PER_DAY)
}

export const serialFromDate = (date: Date): number => {
  const time = date.getTime()
  if (!Number.isFinite(time)) throw new RangeError('Invalid date')
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.round((utcMidnight - EXCEL_EPOCH_UTC) / MILLIS_PER_DAY)
}

export const dateUtc = (year: number, month: number, day: number): Date => {
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError(`Invalid date components: ${year}-${month}-${day}`)
  }
  return date
}

export const edate = (serial: number, months: number): number => {
  const source = dateFromSerial(serial)
  const wholeMonths = Math.trunc(months)
  const targetMonthStart = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + wholeMonths, 1))
  const lastDay = new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth() + 1, 0)).getUTCDate()
  return serialFromDate(
    new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth(), Math.min(source.getUTCDate(), lastDay))),
  )
}

export const eomonth = (serial: number, months: number): number => {
  const source = dateFromSerial(serial)
  return serialFromDate(new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + Math.trunc(months) + 1, 0)))
}

export const datedifMonths = (startSerial: number, endSerial: number): number => {
  const start = dateFromSerial(startSerial)
  const end = dateFromSerial(endSerial)
  if (end < start) throw new RangeError('DATEDIF end date precedes start date')
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth()
  if (end.getUTCDate() < start.getUTCDate()) months -= 1
  return months
}

export const weeknumSunday = (serial: number): number => {
  const date = dateFromSerial(serial)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const days = Math.floor((date.getTime() - yearStart.getTime()) / MILLIS_PER_DAY)
  return Math.floor((days + yearStart.getUTCDay()) / 7) + 1
}
