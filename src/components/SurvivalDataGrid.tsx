import { useState, useEffect, useCallback } from 'react';
import type { SurvivalTableData } from '../types';

interface SurvivalDataGridProps {
  data: SurvivalTableData;
  onDataChange: (data: SurvivalTableData) => void;
  'aria-label'?: string;
}

export function SurvivalDataGrid({
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Survival data',
}: SurvivalDataGridProps) {
  const [local, setLocal] = useState<SurvivalTableData>(data);
  useEffect(() => { setLocal(data); }, [data]);
  const commit = useCallback(() => onDataChange(local), [local, onDataChange]);

  const setTime = useCallback((i: number, v: number) => {
    setLocal((prev) => {
      const times = [...prev.times];
      times[i] = v;
      return { ...prev, times };
    });
  }, []);
  const setEvent = useCallback((i: number, v: number) => {
    setLocal((prev) => {
      const events = [...prev.events];
      events[i] = v;
      return { ...prev, events };
    });
  }, []);

  const addRow = useCallback(() => {
    setLocal((prev) => ({
      ...prev,
      times: [...prev.times, 0],
      events: [...prev.events, 0],
      groups: prev.groups ? [...prev.groups, ''] : undefined,
    }));
  }, []);
  const removeRow = useCallback((i: number) => {
    setLocal((prev) => ({
      ...prev,
      times: prev.times.filter((_, idx) => idx !== i),
      events: prev.events.filter((_, idx) => idx !== i),
      groups: prev.groups?.filter((_, idx) => idx !== i),
    }));
  }, []);

  const n = local.times.length;
  return (
    <div className="data-grid-wrap">
      <table className="data-grid" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">{local.timeLabel}</th>
            <th scope="col">{local.eventLabel}</th>
            {local.groups && <th scope="col">{local.groupLabel ?? 'Group'}</th>}
            <th scope="col" style={{ width: '4rem' }} />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => (
            <tr key={i}>
              <td>
                <input
                  type="number"
                  className="data-grid-cell"
                  value={local.times[i] ?? ''}
                  onChange={(e) => setTime(i, Number(e.target.value) || 0)}
                  onBlur={commit}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="data-grid-cell"
                  value={local.events[i] ?? ''}
                  onChange={(e) => setEvent(i, Number(e.target.value) || 0)}
                  onBlur={commit}
                />
              </td>
              {local.groups && (
                <td>
                  <input
                    type="text"
                    className="data-grid-cell"
                    value={local.groups[i] ?? ''}
                    onChange={(e) => {
                      const g = [...(local.groups ?? [])];
                      g[i] = e.target.value;
                      setLocal((prev) => ({ ...prev, groups: g }));
                    }}
                    onBlur={commit}
                  />
                </td>
              )}
              <td>
                <button type="button" className="btn-ghost" onClick={() => removeRow(i)} aria-label="Remove row">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn-ghost" style={{ marginTop: '0.5rem' }} onClick={addRow}>+ Add row</button>
    </div>
  );
}
