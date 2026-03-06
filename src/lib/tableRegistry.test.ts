import { describe, it, expect } from 'vitest';
import { validateTableData, validateForAnalysis, getSchema, getAllowedAnalyses, getAllowedGraphTypes } from './tableRegistry';

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

  it('getAllowedAnalyses returns analyses for grouped format', () => {
    const analyses = getAllowedAnalyses('grouped');
    expect(analyses).toContain('two_way_anova');
  });

  it('getAllowedAnalyses returns analyses for contingency format', () => {
    const analyses = getAllowedAnalyses('contingency');
    expect(analyses).toContain('chi_square');
    expect(analyses).toContain('fisher_exact');
  });

  it('getAllowedAnalyses returns analyses for survival format', () => {
    const analyses = getAllowedAnalyses('survival');
    expect(analyses).toContain('kaplan_meier');
  });

  it('getAllowedAnalyses returns analyses for partsOfWhole format', () => {
    const analyses = getAllowedAnalyses('partsOfWhole');
    expect(analyses).toContain('fraction_of_total');
  });

  it('getAllowedAnalyses returns nonparam and ROC for column format', () => {
    const analyses = getAllowedAnalyses('column');
    expect(analyses).toContain('mann_whitney');
    expect(analyses).toContain('kruskal_wallis');
    expect(analyses).toContain('roc_auc');
    expect(analyses).toContain('normality_test');
  });

  it('getAllowedGraphTypes returns groupedBar for grouped format', () => {
    const types = getAllowedGraphTypes('grouped');
    expect(types).toContain('groupedBar');
  });

  it('getAllowedGraphTypes returns survival for survival format', () => {
    const types = getAllowedGraphTypes('survival');
    expect(types).toContain('survival');
  });

  it('getAllowedGraphTypes returns pie for partsOfWhole format', () => {
    const types = getAllowedGraphTypes('partsOfWhole');
    expect(types).toContain('pie');
  });
});
