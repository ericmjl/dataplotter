import type { GraphId, TableId, AnalysisId, GraphTypeId } from './project';

export interface GraphOptions {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisScale?: 'linear' | 'log';
  yAxisScale?: 'linear' | 'log';
  errorBarType?: 'sem' | 'sd' | 'ci' | 'none';
  showLegend?: boolean;
}

export interface Graph {
  id: GraphId;
  name: string;
  tableId: TableId;
  analysisId?: AnalysisId | null;
  graphType: GraphTypeId;
  options: GraphOptions;
}
