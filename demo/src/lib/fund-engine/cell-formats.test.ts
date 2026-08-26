import { describe, expect, it } from 'vitest'

import { formatForCell, type CellFormatIndex } from './cell-formats'
import { loadCellFormats } from './cell-formats-node'

describe('source cell formats', () => {
  it.runIf(Boolean(process.env.CELL_FORMAT_PATH))('loads the hash-verified workbook style artifact', () => {
    const formats = loadCellFormats(process.env.CELL_FORMAT_PATH!)
    expect(formats.runCount).toBe(74_516)
    expect(formats.styles).toHaveLength(669)
    expect(formatForCell(formats, 'Charts', 1, 2).kind).toBe('date')
    expect(formatForCell(formats, 'Annual Roll Up', 47, 3).kind).toBe('currency')
  })

  it('finds a style run without applying it to adjacent cells', () => {
    const index: CellFormatIndex = { sheets: ['Sheet'], styles: [{ numFmtId: 0, code: 'General', kind: 'general' }, { numFmtId: 14, code: 'm/d/yy', kind: 'date' }], rows: new Map([['0:2', [{ startColumn: 3, endColumn: 5, style: 1 }]]]), runCount: 1 }
    expect(formatForCell(index, 'Sheet', 2, 4).kind).toBe('date')
    expect(formatForCell(index, 'Sheet', 2, 6).kind).toBe('general')
  })
})
