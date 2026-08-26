export type FormulaReference = Readonly<{
  kind: 'reference'
  sheet?: string
  row: number
  column: number
  absoluteRow: boolean
  absoluteColumn: boolean
}>

export type FormulaRowReference = Readonly<{
  kind: 'row-reference'
  sheet?: string
  row: number
  absoluteRow: boolean
}>

export type FormulaColumnReference = Readonly<{
  kind: 'column-reference'
  sheet?: string
  column: number
  absoluteColumn: boolean
}>

export type FormulaRangeReference = FormulaReference | FormulaRowReference | FormulaColumnReference

export type FormulaNode =
  | Readonly<{ kind: 'number'; value: number }>
  | Readonly<{ kind: 'string'; value: string }>
  | Readonly<{ kind: 'boolean'; value: boolean }>
  | Readonly<{ kind: 'error'; code: string; sheet?: string }>
  | FormulaReference
  | FormulaRowReference
  | FormulaColumnReference
  | Readonly<{ kind: 'range'; start: FormulaRangeReference; end: FormulaRangeReference }>
  | Readonly<{ kind: 'unary'; operator: '+' | '-'; operand: FormulaNode }>
  | Readonly<{ kind: 'percent'; operand: FormulaNode }>
  | Readonly<{
      kind: 'binary'
      operator: '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '<=' | '>' | '>='
      left: FormulaNode
      right: FormulaNode
    }>
  | Readonly<{ kind: 'call'; name: string; arguments: readonly FormulaNode[] }>

type Token = Readonly<{ type: 'number' | 'string' | 'identifier' | 'operator' | 'eof'; value: string }>

const referencePattern = /^(?:(?:'((?:[^']|'')+)'|([^!]+))!)?(\$?)([A-Z]{1,3})(\$?)(\d+)$/i
const rowReferencePattern = /^(?:(?:'((?:[^']|'')+)'|([^!]+))!)?(\$?)(\d+)$/
const columnReferencePattern = /^(?:(?:'((?:[^']|'')+)'|([^!]+))!)?(\$?)([A-Z]{1,3})$/i

export const parseFormula = (source: string): FormulaNode => new Parser(tokenize(source)).parse()

class Parser {
  private index = 0

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): FormulaNode {
    const node = this.expression(0)
    this.expect('eof')
    return node
  }

  private expression(minimumPrecedence: number): FormulaNode {
    let left = this.prefix()
    while (true) {
      if (this.peek().value === '%') {
        if (8 < minimumPrecedence) break
        this.take()
        left = { kind: 'percent', operand: left }
        continue
      }
      if (this.peek().value === ':') {
        if (9 < minimumPrecedence) break
        this.take()
        const right = this.expression(10)
        const start = asRangeReference(left)
        const end = asRangeReference(right)
        if (!start || !end || start.kind !== end.kind) {
          throw new SyntaxError('Range operands must be cell references')
        }
        left = { kind: 'range', start, end }
        continue
      }
      const precedence = binaryPrecedence[this.peek().value]
      if (precedence === undefined || precedence < minimumPrecedence) break
      const operator = this.take().value as Extract<FormulaNode, { kind: 'binary' }>['operator']
      const right = this.expression(precedence + (operator === '^' ? 0 : 1))
      left = { kind: 'binary', operator, left, right }
    }
    return left
  }

  private prefix(): FormulaNode {
    const token = this.take()
    if (token.type === 'number') return { kind: 'number', value: Number(token.value) }
    if (token.type === 'string') return { kind: 'string', value: token.value }
    if (token.value === '+' || token.value === '-') {
      return { kind: 'unary', operator: token.value, operand: this.expression(7) }
    }
    if (token.value === '(') {
      const node = this.expression(0)
      this.expect('operator', ')')
      return node
    }
    if (token.type === 'identifier') {
      const errorSeparator = token.value.lastIndexOf('!#')
      const errorCode = errorSeparator >= 0 ? token.value.slice(errorSeparator + 1) : token.value
      if (/^#[A-Z0-9/?]+!?$/i.test(errorCode)) {
        const rawSheet = errorSeparator >= 0 ? token.value.slice(0, errorSeparator) : undefined
        const sheet = rawSheet?.startsWith("'") && rawSheet.endsWith("'")
          ? rawSheet.slice(1, -1).replaceAll("''", "'")
          : rawSheet
        return { kind: 'error', code: errorCode.toUpperCase(), ...(sheet ? { sheet } : {}) }
      }
      if (/^(TRUE|FALSE)$/i.test(token.value)) {
        return { kind: 'boolean', value: token.value.toUpperCase() === 'TRUE' }
      }
      if (this.peek().value === '(') {
        this.take()
        const args: FormulaNode[] = []
        if (this.peek().value !== ')') {
          do {
            args.push(this.expression(0))
            if (this.peek().value !== ',') break
            this.take()
          } while (true)
        }
        this.expect('operator', ')')
        return { kind: 'call', name: token.value.replace(/^_xlfn\./i, '').toUpperCase(), arguments: args }
      }
      const reference = parseReference(token.value) ?? parseAxisReference(token.value)
      if (reference) return reference
    }
    throw new SyntaxError(`Unexpected token ${token.value || '<eof>'}`)
  }

  private peek(): Token {
    return this.tokens[this.index]
  }

  private take(): Token {
    return this.tokens[this.index++]
  }

  private expect(type: Token['type'], value?: string): Token {
    const token = this.take()
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new SyntaxError(`Expected ${value ?? type}, received ${token.value || token.type}`)
    }
    return token
  }
}

const binaryPrecedence: Readonly<Record<string, number>> = {
  '=': 1,
  '<>': 1,
  '<': 1,
  '<=': 1,
  '>': 1,
  '>=': 1,
  '&': 2,
  '+': 3,
  '-': 3,
  '*': 4,
  '/': 4,
  '^': 6,
}

const parseReference = (value: string): FormulaReference | undefined => {
  const match = referencePattern.exec(value)
  if (!match) return undefined
  const sheet = (match[1] ?? match[2])?.replaceAll("''", "'")
  return {
    kind: 'reference',
    ...(sheet ? { sheet } : {}),
    column: [...match[4].toUpperCase()].reduce(
      (total, character) => total * 26 + character.charCodeAt(0) - 64,
      0,
    ),
    row: Number(match[6]),
    absoluteColumn: match[3] === '$',
    absoluteRow: match[5] === '$',
  }
}

const parseAxisReference = (
  value: string,
): FormulaRowReference | FormulaColumnReference | undefined => {
  const row = rowReferencePattern.exec(value)
  if (row) {
    const sheet = (row[1] ?? row[2])?.replaceAll("''", "'")
    return {
      kind: 'row-reference',
      ...(sheet ? { sheet } : {}),
      row: Number(row[4]),
      absoluteRow: row[3] === '$',
    }
  }
  const column = columnReferencePattern.exec(value)
  if (!column) return undefined
  const sheet = (column[1] ?? column[2])?.replaceAll("''", "'")
  return {
    kind: 'column-reference',
    ...(sheet ? { sheet } : {}),
    column: [...column[4].toUpperCase()].reduce(
      (total, character) => total * 26 + character.charCodeAt(0) - 64,
      0,
    ),
    absoluteColumn: column[3] === '$',
  }
}

const asRangeReference = (node: FormulaNode): FormulaRangeReference | undefined => {
  if (node.kind === 'reference' || node.kind === 'row-reference' || node.kind === 'column-reference') return node
  if (node.kind === 'number' && Number.isInteger(node.value) && node.value > 0) {
    return { kind: 'row-reference', row: node.value, absoluteRow: false }
  }
  return undefined
}

const tokenize = (rawSource: string): readonly Token[] => {
  const source = rawSource.startsWith('=') ? rawSource.slice(1) : rawSource
  const tokens: Token[] = []
  let index = 0
  while (index < source.length) {
    const character = source[index]
    if (/\s/.test(character)) {
      index += 1
      continue
    }
    if (character === '"') {
      let value = ''
      index += 1
      while (index < source.length) {
        if (source[index] !== '"') {
          value += source[index++]
          continue
        }
        if (source[index + 1] === '"') {
          value += '"'
          index += 2
          continue
        }
        index += 1
        break
      }
      tokens.push({ type: 'string', value })
      continue
    }
    const number = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?/i)?.[0]
    if (number) {
      tokens.push({ type: 'number', value: number })
      index += number.length
      continue
    }
    const operator = source.slice(index).match(/^(?:<=|>=|<>|[+\-*/^&%=<>,():])/i)?.[0]
    if (operator) {
      tokens.push({ type: 'operator', value: operator })
      index += operator.length
      continue
    }
    let end = index
    let quoted = false
    while (end < source.length) {
      if (source[end] === "'") {
        if (quoted && source[end + 1] === "'") {
          end += 2
          continue
        }
        quoted = !quoted
        end += 1
        continue
      }
      if (!quoted && /[\s+\-*/^&%=<>,():]/.test(source[end])) break
      end += 1
    }
    if (end === index) throw new SyntaxError(`Unsupported character ${character}`)
    tokens.push({ type: 'identifier', value: source.slice(index, end) })
    index = end
  }
  tokens.push({ type: 'eof', value: '' })
  return tokens
}
