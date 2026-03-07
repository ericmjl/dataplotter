import { z } from 'zod';

const dataModeSchema = z.enum(['raw', 'transformed']).optional();

export const DescriptiveOptionsSchema = z.object({
  type: z.literal('descriptive'),
  dataMode: dataModeSchema,
});

export const UnpairedTtestOptionsSchema = z.object({
  type: z.literal('unpaired_ttest'),
  columnLabels: z.tuple([z.string(), z.string()]),
  dataMode: dataModeSchema,
});

export const PairedTtestOptionsSchema = z.object({
  type: z.literal('paired_ttest'),
  columnLabels: z.tuple([z.string(), z.string()]),
  dataMode: dataModeSchema,
});

export const OneWayAnovaOptionsSchema = z.object({
  type: z.literal('one_way_anova'),
  columnLabels: z.array(z.string()).optional(),
  dataMode: dataModeSchema,
});

export const TwoWayAnovaOptionsSchema = z.object({
  type: z.literal('two_way_anova'),
  dataMode: dataModeSchema,
});

export const ChiSquareOptionsSchema = z.object({
  type: z.literal('chi_square'),
  dataMode: dataModeSchema,
});

export const FisherExactOptionsSchema = z.object({
  type: z.literal('fisher_exact'),
  dataMode: dataModeSchema,
});

export const KaplanMeierOptionsSchema = z.object({
  type: z.literal('kaplan_meier'),
  dataMode: dataModeSchema,
});

export const FractionOfTotalOptionsSchema = z.object({
  type: z.literal('fraction_of_total'),
  dataMode: dataModeSchema,
});

export const MannWhitneyOptionsSchema = z.object({
  type: z.literal('mann_whitney'),
  columnLabels: z.tuple([z.string(), z.string()]),
  dataMode: dataModeSchema,
});

export const KruskalWallisOptionsSchema = z.object({
  type: z.literal('kruskal_wallis'),
  columnLabels: z.array(z.string()).optional(),
  dataMode: dataModeSchema,
});

export const RocAucOptionsSchema = z.object({
  type: z.literal('roc_auc'),
  columnLabels: z.tuple([z.string(), z.string()]),
  dataMode: dataModeSchema,
});

export const NormalityTestOptionsSchema = z.object({
  type: z.literal('normality_test'),
  columnLabel: z.string().optional(),
  dataMode: dataModeSchema,
});

export const LinearRegressionOptionsSchema = z.object({
  type: z.literal('linear_regression'),
  ySeriesLabel: z.string().optional(),
  dataMode: dataModeSchema,
});

export const DoseResponse4plOptionsSchema = z.object({
  type: z.literal('dose_response_4pl'),
  ySeriesLabel: z.string().optional(),
  logX: z.boolean(),
  dataMode: dataModeSchema,
});

export const CorrelationOptionsSchema = z.object({
  type: z.literal('correlation'),
  dataMode: dataModeSchema,
});

export const MultipleRegressionOptionsSchema = z.object({
  type: z.literal('multiple_regression'),
  yVariableLabel: z.string().optional(),
  dataMode: dataModeSchema,
});

export const NestedTtestOptionsSchema = z.object({
  type: z.literal('nested_ttest'),
  groupLabels: z.tuple([z.string(), z.string()]).optional(),
  dataMode: dataModeSchema,
});

export const NestedOneWayAnovaOptionsSchema = z.object({
  type: z.literal('nested_one_way_anova'),
  dataMode: dataModeSchema,
});

export const AnalysisOptionsSchema = z.discriminatedUnion('type', [
  DescriptiveOptionsSchema,
  UnpairedTtestOptionsSchema,
  PairedTtestOptionsSchema,
  OneWayAnovaOptionsSchema,
  TwoWayAnovaOptionsSchema,
  ChiSquareOptionsSchema,
  FisherExactOptionsSchema,
  KaplanMeierOptionsSchema,
  FractionOfTotalOptionsSchema,
  MannWhitneyOptionsSchema,
  KruskalWallisOptionsSchema,
  RocAucOptionsSchema,
  NormalityTestOptionsSchema,
  LinearRegressionOptionsSchema,
  DoseResponse4plOptionsSchema,
  CorrelationOptionsSchema,
  MultipleRegressionOptionsSchema,
  NestedTtestOptionsSchema,
  NestedOneWayAnovaOptionsSchema,
]);
