export type TableId = string;
export type AnalysisId = string;
export type GraphId = string;

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
  | 'linear_regression'
  | 'dose_response_4pl';

export type GraphTypeId =
  | 'bar'
  | 'scatter'
  | 'line'
  | 'scatterLine'
  | 'survival'
  | 'doseResponse'
  | 'pie';

export interface ColumnTableData {
  columnLabels: string[];
  rows: (number | null)[][];
}

export interface XYTableData {
  xLabel: string;
  yLabels: string[];
  x: (number | null)[];
  ys: (number | null)[][];
}

export interface DataTable {
  id: TableId;
  name: string;
  format: TableFormatId;
  data: ColumnTableData | XYTableData;
}

export const CURRENT_PROJECT_VERSION = 1;

export type Selection =
  | { type: 'table'; tableId: TableId }
  | { type: 'analysis'; analysisId: AnalysisId }
  | { type: 'graph'; graphId: GraphId }
  | null;

import type { Analysis } from './analysis';
import type { Graph } from './graph';

export interface Project {
  version: number;
  tables: DataTable[];
  analyses: Analysis[];
  graphs: Graph[];
  selection: Selection;
}
