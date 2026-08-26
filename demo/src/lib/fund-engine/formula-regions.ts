import artifact from './generated/workbook-formula-regions.json'
import { WORKBOOK_SHEETS } from './manifest'
import { parseFormula, type FormulaNode } from './formula-parser'
import { familyId, sheetId, type FamilyId, type SheetId } from './types'

export type FormulaRegion = Readonly<{
  startRow: number
  endRow: number
  startColumn: number
  endColumn: number
}>

export type RuntimeFormulaFamily = Readonly<{
  id: FamilyId
  sheet: SheetId
  sourceSheetName: string
  digest: string
  formula: string
  templateRow: number
  templateColumn: number
  ast: FormulaNode
  cellCount: number
  regions: readonly FormulaRegion[]
}>

const addressPattern = /^([A-Z]+)(\d+)$/
const columns = (letters: string): number => [...letters].reduce(
  (total, character) => total * 26 + character.charCodeAt(0) - 64,
  0,
)

const sheetIds = new Map(WORKBOOK_SHEETS.map((sheet) => [sheet.name, sheet.id]))

export const loadRuntimeFormulaFamilies = (): readonly RuntimeFormulaFamily[] => {
  if (artifact.familyCount !== artifact.families.length) {
    throw new Error('Formula-region family count does not match artifact manifest')
  }
  const families = artifact.families.map((source) => {
    const sheet = sheetIds.get(source.sheet)
    if (!sheet) throw new Error(`Formula family targets unknown sheet ${source.sheet}`)
    const address = addressPattern.exec(source.exampleAddress)
    if (!address) throw new Error(`Invalid formula template address ${source.exampleAddress}`)
    const regions = source.regions.map(validateRegion)
    const cellCount = regions.reduce((total, region) => total + regionArea(region), 0)
    if (cellCount !== source.expectedCellCount || cellCount !== source.compiledCellCount) {
      throw new Error(`Formula family ${source.digest} has inconsistent cell coverage`)
    }
    return {
      id: familyId(`${source.sheet}:${source.digest}`),
      sheet,
      sourceSheetName: source.sheet,
      digest: source.digest,
      formula: source.exampleFormula,
      templateRow: Number(address[2]),
      templateColumn: columns(address[1]),
      ast: parseFormula(source.exampleFormula),
      cellCount,
      regions,
    }
  })
  const totalCells = families.reduce((total, family) => total + family.cellCount, 0)
  const totalRegions = families.reduce((total, family) => total + family.regions.length, 0)
  if (totalCells !== artifact.formulaCellCount || totalRegions !== artifact.regionCount) {
    throw new Error('Runtime formula families do not cover the artifact manifest')
  }
  return families
}

const validateRegion = (region: FormulaRegion): FormulaRegion => {
  if (
    !Number.isInteger(region.startRow) || !Number.isInteger(region.endRow) ||
    !Number.isInteger(region.startColumn) || !Number.isInteger(region.endColumn) ||
    region.startRow < 1 || region.startColumn < 1 ||
    region.endRow < region.startRow || region.endColumn < region.startColumn
  ) throw new Error('Invalid compiled formula region')
  return region
}

const regionArea = (region: FormulaRegion): number =>
  (region.endRow - region.startRow + 1) *
  (region.endColumn - region.startColumn + 1)

export const sourceSheetId = (name: string): SheetId => sheetIds.get(name) ?? sheetId(name)
