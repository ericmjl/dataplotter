import { describe, it, expect } from 'vitest';
import { runAnalysisAsync } from './index';

describe('runAnalysisAsync', () => {
  it('returns descriptive result with meanCrI and meanSD (TS conjugate fallback)', async () => {
    const format = 'column';
    const tableData = {
      columnLabels: ['A', 'B'],
      rows: [
        [10, 20],
        [12, 22],
        [11, 21],
      ],
    };
    const result = await runAnalysisAsync(
      format,
      'descriptive',
      tableData,
      { type: 'descriptive' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('descriptive');
    if (result.value.type !== 'descriptive') return;
    expect(result.value.byColumn).toHaveLength(2);
    expect(result.value.byColumn[0].meanCrI).toBeDefined();
    expect(result.value.byColumn[0].meanSD).toBeDefined();
    expect(result.value.byColumn[0].meanCrI).toHaveLength(2);
  });

  it('returns sync result for unpaired_ttest', async () => {
    const format = 'column';
    const tableData = {
      columnLabels: ['X', 'Y'],
      rows: [
        [1, 2],
        [2, 3],
        [3, 4],
      ],
    };
    const result = await runAnalysisAsync(
      format,
      'unpaired_ttest',
      tableData,
      { type: 'unpaired_ttest', columnLabels: ['X', 'Y'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('unpaired_ttest');
  });

  it('returns unpaired_ttest with frequentist fields (optional Bayesian fields from TS)', async () => {
    const format = 'column';
    const tableData = {
      columnLabels: ['Group1', 'Group2'],
      rows: [
        [10, 20],
        [12, 22],
        [11, 21],
        [13, 23],
        [9, 19],
      ],
    };
    const result = await runAnalysisAsync(
      format,
      'unpaired_ttest',
      tableData,
      { type: 'unpaired_ttest', columnLabels: ['Group1', 'Group2'] }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('unpaired_ttest');
    if (result.value.type !== 'unpaired_ttest') return;
    
    // Frequentist fields should always be present
    expect(result.value.mean1).toBeDefined();
    expect(result.value.mean2).toBeDefined();
    expect(result.value.t).toBeDefined();
    expect(result.value.p).toBeDefined();
    expect(result.value.df).toBeDefined();
    
    // Optional Bayesian-style fields (e.g. meanDiffCrI, pDiffPositive) may be present from TS
    if (result.value.meanDiffCrI) {
      expect(result.value.meanDiffCrI).toHaveLength(2);
    }
    if (result.value.pDiffPositive != null) {
      expect(result.value.pDiffPositive).toBeGreaterThanOrEqual(0);
      expect(result.value.pDiffPositive).toBeLessThanOrEqual(1);
    }
  });

  it('returns linear_regression result with slope, intercept, R², p', async () => {
    const format = 'xy';
    const tableData = {
      xLabel: 'X',
      yLabels: ['Y'],
      x: [1, 2, 3],
      ys: [[2, 4, 6]],
    };
    const result = await runAnalysisAsync(
      format,
      'linear_regression',
      tableData,
      { type: 'linear_regression', ySeriesLabel: 'Y' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('linear_regression');
    if (result.value.type !== 'linear_regression') return;
    expect(typeof result.value.slope).toBe('number');
    expect(typeof result.value.intercept).toBe('number');
    expect(typeof result.value.r2).toBe('number');
    expect(typeof result.value.p).toBe('number');
    expect(result.value.slope).toBeCloseTo(2, 5);
    expect(result.value.intercept).toBeCloseTo(0, 5);
    expect(result.value.r2).toBeCloseTo(1, 5);
  });
});
