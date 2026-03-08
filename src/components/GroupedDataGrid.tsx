import { useState, useEffect, useCallback } from 'react';
import type { GroupedTableData } from '../types';

function parseCellValues(s: string): (number | null)[] {
  return s
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    });
}

function formatCellValues(vals: (number | null)[]): string {
  return vals
    .filter((v) => v != null && Number.isFinite(v))
    .join(', ');
}

interface GroupedDataGridProps {
  data: GroupedTableData;
  onDataChange: (data: GroupedTableData) => void;
  'aria-label'?: string;
}

export function GroupedDataGrid({
  data,
  onDataChange,
  'aria-label': ariaLabel = 'Grouped data grid',
}: GroupedDataGridProps) {
  const [local, setLocal] = useState<GroupedTableData>(data);

  useEffect(() => {
    setLocal(data);
  }, [data]);

  const commit = useCallback(() => {
    onDataChange(local);
  }, [local, onDataChange]);

  const setCell = useCallback(
    (ri: number, cj: number, value: string) => {
      const vals = parseCellValues(value);
      setLocal((prev) => {
        const next = prev.cellValues.map((row, i) =>
          row.map((cell, j) =>
            i === ri && j === cj ? (vals.length ? vals : [null]) : cell
          )
        );
        return { ...prev, cellValues: next };
      });
    },
    []
  );

  const { rowGroupLabels, colGroupLabels, cellValues } = local;

  return (
    <div className="data-grid-wrap">
      <table className="data-grid" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col" style={{ width: '6rem' }} />
            {colGroupLabels.map((label, j) => (
              <th key={j} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowGroupLabels.map((rowLabel, i) => (
            <tr key={i}>
              <th scope="row" className="data-grid-row-header">
                {rowLabel}
              </th>
              {colGroupLabels.map((_, j) => (
                <td key={j}>
                  <input
                    type="text"
                    className="cell-input"
                    value={formatCellValues(cellValues[i]?.[j] ?? [])}
                    onChange={(e) => setCell(i, j, e.target.value)}
                    onBlur={commit}
                    placeholder="1, 2, 3"
                    aria-label={`${rowLabel} ${colGroupLabels[j]} values`}
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
