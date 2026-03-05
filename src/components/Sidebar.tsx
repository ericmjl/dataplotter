import { useState } from 'react';
import { useStore } from '../store';
import { NewTableDialog } from './NewTableDialog';
import { sampleColumnData, sampleColumnName } from '../data/sampleColumn';
import { sampleXYData, sampleXYName } from '../data/sampleXY';

export function Sidebar() {
  const project = useStore((s) => s.project);
  const setSelection = useStore((s) => s.setSelection);
  const addTable = useStore((s) => s.addTable);
  const removeTable = useStore((s) => s.removeTable);
  const removeAnalysis = useStore((s) => s.removeAnalysis);
  const removeGraph = useStore((s) => s.removeGraph);
  const selection = project.selection;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());

  const { tables, analyses, graphs } = project;

  function toggleTable(tableId: string) {
    setCollapsedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

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
        {tables.length === 0 ? (
          <p className="sidebar-empty">No tables yet</p>
        ) : (
          tables.map((t) => {
            const tableAnalyses = analyses.filter((a) => a.tableId === t.id);
            const tableGraphs = graphs.filter((g) => g.tableId === t.id);
            const isCollapsed = collapsedTables.has(t.id);
            const hasChildren = tableAnalyses.length > 0 || tableGraphs.length > 0;

            return (
              <div key={t.id} className="sidebar-table-block">
                <div className="sidebar-item-row">
                  {hasChildren ? (
                    <button
                      type="button"
                      className={`sidebar-item-expand ${isCollapsed ? 'collapsed' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTable(t.id);
                      }}
                      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                      aria-expanded={!isCollapsed}
                    >
                      ▼
                    </button>
                  ) : (
                    <span style={{ width: 18, flexShrink: 0 }} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className={`sidebar-item ${selection?.type === 'table' && selection.tableId === t.id ? 'selected' : ''}`}
                    onClick={() => setSelection({ type: 'table', tableId: t.id })}
                    aria-label={`Select table ${t.name}`}
                    aria-pressed={selection?.type === 'table' && selection.tableId === t.id}
                  >
                    <span className="sidebar-item-icon table">T</span>
                    {t.name}
                  </button>
                  <button
                    type="button"
                    className="sidebar-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTable(t.id);
                    }}
                    aria-label={`Delete table ${t.name}`}
                    title="Delete table"
                  >
                    ×
                  </button>
                </div>
                {hasChildren && !isCollapsed && (
                  <div className="sidebar-nested">
                    {tableAnalyses.length > 0 && (
                      <>
                        <div className="sidebar-subsection">Analyses</div>
                        {tableAnalyses.map((a) => (
                          <div key={a.id} className="sidebar-item-row nested">
                            <button
                              type="button"
                              className={`sidebar-item ${selection?.type === 'analysis' && selection.analysisId === a.id ? 'selected' : ''}`}
                              onClick={() => setSelection({ type: 'analysis', analysisId: a.id })}
                              aria-label={`Select analysis ${a.type}`}
                              aria-pressed={selection?.type === 'analysis' && selection.analysisId === a.id}
                            >
                              <span className="sidebar-item-icon analysis">A</span>
                              {a.type.replace(/_/g, ' ')}
                            </button>
                            <button
                              type="button"
                              className="sidebar-item-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAnalysis(a.id);
                              }}
                              aria-label={`Delete analysis ${a.type}`}
                              title="Delete analysis"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                    {tableGraphs.length > 0 && (
                      <>
                        <div className="sidebar-subsection">Graphs</div>
                        {tableGraphs.map((g) => {
                          const linkedAnalysis = g.analysisId
                            ? analyses.find((a) => a.id === g.analysisId)
                            : null;
                          return (
                            <div key={g.id} className="sidebar-item-row nested">
                              <button
                                type="button"
                                className={`sidebar-item ${selection?.type === 'graph' && selection.graphId === g.id ? 'selected' : ''}`}
                                onClick={() => setSelection({ type: 'graph', graphId: g.id })}
                                aria-label={`Select graph ${g.name}`}
                                aria-pressed={selection?.type === 'graph' && selection.graphId === g.id}
                              >
                                <span className="sidebar-item-icon graph">G</span>
                                {g.name}
                                {linkedAnalysis && (
                                  <span className="sidebar-item-sublabel" title="Linked analysis">
                                    ({linkedAnalysis.type.replace(/_/g, ' ')})
                                  </span>
                                )}
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
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <NewTableDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </aside>
  );
}
