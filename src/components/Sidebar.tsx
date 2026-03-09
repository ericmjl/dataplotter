import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { NewTableDialog } from './NewTableDialog';
import { getSampleEntries } from '../data/sampleDataIndex';

const FORMAT_LABELS: Record<string, string> = {
  column: 'Column',
  xy: 'XY',
  grouped: 'Grouped',
  contingency: 'Contingency',
  survival: 'Survival',
  partsOfWhole: 'Parts of whole',
};

export function Sidebar() {
  const project = useStore((s) => s.project);
  const setSelection = useStore((s) => s.setSelection);
  const addTable = useStore((s) => s.addTable);
  const removeTable = useStore((s) => s.removeTable);
  const renameTable = useStore((s) => s.renameTable);
  const removeAnalysis = useStore((s) => s.removeAnalysis);
  const removeGraph = useStore((s) => s.removeGraph);
  const addLayout = useStore((s) => s.addLayout);
  const removeLayout = useStore((s) => s.removeLayout);
  const selection = project.selection;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);
  const sampleMenuRef = useRef<HTMLDivElement>(null);
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const { tables, analyses, graphs, layouts } = project;

  useEffect(() => {
    if (!sampleMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (sampleMenuRef.current && !sampleMenuRef.current.contains(event.target as Node)) {
        setSampleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sampleMenuOpen]);

  function toggleTable(tableId: string) {
    setCollapsedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  function handleAddTableFromSample(
    name: string,
    format: Parameters<typeof addTable>[0]['format'],
    data: Parameters<typeof addTable>[0]['data']
  ) {
    addTable({ name, format, data });
    setSampleMenuOpen(false);
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
          <div ref={sampleMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSampleMenuOpen((o) => !o)}
              aria-label="Add table from sample data"
              aria-expanded={sampleMenuOpen}
              aria-haspopup="true"
            >
              Sample
            </button>
            {sampleMenuOpen && (
              <div
                className="sidebar-sample-menu"
                role="menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  minWidth: 160,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  padding: 4,
                }}
              >
                {getSampleEntries().map((entry) => (
                  <button
                    key={entry.format}
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      handleAddTableFromSample(entry.name, entry.format, entry.data)
                    }
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 10px',
                      textAlign: 'left',
                      border: 'none',
                      borderRadius: 2,
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {FORMAT_LABELS[entry.format] ?? entry.format}
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  {editingTableId === t.id ? (
                    <input
                      type="text"
                      className="sidebar-item sidebar-rename-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => {
                        const trimmed = editingName.trim();
                        if (trimmed) renameTable(t.id, trimmed);
                        setEditingTableId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = editingName.trim();
                          if (trimmed) renameTable(t.id, trimmed);
                          setEditingTableId(null);
                        }
                        if (e.key === 'Escape') {
                          setEditingTableId(null);
                          setEditingName('');
                        }
                      }}
                      aria-label="Table name"
                      autoFocus
                    />
                  ) : (
                    <>
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
                        className="sidebar-item-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTableId(t.id);
                          setEditingName(t.name);
                        }}
                        aria-label={`Rename table ${t.name}`}
                        title="Rename table"
                      >
                        ✎
                      </button>
                    </>
                  )}
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

      <div className="sidebar-content">
        <span className="sidebar-section" aria-hidden="true">Layouts</span>
        <div className="sidebar-actions" style={{ marginBottom: '0.5rem' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => addLayout({ name: 'Layout 1', items: [] })}
            aria-label="Add layout"
          >
            + Layout
          </button>
        </div>
        {layouts.length === 0 ? (
          <p className="sidebar-empty">No layouts</p>
        ) : (
          layouts.map((lay) => (
            <div key={lay.id} className="sidebar-item-row">
              <button
                type="button"
                className={`sidebar-item ${selection?.type === 'layout' && selection.layoutId === lay.id ? 'selected' : ''}`}
                onClick={() => setSelection({ type: 'layout', layoutId: lay.id })}
                aria-label={`Select layout ${lay.name}`}
                aria-pressed={selection?.type === 'layout' && selection.layoutId === lay.id}
              >
                <span className="sidebar-item-icon graph">L</span>
                {lay.name}
              </button>
              <button
                type="button"
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLayout(lay.id);
                }}
                aria-label={`Delete layout ${lay.name}`}
                title="Delete layout"
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
