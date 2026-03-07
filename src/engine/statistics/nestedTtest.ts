import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

/**
 * Nested t-test: compare two groups when values are nested (replicates within experimental units).
 * Column = experimental unit; groupForColumn assigns columns to groups. Compare group means of column means.
 * @spec PRISM-TBL-010
 */
export function runNestedTtest(
  columnLabels: string[],
  rows: (number | null)[][],
  groupLabels: [string, string],
  groupForColumn: number[]
): AnalysisResult {
  const colMeans = columnLabels.map((_, c) => {
    const vals = rows
      .map((r) => r[c])
      .filter((v): v is number => v != null && Number.isFinite(v));
    return vals.length > 0 ? jStat.mean(vals) : NaN;
  });

  const g0Means: number[] = [];
  const g1Means: number[] = [];
  columnLabels.forEach((_, c) => {
    const g = groupForColumn[c];
    const m = colMeans[c];
    if (Number.isFinite(m)) {
      if (g === 0) g0Means.push(m);
      else if (g === 1) g1Means.push(m);
    }
  });

  const n0 = g0Means.length;
  const n1 = g1Means.length;
  if (n0 < 1 || n1 < 1) {
    return {
      type: 'nested_ttest',
      t: NaN,
      p: NaN,
      df: 0,
      mean1: jStat.mean(g0Means),
      mean2: jStat.mean(g1Means),
      ci: [NaN, NaN],
      label1: groupLabels[0],
      label2: groupLabels[1],
    };
  }

  const mean1 = jStat.mean(g0Means);
  const mean2 = jStat.mean(g1Means);
  const s1 = n0 > 1 ? jStat.stdev(g0Means, true) : 0;
  const s2 = n1 > 1 ? jStat.stdev(g1Means, true) : 0;
  const se1 = n0 > 0 ? s1 / Math.sqrt(n0) : 0;
  const se2 = n1 > 0 ? s2 / Math.sqrt(n1) : 0;
  const seDiff = Math.sqrt(se1 * se1 + se2 * se2);
  if (seDiff === 0) {
    return {
      type: 'nested_ttest',
      t: 0,
      p: 1,
      df: n0 + n1 - 2,
      mean1,
      mean2,
      ci: [0, 0],
      label1: groupLabels[0],
      label2: groupLabels[1],
    };
  }
  const t = (mean1 - mean2) / seDiff;
  // Welch-Satterthwaite df to match Welch SE (same as unpaired t-test in ttest.ts)
  const dfNum = (se1 * se1 + se2 * se2) ** 2;
  const dfDen =
    (n0 > 1 ? (se1 * se1 * se1 * se1) / (n0 - 1) : 0) +
    (n1 > 1 ? (se2 * se2 * se2 * se2) / (n1 - 1) : 0);
  const df = dfDen > 0 ? dfNum / dfDen : n0 + n1 - 2;
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const tCrit = jStat.studentt.inv(0.975, df);
  const ci: [number, number] = [
    mean1 - mean2 - tCrit * seDiff,
    mean1 - mean2 + tCrit * seDiff,
  ];

  return {
    type: 'nested_ttest',
    t,
    p,
    df,
    mean1,
    mean2,
    ci,
    label1: groupLabels[0],
    label2: groupLabels[1],
  };
}
