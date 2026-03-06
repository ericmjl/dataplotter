/**
 * @spec TRANSFORM-003
 */

import { describe, it, expect } from 'vitest';
import { getEffectiveTableData } from './effectiveTableData';
import type { DataTable } from '../types';
import type { ColumnTableData, XYTableData } from '../types/project';

describe('getEffectiveTableData', () => {
  it('returns same reference when mode is raw', () => {
    const data: ColumnTableData = {
      columnLabels: ['A', 'B'],
      rows: [[1, 2], [3, 4]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'column',
      data,
      transformations: [{ columnKey: 'col-0', transformId: 'log10' }],
    };
    const out = getEffectiveTableData(table, 'raw');
    expect(out).toBe(data);
  });

  it('returns same reference when no transformations', () => {
    const data: XYTableData = {
      xLabel: 'X',
      yLabels: ['Y'],
      x: [1, 2, 3],
      ys: [[10, 20, 30]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'xy',
      data,
    };
    expect(getEffectiveTableData(table, 'raw')).toBe(data);
    expect(getEffectiveTableData(table, 'transformed')).toBe(data);
  });

  it('returns transformed Column data with log10 on one column', () => {
    const data: ColumnTableData = {
      columnLabels: ['A', 'B'],
      rows: [[100, 2], [1000, 3]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'column',
      data,
      transformations: [{ columnKey: 'col-0', transformId: 'log10' }],
    };
    const out = getEffectiveTableData(table, 'transformed') as ColumnTableData;
    expect(out).not.toBe(data);
    expect(out.columnLabels).toEqual(['A', 'B']);
    expect(out.rows[0]![0]).toBe(2); // log10(100)
    expect(out.rows[0]![1]).toBe(2);
    expect(out.rows[1]![0]).toBe(3); // log10(1000)
    expect(out.rows[1]![1]).toBe(3);
  });

  it('returns transformed XY data with log10 on y-0', () => {
    const data: XYTableData = {
      xLabel: 'X',
      yLabels: ['Y'],
      x: [1, 2, 3],
      ys: [[10, 100, 1000]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'xy',
      data,
      transformations: [{ columnKey: 'y-0', transformId: 'log10' }],
    };
    const out = getEffectiveTableData(table, 'transformed') as XYTableData;
    expect(out).not.toBe(data);
    expect(out.x).toEqual([1, 2, 3]);
    expect(out.ys[0]).toEqual([1, 2, 3]); // log10(10), log10(100), log10(1000)
  });

  it('returns raw when transformations exist but mode is raw', () => {
    const data: ColumnTableData = {
      columnLabels: ['A'],
      rows: [[1], [2]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'column',
      data,
      transformations: [{ columnKey: 'col-0', transformId: 'square' }],
    };
    const out = getEffectiveTableData(table, 'raw') as ColumnTableData;
    expect(out).toBe(data);
    expect(out.rows[0]![0]).toBe(1);
  });

  it('ignores transformation for non-existent columnKey', () => {
    const data: ColumnTableData = {
      columnLabels: ['A'],
      rows: [[5]],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'column',
      data,
      transformations: [{ columnKey: 'col-99', transformId: 'log10' }],
    };
    const out = getEffectiveTableData(table, 'transformed') as ColumnTableData;
    expect(out.rows[0]![0]).toBe(5);
  });

  it('returns data unchanged for unsupported format (grouped)', () => {
    const data = {
      rowGroupLabels: ['R1'],
      colGroupLabels: ['C1'],
      cellValues: [[[1, 2, 3]]] as (number | null)[][][],
    };
    const table: DataTable = {
      id: 't1',
      name: 'T1',
      format: 'grouped',
      data,
      transformations: [{ columnKey: 'col-0', transformId: 'log10' }],
    };
    const out = getEffectiveTableData(table, 'transformed');
    expect(out).toBe(data);
  });
});
