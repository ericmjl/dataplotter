import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { parsePrism } from './parsePrism';
import { buildPrism } from './buildPrism';
import type { Project } from '../../types';

describe('parsePrism', () => {
  it('returns error for invalid or corrupted blob', async () => {
    const blob = new Blob(['not a zip'], { type: 'application/octet-stream' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Invalid or corrupted');
  });

  it('returns error when manifest.json is missing', async () => {
    const zip = new JSZip();
    zip.file('other.txt', 'hello');
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('manifest.json');
  });

  it('returns error for invalid manifest JSON', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', 'not valid json');
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Invalid manifest');
  });

  it('returns error for unsupported manifest version', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({ version: 99, tables: [], analyses: [], graphs: [] }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Unsupported');
  });

  it('parses minimal zip with one column table', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      version: 1,
      tables: [{ id: 't1', name: 'MyTable', format: 'column' }],
      analyses: [],
      graphs: [],
    }));
    const dataFolder = zip.folder('data');
    if (dataFolder) {
      dataFolder.file('t1.csv', 'A,B,C\n1,2,3\n4,5,6');
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.tables[0].name).toBe('MyTable');
    expect(result.value.tables[0].format).toBe('column');
    if (result.value.tables[0].format === 'column' && 'columnLabels' in result.value.tables[0].data && 'rows' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.columnLabels).toEqual(['A', 'B', 'C']);
      expect(result.value.tables[0].data.rows).toEqual([[1, 2, 3], [4, 5, 6]]);
    }
  });

  it('parses zip with XY table', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      version: 1,
      tables: [{ id: 'xy1', name: 'XY', format: 'xy' }],
      analyses: [],
      graphs: [],
    }));
    const dataFolder = zip.folder('data');
    if (dataFolder) {
      dataFolder.file('xy1.csv', 'Time,Response\n1,10\n2,20\n3,30');
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.tables[0].format).toBe('xy');
    if (result.value.tables[0].format === 'xy' && 'x' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.xLabel).toBe('Time');
      expect(result.value.tables[0].data.yLabels).toEqual(['Response']);
      expect(result.value.tables[0].data.x).toEqual([1, 2, 3]);
      expect(result.value.tables[0].data.ys).toEqual([[10, 20, 30]]);
    }
  });

  it('returns error when table CSV is missing', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      version: 1,
      tables: [{ id: 'missing', name: 'T', format: 'column' }],
      analyses: [],
      graphs: [],
    }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Missing data');
  });

  it('returns error for empty table CSV', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      version: 1,
      tables: [{ id: 't1', name: 'T', format: 'column' }],
      analyses: [],
      graphs: [],
    }));
    const dataFolder = zip.folder('data');
    if (dataFolder) dataFolder.file('t1.csv', '');
    const blob = await zip.generateAsync({ type: 'blob' });
    const result = await parsePrism(blob);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Empty table');
  });

  it('round-trips project via buildPrism and parsePrism', async () => {
    const project: Project = {
      version: 1,
      tables: [
        {
          id: 't1',
          name: 'ColTable',
          format: 'column',
          data: { columnLabels: ['A', 'B'], rows: [[1, 2], [3, 4]] },
        },
        {
          id: 't2',
          name: 'XYTable',
          format: 'xy',
          data: {
            xLabel: 'X',
            yLabels: ['Y'],
            x: [1, 2, 3],
            ys: [[10, 20, 30]],
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
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(2);
    expect(result.value.tables[0].name).toBe('ColTable');
    expect(result.value.tables[1].name).toBe('XYTable');
    if (result.value.tables[0].format === 'column' && 'columnLabels' in result.value.tables[0].data && 'rows' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.columnLabels).toEqual(['A', 'B']);
      expect(result.value.tables[0].data.rows).toEqual([[1, 2], [3, 4]]);
    }
    if (result.value.tables[1].format === 'xy' && 'x' in result.value.tables[1].data) {
      expect(result.value.tables[1].data.x).toEqual([1, 2, 3]);
      expect(result.value.tables[1].data.ys).toEqual([[10, 20, 30]]);
    }
  });
});
