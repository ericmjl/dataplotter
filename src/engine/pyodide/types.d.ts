/**
 * Minimal types for Pyodide loaded from CDN (no npm package in bundle).
 * @see https://pyodide.org/en/stable/usage/api/js-api.html
 */
declare global {
  function loadPyodide(options?: { indexURL?: string }): Promise<PyodideInterface>;
}

export interface PyodideInterface {
  runPythonAsync(code: string): Promise<PyProxy>;
  loadPackage(name: string): Promise<void>;
  pyimport(name: string): PyProxy;
  globals: PyProxy & { set(key: string, value: unknown): void };
}

export interface PyProxy {
  toJs?(options?: { dict_converter?: (entries: unknown[]) => unknown }): unknown;
}

/** Python micropip module (pyimport('micropip')). */
export interface MicropipModule extends PyProxy {
  install(name: string): Promise<unknown>;
}
