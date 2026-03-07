import { describe, it, expect } from 'vitest';
import { runDescriptive } from './descriptive';

describe('runDescriptive', () => {
  it('computes mean, sem, sd, median, q1, q3 per column', () => {
    const columnLabels = ['A', 'B'];
    const rows = [
      [10, 20],
      [12, 22],
      [11, 21],
    ];
    const result = runDescriptive(columnLabels, rows);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    expect(result.byColumn).toHaveLength(2);
    expect(result.byColumn[0].label).toBe('A');
    expect(result.byColumn[0].n).toBe(3);
    expect(result.byColumn[0].mean).toBeCloseTo(11, 4);
    expect(result.byColumn[1].mean).toBeCloseTo(21, 4);
  });

  it('matches known values for a single column: mean, sample SD, SEM, median, Q1, Q3', () => {
    // Data [1,2,3,4,5]: mean=3, sample SD = sqrt(10/4)=sqrt(2.5), SEM = SD/sqrt(5)
    const columnLabels = ['X'];
    const rows = [[1], [2], [3], [4], [5]];
    const result = runDescriptive(columnLabels, rows);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    const col = result.byColumn[0];
    expect(col.n).toBe(5);
    expect(col.mean).toBe(3);
    expect(col.sd).toBeCloseTo(Math.sqrt(2.5), 10);
    expect(col.sem).toBeCloseTo(Math.sqrt(2.5 / 5), 10);
    expect(col.median).toBe(3);
    // jStat.percentile uses linear interpolation; for [1,2,3,4,5], 0.25 -> 2, 0.75 -> 4
    expect(col.q1).toBe(2);
    expect(col.q3).toBe(4);
  });

  it('uses sample formulas: SEM = SD/sqrt(n), SD with n-1', () => {
    const columnLabels = ['A'];
    const rows = [[10], [12], [14]]; // mean=12, variance = (4+0+4)/2=4, SD=2, SEM=2/sqrt(3)
    const result = runDescriptive(columnLabels, rows);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    const col = result.byColumn[0];
    expect(col.n).toBe(3);
    expect(col.mean).toBe(12);
    expect(col.sd).toBe(2);
    expect(col.sem).toBeCloseTo(2 / Math.sqrt(3), 10);
  });

  it('grouped path: one result per group with correct label and pooled column values', () => {
    const columnLabels = ['C1', 'C2', 'D1', 'D2'];
    const groupLabels = ['Control', 'Treatment'];
    const groupForColumn = [0, 0, 1, 1]; // C1,C2 -> Control; D1,D2 -> Treatment
    const rows = [
      [1, 2, 10, 11],
      [3, 4, 12, 13],
    ];
    const result = runDescriptive(columnLabels, rows, groupLabels, groupForColumn);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    expect(result.byColumn).toHaveLength(2);
    expect(result.byColumn[0].label).toBe('Control');
    expect(result.byColumn[1].label).toBe('Treatment');
    // Control: values 1,2,3,4 -> n=4, mean=2.5, sample SD = sqrt(5/3)
    expect(result.byColumn[0].n).toBe(4);
    expect(result.byColumn[0].mean).toBe(2.5);
    expect(result.byColumn[0].sd).toBeCloseTo(Math.sqrt(5 / 3), 10);
    expect(result.byColumn[0].sem).toBeCloseTo(Math.sqrt(5 / 3) / 2, 10);
    // Treatment: 10,11,12,13 -> n=4, mean=11.5
    expect(result.byColumn[1].n).toBe(4);
    expect(result.byColumn[1].mean).toBe(11.5);
  });

  it('n=1 gives sd=0 and sem=0', () => {
    const result = runDescriptive(['A'], [[7]]);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    expect(result.byColumn[0].n).toBe(1);
    expect(result.byColumn[0].mean).toBe(7);
    expect(result.byColumn[0].sd).toBe(0);
    expect(result.byColumn[0].sem).toBe(0);
  });

  it('ignores null and non-finite values', () => {
    const result = runDescriptive(['A'], [[1], [null], [3], [NaN], [5]]);
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    expect(result.byColumn[0].n).toBe(3);
    expect(result.byColumn[0].mean).toBe(3);
  });
});
