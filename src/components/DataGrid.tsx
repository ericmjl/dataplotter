import { useState, useEffect, useCallback } from 'react';
import type { ColumnTableData, XYTableData } from '../types';
import type { TableSchema } from '../lib/tableRegistry';

interface DataGridProps {
  schema: TableSchema;
  format: 'column' | 'xy';
  data: ColumnTableData | XYTableData;
  onDataChange: (data: ColumnTableData | XYTableData) => void;
  /** When true, cells and column headers are not editable (e.g. transformed view). */
  readOnly?: boolean;
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
  readOnly = false,
  'aria-label': ariaLabel = 'Data grid',
}: DataGridProps) {
  const [localData, setLocalData] = useState<ColumnTableData | XYTableData>(data);
  const [editingColIndex, setEditingColIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

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
    const handleStartEdit = (i: number) => {
      setEditingColIndex(i);
      setEditingLabel(columnLabels[i] ?? '');
    };
    const handleCommitLabel = () => {
      if (editingColIndex === null) return;
      const trimmed = editingLabel.trim();
      const nextLabels = [...columnLabels];
      nextLabels[editingColIndex] = trimmed || (columnLabels[editingColIndex] ?? '');
      setLocalData({ ...d, columnLabels: nextLabels });
      setEditingColIndex(null);
      onDataChange({ ...d, columnLabels: nextLabels });
    };
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
                  {!readOnly && editingColIndex === i ? (
                    <input
                      type="text"
                      className="data-grid-header-input"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={handleCommitLabel}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitLabel();
                        if (e.key === 'Escape') {
                          setEditingLabel(columnLabels[i] ?? '');
                          setEditingColIndex(null);
                        }
                      }}
                      aria-label={`Column ${i + 1} name`}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="data-grid-header-label"
                      onClick={() => !readOnly && handleStartEdit(i)}
                      aria-label={readOnly ? undefined : `Rename column ${label}`}
                      title={readOnly ? undefined : 'Click to rename column'}
                      disabled={readOnly}
                    >
                      {label}
                    </button>
                  )}
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
                      readOnly={readOnly}
                      onChange={readOnly ? undefined : (e) => {
                        const next = rows.map((r, ri) =>
                          ri === rowIdx
                            ? r.map((c, ci) =>
                                ci === colIdx ? parseCell(e.target.value) : c
                              )
                            : r
                        );
                        setLocalData({ columnLabels, rows: next });
                      }}
                      onBlur={readOnly ? undefined : commit}
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
                    readOnly={readOnly}
                    onChange={readOnly ? undefined : (e) => {
                      const newX = [...x];
                      newX[rowIdx] = parseCell(e.target.value);
                      setLocalData({ xLabel, yLabels, x: newX, ys });
                    }}
                    onBlur={readOnly ? undefined : commit}
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
                      readOnly={readOnly}
                      onChange={readOnly ? undefined : (e) => {
                        const newYs = ys.map((c, ci) =>
                          ci === colIdx
                            ? c.map((v, ri) =>
                                ri === rowIdx ? parseCell(e.target.value) : v
                              )
                            : c
                        );
                        setLocalData({ xLabel, yLabels, x, ys: newYs });
                      }}
                      onBlur={readOnly ? undefined : commit}
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
