/**
 * Load Pyodide on demand for Bayesian analyses (HLD §6).
 * Loads from CDN via script tag to avoid bundling the WASM runtime.
 * Installs micropip, then attempts to install PyMC (may fail if no wasm wheels).
 */

import type { PyodideInterface } from './types';

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN}pyodide.js`;

let pyodideInstance: PyodideInterface | null = null;
let loadPromise: Promise<PyodideInterface | null> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load Pyodide once (script from CDN, then loadPyodide()), install micropip, then try to install PyMC.
 * Returns the Pyodide instance or null if load/install failed (caller can fall back to TS).
 */
export async function getPyodide(): Promise<PyodideInterface | null> {
  if (pyodideInstance) return pyodideInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<PyodideInterface | null> => {
    try {
      await loadScript(PYODIDE_SCRIPT_URL);
      const loadPyodide = globalThis.loadPyodide;
      if (typeof loadPyodide !== 'function') {
        throw new Error('loadPyodide not found on globalThis');
      }
      const pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
      await pyodide.loadPackage('micropip');
      const micropip = pyodide.pyimport('micropip') as {
        install(name: string): Promise<unknown>;
      };
      try {
        await micropip.install('pymc');
      } catch {
        console.warn(
          'Pyodide: could not install PyMC via micropip; Bayesian path will use TS fallback.'
        );
      }
      pyodideInstance = pyodide;
      return pyodide;
    } catch (err) {
      console.warn('Pyodide: load failed', err);
      return null;
    }
  })();

  return loadPromise;
}

/**
 * Run a Python script string in Pyodide. Pass data via globals before calling.
 * Returns the last expression value (converted to JS by Pyodide).
 */
export async function runPythonAsync<T = unknown>(
  pyodide: PyodideInterface,
  code: string
): Promise<T> {
  const result = await pyodide.runPythonAsync(code);
  const js = result?.toJs?.() ?? result;
  return js as T;
}
