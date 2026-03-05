import type {
  TableFormatId,
  AnalysisTypeId,
  GraphTypeId,
  ColumnTableData,
  XYTableData,
  AnalysisOptions,
} from '../types';

export interface GridColumn {
  id: string;
  label: string;
  kind: 'number';
}

export interface TableSchema {
  columns: GridColumn[];
  rowLabels?: string[];
}

const COLUMN_ANALYSES: AnalysisTypeId[] = [
  'descriptive',
  'unpaired_ttest',
  'one_way_anova',
];
const XY_ANALYSES: AnalysisTypeId[] = [
  'descriptive',
  'linear_regression',
  'dose_response_4pl',
];

const COLUMN_GRAPH_TYPES: GraphTypeId[] = ['bar'];
const XY_GRAPH_TYPES: GraphTypeId[] = [
  'scatter',
  'line',
  'scatterLine',
  'doseResponse',
];

export function getSchema(
  format: TableFormatId,
  data?: ColumnTableData | XYTableData
): TableSchema {
  if (format === 'column' && data && 'columnLabels' in data) {
    return {
      columns: data.columnLabels.map((label, i) => ({
        id: `col-${i}`,
        label,
        kind: 'number' as const,
      })),
    };
  }
  if (format === 'xy' && data && 'xLabel' in data) {
    const cols: GridColumn[] = [
      { id: 'x', label: data.xLabel, kind: 'number' },
      ...data.yLabels.map((label, i) => ({
        id: `y-${i}`,
        label,
        kind: 'number' as const,
      })),
    ];
    return { columns: cols };
  }
  if (format === 'column') {
    return { columns: [] };
  }
  return {
    columns: [
      { id: 'x', label: 'X', kind: 'number' },
      { id: 'y-0', label: 'Y', kind: 'number' },
    ],
  };
}

export function getAllowedAnalyses(format: TableFormatId): AnalysisTypeId[] {
  if (format === 'column') return [...COLUMN_ANALYSES];
  if (format === 'xy') return [...XY_ANALYSES];
  return [];
}

export function getAllowedGraphTypes(format: TableFormatId): GraphTypeId[] {
  if (format === 'column') return [...COLUMN_GRAPH_TYPES];
  if (format === 'xy') return [...XY_GRAPH_TYPES];
  return [];
}

export function validateTableData(
  format: TableFormatId,
  data: ColumnTableData | XYTableData
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (format === 'column' && 'columnLabels' in data) {
    if (data.columnLabels.length === 0) errors.push('At least one column required');
    const nCols = data.columnLabels.length;
    for (let i = 0; i < data.rows.length; i++) {
      if (data.rows[i].length !== nCols) {
        errors.push(`Row ${i + 1} has ${data.rows[i].length} values, expected ${nCols}`);
      }
    }
    for (let c = 0; c < nCols; c++) {
      const vals = data.rows.map((r) => r[c]).filter((v) => v != null && !Number.isNaN(v));
      if (vals.length === 0) errors.push(`Column "${data.columnLabels[c]}" has no numeric values`);
    }
  }
  if (format === 'xy' && 'x' in data) {
    const n = data.x.length;
    if (n === 0) errors.push('At least one X value required');
    for (let s = 0; s < data.ys.length; s++) {
      if (data.ys[s].length !== n) {
        errors.push(
          `Y series "${data.yLabels[s]}" has length ${data.ys[s].length}, expected ${n}`
        );
      }
    }
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

function countNonNull(arr: (number | null)[]): number {
  return arr.filter((v) => v != null && !Number.isNaN(v)).length;
}

export function validateForAnalysis(
  format: TableFormatId,
  data: ColumnTableData | XYTableData,
  analysisType: AnalysisTypeId
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (format === 'column' && 'columnLabels' in data) {
    const nPerCol = data.columnLabels.map((_, c) =>
      countNonNull(data.rows.map((r) => r[c]))
    );
    if (analysisType === 'descriptive') {
      if (data.columnLabels.length === 0 || nPerCol.every((n) => n === 0)) {
        errors.push('At least one column with one value required');
      }
    }
    if (analysisType === 'unpaired_ttest') {
      if (data.columnLabels.length < 2) {
        errors.push('Unpaired t-test requires exactly two columns');
      } else {
        const [n1, n2] = nPerCol;
        if (n1 < 2 || n2 < 2) {
          errors.push('Each column must have at least 2 values for t-test');
        }
      }
    }
    if (analysisType === 'one_way_anova') {
      if (data.columnLabels.length < 2) {
        errors.push('ANOVA requires at least two columns');
      } else if (nPerCol.some((n) => n === 0)) {
        errors.push('Each column must have at least one value');
      }
    }
  }
  if (format === 'xy' && 'x' in data) {
    const pairs = data.x.map((xv, i) => ({
      x: xv,
      y: data.ys[0]?.[i] ?? null,
    }));
    const validPairs = pairs.filter(
      (p) => p.x != null && !Number.isNaN(p.x) && p.y != null && !Number.isNaN(p.y)
    );
    if (analysisType === 'linear_regression') {
      if (validPairs.length < 2) errors.push('At least 2 (x,y) pairs required for regression');
    }
    if (analysisType === 'dose_response_4pl') {
      if (validPairs.length < 4) errors.push('At least 4 (x,y) pairs required for 4PL fit');
    }
  }
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function getDefaultOptions(
  format: TableFormatId,
  analysisType: AnalysisTypeId,
  tableData: ColumnTableData | XYTableData
): AnalysisOptions {
  if (analysisType === 'descriptive') {
    return { type: 'descriptive' };
  }
  if (analysisType === 'unpaired_ttest' && format === 'column' && 'columnLabels' in tableData) {
    const labels = tableData.columnLabels;
    return {
      type: 'unpaired_ttest',
      columnLabels: [labels[0] ?? 'A', labels[1] ?? 'B'],
    };
  }
  if (analysisType === 'one_way_anova') {
    return { type: 'one_way_anova', columnLabels: undefined };
  }
  if (analysisType === 'linear_regression') {
    return { type: 'linear_regression', ySeriesLabel: undefined };
  }
  if (analysisType === 'dose_response_4pl') {
    return { type: 'dose_response_4pl', logX: true };
  }
  return { type: 'descriptive' };
}
