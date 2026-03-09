import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

function welchTTest(
  arr1: number[],
  arr2: number[]
): { t: number; df: number; p: number } {
  const n1 = arr1.length;
  const n2 = arr2.length;
  const m1 = jStat.mean(arr1);
  const m2 = jStat.mean(arr2);
  const s1 = n1 > 1 ? jStat.stdev(arr1, true) : 0;
  const s2 = n2 > 1 ? jStat.stdev(arr2, true) : 0;
  const se1 = n1 > 0 ? s1 / Math.sqrt(n1) : 0;
  const se2 = n2 > 0 ? s2 / Math.sqrt(n2) : 0;
  const seDiff = Math.sqrt(se1 * se1 + se2 * se2);
  if (seDiff === 0) {
    return { t: 0, df: n1 + n2 - 2, p: 1 };
  }
  const t = (m1 - m2) / seDiff;
  const dfNum = (se1 * se1 + se2 * se2) ** 2;
  const dfDen =
    (se1 * se1 * se1 * se1) / (n1 - 1) + (se2 * se2 * se2 * se2) / (n2 - 1);
  const df = dfDen > 0 ? dfNum / dfDen : n1 + n2 - 2;
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  return { t, df, p };
}

export function runUnpairedTtest(
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
  const { t, df, p } = welchTTest(v1, v2);
  const mean1 = jStat.mean(v1);
  const mean2 = jStat.mean(v2);
  const sem1 = v1.length > 1 ? jStat.stdev(v1, true) / Math.sqrt(v1.length) : 0;
  const sem2 = v2.length > 1 ? jStat.stdev(v2, true) / Math.sqrt(v2.length) : 0;
  const seDiff = Math.sqrt(sem1 * sem1 + sem2 * sem2);
  const tCrit = seDiff > 0 ? jStat.studentt.inv(0.975, df) : 0;
  const meanDiff = mean1 - mean2;
  const ci: [number, number] = [
    meanDiff - tCrit * seDiff,
    meanDiff + tCrit * seDiff,
  ];
  // Bayesian-style: treat CI as credible interval; P(μ1 > μ2) via normal approximation
  const meanDiffCrI: [number, number] = ci;
  let pDiffPositive: number | undefined;
  if (seDiff > 0 && Number.isFinite(meanDiff)) {
    const z = meanDiff / seDiff;
    pDiffPositive = jStat.normal.cdf(z, 0, 1);
  }
  return {
    type: 'unpaired_ttest',
    t,
    p,
    df,
    mean1,
    mean2,
    ci,
    meanDiffCrI,
    pDiffPositive,
    label1: columnLabels[0],
    label2: columnLabels[1],
  };
}

/** Paired t-test: one-sample t-test on differences (col1 - col2). @spec PRISM-ANA-006 */
export function runPairedTtest(
  columnLabels: [string, string],
  rows: (number | null)[][],
  colIndices: [number, number]
): AnalysisResult {
  const [i1, i2] = colIndices;
  const diffs: number[] = [];
  for (let r = 0; r < rows.length; r++) {
    const a = rows[r][i1];
    const b = rows[r][i2];
    if (a != null && Number.isFinite(a) && b != null && Number.isFinite(b)) {
      diffs.push(a - b);
    }
  }
  const n = diffs.length;
  if (n < 2) {
    return {
      type: 'paired_ttest',
      t: NaN,
      p: NaN,
      df: n - 1,
      meanDiff: n === 1 ? diffs[0]! : NaN,
      ci: [NaN, NaN],
      label1: columnLabels[0],
      label2: columnLabels[1],
    };
  }
  const meanDiff = jStat.mean(diffs);
  const sd = jStat.stdev(diffs, true);
  const sem = sd / Math.sqrt(n);
  const df = n - 1;
  const t = sem > 0 ? meanDiff / sem : 0;
  const p = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
  const tCrit = jStat.studentt.inv(0.975, df);
  const ci: [number, number] = [
    meanDiff - tCrit * sem,
    meanDiff + tCrit * sem,
  ];
  return {
    type: 'paired_ttest',
    t,
    p,
    df,
    meanDiff,
    ci,
    label1: columnLabels[0],
    label2: columnLabels[1],
  };
}
