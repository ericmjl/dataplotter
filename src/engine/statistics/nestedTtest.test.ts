import { describe, it, expect } from 'vitest';
import { runNestedTtest } from './nestedTtest';

describe('runNestedTtest', () => {
  it('returns nested_ttest result with t, p, df, labels, means and ci', () => {
    const result = runNestedTtest(
      ['S1', 'S2', 'S3', 'S4'],
      [
        [1, 2, 10, 11],
        [2, 3, 11, 12],
        [3, 4, 12, 13],
      ],
      ['Control', 'Treated'],
      [0, 0, 1, 1]
    );
    expect(result.type).toBe('nested_ttest');
    if (result.type !== 'nested_ttest') return;
    expect(typeof result.t).toBe('number');
    expect(typeof result.p).toBe('number');
    expect(Number.isFinite(result.t)).toBe(true);
    expect(Number.isFinite(result.p)).toBe(true);
    expect(result.df).toBe(2);
    expect(result.label1).toBe('Control');
    expect(result.label2).toBe('Treated');
    expect(result.ci).toHaveLength(2);
    expect(typeof result.mean1).toBe('number');
    expect(typeof result.mean2).toBe('number');
    expect(result.ci[0]).toBeLessThanOrEqual(result.ci[1]);
  });

  it('uses column means then compares groups', () => {
    const result = runNestedTtest(
      ['A', 'B'],
      [[10, 20], [12, 22]],
      ['G1', 'G2'],
      [0, 1]
    );
    expect(result.type).toBe('nested_ttest');
    if (result.type !== 'nested_ttest') return;
    expect(result.mean1).toBe(11);
    expect(result.mean2).toBe(21);
  });

  it('computes known column means: one column [10,12,14] vs one [20,22,24] => means 12 and 22', () => {
    const result = runNestedTtest(
      ['Unit1', 'Unit2'],
      [
        [10, 20],
        [12, 22],
        [14, 24],
      ],
      ['Group0', 'Group1'],
      [0, 1]
    );
    expect(result.type).toBe('nested_ttest');
    if (result.type !== 'nested_ttest') return;
    expect(result.mean1).toBe(12);
    expect(result.mean2).toBe(22);
    expect(result.label1).toBe('Group0');
    expect(result.label2).toBe('Group1');
    expect(result.df).toBe(0);
    expect(result.t).toBe(0);
    expect(result.p).toBe(1);
    expect(result.ci).toEqual([0, 0]);
  });
});
