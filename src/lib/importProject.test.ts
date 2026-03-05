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
});
