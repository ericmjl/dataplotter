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
  const jMatX = jStat.builddxmatrix(xArr.map((xi) => [xi]));
  const jMatY = jStat.buildymatrix(yArr);
  const beta = jStat.regress(jMatX, jMatY) as number[];
  const compile = jStat.regresst(jMatX, jMatY, 2);
  const slope = Number(beta[1]);
  const intercept = Number(beta[0]);
  const r2 = Number(compile.anova.r2);
  const slopeStats = compile.stats?.[1];
  const p = slopeStats != null ? Number(slopeStats[3]) : 1;
  const slopeSE = slopeStats != null ? Math.abs(Number(slopeStats[1]) ?? 0) : 0;
  const df = pairs.length - 2;
  const tCrit = df > 0 ? jStat.studentt.inv(0.975, df) : 0;
  const slopeCI: [number, number] = [
    slope - tCrit * slopeSE,
    slope + tCrit * slopeSE,
  ];
  return {
    type: 'linear_regression',
    slope,
    intercept,
    r2,
    p,
    slopeCI,
  };
}
