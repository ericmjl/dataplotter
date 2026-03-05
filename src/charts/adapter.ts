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
  marker?: { size?: number; opacity?: number; color?: string };
};

/** When present, merge into layout (e.g. bar chart x-axis tick labels). */
export type BarChartLayout = {
  xaxis: {
    type: 'linear';
    tickvals: number[];
    ticktext: string[];
    range?: [number, number];
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

const JITTER_WIDTH = 0.22;

/** Deterministic jitter so the plot is stable across re-renders. */
function jitter(step: number): number {
  const t = (step % 11) / 11;
  return (t - 0.5) * 2 * JITTER_WIDTH;
}

export type BuildPlotlyResult = {
  traces: PlotlyTrace[];
  layout?: BarChartLayout;
};

export function buildPlotlySpec(
  graphType: GraphTypeId,
  tableData: ColumnTableData | XYTableData,
  analysisResult: AnalysisResult | undefined,
  graphOptions: GraphOptions
): BuildPlotlyResult {
  const errorBarType = graphOptions.errorBarType ?? 'sem';

  if (graphType === 'bar' && 'columnLabels' in tableData) {
    const { columnLabels: labels, rows, groupLabels, groupForColumn } = tableData;
    const hasGroups =
      groupLabels?.length && groupForColumn?.length === labels.length;
    const xLabels = hasGroups ? groupLabels! : labels;
    const nBars = xLabels.length;
    const xNumeric = xLabels.map((_, i) => i);

    let y: number[];
    let errorArray: number[] | undefined;
    if (analysisResult?.type === 'descriptive' && analysisResult.byColumn.length === nBars) {
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
    } else if (hasGroups && groupLabels && groupForColumn) {
      const groupMeans = groupLabels.map((_, g) => {
        const vals: number[] = [];
        rows.forEach((r) => {
          labels.forEach((_, c) => {
            if (groupForColumn[c] === g) {
              const v = r[c];
              if (v != null && Number.isFinite(v)) vals.push(v);
            }
          });
        });
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      const groupSEM = groupLabels.map((_, g) => {
        const vals: number[] = [];
        rows.forEach((r) => {
          labels.forEach((_, c) => {
            if (groupForColumn[c] === g) {
              const v = r[c];
              if (v != null && Number.isFinite(v)) vals.push(v);
            }
          });
        });
        if (vals.length < 2) return 0;
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1);
        return Math.sqrt(variance) / Math.sqrt(vals.length);
      });
      const groupSD = groupLabels.map((_, g) => {
        const vals: number[] = [];
        rows.forEach((r) => {
          labels.forEach((_, c) => {
            if (groupForColumn[c] === g) {
              const v = r[c];
              if (v != null && Number.isFinite(v)) vals.push(v);
            }
          });
        });
        if (vals.length < 2) return 0;
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        return Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1));
      });
      y = groupMeans;
      if (errorBarType !== 'none') {
        errorArray =
          errorBarType === 'sem' ? groupSEM : errorBarType === 'sd' ? groupSD : groupSEM.map((s) => 1.96 * s);
      }
    } else {
      y = colMeans(rows, labels.length);
      if (errorBarType !== 'none') {
        errorArray = errorBarType === 'sem' ? colSEM(rows, labels.length) : colSD(rows, labels.length);
      }
    }
    const hovertext = xLabels.map((label, i) => {
      const val = y[i];
      const err = errorArray?.[i];
      return err != null && err > 0
        ? `${label}: ${val.toFixed(2)} ± ${err.toFixed(2)}`
        : `${label}: ${val.toFixed(2)}`;
    });
    const barTrace: PlotlyTrace = {
      x: xNumeric,
      y,
      type: 'bar',
      hovertext,
      name: 'Mean',
    };
    if (errorArray && errorArray.some((e) => e > 0)) {
      barTrace.error_y = { type: 'data', array: errorArray, visible: true };
    }

    // Overlay raw data points (one per value), jittered on x (deterministic)
    const scatterX: number[] = [];
    const scatterY: number[] = [];
    let step = 0;
    if (hasGroups && groupLabels && groupForColumn) {
      groupLabels.forEach((_, g) => {
        rows.forEach((r) => {
          labels.forEach((_, c) => {
            if (groupForColumn[c] === g) {
              const v = r[c];
              if (v != null && Number.isFinite(v)) {
                scatterX.push(g + jitter(step++));
                scatterY.push(v);
              }
            }
          });
        });
      });
    } else {
      labels.forEach((_, c) => {
        rows.forEach((r) => {
          const v = r[c];
          if (v != null && Number.isFinite(v)) {
            scatterX.push(c + jitter(step++));
            scatterY.push(v);
          }
        });
      });
    }
    const scatterTrace: PlotlyTrace = {
      x: scatterX,
      y: scatterY,
      type: 'scatter',
      mode: 'markers',
      name: 'Data points',
      marker: { size: 6, opacity: 0.85 },
    };

    const layout: BarChartLayout = {
      xaxis: {
        type: 'linear',
        tickvals: xNumeric,
        ticktext: xLabels,
        range: [-0.6, nBars - 0.4],
      },
    };
    return { traces: [barTrace, scatterTrace], layout };
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
    return { traces };
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
    return { traces };
  }

  if (graphType === 'doseResponse' && 'x' in tableData) {
    const x = tableData.x.map((v) => (v != null && Number.isFinite(v) ? v : 0));
    const y = (tableData.ys[0] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0));
    return { traces: [{ x, y, type: 'scatter', mode: 'markers', name: tableData.yLabels[0] ?? 'Y' }] };
  }

  return { traces: [] };
}
