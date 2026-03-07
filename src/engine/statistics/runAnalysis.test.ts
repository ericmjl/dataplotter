import { describe, it, expect } from 'vitest';
import { runAnalysis } from './index';

describe('runAnalysis', () => {
  it('returns descriptive for column table', () => {
    const result = runAnalysis(
      'column',
      'descriptive',
      { columnLabels: ['A', 'B'], rows: [[1, 2], [3, 4], [5, 6]] },
      { type: 'descriptive' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('descriptive');
    if (result.value.type !== 'descriptive') return;
    expect(result.value.byColumn).toHaveLength(2);
    expect(result.value.byColumn[0].mean).toBe(3);
    expect(result.value.byColumn[1].mean).toBe(4);
  });

  it('returns descriptive for multipleVariables table', () => {
    const result = runAnalysis(
      'multipleVariables',
      'descriptive',
      { variableLabels: ['V1', 'V2'], rows: [[1, 2], [3, 4]] },
      { type: 'descriptive' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('descriptive');
    if (result.value.type !== 'descriptive') return;
    expect(result.value.byColumn).toHaveLength(2);
  });

  it('returns descriptive for nested table', () => {
    const result = runAnalysis(
      'nested',
      'descriptive',
      { columnLabels: ['C1', 'C2'], rows: [[10, 20], [12, 22]] },
      { type: 'descriptive' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('descriptive');
  });

  it('returns unpaired_ttest result', () => {
    const result = runAnalysis(
      'column',
      'unpaired_ttest',
      { columnLabels: ['X', 'Y'], rows: [[1, 2], [2, 4], [3, 6]] },
      { type: 'unpaired_ttest', columnLabels: ['X', 'Y'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('unpaired_ttest');
    if (result.value.type !== 'unpaired_ttest') return;
    expect(typeof result.value.t).toBe('number');
    expect(typeof result.value.p).toBe('number');
  });

  it('returns paired_ttest result', () => {
    const result = runAnalysis(
      'column',
      'paired_ttest',
      { columnLabels: ['Pre', 'Post'], rows: [[1, 2], [2, 3], [3, 4]] },
      { type: 'paired_ttest', columnLabels: ['Pre', 'Post'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('paired_ttest');
  });

  it('returns one_way_anova result', () => {
    const result = runAnalysis(
      'column',
      'one_way_anova',
      {
        columnLabels: ['A', 'B', 'C'],
        rows: [[1, 2, 3], [2, 3, 4], [3, 4, 5]],
      },
      { type: 'one_way_anova' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('one_way_anova');
    if (result.value.type !== 'one_way_anova') return;
    expect(result.value.groupMeans).toHaveLength(3);
  });

  it('returns two_way_anova result for grouped table', () => {
    const result = runAnalysis(
      'grouped',
      'two_way_anova',
      {
        rowGroupLabels: ['R1', 'R2'],
        colGroupLabels: ['C1', 'C2'],
        cellValues: [
          [[1, 2], [3, 4]],
          [[5, 6], [7, 8]],
        ],
      },
      { type: 'two_way_anova' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('two_way_anova');
  });

  it('returns chi_square result for contingency table', () => {
    const result = runAnalysis(
      'contingency',
      'chi_square',
      {
        rowLabels: ['Yes', 'No'],
        columnLabels: ['A', 'B'],
        counts: [[10, 20], [30, 40]],
      },
      { type: 'chi_square' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('chi_square');
    if (result.value.type !== 'chi_square') return;
    expect(typeof result.value.chi2).toBe('number');
    expect(typeof result.value.p).toBe('number');
  });

  it('returns fisher_exact result for 2x2 contingency', () => {
    const result = runAnalysis(
      'contingency',
      'fisher_exact',
      {
        rowLabels: ['Yes', 'No'],
        columnLabels: ['A', 'B'],
        counts: [[5, 10], [15, 20]],
      },
      { type: 'fisher_exact' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('fisher_exact');
  });

  it('returns kaplan_meier result for survival table', () => {
    const result = runAnalysis(
      'survival',
      'kaplan_meier',
      {
        timeLabel: 'Time',
        eventLabel: 'Event',
        times: [1, 2, 3, 4],
        events: [1, 0, 1, 0],
      },
      { type: 'kaplan_meier' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('kaplan_meier');
  });

  it('returns fraction_of_total for partsOfWhole table', () => {
    const result = runAnalysis(
      'partsOfWhole',
      'fraction_of_total',
      { labels: ['A', 'B', 'C'], values: [10, 20, 70] },
      { type: 'fraction_of_total' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('fraction_of_total');
    if (result.value.type !== 'fraction_of_total') return;
    expect(result.value.fractions).toHaveLength(3);
  });

  it('returns mann_whitney result', () => {
    const result = runAnalysis(
      'column',
      'mann_whitney',
      { columnLabels: ['X', 'Y'], rows: [[1, 10], [2, 20], [3, 30]] },
      { type: 'mann_whitney', columnLabels: ['X', 'Y'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('mann_whitney');
  });

  it('returns kruskal_wallis result', () => {
    const result = runAnalysis(
      'column',
      'kruskal_wallis',
      {
        columnLabels: ['A', 'B', 'C'],
        rows: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
      },
      { type: 'kruskal_wallis' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('kruskal_wallis');
  });

  it('returns roc_auc result', () => {
    const result = runAnalysis(
      'column',
      'roc_auc',
      {
        columnLabels: ['Score', 'Outcome'],
        rows: [[0.2, 0], [0.5, 0], [0.8, 1], [0.9, 1]],
      },
      { type: 'roc_auc', columnLabels: ['Score', 'Outcome'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('roc_auc');
  });

  it('returns normality_test result', () => {
    const result = runAnalysis(
      'column',
      'normality_test',
      { columnLabels: ['A', 'B'], rows: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
      { type: 'normality_test', columnLabel: 'A' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('normality_test');
  });

  it('returns linear_regression result for XY table', () => {
    const result = runAnalysis(
      'xy',
      'linear_regression',
      {
        xLabel: 'X',
        yLabels: ['Y'],
        x: [1, 2, 3],
        ys: [[2, 4, 6]],
      },
      { type: 'linear_regression' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('linear_regression');
    if (result.value.type !== 'linear_regression') return;
    expect(result.value.slope).toBeCloseTo(2, 5);
    expect(result.value.intercept).toBeCloseTo(0, 5);
    expect(result.value.r2).toBeCloseTo(1, 5);
  });

  it('returns dose_response_4pl result', () => {
    const result = runAnalysis(
      'xy',
      'dose_response_4pl',
      {
        xLabel: 'Dose',
        yLabels: ['Response'],
        x: [0.1, 1, 10, 100],
        ys: [[10, 30, 70, 90]],
      },
      { type: 'dose_response_4pl', logX: true }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('dose_response_4pl');
  });

  it('returns correlation result for multipleVariables table', () => {
    const result = runAnalysis(
      'multipleVariables',
      'correlation',
      {
        variableLabels: ['A', 'B', 'C'],
        rows: [[1, 2, 3], [2, 4, 6], [3, 6, 9]],
      },
      { type: 'correlation' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('correlation');
    if (result.value.type !== 'correlation') return;
    expect(result.value.labels).toEqual(['A', 'B', 'C']);
    expect(result.value.r[0][0]).toBe(1);
  });

  it('returns multiple_regression result', () => {
    const result = runAnalysis(
      'multipleVariables',
      'multiple_regression',
      {
        variableLabels: ['X1', 'X2', 'Y'],
        rows: [[1, 0, 1], [2, 0, 2], [3, 0, 3]],
      },
      { type: 'multiple_regression', yVariableLabel: 'Y' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('multiple_regression');
    if (result.value.type !== 'multiple_regression') return;
    expect(result.value.coefficients.length).toBeGreaterThan(0);
  });

  it('returns nested_ttest result', () => {
    const result = runAnalysis(
      'nested',
      'nested_ttest',
      {
        columnLabels: ['S1', 'S2', 'S3', 'S4'],
        rows: [[1, 2, 10, 11], [2, 3, 11, 12]],
        groupLabels: ['Control', 'Treated'],
        groupForColumn: [0, 0, 1, 1],
      },
      { type: 'nested_ttest' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('nested_ttest');
  });

  it('returns nested_one_way_anova result', () => {
    const result = runAnalysis(
      'nested',
      'nested_one_way_anova',
      {
        columnLabels: ['C1', 'C2', 'C3'],
        rows: [[1, 2, 3], [2, 3, 4], [3, 4, 5]],
        groupLabels: ['G1', 'G2', 'G3'],
        groupForColumn: [0, 1, 2],
      },
      { type: 'nested_one_way_anova' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('nested_one_way_anova');
  });

  it('returns error for invalid format/analysis combination', () => {
    const result = runAnalysis(
      'column',
      'chi_square',
      { columnLabels: ['A', 'B'], rows: [] },
      { type: 'chi_square' }
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Chi-square');
  });

});
