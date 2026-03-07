import { useState } from 'react';
import { useStore } from '../store';
import { getSchema, validateTableData, getAllowedAnalyses, getAllowedGraphTypes, getDefaultOptions } from '../lib/tableRegistry';
import type { TableSchema } from '../lib/tableRegistry';
import { getEffectiveTableData } from '../lib/effectiveTableData';
import { DataGrid } from './DataGrid';
import { GroupedDataGrid } from './GroupedDataGrid';
import { ContingencyDataGrid } from './ContingencyDataGrid';
import { SurvivalDataGrid } from './SurvivalDataGrid';
import { PartsOfWholeDataGrid } from './PartsOfWholeDataGrid';
import type { AnalysisTypeId, GraphTypeId, ColumnTableData, XYTableData, GroupedTableData, ContingencyTableData, SurvivalTableData, PartsOfWholeTableData, MultipleVariablesTableData, NestedTableData } from '../types';
import type { ColumnTransformation, TransformId } from '../types/transformations';
import { PREDEFINED_TRANSFORMS } from '../lib/transformRegistry';

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

function TransformColumnDialog({
  schema,
  existing,
  onSave,
  onClose,
}: {
  schema: TableSchema;
  existing: ColumnTransformation[];
  onSave: (list: ColumnTransformation[]) => void;
  onClose: () => void;
}) {
  const firstColId = schema.columns[0]?.id ?? '';
  const existingForCol = (key: string) => existing.find((t) => t.columnKey === key)?.transformId;
  const [columnKey, setColumnKey] = useState(firstColId);
  const [transformId, setTransformId] = useState<TransformId | ''>(() => existingForCol(firstColId) ?? '');
  const hasExisting = existing.some((t) => t.columnKey === columnKey);

  const handleColumnChange = (key: string) => {
    setColumnKey(key);
    setTransformId(existingForCol(key) ?? '');
  };

  const handleSave = () => {
    const rest = existing.filter((t) => t.columnKey !== columnKey);
    if (transformId) {
      onSave([...rest, { columnKey, transformId: transformId as TransformId }]);
    } else {
      onSave(rest);
    }
  };

  const handleRemove = () => {
    onSave(existing.filter((t) => t.columnKey !== columnKey));
  };

  return (
    <div className="transform-dialog" role="dialog" aria-label="Transform column">
      <p className="transform-dialog-title">Apply a transformation to a column</p>
      <div className="transform-dialog-field">
        <label htmlFor="transform-column-select">Column</label>
        <select
          id="transform-column-select"
          value={columnKey}
          onChange={(e) => handleColumnChange(e.target.value)}
          aria-label="Column to transform"
        >
          {schema.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="transform-dialog-field">
        <label htmlFor="transform-type-select">Transformation</label>
        <select
          id="transform-type-select"
          value={transformId}
          onChange={(e) => setTransformId(e.target.value as TransformId | '')}
          aria-label="Transformation type"
        >
          <option value="">None</option>
          {PREDEFINED_TRANSFORMS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar transform-dialog-actions">
        <button type="button" className="btn-primary" onClick={handleSave}>
          {hasExisting ? 'Update' : 'Apply'}
        </button>
        {hasExisting && (
          <button type="button" className="btn-ghost" onClick={handleRemove} aria-label="Remove transformation">
            Remove
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TableView() {
  const project = useStore((s) => s.project);
  const updateTableData = useStore((s) => s.updateTableData);
  const removeTableColumn = useStore((s) => s.removeTableColumn);
  const setTableViewMode = useStore((s) => s.setTableViewMode);
  const setTableTransformations = useStore((s) => s.setTableTransformations);
  const renameTable = useStore((s) => s.renameTable);
  const addAnalysis = useStore((s) => s.addAnalysis);
  const addGraph = useStore((s) => s.addGraph);
  const copyAnalysesAndGraphsFromTable = useStore((s) => s.copyAnalysesAndGraphsFromTable);
  const [addAnalysisOpen, setAddAnalysisOpen] = useState(false);
  const [addGraphOpen, setAddGraphOpen] = useState(false);
  const [copySetupOpen, setCopySetupOpen] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [deleteColumnOpen, setDeleteColumnOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wide');
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

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
  const dataForGrid = getEffectiveTableData(table, table.viewMode ?? 'raw');
  const hasTransformations = (table.format === 'column' || table.format === 'xy') && (table.transformations?.length ?? 0) > 0;
  const gridReadOnly = table.viewMode === 'transformed';

  function handleDataChange(newData: typeof tableData) {
    if (gridReadOnly) return;
    if (tableFormat === 'multipleVariables' && 'variableLabels' in tableData) {
      const d = newData as ColumnTableData;
      updateTableData(tableId, { variableLabels: d.columnLabels, rows: d.rows });
      return;
    }
    if (tableFormat === 'nested' && 'columnLabels' in tableData && !('variableLabels' in tableData)) {
      const d = newData as ColumnTableData;
      const prev = tableData as NestedTableData;
      updateTableData(tableId, { ...prev, columnLabels: d.columnLabels, rows: d.rows });
      return;
    }
    updateTableData(tableId, newData);
  }

  function handleAddRow() {
    if (gridReadOnly) return;
    if (tableFormat === 'column' && 'rows' in tableData && 'columnLabels' in tableData) {
      const cols = tableData.columnLabels.length;
      updateTableData(tableId, {
        ...tableData,
        rows: [...tableData.rows, Array(cols).fill(null)],
      });
    }
    if (tableFormat === 'multipleVariables' && 'variableLabels' in tableData) {
      const d = tableData as MultipleVariablesTableData;
      const cols = d.variableLabels.length;
      updateTableData(tableId, {
        variableLabels: d.variableLabels,
        rows: [...d.rows, Array(cols).fill(null)],
      });
    }
    if (tableFormat === 'nested' && 'columnLabels' in tableData && !('variableLabels' in tableData)) {
      const d = tableData as NestedTableData;
      const cols = d.columnLabels.length;
      updateTableData(tableId, {
        ...d,
        rows: [...d.rows, Array(cols).fill(null)],
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
    if (gridReadOnly) return;
    if (tableFormat === 'column' && 'columnLabels' in tableData) {
      const d = tableData as ColumnTableData;
      const { columnLabels, rows, groupLabels, groupForColumn } = d;
      const nCols = columnLabels.length;
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
        updateTableData(tableId, {
          ...d,
          columnLabels: [...columnLabels, 'New column'],
          rows: rows.map((r) => [...r, null]),
        });
      }
    }
    if (tableFormat === 'multipleVariables' && 'variableLabels' in tableData) {
      const d = tableData as MultipleVariablesTableData;
      updateTableData(tableId, {
        variableLabels: [...d.variableLabels, `Var${d.variableLabels.length + 1}`],
        rows: d.rows.map((r) => [...r, null]),
      });
    }
    if (tableFormat === 'nested' && 'columnLabels' in tableData && !('variableLabels' in tableData)) {
      const d = tableData as NestedTableData;
      updateTableData(tableId, {
        ...d,
        columnLabels: [...d.columnLabels, `S${d.columnLabels.length + 1}`],
        rows: d.rows.map((r) => [...r, null]),
        groupForColumn: d.groupForColumn ? [...d.groupForColumn, 0] : undefined,
      });
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

  const formatForGrid = tableFormat === 'xy' ? 'xy' : 'column';
  const isGrouped = tableFormat === 'grouped' && 'cellValues' in tableData;
  const isContingency = tableFormat === 'contingency' && 'counts' in tableData;
  const isSurvival = tableFormat === 'survival' && 'times' in tableData;
  const isPartsOfWhole = tableFormat === 'partsOfWhole' && 'values' in tableData;
  const isMultipleVariables = tableFormat === 'multipleVariables' && 'variableLabels' in tableData;
  const isNested = tableFormat === 'nested' && 'columnLabels' in tableData && !('variableLabels' in tableData);
  const allowedAnalyses = getAllowedAnalyses(tableFormat);
  const allowedGraphTypes = getAllowedGraphTypes(tableFormat);

  const gridDataForDisplay: ColumnTableData | XYTableData =
    isMultipleVariables
      ? {
          columnLabels: (tableData as MultipleVariablesTableData).variableLabels,
          rows: (tableData as MultipleVariablesTableData).rows,
        }
      : isNested
        ? (tableData as NestedTableData)
        : (dataForGrid as ColumnTableData | XYTableData);

  const deletableColumns =
    tableFormat === 'column' && 'columnLabels' in tableData
      ? (tableData as ColumnTableData).columnLabels.length > 1
        ? schema.columns
        : []
      : tableFormat === 'xy' && 'yLabels' in tableData
        ? (tableData as XYTableData).yLabels.length > 1
          ? schema.columns.filter((c) => c.id.startsWith('y-'))
          : []
        : tableFormat === 'multipleVariables' && 'variableLabels' in tableData
          ? (tableData as MultipleVariablesTableData).variableLabels.length > 1
            ? schema.columns
            : []
          : tableFormat === 'nested' && 'columnLabels' in tableData
            ? (tableData as NestedTableData).columnLabels.length > 1
              ? schema.columns
              : []
            : [];

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

  function commitRename() {
    const trimmed = draftTitle.trim();
    if (trimmed) renameTable(tableId, trimmed);
    setEditingTitle(false);
  }

  return (
    <div className="main-area" role="region" aria-label="Table view">
      <div className="table-view-title-row">
        {editingTitle ? (
          <input
            type="text"
            className="table-view-title-input"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftTitle(tableName);
                setEditingTitle(false);
              }
            }}
            aria-label="Table name"
            autoFocus
          />
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>{tableName}</h2>
            <button
              type="button"
              className="btn-ghost table-view-rename-btn"
              onClick={() => {
                setDraftTitle(tableName);
                setEditingTitle(true);
              }}
              aria-label={`Rename table ${tableName}`}
              title="Rename table"
            >
              ✎
            </button>
          </>
        )}
      </div>
      <div className="toolbar">
        {(tableFormat === 'column' || tableFormat === 'xy') && (
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
        )}
        {hasTransformations && (
          <div className="view-mode-toggle" role="group" aria-label="Show raw or transformed data">
            <button
              type="button"
              className={table.viewMode !== 'transformed' ? 'active' : ''}
              onClick={() => setTableViewMode(tableId, 'raw')}
              aria-pressed={table.viewMode !== 'transformed'}
            >
              Raw
            </button>
            <button
              type="button"
              className={table.viewMode === 'transformed' ? 'active' : ''}
              onClick={() => setTableViewMode(tableId, 'transformed')}
              aria-pressed={table.viewMode === 'transformed'}
            >
              Transformed
            </button>
          </div>
        )}
        {(tableFormat === 'column' || tableFormat === 'xy' || tableFormat === 'multipleVariables' || tableFormat === 'nested') && !gridReadOnly && (
          <>
            <button type="button" onClick={handleAddRow} aria-label="Add row">
              Add row
            </button>
            <button type="button" onClick={handleAddColumn} aria-label="Add column">
              Add column
            </button>
            {deletableColumns.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDeleteColumnOpen((o) => !o)}
                  aria-label="Delete column"
                  aria-expanded={deleteColumnOpen}
                  aria-haspopup="listbox"
                >
                  Delete column…
                </button>
                {deleteColumnOpen && (
                  <ul role="listbox" className="dropdown-menu">
                    {deletableColumns.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          role="option"
                          className="dropdown-item"
                          onClick={() => {
                            removeTableColumn(tableId, c.id);
                            setDeleteColumnOpen(false);
                          }}
                        >
                          {c.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
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
        {(tableFormat === 'column' || tableFormat === 'xy') && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setTransformDialogOpen((o) => !o)}
              aria-label="Add or edit column transformation"
              aria-expanded={transformDialogOpen}
              aria-haspopup="dialog"
              title="Define equation for a column (e.g. log10(y0))"
            >
              Transform column…
            </button>
            {transformDialogOpen && (
              <TransformColumnDialog
                schema={schema}
                existing={table.transformations ?? []}
                onSave={(list) => {
                  setTableTransformations(tableId, list);
                  setTransformDialogOpen(false);
                }}
                onClose={() => setTransformDialogOpen(false)}
              />
            )}
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => { setCopySetupOpen((o) => !o); setAddAnalysisOpen(false); setAddGraphOpen(false); }}
            aria-label="Copy setup from another table"
            aria-expanded={copySetupOpen}
            aria-haspopup="listbox"
            title="Copy analyses and graphs from another table (no data)"
          >
            Copy setup from…
          </button>
          {copySetupOpen && table && (
            <ul role="listbox" className="dropdown-menu">
              {project.tables.filter((t) => t.id !== table.id).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    role="option"
                    className="dropdown-item"
                    onClick={() => {
                      copyAnalysesAndGraphsFromTable(t.id, table.id);
                      setCopySetupOpen(false);
                    }}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
              {project.tables.filter((t) => t.id !== table.id).length === 0 && (
                <li><span className="dropdown-item" style={{ cursor: 'default' }}>No other tables</span></li>
              )}
            </ul>
          )}
        </div>
      </div>
      {isGrouped ? (
        <GroupedDataGrid
          data={tableData as GroupedTableData}
          onDataChange={(d) => handleDataChange(d)}
          aria-label={`Data for ${tableName}`}
        />
      ) : isContingency ? (
        <ContingencyDataGrid
          data={tableData as ContingencyTableData}
          onDataChange={(d) => handleDataChange(d)}
          aria-label={`Data for ${tableName}`}
        />
      ) : isSurvival ? (
        <SurvivalDataGrid
          data={tableData as SurvivalTableData}
          onDataChange={(d) => handleDataChange(d)}
          aria-label={`Data for ${tableName}`}
        />
      ) : isPartsOfWhole ? (
        <PartsOfWholeDataGrid
          data={tableData as PartsOfWholeTableData}
          onDataChange={(d) => handleDataChange(d)}
          aria-label={`Data for ${tableName}`}
        />
      ) : isMultipleVariables || isNested ? (
        <DataGrid
          schema={schema}
          format="column"
          data={gridDataForDisplay}
          onDataChange={(d) => handleDataChange(d)}
          readOnly={gridReadOnly}
          aria-label={`Data for ${tableName}`}
        />
      ) : viewMode === 'wide' ? (
        <DataGrid
          schema={schema}
          format={formatForGrid}
          data={dataForGrid as ColumnTableData | XYTableData}
          onDataChange={(d) => handleDataChange(d)}
          readOnly={gridReadOnly}
          aria-label={`Data for ${tableName}`}
        />
      ) : (
        <TidyTable
          format={formatForGrid}
          data={dataForGrid as ColumnTableData | XYTableData}
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
