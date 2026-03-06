/**
 * Bayesian descriptive statistics: add 95% credible interval and posterior SD for the mean.
 * Used when PyMC is not available (TS fallback) or to merge PyMC output with base descriptive result.
 * Conjugate Normal-Normal: weak prior so posterior mean ≈ sample mean, posterior SD of mean ≈ SEM.
 * @spec Enables PRISM-ANA-001 (Bayesian descriptive); HLD §6
 */

import type { AnalysisResult, CrI95 } from '../../types';

/** Add meanCrI and meanSD to each column of a descriptive result (TS conjugate fallback). */
export function addDescriptiveBayesianFields(
  result: AnalysisResult
): AnalysisResult {
  if (result.type !== 'descriptive') return result;
  const byColumn = result.byColumn.map((col) => {
    if (col.n === 0 || !Number.isFinite(col.mean))
      return { ...col, meanCrI: undefined, meanSD: undefined };
    const meanSD = col.sem;
    const meanCrI: CrI95 = [
      col.mean - 1.96 * col.sem,
      col.mean + 1.96 * col.sem,
    ];
    return { ...col, meanCrI, meanSD };
  });
  return { type: 'descriptive', byColumn };
}
