import { useRef, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js';
import { useStore } from '../store';
import { buildPlotlySpec } from '../charts/adapter';
import type { PlotlyTrace, PlotlyPieTrace } from '../charts/adapter';

/** @spec PRISM-WKF-006 */
export function LayoutView() {
  const project = useStore((s) => s.project);
  const setSelection = useStore((s) => s.setSelection);
  const updateLayout = useStore((s) => s.updateLayout);
  const selection = project.selection;
  const [plotDivs, setPlotDivs] = useState<Record<string, HTMLDivElement | null>>({});
  const [addGraphOpen, setAddGraphOpen] = useState(false);
  const layoutContainerRef = useRef<HTMLDivElement>(null);

  if (selection?.type !== 'layout') {
    return (
      <div className="main-area">
        <p>Select a layout from the sidebar.</p>
      </div>
    );
  }

  const layout = project.layouts.find((l) => l.id === selection.layoutId);
  if (!layout) {
    return (
      <div className="main-area">
        <p>Layout not found.</p>
      </div>
    );
  }
  const layoutDef = layout;

  const registerPlotDiv = useCallback((graphId: string, div: HTMLDivElement | null) => {
    setPlotDivs((prev) => (prev[graphId] === div ? prev : { ...prev, [graphId]: div }));
  }, []);

  const graphsNotInLayout = project.graphs.filter(
    (g) => !layoutDef.items.some((it) => it.graphId === g.id)
  );

  function handleAddGraphToLayout(graphId: string) {
    const g = project.graphs.find((x) => x.id === graphId);
    if (!g) return;
    const newItems = [
      ...layoutDef.items,
      {
        graphId: g.id,
        x: layoutDef.items.length % 2 === 0 ? 0 : 0.5,
        y: Math.floor(layoutDef.items.length / 2) * 0.5,
        width: 0.5,
        height: 0.5,
      },
    ];
    updateLayout(layoutDef.id, { items: newItems });
    setAddGraphOpen(false);
  }

  function handleRemoveFromLayout(graphId: string) {
    updateLayout(layoutDef.id, {
      items: layoutDef.items.filter((it) => it.graphId !== graphId),
    });
  }

  function handleFocusGraph(graphId: string) {
    setSelection({ type: 'graph', graphId });
  }

  async function handleExportPng() {
    const W = 800;
    const H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    for (const item of layoutDef.items) {
      const div = plotDivs[item.graphId];
      if (!div) continue;
      try {
        const url = await Plotly.toImage(div, {
          format: 'png',
          width: Math.max(1, Math.round(item.width * W)),
          height: Math.max(1, Math.round(item.height * H)),
        });
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(
              img,
              item.x * W,
              item.y * H,
              item.width * W,
              item.height * H
            );
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
      } catch {
        // skip failed panel
      }
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${layoutDef.name}.png`;
    a.click();
  }

  return (
    <div className="main-area" role="region" aria-label="Layout view">
      <h2 style={{ marginTop: 0 }}>{layoutDef.name}</h2>
      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setAddGraphOpen((o) => !o)}
            aria-expanded={addGraphOpen}
            aria-haspopup="listbox"
          >
            Add graph to layout
          </button>
          {addGraphOpen && (
            <ul role="listbox" className="dropdown-menu">
              {graphsNotInLayout.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    role="option"
                    className="dropdown-item"
                    onClick={() => handleAddGraphToLayout(g.id)}
                  >
                    {g.name}
                  </button>
                </li>
              ))}
              {graphsNotInLayout.length === 0 && (
                <li>
                  <span className="dropdown-item" style={{ cursor: 'default' }}>
                    No graphs to add (or all already in layout)
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
        <button type="button" onClick={handleExportPng} aria-label="Export layout as PNG">
          Export layout PNG
        </button>
      </div>
      <div
        ref={layoutContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 480,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 4,
        }}
      >
        {layoutDef.items.map((item) => {
          const graph = project.graphs.find((g) => g.id === item.graphId);
          if (!graph) return null;
          const table = project.tables.find((t) => t.id === graph.tableId);
          const analysis = graph.analysisId
            ? project.analyses.find((a) => a.id === graph.analysisId)
            : undefined;
          const spec = table
            ? buildPlotlySpec(
                graph.graphType,
                table.data,
                analysis?.result,
                graph.options
              )
            : { traces: [] as (PlotlyTrace | PlotlyPieTrace)[] };
          const barLayout = spec.layout;
          const isBarChart =
            graph.graphType === 'bar' || graph.graphType === 'groupedBar';
          const plotLayout: Record<string, unknown> = {
            title: graph.options.title ?? graph.name,
            xaxis: barLayout?.xaxis
              ? { ...barLayout.xaxis, title: graph.options.xAxisLabel }
              : {
                  title: graph.options.xAxisLabel,
                  type: isBarChart ? 'category' : (graph.options.xAxisScale ?? 'linear'),
                },
            yaxis: {
              title: graph.options.yAxisLabel,
              type: graph.options.yAxisScale ?? 'linear',
            },
            showlegend: graph.options.showLegend ?? true,
            margin: { t: 40, r: 30, b: 40, l: 50 },
            hovermode: 'closest',
          };
          return (
            <div
              key={item.graphId}
              style={{
                position: 'absolute',
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${item.width * 100}%`,
                height: `${item.height * 100}%`,
                boxSizing: 'border-box',
                padding: 4,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  background: '#fff',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                }}
                onDoubleClick={() => handleFocusGraph(item.graphId)}
                role="button"
                tabIndex={0}
                aria-label={`Graph ${graph.name}; double-click to focus`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFocusGraph(item.graphId);
                  }
                }}
              >
                <Plot
                  data={spec.traces}
                  layout={plotLayout}
                  config={{ displayModeBar: false, responsive: true }}
                  onInitialized={(_fig, graphDiv) => {
                    registerPlotDiv(item.graphId, graphDiv);
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    zIndex: 10,
                    fontSize: '1rem',
                  }}
                  onClick={() => handleRemoveFromLayout(item.graphId)}
                  aria-label={`Remove ${graph.name} from layout`}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
