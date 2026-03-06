import { useState, useEffect, useCallback } from 'react';
import type { ContingencyTableData } from '../types';

interface ContingencyDataGridProps {
  data: ContingencyTableData;
  onDataChange: (data: ContingencyTableData) => void;
  'aria-label'?: string;
}

function parseCount(s: string): number {
  const t = s.trim();
  if (t === '') return 0;
  const n = parseInt(t, 10);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function ContingencyDataGrid({
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Contingency table',
}: ContingencyDataGridProps) {
  const [local, setLocal] = useState<ContingencyTableData>(data);

  useEffect(() => {
    setLocal(data);
  }, [data]);

  const commit = useCallback(() => {
    onDataChange(local);
  }, [local, onDataChange]);

  const setCount = useCallback((ri: number, cj: number, value: string) => {
    const n = parseCount(value);
    setLocal((prev) => {
      const next = prev.counts.map((row, i) =>
        row.map((cell, j) => (i === ri && j === cj ? n : cell))
      );
      return { ...prev, counts: next };
    });
  }, []);

  const { rowLabels, columnLabels, counts } = local;

  return (
    <div className="data-grid-wrap">
      <table className="data-grid" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col" style={{ width: '6rem' }} />
            {columnLabels.map((label, j) => (
              <th key={j} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((rowLabel, i) => (
            <tr key={i}>
              <th scope="row" className="data-grid-row-header">
                {rowLabel}
              </th>
              {columnLabels.map((_, j) => (
                <td key={j}>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="data-grid-cell"
                    value={counts[i]?.[j] ?? 0}
                    onChange={(e) => setCount(i, j, e.target.value)}
                    onBlur={commit}
                    aria-label={`${rowLabel} ${columnLabels[j]} count`}
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
