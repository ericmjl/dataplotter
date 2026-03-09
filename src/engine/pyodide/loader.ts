/**
 * Pyodide/WASM path is disabled. Bayesian analyses use:
 * - Electron: uv + templated Python scripts (runBayesianPyMC IPC) for unpaired_ttest, linear_regression, dose_response_4pl.
 * - Browser or when PyMC not available: TS fallbacks (conjugate/Normal approximation, etc.).
 * getPyodide() always returns null so we never load Pyodide or attempt PyMC in the browser.
 */

import type { PyodideInterface } from './types';

/**
 * WASM path disabled. Always returns null; engine uses TS fallback. In Electron, Run uses uv path for supported analysis types.
 */
export async function getPyodide(): Promise<PyodideInterface | null> {
  return null;
}

/**
 * No-op stub; WASM path is disabled so this is never called with a real Pyodide instance.
 */
export async function runPythonAsync<T = unknown>(
  _pyodide: PyodideInterface,
  _code: string
): Promise<T> {
  throw new Error('Pyodide/WASM path is disabled');
}
