import { useState, useEffect, useCallback } from 'react';
import type { SurvivalTableData } from '../types';
import { useGridEdit } from '../hooks/useGridEdit';

interface SurvivalDataGridProps {
  data: SurvivalTableData;
  onDataChange: (data: SurvivalTableData) => void;
  'aria-label'?: string;
}

/** Parse 0/1 for event (censored vs event); empty or invalid => 0. */
function parseEventValue(s: string): 0 | 1 {
  const t = s.trim();
  if (t === '' || t === '0') return 0;
  return t === '1' ? 1 : 0;
}

export function SurvivalDataGrid({
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Survival data',
}: SurvivalDataGridProps) {
  const [local, setLocal] = useState<SurvivalTableData>(data);

  // Sync from parent; infer groupLabels from groups if missing (legacy data)
  useEffect(() => {
    const groupLabels =
      data.groupLabels?.length ?
        data.groupLabels
        : data.groups?.length
          ? [...new Set(data.groups)].sort()
          : [];
    setLocal({
      ...data,
      groupLabels: groupLabels.length ? groupLabels : data.groupLabels ?? [],
      groups: data.groups?.length === data.times.length
        ? data.groups
        : data.times.map(() => groupLabels[0] ?? ''),
      subjectLabels: data.subjectLabels?.length === data.times.length
        ? data.subjectLabels
        : data.times.map(() => ''),
    });
  }, [data]);

  const groupLabels = local.groupLabels ?? [];
  const groups = local.groups ?? [];
  const subjectLabels = local.subjectLabels ?? [];
  const n = local.times.length;
  const hasGroupColumns = groupLabels.length > 0;
  const numCols = 2 + (hasGroupColumns ? groupLabels.length : 1);

  const getGroupCellValue = useCallback(
    (rowIndex: number, groupIndex: number): string => {
      const rowGroup = groups[rowIndex];
      const colGroup = groupLabels[groupIndex];
      if (rowGroup !== colGroup) return '';
      const e = local.events[rowIndex];
      return e === 1 ? '1' : '0';
    },
    [groups, groupLabels, local.events]
  );

  const getCellValue = useCallback((rowIdx: number, colIdx: number): string => {
    if (colIdx === 0) return subjectLabels[rowIdx] ?? '';
    if (colIdx === 1) return local.times[rowIdx] != null ? String(local.times[rowIdx]) : '';
    if (hasGroupColumns) return getGroupCellValue(rowIdx, colIdx - 2);
    return local.events[rowIdx] === 1 ? '1' : '0';
  }, [subjectLabels, local.times, local.events, hasGroupColumns, getGroupCellValue]);

  const onCommit = useCallback(
    (r: number, c: number, draft: string) => {
      let next: SurvivalTableData;
      if (c === 0) {
        const nextSubjectLabels = [...(local.subjectLabels ?? [])];
        while (nextSubjectLabels.length < local.times.length) nextSubjectLabels.push('');
        nextSubjectLabels[r] = draft;
        next = { ...local, subjectLabels: nextSubjectLabels };
      } else if (c === 1) {
        const times = [...local.times];
        times[r] = Number(draft) || 0;
        next = { ...local, times };
      } else if (hasGroupColumns) {
        const groupIndex = c - 2;
        const groupName = groupLabels[groupIndex] ?? '';
        const eventVal = draft === '1' ? 1 : draft === '0' ? 0 : 0;
        const nextGroups = [...(local.groups ?? [])];
        while (nextGroups.length < local.times.length) nextGroups.push(groupLabels[0] ?? '');
        nextGroups[r] = groupName;
        const events = [...local.events];
        events[r] = eventVal;
        next = { ...local, groups: nextGroups, events };
      } else {
        const events = [...local.events];
        events[r] = parseEventValue(draft);
        next = { ...local, events };
      }
      setLocal(next);
      onDataChange(next);
    },
    [hasGroupColumns, groupLabels, local, onDataChange]
  );

  const grid = useGridEdit(n, numCols, { getCellValue, onCommit });
  const { focusedRow, setFocusedRow, focusedCol, setFocusedCol, isEditMode, editDraft, setEditDraft, gridRef, handleGridKeyDown, handleCellKeyDown, startEditAt, commitCurrentEdit } = grid;

  const addRow = useCallback(() => {
    setLocal((prev) => ({
      ...prev,
      times: [...prev.times, 0],
      events: [...prev.events, 0],
      groups: [...(prev.groups ?? []), groupLabels[0] ?? ''],
      subjectLabels: [...(prev.subjectLabels ?? []), ''],
    }));
  }, [groupLabels]);

  const removeRow = useCallback((i: number) => {
    setLocal((prev) => ({
      ...prev,
      times: prev.times.filter((_, idx) => idx !== i),
      events: prev.events.filter((_, idx) => idx !== i),
      groups: prev.groups?.filter((_, idx) => idx !== i),
      subjectLabels: prev.subjectLabels?.filter((_, idx) => idx !== i),
    }));
  }, []);

  const addGroup = useCallback(() => {
    setLocal((prev) => ({
      ...prev,
      groupLabels: [...(prev.groupLabels ?? []), `Group ${(prev.groupLabels?.length ?? 0) + 1}`],
    }));
  }, []);

  return (
    <div className="data-grid-wrap">
      <div
        ref={gridRef}
        tabIndex={0}
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={n + 1}
        aria-colcount={numCols + 1}
        onKeyDown={handleGridKeyDown}
        style={{ outline: 'none' }}
      >
        <table className="data-grid survival-data-grid">
          <thead>
            <tr>
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true">
                #
              </th>
              <th scope="col">Subject</th>
              <th scope="col">{local.timeLabel}</th>
              {hasGroupColumns ? (
                groupLabels.map((label, g) => (
                  <th key={g} scope="col" className="data-grid-group-header">
                    <span title={`${local.eventLabel} (1=event, 0=censored)`}>{label}</span>
                  </th>
                ))
              ) : (
                <th scope="col" title="1=event, 0=censored">{local.eventLabel}</th>
              )}
              <th scope="col" style={{ width: '2rem' }} aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i} role="row" aria-rowindex={i + 2}>
                <td style={{ opacity: 0.7 }} aria-hidden="true">
                  {i + 1}
                </td>
                <td
                  role="gridcell"
                  aria-colindex={2}
                  aria-selected={focusedRow === i && focusedCol === 0 && !isEditMode}
                  className={focusedRow === i && focusedCol === 0 && !isEditMode ? 'cell-selected' : ''}
                  onClick={() => { setFocusedRow(i); setFocusedCol(0); gridRef.current?.focus(); }}
                  onDoubleClick={() => startEditAt(i, 0)}
                >
                  {focusedRow === i && focusedCol === 0 && isEditMode ? (
                    <input
                      type="text"
                      className="cell-input"
                      placeholder={`e.g. Mouse ${i + 1}`}
                      aria-label={`Row ${i + 1}, subject ID`}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={commitCurrentEdit}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span className="cell-display">{subjectLabels[i] ?? ''}</span>
                  )}
                </td>
                <td
                  role="gridcell"
                  aria-colindex={3}
                  aria-selected={focusedRow === i && focusedCol === 1 && !isEditMode}
                  className={focusedRow === i && focusedCol === 1 && !isEditMode ? 'cell-selected' : ''}
                  onClick={() => { setFocusedRow(i); setFocusedCol(1); gridRef.current?.focus(); }}
                  onDoubleClick={() => startEditAt(i, 1)}
                >
                  {focusedRow === i && focusedCol === 1 && isEditMode ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className="cell-input"
                      aria-label={`Row ${i + 1}, ${local.timeLabel}`}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onBlur={commitCurrentEdit}
                      onKeyDown={handleCellKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span className="cell-display">{local.times[i] != null ? String(local.times[i]) : ''}</span>
                  )}
                </td>
                {hasGroupColumns ? (
                  groupLabels.map((_, g) => {
                    const dataColIdx = 2 + g;
                    const isFocused = focusedRow === i && focusedCol === dataColIdx;
                    const isEditing = isFocused && isEditMode;
                    return (
                      <td
                        key={g}
                        role="gridcell"
                        aria-colindex={dataColIdx + 2}
                        aria-selected={isFocused && !isEditing}
                        className={isFocused && !isEditing ? 'cell-selected' : ''}
                        onClick={() => { setFocusedRow(i); setFocusedCol(dataColIdx); gridRef.current?.focus(); }}
                        onDoubleClick={() => startEditAt(i, dataColIdx)}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            className="cell-input"
                            placeholder="0/1"
                            aria-label={`Row ${i + 1}, ${groupLabels[g]}`}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onBlur={commitCurrentEdit}
                            onKeyDown={handleCellKeyDown}
                            autoFocus
                          />
                        ) : (
                          <span className="cell-display">{getGroupCellValue(i, g)}</span>
                        )}
                      </td>
                    );
                  })
                ) : (
                  <td
                    role="gridcell"
                    aria-colindex={4}
                    aria-selected={focusedRow === i && focusedCol === 2 && !isEditMode}
                    className={focusedRow === i && focusedCol === 2 && !isEditMode ? 'cell-selected' : ''}
                    onClick={() => { setFocusedRow(i); setFocusedCol(2); gridRef.current?.focus(); }}
                    onDoubleClick={() => startEditAt(i, 2)}
                  >
                    {focusedRow === i && focusedCol === 2 && isEditMode ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        className="cell-input"
                        placeholder="0/1"
                        aria-label={`Row ${i + 1}, ${local.eventLabel}`}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onBlur={commitCurrentEdit}
                        onKeyDown={handleCellKeyDown}
                        autoFocus
                      />
                    ) : (
                      <span className="cell-display">{local.events[i] === 1 ? '1' : '0'}</span>
                    )}
                  </td>
                )}
                <td>
                  <button type="button" className="btn-ghost" onClick={() => removeRow(i)} aria-label="Remove row">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="survival-grid-actions">
        <button type="button" className="btn-ghost" onClick={addRow}>
          + Add row
        </button>
        {hasGroupColumns && (
          <button type="button" className="btn-ghost" onClick={addGroup}>
            + Add group
          </button>
        )}
      </div>
    </div>
  );
}
