/**
 * ROC AUC (area under ROC curve) from column table: score column + binary outcome.
 * @spec PRISM-ANA-014
 */

import type { AnalysisResult } from '../../types';

export function runRocAuc(
  columnLabels: [string, string],
  rows: (number | null)[][],
  colIndices: [number, number]
): AnalysisResult {
  const [iScore, iOutcome] = colIndices;
  type Pair = { score: number; outcome: number };
  const pairs: Pair[] = [];
  for (const r of rows) {
    const score = r[iScore];
    const out = r[iOutcome];
    if (score == null || !Number.isFinite(score) || out == null) continue;
    const binary = Number(out) === 1 || String(out).toLowerCase() === 'true' ? 1 : 0;
    pairs.push({ score: Number(score), outcome: binary });
  }
  const pos = pairs.filter((p) => p.outcome === 1);
  const neg = pairs.filter((p) => p.outcome === 0);
  const nPos = pos.length;
  const nNeg = neg.length;
  if (nPos === 0 || nNeg === 0) {
    return {
      type: 'roc_auc',
      auc: NaN,
      n: pairs.length,
      labelScore: columnLabels[0],
      labelOutcome: columnLabels[1],
    };
  }
  let concordant = 0;
  for (const p of pos) {
    for (const n of neg) {
      if (p.score > n.score) concordant += 1;
      else if (p.score === n.score) concordant += 0.5;
    }
  }
  const auc = concordant / (nPos * nNeg);
  return {
    type: 'roc_auc',
    auc: Number.isFinite(auc) ? auc : NaN,
    n: pairs.length,
    labelScore: columnLabels[0],
    labelOutcome: columnLabels[1],
  };
}
