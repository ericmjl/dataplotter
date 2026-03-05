import { describe, it, expect } from 'vitest';
import { validateTableData, validateForAnalysis, getSchema, getAllowedAnalyses } from './tableRegistry';

describe('tableRegistry', () => {
  it('validateTableData accepts valid column table', () => {
    const result = validateTableData('column', {
      columnLabels: ['A', 'B'],
      rows: [[1, 2], [3, 4]],
    });
    expect(result.valid).toBe(true);
  });

  it('validateTableData rejects column table with mismatched row length', () => {
    const result = validateTableData('column', {
      columnLabels: ['A', 'B'],
      rows: [[1, 2], [3]],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('validateForAnalysis requires two columns for unpaired_ttest', () => {
    const result = validateForAnalysis(
      'column',
      { columnLabels: ['A'], rows: [[1], [2]] },
      'unpaired_ttest'
    );
    expect(result.valid).toBe(false);
  });

  it('getAllowedAnalyses returns analyses for column format', () => {
    const analyses = getAllowedAnalyses('column');
    expect(analyses).toContain('descriptive');
    expect(analyses).toContain('unpaired_ttest');
    expect(analyses).toContain('one_way_anova');
  });

  it('getSchema returns columns for column data', () => {
    const schema = getSchema('column', {
      columnLabels: ['X', 'Y'],
      rows: [],
    });
    expect(schema.columns).toHaveLength(2);
    expect(schema.columns[0].label).toBe('X');
  });
});
