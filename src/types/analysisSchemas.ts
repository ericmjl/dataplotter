import { z } from 'zod';

export const DescriptiveOptionsSchema = z.object({
  type: z.literal('descriptive'),
});

export const UnpairedTtestOptionsSchema = z.object({
  type: z.literal('unpaired_ttest'),
  columnLabels: z.tuple([z.string(), z.string()]),
});

export const PairedTtestOptionsSchema = z.object({
  type: z.literal('paired_ttest'),
  columnLabels: z.tuple([z.string(), z.string()]),
});

export const OneWayAnovaOptionsSchema = z.object({
  type: z.literal('one_way_anova'),
  columnLabels: z.array(z.string()).optional(),
});

export const TwoWayAnovaOptionsSchema = z.object({
  type: z.literal('two_way_anova'),
});

export const ChiSquareOptionsSchema = z.object({
  type: z.literal('chi_square'),
});

export const FisherExactOptionsSchema = z.object({
  type: z.literal('fisher_exact'),
});

export const KaplanMeierOptionsSchema = z.object({
  type: z.literal('kaplan_meier'),
});

export const FractionOfTotalOptionsSchema = z.object({
  type: z.literal('fraction_of_total'),
});

export const MannWhitneyOptionsSchema = z.object({
  type: z.literal('mann_whitney'),
  columnLabels: z.tuple([z.string(), z.string()]),
});

export const KruskalWallisOptionsSchema = z.object({
  type: z.literal('kruskal_wallis'),
  columnLabels: z.array(z.string()).optional(),
});

export const RocAucOptionsSchema = z.object({
  type: z.literal('roc_auc'),
  columnLabels: z.tuple([z.string(), z.string()]),
});

export const NormalityTestOptionsSchema = z.object({
  type: z.literal('normality_test'),
  columnLabel: z.string().optional(),
});

export const LinearRegressionOptionsSchema = z.object({
  type: z.literal('linear_regression'),
  ySeriesLabel: z.string().optional(),
});

export const DoseResponse4plOptionsSchema = z.object({
  type: z.literal('dose_response_4pl'),
  ySeriesLabel: z.string().optional(),
  logX: z.boolean(),
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
]);
