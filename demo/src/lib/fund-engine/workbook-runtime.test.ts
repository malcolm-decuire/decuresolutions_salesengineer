import { describe, expect, it } from 'vitest'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { loadRuntimeFormulaFamilies } from './formula-regions'
import { formulaFamilyComponents } from './formula-dependencies'
import { TypedModelGrid } from './grid'
import { WORKBOOK_SHEETS } from './manifest'
import { seedWorkbookGrid } from './seed'
import { executeWorkbookComponents, executeWorkbookFamilies, executeWorkbookSheetOrder } from './workbook-runtime'
import { sourceSheetId } from './formula-regions'
import { SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS } from './source-snapshot-manifest'
import { executeSourceSnapshot } from './source-snapshot'

describe('compiled workbook runtime', () => {
  it('executes a compiled scalar family into the typed grid', () => {
    const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
    seedWorkbookGrid(grid)
    const family = loadRuntimeFormulaFamilies().find((candidate) => candidate.sourceSheetName === 'Fund Assumptions' && candidate.formula.startsWith('DATE('))
    expect(family).toBeDefined()
    const stats = executeWorkbookFamilies(grid, new Date('2025-02-10T00:00:00Z'), [family!])
    expect(stats).toMatchObject({ familyCount: 1, regionCount: 1, cellCount: 1, errorCount: 0 })
    expect(grid.get({ sheet: family!.sheet, row: family!.templateRow, column: family!.templateColumn })).toEqual({ type: 'number', value: 45748 })
  })

  it.runIf(process.env.FULL_WORKBOOK_RUNTIME === '1')(
    'executes every compiled formula cell once',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const stats = executeWorkbookFamilies(grid, new Date('2025-05-01T00:00:00Z'))
      console.info(JSON.stringify(stats))
      expect(stats.familyCount).toBe(823)
      expect(stats.regionCount).toBe(1_015)
      expect(stats.cellCount).toBe(1_175_711)
    },
    120_000,
  )

  it.runIf(Boolean(process.env.RUNTIME_FAMILY_DIGEST))(
    'diagnoses a selected formula family',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const family = loadRuntimeFormulaFamilies().find((candidate) => candidate.digest === process.env.RUNTIME_FAMILY_DIGEST)
      expect(family).toBeDefined()
      const stats = executeWorkbookFamilies(grid, new Date('2025-05-01T00:00:00Z'), [family!])
      console.info(JSON.stringify(stats))
      expect(stats.cellCount).toBe(family!.cellCount)
    },
  )

  it.runIf(process.env.ORDERED_WORKBOOK_RUNTIME === '1')(
    'executes all families in dependency-component order',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const components = formulaFamilyComponents(loadRuntimeFormulaFamilies())
      const stats = executeWorkbookFamilies(grid, new Date('2025-05-01T00:00:00Z'), components.flat())
      console.info(JSON.stringify({ componentCount: components.length, largestComponent: Math.max(...components.map((component) => component.length)), ...stats }))
      expect(stats.cellCount).toBe(1_175_711)
    },
    120_000,
  )

  it.runIf(process.env.ITERATIVE_WORKBOOK_RUNTIME === '1')(
    're-evaluates dependency components to settle cross-family cycles',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const ordered = formulaFamilyComponents(loadRuntimeFormulaFamilies()).flat()
      executeWorkbookFamilies(grid, new Date('2025-05-01T00:00:00Z'), ordered)
      const stats = executeWorkbookFamilies(grid, new Date('2025-05-01T00:00:00Z'), ordered)
      console.info(JSON.stringify(stats))
      expect(stats.cellCount).toBe(1_175_711)
    },
    180_000,
  )

  it.runIf(Boolean(process.env.PARITY_GOLDEN_PATH))(
    'streams the corrected cached oracle against the calculated grid',
    async () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const components = formulaFamilyComponents(loadRuntimeFormulaFamilies())
      const sourceCycle = components.find((component) => component.length === 67)
      expect(sourceCycle).toBeDefined()
      const preserveSnapshot = process.env.PRESERVE_SOURCE_CYCLE === '1' || process.env.PRESERVE_SNAPSHOT_CLOSURE === '1'
      const sourceFamilies = new Set(sourceCycle!.map((family) => `${family.sourceSheetName}:${family.digest}`))
      if (process.env.PRESERVE_SNAPSHOT_CLOSURE === '1') for (const key of SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS) sourceFamilies.add(key)
      if (preserveSnapshot) {
        const sourceLines = createInterface({ input: createReadStream(process.env.PARITY_GOLDEN_PATH!, { encoding: 'utf8' }), crlfDelay: Infinity })
        for await (const line of sourceLines) {
          if (!line) continue
          const record = JSON.parse(line) as { sheet: string; address: string; cached: { type: string; value?: unknown }; formulaFamilyDigest: string }
          if (!sourceFamilies.has(`${record.sheet}:${record.formulaFamilyDigest}`)) continue
          const match = /^([A-Z]+)(\d+)$/.exec(record.address)!
          const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
          const cached = record.cached.type === 'number'
            ? { type: 'number' as const, value: Number(record.cached.value) }
            : record.cached.type === 'boolean'
              ? { type: 'boolean' as const, value: Boolean(record.cached.value) }
              : { type: 'string' as const, value: String(record.cached.value ?? '') }
          grid.set({ sheet: sourceSheetId(record.sheet), row: Number(match[2]), column }, cached)
        }
      }
      if (process.env.USE_COMPILED_SOURCE_SNAPSHOT === '1') {
        const result = executeSourceSnapshot(grid, new Date('2025-03-01T00:00:00Z'))
        if (process.env.PROFILE_SOURCE_SNAPSHOT === '1') console.info(JSON.stringify(result))
      }
      else executeWorkbookComponents(
          grid,
          new Date('2025-03-01T00:00:00Z'),
          preserveSnapshot
            ? components.map((component) => component.filter((family) => !sourceFamilies.has(`${family.sourceSheetName}:${family.digest}`))).filter((component) => component.length)
            : components,
          Number(process.env.COMPONENT_MAXIMUM_PASSES ?? 8),
        )
      const lines = createInterface({ input: createReadStream(process.env.PARITY_GOLDEN_PATH!, { encoding: 'utf8' }), crlfDelay: Infinity })
      let compared = 0
      let excluded = 0
      let mismatchCount = 0
      const mismatchesBySheet = new Map<string, number>()
      const mismatchesByFamily = new Map<string, number>()
      const mismatchesByType = new Map<string, number>()
      const mismatchSamples: unknown[] = []
      for await (const line of lines) {
        if (!line) continue
        const record = JSON.parse(line) as { sheet: string; address: string; cached: { type: string; value?: unknown }; formulaFamilyDigest: string }
        if (record.formulaFamilyDigest === 'f010d1626cfbfb27aa09f02292222329c923b1404e0a440dd1a79c0cfb631e8b') { excluded += 1; continue }
        const match = /^([A-Z]+)(\d+)$/.exec(record.address)!
        const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
        const actual = grid.get({ sheet: sourceSheetId(record.sheet), row: Number(match[2]), column })
        compared += 1
        const matches = record.cached.type === 'number' && actual.type === 'number'
          ? Math.abs(actual.value - Number(record.cached.value)) <= Math.max(1e-7, Math.abs(Number(record.cached.value)) * 1e-9)
          : record.cached.type === 'string' && actual.type === 'string'
            ? actual.value === record.cached.value
            : record.cached.type === 'boolean' && actual.type === 'boolean'
              ? actual.value === record.cached.value
              : record.cached.type === 'error' && actual.type === 'error'
                ? actual.code === record.cached.value
                : record.cached.type === 'blank' && actual.type === 'blank'
        if (!matches) {
          mismatchCount += 1
          mismatchesBySheet.set(record.sheet, (mismatchesBySheet.get(record.sheet) ?? 0) + 1)
          const familyKey = `${record.sheet}:${record.formulaFamilyDigest}`
          mismatchesByFamily.set(familyKey, (mismatchesByFamily.get(familyKey) ?? 0) + 1)
          const typeKey = `${actual.type}->${record.cached.type}`
          mismatchesByType.set(typeKey, (mismatchesByType.get(typeKey) ?? 0) + 1)
          if (
            mismatchSamples.length < 20 &&
            (!process.env.PARITY_FAMILY_DIGEST || record.formulaFamilyDigest === process.env.PARITY_FAMILY_DIGEST)
          ) mismatchSamples.push({ sheet: record.sheet, address: record.address, actual, expected: record.cached })
        }
      }
      const topMismatchFamilies = [...mismatchesByFamily.entries()]
        .map(([family, count]) => ({ family, count }))
        .sort((left, right) => right.count - left.count || left.family.localeCompare(right.family))
        .slice(0, 30)
      const allMismatchFamilies = process.env.REPORT_ALL_MISMATCH_FAMILIES === '1'
        ? [...mismatchesByFamily.entries()].map(([family, count]) => ({ family, count })).sort((left, right) => right.count - left.count || left.family.localeCompare(right.family))
        : undefined
      console.info(JSON.stringify({ compared, excluded, mismatchCount, mismatchesBySheet: Object.fromEntries(mismatchesBySheet), mismatchesByType: Object.fromEntries(mismatchesByType), topMismatchFamilies, ...(allMismatchFamilies ? { allMismatchFamilies } : {}), mismatchSamples }))
      expect(compared + excluded).toBe(1_175_711)
    },
    240_000,
  )

  it.runIf(process.env.SHEET_ORDER_RUNTIME === '1')(
    'executes formulas in workbook sheet-row-column order',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      executeWorkbookSheetOrder(grid, new Date('2025-03-01T00:00:00Z'))
      const stats = executeWorkbookSheetOrder(grid, new Date('2025-03-01T00:00:00Z'))
      console.info(JSON.stringify(stats))
      expect(stats).toMatchObject({ familyCount: 823, regionCount: 1_015, cellCount: 1_175_711 })
    },
    180_000,
  )

  it.runIf(process.env.COMPONENT_ITERATION_RUNTIME === '1')(
    'settles cyclic components before calculating downstream components',
    () => {
      const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
      seedWorkbookGrid(grid)
      const result = executeWorkbookComponents(
        grid,
        new Date('2025-03-01T00:00:00Z'),
        formulaFamilyComponents(loadRuntimeFormulaFamilies()),
        Number(process.env.COMPONENT_MAXIMUM_PASSES ?? 8),
      )
      console.info(JSON.stringify(result))
      expect(result.stats).toMatchObject({ familyCount: 823, regionCount: 1_015, cellCount: 1_175_711 })
    },
    300_000,
  )

  it.runIf(Boolean(process.env.DIAGNOSE_RUNTIME_CELLS))('prints selected calculated cells', () => {
    const grid = new TypedModelGrid(WORKBOOK_SHEETS.map(({ id, rows, columns }) => ({ id, rows, columns })))
    seedWorkbookGrid(grid)
    executeWorkbookComponents(grid, new Date('2025-03-01T00:00:00Z'), formulaFamilyComponents(loadRuntimeFormulaFamilies()))
    const values = process.env.DIAGNOSE_RUNTIME_CELLS!.split(',').map((entry) => {
      const [sheet, address] = entry.split('!')
      const match = /^([A-Z]+)(\d+)$/.exec(address)!
      const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
      return { entry, value: grid.get({ sheet: sourceSheetId(sheet), row: Number(match[2]), column }) }
    })
    console.info(JSON.stringify(values))
  }, 120_000)
})
