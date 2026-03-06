/**
 * Normality test (D'Agostino–Pearson style) from sample skewness and kurtosis.
 * Used to choose parametric vs nonparametric analyses.
 */

import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

function sampleSkewness(arr: number[]): number {
  const n = arr.length;
  if (n < 3) return 0;
  const mean = jStat.mean(arr);
  const m2 = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const m3 = arr.reduce((s, x) => s + (x - mean) ** 3, 0) / n;
  if (m2 <= 0) return 0;
  return m3 / Math.pow(m2, 1.5);
}

function sampleExcessKurtosis(arr: number[]): number {
  const n = arr.length;
  if (n < 4) return 0;
  const mean = jStat.mean(arr);
  const m2 = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const m4 = arr.reduce((s, x) => s + (x - mean) ** 4, 0) / n;
  if (m2 <= 0) return 0;
  return m4 / (m2 * m2) - 3;
}

/** D'Agostino–Pearson K² approximation: chi-square with 2 df. */
function pearsonK2PValue(skew: number, kurt: number, n: number): number {
  if (n < 8) return NaN;
  const nS = n * skew * skew;
  const nK = n * kurt * kurt;
  const zSkew2 = nS * ((n + 1) * (n + 3)) / (6 * (n - 2));
  const zKurt2 = nK * (n + 1) * (n + 3) * (n + 5) / (24 * n * (n - 2) * (n - 3));
  const k2 = zSkew2 + zKurt2;
  return 1 - jStat.chisquare.cdf(k2, 2);
}

export function runNormalityTest(
  columnLabel: string,
  values: number[]
): AnalysisResult {
  const n = values.length;
  if (n < 3) {
    return {
      type: 'normality_test',
      passed: false,
      p: NaN,
      statistic: NaN,
      skewness: NaN,
      kurtosis: NaN,
      label: columnLabel,
    };
  }
  const skewness = sampleSkewness(values);
  const kurtosis = sampleExcessKurtosis(values);
  const p = pearsonK2PValue(skewness, kurtosis, n);
  const nS = n * skewness * skewness;
  const nK = n * kurtosis * kurtosis;
  const zSkew2 = nS * ((n + 1) * (n + 3)) / (6 * (n - 2));
  const zKurt2 =
    nK * (n + 1) * (n + 3) * (n + 5) / (24 * n * (n - 2) * (n - 3));
  const statistic = zSkew2 + zKurt2;
  const passed = Number.isFinite(p) && p > 0.05;
  return {
    type: 'normality_test',
    passed,
    p: Number.isFinite(p) ? p : NaN,
    statistic,
    skewness,
    kurtosis,
    label: columnLabel,
  };
}
