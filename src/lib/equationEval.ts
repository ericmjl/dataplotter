/**
 * Safe row-wise equation evaluator for column transformations.
 * @spec TRANSFORM-002 Allowlist of variable names and functions only; no arbitrary code.
 */

const ALLOWED_FUNCTIONS: Record<string, (args: number[]) => number> = {
  log10: (a) => Math.log10(a[0]!),
  log: (a) => Math.log(a[0]!),
  exp: (a) => Math.exp(a[0]!),
  sqrt: (a) => Math.sqrt(a[0]!),
  abs: (a) => Math.abs(a[0]!),
  round: (a) => Math.round(a[0]!),
  min: (a) => Math.min(a[0]!, a[1]!),
  max: (a) => Math.max(a[0]!, a[1]!),
};

type Token =
  | { type: 'number'; value: number }
  | { type: 'id'; name: string }
  | { type: 'op'; op: '+' | '-' | '*' | '/' | '^' }
  | { type: 'lp' }
  | { type: 'rp' }
  | { type: 'comma' }
  | { type: 'eof' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.trim();
  while (i < s.length) {
    if (/\s/.test(s[i]!)) {
      i++;
      continue;
    }
    if (s[i] === '(') {
      tokens.push({ type: 'lp' });
      i++;
      continue;
    }
    if (s[i] === ')') {
      tokens.push({ type: 'rp' });
      i++;
      continue;
    }
    if (s[i] === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    if (/[+\-*/^]/.test(s[i]!)) {
      const op = s[i] as '+' | '-' | '*' | '/' | '^';
      tokens.push({ type: 'op', op });
      i++;
      continue;
    }
    const numMatch = s.slice(i).match(/^-?\d+\.?\d*(?:e[-+]?\d+)?/i);
    if (numMatch) {
      tokens.push({ type: 'number', value: Number(numMatch[0]) });
      i += numMatch[0].length;
      continue;
    }
    const idMatch = s.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (idMatch) {
      tokens.push({ type: 'id', name: idMatch[0]! });
      i += idMatch[0].length;
      continue;
    }
    return []; // invalid token
  }
  tokens.push({ type: 'eof' });
  return tokens;
}

function isAllowedVariable(name: string, allowedVars: Set<string>): boolean {
  return allowedVars.has(name);
}

function isAllowedFunction(name: string): boolean {
  return name in ALLOWED_FUNCTIONS;
}

/**
 * Evaluate a single expression with the given variable scope.
 * Returns null if the expression is invalid, references disallowed names, or throws (e.g. log(0)).
 */
export function evaluateEquation(
  equation: string,
  scope: Record<string, number | null>,
  allowedVars: Set<string>
): number | null {
  const tokens = tokenize(equation);
  if (tokens.length <= 1) return null; // empty or only eof
  let pos = 0;
  function cur(): Token {
    return tokens[pos] ?? { type: 'eof' };
  }
  function consume(): Token {
    const t = cur();
    if (t.type !== 'eof') pos++;
    return t;
  }

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (cur().type === 'op' && (cur() as { op: string }).op === '+') {
      consume();
      const right = parseTerm();
      if (right === null) return null;
      left = left + right;
    }
    while (cur().type === 'op' && (cur() as { op: string }).op === '-') {
      consume();
      const right = parseTerm();
      if (right === null) return null;
      left = left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (cur().type === 'op' && ((cur() as { op: string }).op === '*' || (cur() as { op: string }).op === '/')) {
      const op = (consume() as { op: '*' | '/' }).op;
      const right = parseFactor();
      if (right === null) return null;
      if (op === '/') {
        if (right === 0) return null;
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function parseFactor(): number | null {
    const t = cur();
    if (t.type === 'op' && (t as { op: string }).op === '-') {
      consume();
      const v = parseFactor();
      return v === null ? null : -v;
    }
    if (t.type === 'number') {
      consume();
      return (t as { value: number }).value;
    }
    if (t.type === 'id') {
      const name = (t as { name: string }).name;
      consume();
      if (isAllowedFunction(name)) {
        if (cur().type !== 'lp') return null;
        consume();
        const args: number[] = [];
        if (cur().type !== 'rp') {
          const a = parseExpr();
          if (a === null) return null;
          args.push(a);
          while (cur().type === 'comma') {
            consume();
            const a2 = parseExpr();
            if (a2 === null) return null;
            args.push(a2);
          }
        }
        if (cur().type !== 'rp') return null;
        consume();
        const fn = ALLOWED_FUNCTIONS[name];
        if (!fn || (name === 'min' && args.length !== 2) || (name === 'max' && args.length !== 2)) return null;
        if (args.length !== 1 && name !== 'min' && name !== 'max') return null;
        try {
          return fn(args);
        } catch {
          return null;
        }
      }
      if (!isAllowedVariable(name, allowedVars)) return null;
      const val = scope[name];
      if (val === null || val === undefined || !Number.isFinite(val)) return null;
      return val;
    }
    if (t.type === 'lp') {
      consume();
      const v = parseExpr();
      if (v === null) return null;
      if (cur().type !== 'rp') return null;
      consume();
      return v;
    }
    return null;
  }

  // power has higher precedence than unary; we treat factor as primary for simplicity
  // so ^ is not in this minimal set; add if needed: parsePower -> parseFactor (^ parseFactor)*
  const result = parseExpr();
  if (result === null) return null;
  if (cur().type !== 'eof') return null;
  if (!Number.isFinite(result)) return null;
  return result;
}
