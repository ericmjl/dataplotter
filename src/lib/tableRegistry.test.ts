import { describe, it, expect } from 'vitest';
import {
  validateTableData,
  validateForAnalysis,
  getSchema,
  getAllowedAnalyses,
  getAllowedGraphTypes,
  getDefaultOptions,
} from './tableRegistry';

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

  describe('getSchema', () => {
    it('returns columns for multipleVariables with data', () => {
      const schema = getSchema('multipleVariables', {
        variableLabels: ['V1', 'V2', 'V3'],
        rows: [[1, 2, 3]],
      });
      expect(schema.columns).toHaveLength(3);
      expect(schema.columns[0].label).toBe('V1');
      expect(schema.columns[1].id).toBe('col-1');
    });

    it('returns columns for nested with data', () => {
      const schema = getSchema('nested', {
        columnLabels: ['S1', 'S2'],
        rows: [[1, 2]],
      });
      expect(schema.columns).toHaveLength(2);
      expect(schema.columns[0].label).toBe('S1');
    });

    it('returns empty columns for column format with no data', () => {
      const schema = getSchema('column');
      expect(schema.columns).toEqual([]);
    });

    it('returns empty columns and rowLabels for grouped/contingency/survival/partsOfWhole/multipleVariables/nested with no data', () => {
      expect(getSchema('grouped')).toEqual({ columns: [], rowLabels: [] });
      expect(getSchema('contingency')).toEqual({ columns: [], rowLabels: [] });
      expect(getSchema('survival')).toEqual({ columns: [], rowLabels: [] });
      expect(getSchema('partsOfWhole')).toEqual({ columns: [], rowLabels: [] });
      expect(getSchema('multipleVariables')).toEqual({ columns: [], rowLabels: [] });
      expect(getSchema('nested')).toEqual({ columns: [], rowLabels: [] });
    });

    it('returns default X and Y for xy format with no data', () => {
      const schema = getSchema('xy');
      expect(schema.columns).toHaveLength(2);
      expect(schema.columns[0].label).toBe('X');
      expect(schema.columns[1].id).toBe('y-0');
    });

    it('returns schema for survival with groups', () => {
      const schema = getSchema('survival', {
        timeLabel: 'T',
        eventLabel: 'E',
        groupLabels: ['A', 'B'],
        times: [1, 2],
        events: [1, 0],
        groups: ['A', 'B'],
      });
      expect(schema.columns).toHaveLength(3);
      expect(schema.columns[0].label).toBe('T');
      expect(schema.columns[1].id).toBe('group-0');
      expect(schema.columns[1].label).toBe('A');
      expect(schema.columns[2].id).toBe('group-1');
      expect(schema.columns[2].label).toBe('B');
    });

    it('returns schema for grouped and contingency with data', () => {
      const grouped = getSchema('grouped', {
        rowGroupLabels: ['R1'],
        colGroupLabels: ['C1', 'C2'],
        cellValues: [[[1], [2]]],
      });
      expect(grouped.rowLabels).toEqual(['R1']);
      expect(grouped.columns).toHaveLength(2);
      const cont = getSchema('contingency', {
        rowLabels: ['Yes', 'No'],
        columnLabels: ['A', 'B'],
        counts: [[1, 2], [3, 4]],
      });
      expect(cont.rowLabels).toEqual(['Yes', 'No']);
      expect(cont.columns).toHaveLength(2);
    });
  });

  describe('getAllowedAnalyses and getAllowedGraphTypes for MV and nested', () => {
    it('getAllowedAnalyses returns descriptive, correlation, multiple_regression for multipleVariables', () => {
      const analyses = getAllowedAnalyses('multipleVariables');
      expect(analyses).toContain('descriptive');
      expect(analyses).toContain('correlation');
      expect(analyses).toContain('multiple_regression');
      expect(analyses).toHaveLength(3);
    });

    it('getAllowedAnalyses returns descriptive, nested_ttest, nested_one_way_anova for nested', () => {
      const analyses = getAllowedAnalyses('nested');
      expect(analyses).toContain('descriptive');
      expect(analyses).toContain('nested_ttest');
      expect(analyses).toContain('nested_one_way_anova');
      expect(analyses).toHaveLength(3);
    });

    it('getAllowedGraphTypes returns scatter for multipleVariables and bar/box for nested', () => {
      expect(getAllowedGraphTypes('multipleVariables')).toEqual(['scatter']);
      expect(getAllowedGraphTypes('nested')).toContain('bar');
      expect(getAllowedGraphTypes('nested')).toContain('box');
    });

    it('getAllowedGraphTypes returns empty for contingency', () => {
      expect(getAllowedGraphTypes('contingency')).toEqual([]);
    });
  });

  describe('validateTableData multipleVariables and nested', () => {
    it('accepts valid multipleVariables table', () => {
      const r = validateTableData('multipleVariables', {
        variableLabels: ['A', 'B'],
        rows: [[1, 2], [3, 4]],
      });
      expect(r.valid).toBe(true);
    });

    it('rejects multipleVariables with no variables', () => {
      const r = validateTableData('multipleVariables', {
        variableLabels: [],
        rows: [],
      });
      expect(r.valid).toBe(false);
      expect(r.errors).toContain('At least one variable required');
    });

    it('rejects multipleVariables when row length does not match column count', () => {
      const r = validateTableData('multipleVariables', {
        variableLabels: ['A', 'B'],
        rows: [[1, 2], [3]],
      });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('Row 2'))).toBe(true);
    });

    it('accepts valid nested table', () => {
      const r = validateTableData('nested', {
        columnLabels: ['S1', 'S2'],
        rows: [[1, 2], [3, 4]],
      });
      expect(r.valid).toBe(true);
    });

    it('rejects nested with fewer than two columns', () => {
      const r = validateTableData('nested', {
        columnLabels: ['S1'],
        rows: [[1]],
      });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('at least two columns'))).toBe(true);
    });

    it('rejects nested when groupForColumn has invalid indices', () => {
      const r = validateTableData('nested', {
        columnLabels: ['A', 'B'],
        rows: [[1, 2]],
        groupLabels: ['G1', 'G2'],
        groupForColumn: [0, 5],
      });
      expect(r.valid).toBe(false);
      expect(r.errors).toContain('groupForColumn must be valid group indices');
    });
  });

  describe('validateTableData contingency, survival, partsOfWhole, grouped', () => {
    it('rejects contingency with empty row or column labels', () => {
      expect(
        validateTableData('contingency', {
          rowLabels: [],
          columnLabels: ['A'],
          counts: [[]],
        }).valid
      ).toBe(false);
      expect(
        validateTableData('contingency', {
          rowLabels: ['R'],
          columnLabels: [],
          counts: [[]],
        }).valid
      ).toBe(false);
    });

    it('rejects contingency when counts dimensions do not match', () => {
      const r = validateTableData('contingency', {
        rowLabels: ['R1', 'R2'],
        columnLabels: ['C1'],
        counts: [[1], [2, 3]],
      });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('dimensions must match'))).toBe(true);
    });

    it('rejects contingency with negative or non-integer count', () => {
      const r = validateTableData('contingency', {
        rowLabels: ['R'],
        columnLabels: ['C'],
        counts: [[-1]],
      });
      expect(r.valid).toBe(false);
    });

    it('rejects survival when times and events length differ', () => {
      const r = validateTableData('survival', {
        timeLabel: 'T',
        eventLabel: 'E',
        times: [1, 2],
        events: [1],
      });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('times and events length'))).toBe(true);
    });

    it('rejects partsOfWhole when labels and values length differ', () => {
      const r = validateTableData('partsOfWhole', {
        labels: ['A', 'B'],
        values: [1],
      });
      expect(r.valid).toBe(false);
    });

    it('rejects grouped when cellValues dimensions do not match', () => {
      const r = validateTableData('grouped', {
        rowGroupLabels: ['R1'],
        colGroupLabels: ['C1', 'C2'],
        cellValues: [[[1]]],
      });
      expect(r.valid).toBe(false);
    });

    it('rejects column table with column that has no numeric values', () => {
      const r = validateTableData('column', {
        columnLabels: ['A', 'B'],
        rows: [[null, 2], [null, 4]],
      });
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('no numeric values'))).toBe(true);
    });

    it('rejects column when groupForColumn length does not match column count', () => {
      const r = validateTableData('column', {
        columnLabels: ['A', 'B', 'C'],
        rows: [[1, 2, 3]],
        groupLabels: ['G1', 'G2'],
        groupForColumn: [0, 1],
      });
      expect(r.valid).toBe(false);
    });

    it('rejects xy when Y series length does not match X', () => {
      const r = validateTableData('xy', {
        xLabel: 'X',
        yLabels: ['Y'],
        x: [1, 2, 3],
        ys: [[10, 20]],
      });
      expect(r.valid).toBe(false);
    });
  });

  describe('validateForAnalysis multipleVariables and nested', () => {
    it('rejects correlation when fewer than two variables', () => {
      const r = validateForAnalysis(
        'multipleVariables',
        { variableLabels: ['V1'], rows: [[1], [2]] },
        'correlation'
      );
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('at least two variables'))).toBe(true);
    });

    it('rejects correlation when a variable has fewer than 2 values', () => {
      const r = validateForAnalysis(
        'multipleVariables',
        { variableLabels: ['A', 'B'], rows: [[1, 2]] },
        'correlation'
      );
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('at least 2 values for correlation'))).toBe(true);
    });

    it('accepts correlation with two variables and enough values', () => {
      const r = validateForAnalysis(
        'multipleVariables',
        { variableLabels: ['A', 'B'], rows: [[1, 2], [3, 4]] },
        'correlation'
      );
      expect(r.valid).toBe(true);
    });

    it('rejects nested_ttest when not exactly two groups', () => {
      const r = validateForAnalysis(
        'nested',
        { columnLabels: ['S1', 'S2'], rows: [[1, 2]], groupLabels: ['G1'], groupForColumn: [0, 0] },
        'nested_ttest'
      );
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('exactly two groups'))).toBe(true);
    });

    it('rejects nested_ttest when a group has fewer than 2 values total', () => {
      const r = validateForAnalysis(
        'nested',
        {
          columnLabels: ['S1', 'S2'],
          rows: [[1, 2]],
          groupLabels: ['G1', 'G2'],
          groupForColumn: [0, 1],
        },
        'nested_ttest'
      );
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('Each group needs at least 2 values'))).toBe(true);
    });

    it('rejects nested_one_way_anova when column has no values', () => {
      const r = validateForAnalysis(
        'nested',
        { columnLabels: ['S1', 'S2'], rows: [[1, null]] },
        'nested_one_way_anova'
      );
      expect(r.valid).toBe(false);
    });

    it('rejects fisher_exact when table is not 2x2', () => {
      const r = validateForAnalysis(
        'contingency',
        {
          rowLabels: ['A', 'B', 'C'],
          columnLabels: ['X', 'Y'],
          counts: [[1, 2], [3, 4], [5, 6]],
        },
        'fisher_exact'
      );
      expect(r.valid).toBe(false);
      expect(r.errors?.some((e) => e.includes('2×2'))).toBe(true);
    });

    it('rejects chi_square when total count is zero', () => {
      const r = validateForAnalysis(
        'contingency',
        { rowLabels: ['A'], columnLabels: ['B'], counts: [[0]] },
        'chi_square'
      );
      expect(r.valid).toBe(false);
    });

    it('rejects two_way_anova when too few values per cell', () => {
      const r = validateForAnalysis(
        'grouped',
        {
          rowGroupLabels: ['R1', 'R2'],
          colGroupLabels: ['C1', 'C2'],
          cellValues: [
            [[1], [1]],
            [[1], [1]],
          ],
        },
        'two_way_anova'
      );
      expect(r.valid).toBe(false);
    });

    it('rejects normality_test when column has fewer than 3 values', () => {
      const r = validateForAnalysis(
        'column',
        { columnLabels: ['A'], rows: [[1], [2]] },
        'normality_test'
      );
      expect(r.valid).toBe(false);
    });

    it('rejects dose_response_4pl when fewer than 4 pairs', () => {
      const r = validateForAnalysis(
        'xy',
        { xLabel: 'X', yLabels: ['Y'], x: [1, 2, 3], ys: [[1, 2, 3]] },
        'dose_response_4pl'
      );
      expect(r.valid).toBe(false);
    });
  });

  describe('getDefaultOptions', () => {
    it('returns correlation options for correlation', () => {
      const opts = getDefaultOptions('multipleVariables', 'correlation', {
        variableLabels: ['A', 'B'],
        rows: [],
      });
      expect(opts).toEqual({ type: 'correlation' });
    });

    it('returns multiple_regression with last variable as Y for multipleVariables', () => {
      const opts = getDefaultOptions('multipleVariables', 'multiple_regression', {
        variableLabels: ['X1', 'X2', 'Y'],
        rows: [],
      });
      expect(opts.type).toBe('multiple_regression');
      expect((opts as { yVariableLabel?: string }).yVariableLabel).toBe('Y');
    });

    it('returns nested_ttest with groupLabels when nested has two groups', () => {
      const opts = getDefaultOptions('nested', 'nested_ttest', {
        columnLabels: ['S1', 'S2'],
        rows: [],
        groupLabels: ['Control', 'Treated'],
        groupForColumn: [0, 1],
      });
      expect(opts.type).toBe('nested_ttest');
      expect((opts as { groupLabels?: [string, string] }).groupLabels).toEqual(['Control', 'Treated']);
    });

    it('returns nested_one_way_anova options', () => {
      const opts = getDefaultOptions('nested', 'nested_one_way_anova', {
        columnLabels: ['S1', 'S2'],
        rows: [],
      });
      expect(opts).toEqual({ type: 'nested_one_way_anova' });
    });

    it('returns dose_response_4pl with logX true', () => {
      const opts = getDefaultOptions('xy', 'dose_response_4pl', {
        xLabel: 'X',
        yLabels: ['Y'],
        x: [],
        ys: [],
      });
      expect((opts as { logX: boolean }).logX).toBe(true);
    });
  });
});
