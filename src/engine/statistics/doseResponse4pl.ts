import type { AnalysisResult } from '../../types';
import { fitFourPL } from '../curveFitting/fourPL';

export function runDoseResponse4pl(
  x: (number | null)[],
  y: (number | null)[],
  logX: boolean
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
  if (pairs.length < 4) {
    return {
      type: 'dose_response_4pl',
      ec50: 0,
      ec50CI: [0, 0],
      bottom: 0,
      top: 0,
      hillSlope: 0,
      curve: { x: [], y: [] },
    };
  }
  const xArr = pairs.map((p) => p.x);
  const yArr = pairs.map((p) => p.y);
  const fit = fitFourPL(xArr, yArr, { logX });
  return {
    type: 'dose_response_4pl',
    ec50: fit.ec50,
    ec50CI: fit.ec50CI,
    bottom: fit.bottom,
    top: fit.top,
    hillSlope: fit.hillSlope,
    curve: fit.curve,
  };
}
