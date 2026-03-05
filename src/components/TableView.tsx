import { useState } from 'react';
import { useStore } from '../store';
import { getSchema, validateTableData, getAllowedAnalyses, getAllowedGraphTypes, getDefaultOptions } from '../lib/tableRegistry';
import { DataGrid } from './DataGrid';
import type { AnalysisTypeId, GraphTypeId } from '../types';

export function TableView() {
  const project = useStore((s) => s.project);
  const updateTableData = useStore((s) => s.updateTableData);
  const addAnalysis = useStore((s) => s.addAnalysis);
  const addGraph = useStore((s) => s.addGraph);
  const [addAnalysisOpen, setAddAnalysisOpen] = useState(false);
  const [addGraphOpen, setAddGraphOpen] = useState(false);

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
        <button type="button" onClick={handleAddRow} aria-label="Add row">
          Add row
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
      <DataGrid
        schema={schema}
        format={formatForGrid}
        data={tableData}
        onDataChange={handleDataChange}
        aria-label={`Data for ${tableName}`}
      />
      {!validation.valid && validation.errors && validation.errors.length > 0 && (
        <div className="validation-errors" role="alert" aria-live="polite">
          {validation.errors.join(' ')}
        </div>
      )}
    </div>
  );
}
