import { describe, it, expect } from 'vitest';
import { buildPzfx } from './buildPzfx';
import { parsePzfx } from './parsePzfx';
import type { Project } from '../../types';

describe('buildPzfx', () => {
  it('returns XML string with GraphPadPrismFile root', () => {
    const project: Project = {
      version: 1,
      tables: [],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    expect(xml).toContain('<?xml');
    expect(xml).toContain('GraphPadPrismFile');
  });

  it('includes column table as OneWay in output', () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'Col',
          format: 'column',
          data: { columnLabels: ['A', 'B'], rows: [[1, 2], [3, 4]] },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    expect(xml).toContain('TableType="OneWay"');
    expect(xml).toContain('<Title>Col</Title>');
    expect(xml).toContain('<d>1</d>');
  });

  it('includes XY table as XY in output', () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't2',
          name: 'XY',
          format: 'xy',
          data: {
            xLabel: 'X',
            yLabels: ['Y'],
            x: [1, 2],
            ys: [[10, 20]],
          },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    expect(xml).toContain('TableType="XY"');
    expect(xml).toContain('<Title>X</Title>');
    expect(xml).toContain('<d>10</d>');
  });

  it('escapes XML special characters in titles', () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'A & B < C > "D"',
          format: 'column',
          data: { columnLabels: ['X'], rows: [[1]] },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).not.toContain('<Title>A & B');
  });

  it('round-trips: buildPzfx then parsePzfx yields same table data', () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'RoundTrip',
          format: 'column',
          data: { columnLabels: ['P', 'Q'], rows: [[10, 20], [30, 40]] },
        },
      ],
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    const buffer = new TextEncoder().encode(xml).buffer;
    const result = parsePzfx(buffer);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.tables[0].name).toBe('RoundTrip');
    if (result.value.tables[0].format === 'column' && 'columnLabels' in result.value.tables[0].data && 'rows' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.columnLabels).toEqual(['P', 'Q']);
      expect(result.value.tables[0].data.rows).toEqual([[10, 20], [30, 40]]);
    }
  });

  it('omits analyses and graphs (tables only)', () => {
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
      analyses: [{ id: 'a1', tableId: 't1', type: 'descriptive', options: { type: 'descriptive' } }],
      graphs: [{ id: 'g1', name: 'G', tableId: 't1', analysisId: null, graphType: 'bar', options: {} }],
      layouts: [],
      selection: null,
    };
    const xml = buildPzfx(project);
    const result = parsePzfx(new TextEncoder().encode(xml).buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tables).toHaveLength(1);
      expect(result.value.analyses).toHaveLength(0);
      expect(result.value.graphs).toHaveLength(0);
    }
  });
});
