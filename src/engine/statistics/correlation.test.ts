import { describe, it, expect } from 'vitest';
import { runCorrelation } from './correlation';

describe('runCorrelation', () => {
  it('returns correlation matrix with ones on diagonal', () => {
    const result = runCorrelation(
      ['A', 'B'],
      [[1, 2], [2, 4], [3, 6]]
    );
    expect(result.type).toBe('correlation');
    if (result.type !== 'correlation') return;
    expect(result.labels).toEqual(['A', 'B']);
    expect(result.r[0][0]).toBe(1);
    expect(result.r[1][1]).toBe(1);
    expect(result.n[0][0]).toBe(3);
    expect(result.n[1][1]).toBe(3);
  });

  it('returns perfect correlation for linearly related variables', () => {
    const result = runCorrelation(
      ['X', 'Y'],
      [[1, 2], [2, 4], [3, 6], [4, 8]]
    );
    expect(result.type).toBe('correlation');
    if (result.type !== 'correlation') return;
    expect(result.r[0][1]).toBeCloseTo(1, 10);
    expect(result.r[1][0]).toBeCloseTo(1, 10);
  });

  it('returns symmetric r and n matrices', () => {
    const result = runCorrelation(
      ['A', 'B', 'C'],
      [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]
    );
    if (result.type !== 'correlation') return;
    expect(result.labels).toHaveLength(3);
    expect(result.n[0][1]).toBe(result.n[1][0]);
    expect(result.n[0][2]).toBe(result.n[2][0]);
    expect(result.n[1][2]).toBe(result.n[2][1]);
    expect(result.r[0][1]).toBe(result.r[1][0]);
    expect(result.r[0][2]).toBe(result.r[2][0]);
    expect(result.r[1][2]).toBe(result.r[2][1]);
  });

  it('handles missing values with pairwise deletion (row-aligned pairs)', () => {
    // Rows 0 and 3 have both A and B: (1,2) and (5,10) -> n=2, perfect correlation r=1
    const result = runCorrelation(
      ['A', 'B'],
      [[1, 2], [null, 4], [3, null], [5, 10]]
    );
    expect(result.type).toBe('correlation');
    if (result.type !== 'correlation') return;
    expect(result.n[0][1]).toBe(2);
    expect(result.n[1][0]).toBe(2);
    expect(result.r[0][1]).toBeCloseTo(1, 10);
    expect(result.r[1][0]).toBeCloseTo(1, 10);
  });

  it('returns perfect negative correlation for inversely related variables', () => {
    const result = runCorrelation(
      ['X', 'Y'],
      [[1, 4], [2, 3], [3, 2], [4, 1]]
    );
    if (result.type !== 'correlation') return;
    expect(result.r[0][1]).toBeCloseTo(-1, 10);
    expect(result.r[1][0]).toBeCloseTo(-1, 10);
  });

  it('returns NaN for pairs with fewer than 2 valid rows', () => {
    const result = runCorrelation(
      ['A', 'B'],
      [[1, null]]
    );
    if (result.type !== 'correlation') return;
    expect(result.r[0][1]).toBeNaN();
    expect(result.r[1][0]).toBeNaN();
    expect(result.n[0][1]).toBe(0);
    expect(result.n[1][0]).toBe(0);
  });
});
