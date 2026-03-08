import { z } from 'zod';
import { AnalysisOptionsSchema } from '../types/analysisSchemas';
import { CURRENT_PROJECT_VERSION } from '../types';

const ColumnTableDataSchema = z.object({
  columnLabels: z.array(z.string()),
  rows: z.array(z.array(z.union([z.number(), z.null()]))),
  groupLabels: z.array(z.string()).optional(),
  groupForColumn: z.array(z.number()).optional(),
});

const XYTableDataSchema = z.object({
  xLabel: z.string(),
  yLabels: z.array(z.string()),
  x: z.array(z.union([z.number(), z.null()])),
  ys: z.array(z.array(z.union([z.number(), z.null()]))),
});

const GroupedTableDataSchema = z.object({
  rowGroupLabels: z.array(z.string()),
  colGroupLabels: z.array(z.string()),
  cellValues: z.array(z.array(z.array(z.union([z.number(), z.null()])))),
});

const ContingencyTableDataSchema = z.object({
  rowLabels: z.array(z.string()),
  columnLabels: z.array(z.string()),
  counts: z.array(z.array(z.number())),
});

const SurvivalTableDataSchema = z.object({
  timeLabel: z.string(),
  eventLabel: z.string(),
  subjectLabels: z.array(z.string()).optional(),
  groupLabels: z.array(z.string()).optional(),
  times: z.array(z.number()),
  events: z.array(z.number()),
  groups: z.array(z.string()).optional(),
});

const PartsOfWholeTableDataSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

const MultipleVariablesTableDataSchema = z.object({
  variableLabels: z.array(z.string()),
  rows: z.array(z.array(z.union([z.number(), z.null()]))),
});

const NestedTableDataSchema = z.object({
  columnLabels: z.array(z.string()),
  rows: z.array(z.array(z.union([z.number(), z.null()]))),
  groupLabels: z.array(z.string()).optional(),
  groupForColumn: z.array(z.number()).optional(),
});

const ColumnTransformationSchema = z.object({
  columnKey: z.string(),
  transformId: z.string(),
});

const DataTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.enum(['xy', 'column', 'grouped', 'contingency', 'survival', 'partsOfWhole', 'multipleVariables', 'nested']),
  data: z.union([
    ColumnTableDataSchema,
    XYTableDataSchema,
    GroupedTableDataSchema,
    ContingencyTableDataSchema,
    SurvivalTableDataSchema,
    PartsOfWholeTableDataSchema,
    MultipleVariablesTableDataSchema,
    NestedTableDataSchema,
  ]),
  transformations: z.array(ColumnTransformationSchema).optional(),
  viewMode: z.enum(['raw', 'transformed']).optional(),
  tableDataVersion: z.number().optional(),
});

const DescriptiveResultSchema = z.object({
  type: z.literal('descriptive'),
  byColumn: z.array(
    z.object({
      label: z.string(),
      n: z.number(),
      mean: z.number(),
      sem: z.number(),
      sd: z.number(),
      median: z.number(),
      q1: z.number(),
      q3: z.number(),
    })
  ),
});

const UnpairedTtestResultSchema = z.object({
  type: z.literal('unpaired_ttest'),
  t: z.number(),
  p: z.number(),
  df: z.number(),
  mean1: z.number(),
  mean2: z.number(),
  ci: z.tuple([z.number(), z.number()]),
  label1: z.string(),
  label2: z.string(),
});

const PairedTtestResultSchema = z.object({
  type: z.literal('paired_ttest'),
  t: z.number(),
  p: z.number(),
  df: z.number(),
  meanDiff: z.number(),
  ci: z.tuple([z.number(), z.number()]),
  label1: z.string(),
  label2: z.string(),
});

const OneWayAnovaResultSchema = z.object({
  type: z.literal('one_way_anova'),
  f: z.number(),
  p: z.number(),
  dfBetween: z.number(),
  dfWithin: z.number(),
  groupMeans: z.array(z.object({ label: z.string(), mean: z.number() })),
});

const TwoWayAnovaResultSchema = z.object({
  type: z.literal('two_way_anova'),
  factorARows: z.array(z.string()),
  factorBCols: z.array(z.string()),
  fA: z.number(),
  pA: z.number(),
  fB: z.number(),
  pB: z.number(),
  fAB: z.number(),
  pAB: z.number(),
  dfA: z.number(),
  dfB: z.number(),
  dfAB: z.number(),
  dfWithin: z.number(),
  cellMeans: z.array(z.object({ rowLabel: z.string(), colLabel: z.string(), mean: z.number() })),
});

const ChiSquareResultSchema = z.object({
  type: z.literal('chi_square'),
  chi2: z.number(),
  p: z.number(),
  df: z.number(),
});

const FisherExactResultSchema = z.object({
  type: z.literal('fisher_exact'),
  p: z.number(),
  oddsRatio: z.number().optional(),
});

const KaplanMeierResultSchema = z.object({
  type: z.literal('kaplan_meier'),
  curves: z.array(
    z.object({
      group: z.string(),
      time: z.array(z.number()),
      survival: z.array(z.number()),
    })
  ),
  medianSurvival: z.array(z.object({ group: z.string(), median: z.number() })).optional(),
});

const FractionOfTotalResultSchema = z.object({
  type: z.literal('fraction_of_total'),
  fractions: z.array(
    z.object({ label: z.string(), value: z.number(), fraction: z.number() })
  ),
});

const MannWhitneyResultSchema = z.object({
  type: z.literal('mann_whitney'),
  u: z.number(),
  p: z.number(),
  label1: z.string(),
  label2: z.string(),
  median1: z.number(),
  median2: z.number(),
});

const KruskalWallisResultSchema = z.object({
  type: z.literal('kruskal_wallis'),
  h: z.number(),
  p: z.number(),
  df: z.number(),
  groupMedians: z.array(z.object({ label: z.string(), median: z.number() })),
});

const RocAucResultSchema = z.object({
  type: z.literal('roc_auc'),
  auc: z.number(),
  n: z.number(),
  labelScore: z.string(),
  labelOutcome: z.string(),
});

const NormalityTestResultSchema = z.object({
  type: z.literal('normality_test'),
  passed: z.boolean(),
  p: z.number(),
  statistic: z.number(),
  skewness: z.number(),
  kurtosis: z.number(),
  label: z.string(),
});

const LinearRegressionResultSchema = z.object({
  type: z.literal('linear_regression'),
  slope: z.number(),
  intercept: z.number(),
  r2: z.number(),
  p: z.number(),
  slopeCI: z.tuple([z.number(), z.number()]),
});

const DoseResponse4plResultSchema = z.object({
  type: z.literal('dose_response_4pl'),
  ec50: z.number(),
  ec50CI: z.tuple([z.number(), z.number()]),
  bottom: z.number(),
  top: z.number(),
  hillSlope: z.number(),
  curve: z.object({ x: z.array(z.number()), y: z.array(z.number()) }),
});

const CorrelationResultSchema = z.object({
  type: z.literal('correlation'),
  labels: z.array(z.string()),
  r: z.array(z.array(z.number())),
  n: z.array(z.array(z.number())),
});

const MultipleRegressionResultSchema = z.object({
  type: z.literal('multiple_regression'),
  r2: z.number(),
  coefficients: z.array(z.object({ label: z.string(), coef: z.number(), se: z.number().optional() })),
  yLabel: z.string(),
});

const NestedTtestResultSchema = z.object({
  type: z.literal('nested_ttest'),
  t: z.number(),
  p: z.number(),
  df: z.number(),
  mean1: z.number(),
  mean2: z.number(),
  ci: z.tuple([z.number(), z.number()]),
  label1: z.string(),
  label2: z.string(),
});

const NestedOneWayAnovaResultSchema = z.object({
  type: z.literal('nested_one_way_anova'),
  f: z.number(),
  p: z.number(),
  dfBetween: z.number(),
  dfWithin: z.number(),
  groupMeans: z.array(z.object({ label: z.string(), mean: z.number() })),
});

const AnalysisResultSchema = z.discriminatedUnion('type', [
  DescriptiveResultSchema,
  UnpairedTtestResultSchema,
  PairedTtestResultSchema,
  OneWayAnovaResultSchema,
  TwoWayAnovaResultSchema,
  ChiSquareResultSchema,
  FisherExactResultSchema,
  KaplanMeierResultSchema,
  FractionOfTotalResultSchema,
  MannWhitneyResultSchema,
  KruskalWallisResultSchema,
  RocAucResultSchema,
  NormalityTestResultSchema,
  LinearRegressionResultSchema,
  DoseResponse4plResultSchema,
  CorrelationResultSchema,
  MultipleRegressionResultSchema,
  NestedTtestResultSchema,
  NestedOneWayAnovaResultSchema,
]);

const AnalysisSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  type: z.string(),
  options: AnalysisOptionsSchema,
  result: AnalysisResultSchema.optional(),
  error: z.string().optional(),
});

const ChartAnnotationSchema = z.object({
  x: z.number(),
  y: z.number(),
  text: z.string(),
  xref: z.enum(['paper', 'x']).optional(),
  yref: z.enum(['paper', 'y']).optional(),
  showarrow: z.boolean().optional(),
  font: z.object({ size: z.number().optional(), color: z.string().optional() }).optional(),
  bgcolor: z.string().optional(),
  borderpad: z.number().optional(),
});

const GraphOptionsSchema = z.object({
  title: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  xAxisScale: z.enum(['linear', 'log']).optional(),
  yAxisScale: z.enum(['linear', 'log']).optional(),
  errorBarType: z.enum(['sem', 'sd', 'ci', 'none']).optional(),
  showLegend: z.boolean().optional(),
  annotations: z.array(ChartAnnotationSchema).optional(),
  showLineOfIdentity: z.boolean().optional(),
  yAxis2SeriesIndex: z.number().optional(),
  dataMode: z.enum(['raw', 'transformed']).optional(),
});

const GraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  tableId: z.string(),
  analysisId: z.union([z.string(), z.null()]).optional(),
  graphType: z.string(),
  options: GraphOptionsSchema,
});

const LayoutItemSchema = z.object({
  graphId: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const LayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(LayoutItemSchema),
});

const SelectionSchema = z.union([
  z.object({ type: z.literal('table'), tableId: z.string() }),
  z.object({ type: z.literal('analysis'), analysisId: z.string() }),
  z.object({ type: z.literal('graph'), graphId: z.string() }),
  z.object({ type: z.literal('layout'), layoutId: z.string() }),
  z.null(),
]);

export const ProjectSchema = z.object({
  version: z.number(),
  tables: z.array(DataTableSchema),
  analyses: z.array(AnalysisSchema),
  graphs: z.array(GraphSchema),
  layouts: z.array(LayoutSchema).default([]),
  selection: SelectionSchema,
});

export function migrateProject(raw: unknown): unknown {
  const obj = raw as Record<string, unknown>;
  if (typeof obj?.version !== 'number') {
    return { ...obj, version: CURRENT_PROJECT_VERSION };
  }
  if (!Array.isArray(obj.layouts)) {
    return { ...obj, layouts: [] };
  }
  return obj;
}
