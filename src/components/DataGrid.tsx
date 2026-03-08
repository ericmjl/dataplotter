import { useState, useEffect, useCallback } from 'react';
import type { ColumnTableData, XYTableData } from '../types';
import type { TableSchema } from '../lib/tableRegistry';
import { useGridEdit } from '../hooks/useGridEdit';

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

/** @spec PRISM-TBL-011, PRISM-TBL-012, PRISM-TBL-013, PRISM-TBL-014, PRISM-TBL-015, PRISM-TBL-016, PRISM-TBL-018, PRISM-TBL-019 */
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

  const numRows =
    format === 'column' && 'rows' in localData
      ? (localData as ColumnTableData).rows.length
      : format === 'xy' && 'x' in localData
        ? (localData as XYTableData).x.length
        : 0;
  const numCols =
    format === 'column' && 'columnLabels' in localData
      ? (localData as ColumnTableData).columnLabels.length
      : format === 'xy' && 'ys' in localData
        ? 1 + (localData as XYTableData).ys.length
        : 0;

  const getCellValue = useCallback(
    (row: number, col: number): string => {
      if (format === 'column' && 'rows' in localData) {
        const d = localData as ColumnTableData;
        const val = d.rows[row]?.[col];
        return val === null ? '' : String(val);
      }
      if (format === 'xy' && 'x' in localData) {
        const d = localData as XYTableData;
        if (col === 0) return d.x[row] === null ? '' : String(d.x[row]);
        return d.ys[col - 1]?.[row] === null ? '' : String(d.ys[col - 1]![row]);
      }
      return '';
    },
    [format, localData]
  );

  const onCommit = useCallback(
    (row: number, col: number, draft: string) => {
      const val = parseCell(draft);
      if (format === 'column' && 'rows' in localData) {
        const d = localData as ColumnTableData;
        const next = d.rows.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? val : c)) : r
        );
        const nextData = { ...d, rows: next };
        setLocalData(nextData);
        onDataChange(nextData);
      } else if (format === 'xy' && 'x' in localData) {
        const d = localData as XYTableData;
        if (col === 0) {
          const newX = [...d.x];
          newX[row] = val;
          const nextData = { ...d, x: newX };
          setLocalData(nextData);
          onDataChange(nextData);
        } else {
          const colIdx = col - 1;
          const newYs = d.ys.map((c, ci) =>
            ci === colIdx ? c.map((v, ri) => (ri === row ? val : v)) : c
          );
          const nextData = { ...d, ys: newYs };
          setLocalData(nextData);
          onDataChange(nextData);
        }
      }
    },
    [format, localData, onDataChange]
  );

  const grid = useGridEdit(numRows, numCols, {
    readOnly,
    getCellValue,
    onCommit,
  });

  const handleCommitLabel = useCallback(() => {
    if (format !== 'column' || !('columnLabels' in localData) || editingColIndex === null) return;
    const d = localData as ColumnTableData;
    const { columnLabels } = d;
    const trimmed = editingLabel.trim();
    const nextLabels = [...columnLabels];
    nextLabels[editingColIndex] = trimmed || (columnLabels[editingColIndex] ?? '');
    setLocalData({ ...d, columnLabels: nextLabels });
    setEditingColIndex(null);
    onDataChange({ ...d, columnLabels: nextLabels });
  }, [format, localData, editingColIndex, editingLabel, onDataChange]);

  const handleStartEdit = useCallback(
    (i: number) => {
      if (format !== 'column' || !('columnLabels' in localData)) return;
      const d = localData as ColumnTableData;
      setEditingColIndex(i);
      setEditingLabel(d.columnLabels[i] ?? '');
    },
    [format, localData]
  );

  if (format === 'column' && 'columnLabels' in localData) {
    const d = localData as ColumnTableData;
    const { columnLabels, rows, groupLabels, groupForColumn } = d;
    const hasGroups = groupLabels?.length && groupForColumn?.length === columnLabels.length;
    const { focusedRow, setFocusedRow, focusedCol, setFocusedCol, isEditMode, editDraft, setEditDraft, gridRef, handleGridKeyDown, handleCellKeyDown, startEditAt, commitCurrentEdit } = grid;

    if (readOnly) {
      return (
        <div className="data-grid-wrap">
          <table className="data-grid" aria-label={ariaLabel}>
            <thead>
              {hasGroups && groupLabels && (
                <tr>
                  <th scope="col" style={{ width: '2rem' }} aria-hidden="true" />
                  {groupLabels.map((name, g) => (
                    <th key={g} scope="colgroup" colSpan={groupForColumn?.filter((c) => c === g).length ?? 1} className="data-grid-group-header">{name}</th>
                  ))}
                </tr>
              )}
              <tr>
                <th scope="col" style={{ width: '2rem' }} aria-hidden="true">#</th>
                {columnLabels.map((label, i) => (<th key={i} scope="col">{label}</th>))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{ opacity: 0.7 }} aria-hidden="true">{rowIdx + 1}</td>
                  {row.map((val, colIdx) => (
                    <td key={colIdx}><span className="cell-input">{val === null ? '—' : String(val)}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div
        ref={gridRef}
        className="data-grid-wrap"
        tabIndex={0}
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={numRows + 1}
        aria-colcount={numCols + 1}
        onKeyDown={handleGridKeyDown}
      >
        <table className="data-grid">
          <thead>
            {hasGroups && groupLabels && (
              <tr>
                <th scope="col" style={{ width: '2rem' }} aria-hidden="true" />
                {groupLabels.map((name, g) => (
                  <th key={g} scope="colgroup" colSpan={groupForColumn?.filter((c) => c === g).length ?? 1} className="data-grid-group-header">{name}</th>
                ))}
              </tr>
            )}
            <tr>
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true">#</th>
              {columnLabels.map((label, i) => (
                <th key={i} scope="col">
                  {editingColIndex === i ? (
                    <input
                      type="text"
                      className="data-grid-header-input"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={handleCommitLabel}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitLabel();
                        if (e.key === 'Escape') { setEditingLabel(columnLabels[i] ?? ''); setEditingColIndex(null); }
                      }}
                      aria-label={`Column ${i + 1} name`}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="data-grid-header-label"
                      onClick={() => handleStartEdit(i)}
                      aria-label={`Rename column ${label}`}
                      title="Click to rename column"
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
              <tr key={rowIdx} role="row" aria-rowindex={rowIdx + 2}>
                <td style={{ opacity: 0.7 }} aria-hidden="true">{rowIdx + 1}</td>
                {row.map((val, colIdx) => {
                  const isFocused = focusedRow === rowIdx && focusedCol === colIdx;
                  const isEditing = isFocused && isEditMode;
                  return (
                    <td
                      key={colIdx}
                      role="gridcell"
                      aria-colindex={colIdx + 2}
                      aria-selected={isFocused && !isEditMode}
                      className={isFocused && !isEditMode ? 'cell-selected' : ''}
                      onClick={() => { setFocusedRow(rowIdx); setFocusedCol(colIdx); gridRef.current?.focus(); }}
                      onDoubleClick={() => startEditAt(rowIdx, colIdx)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          className="cell-input"
                          aria-label={`Row ${rowIdx + 1}, ${columnLabels[colIdx] ?? 'column'}`}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onBlur={commitCurrentEdit}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                        />
                      ) : (
                        <span className="cell-display">{val === null ? '' : String(val)}</span>
                      )}
                    </td>
                  );
                })}
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
    const { focusedRow, setFocusedRow, focusedCol, setFocusedCol, isEditMode, editDraft, setEditDraft, gridRef, handleGridKeyDown: handleXYGridKeyDown, handleCellKeyDown: handleXYCellKeyDown, startEditAt, commitCurrentEdit } = grid;

    if (readOnly) {
      return (
        <div className="data-grid-wrap">
          <table className="data-grid" aria-label={ariaLabel}>
            <thead>
              <tr>
                <th scope="col" style={{ width: '2rem' }} aria-hidden="true">#</th>
                <th scope="col">{xLabel}</th>
                {yLabels.map((label, i) => (<th key={i} scope="col">{label}</th>))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{ opacity: 0.7 }} aria-hidden="true">{rowIdx + 1}</td>
                  <td><span className="cell-display">{x[rowIdx] === null ? '—' : String(x[rowIdx])}</span></td>
                  {ys.map((col, colIdx) => (
                    <td key={colIdx}><span className="cell-display">{col[rowIdx] === null ? '—' : String(col[rowIdx])}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div
        ref={gridRef}
        className="data-grid-wrap"
        tabIndex={0}
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={n + 1}
        aria-colcount={numCols + 1}
        onKeyDown={handleXYGridKeyDown}
      >
        <table className="data-grid">
          <thead>
            <tr>
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true">#</th>
              <th scope="col">{xLabel}</th>
              {yLabels.map((label, i) => (<th key={i} scope="col">{label}</th>))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, rowIdx) => (
              <tr key={rowIdx} role="row" aria-rowindex={rowIdx + 2}>
                <td style={{ opacity: 0.7 }} aria-hidden="true">{rowIdx + 1}</td>
                <td
                  role="gridcell"
                  aria-colindex={2}
                  aria-selected={focusedRow === rowIdx && focusedCol === 0 && !isEditMode}
                  className={focusedRow === rowIdx && focusedCol === 0 && !isEditMode ? 'cell-selected' : ''}
                  onClick={() => { setFocusedRow(rowIdx); setFocusedCol(0); gridRef.current?.focus(); }}
                  onDoubleClick={() => startEditAt(rowIdx, 0)}
                >
                  {focusedRow === rowIdx && focusedCol === 0 && isEditMode ? (
                    <input
                      type="text"
                      inputMode="decimal"
                      className="cell-input"
                      aria-label={`Row ${rowIdx + 1}, ${xLabel}`}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={commitCurrentEdit}
                      onKeyDown={handleXYCellKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span className="cell-display">{x[rowIdx] === null ? '' : String(x[rowIdx])}</span>
                  )}
                </td>
                {ys.map((col, colIdx) => {
                  const dataColIdx = colIdx + 1;
                  const isFocused = focusedRow === rowIdx && focusedCol === dataColIdx;
                  const isEditing = isFocused && isEditMode;
                  return (
                    <td
                      key={colIdx}
                      role="gridcell"
                      aria-colindex={dataColIdx + 2}
                      aria-selected={isFocused && !isEditing}
                      className={isFocused && !isEditing ? 'cell-selected' : ''}
                      onClick={() => { setFocusedRow(rowIdx); setFocusedCol(dataColIdx); gridRef.current?.focus(); }}
                      onDoubleClick={() => startEditAt(rowIdx, dataColIdx)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          className="cell-input"
                          aria-label={`Row ${rowIdx + 1}, ${yLabels[colIdx] ?? 'Y'}`}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onBlur={commitCurrentEdit}
                          onKeyDown={handleXYCellKeyDown}
                          autoFocus
                        />
                      ) : (
                        <span className="cell-display">{col[rowIdx] === null ? '' : String(col[rowIdx])}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
