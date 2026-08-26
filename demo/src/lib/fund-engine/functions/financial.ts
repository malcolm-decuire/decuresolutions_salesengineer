export const pmt = (rate: number, periods: number, presentValue: number, futureValue = 0, dueAtBeginning = false): number => {
  if (!Number.isFinite(rate) || !Number.isFinite(periods) || !Number.isFinite(presentValue) || !Number.isFinite(futureValue)) {
    throw new RangeError('PMT arguments must be finite')
  }
  if (periods === 0) throw new RangeError('PMT periods must be non-zero')
  if (rate === 0) return -(presentValue + futureValue) / periods
  const growth = (1 + rate) ** periods
  return -(rate * (futureValue + growth * presentValue)) / ((1 + rate * Number(dueAtBeginning)) * (growth - 1))
}

export const fv = (rate: number, periods: number, payment: number, presentValue = 0, dueAtBeginning = false): number => {
  if (!Number.isFinite(rate) || !Number.isFinite(periods) || !Number.isFinite(payment) || !Number.isFinite(presentValue)) {
    throw new RangeError('FV arguments must be finite')
  }
  if (rate === 0) return -(presentValue + payment * periods)
  const growth = (1 + rate) ** periods
  return -(presentValue * growth + (payment * (1 + rate * Number(dueAtBeginning)) * (growth - 1)) / rate)
}

export const xirr = (
  values: readonly number[],
  dateSerials: readonly number[],
  guess = 0.1,
  tolerance = 1e-7,
  maxIterations = 100,
): number => {
  if (values.length !== dateSerials.length || values.length < 2) throw new RangeError('XIRR requires paired values and dates')
  if (!values.some((value) => value > 0) || !values.some((value) => value < 0)) {
    throw new RangeError('XIRR requires at least one positive and one negative cash flow')
  }
  const origin = dateSerials[0]
  let rate = guess
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (rate <= -1) rate = -0.999999999
    let value = 0
    let derivative = 0
    for (let index = 0; index < values.length; index += 1) {
      const years = (dateSerials[index] - origin) / 365
      const base = (1 + rate) ** years
      value += values[index] / base
      derivative -= (years * values[index]) / (base * (1 + rate))
    }
    if (Math.abs(value) <= tolerance) return rate
    if (!Number.isFinite(derivative) || Math.abs(derivative) < Number.EPSILON) break
    const next = rate - value / derivative
    if (!Number.isFinite(next)) break
    if (Math.abs(next - rate) <= tolerance) {
      rate = next
      break
    }
    rate = next
  }
  const npv = (candidate: number): number => values.reduce(
    (total, cashFlow, index) => total + cashFlow / (1 + candidate) ** ((dateSerials[index] - origin) / 365),
    0,
  )
  const rates = Array.from({ length: 513 }, (_, index) => Math.expm1(-9 + (index / 512) * (Math.log(1_000_001) + 9)))
  let lower = rates[0]
  let lowerValue = npv(lower)
  for (const candidate of rates.slice(1)) {
    let upper = candidate
    const upperValue = npv(upper)
    if (Number.isFinite(lowerValue) && Number.isFinite(upperValue) && Math.sign(lowerValue) !== Math.sign(upperValue)) {
      for (let iteration = 0; iteration < 200; iteration += 1) {
        const midpoint = (lower + upper) / 2
        const midpointValue = npv(midpoint)
        if (Math.abs(midpointValue) <= tolerance || Math.abs(upper - lower) <= tolerance) return midpoint
        if (Math.sign(midpointValue) === Math.sign(lowerValue)) {
          lower = midpoint
          lowerValue = midpointValue
        } else upper = midpoint
      }
      return (lower + upper) / 2
    }
    lower = upper
    lowerValue = upperValue
  }
  throw new RangeError('XIRR failed to converge')
}
