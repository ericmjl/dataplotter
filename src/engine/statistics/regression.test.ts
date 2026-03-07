import { describe, it, expect } from 'vitest';
import { runLinearRegression } from './regression';

describe('runLinearRegression', () => {
  it('perfect line y = 2x: slope=2, intercept=0, r2=1', () => {
    const x = [1, 2, 3];
    const y = [2, 4, 6];
    const result = runLinearRegression(x, y);
    expect(result.type).toBe('linear_regression');
    if (result.type !== 'linear_regression') return;
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(0, 10);
    expect(result.r2).toBeCloseTo(1, 10);
    expect(result.slopeCI[0]).toBeLessThanOrEqual(result.slope);
    expect(result.slopeCI[1]).toBeGreaterThanOrEqual(result.slope);
  });

  it('known line y ≈ 1.5x - 2/3 for x=[1,2,3], y=[1,2,4]', () => {
    const x = [1, 2, 3];
    const y = [1, 2, 4];
    const result = runLinearRegression(x, y);
    expect(result.type).toBe('linear_regression');
    if (result.type !== 'linear_regression') return;
    // slope = SS_xy/SS_xx = 3/2, intercept = mean(y) - slope*mean(x) = 7/3 - 3 = -2/3
    expect(result.slope).toBeCloseTo(1.5, 10);
    expect(result.intercept).toBeCloseTo(-2 / 3, 10);
    expect(result.r2).toBeGreaterThan(0.9);
    expect(result.r2).toBeLessThanOrEqual(1);
    expect(typeof result.p).toBe('number');
    expect(result.p).toBeGreaterThanOrEqual(0);
    expect(result.p).toBeLessThanOrEqual(1);
  });

  it('constant x: returns slope=0, intercept=mean(y), r2=0, p=1', () => {
    const x = [5, 5, 5];
    const y = [1, 2, 3];
    const result = runLinearRegression(x, y);
    expect(result.type).toBe('linear_regression');
    if (result.type !== 'linear_regression') return;
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(2); // mean(1,2,3)
    expect(result.r2).toBe(0);
    expect(result.p).toBe(1);
    expect(result.slopeCI).toEqual([0, 0]);
    expect(result.interceptCI).toEqual([2, 2]);
  });

  it('n < 2: returns fallback (slope=0, intercept=0, r2=0, p=1)', () => {
    const result = runLinearRegression([1], [2]);
    expect(result.type).toBe('linear_regression');
    if (result.type !== 'linear_regression') return;
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.r2).toBe(0);
    expect(result.p).toBe(1);
    expect(result.slopeCI).toEqual([0, 0]);
  });

  it('filters null/non-finite and runs on valid pairs only', () => {
    const x = [1, 2, null, 3, NaN];
    const y = [2, 4, 0, 6, 8];
    const result = runLinearRegression(x, y);
    expect(result.type).toBe('linear_regression');
    if (result.type !== 'linear_regression') return;
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(0, 10);
    expect(result.r2).toBeCloseTo(1, 10);
  });
});
