import { describe, expect, it } from 'vitest'

import {
  WORKBOOK_SEED_RECORD_COUNT,
  WORKBOOK_SEED_SHA256,
  WORKBOOK_SOURCE_SHA256,
  WORKBOOK_VALIDATIONS,
} from './generated/workbook-seed'
import { TypedModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import { seedWorkbookGrid } from './seed'

describe('generated workbook seed', () => {
  it('loads every extracted non-formula value into the typed grid', () => {
    const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
    seedWorkbookGrid(grid)

    expect(WORKBOOK_SEED_RECORD_COUNT).toBe(4_592)
    expect(WORKBOOK_SOURCE_SHA256).toBe('a94fa095e471377a2a1135062030e66b526957b35b9aabd87877ca138f0ec2e5')
    expect(WORKBOOK_SEED_SHA256).toBe('c954dd68b65b67a5068c7232eddf7983ddc54a1f6c36a29fa018204d7aeef247')
    expect(grid.get({ sheet: WORKBOOK_SHEETS[0].id, row: 2, column: 8 })).toEqual({
      type: 'string',
      value: 'Buy and Flip',
    })
    expect(grid.get({ sheet: WORKBOOK_SHEETS[0].id, row: 2, column: 9 })).toEqual({
      type: 'string',
      value: 'Buy, Rent and Sell',
    })
  })

  it('preserves all seven workbook validation rules', () => {
    expect(WORKBOOK_VALIDATIONS).toHaveLength(7)
    expect(WORKBOOK_VALIDATIONS).toContainEqual(
      expect.objectContaining({ sheet: 0, range: 'E26', type: 'list', formula1: '"Monthly,Quarterly,Annually"' }),
    )
  })
})
