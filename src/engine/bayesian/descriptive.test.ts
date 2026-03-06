import { describe, it, expect } from 'vitest';
import { addDescriptiveBayesianFields } from './descriptive';

describe('addDescriptiveBayesianFields', () => {
  it('adds meanCrI and meanSD to each column (conjugate fallback)', () => {
    const result = addDescriptiveBayesianFields({
      type: 'descriptive',
      byColumn: [
        {
          label: 'A',
          n: 5,
          mean: 10,
          sem: 1,
          sd: Math.sqrt(5),
          median: 10,
          q1: 8,
          q3: 12,
        },
      ],
    });
    expect(result.type).toBe('descriptive');
    if (result.type !== 'descriptive') return;
    expect(result.byColumn[0].meanCrI).toEqual([8.04, 11.96]);
    expect(result.byColumn[0].meanSD).toBe(1);
  });
});
