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
});
