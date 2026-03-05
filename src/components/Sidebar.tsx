import { useState } from 'react';
import { useStore } from '../store';
import { NewTableDialog } from './NewTableDialog';
import { sampleColumnData, sampleColumnName } from '../data/sampleColumn';
import { sampleXYData, sampleXYName } from '../data/sampleXY';

export function Sidebar() {
  const project = useStore((s) => s.project);
  const setSelection = useStore((s) => s.setSelection);
  const addTable = useStore((s) => s.addTable);
  const removeGraph = useStore((s) => s.removeGraph);
  const selection = project.selection;
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleNewFromSampleColumn() {
    addTable({
      name: sampleColumnName,
      format: 'column',
      data: sampleColumnData,
    });
  }

  function handleNewFromSampleXY() {
    addTable({
      name: sampleXYName,
      format: 'xy',
      data: sampleXYData,
    });
  }

  return (
    <aside className="sidebar" aria-label="Project navigation">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">D</span>
          dataplotter
        </div>
        <div className="sidebar-actions">
          <button type="button" className="btn-primary" onClick={() => setDialogOpen(true)} aria-label="Add table">
            + Table
          </button>
          <button type="button" onClick={handleNewFromSampleColumn} aria-label="New from sample column data">
            Sample Col
          </button>
          <button type="button" onClick={handleNewFromSampleXY} aria-label="New from sample XY data">
            Sample XY
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <span className="sidebar-section" aria-hidden="true">Tables</span>
        {project.tables.length === 0 ? (
          <p className="sidebar-empty">No tables yet</p>
        ) : (
          project.tables.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sidebar-item ${selection?.type === 'table' && selection.tableId === t.id ? 'selected' : ''}`}
              onClick={() => setSelection({ type: 'table', tableId: t.id })}
              aria-label={`Select table ${t.name}`}
              aria-pressed={selection?.type === 'table' && selection.tableId === t.id}
            >
              <span className="sidebar-item-icon table">T</span>
              {t.name}
            </button>
          ))
        )}

        <span className="sidebar-section" aria-hidden="true">Analyses</span>
        {project.analyses.length === 0 ? (
          <p className="sidebar-empty">None</p>
        ) : (
          project.analyses.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`sidebar-item ${selection?.type === 'analysis' && selection.analysisId === a.id ? 'selected' : ''}`}
              onClick={() => setSelection({ type: 'analysis', analysisId: a.id })}
              aria-label={`Select analysis ${a.type}`}
              aria-pressed={selection?.type === 'analysis' && selection.analysisId === a.id}
            >
              <span className="sidebar-item-icon analysis">A</span>
              {a.type.replace(/_/g, ' ')}
            </button>
          ))
        )}

        <span className="sidebar-section" aria-hidden="true">Graphs</span>
        {project.graphs.length === 0 ? (
          <p className="sidebar-empty">None</p>
        ) : (
          project.graphs.map((g) => (
            <div key={g.id} className="sidebar-item-row">
              <button
                type="button"
                className={`sidebar-item ${selection?.type === 'graph' && selection.graphId === g.id ? 'selected' : ''}`}
                onClick={() => setSelection({ type: 'graph', graphId: g.id })}
                aria-label={`Select graph ${g.name}`}
                aria-pressed={selection?.type === 'graph' && selection.graphId === g.id}
              >
                <span className="sidebar-item-icon graph">G</span>
                {g.name}
              </button>
              <button
                type="button"
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeGraph(g.id);
                }}
                aria-label={`Delete graph ${g.name}`}
                title="Delete graph"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <NewTableDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </aside>
  );
}
