import { describe, it, expect } from 'vitest';
import { runChiSquare } from './chiSquare';

describe('runChiSquare', () => {
  it('returns chi_square result for 2x2 table', () => {
    const result = runChiSquare(
      ['Yes', 'No'],
      ['A', 'B'],
      [[10, 20], [30, 40]]
    );
    expect(result.type).toBe('chi_square');
    if (result.type !== 'chi_square') return;
    expect(typeof result.chi2).toBe('number');
    expect(typeof result.p).toBe('number');
    expect(result.df).toBe(1);
  });

  it('returns higher chi2 for more skewed counts', () => {
    const result1 = runChiSquare(
      ['R1', 'R2'],
      ['C1', 'C2'],
      [[50, 50], [50, 50]]
    );
    const result2 = runChiSquare(
      ['R1', 'R2'],
      ['C1', 'C2'],
      [[80, 20], [20, 80]]
    );
    expect(result1.type).toBe('chi_square');
    expect(result2.type).toBe('chi_square');
    if (result1.type !== 'chi_square' || result2.type !== 'chi_square') return;
    expect(result2.chi2).toBeGreaterThan(result1.chi2);
  });

  it('computes expected chi2 for known 2x2 table', () => {
    // Table [[10,20],[30,40]]: row sums 30,70; col sums 40,60; N=100
    // E = row*col/N => 12, 18, 28, 42. chi2 = sum (O-E)^2/E = 4/12+4/18+4/28+4/42 = 50/63
    const result = runChiSquare(
      ['Yes', 'No'],
      ['A', 'B'],
      [[10, 20], [30, 40]]
    );
    expect(result.type).toBe('chi_square');
    if (result.type !== 'chi_square') return;
    const expectedChi2 = 50 / 63;
    expect(result.chi2).toBeCloseTo(expectedChi2, 10);
    expect(result.df).toBe(1);
    expect(result.p).toBeGreaterThan(0);
    expect(result.p).toBeLessThan(1);
  });

  it('uses df = (rows-1)*(cols-1) for non-2x2 table', () => {
    const result = runChiSquare(
      ['R1', 'R2'],
      ['C1', 'C2', 'C3'],
      [[10, 10, 10], [10, 10, 10]]
    );
    expect(result.type).toBe('chi_square');
    if (result.type !== 'chi_square') return;
    expect(result.df).toBe(2);
    expect(typeof result.chi2).toBe('number');
    expect(typeof result.p).toBe('number');
  });

  it('returns NaN chi2 and p, df 0 when total count is zero', () => {
    const result = runChiSquare(
      ['A', 'B'],
      ['X', 'Y'],
      [[0, 0], [0, 0]]
    );
    expect(result.type).toBe('chi_square');
    if (result.type !== 'chi_square') return;
    expect(result.df).toBe(0);
    expect(Number.isNaN(result.chi2)).toBe(true);
    expect(Number.isNaN(result.p)).toBe(true);
  });
});
