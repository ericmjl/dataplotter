import { useState, useEffect, useCallback } from 'react';
import type { ColumnTableData, XYTableData } from '../types';
import type { TableSchema } from '../lib/tableRegistry';

interface DataGridProps {
  schema: TableSchema;
  format: 'column' | 'xy';
  data: ColumnTableData | XYTableData;
  onDataChange: (data: ColumnTableData | XYTableData) => void;
  'aria-label'?: string;
}

function parseCell(v: string): number | null {
  const t = v.trim();
  if (t === '' || t === '-' || t.toLowerCase() === 'nan') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function DataGrid({
  schema: _schema,
  format,
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Data grid',
}: DataGridProps) {
  const [localData, setLocalData] = useState<ColumnTableData | XYTableData>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const commit = useCallback(() => {
    onDataChange(localData);
  }, [localData, onDataChange]);

  if (format === 'column' && 'columnLabels' in localData) {
    const d = localData as ColumnTableData;
    const { columnLabels, rows, groupLabels, groupForColumn } = d;
    const hasGroups = groupLabels?.length && groupForColumn?.length === columnLabels.length;
    return (
      <div className="data-grid-wrap">
        <table className="data-grid" aria-label={ariaLabel}>
          <thead>
            {hasGroups && groupLabels && (
              <tr>
                <th scope="col" style={{ width: '2rem' }} aria-hidden="true" />
                {groupLabels.map((name, g) => (
                  <th
                    key={g}
                    scope="colgroup"
                    colSpan={
                      groupForColumn?.filter((c) => c === g).length ?? 1
                    }
                    className="data-grid-group-header"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true">
                #
              </th>
              {columnLabels.map((label, i) => (
                <th key={i} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ opacity: 0.7 }} aria-hidden="true">
                  {rowIdx + 1}
                </td>
                {row.map((val, colIdx) => (
                  <td key={colIdx}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="cell-input"
                      aria-label={`Row ${rowIdx + 1}, ${columnLabels[colIdx] ?? 'column'}`}
                      value={val === null ? '' : String(val)}
                      onChange={(e) => {
                        const next = rows.map((r, ri) =>
                          ri === rowIdx
                            ? r.map((c, ci) =>
                                ci === colIdx ? parseCell(e.target.value) : c
                              )
                            : r
                        );
                        setLocalData({ columnLabels, rows: next });
                      }}
                      onBlur={commit}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (format === 'xy' && 'x' in localData) {
    const d = localData as XYTableData;
    const { xLabel, yLabels, x, ys } = d;
    const n = x.length;
    return (
      <div className="data-grid-wrap">
        <table className="data-grid" aria-label={ariaLabel}>
          <thead>
            <tr>
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true">
                #
              </th>
              <th scope="col">{xLabel}</th>
              {yLabels.map((label, i) => (
                <th key={i} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ opacity: 0.7 }} aria-hidden="true">
                  {rowIdx + 1}
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="cell-input"
                    aria-label={`Row ${rowIdx + 1}, ${xLabel}`}
                    value={x[rowIdx] === null ? '' : String(x[rowIdx])}
                    onChange={(e) => {
                      const newX = [...x];
                      newX[rowIdx] = parseCell(e.target.value);
                      setLocalData({ xLabel, yLabels, x: newX, ys });
                    }}
                    onBlur={commit}
                  />
                </td>
                {ys.map((col, colIdx) => (
                  <td key={colIdx}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="cell-input"
                      aria-label={`Row ${rowIdx + 1}, ${yLabels[colIdx] ?? 'Y'}`}
                      value={col[rowIdx] === null ? '' : String(col[rowIdx])}
                      onChange={(e) => {
                        const newYs = ys.map((c, ci) =>
                          ci === colIdx
                            ? c.map((v, ri) =>
                                ri === rowIdx ? parseCell(e.target.value) : v
                              )
                            : c
                        );
                        setLocalData({ xLabel, yLabels, x, ys: newYs });
                      }}
                      onBlur={commit}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
