import type {
  GraphTypeId,
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
  AnalysisResult,
  GraphOptions,
} from '../types';
import { runKaplanMeier } from '../engine/statistics/kaplanMeier';

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
  line?: { shape?: 'hv'; width?: number };
  /** Plot on right Y-axis when 'y2'. */
  yaxis?: 'y' | 'y2';
  /** Filled band (e.g. 95% CrI); use with fillcolor. */
  fill?: 'toself' | 'tonexty';
  fillcolor?: string;
};

export type PlotlyPieTrace = {
  type: 'pie';
  labels: string[];
  values: number[];
  name?: string;
};

/** Box plot: one box per category; x is index (0,1,2,...) per point for layout tickvals. */
export type PlotlyBoxTrace = {
  type: 'box';
  x: number[];
  y: number[];
  name?: string;
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
  traces: (PlotlyTrace | PlotlyPieTrace | PlotlyBoxTrace)[];
  layout?: BarChartLayout;
};

function cellMean(cell: (number | null)[]): number {
  const vals = cell.filter((v): v is number => v != null && Number.isFinite(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

export function buildPlotlySpec(
  graphType: GraphTypeId,
  tableData:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData,
  analysisResult: AnalysisResult | undefined,
  graphOptions: GraphOptions
): BuildPlotlyResult {
  const errorBarType = graphOptions.errorBarType ?? 'sem';

  if ('counts' in tableData) {
    return { traces: [] };
  }

  if ('times' in tableData) {
    if (graphType === 'survival') {
      const survData = tableData as SurvivalTableData;
      const kmResult =
        analysisResult?.type === 'kaplan_meier'
          ? analysisResult
          : runKaplanMeier(survData);
      if (kmResult.type !== 'kaplan_meier') return { traces: [] };
      const traces: PlotlyTrace[] = kmResult.curves.map((c) => ({
        x: c.time,
        y: c.survival,
        type: 'scatter',
        mode: 'lines',
        name: c.group,
        line: { shape: 'hv' },
      }));
      return { traces };
    }
    return { traces: [] };
  }

  if ('labels' in tableData && 'values' in tableData) {
    if (graphType === 'pie') {
      const pieData = tableData as PartsOfWholeTableData;
      let labels: string[];
      let values: number[];
      if (analysisResult?.type === 'fraction_of_total') {
        labels = analysisResult.fractions.map((f) => f.label);
        values = analysisResult.fractions.map((f) => f.fraction);
      } else {
        labels = pieData.labels;
        values = pieData.values;
      }
      const trace: PlotlyPieTrace = { type: 'pie', labels, values };
      return { traces: [trace] };
    }
    return { traces: [] };
  }

  if (graphType === 'groupedBar' && 'cellValues' in tableData) {
    const { rowGroupLabels, colGroupLabels, cellValues } = tableData;
    const xNumeric = colGroupLabels.map((_, j) => j);
    const traces: PlotlyTrace[] = rowGroupLabels.map((rowLabel, i) => ({
      type: 'bar',
      x: xNumeric,
      y: colGroupLabels.map((_, j) => cellMean(cellValues[i]?.[j] ?? [])),
      name: rowLabel,
    }));
    return {
      traces,
      layout: {
        xaxis: {
          type: 'linear',
          tickvals: xNumeric,
          ticktext: colGroupLabels,
        },
      },
    };
  }

  if (graphType === 'bar' && 'columnLabels' in tableData && !('cellValues' in tableData)) {
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

  if (graphType === 'box' && 'columnLabels' in tableData && !('cellValues' in tableData)) {
    const { columnLabels: labels, rows } = tableData;
    const boxX: number[] = [];
    const boxY: number[] = [];
    const scatterX: number[] = [];
    const scatterY: number[] = [];
    let step = 0;
    labels.forEach((_, c) => {
      rows.forEach((r) => {
        const v = r[c];
        if (v != null && Number.isFinite(v)) {
          boxX.push(c);
          boxY.push(v);
          scatterX.push(c + jitter(step++));
          scatterY.push(v);
        }
      });
    });
    if (boxX.length === 0) return { traces: [] };
    const boxTrace: PlotlyBoxTrace = { type: 'box', x: boxX, y: boxY };
    const scatterTrace: PlotlyTrace = {
      x: scatterX,
      y: scatterY,
      type: 'scatter',
      mode: 'markers',
      name: 'Data points',
      marker: { size: 6, opacity: 0.85 },
    };
    const nBoxes = labels.length;
    const layout: BarChartLayout = {
      xaxis: {
        type: 'linear',
        tickvals: labels.map((_, i) => i),
        ticktext: labels,
        range: [-0.6, nBoxes - 0.4],
      },
    };
    return { traces: [boxTrace, scatterTrace], layout };
  }

  if (
    (graphType === 'scatter' || graphType === 'line' || graphType === 'scatterLine') &&
    'x' in tableData
  ) {
    const traces: PlotlyTrace[] = [];
    const xRaw = tableData.x;
    const x = xRaw.map((v) => (v != null && Number.isFinite(v) ? v : 0));
    const y2Index = graphOptions.yAxis2SeriesIndex;
    for (let s = 0; s < tableData.ys.length; s++) {
      const y = (tableData.ys[s] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0));
      const mode =
        graphType === 'scatter' ? 'markers' : graphType === 'line' ? 'lines' : 'lines+markers';
      const trace: PlotlyTrace = {
        x,
        y,
        type: 'scatter',
        mode,
        name: tableData.yLabels[s],
      };
      if (y2Index === s) trace.yaxis = 'y2';
      traces.push(trace);
    }
    if (analysisResult?.type === 'linear_regression') {
      const { slope, intercept, curve } = analysisResult;
      if (curve?.yLower != null && curve?.yUpper != null && curve.x.length > 0) {
        const bandX = [...curve.x, ...curve.x.slice().reverse()];
        const bandY = [...curve.yUpper, ...curve.yLower.slice().reverse()];
        traces.push({
          x: bandX,
          y: bandY,
          type: 'scatter',
          mode: 'lines',
          name: '95% CrI',
          fill: 'toself',
          fillcolor: 'rgba(100, 150, 255, 0.2)',
          line: { width: 0 },
        });
        traces.push({
          x: curve.x,
          y: curve.y,
          type: 'scatter',
          mode: 'lines',
          name: 'Fit',
        });
      } else {
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
    }
    if (graphOptions.showLineOfIdentity && x.length > 0) {
      const xMin = Math.min(...x);
      const xMax = Math.max(...x);
      const span = xMax - xMin || 1;
      const lo = xMin - span * 0.05;
      const hi = xMax + span * 0.05;
      traces.push({
        x: [lo, hi],
        y: [lo, hi],
        type: 'scatter',
        mode: 'lines',
        name: 'Line of identity (X=Y)',
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
    ];
    if (curve.yLower != null && curve.yUpper != null && curve.x.length > 0) {
      const bandX = [...curve.x, ...curve.x.slice().reverse()];
      const bandY = [...curve.yUpper, ...curve.yLower.slice().reverse()];
      traces.push({
        x: bandX,
        y: bandY,
        type: 'scatter',
        mode: 'lines',
        name: '95% CrI',
        fill: 'toself',
        fillcolor: 'rgba(100, 150, 255, 0.2)',
        line: { width: 0 },
      });
    }
    traces.push({
      x: curve.x,
      y: curve.y,
      type: 'scatter',
      mode: 'lines',
      name: '4PL fit',
    });
    return { traces };
  }

  if (graphType === 'doseResponse' && 'x' in tableData) {
    const x = tableData.x.map((v) => (v != null && Number.isFinite(v) ? v : 0));
    const y = (tableData.ys[0] ?? []).map((v) => (v != null && Number.isFinite(v) ? v : 0));
    return { traces: [{ x, y, type: 'scatter', mode: 'markers', name: tableData.yLabels[0] ?? 'Y' }] };
  }

  return { traces: [] };
}
