import { useState } from 'react';
import type {
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
} from '../types';
import { useStore } from '../store';

type DialogFormat = 'column' | 'grouped' | 'xy' | 'contingency' | 'survival' | 'partsOfWhole';

interface NewTableDialogProps {
  open: boolean;
  onClose: () => void;
}

type GroupRow = { name: string; replicates: number };

export function NewTableDialog({ open, onClose }: NewTableDialogProps) {
  const addTable = useStore((s) => s.addTable);
  const [format, setFormat] = useState<DialogFormat>('column');
  const [name, setName] = useState('');
  const [columnLabelsStr, setColumnLabelsStr] = useState('A, B, C');
  const [xLabel, setXLabel] = useState('X');
  const [yLabelsStr, setYLabelsStr] = useState('Y');
  const [groupedRows, setGroupedRows] = useState<GroupRow[]>([
    { name: 'Control', replicates: 3 },
    { name: 'Treated', replicates: 3 },
  ]);
  const [contingencyRowLabels, setContingencyRowLabels] = useState('Yes, No');
  const [contingencyColLabels, setContingencyColLabels] = useState('A, B');
  const [survivalTimeLabel, setSurvivalTimeLabel] = useState('Time');
  const [survivalEventLabel, setSurvivalEventLabel] = useState('Event');
  const [partsLabelsStr, setPartsLabelsStr] = useState('A, B, C');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (format === 'column') {
      const columnLabels = columnLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (columnLabels.length === 0) return;
      const data: ColumnTableData = {
        columnLabels,
        rows: [],
      };
      addTable({ name: name || 'Column table', format: 'column', data });
    } else if (format === 'grouped') {
      const groups = groupedRows.filter((g) => g.name.trim() && g.replicates >= 1);
      if (groups.length === 0) return;
      const rowGroupLabels = groups.map((g) => g.name.trim());
      const colGroupLabels = ['Col1', 'Col2'];
      const a = rowGroupLabels.length;
      const b = colGroupLabels.length;
      const cellValues: (number | null)[][][] = Array.from({ length: a }, () =>
        Array.from({ length: b }, () => Array(2).fill(null))
      );
      const data: GroupedTableData = {
        rowGroupLabels,
        colGroupLabels,
        cellValues,
      };
      addTable({ name: name || 'Grouped table', format: 'grouped', data });
    } else if (format === 'contingency') {
      const rowLabels = contingencyRowLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const colLabels = contingencyColLabels.split(',').map((s) => s.trim()).filter(Boolean);
      if (rowLabels.length === 0 || colLabels.length === 0) return;
      const counts = Array.from({ length: rowLabels.length }, () =>
        Array.from({ length: colLabels.length }, () => 0)
      );
      const data: ContingencyTableData = { rowLabels, columnLabels: colLabels, counts };
      addTable({ name: name || 'Contingency table', format: 'contingency', data });
    } else if (format === 'survival') {
      const data: SurvivalTableData = {
        timeLabel: survivalTimeLabel || 'Time',
        eventLabel: survivalEventLabel || 'Event',
        times: [],
        events: [],
      };
      addTable({ name: name || 'Survival table', format: 'survival', data });
    } else if (format === 'partsOfWhole') {
      const labels = partsLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (labels.length === 0) return;
      const data: PartsOfWholeTableData = {
        labels,
        values: labels.map(() => 0),
      };
      addTable({ name: name || 'Parts of whole', format: 'partsOfWhole', data });
    } else {
      const yLabels = yLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (yLabels.length === 0) return;
      const data: XYTableData = {
        xLabel: xLabel || 'X',
        yLabels,
        x: [],
        ys: yLabels.map(() => []),
      };
      addTable({ name: name || 'XY table', format: 'xy', data });
    }
    setName('');
    setColumnLabelsStr('A, B, C');
    setXLabel('X');
    setYLabelsStr('Y');
    setGroupedRows([{ name: 'Control', replicates: 3 }, { name: 'Treated', replicates: 3 }]);
    setContingencyRowLabels('Yes, No');
    setContingencyColLabels('A, B');
    onClose();
  }

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-table-dialog-title"
    >
      <div className="dialog-panel">
        <h2 id="new-table-dialog-title" className="dialog-title">
          New table
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label htmlFor="format" className="dialog-label">
              Format
            </label>
            <select
              id="format"
              className="dialog-input"
              value={format}
              onChange={(e) => setFormat(e.target.value as DialogFormat)}
              aria-label="Table format"
            >
              <option value="column">Column (simple)</option>
              <option value="grouped">Grouped (replicates as columns)</option>
              <option value="contingency">Contingency (counts)</option>
              <option value="survival">Survival</option>
              <option value="partsOfWhole">Parts of whole</option>
              <option value="xy">XY</option>
            </select>
          </div>
          <div className="dialog-field">
            <label htmlFor="name" className="dialog-label">
              Table name
            </label>
            <input
              id="name"
              type="text"
              className="dialog-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={format === 'column' ? 'Column table' : 'XY table'}
              aria-label="Table name"
            />
          </div>
          {format === 'column' && (
            <div className="dialog-field">
              <label htmlFor="columnLabels" className="dialog-label">
                Column labels (comma-separated)
              </label>
              <input
                id="columnLabels"
                type="text"
                className="dialog-input"
                value={columnLabelsStr}
                onChange={(e) => setColumnLabelsStr(e.target.value)}
                placeholder="A, B, C"
                aria-label="Column labels"
              />
            </div>
          )}
          {format === 'grouped' && (
            <div className="dialog-field">
              <span className="dialog-label">Groups (name + number of replicate columns)</span>
              {groupedRows.map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.375rem' }}>
                  <input
                    type="text"
                    className="dialog-input"
                    value={row.name}
                    onChange={(e) =>
                      setGroupedRows((prev) =>
                        prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r))
                      )}
                    placeholder="Group name"
                    aria-label={`Group ${i + 1} name`}
                  />
                  <input
                    type="number"
                    min={1}
                    className="dialog-input"
                    style={{ width: '4rem' }}
                    value={row.replicates}
                    onChange={(e) =>
                      setGroupedRows((prev) =>
                        prev.map((r, j) =>
                          j === i ? { ...r, replicates: Math.max(1, parseInt(e.target.value, 10) || 1) } : r
                        )
                      )}
                    aria-label={`Group ${i + 1} replicates`}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>cols</span>
                  {groupedRows.length > 1 && (
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.2rem 0.4rem' }}
                      onClick={() => setGroupedRows((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Remove group ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost"
                style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => setGroupedRows((prev) => [...prev, { name: '', replicates: 2 }])}
              >
                + Add group
              </button>
            </div>
          )}
          {format === 'contingency' && (
            <>
              <div className="dialog-field">
                <label htmlFor="contingencyRows" className="dialog-label">
                  Row labels (comma-separated)
                </label>
                <input
                  id="contingencyRows"
                  type="text"
                  className="dialog-input"
                  value={contingencyRowLabels}
                  onChange={(e) => setContingencyRowLabels(e.target.value)}
                  placeholder="Yes, No"
                  aria-label="Row labels"
                />
              </div>
              <div className="dialog-field">
                <label htmlFor="contingencyCols" className="dialog-label">
                  Column labels (comma-separated)
                </label>
                <input
                  id="contingencyCols"
                  type="text"
                  className="dialog-input"
                  value={contingencyColLabels}
                  onChange={(e) => setContingencyColLabels(e.target.value)}
                  placeholder="A, B"
                  aria-label="Column labels"
                />
              </div>
            </>
          )}
          {format === 'survival' && (
            <>
              <div className="dialog-field">
                <label htmlFor="survivalTimeLabel" className="dialog-label">Time column label</label>
                <input id="survivalTimeLabel" type="text" className="dialog-input" value={survivalTimeLabel} onChange={(e) => setSurvivalTimeLabel(e.target.value)} />
              </div>
              <div className="dialog-field">
                <label htmlFor="survivalEventLabel" className="dialog-label">Event column label</label>
                <input id="survivalEventLabel" type="text" className="dialog-input" value={survivalEventLabel} onChange={(e) => setSurvivalEventLabel(e.target.value)} />
              </div>
            </>
          )}
          {format === 'partsOfWhole' && (
            <div className="dialog-field">
              <label htmlFor="partsLabels" className="dialog-label">Labels (comma-separated)</label>
              <input id="partsLabels" type="text" className="dialog-input" value={partsLabelsStr} onChange={(e) => setPartsLabelsStr(e.target.value)} placeholder="A, B, C" />
            </div>
          )}
          {format === 'xy' && (
            <>
              <div className="dialog-field">
                <label htmlFor="xLabel" className="dialog-label">
                  X axis label
                </label>
                <input
                  id="xLabel"
                  type="text"
                  className="dialog-input"
                  value={xLabel}
                  onChange={(e) => setXLabel(e.target.value)}
                  aria-label="X axis label"
                />
              </div>
              <div className="dialog-field">
                <label htmlFor="yLabels" className="dialog-label">
                  Y series labels (comma-separated)
                </label>
                <input
                  id="yLabels"
                  type="text"
                  className="dialog-input"
                  value={yLabelsStr}
                  onChange={(e) => setYLabelsStr(e.target.value)}
                  placeholder="Y"
                  aria-label="Y series labels"
                />
              </div>
            </>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={onClose} aria-label="Cancel">
              Cancel
            </button>
            <button type="submit" className="dialog-submit" aria-label="Create table">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
