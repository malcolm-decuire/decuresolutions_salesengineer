import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { describe, expect, it } from 'vitest'
import { parseFormula } from './formula-parser'

describe('Excel formula parser', () => {
  it('preserves reference anchoring, sheet names, and ranges', () => {
    expect(parseFormula("SUM('Static (Dont Touch)'!$B2:C$4)")).toMatchObject({
      kind: 'call',
      name: 'SUM',
      arguments: [
        {
          kind: 'range',
          start: { sheet: 'Static (Dont Touch)', row: 2, column: 2, absoluteRow: false, absoluteColumn: true },
          end: { row: 4, column: 3, absoluteRow: true, absoluteColumn: false },
        },
      ],
    })
  })

  it('applies Excel operator precedence and right-associative powers', () => {
    expect(parseFormula('1+2*3^4^5%')).toMatchObject({
      kind: 'binary',
      operator: '+',
      right: {
        kind: 'binary',
        operator: '*',
        right: { kind: 'binary', operator: '^', right: { kind: 'binary', operator: '^' } },
      },
    })
  })

  it('parses nested source-style control formulas and escaped strings', () => {
    expect(parseFormula('IFERROR(IF(A1>=10,"Yes ""sir""",VLOOKUP(A1,$D$1:$E$9,2,FALSE)),0)')).toMatchObject({
      kind: 'call',
      name: 'IFERROR',
      arguments: [{ kind: 'call', name: 'IF' }, { kind: 'number', value: 0 }],
    })
  })

  it.runIf(Boolean(process.env.FORMULA_SOURCE_PATH))(
    'parses every extracted workbook formula anchor',
    async () => {
      const lines = createInterface({
        input: createReadStream(process.env.FORMULA_SOURCE_PATH!, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      })
      let count = 0
      for await (const line of lines) {
        if (!line) continue
        const record = JSON.parse(line) as { address: string; formula: string; sheet: string }
        try {
          parseFormula(record.formula)
        } catch (error) {
          throw new Error(
            `Unable to parse ${record.sheet}!${record.address}: ${record.formula}`,
            { cause: error },
          )
        }
        count += 1
      }
      expect(count).toBe(122_619)
    },
    30_000,
  )
})
