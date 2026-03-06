/**
 * Chi-square test of independence for contingency tables.
 * @spec PRISM-ANA-008
 */

import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

export function runChiSquare(
  rowLabels: string[],
  columnLabels: string[],
  counts: number[][]
): AnalysisResult {
  const R = rowLabels.length;
  const C = columnLabels.length;
  const total = counts.flat().reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { type: 'chi_square', chi2: NaN, p: NaN, df: 0 };
  }
  const rowSums = counts.map((row) => row.reduce((a, b) => a + b, 0));
  const colSums = Array.from({ length: C }, (_, j) =>
    counts.reduce((a, row) => a + (row[j] ?? 0), 0)
  );
  let chi2 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const observed = counts[i]?.[j] ?? 0;
      const expected = (rowSums[i]! * colSums[j]!) / total;
      if (expected > 0) {
        chi2 += (observed - expected) ** 2 / expected;
      }
    }
  }
  const df = (R - 1) * (C - 1);
  const p = df > 0 && Number.isFinite(chi2) ? 1 - jStat.chisquare.cdf(chi2, df) : NaN;
  return { type: 'chi_square', chi2, p, df };
}
