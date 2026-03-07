import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

export function runLinearRegression(
  x: (number | null)[],
  y: (number | null)[]
): AnalysisResult {
  const pairs: { x: number; y: number }[] = [];
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = y[i];
    if (
      xi != null &&
      Number.isFinite(xi) &&
      yi != null &&
      Number.isFinite(yi)
    ) {
      pairs.push({ x: xi, y: yi });
    }
  }
  if (pairs.length < 2) {
    return {
      type: 'linear_regression',
      slope: 0,
      intercept: 0,
      r2: 0,
      p: 1,
      slopeCI: [0, 0],
    };
  }
  const xArr = pairs.map((p) => p.x);
  const yArr = pairs.map((p) => p.y);

  // Guard: constant x (zero variance) makes slope undefined; jStat returns NaN.
  const meanX = xArr.reduce((a, b) => a + b, 0) / xArr.length;
  const ssX = xArr.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0);
  if (ssX === 0 || !Number.isFinite(ssX)) {
    const meanY = yArr.reduce((a, b) => a + b, 0) / yArr.length;
    return {
      type: 'linear_regression',
      slope: 0,
      intercept: meanY,
      r2: 0,
      p: 1,
      slopeCI: [0, 0],
      interceptCI: [meanY, meanY],
    };
  }

  const jMatX = jStat.builddxmatrix(xArr.map((xi) => [xi]));
  const jMatY = jStat.buildymatrix(yArr);
  const beta = jStat.regress(jMatX, jMatY) as number[];
  const compile = jStat.regresst(jMatX, jMatY, 2);
  const slope = Number(beta[1]);
  const intercept = Number(beta[0]);
  const r2 = Number(compile.anova.r2);
  const slopeStats = compile.stats?.[1];
  const interceptStats = compile.stats?.[0];
  const slopeSE = slopeStats != null ? Math.abs(Number(slopeStats[1]) ?? 0) : 0;
  const interceptSE = interceptStats != null ? Math.abs(Number(interceptStats[1]) ?? 0) : 0;
  const df = pairs.length - 2;

  // jStat.regresst uses df = n - 2 - 1 = n - 3 for the slope t-test (incorrect). Use correct df = n - 2.
  let p: number;
  if (slopeSE === 0 || !Number.isFinite(slopeSE)) {
    p = slope === 0 ? 1 : 0;
  } else if (df > 0) {
    const tSlope = Math.abs(slope) / slopeSE;
    p = 2 * (1 - jStat.studentt.cdf(tSlope, df));
  } else {
    p = 1;
  }

  const tCrit = df > 0 ? jStat.studentt.inv(0.975, df) : 0;
  const slopeCI: [number, number] = [
    slope - tCrit * slopeSE,
    slope + tCrit * slopeSE,
  ];
  const interceptCI: [number, number] = [
    intercept - tCrit * interceptSE,
    intercept + tCrit * interceptSE,
  ];
  return {
    type: 'linear_regression',
    slope,
    intercept,
    r2: Number.isFinite(r2) ? r2 : 0,
    p,
    slopeCI,
    interceptCI,
  };
}
