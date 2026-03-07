import { describe, it, expect } from 'vitest';
import { buildPrism } from './buildPrism';
import { parsePrism } from './parsePrism';
import type { Project } from '../../types';

describe('buildPrism', () => {
  it('produces a blob that parsePrism can read', async () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'Test',
          format: 'column',
          data: { columnLabels: ['A'], rows: [[1], [2], [3]] },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const blob = await buildPrism(project);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    const result = await parsePrism(blob);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tables).toHaveLength(1);
      expect(result.value.tables[0].name).toBe('Test');
    }
  });

  it('includes analyses and graphs in zip when present', async () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'T',
          format: 'column',
          data: { columnLabels: ['A'], rows: [[1]] },
        },
      ],
      analyses: [
        {
          id: 'a1',
          tableId: 't1',
          type: 'descriptive',
          options: { type: 'descriptive' },
        },
      ],
      graphs: [
        {
          id: 'g1',
          name: 'G',
          tableId: 't1',
          analysisId: null,
          graphType: 'bar',
          options: {},
        },
      ],
      layouts: [],
      selection: null,
    };
    const blob = await buildPrism(project);
    const result = await parsePrism(blob);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.analyses).toHaveLength(1);
      expect(result.value.analyses[0].type).toBe('descriptive');
      expect(result.value.graphs).toHaveLength(1);
      expect(result.value.graphs[0].name).toBe('G');
    }
  });

  it('round-trips column table with empty cells as null', async () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'WithBlanks',
          format: 'column',
          data: {
            columnLabels: ['A', 'B'],
            rows: [[1, 2], [null, 4], [5, null]],
          },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const blob = await buildPrism(project);
    const result = await parsePrism(blob);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.tables[0].format === 'column' && 'rows' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.rows[1][0]).toBeNull();
      expect(result.value.tables[0].data.rows[2][1]).toBeNull();
    }
  });
});
