/**
 * Resolver: returns effective table data (raw or transformed) for consumers.
 * @spec TRANSFORM-003
 */

import type { DataTable } from '../types';
import type { ColumnTransformation } from '../types/transformations';
import type {
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
  MultipleVariablesTableData,
  NestedTableData,
} from '../types/project';
import { getSchema } from './tableRegistry';
import { getTransformById } from './transformRegistry';

export type DataMode = 'raw' | 'transformed';

/**
 * Returns effective table data for the given mode. Same shape as table.data.
 * Raw or unsupported format: returns table.data (same reference when no transforms).
 */
export function getEffectiveTableData(
  table: DataTable,
  mode: DataMode
):
  | ColumnTableData
  | XYTableData
  | GroupedTableData
  | ContingencyTableData
  | SurvivalTableData
  | PartsOfWholeTableData
  | MultipleVariablesTableData
  | NestedTableData {
  const data = table.data;
  const transformations = table.transformations;
  if (mode === 'raw' || !transformations?.length) {
    return data;
  }

  const format = table.format;
  if (format === 'column' && 'columnLabels' in data && !('cellValues' in data)) {
    return getEffectiveColumn(data as ColumnTableData, transformations);
  }
  if (format === 'xy' && 'x' in data) {
    return getEffectiveXY(data as XYTableData, transformations);
  }

  return data;
}

function applyTransform(
  transformations: ColumnTransformation[],
  getValue: (columnKey: string, rowIndex: number) => number | null,
  setValue: (columnKey: string, rowIndex: number, value: number | null) => void,
  columnKeys: string[],
  nRows: number
): void {
  for (const t of transformations) {
    const def = getTransformById(t.transformId);
    if (!def) continue;
    if (!columnKeys.includes(t.columnKey)) continue;
    for (let r = 0; r < nRows; r++) {
      const v = getValue(t.columnKey, r);
      setValue(t.columnKey, r, def.fn(v));
    }
  }
}

function getEffectiveColumn(
  data: ColumnTableData,
  transformations: ColumnTransformation[]
): ColumnTableData {
  const schema = getSchema('column', data);
  const colIds = schema.columns.map((c) => c.id);
  const keyToIndex = new Map<string, number>();
  colIds.forEach((id, i) => keyToIndex.set(id, i));

  const rows: (number | null)[][] = data.rows.map((row) => [...row]);

  applyTransform(
    transformations,
    (columnKey, rowIndex) => {
      const colIdx = keyToIndex.get(columnKey);
      return colIdx !== undefined ? rows[rowIndex]![colIdx] ?? null : null;
    },
    (columnKey, rowIndex, value) => {
      const colIdx = keyToIndex.get(columnKey);
      if (colIdx !== undefined) rows[rowIndex]![colIdx] = value;
    },
    colIds,
    data.rows.length
  );

  return {
    ...data,
    rows,
    groupLabels: data.groupLabels,
    groupForColumn: data.groupForColumn,
  };
}

function getEffectiveXY(
  data: XYTableData,
  transformations: ColumnTransformation[]
): XYTableData {
  const schema = getSchema('xy', data);
  const colIds = schema.columns.map((c) => c.id);
  const n = data.x.length;
  const nY = data.ys.length;

  const xOut = [...data.x];
  const ysOut = data.ys.map((arr) => [...arr]);

  const getVal = (columnKey: string, rowIndex: number): number | null => {
    if (columnKey === 'x') {
      const v = xOut[rowIndex];
      return v != null && Number.isFinite(v) ? v : null;
    }
    if (columnKey.startsWith('y-')) {
      const yIdx = parseInt(columnKey.slice(2), 10);
      if (Number.isNaN(yIdx) || yIdx < 0 || yIdx >= nY) return null;
      const v = ysOut[yIdx]![rowIndex];
      return v != null && Number.isFinite(v) ? v : null;
    }
    return null;
  };

  const setVal = (columnKey: string, rowIndex: number, value: number | null): void => {
    if (columnKey === 'x') xOut[rowIndex] = value;
    else if (columnKey.startsWith('y-')) {
      const yIdx = parseInt(columnKey.slice(2), 10);
      if (!Number.isNaN(yIdx) && yIdx >= 0 && yIdx < nY) ysOut[yIdx]![rowIndex] = value;
    }
  };

  applyTransform(transformations, getVal, setVal, colIds, n);

  return {
    ...data,
    x: xOut,
    ys: ysOut,
  };
}
