import type { CellValue } from '../types'

export type FormulaFunctionContext = Readonly<{
  now: Date
}>

export type FormulaFunction = (args: readonly CellValue[], context: FormulaFunctionContext) => CellValue

export class FormulaFunctionRegistry {
  private readonly functions = new Map<string, FormulaFunction>()

  register(name: string, implementation: FormulaFunction): this {
    const normalized = normalizeName(name)
    if (this.functions.has(normalized)) throw new Error(`Formula function already registered: ${normalized}`)
    this.functions.set(normalized, implementation)
    return this
  }

  call(name: string, args: readonly CellValue[], context: FormulaFunctionContext): CellValue {
    const normalized = normalizeName(name)
    const implementation = this.functions.get(normalized)
    if (!implementation) return { type: 'error', code: '#NAME?', detail: `Unsupported function ${normalized}` }
    try {
      return implementation(args, context)
    } catch (error) {
      return { type: 'error', code: '#VALUE!', detail: error instanceof Error ? error.message : 'Unknown formula error' }
    }
  }

  names(): readonly string[] {
    return [...this.functions.keys()].sort()
  }
}

const normalizeName = (name: string): string => name.replace(/^_xlfn\./i, '').trim().toUpperCase()

