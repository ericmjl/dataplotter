import { useState, useEffect, useCallback } from 'react';
import type { PartsOfWholeTableData } from '../types';

interface PartsOfWholeDataGridProps {
  data: PartsOfWholeTableData;
  onDataChange: (data: PartsOfWholeTableData) => void;
  'aria-label'?: string;
}

export function PartsOfWholeDataGrid({
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Parts of whole',
}: PartsOfWholeDataGridProps) {
  const [local, setLocal] = useState<PartsOfWholeTableData>(data);
  useEffect(() => { setLocal(data); }, [data]);
  const commit = useCallback(() => onDataChange(local), [local, onDataChange]);

  const setLabel = useCallback((i: number, v: string) => {
    setLocal((prev) => {
      const labels = [...prev.labels];
      labels[i] = v;
      return { ...prev, labels };
    });
  }, []);
  const setValue = useCallback((i: number, v: number) => {
    setLocal((prev) => {
      const values = [...prev.values];
      values[i] = v;
      return { ...prev, values };
    });
  }, []);

  const addRow = useCallback(() => {
    setLocal((prev) => ({
      ...prev,
      labels: [...prev.labels, ''],
      values: [...prev.values, 0],
    }));
  }, []);
  const removeRow = useCallback((i: number) => {
    setLocal((prev) => ({
      ...prev,
      labels: prev.labels.filter((_, idx) => idx !== i),
      values: prev.values.filter((_, idx) => idx !== i),
    }));
  }, []);

  return (
    <div className="data-grid-wrap">
      <table className="data-grid" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
            <th scope="col" style={{ width: '4rem' }} />
          </tr>
        </thead>
        <tbody>
          {local.labels.map((label, i) => (
            <tr key={i}>
              <td>
                <input
                  type="text"
                  className="cell-input"
                  value={label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  onBlur={commit}
                />
              </td>
              <td>
                <input
                  type="number"
                  inputMode="decimal"
                  className="cell-input"
                  value={local.values[i] ?? 0}
                  onChange={(e) => setValue(i, Number(e.target.value) || 0)}
                  onBlur={commit}
                />
              </td>
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
