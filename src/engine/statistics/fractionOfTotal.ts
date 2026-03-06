/**
 * Fraction of total (e.g. for parts-of-whole / pie).
 * @spec PRISM-ANA-011
 */

import type { AnalysisResult } from '../../types';

export function runFractionOfTotal(
  labels: string[],
  values: number[]
): AnalysisResult {
  const sum = values.reduce((a, b) => a + b, 0);
  const fractions = labels.map((label, i) => ({
    label,
    value: values[i] ?? 0,
    fraction: sum > 0 ? (values[i] ?? 0) / sum : 0,
  }));
  return { type: 'fraction_of_total', fractions };
}
