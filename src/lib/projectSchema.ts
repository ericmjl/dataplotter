import { z } from 'zod';
import { AnalysisOptionsSchema } from '../types/analysisSchemas';
import { CURRENT_PROJECT_VERSION } from '../types';

const ColumnTableDataSchema = z.object({
  columnLabels: z.array(z.string()),
  rows: z.array(z.array(z.union([z.number(), z.null()]))),
});

const XYTableDataSchema = z.object({
  xLabel: z.string(),
  yLabels: z.array(z.string()),
  x: z.array(z.union([z.number(), z.null()])),
  ys: z.array(z.array(z.union([z.number(), z.null()]))),
});

const DataTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: z.enum(['xy', 'column', 'grouped', 'contingency', 'survival', 'partsOfWhole', 'multipleVariables', 'nested']),
  data: z.union([ColumnTableDataSchema, XYTableDataSchema]),
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

const OneWayAnovaResultSchema = z.object({
  type: z.literal('one_way_anova'),
  f: z.number(),
  p: z.number(),
  dfBetween: z.number(),
  dfWithin: z.number(),
  groupMeans: z.array(z.object({ label: z.string(), mean: z.number() })),
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

const AnalysisResultSchema = z.discriminatedUnion('type', [
  DescriptiveResultSchema,
  UnpairedTtestResultSchema,
  OneWayAnovaResultSchema,
  LinearRegressionResultSchema,
  DoseResponse4plResultSchema,
]);

const AnalysisSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  type: z.string(),
  options: AnalysisOptionsSchema,
  result: AnalysisResultSchema.optional(),
  error: z.string().optional(),
});

const GraphOptionsSchema = z.object({
  title: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  xAxisScale: z.enum(['linear', 'log']).optional(),
  yAxisScale: z.enum(['linear', 'log']).optional(),
  errorBarType: z.enum(['sem', 'sd', 'ci', 'none']).optional(),
  showLegend: z.boolean().optional(),
});

const GraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  tableId: z.string(),
  analysisId: z.union([z.string(), z.null()]).optional(),
  graphType: z.string(),
  options: GraphOptionsSchema,
});

const SelectionSchema = z.union([
  z.object({ type: z.literal('table'), tableId: z.string() }),
  z.object({ type: z.literal('analysis'), analysisId: z.string() }),
  z.object({ type: z.literal('graph'), graphId: z.string() }),
  z.null(),
]);

export const ProjectSchema = z.object({
  version: z.number(),
  tables: z.array(DataTableSchema),
  analyses: z.array(AnalysisSchema),
  graphs: z.array(GraphSchema),
  selection: SelectionSchema,
});

export function migrateProject(raw: unknown): unknown {
  const obj = raw as Record<string, unknown>;
  if (typeof obj?.version !== 'number') {
    return { ...obj, version: CURRENT_PROJECT_VERSION };
  }
  return obj;
}
