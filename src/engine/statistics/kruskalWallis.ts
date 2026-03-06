/**
 * Kruskal-Wallis H (one-way nonparametric ANOVA).
 * @spec PRISM-ANA-013
 */

import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

function rankAll(groups: number[][]): number[][] {
  const combined: { v: number; gi: number; gj: number; rank?: number }[] = [];
  groups.forEach((g, gi) => g.forEach((v, gj) => combined.push({ v, gi, gj })));
  combined.sort((a, b) => a.v - b.v);
  let i = 0;
  const n = combined.length;
  while (i < n) {
    let j = i;
    while (j < n && combined[j]!.v === combined[i]!.v) j++;
    const rankAvg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) combined[k]!.rank = rankAvg;
    i = j;
  }
  const out: number[][] = groups.map((g) => Array.from({ length: g.length }, () => 0));
  combined.forEach((c) => {
    out[c.gi]![c.gj]! = c.rank!;
  });
  return out;
}

export function runKruskalWallis(
  columnLabels: string[],
  rows: (number | null)[][]
): AnalysisResult {
  const groups = columnLabels.map((_, c) =>
    rows.map((r) => r[c]).filter((v): v is number => v != null && Number.isFinite(v))
  );
  const nonEmpty = groups.filter((g) => g.length > 0);
  const k = nonEmpty.length;
  if (k < 2) {
    return {
      type: 'kruskal_wallis',
      h: 0,
      p: NaN,
      df: 0,
      groupMedians: columnLabels.map((label) => ({ label, median: NaN })),
    };
  }
  const ranked = rankAll(groups);
  const N = ranked.reduce((sum, g) => sum + g.length, 0);
  let sumRi2ni = 0;
  groups.forEach((g, i) => {
    const Ri = ranked[i]!.reduce((a, b) => a + b, 0);
    const ni = g.length;
    if (ni > 0) sumRi2ni += (Ri * Ri) / ni;
  });
  const H = (12 / (N * (N + 1))) * sumRi2ni - 3 * (N + 1);
  const df = k - 1;
  const p = df > 0 && Number.isFinite(H) ? 1 - jStat.chisquare.cdf(H, df) : NaN;
  const groupMedians = groups.map((g, i) => ({
    label: columnLabels[i] ?? '',
    median: g.length > 0 ? jStat.median(g) : NaN,
  }));
  return {
    type: 'kruskal_wallis',
    h: H,
    p,
    df,
    groupMedians,
  };
}
