/**
 * Mann-Whitney U (two-sample rank-sum) test.
 * @spec PRISM-ANA-013
 */

import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

type Ranked = { v: number; group: 0 | 1; rank?: number };

/** Assign ranks to values (averaging ties). Returns ranks for group 0 only (used for U1). */
function rankAll(arr1: number[], arr2: number[]): { ranks1: number[] } {
  const combined: Ranked[] = [
    ...arr1.map((v) => ({ v, group: 0 as 0 | 1 })),
    ...arr2.map((v) => ({ v, group: 1 as 0 | 1 })),
  ];
  combined.sort((a, b) => a.v - b.v);
  const n = combined.length;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && combined[j]!.v === combined[i]!.v) j++;
    const rankAvg = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) combined[k]!.rank = rankAvg;
    i = j;
  }
  const ranks1 = combined.filter((c) => c.group === 0).map((c) => c.rank!);
  return { ranks1 };
}

export function runMannWhitney(
  columnLabels: [string, string],
  rows: (number | null)[][],
  colIndices: [number, number]
): AnalysisResult {
  const [i1, i2] = colIndices;
  const v1 = rows
    .map((r) => r[i1])
    .filter((v): v is number => v != null && Number.isFinite(v));
  const v2 = rows
    .map((r) => r[i2])
    .filter((v): v is number => v != null && Number.isFinite(v));
  const n1 = v1.length;
  const n2 = v2.length;
  if (n1 === 0 || n2 === 0) {
    return {
      type: 'mann_whitney',
      u: 0,
      p: NaN,
      label1: columnLabels[0],
      label2: columnLabels[1],
      median1: NaN,
      median2: NaN,
    };
  }
  const { ranks1 } = rankAll(v1, v2);
  const R1 = ranks1.reduce((a, b) => a + b, 0);
  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);
  const mu = (n1 * n2) / 2;
  const tieFactor = 1;
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12) * tieFactor;
  const z = sigma > 0 ? (U - mu) / sigma : 0;
  const p = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
  return {
    type: 'mann_whitney',
    u: U,
    p: Number.isFinite(p) ? p : NaN,
    label1: columnLabels[0],
    label2: columnLabels[1],
    median1: jStat.median(v1),
    median2: jStat.median(v2),
  };
}
