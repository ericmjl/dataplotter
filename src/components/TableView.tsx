import { useState } from 'react';
import { useStore } from '../store';
import { getSchema, validateTableData, getAllowedAnalyses, getAllowedGraphTypes, getDefaultOptions } from '../lib/tableRegistry';
import { DataGrid } from './DataGrid';
import type { AnalysisTypeId, GraphTypeId, ColumnTableData, XYTableData } from '../types';

type ViewMode = 'wide' | 'tidy';

function toTidy(
  format: 'column' | 'xy',
  data: ColumnTableData | XYTableData
): { headers: string[]; rows: (string | number | null)[][] } {
  if (format === 'column' && 'columnLabels' in data) {
    const d = data as ColumnTableData;
    const { columnLabels, rows, groupLabels, groupForColumn } = d;
    const hasGroups = groupLabels?.length && groupForColumn?.length === columnLabels.length;
    if (hasGroups && groupLabels) {
      const headers = ['Row', 'Group', 'Replicate', 'Value'];
      const tidyRows: (string | number | null)[][] = [];
      rows.forEach((row, rowIdx) => {
        columnLabels.forEach((colLabel, colIdx) => {
          const g = groupForColumn![colIdx];
          const groupName = groupLabels[g] ?? '';
          tidyRows.push([rowIdx + 1, groupName, colLabel, row[colIdx] ?? null]);
        });
      });
      return { headers, rows: tidyRows };
    }
    const headers = ['Row', 'Column', 'Value'];
    const tidyRows: (string | number | null)[][] = [];
    rows.forEach((row, rowIdx) => {
      columnLabels.forEach((colLabel, colIdx) => {
        tidyRows.push([rowIdx + 1, colLabel, row[colIdx] ?? null]);
      });
    });
    return { headers, rows: tidyRows };
  }
  if (format === 'xy' && 'x' in data) {
    const d = data as XYTableData;
    const { xLabel, yLabels, x, ys } = d;
    const headers = [xLabel, 'Series', 'Value'];
    const tidyRows: (string | number | null)[][] = [];
    x.forEach((xVal, i) => {
      yLabels.forEach((series, sIdx) => {
        tidyRows.push([xVal ?? null, series, ys[sIdx]?.[i] ?? null]);
      });
    });
    return { headers, rows: tidyRows };
  }
  return { headers: [], rows: [] };
}

function TidyTable({
  format,
  data,
  'aria-label': ariaLabel,
}: {
  format: 'column' | 'xy';
  data: ColumnTableData | XYTableData;
  'aria-label'?: string;
}) {
  const { headers, rows } = toTidy(format, data);
  return (
    <div className="data-grid-wrap">
      <table className="data-grid data-grid-tidy" aria-label={ariaLabel}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIdx) => (
            <tr key={rowIdx}>
              {r.map((cell, colIdx) => (
                <td key={colIdx}>{cell === null ? '—' : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableView() {
  const project = useStore((s) => s.project);
  const updateTableData = useStore((s) => s.updateTableData);
  const addAnalysis = useStore((s) => s.addAnalysis);
  const addGraph = useStore((s) => s.addGraph);
  const [addAnalysisOpen, setAddAnalysisOpen] = useState(false);
  const [addGraphOpen, setAddGraphOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wide');

  const selection = project.selection;

  if (selection?.type !== 'table') {
    return (
      <div className="main-area">
        <p>Select a table from the sidebar.</p>
      </div>
    );
  }

  const table = project.tables.find((t) => t.id === selection.tableId);
  if (!table) {
    return (
      <div className="main-area">
        <p>Table not found.</p>
      </div>
    );
  }

  const schema = getSchema(table.format, table.data);
  const validation = validateTableData(table.format, table.data);
  const tableId = table.id;
  const tableFormat = table.format;
  const tableName = table.name;
  const tableData = table.data;

  function handleDataChange(newData: typeof tableData) {
    updateTableData(tableId, newData);
  }

  function handleAddRow() {
    if (tableFormat === 'column' && 'rows' in tableData) {
      const cols = tableData.columnLabels.length;
      updateTableData(tableId, {
        ...tableData,
        rows: [...tableData.rows, Array(cols).fill(null)],
      });
    }
    if (tableFormat === 'xy' && 'x' in tableData) {
      updateTableData(tableId, {
        ...tableData,
        x: [...tableData.x, null],
        ys: tableData.ys.map((col) => [...col, null]),
      });
    }
  }

  function handleAddColumn() {
    if (tableFormat === 'column' && 'columnLabels' in tableData) {
      const d = tableData as ColumnTableData;
      const { columnLabels, rows, groupLabels, groupForColumn } = d;
      const nCols = columnLabels.length;
      const lastLetter = (s: string) => {
        const m = s.match(/([A-Za-z])$/);
        if (m) {
          const c = m[1].charCodeAt(0);
          if (c >= 65 && c <= 90) return String.fromCharCode(c < 90 ? c + 1 : 65);
          if (c >= 97 && c <= 122) return String.fromCharCode(c < 122 ? c + 1 : 97);
        }
        return null;
      };
      if (groupLabels?.length && groupForColumn?.length === nCols) {
        const g = groupLabels.length - 1;
        const groupName = groupLabels[g] ?? 'Group';
        const replicateNum =
          groupForColumn.filter((c) => c === g).length + 1;
        const newLabel = `${groupName}_${replicateNum}`;
        updateTableData(tableId, {
          ...d,
          columnLabels: [...columnLabels, newLabel],
          groupForColumn: [...groupForColumn, g],
          rows: rows.map((r) => [...r, null]),
        });
      } else {
        const nextLabel =
          lastLetter(columnLabels[nCols - 1] ?? '') ?? `Col ${nCols + 1}`;
        updateTableData(tableId, {
          ...d,
          columnLabels: [...columnLabels, nextLabel],
          rows: rows.map((r) => [...r, null]),
        });
      }
    }
    if (tableFormat === 'xy' && 'x' in tableData) {
      const d = tableData as XYTableData;
      const n = d.x.length;
      const nextY = `Y${d.yLabels.length + 1}`;
      updateTableData(tableId, {
        ...d,
        yLabels: [...d.yLabels, nextY],
        ys: [...d.ys, Array(n).fill(null)],
      });
    }
  }

  const formatForGrid = tableFormat === 'xy' || tableFormat === 'column' ? tableFormat : 'column';
  const allowedAnalyses = getAllowedAnalyses(tableFormat);
  const allowedGraphTypes = getAllowedGraphTypes(tableFormat);

  function handleAddAnalysis(analysisType: AnalysisTypeId) {
    const options = getDefaultOptions(tableFormat, analysisType, tableData);
    addAnalysis({
      tableId,
      type: analysisType,
      options,
    });
    setAddAnalysisOpen(false);
  }

  const tableAnalyses = project.analyses.filter((a) => a.tableId === tableId);
  function handleAddGraph(graphType: GraphTypeId) {
    const analysisId = tableAnalyses.length > 0 ? tableAnalyses[0].id : undefined;
    addGraph({
      name: `${graphType} ${project.graphs.length + 1}`,
      tableId,
      analysisId: analysisId ?? null,
      graphType,
      options: {},
    });
    setAddGraphOpen(false);
  }

  return (
    <div className="main-area" role="region" aria-label="Table view">
      <h2 style={{ marginTop: 0 }}>{tableName}</h2>
      <div className="toolbar">
        <div className="view-mode-toggle" role="group" aria-label="Table view format">
          <button
            type="button"
            className={viewMode === 'wide' ? 'active' : ''}
            onClick={() => setViewMode('wide')}
            aria-pressed={viewMode === 'wide'}
          >
            Wide
          </button>
          <button
            type="button"
            className={viewMode === 'tidy' ? 'active' : ''}
            onClick={() => setViewMode('tidy')}
            aria-pressed={viewMode === 'tidy'}
          >
            Tidy
          </button>
        </div>
        <button type="button" onClick={handleAddRow} aria-label="Add row">
          Add row
        </button>
        <button type="button" onClick={handleAddColumn} aria-label="Add column">
          Add column
        </button>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setAddAnalysisOpen((o) => !o)}
            aria-label="Add analysis"
            aria-expanded={addAnalysisOpen}
            aria-haspopup="listbox"
          >
            Add analysis
          </button>
          {addAnalysisOpen && (
            <ul role="listbox" className="dropdown-menu">
              {allowedAnalyses.map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    role="option"
                    className="dropdown-item"
                    onClick={() => handleAddAnalysis(type)}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setAddGraphOpen((o) => !o)}
            aria-label="Add graph"
            aria-expanded={addGraphOpen}
            aria-haspopup="listbox"
          >
            Add graph
          </button>
          {addGraphOpen && (
            <ul role="listbox" className="dropdown-menu">
              {allowedGraphTypes.map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    role="option"
                    className="dropdown-item"
                    onClick={() => handleAddGraph(type)}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {viewMode === 'wide' ? (
        <DataGrid
          schema={schema}
          format={formatForGrid}
          data={tableData}
          onDataChange={handleDataChange}
          aria-label={`Data for ${tableName}`}
        />
      ) : (
        <TidyTable
          format={formatForGrid}
          data={tableData}
          aria-label={`Tidy view of ${tableName}`}
        />
      )}
      {!validation.valid && validation.errors && validation.errors.length > 0 && (
        <div className="validation-errors" role="alert" aria-live="polite">
          {validation.errors.join(' ')}
        </div>
      )}
    </div>
  );
}
