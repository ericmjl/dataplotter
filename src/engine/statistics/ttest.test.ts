import { describe, it, expect } from 'vitest';
import jStat from 'jstat';
import { runUnpairedTtest, runPairedTtest } from './ttest';

describe('runUnpairedTtest (Welch)', () => {
  it('computes t, df, p and CI from column table', () => {
    const columnLabels: [string, string] = ['X', 'Y'];
    const rows: (number | null)[][] = [
      [1, 2],
      [2, 4],
      [3, 6],
    ];
    const result = runUnpairedTtest(columnLabels, rows, [0, 1]);
    expect(result.type).toBe('unpaired_ttest');
    if (result.type !== 'unpaired_ttest') return;
    expect(result.mean1).toBe(2);
    expect(result.mean2).toBe(4);
    // SE_diff = sqrt(s1²/n1 + s2²/n2): s1=1, s2=2, n1=n2=3 => sqrt(1/3+4/3)=sqrt(5/3)
    const expectedSeDiff = Math.sqrt(1 / 3 + 4 / 3);
    expect(result.t).toBeCloseTo((2 - 4) / expectedSeDiff, 10);
    // Welch-Satterthwaite df = (se1²+se2²)² / (se1⁴/(n1-1)+se2⁴/(n2-1)) = (5/3)² / ((1/3)²/2+(4/3)²/2) = 50/17
    const se1Sq = 1 / 3;
    const se2Sq = 4 / 3;
    const expectedDf = Math.pow(se1Sq + se2Sq, 2) / (Math.pow(se1Sq, 2) / 2 + Math.pow(se2Sq, 2) / 2);
    expect(result.df).toBeCloseTo(expectedDf, 10);
    // Two-tailed p = 2*(1 - cdf(|t|, df))
    const expectedP = 2 * (1 - jStat.studentt.cdf(Math.abs(result.t), result.df));
    expect(result.p).toBeCloseTo(expectedP, 10);
    expect(result.ci[0]).toBeLessThan(result.mean1 - result.mean2);
    expect(result.ci[1]).toBeGreaterThan(result.mean1 - result.mean2);
  });

  it('returns p=1 and t=0 when both groups have zero variance', () => {
    const columnLabels: [string, string] = ['A', 'B'];
    const rows: (number | null)[][] = [[5, 10], [5, 10]];
    const result = runUnpairedTtest(columnLabels, rows, [0, 1]);
    expect(result.type).toBe('unpaired_ttest');
    if (result.type !== 'unpaired_ttest') return;
    expect(result.t).toBe(0);
    expect(result.p).toBe(1);
    expect(result.mean1).toBe(5);
    expect(result.mean2).toBe(10);
    expect(result.ci[0]).toBe(-5);
    expect(result.ci[1]).toBe(-5);
  });
});

describe('runPairedTtest', () => {
  it('computes t = mean(d)/SE(d), df = n-1, two-tailed p', () => {
    // Pre=[10,20,30], Post=[11,22,33] => diffs=[-1,-2,-3], mean=-2, sample SD=1, n=3, sem=1/sqrt(3)
    const columnLabels: [string, string] = ['Pre', 'Post'];
    const rows: (number | null)[][] = [
      [10, 11],
      [20, 22],
      [30, 33],
    ];
    const result = runPairedTtest(columnLabels, rows, [0, 1]);
    expect(result.type).toBe('paired_ttest');
    if (result.type !== 'paired_ttest') return;
    expect(result.meanDiff).toBeCloseTo(-2, 10);
    const diffs = [-1, -2, -3];
    const n = 3;
    const meanD = -2;
    const sd = jStat.stdev(diffs, true);
    const sem = sd / Math.sqrt(n);
    const expectedT = meanD / sem;
    const expectedDf = n - 1;
    expect(result.t).toBeCloseTo(expectedT, 10);
    expect(result.df).toBe(expectedDf);
    const expectedP = 2 * (1 - jStat.studentt.cdf(Math.abs(result.t), result.df));
    expect(result.p).toBeCloseTo(expectedP, 10);
    expect(result.ci[0]).toBeLessThan(result.meanDiff);
    expect(result.ci[1]).toBeGreaterThan(result.meanDiff);
  });

  it('returns t=0 and p=1 when differences have zero variance', () => {
    const columnLabels: [string, string] = ['Pre', 'Post'];
    const rows: (number | null)[][] = [
      [1, 2],
      [2, 3],
      [3, 4],
    ];
    const result = runPairedTtest(columnLabels, rows, [0, 1]);
    expect(result.type).toBe('paired_ttest');
    if (result.type !== 'paired_ttest') return;
    expect(result.meanDiff).toBe(-1);
    expect(result.t).toBe(0);
    expect(result.p).toBeCloseTo(1, 10);
    expect(result.df).toBe(2);
  });

  it('returns NaN t/p when fewer than 2 pairs', () => {
    const columnLabels: [string, string] = ['A', 'B'];
    const rows: (number | null)[][] = [[1, 2]];
    const result = runPairedTtest(columnLabels, rows, [0, 1]);
    expect(result.type).toBe('paired_ttest');
    if (result.type !== 'paired_ttest') return;
    expect(Number.isNaN(result.t)).toBe(true);
    expect(Number.isNaN(result.p)).toBe(true);
    expect(result.df).toBe(0);
    expect(result.meanDiff).toBe(-1);
  });
});
