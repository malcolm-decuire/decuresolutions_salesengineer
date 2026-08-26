import { gunzipSync } from 'node:zlib'
import { createReadStream, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { describe, expect, it } from 'vitest'
import { sourceSheetId } from './formula-regions'
import { TypedModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import { hydrateSourceBaseline } from './source-baseline'
import { clearSourceBaselineCacheForTests, loadSourceBaselineGrid } from './source-baseline-node'

describe('full source baseline', () => {
  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH))(
    'hydrates every cached formula cell from the compact artifact',
    () => {
      const compressed = readFileSync(process.env.SOURCE_BASELINE_PATH!)
      const decompressStartedAt = performance.now()
      const bytes = gunzipSync(compressed)
      const decompressMs = performance.now() - decompressStartedAt
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      const hydrateStartedAt = performance.now()
      const manifest = hydrateSourceBaseline(grid, bytes)
      const hydrateMs = performance.now() - hydrateStartedAt
      console.info(JSON.stringify({ compressedBytes: compressed.length, binaryBytes: bytes.length, decompressMs, hydrateMs, totalMs: decompressMs + hydrateMs }))
      expect(manifest).toEqual({
        version: 1,
        recordCount: 1_175_711,
        sheetNames: expect.arrayContaining(['Fund Assumptions', 'Investor Cash Flows', 'Charts']),
        uniqueStringCount: 256,
      })
    },
    30_000,
  )

  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH))(
    'loads a verified cold baseline and clones a warm baseline under the runtime target',
    () => {
      clearSourceBaselineCacheForTests()
      const cold = loadSourceBaselineGrid(process.env.SOURCE_BASELINE_PATH!)
      const warm = loadSourceBaselineGrid(process.env.SOURCE_BASELINE_PATH!)
      console.info(JSON.stringify({ cold: cold.timings, warm: warm.timings }))
      expect(cold.cold).toBe(true)
      expect(warm.cold).toBe(false)
      expect(cold.manifest.recordCount).toBe(1_175_711)
      expect(cold.timings.totalMs).toBeLessThan(2_000)
      expect(warm.timings.totalMs).toBeLessThan(2_000)
    },
    30_000,
  )

  it.runIf(Boolean(process.env.SOURCE_BASELINE_PATH && process.env.SOURCE_BASELINE_GOLDEN_PATH))(
    'matches every cached formula value in the corrected address-level oracle',
    async () => {
      clearSourceBaselineCacheForTests()
      const { grid } = loadSourceBaselineGrid(process.env.SOURCE_BASELINE_PATH!)
      const lines = createInterface({
        input: createReadStream(process.env.SOURCE_BASELINE_GOLDEN_PATH!, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      })
      let compared = 0
      let mismatches = 0
      for await (const line of lines) {
        if (!line) continue
        const record = JSON.parse(line) as { sheet: string; address: string; cached: { type: string; value?: unknown } }
        const match = /^([A-Z]+)(\d+)$/.exec(record.address)
        if (!match) throw new Error(`Invalid oracle address ${record.sheet}!${record.address}`)
        const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
        const actual = grid.get({ sheet: sourceSheetId(record.sheet), row: Number(match[2]), column })
        const equal = record.cached.type === 'number' && actual.type === 'number'
          ? Object.is(actual.value, Number(record.cached.value))
          : record.cached.type === 'string' && actual.type === 'string'
            ? actual.value === String(record.cached.value ?? '')
            : record.cached.type === 'boolean' && actual.type === 'boolean'
              ? actual.value === Boolean(record.cached.value)
              : record.cached.type === 'error' && actual.type === 'error'
                ? actual.code === record.cached.value
                : record.cached.type === 'blank' && actual.type === 'blank'
        compared += 1
        if (!equal) mismatches += 1
      }
      console.info(JSON.stringify({ compared, mismatches }))
      expect(compared).toBe(1_175_711)
      expect(mismatches).toBe(0)
    },
    30_000,
  )
})
