/**
 * Fisher's exact test for 2×2 contingency tables.
 * @spec PRISM-ANA-009
 */

import type { AnalysisResult } from '../../types';

function logFactorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n <= 1) return 0;
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log(i);
  return s;
}

/** Fisher's exact p-value (two-tailed) for 2×2 table [[a,b],[c,d]] */
export function runFisherExact(counts: number[][]): AnalysisResult {
  const a = counts[0]?.[0] ?? 0;
  const b = counts[0]?.[1] ?? 0;
  const c = counts[1]?.[0] ?? 0;
  const d = counts[1]?.[1] ?? 0;
  const n = a + b + c + d;
  if (n === 0) {
    return { type: 'fisher_exact', p: NaN };
  }
  const logNum =
    logFactorial(a + b) +
    logFactorial(c + d) +
    logFactorial(a + c) +
    logFactorial(b + d);
  const logDenom = logFactorial(n) + logFactorial(a) + logFactorial(b) + logFactorial(c) + logFactorial(d);
  const pObs = Math.exp(logNum - logDenom);
  const minBC = Math.min(b, c);
  let pSum = 0;
  for (let i = 0; i <= minBC; i++) {
    const aa = a + i;
    const bb = b - i;
    const cc = c - i;
    const dd = d + i;
    if (aa < 0 || bb < 0 || cc < 0 || dd < 0) continue;
    const logP =
      logFactorial(aa + bb) +
      logFactorial(cc + dd) +
      logFactorial(aa + cc) +
      logFactorial(bb + dd) -
      logFactorial(n) -
      logFactorial(aa) -
      logFactorial(bb) -
      logFactorial(cc) -
      logFactorial(dd);
    const p = Math.exp(logP);
    if (p <= pObs + 1e-10) pSum += p;
  }
  const oddsRatio = (a * d) / (b * c);
  return {
    type: 'fisher_exact',
    p: Math.min(1, pSum),
    oddsRatio: Number.isFinite(oddsRatio) ? oddsRatio : undefined,
  };
}
