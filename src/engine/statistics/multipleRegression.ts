import type { AnalysisResult } from '../../types';

/**
 * Multiple linear regression: Y = one variable (by option or last column), rest are predictors.
 * Simple least squares (normal equations). @spec PRISM-TBL-009
 */
export function runMultipleRegression(
  variableLabels: string[],
  rows: (number | null)[][],
  yVariableLabel?: string
): AnalysisResult {
  const nVars = variableLabels.length;
  const yIdx = yVariableLabel
    ? variableLabels.indexOf(yVariableLabel)
    : nVars - 1;
  if (yIdx < 0 || yIdx >= nVars) {
    return {
      type: 'multiple_regression',
      r2: NaN,
      coefficients: variableLabels.map((label) => ({ label, coef: NaN })),
      yLabel: yVariableLabel ?? variableLabels[nVars - 1] ?? 'Y',
    };
  }

  const xIndices = variableLabels
    .map((_, i) => i)
    .filter((i) => i !== yIdx);
  const yLabel = variableLabels[yIdx] ?? 'Y';

  const rowsValid: number[][] = [];
  for (let r = 0; r < rows.length; r++) {
    const yVal = rows[r][yIdx];
    if (yVal == null || !Number.isFinite(yVal)) continue;
    const xRow = xIndices.map((c) => rows[r][c]);
    if (xRow.every((v) => v != null && Number.isFinite(v))) {
      rowsValid.push([1, ...(xRow as number[]), yVal as number]);
    }
  }

  const n = rowsValid.length;
  const k = xIndices.length + 1;
  if (n < k + 1) {
    const coefs = [
      { label: 'Intercept', coef: NaN },
      ...xIndices.map((c) => ({ label: variableLabels[c] ?? '', coef: NaN })),
    ];
    return { type: 'multiple_regression', r2: NaN, coefficients: coefs, yLabel };
  }

  const X: number[][] = rowsValid.map((row) => row.slice(0, -1));
  const y: number[] = rowsValid.map((row) => row[row.length - 1]!);

  const Xt = X[0].map((_, j) => X.map((row) => row[j]));
  const XtX = Xt.map((row) =>
    X[0].map((_, j) => row.reduce((s, _, i) => s + Xt[i][j] * row[i], 0))
  );
  const Xty = Xt.map((row) => row.reduce((s, x, i) => s + x * y[i], 0));

  const inv = invertMatrix(XtX);
  if (!inv) {
    const coefs = [
      { label: 'Intercept', coef: NaN },
      ...xIndices.map((c) => ({ label: variableLabels[c] ?? '', coef: NaN })),
    ];
    return { type: 'multiple_regression', r2: NaN, coefficients: coefs, yLabel };
  }

  const coef = inv.map((row) => row.reduce((s, v, i) => s + v * Xty[i], 0));
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const yPred = X.map((row) => row.reduce((s, v, i) => s + v * coef[i], 0));
  const ssRes = y.reduce((s, yi, i) => s + (yi - yPred[i]!) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const coefficients = [
    { label: 'Intercept', coef: coef[0]! },
    ...xIndices.map((c, i) => ({
      label: variableLabels[c] ?? '',
      coef: coef[i + 1]!,
    })),
  ];

  return {
    type: 'multiple_regression',
    r2,
    coefficients,
    yLabel,
  };
}

function invertMatrix(M: number[][]): number[][] | null {
  const n = M.length;
  const aug = M.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    }
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const div = aug[col][col];
    if (Math.abs(div) < 1e-12) return null;
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= div;
    for (let row = 0; row < n; row++) {
      if (row !== col && Math.abs(aug[row][col]) > 1e-12) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
      }
    }
  }
  return aug.map((row) => row.slice(n));
}
