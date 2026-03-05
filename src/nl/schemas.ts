import { z } from 'zod';
import { AnalysisOptionsSchema } from '../types/analysisSchemas';

export const runAnalysisArgsSchema = z.object({
  tableId: z.string(),
  analysisType: z.string(),
  options: AnalysisOptionsSchema,
});

export const createGraphArgsSchema = z.object({
  tableId: z.string(),
  graphType: z.string(),
  analysisId: z.string().optional(),
  name: z.string().optional(),
});

export const updateGraphOptionsArgsSchema = z.object({
  graphId: z.string(),
  options: z.object({
    title: z.string().optional(),
    xAxisLabel: z.string().optional(),
    yAxisLabel: z.string().optional(),
    xAxisScale: z.enum(['linear', 'log']).optional(),
    yAxisScale: z.enum(['linear', 'log']).optional(),
    errorBarType: z.enum(['sem', 'sd', 'ci', 'none']).optional(),
    showLegend: z.boolean().optional(),
  }),
});

export const createTableArgsSchema = z.object({
  format: z.enum(['xy', 'column']),
  name: z.string(),
  columnLabels: z.array(z.string()).optional(),
  xLabel: z.string().optional(),
  yLabels: z.array(z.string()).optional(),
});

export const listAnalysesArgsSchema = z.object({
  tableId: z.string(),
});

export const listGraphTypesArgsSchema = z.object({
  tableId: z.string(),
});
