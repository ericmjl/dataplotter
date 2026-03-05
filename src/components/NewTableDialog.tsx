import { useState } from 'react';
import type { TableFormatId, ColumnTableData, XYTableData } from '../types';
import { useStore } from '../store';

interface NewTableDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewTableDialog({ open, onClose }: NewTableDialogProps) {
  const addTable = useStore((s) => s.addTable);
  const [format, setFormat] = useState<TableFormatId>('column');
  const [name, setName] = useState('');
  const [columnLabelsStr, setColumnLabelsStr] = useState('A, B, C');
  const [xLabel, setXLabel] = useState('X');
  const [yLabelsStr, setYLabelsStr] = useState('Y');

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
              onChange={(e) => setFormat(e.target.value as TableFormatId)}
              aria-label="Table format"
            >
              <option value="column">Column (replicates)</option>
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
