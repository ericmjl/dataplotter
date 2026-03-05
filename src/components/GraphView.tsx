import { useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js';
import { useStore } from '../store';
import { buildPlotlySpec } from '../charts/adapter';
import type { PlotlyTrace } from '../charts/adapter';
import type { ChartAnnotation } from '../types/graph';

type SelectedPoint = { label: string; value: number } | null;

export function GraphView() {
  const project = useStore((s) => s.project);
  const updateGraphOptions = useStore((s) => s.updateGraphOptions);
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

  const spec = table
    ? buildPlotlySpec(
        graph.graphType,
        table.data,
        analysis?.result,
        graph.options
      )
    : { traces: [] as PlotlyTrace[] };
  const data = spec.traces;
  const barLayout = spec.layout;

  const isBarChart = graph.graphType === 'bar';
  const layout: Record<string, unknown> = {
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
    margin: { t: 50, r: 50, b: 50, l: 50 },
    hovermode: 'closest',
    annotations: graph.options.annotations ?? [],
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
  const annotations = graph.options.annotations ?? [];

  function handleAddAnnotation() {
    const next: ChartAnnotation = {
      x: 0.5,
      y: 0.92,
      text: 'Annotation',
      xref: 'paper',
      yref: 'paper',
    };
    updateGraphOptions(graph.id, {
      annotations: [...annotations, next],
    });
  }

  function handleRemoveAnnotation(index: number) {
    updateGraphOptions(graph.id, {
      annotations: annotations.filter((_, i) => i !== index),
    });
  }

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
        <button type="button" onClick={handleAddAnnotation} aria-label="Add annotation">
          Add annotation
        </button>
        <button type="button" onClick={handleExportPng} aria-label="Export as PNG">
          Export PNG
        </button>
        <button type="button" onClick={handleExportSvg} aria-label="Export as SVG">
          Export SVG
        </button>
      </div>
      {annotations.length > 0 && (
        <div className="annotations-list" style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Annotations:</span>
          {annotations.map((a, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem' }}>
              <span title={`${a.x}, ${a.y} (${a.xref ?? 'x'}/${a.yref ?? 'y'})`}>
                {a.text.slice(0, 20)}{a.text.length > 20 ? '…' : ''}
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.1rem 0.3rem' }}
                onClick={() => handleRemoveAnnotation(i)}
                aria-label={`Remove annotation ${i + 1}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
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
