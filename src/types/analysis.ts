import type { TableId, AnalysisTypeId } from './project';

export interface Analysis {
  id: import('./project').AnalysisId;
  tableId: TableId;
  type: AnalysisTypeId;
  options: AnalysisOptions;
  result?: AnalysisResult;
  error?: string;
}

export type AnalysisResult =
  | {
      type: 'descriptive';
      byColumn: {
        label: string;
        n: number;
        mean: number;
        sem: number;
        sd: number;
        median: number;
        q1: number;
        q3: number;
      }[];
    }
  | {
      type: 'unpaired_ttest';
      t: number;
      p: number;
      df: number;
      mean1: number;
      mean2: number;
      ci: [number, number];
      label1: string;
      label2: string;
    }
  | {
      type: 'one_way_anova';
      f: number;
      p: number;
      dfBetween: number;
      dfWithin: number;
      groupMeans: { label: string; mean: number }[];
    }
  | {
      type: 'linear_regression';
      slope: number;
      intercept: number;
      r2: number;
      p: number;
      slopeCI: [number, number];
    }
  | {
      type: 'dose_response_4pl';
      ec50: number;
      ec50CI: [number, number];
      bottom: number;
      top: number;
      hillSlope: number;
      curve: { x: number[]; y: number[] };
    };

export interface DescriptiveOptions {
  type: 'descriptive';
}

export interface UnpairedTtestOptions {
  type: 'unpaired_ttest';
  columnLabels: [string, string];
}

export interface PairedTtestOptions {
  type: 'paired_ttest';
  columnLabels: [string, string];
}

export interface OneWayAnovaOptions {
  type: 'one_way_anova';
  columnLabels?: string[];
}

export interface LinearRegressionOptions {
  type: 'linear_regression';
  ySeriesLabel?: string;
}

export interface DoseResponse4plOptions {
  type: 'dose_response_4pl';
  ySeriesLabel?: string;
  logX: boolean;
}

export type AnalysisOptions =
  | DescriptiveOptions
  | UnpairedTtestOptions
  | PairedTtestOptions
  | OneWayAnovaOptions
  | LinearRegressionOptions
  | DoseResponse4plOptions;
