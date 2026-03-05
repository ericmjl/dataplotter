import type {
  GraphTypeId,
  ColumnTableData,
  XYTableData,
  AnalysisResult,
  GraphOptions,
} from '../types';

export type PlotlyTrace = {
  x: (string | number)[];
  y: number[];
  type: 'bar' | 'scatter';
  mode?: 'markers' | 'lines' | 'lines+markers';
  name?: string;
  hovertext?: string[];
  error_y?: {
    type: 'data';
    array: number[];
    visible: boolean;
  };
};

function colMeans(rows: (number | null)[][], nCols: number): number[] {
  return Array.from({ length: nCols }, (_, c) => {
    const vals = rows.map((r) => r[c]).filter((v): v is number => v != null && Number.isFinite(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
}

function colSEM(rows: (number | null)[][], nCols: number): number[] {
  return Array.from({ length: nCols }, (_, c) => {
    const vals = rows.map((r) => r[c]).filter((v): v is number => v != null && Number.isFinite(v));
    if (vals.length < 2) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1);
    return Math.sqrt(variance) / Math.sqrt(vals.length);
  });
}

function colSD(rows: (number | null)[][], nCols: number): number[] {
  return Array.from({ length: nCols }, (_, c) => {
    const vals = rows.map((r) => r[c]).filter((v): v is number => v != null && Number.isFinite(v));
    if (vals.length < 2) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
  });
}

export function buildPlotlySpec(
  graphType: GraphTypeId,
  tableData: ColumnTableData | XYTableData,
  analysisResult: AnalysisResult | undefined,
  graphOptions: GraphOptions
): PlotlyTrace[] {
  const errorBarType = graphOptions.errorBarType ?? 'sem';

  if (graphType === 'bar' && 'columnLabels' in tableData) {
    const labels = tableData.columnLabels;
    const rows = tableData.rows;
    let y: number[];
    let errorArray: number[] | undefined;
    if (analysisResult?.type === 'descriptive') {
      y = analysisResult.byColumn.map((col) => col.mean);
      if (errorBarType !== 'none') {
        if (errorBarType === 'sem') {
          errorArray = analysisResult.byColumn.map((col) => col.sem);
        } else if (errorBarType === 'sd') {
          errorArray = analysisResult.byColumn.map((col) => col.sd);
        } else {
          const sem = analysisResult.byColumn.map((col) => col.sem);
          errorArray = sem.map((s) => 1.96 * s);
        }
      }
    } else {
      y = colMeans(rows, labels.length);
      if (errorBarType !== 'none') {
        errorArray = errorBarType === 'sem' ? colSEM(rows, labels.length) : colSD(rows, labels.length);
      }
    }
    const hovertext = labels.map((label, i) => {
      const val = y[i];
      const err = errorArray?.[i];
      return err != null && err > 0
        ? `${label}: ${val.toFixed(2)} ± ${err.toFixed(2)}`
        : `${label}: ${val.toFixed(2)}`;
    });
    const trace: PlotlyTrace = {
      x: labels,
      y,
      type: 'bar',
      hovertext,
    };
    if (errorArray && errorArray.some((e) => e > 0)) {
      trace.error_y = { type: 'data', array: errorArray, visible: true };
    }
    return [trace];
  }

  if (
    (graphType === 'scatter' || graphType === 'line' || graphType === 'scatterLine') &&
    'x' in tableData
  ) {
    const traces: PlotlyTrace[] = [];
    const xRaw = tableData.x;
    const x = xRaw.map((v) => (v != null && Number.isFinite(v) ? v : 0));
    for (let s = 0; s < tableData.ys.length; s++) {
      const y = (tableData.ys[s] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0));
      const mode =
        graphType === 'scatter' ? 'markers' : graphType === 'line' ? 'lines' : 'lines+markers';
      traces.push({
        x,
        y,
        type: 'scatter',
        mode,
        name: tableData.yLabels[s],
      });
    }
    if (analysisResult?.type === 'linear_regression') {
      const { slope, intercept } = analysisResult;
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const fitX = [xMin, xMax];
      const fitY = fitX.map((xi) => slope * xi + intercept);
      traces.push({
        x: fitX,
        y: fitY,
        type: 'scatter',
        mode: 'lines',
        name: 'Fit',
      });
    }
    return traces;
  }

  if (graphType === 'doseResponse' && analysisResult?.type === 'dose_response_4pl' && 'x' in tableData) {
    const curve = analysisResult.curve;
    const traces: PlotlyTrace[] = [
      {
        x: tableData.x.map((v) => (v != null && Number.isFinite(v) ? v : 0)),
        y: (tableData.ys[0] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0)),
        type: 'scatter',
        mode: 'markers',
        name: tableData.yLabels[0],
      },
      {
        x: curve.x,
        y: curve.y,
        type: 'scatter',
        mode: 'lines',
        name: '4PL fit',
      },
    ];
    return traces;
  }

  if (graphType === 'doseResponse' && 'x' in tableData) {
    const x = tableData.x.map((v) => (v != null && Number.isFinite(v) ? v : 0));
    const y = (tableData.ys[0] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0));
    return [{ x, y, type: 'scatter', mode: 'markers', name: tableData.yLabels[0] ?? 'Y' }];
  }

  return [];
}
