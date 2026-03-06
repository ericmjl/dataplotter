import { describe, it, expect } from 'vitest';
import { importProject } from './importProject';
import { exportProject } from './exportProject';

describe('importProject', () => {
  it('rejects invalid JSON', () => {
    const result = importProject('not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON');
  });

  it('accepts valid minimal project', () => {
    const project = {
      version: 1,
      tables: [],
      analyses: [],
      graphs: [],
      selection: null,
    };
    const result = importProject(JSON.stringify(project));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tables).toHaveLength(0);
      expect(result.value.version).toBe(1);
    }
  });

  it('roundtrip export and import', () => {
    const project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'Test',
          format: 'column' as const,
          data: { columnLabels: ['A'], rows: [[1], [2]] },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const json = exportProject(project as import('../types').Project);
    const result = importProject(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tables).toHaveLength(1);
      expect(result.value.tables[0].name).toBe('Test');
    }
  });

  it('roundtrip project with transformations, viewMode, and dataMode', () => {
    const project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'XY',
          format: 'xy' as const,
          data: {
            xLabel: 'X',
            yLabels: ['Y'],
            x: [1, 2, 3],
            ys: [[10, 100, 1000]],
          },
          transformations: [{ columnKey: 'y-0', transformId: 'log10' }],
          viewMode: 'transformed' as const,
        },
      ],
      analyses: [
        {
          id: 'a1',
          tableId: 't1',
          type: 'descriptive' as const,
          options: { type: 'descriptive' as const, dataMode: 'transformed' as const },
        },
      ],
      graphs: [
        {
          id: 'g1',
          name: 'G1',
          tableId: 't1',
          analysisId: null,
          graphType: 'scatter' as const,
          options: { dataMode: 'raw' as const },
        },
      ],
      layouts: [],
      selection: null,
    };
    const json = exportProject(project as import('../types').Project);
    const result = importProject(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const t = result.value.tables[0];
      expect(t?.transformations).toEqual([{ columnKey: 'y-0', transformId: 'log10' }]);
      expect(t?.viewMode).toBe('transformed');
      const a = result.value.analyses[0];
      expect((a?.options as { dataMode?: string }).dataMode).toBe('transformed');
      const g = result.value.graphs[0];
      expect(g?.options.dataMode).toBe('raw');
    }
  });
});
