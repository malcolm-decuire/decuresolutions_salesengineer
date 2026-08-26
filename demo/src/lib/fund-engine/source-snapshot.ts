import artifact from './generated/source-snapshot.json'
import { formulaFamilyComponents } from './formula-dependencies'
import { loadRuntimeFormulaFamilies, sourceSheetId } from './formula-regions'
import type { ModelGrid } from './grid'
import { SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS } from './source-snapshot-manifest'
import type { CellValue } from './types'
import { executeWorkbookComponents, type WorkbookComponentExecution } from './workbook-runtime'

export type SourceSnapshotExecution = Readonly<{
  execution: WorkbookComponentExecution
  snapshotFamilyCount: number
  snapshotCellCount: number
  totalFormulaCellCount: number
  familyKeysSha256: string
  valuesSha256: string
}>

const addressPattern = /^([A-Z]+)(\d+)$/

export const SOURCE_SNAPSHOT_ARTIFACT_MANIFEST = Object.freeze({
  version: artifact.version,
  familyKeyCount: artifact.familyKeyCount,
  recordCount: artifact.recordCount,
  familyKeysSha256: artifact.familyKeysSha256,
  valuesSha256: artifact.valuesSha256,
})

export const executeSourceSnapshot = (grid: ModelGrid, now: Date): SourceSnapshotExecution => {
  const families = loadRuntimeFormulaFamilies()
  const components = formulaFamilyComponents(families)
  const sourceCycle = components.filter((component) => component.length === 67)
  if (sourceCycle.length !== 1) throw new Error(`Expected one 67-family source cycle, found ${sourceCycle.length}`)
  const snapshotFamilies = new Set([
    ...sourceCycle[0].map((family) => `${family.sourceSheetName}:${family.digest}`),
    ...SOURCE_SNAPSHOT_CLOSURE_FAMILY_KEYS,
  ])
  if (snapshotFamilies.size !== artifact.familyKeyCount) throw new Error('Source snapshot family count does not match generated artifact')
  if (artifact.recordCount !== artifact.records.length) throw new Error('Source snapshot record count does not match generated artifact')

  for (const record of artifact.records) {
    const [sheetName, address, type, raw] = record as [string, string, string, string | number | boolean | null]
    const match = addressPattern.exec(address)
    if (!match) throw new Error(`Invalid source snapshot address ${sheetName}!${address}`)
    const column = [...match[1]].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0)
    grid.set(
      { sheet: sourceSheetId(sheetName), row: Number(match[2]), column },
      snapshotCell(type, raw),
    )
  }

  const calculatedComponents = components
    .map((component) => component.filter((family) => !snapshotFamilies.has(`${family.sourceSheetName}:${family.digest}`)))
    .filter((component) => component.length)
  const execution = executeWorkbookComponents(grid, now, calculatedComponents)
  return {
    execution,
    snapshotFamilyCount: snapshotFamilies.size,
    snapshotCellCount: artifact.recordCount,
    totalFormulaCellCount: families.reduce((total, family) => total + family.cellCount, 0),
    familyKeysSha256: artifact.familyKeysSha256,
    valuesSha256: artifact.valuesSha256,
  }
}

const snapshotCell = (type: string, raw: string | number | boolean | null): CellValue => {
  if (type === 'number') return { type: 'number', value: Number(raw) }
  if (type === 'boolean') return { type: 'boolean', value: Boolean(raw) }
  if (type === 'string') return { type: 'string', value: String(raw ?? '') }
  throw new Error(`Unsupported source snapshot cell type ${type}`)
}
