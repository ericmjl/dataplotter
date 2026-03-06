import type { TableId, AnalysisTypeId } from './project';

export interface Analysis {
  id: import('./project').AnalysisId;
  tableId: TableId;
  type: AnalysisTypeId;
  options: AnalysisOptions;
  result?: AnalysisResult;
  error?: string;
}

/** Bayesian posterior summary: 95% credible interval for the mean. */
export type CrI95 = [number, number];

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
        /** 95% credible interval for the mean (Bayesian). */
        meanCrI?: CrI95;
        /** Posterior SD of the mean (Bayesian). */
        meanSD?: number;
      }[];
    }
  | {
      type: 'unpaired_ttest';
      t: number;
      p: number;
      df: number;
      mean1: number;
      mean2: number;
      /** Difference-of-means 95% CI (frequentist) or credible interval (Bayesian). */
      ci: [number, number];
      /** 95% credible interval for mean difference (Bayesian). */
      meanDiffCrI?: CrI95;
      /** P(μ1 > μ2) from posterior (Bayesian). */
      pDiffPositive?: number;
      label1: string;
      label2: string;
    }
  | {
      /** @spec PRISM-ANA-006 */
      type: 'paired_ttest';
      t: number;
      p: number;
      df: number;
      meanDiff: number;
      ci: [number, number];
      meanDiffCrI?: CrI95;
      pDiffPositive?: number;
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
      /** @spec PRISM-ANA-007 */
      type: 'two_way_anova';
      factorARows: string[];
      factorBCols: string[];
      fA: number;
      pA: number;
      fB: number;
      pB: number;
      fAB: number;
      pAB: number;
      dfA: number;
      dfB: number;
      dfAB: number;
      dfWithin: number;
      cellMeans: { rowLabel: string; colLabel: string; mean: number }[];
    }
  | {
      /** @spec PRISM-ANA-008 */
      type: 'chi_square';
      chi2: number;
      p: number;
      df: number;
    }
  | {
      /** @spec PRISM-ANA-009 */
      type: 'fisher_exact';
      p: number;
      oddsRatio?: number;
    }
  | {
      /** @spec PRISM-ANA-010 */
      type: 'kaplan_meier';
      curves: { group: string; time: number[]; survival: number[] }[];
      medianSurvival?: { group: string; median: number }[];
    }
  | {
      /** @spec PRISM-ANA-011 */
      type: 'fraction_of_total';
      fractions: { label: string; value: number; fraction: number }[];
    }
  | {
      /** @spec PRISM-ANA-013 */
      type: 'mann_whitney';
      u: number;
      p: number;
      label1: string;
      label2: string;
      median1: number;
      median2: number;
    }
  | {
      /** @spec PRISM-ANA-013 */
      type: 'kruskal_wallis';
      h: number;
      p: number;
      df: number;
      groupMedians: { label: string; median: number }[];
    }
  | {
      /** @spec PRISM-ANA-014 */
      type: 'roc_auc';
      auc: number;
      n: number;
      labelScore: string;
      labelOutcome: string;
    }
  | {
      /** Normality test (e.g. D'Agostino–Pearson); used to choose parametric vs nonparametric. */
      type: 'normality_test';
      passed: boolean;
      p: number;
      statistic: number;
      skewness: number;
      kurtosis: number;
      label: string;
    }
  | {
      type: 'linear_regression';
      slope: number;
      intercept: number;
      r2: number;
      p: number;
      /** 95% CI (frequentist) or credible interval (Bayesian) for slope. */
      slopeCI: [number, number];
      /** 95% CI or CrI for intercept (Bayesian). */
      interceptCI?: [number, number];
      /** Curve and optional 95% CrI band for plotting (Bayesian). */
      curve?: {
        x: number[];
        y: number[];
        yLower?: number[];
        yUpper?: number[];
      };
    }
  | {
      type: 'dose_response_4pl';
      ec50: number;
      ec50CI: [number, number];
      bottom: number;
      top: number;
      hillSlope: number;
      curve: {
        x: number[];
        y: number[];
        /** 95% CrI band for curve when available (Bayesian). */
        yLower?: number[];
        yUpper?: number[];
      };
      /** 95% CrI for bottom, top, hillSlope when available (e.g. bootstrap). */
      bottomCI?: [number, number];
      topCI?: [number, number];
      hillSlopeCI?: [number, number];
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

export interface TwoWayAnovaOptions {
  type: 'two_way_anova';
}

export interface ChiSquareOptions {
  type: 'chi_square';
}

export interface FisherExactOptions {
  type: 'fisher_exact';
}

export interface KaplanMeierOptions {
  type: 'kaplan_meier';
}

export interface FractionOfTotalOptions {
  type: 'fraction_of_total';
}

export interface MannWhitneyOptions {
  type: 'mann_whitney';
  columnLabels: [string, string];
}

export interface KruskalWallisOptions {
  type: 'kruskal_wallis';
  columnLabels?: string[];
}

export interface RocAucOptions {
  type: 'roc_auc';
  columnLabels: [string, string];
}

export interface NormalityTestOptions {
  type: 'normality_test';
  columnLabel?: string;
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

/** @spec TRANSFORM-005 Optional data mode (raw vs transformed) for all analysis types. */
export type AnalysisOptions =
  | (DescriptiveOptions & { dataMode?: 'raw' | 'transformed' })
  | (UnpairedTtestOptions & { dataMode?: 'raw' | 'transformed' })
  | (PairedTtestOptions & { dataMode?: 'raw' | 'transformed' })
  | (OneWayAnovaOptions & { dataMode?: 'raw' | 'transformed' })
  | (TwoWayAnovaOptions & { dataMode?: 'raw' | 'transformed' })
  | (ChiSquareOptions & { dataMode?: 'raw' | 'transformed' })
  | (FisherExactOptions & { dataMode?: 'raw' | 'transformed' })
  | (KaplanMeierOptions & { dataMode?: 'raw' | 'transformed' })
  | (FractionOfTotalOptions & { dataMode?: 'raw' | 'transformed' })
  | (MannWhitneyOptions & { dataMode?: 'raw' | 'transformed' })
  | (KruskalWallisOptions & { dataMode?: 'raw' | 'transformed' })
  | (RocAucOptions & { dataMode?: 'raw' | 'transformed' })
  | (NormalityTestOptions & { dataMode?: 'raw' | 'transformed' })
  | (LinearRegressionOptions & { dataMode?: 'raw' | 'transformed' })
  | (DoseResponse4plOptions & { dataMode?: 'raw' | 'transformed' });
