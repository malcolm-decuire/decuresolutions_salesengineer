import { describe, expect, it } from 'vitest'

import {
  IMPLEMENTED_WORKBOOK_FUNCTIONS,
  WORKBOOK_FUNCTION_COUNTS,
  WORKBOOK_FUNCTIONS,
  workbookFunctionCoverage,
} from './function-contract'

describe('workbook function contract', () => {
  it('keeps the extracted inventory deterministic and explicit', () => {
    expect(WORKBOOK_FUNCTIONS).toHaveLength(33)
    expect(WORKBOOK_FUNCTION_COUNTS.SUMIFS).toBe(220_528)
    expect(WORKBOOK_FUNCTION_COUNTS.XIRR).toBe(3)
  })

  it('never claims unsupported workbook functions are implemented', () => {
    const coverage = workbookFunctionCoverage()
    expect(coverage.required).toEqual(WORKBOOK_FUNCTIONS)
    expect(coverage.implemented).toEqual(IMPLEMENTED_WORKBOOK_FUNCTIONS)
    expect(coverage.missing).toHaveLength(WORKBOOK_FUNCTIONS.length - IMPLEMENTED_WORKBOOK_FUNCTIONS.length)
    expect(coverage.complete).toBe(true)
  })
})
