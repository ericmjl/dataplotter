/**
 * Run Bayesian linear regression via PyMC in Pyodide.
 * Default path for linear regression; TS used only when PyMC unavailable.
 * @spec PRISM-ANA-004 (Bayesian); HLD §6
 */

import type { PyodideInterface } from '../pyodide/types';
import { getPyodide, runPythonAsync } from '../pyodide/loader';

export interface LinearRegressionPyMCResult {
  slope: number;
  intercept: number;
  r2: number;
  p: number;
  slopeCI: [number, number];
  interceptCI: [number, number];
  curve: { x: number[]; y: number[]; yLower: number[]; yUpper: number[] };
}

const PYMC_REGRESSION_SCRIPT = `
import sys
try:
    import pymc as pm
    import numpy as np
except ImportError:
    raise RuntimeError("PyMC not available")

x = np.array(regression_x, dtype=float)
y = np.array(regression_y, dtype=float)
n = len(x)
if n < 2:
    raise ValueError("Need at least 2 points")

# Design matrix: column of ones, then x
X = np.column_stack([np.ones(n), x])
with pm.Model() as model:
    beta = pm.Normal("beta", mu=0, sigma=10, shape=2)
    sigma = pm.HalfNormal("sigma", sigma=1)
    mu = pm.math.dot(X, beta)
    obs = pm.Normal("y", mu=mu, sigma=sigma, observed=y)
    idata = pm.sample(500, progressbar=False, cores=1, chains=1, random_seed=42)

intercept = idata.posterior["beta"].values[:, :, 0].flatten()
slope = idata.posterior["beta"].values[:, :, 1].flatten()

intercept_mean = float(np.mean(intercept))
slope_mean = float(np.mean(slope))
intercept_ci = [float(np.percentile(intercept, 2.5)), float(np.percentile(intercept, 97.5))]
slope_ci = [float(np.percentile(slope, 2.5)), float(np.percentile(slope, 97.5))]

# R² from posterior predictive
y_pred = slope_mean * x + intercept_mean
ss_res = np.sum((y - y_pred) ** 2)
ss_tot = np.sum((y - np.mean(y)) ** 2)
r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0

# P(slope != 0) from posterior
p_slope_pos = float(np.mean(slope > 0))
p = 2 * min(p_slope_pos, 1 - p_slope_pos) if p_slope_pos != 0.5 else 1.0

# Curve and 95% CrI band for plotting: grid of x, mean line, and posterior band
x_min = float(np.min(x))
x_max = float(np.max(x))
pad = (x_max - x_min) * 0.05 if x_max > x_min else 1.0
curve_x = np.linspace(x_min - pad, x_max + pad, 80)
# For each curve_x, line value = intercept + slope * curve_xi (per sample)
line_samples = intercept[:, None] + slope[:, None] * curve_x[None, :]
curve_y = np.mean(line_samples, axis=0).tolist()
curve_y_lower = np.percentile(line_samples, 2.5, axis=0).tolist()
curve_y_upper = np.percentile(line_samples, 97.5, axis=0).tolist()

{
    "slope": slope_mean,
    "intercept": intercept_mean,
    "r2": r2,
    "p": p,
    "slopeCI": slope_ci,
    "interceptCI": intercept_ci,
    "curve": {
        "x": curve_x.tolist(),
        "y": curve_y,
        "yLower": curve_y_lower,
        "yUpper": curve_y_upper
    }
}
`;

export async function runRegressionPyMC(
  pyodide: PyodideInterface,
  x: number[],
  y: number[]
): Promise<LinearRegressionPyMCResult> {
  pyodide.globals.set('regression_x', x);
  pyodide.globals.set('regression_y', y);
  const result = await runPythonAsync<LinearRegressionPyMCResult>(
    pyodide,
    PYMC_REGRESSION_SCRIPT
  );
  return result;
}

export { getPyodide };
