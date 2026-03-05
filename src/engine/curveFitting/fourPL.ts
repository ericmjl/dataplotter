import { levenbergMarquardt } from 'ml-levenberg-marquardt';

export interface FourPLOptions {
  logX: boolean;
}

export interface FourPLResult {
  bottom: number;
  top: number;
  ec50: number;
  logEC50: number;
  hillSlope: number;
  ec50CI: [number, number];
  curve: { x: number[]; y: number[] };
}

/**
 * 4-parameter logistic: y = bottom + (top - bottom) / (1 + 10^((logEC50 - x) * hillSlope))
 * When logX is true, x is in log10 scale (e.g. log10(dose)).
 */
export function fitFourPL(
  x: number[],
  y: number[],
  options: FourPLOptions
): FourPLResult {
  let xFit = x;
  if (options.logX) {
    xFit = x.map((v) => (v > 0 ? Math.log10(v) : -10));
  }

  const data = { x: xFit, y };
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  const xMin = Math.min(...xFit);
  const xMax = Math.max(...xFit);
  const midX = (xMin + xMax) / 2;

  const parameterizedFunction = (p: number[]) => {
    const [bottom, top, logEC50, hillSlope] = p;
    return (xi: number) => {
      return bottom + (top - bottom) / (1 + Math.pow(10, (logEC50 - xi) * hillSlope));
    };
  };

  const result = levenbergMarquardt(data, parameterizedFunction, {
    initialValues: [yMin, yMax, midX, 1],
    maxIterations: 200,
  });

  const [bottom, top, logEC50, hillSlope] = result.parameterValues;
  const ec50 = options.logX ? Math.pow(10, logEC50) : logEC50;
  const ec50CI: [number, number] = [ec50, ec50];

  const curveN = 100;
  const curveX = Array.from(
    { length: curveN + 1 },
    (_, i) => xMin + (i / curveN) * (xMax - xMin)
  );
  const f = parameterizedFunction(result.parameterValues);
  const curveY = curveX.map(f);

  const curveXOut = options.logX ? curveX.map((v) => Math.pow(10, v)) : curveX;

  return {
    bottom,
    top,
    ec50,
    logEC50,
    hillSlope,
    ec50CI,
    curve: { x: curveXOut, y: curveY },
  };
}
