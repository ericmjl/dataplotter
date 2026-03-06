import type {
  TableFormatId,
  AnalysisTypeId,
  GraphTypeId,
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
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
  'paired_ttest',
  'one_way_anova',
  'mann_whitney',
  'kruskal_wallis',
  'roc_auc',
  'normality_test',
];
const XY_ANALYSES: AnalysisTypeId[] = [
  'descriptive',
  'linear_regression',
  'dose_response_4pl',
];
const GROUPED_ANALYSES: AnalysisTypeId[] = ['two_way_anova'];
const CONTINGENCY_ANALYSES: AnalysisTypeId[] = ['chi_square', 'fisher_exact'];
const SURVIVAL_ANALYSES: AnalysisTypeId[] = ['kaplan_meier'];
const PARTS_OF_WHOLE_ANALYSES: AnalysisTypeId[] = ['fraction_of_total'];

const COLUMN_GRAPH_TYPES: GraphTypeId[] = ['bar', 'box'];
const XY_GRAPH_TYPES: GraphTypeId[] = [
  'scatter',
  'line',
  'scatterLine',
  'doseResponse',
];
const GROUPED_GRAPH_TYPES: GraphTypeId[] = ['groupedBar'];
const SURVIVAL_GRAPH_TYPES: GraphTypeId[] = ['survival'];
const PARTS_OF_WHOLE_GRAPH_TYPES: GraphTypeId[] = ['pie'];

export function getSchema(
  format: TableFormatId,
  data?:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData
): TableSchema {
  if (format === 'column' && data && 'columnLabels' in data && !('cellValues' in data)) {
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
  if (format === 'grouped' && data && 'cellValues' in data) {
    return {
      rowLabels: data.rowGroupLabels,
      columns: data.colGroupLabels.map((label, i) => ({
        id: `col-${i}`,
        label,
        kind: 'number' as const,
      })),
    };
  }
  if (format === 'contingency' && data && 'counts' in data) {
    const cont = data as unknown as ContingencyTableData;
    return {
      rowLabels: cont.rowLabels,
      columns: cont.columnLabels.map((label: string, i: number) => ({
        id: `col-${i}`,
        label,
        kind: 'number' as const,
      })),
    };
  }
  if (format === 'survival' && data && 'times' in data) {
    const surv = data as SurvivalTableData;
    const cols = [
      { id: 'time', label: surv.timeLabel, kind: 'number' as const },
      { id: 'event', label: surv.eventLabel, kind: 'number' as const },
    ];
    if (surv.groups?.length) {
      cols.push({ id: 'group', label: surv.groupLabel ?? 'Group', kind: 'number' as const });
    }
    return { columns: cols };
  }
  if (format === 'partsOfWhole' && data && 'labels' in data && 'values' in data) {
    return {
      columns: [
        { id: 'label', label: 'Label', kind: 'number' as const },
        { id: 'value', label: 'Value', kind: 'number' as const },
      ],
    };
  }
  if (format === 'column') {
    return { columns: [] };
  }
  if (format === 'grouped' || format === 'contingency' || format === 'survival' || format === 'partsOfWhole') {
    return { columns: [], rowLabels: [] };
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
  if (format === 'grouped') return [...GROUPED_ANALYSES];
  if (format === 'contingency') return [...CONTINGENCY_ANALYSES];
  if (format === 'survival') return [...SURVIVAL_ANALYSES];
  if (format === 'partsOfWhole') return [...PARTS_OF_WHOLE_ANALYSES];
  return [];
}

export function getAllowedGraphTypes(format: TableFormatId): GraphTypeId[] {
  if (format === 'column') return [...COLUMN_GRAPH_TYPES];
  if (format === 'xy') return [...XY_GRAPH_TYPES];
  if (format === 'grouped') return [...GROUPED_GRAPH_TYPES];
  if (format === 'contingency') return [];
  if (format === 'survival') return [...SURVIVAL_GRAPH_TYPES];
  if (format === 'partsOfWhole') return [...PARTS_OF_WHOLE_GRAPH_TYPES];
  return [];
}

export function validateTableData(
  format: TableFormatId,
  data:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (format === 'contingency' && 'counts' in data) {
    const c = data as ContingencyTableData;
    if (c.rowLabels.length === 0) errors.push('At least one row label required');
    if (c.columnLabels.length === 0) errors.push('At least one column label required');
    if (
      c.counts.length !== c.rowLabels.length ||
      c.counts.some((row) => row.length !== c.columnLabels.length)
    ) {
      errors.push('counts dimensions must match rowLabels × columnLabels');
    }
    c.counts.flat().forEach((v, i) => {
      if (v < 0 || !Number.isInteger(v)) {
        errors.push(`Count at index ${i} must be a non-negative integer`);
      }
    });
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'survival' && 'times' in data) {
    const s = data as SurvivalTableData;
    if (s.times.length === 0) errors.push('At least one time value required');
    if (s.times.length !== s.events.length) errors.push('times and events length must match');
    if (s.groups && s.groups.length !== s.times.length) errors.push('groups length must match times');
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'partsOfWhole' && 'labels' in data && 'values' in data) {
    const p = data as PartsOfWholeTableData;
    if (p.labels.length === 0) errors.push('At least one label required');
    if (p.labels.length !== p.values.length) errors.push('labels and values length must match');
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'grouped' && 'cellValues' in data) {
    if (data.rowGroupLabels.length === 0) errors.push('At least one row group required');
    if (data.colGroupLabels.length === 0) errors.push('At least one column group required');
    if (
      data.cellValues.length !== data.rowGroupLabels.length ||
      data.cellValues.some((row) => row.length !== data.colGroupLabels.length)
    ) {
      errors.push('cellValues dimensions must match rowGroupLabels × colGroupLabels');
    }
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'column' && 'columnLabels' in data && !('cellValues' in data) && !('counts' in data)) {
    const colData = data as ColumnTableData;
    if (colData.columnLabels.length === 0) errors.push('At least one column required');
    const nCols = colData.columnLabels.length;
    if (colData.groupLabels?.length && colData.groupForColumn) {
      if (colData.groupForColumn.length !== nCols) {
        errors.push('groupForColumn length must match column count');
      }
      const nGroups = colData.groupLabels.length;
      if (colData.groupForColumn.some((g: number) => g < 0 || g >= nGroups)) {
        errors.push('groupForColumn must be valid group indices');
      }
    }
    for (let i = 0; i < colData.rows.length; i++) {
      if (colData.rows[i].length !== nCols) {
        errors.push(`Row ${i + 1} has ${colData.rows[i].length} values, expected ${nCols}`);
      }
    }
    for (let c = 0; c < nCols; c++) {
      const vals = colData.rows.map((r: (number | null)[]) => r[c]).filter((v) => v != null && !Number.isNaN(v));
      if (vals.length === 0) errors.push(`Column "${colData.columnLabels[c]}" has no numeric values`);
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
  data:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData,
  analysisType: AnalysisTypeId
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  if (format === 'contingency' && 'counts' in data && (analysisType === 'chi_square' || analysisType === 'fisher_exact')) {
    const c = data as ContingencyTableData;
    const total = c.counts.flat().reduce((a, b) => a + b, 0);
    if (total === 0) errors.push('At least one non-zero count required');
    if (analysisType === 'fisher_exact' && (c.rowLabels.length !== 2 || c.columnLabels.length !== 2)) {
      errors.push("Fisher's exact test requires a 2×2 table");
    }
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'survival' && 'times' in data && analysisType === 'kaplan_meier') {
    return { valid: true };
  }
  if (format === 'partsOfWhole' && 'values' in data && analysisType === 'fraction_of_total') {
    return { valid: true };
  }
  if (format === 'grouped' && 'cellValues' in data && analysisType === 'two_way_anova') {
    const nCells = data.rowGroupLabels.length * data.colGroupLabels.length;
    const totalN = data.cellValues.flat(2).filter((v) => v != null && Number.isFinite(v)).length;
    if (totalN < nCells + 1) errors.push('Two-way ANOVA requires at least 2 values per cell on average');
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }
  if (format === 'column' && 'columnLabels' in data && !('cellValues' in data) && !('counts' in data)) {
    const colData = data as ColumnTableData;
    const nPerCol = colData.columnLabels.map((_, c) =>
      countNonNull(colData.rows.map((r) => r[c]))
    );
    if (analysisType === 'descriptive') {
      if (colData.columnLabels.length === 0 || nPerCol.every((n) => n === 0)) {
        errors.push('At least one column with one value required');
      }
    }
    if (analysisType === 'unpaired_ttest') {
      if (colData.columnLabels.length < 2) {
        errors.push('Unpaired t-test requires exactly two columns');
      } else {
        const [n1, n2] = nPerCol;
        if (n1 < 2 || n2 < 2) {
          errors.push('Each column must have at least 2 values for t-test');
        }
      }
    }
    if (analysisType === 'paired_ttest') {
      if (colData.columnLabels.length < 2) {
        errors.push('Paired t-test requires exactly two columns');
      } else {
        const pairs = colData.rows.filter(
          (r: (number | null)[]) =>
            r[0] != null && !Number.isNaN(r[0]) && r[1] != null && !Number.isNaN(r[1])
        ).length;
        if (pairs < 2) {
          errors.push('Paired t-test requires at least 2 paired values (same row, both non-empty)');
        }
      }
    }
    if (analysisType === 'one_way_anova') {
      if (colData.columnLabels.length < 2) {
        errors.push('ANOVA requires at least two columns');
      } else if (nPerCol.some((n) => n === 0)) {
        errors.push('Each column must have at least one value');
      }
    }
    if (analysisType === 'mann_whitney') {
      if (colData.columnLabels.length < 2) {
        errors.push('Mann-Whitney requires exactly two columns');
      } else if (nPerCol[0]! < 1 || nPerCol[1]! < 1) {
        errors.push('Each column must have at least one value');
      }
    }
    if (analysisType === 'kruskal_wallis') {
      if (colData.columnLabels.length < 2) {
        errors.push('Kruskal-Wallis requires at least two columns');
      } else if (nPerCol.some((n) => n === 0)) {
        errors.push('Each column must have at least one value');
      }
    }
    if (analysisType === 'roc_auc') {
      if (colData.columnLabels.length < 2) {
        errors.push('ROC AUC requires two columns (score, binary outcome)');
      } else if (nPerCol[0]! < 1 || nPerCol[1]! < 1) {
        errors.push('Each column must have at least one value');
      }
    }
    if (analysisType === 'normality_test') {
      if (colData.columnLabels.length < 1 || nPerCol.some((n) => n < 3)) {
        errors.push('Normality test requires at least one column with 3+ values');
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
  tableData:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData
): AnalysisOptions {
  if (analysisType === 'two_way_anova') {
    return { type: 'two_way_anova' };
  }
  if (analysisType === 'chi_square') {
    return { type: 'chi_square' };
  }
  if (analysisType === 'fisher_exact') {
    return { type: 'fisher_exact' };
  }
  if (analysisType === 'kaplan_meier') {
    return { type: 'kaplan_meier' };
  }
  if (analysisType === 'fraction_of_total') {
    return { type: 'fraction_of_total' };
  }
  if (analysisType === 'descriptive') {
    return { type: 'descriptive' };
  }
  if (analysisType === 'unpaired_ttest' && format === 'column' && 'columnLabels' in tableData && !('counts' in tableData)) {
    const labels = (tableData as ColumnTableData).columnLabels;
    return {
      type: 'unpaired_ttest',
      columnLabels: [labels[0] ?? 'A', labels[1] ?? 'B'],
    };
  }
  if (analysisType === 'paired_ttest' && format === 'column' && 'columnLabels' in tableData && !('counts' in tableData)) {
    const labels = (tableData as ColumnTableData).columnLabels;
    return {
      type: 'paired_ttest',
      columnLabels: [labels[0] ?? 'A', labels[1] ?? 'B'],
    };
  }
  if (analysisType === 'one_way_anova') {
    return { type: 'one_way_anova', columnLabels: undefined };
  }
  if (analysisType === 'mann_whitney' && format === 'column' && 'columnLabels' in tableData && !('counts' in tableData)) {
    const labels = (tableData as ColumnTableData).columnLabels;
    return { type: 'mann_whitney', columnLabels: [labels[0] ?? 'A', labels[1] ?? 'B'] };
  }
  if (analysisType === 'kruskal_wallis') {
    return { type: 'kruskal_wallis', columnLabels: undefined };
  }
  if (analysisType === 'roc_auc' && format === 'column' && 'columnLabels' in tableData && !('counts' in tableData)) {
    const labels = (tableData as ColumnTableData).columnLabels;
    return { type: 'roc_auc', columnLabels: [labels[0] ?? 'Score', labels[1] ?? 'Outcome'] };
  }
  if (analysisType === 'normality_test' && format === 'column' && 'columnLabels' in tableData && !('counts' in tableData)) {
    const labels = (tableData as ColumnTableData).columnLabels;
    return { type: 'normality_test', columnLabel: labels[0] };
  }
  if (analysisType === 'linear_regression') {
    return { type: 'linear_regression', ySeriesLabel: undefined };
  }
  if (analysisType === 'dose_response_4pl') {
    return { type: 'dose_response_4pl', logX: true };
  }
  return { type: 'descriptive' };
}
