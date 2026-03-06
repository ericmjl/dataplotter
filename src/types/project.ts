export type TableId = string;
export type AnalysisId = string;
export type GraphId = string;
export type LayoutId = string;

export type TableFormatId =
  | 'xy'
  | 'column'
  | 'grouped'
  | 'contingency'
  | 'survival'
  | 'partsOfWhole'
  | 'multipleVariables'
  | 'nested';

export type AnalysisTypeId =
  | 'descriptive'
  | 'unpaired_ttest'
  | 'paired_ttest'
  | 'one_way_anova'
  | 'two_way_anova'
  | 'chi_square'
  | 'fisher_exact'
  | 'kaplan_meier'
  | 'fraction_of_total'
  | 'mann_whitney'
  | 'kruskal_wallis'
  | 'roc_auc'
  | 'normality_test'
  | 'linear_regression'
  | 'dose_response_4pl';

export type GraphTypeId =
  | 'bar'
  | 'groupedBar'
  | 'scatter'
  | 'line'
  | 'scatterLine'
  | 'survival'
  | 'doseResponse'
  | 'pie';

export interface ColumnTableData {
  columnLabels: string[];
  rows: (number | null)[][];
  /** When set, columns are replicates within groups; groupForColumn[i] = index into groupLabels */
  groupLabels?: string[];
  groupForColumn?: number[];
}

export interface XYTableData {
  xLabel: string;
  yLabels: string[];
  x: (number | null)[];
  ys: (number | null)[][];
}

/** Two grouping variables; each cell holds replicate values. @spec PRISM-TBL-004 */
export interface GroupedTableData {
  rowGroupLabels: string[];
  colGroupLabels: string[];
  /** cellValues[rowIdx][colIdx] = replicate values for that cell */
  cellValues: (number | null)[][][];
}

/** Integer counts per row/column category. @spec PRISM-TBL-005 */
export interface ContingencyTableData {
  rowLabels: string[];
  columnLabels: string[];
  counts: number[][];
}

/** Time-to-event; one row per subject. @spec PRISM-TBL-006 */
export interface SurvivalTableData {
  timeLabel: string;
  eventLabel: string;
  groupLabel?: string;
  times: number[];
  events: number[];
  groups?: string[];
}

/** Labels + values (e.g. fractions). @spec PRISM-TBL-007 */
export interface PartsOfWholeTableData {
  labels: string[];
  values: number[];
}

export interface DataTable {
  id: TableId;
  name: string;
  format: TableFormatId;
  data:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData;
}

export const CURRENT_PROJECT_VERSION = 1;

/** @spec PRISM-WKF-006 Layout item: one graph placed in the layout. */
export interface LayoutItem {
  graphId: GraphId;
  /** Position and size in 0–1 fraction of layout (x, y, width, height). */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** @spec PRISM-WKF-006 Layout sheet composing multiple graphs. */
export interface Layout {
  id: LayoutId;
  name: string;
  items: LayoutItem[];
}

export type Selection =
  | { type: 'table'; tableId: TableId }
  | { type: 'analysis'; analysisId: AnalysisId }
  | { type: 'graph'; graphId: GraphId }
  | { type: 'layout'; layoutId: LayoutId }
  | null;

import type { Analysis } from './analysis';
import type { Graph } from './graph';

export interface Project {
  version: number;
  tables: DataTable[];
  analyses: Analysis[];
  graphs: Graph[];
  layouts: Layout[];
  selection: Selection;
}
