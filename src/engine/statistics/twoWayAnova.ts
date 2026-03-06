/**
 * Two-way ANOVA (balanced or unbalanced): main effects A (rows), B (columns), interaction.
 * @spec PRISM-ANA-007
 */

import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function mean(arr: number[]): number {
  return arr.length ? sum(arr) / arr.length : NaN;
}

export function runTwoWayAnova(
  rowGroupLabels: string[],
  colGroupLabels: string[],
  cellValues: (number | null)[][][]
): AnalysisResult {
  const a = rowGroupLabels.length;
  const b = colGroupLabels.length;
  const flat: number[][] = [];
  const cellMeans: { rowLabel: string; colLabel: string; mean: number }[] = [];
  let totalN = 0;
  let grandSum = 0;
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      const vals = (cellValues[i]?.[j] ?? []).filter(
        (v): v is number => v != null && Number.isFinite(v)
      );
      flat.push(vals);
      totalN += vals.length;
      grandSum += sum(vals);
      cellMeans.push({
        rowLabel: rowGroupLabels[i] ?? '',
        colLabel: colGroupLabels[j] ?? '',
        mean: mean(vals),
      });
    }
  }
  const grandMean = totalN > 0 ? grandSum / totalN : 0;

  const rowSums: number[] = [];
  const rowCounts: number[] = [];
  for (let i = 0; i < a; i++) {
    let s = 0;
    let n = 0;
    for (let j = 0; j < b; j++) {
      const vals = flat[i * b + j] ?? [];
      s += sum(vals);
      n += vals.length;
    }
    rowSums.push(s);
    rowCounts.push(n);
  }
  const colSums: number[] = [];
  const colCounts: number[] = [];
  for (let j = 0; j < b; j++) {
    let s = 0;
    let n = 0;
    for (let i = 0; i < a; i++) {
      const vals = flat[i * b + j] ?? [];
      s += sum(vals);
      n += vals.length;
    }
    colSums.push(s);
    colCounts.push(n);
  }

  let ssTotal = 0;
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      const vals = flat[i * b + j] ?? [];
      for (const v of vals) {
        ssTotal += (v - grandMean) ** 2;
      }
    }
  }

  const rowMeans = rowSums.map((s, i) => (rowCounts[i] ? s / rowCounts[i] : grandMean));
  const colMeans = colSums.map((s, j) => (colCounts[j] ? s / colCounts[j] : grandMean));

  let ssA = 0;
  for (let i = 0; i < a; i++) {
    const n = rowCounts[i] ?? 0;
    ssA += n * (rowMeans[i]! - grandMean) ** 2;
  }
  let ssB = 0;
  for (let j = 0; j < b; j++) {
    const n = colCounts[j] ?? 0;
    ssB += n * (colMeans[j]! - grandMean) ** 2;
  }

  let ssWithin = 0;
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < b; j++) {
      const vals = flat[i * b + j] ?? [];
      const m = cellMeans[i * b + j]?.mean ?? grandMean;
      for (const v of vals) {
        ssWithin += (v - m) ** 2;
      }
    }
  }

  const ssAB = ssTotal - ssA - ssB - ssWithin;
  const dfA = Math.max(0, a - 1);
  const dfB = Math.max(0, b - 1);
  const dfAB = Math.max(0, (a - 1) * (b - 1));
  const dfWithin = Math.max(0, totalN - a * b);

  const msA = dfA > 0 ? ssA / dfA : 0;
  const msB = dfB > 0 ? ssB / dfB : 0;
  const msAB = dfAB > 0 ? ssAB / dfAB : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const fA = msWithin > 0 ? msA / msWithin : 0;
  const fB = msWithin > 0 ? msB / msWithin : 0;
  const fAB = msWithin > 0 ? msAB / msWithin : 0;

  const pFromF = (f: number, df1: number, df2: number): number => {
    if (df2 <= 0 || !Number.isFinite(f)) return NaN;
    return jStat.anovaftest(f, df1, df2);
  };

  return {
    type: 'two_way_anova',
    factorARows: rowGroupLabels,
    factorBCols: colGroupLabels,
    fA,
    pA: pFromF(fA, dfA, dfWithin),
    fB,
    pB: pFromF(fB, dfB, dfWithin),
    fAB,
    pAB: pFromF(fAB, dfAB, dfWithin),
    dfA,
    dfB,
    dfAB,
    dfWithin,
    cellMeans,
  };
}
