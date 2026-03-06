/**
 * Run Bayesian descriptive statistics via PyMC in Pyodide.
 * Returns per-column meanCrI and meanSD to merge with base descriptive result.
 * @spec PRISM-ANA-001 (Bayesian descriptive); HLD §6
 */

import type { PyodideInterface } from '../pyodide/types';
import { getPyodide, runPythonAsync } from '../pyodide/loader';

export interface DescriptiveBayesianRow {
  meanCrI: [number, number];
  meanSD: number;
}

const PYMC_DESCRIPTIVE_SCRIPT = `
import sys
try:
    import pymc as pm
    import numpy as np
except ImportError:
    raise RuntimeError("PyMC not available")

results = []
for label, vals in zip(column_labels, column_values):
    y = np.array(vals, dtype=float)
    n = len(y)
    if n == 0:
        results.append({"meanCrI": [float("nan"), float("nan")], "meanSD": float("nan")})
        continue
    with pm.Model() as model:
        mu = pm.Normal("mu", mu=0, sigma=10)
        sigma = pm.HalfNormal("sigma", sigma=1)
        obs = pm.Normal("y", mu=mu, sigma=sigma, observed=y)
        idata = pm.sample(500, progressbar=False, cores=1, chains=1, random_seed=42)
    posterior_mu = idata.posterior["mu"].values.flatten()
    mean_sd = float(np.std(posterior_mu))
    q2_5 = float(np.percentile(posterior_mu, 2.5))
    q97_5 = float(np.percentile(posterior_mu, 97.5))
    results.append({"meanCrI": [q2_5, q97_5], "meanSD": mean_sd})
results
`;

/**
 * Run PyMC Bayesian descriptive per column. Caller must set column_labels and column_values on pyodide.globals.
 */
export async function runDescriptivePyMC(
  pyodide: PyodideInterface,
  columnLabels: string[],
  columnValues: number[][]
): Promise<DescriptiveBayesianRow[]> {
  pyodide.globals.set('column_labels', columnLabels);
  pyodide.globals.set('column_values', columnValues);
  const results = await runPythonAsync<DescriptiveBayesianRow[]>(
    pyodide,
    PYMC_DESCRIPTIVE_SCRIPT
  );
  return results;
}

export { getPyodide };
