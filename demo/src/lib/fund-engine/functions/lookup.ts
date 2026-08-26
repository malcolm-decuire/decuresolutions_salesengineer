export type LookupValue = boolean | number | string | null

export const index = <T>(matrix: readonly (readonly T[])[], rowNumber: number, columnNumber = 1): T => {
  const row = Math.trunc(rowNumber)
  const column = Math.trunc(columnNumber)
  if (row < 1 || column < 1 || row > matrix.length || column > (matrix[row - 1]?.length ?? 0)) {
    throw new RangeError('INDEX coordinate is outside the source range')
  }
  return matrix[row - 1][column - 1]
}

export const matchExact = (lookup: LookupValue, values: readonly LookupValue[]): number => {
  const index = values.findIndex((value) => equalLookupValue(value, lookup))
  if (index < 0) throw new RangeError('MATCH did not find an exact value')
  return index + 1
}

export const vlookupExact = <T extends LookupValue>(
  lookup: LookupValue,
  table: readonly (readonly T[])[],
  columnNumber: number,
): T => {
  const column = Math.trunc(columnNumber)
  if (column < 1 || table.some((row) => row.length < column))
    throw new RangeError('VLOOKUP column is outside the source range')
  const row = table.find((candidate) => equalLookupValue(candidate[0], lookup))
  if (!row) throw new RangeError('VLOOKUP did not find an exact value')
  return row[column - 1]
}

const equalLookupValue = (left: LookupValue, right: LookupValue): boolean => {
  if (typeof left === 'string' && typeof right === 'string')
    return left.toLocaleLowerCase('en-US') === right.toLocaleLowerCase('en-US')
  return left === right
}
