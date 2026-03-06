/**
 * Run Bayesian 4PL dose-response via PyMC in Pyodide.
 * Default path for 4PL; TS used only when PyMC unavailable.
 * @spec PRISM-ANA-005 (Bayesian); HLD §6
 */

import type { PyodideInterface } from '../pyodide/types';
import { getPyodide, runPythonAsync } from '../pyodide/loader';

export interface DoseResponse4plPyMCResult {
  ec50: number;
  ec50CI: [number, number];
  bottom: number;
  top: number;
  hillSlope: number;
  bottomCI: [number, number];
  topCI: [number, number];
  hillSlopeCI: [number, number];
  curve: { x: number[]; y: number[]; yLower: number[]; yUpper: number[] };
}

const PYMC_4PL_SCRIPT = `
import sys
try:
    import pymc as pm
    import numpy as np
except ImportError:
    raise RuntimeError("PyMC not available")

x = np.array(fourpl_x, dtype=float)
y = np.array(fourpl_y, dtype=float)
log_x = bool(fourpl_log_x)
if len(x) < 4:
    raise ValueError("Need at least 4 points for 4PL")

if log_x:
    x_fit = np.log10(np.where(x > 0, x, 1e-10))
else:
    x_fit = x.copy()

y_min = float(np.min(y))
y_max = float(np.max(y))
x_min = float(np.min(x_fit))
x_max = float(np.max(x_fit))
mid_x = (x_min + x_max) / 2

def fourpl(xx, bottom, top, log_ec50, hill):
    return bottom + (top - bottom) / (1 + 10 ** ((log_ec50 - xx) * hill))

with pm.Model() as model:
    bottom = pm.Normal("bottom", mu=y_min, sigma=10)
    top = pm.Normal("top", mu=y_max, sigma=10)
    log_ec50 = pm.Normal("log_ec50", mu=mid_x, sigma=5)
    hill = pm.Normal("hill", mu=1, sigma=3)
    mu = fourpl(x_fit, bottom, top, log_ec50, hill)
    sigma = pm.HalfNormal("sigma", sigma=1)
    obs = pm.Normal("y", mu=mu, sigma=sigma, observed=y)
    idata = pm.sample(500, progressbar=False, cores=1, chains=1, random_seed=42)

bottom_s = idata.posterior["bottom"].values.flatten()
top_s = idata.posterior["top"].values.flatten()
log_ec50_s = idata.posterior["log_ec50"].values.flatten()
hill_s = idata.posterior["hill"].values.flatten()

ec50_s = 10 ** log_ec50_s if log_x else log_ec50_s
ec50 = float(np.mean(ec50_s))
ec50_ci = [float(np.percentile(ec50_s, 2.5)), float(np.percentile(ec50_s, 97.5))]
bottom_mean = float(np.mean(bottom_s))
top_mean = float(np.mean(top_s))
hill_mean = float(np.mean(hill_s))
bottom_ci = [float(np.percentile(bottom_s, 2.5)), float(np.percentile(bottom_s, 97.5))]
top_ci = [float(np.percentile(top_s, 2.5)), float(np.percentile(top_s, 97.5))]
hill_ci = [float(np.percentile(hill_s, 2.5)), float(np.percentile(hill_s, 97.5))]

# Curve and 95% CrI band for plotting
curve_n = 100
curve_x_fit = np.linspace(x_min, x_max, curve_n + 1)
n_samp = len(bottom_s)
curve_y_all = np.zeros((n_samp, len(curve_x_fit)))
for i in range(n_samp):
    curve_y_all[i, :] = fourpl(curve_x_fit, bottom_s[i], top_s[i], log_ec50_s[i], hill_s[i])
curve_y = np.mean(curve_y_all, axis=0)
curve_y_lower = np.percentile(curve_y_all, 2.5, axis=0)
curve_y_upper = np.percentile(curve_y_all, 97.5, axis=0)
if log_x:
    curve_x_out = (10 ** curve_x_fit).tolist()
else:
    curve_x_out = curve_x_fit.tolist()
curve_y_out = curve_y.tolist()
curve_y_lower_out = curve_y_lower.tolist()
curve_y_upper_out = curve_y_upper.tolist()

{
    "ec50": ec50,
    "ec50CI": ec50_ci,
    "bottom": bottom_mean,
    "top": top_mean,
    "hillSlope": hill_mean,
    "bottomCI": bottom_ci,
    "topCI": top_ci,
    "hillSlopeCI": hill_ci,
    "curve": {
        "x": curve_x_out,
        "y": curve_y_out,
        "yLower": curve_y_lower_out,
        "yUpper": curve_y_upper_out
    }
}
`;

export async function runDoseResponse4plPyMC(
  pyodide: PyodideInterface,
  x: number[],
  y: number[],
  logX: boolean
): Promise<DoseResponse4plPyMCResult> {
  pyodide.globals.set('fourpl_x', x);
  pyodide.globals.set('fourpl_y', y);
  pyodide.globals.set('fourpl_log_x', logX);
  const result = await runPythonAsync<DoseResponse4plPyMCResult>(
    pyodide,
    PYMC_4PL_SCRIPT
  );
  return result;
}

export { getPyodide };
