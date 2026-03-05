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
  OneWayAnovaOptionsSchema,
  LinearRegressionOptionsSchema,
  DoseResponse4plOptionsSchema,
]);
