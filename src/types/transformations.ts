/**
 * In-table column transformations. @spec TRANSFORM-001
 * See docs/llds/transformations.md. Uses pre-defined transform types.
 */

/** Pre-defined transformation IDs. See transformRegistry for labels and functions. */
export type TransformId =
  | 'log10'
  | 'ln'
  | 'log2'
  | 'sqrt'
  | 'square'
  | 'exp'
  | 'abs'
  | 'reciprocal';

/** Identifies which column is transformed; matches tableRegistry column ids (col-0, x, y-0, …). */
export interface ColumnTransformation {
  columnKey: string;
  /** Pre-defined transformation (e.g. log10, sqrt). */
  transformId: TransformId;
}

/** Table view mode for the grid (display only). */
export type TableViewMode = 'raw' | 'transformed';

/** Data mode for analysis or graph (which data to use). */
export type DataMode = 'raw' | 'transformed';
