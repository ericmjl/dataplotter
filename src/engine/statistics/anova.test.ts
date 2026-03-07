import { describe, it, expect } from 'vitest';
import { runOneWayAnova } from './anova';

describe('runOneWayAnova', () => {
  it('returns one_way_anova result with F, p, and group means', () => {
    const result = runOneWayAnova(
      ['A', 'B', 'C'],
      [
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
        [4, 5, 6],
      ]
    );
    expect(result.type).toBe('one_way_anova');
    if (result.type !== 'one_way_anova') return;
    expect(typeof result.f).toBe('number');
    expect(typeof result.p).toBe('number');
    expect(result.f).toBeGreaterThanOrEqual(0);
    expect(result.p).toBeGreaterThanOrEqual(0);
    expect(result.p).toBeLessThanOrEqual(1);
    expect(result.dfBetween).toBe(2);
    expect(result.dfWithin).toBe(9);
    expect(result.groupMeans).toHaveLength(3);
    expect(result.groupMeans[0].label).toBe('A');
    expect(result.groupMeans[0].mean).toBe(2.5);
    expect(result.groupMeans[1].label).toBe('B');
    expect(result.groupMeans[1].mean).toBe(3.5);
    expect(result.groupMeans[2].label).toBe('C');
    expect(result.groupMeans[2].mean).toBe(4.5);
  });

  it('handles two groups', () => {
    const result = runOneWayAnova(
      ['Control', 'Treated'],
      [[1, 10], [2, 20], [3, 30]]
    );
    expect(result.type).toBe('one_way_anova');
    if (result.type !== 'one_way_anova') return;
    expect(result.groupMeans).toHaveLength(2);
    expect(result.dfBetween).toBe(1);
    expect(result.dfWithin).toBe(4);
  });

  it('matches jStat known F for control/test data', () => {
    // Same data as jStat test/test/anovafscore.js: expected F ≈ 94.769
    const control = [
      433.579, 471.484, 487.407, 518.166, 444.534,
      434.615, 447.401, 525.873, 421.322, 425.949,
    ];
    const test = [
      356.139, 315.869, 327.203, 335.308, 332.547, 336.871,
      353.809, 333.462, 349.203, 340.051,
    ];
    const rows = control.map((c, i) => [c, test[i]]);
    const result = runOneWayAnova(['Control', 'Test'], rows);
    expect(result.type).toBe('one_way_anova');
    if (result.type !== 'one_way_anova') return;
    expect(result.dfBetween).toBe(1);
    expect(result.dfWithin).toBe(18);
    expect(result.f).toBeCloseTo(94.76896135161758, 10);
    expect(result.p).toBeGreaterThan(0);
    expect(result.p).toBeLessThanOrEqual(1);
  });
});
