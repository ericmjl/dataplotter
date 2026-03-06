import type { GraphId, TableId, AnalysisId, GraphTypeId } from './project';

/** Plotly-compatible layout annotation; included in PNG/SVG export. */
export interface ChartAnnotation {
  x: number;
  y: number;
  text: string;
  xref?: 'paper' | 'x';
  yref?: 'paper' | 'y';
  showarrow?: boolean;
  font?: { size?: number; color?: string };
  bgcolor?: string;
  borderpad?: number;
}

export interface GraphOptions {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisScale?: 'linear' | 'log';
  yAxisScale?: 'linear' | 'log';
  errorBarType?: 'sem' | 'sd' | 'ci' | 'none';
  showLegend?: boolean;
  /** Annotations rendered on the chart and included in exports (PNG/SVG). */
  annotations?: ChartAnnotation[];
  /** Draw line where X=Y (for XY/scatter/line graphs). */
  showLineOfIdentity?: boolean;
  /** Index of Y series to plot on right Y-axis (0-based); only one series supported. PRISM-GPH-010 */
  yAxis2SeriesIndex?: number;
  /** @spec TRANSFORM-006 Use raw or transformed table data for this graph. */
  dataMode?: 'raw' | 'transformed';
}

export interface Graph {
  id: GraphId;
  name: string;
  tableId: TableId;
  analysisId?: AnalysisId | null;
  graphType: GraphTypeId;
  options: GraphOptions;
}
