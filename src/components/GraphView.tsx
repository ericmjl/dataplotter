import { useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js';
import { useStore } from '../store';
import { buildPlotlySpec } from '../charts/adapter';

type SelectedPoint = { label: string; value: number } | null;

export function GraphView() {
  const project = useStore((s) => s.project);
  const [plotDiv, setPlotDiv] = useState<HTMLDivElement | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);

  const onInitialized = useCallback((_fig: unknown, graphDiv: HTMLDivElement) => {
    setPlotDiv(graphDiv);
  }, []);

  const selection = project.selection;

  if (selection?.type !== 'graph') {
    return (
      <div className="main-area">
        <p>Select a graph from the sidebar.</p>
      </div>
    );
  }

  const graph = project.graphs.find((g) => g.id === selection.graphId);
  if (!graph) {
    return (
      <div className="main-area">
        <p>Graph not found.</p>
      </div>
    );
  }

  const table = project.tables.find((t) => t.id === graph.tableId);
  const analysis = graph.analysisId
    ? project.analyses.find((a) => a.id === graph.analysisId)
    : undefined;

  const data = table
    ? buildPlotlySpec(
        graph.graphType,
        table.data,
        analysis?.result,
        graph.options
      )
    : [];

  const isBarChart = graph.graphType === 'bar';
  const layout: Record<string, unknown> = {
    title: graph.options.title ?? graph.name,
    xaxis: {
      title: graph.options.xAxisLabel,
      type: isBarChart ? 'category' : (graph.options.xAxisScale ?? 'linear'),
    },
    yaxis: {
      title: graph.options.yAxisLabel,
      type: graph.options.yAxisScale ?? 'linear',
    },
    showlegend: graph.options.showLegend ?? true,
    margin: { t: 50, r: 50, b: 50, l: 50 },
    hovermode: 'closest',
  };

  function handlePlotClick(event: { points: Array<{ x: string | number; y: number }> }) {
    const pt = event.points?.[0];
    if (!pt) return;
    const label = String(pt.x);
    const value = Number(pt.y);
    if (!Number.isFinite(value)) return;
    setSelectedPoint({ label, value });
  }

  const graphName = graph.name;
  function handleExportPng() {
    if (!plotDiv) return;
    Plotly.toImage(plotDiv, { format: 'png', width: 800, height: 600 }).then(
      (url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${graphName}.png`;
        a.click();
      }
    );
  }

  function handleExportSvg() {
    if (!plotDiv) return;
    Plotly.toImage(plotDiv, { format: 'svg', width: 800, height: 600 }).then(
      (url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${graphName}.svg`;
        a.click();
      }
    );
  }

  return (
    <div className="main-area" role="region" aria-label="Graph view">
      <h2 style={{ marginTop: 0 }}>{graph.name}</h2>
      <div className="toolbar">
        <button type="button" onClick={handleExportPng} aria-label="Export as PNG">
          Export PNG
        </button>
        <button type="button" onClick={handleExportSvg} aria-label="Export as SVG">
          Export SVG
        </button>
      </div>
      <div style={{ width: '100%', minHeight: 400 }}>
        <Plot
          data={data}
          layout={layout}
          config={{ displayModeBar: true, responsive: true }}
          onInitialized={onInitialized}
          onClick={handlePlotClick}
          style={{ width: '100%', minHeight: 400 }}
          useResizeHandler
        />
      </div>
      {selectedPoint && (
        <div className="selected-point-panel" role="status" aria-live="polite">
          <strong>Selected:</strong> {selectedPoint.label} = {selectedPoint.value.toFixed(2)}
          <button type="button" className="btn-ghost" onClick={() => setSelectedPoint(null)} aria-label="Clear selection">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
