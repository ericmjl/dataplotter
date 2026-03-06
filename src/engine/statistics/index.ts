import type { Result } from '../../types';
import type {
  TableFormatId,
  AnalysisTypeId,
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
  AnalysisResult,
  AnalysisOptions,
} from '../../types';
import { validateForAnalysis } from '../../lib/tableRegistry';
import { runDescriptive } from './descriptive';
import { runUnpairedTtest, runPairedTtest } from './ttest';
import { runOneWayAnova } from './anova';
import { runTwoWayAnova } from './twoWayAnova';
import { runChiSquare } from './chiSquare';
import { runFisherExact } from './fisherExact';
import { runKaplanMeier } from './kaplanMeier';
import { runFractionOfTotal } from './fractionOfTotal';
import { runMannWhitney } from './mannWhitney';
import { runKruskalWallis } from './kruskalWallis';
import { runRocAuc } from './rocAuc';
import { runNormalityTest } from './normalityTest';
import { runLinearRegression } from './regression';
import { runDoseResponse4pl } from './doseResponse4pl';
import { addDescriptiveBayesianFields } from '../bayesian/descriptive';
import { getPyodide, runDescriptivePyMC } from '../pymc/descriptive';
import { runRegressionPyMC } from '../pymc/regression';
import { runDoseResponse4plPyMC } from '../pymc/doseResponse4pl';

export function runAnalysis(
  format: TableFormatId,
  analysisType: AnalysisTypeId,
  tableData:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData,
  options: AnalysisOptions
): Result<AnalysisResult> {
  const validation = validateForAnalysis(format, tableData, analysisType);
  if (!validation.valid && validation.errors?.length) {
    return { ok: false, error: validation.errors.join('; ') };
  }

  if (analysisType === 'descriptive') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Descriptive analysis requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    return {
      ok: true,
      value: runDescriptive(
        colData.columnLabels,
        colData.rows,
        colData.groupLabels,
        colData.groupForColumn
      ),
    };
  }

  if (analysisType === 'unpaired_ttest') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Unpaired t-test requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    const opts = options as { type: 'unpaired_ttest'; columnLabels: [string, string] };
    const i1 = colData.columnLabels.indexOf(opts.columnLabels[0]);
    const i2 = colData.columnLabels.indexOf(opts.columnLabels[1]);
    if (i1 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[0]}" not found.` };
    }
    if (i2 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[1]}" not found.` };
    }
    return {
      ok: true,
      value: runUnpairedTtest(opts.columnLabels, colData.rows, [i1, i2]),
    };
  }

  if (analysisType === 'paired_ttest') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Paired t-test requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    const opts = options as { type: 'paired_ttest'; columnLabels: [string, string] };
    const i1 = colData.columnLabels.indexOf(opts.columnLabels[0]);
    const i2 = colData.columnLabels.indexOf(opts.columnLabels[1]);
    if (i1 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[0]}" not found.` };
    }
    if (i2 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[1]}" not found.` };
    }
    return {
      ok: true,
      value: runPairedTtest(opts.columnLabels, colData.rows, [i1, i2]),
    };
  }

  if (analysisType === 'one_way_anova') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'One-way ANOVA requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    return {
      ok: true,
      value: runOneWayAnova(colData.columnLabels, colData.rows),
    };
  }

  if (analysisType === 'mann_whitney') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Mann-Whitney requires column table with two columns.' };
    }
    const colData = tableData as ColumnTableData;
    const opts = options as { type: 'mann_whitney'; columnLabels: [string, string] };
    const i1 = colData.columnLabels.indexOf(opts.columnLabels[0]);
    const i2 = colData.columnLabels.indexOf(opts.columnLabels[1]);
    if (i1 === -1) return { ok: false, error: `Column "${opts.columnLabels[0]}" not found.` };
    if (i2 === -1) return { ok: false, error: `Column "${opts.columnLabels[1]}" not found.` };
    return { ok: true, value: runMannWhitney(opts.columnLabels, colData.rows, [i1, i2]) };
  }

  if (analysisType === 'kruskal_wallis') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Kruskal-Wallis requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    return { ok: true, value: runKruskalWallis(colData.columnLabels, colData.rows) };
  }

  if (analysisType === 'roc_auc') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'ROC AUC requires column table with two columns (score, outcome).' };
    }
    const colData = tableData as ColumnTableData;
    const opts = options as { type: 'roc_auc'; columnLabels: [string, string] };
    const i0 = colData.columnLabels.indexOf(opts.columnLabels[0]);
    const i1 = colData.columnLabels.indexOf(opts.columnLabels[1]);
    if (i0 === -1) return { ok: false, error: `Column "${opts.columnLabels[0]}" not found.` };
    if (i1 === -1) return { ok: false, error: `Column "${opts.columnLabels[1]}" not found.` };
    return { ok: true, value: runRocAuc(opts.columnLabels, colData.rows, [i0, i1]) };
  }

  if (analysisType === 'normality_test') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Normality test requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    const opts = options as { type: 'normality_test'; columnLabel?: string };
    const label = opts.columnLabel ?? colData.columnLabels[0];
    const colIdx = colData.columnLabels.indexOf(label);
    if (colIdx === -1) return { ok: false, error: `Column "${label}" not found.` };
    const values = colData.rows
      .map((r) => r[colIdx])
      .filter((v): v is number => v != null && Number.isFinite(v));
    return { ok: true, value: runNormalityTest(label, values) };
  }

  if (analysisType === 'two_way_anova') {
    if (format !== 'grouped' || !('cellValues' in tableData)) {
      return { ok: false, error: 'Two-way ANOVA requires grouped table.' };
    }
    const g = tableData as GroupedTableData;
    return {
      ok: true,
      value: runTwoWayAnova(g.rowGroupLabels, g.colGroupLabels, g.cellValues),
    };
  }

  if (analysisType === 'chi_square') {
    if (format !== 'contingency' || !('counts' in tableData)) {
      return { ok: false, error: 'Chi-square test requires contingency table.' };
    }
    const c = tableData as ContingencyTableData;
    return { ok: true, value: runChiSquare(c.rowLabels, c.columnLabels, c.counts) };
  }

  if (analysisType === 'fisher_exact') {
    if (format !== 'contingency' || !('counts' in tableData)) {
      return { ok: false, error: "Fisher's exact test requires contingency table." };
    }
    const c = tableData as ContingencyTableData;
    if (c.rowLabels.length !== 2 || c.columnLabels.length !== 2) {
      return { ok: false, error: "Fisher's exact test requires a 2×2 table." };
    }
    return { ok: true, value: runFisherExact(c.counts) };
  }

  if (analysisType === 'kaplan_meier') {
    if (format !== 'survival' || !('times' in tableData)) {
      return { ok: false, error: 'Kaplan–Meier requires survival table.' };
    }
    return { ok: true, value: runKaplanMeier(tableData as SurvivalTableData) };
  }

  if (analysisType === 'fraction_of_total') {
    if (format !== 'partsOfWhole' || !('values' in tableData)) {
      return { ok: false, error: 'Fraction of total requires parts-of-whole table.' };
    }
    const p = tableData as PartsOfWholeTableData;
    return { ok: true, value: runFractionOfTotal(p.labels, p.values) };
  }

  if (analysisType === 'linear_regression') {
    if (format !== 'xy' || !('x' in tableData)) {
      return { ok: false, error: 'Linear regression requires XY table.' };
    }
    const opts = options as { type: 'linear_regression'; ySeriesLabel?: string };
    let yIdx = 0;
    if (opts.ySeriesLabel) {
      const idx = tableData.yLabels.indexOf(opts.ySeriesLabel);
      if (idx === -1) {
        return { ok: false, error: `Y series "${opts.ySeriesLabel}" not found.` };
      }
      yIdx = idx;
    }
    const x = tableData.x;
    const y = tableData.ys[yIdx] ?? [];
    return {
      ok: true,
      value: runLinearRegression(x, y),
    };
  }

  if (analysisType === 'dose_response_4pl') {
    if (format !== 'xy' || !('x' in tableData)) {
      return { ok: false, error: '4PL dose-response requires XY table.' };
    }
    const opts = options as { type: 'dose_response_4pl'; logX: boolean };
    const x = tableData.x;
    const y = tableData.ys[0] ?? [];
    return {
      ok: true,
      value: runDoseResponse4pl(x, y, opts.logX),
    };
  }

  return { ok: false, error: `Unknown analysis type: ${analysisType}` };
}

/**
 * Async entry point for analyses (HLD §6). Defaults to PyMC in WASM for Bayesian models:
 * descriptive, linear regression, dose-response 4PL. Falls back to sync runAnalysis (TS) only
 * when Pyodide/PyMC is unavailable or fails.
 * @spec PRISM-ANA-001 through PRISM-ANA-005 (Bayesian by default)
 */
export async function runAnalysisAsync(
  format: TableFormatId,
  analysisType: AnalysisTypeId,
  tableData:
    | ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData,
  options: AnalysisOptions
): Promise<Result<AnalysisResult>> {
  const validation = validateForAnalysis(format, tableData, analysisType);
  if (!validation.valid && validation.errors?.length) {
    return { ok: false, error: validation.errors.join('; ') };
  }

  if (analysisType === 'descriptive') {
    if (format !== 'column' || !('columnLabels' in tableData) || 'counts' in tableData) {
      return { ok: false, error: 'Descriptive analysis requires column table.' };
    }
    const colData = tableData as ColumnTableData;
    const base = runDescriptive(
      colData.columnLabels,
      colData.rows,
      colData.groupLabels,
      colData.groupForColumn
    );
    if (base.type !== 'descriptive') return { ok: true, value: base };

    const hasGroups =
      colData.groupLabels?.length &&
      colData.groupForColumn?.length === colData.columnLabels.length;
    let columnLabels: string[];
    let columnValues: number[][];
    if (hasGroups && colData.groupLabels && colData.groupForColumn) {
      columnLabels = colData.groupLabels;
      columnValues = colData.groupLabels.map((_, g) => {
        const vals: number[] = [];
        colData.rows.forEach((r) => {
          colData.columnLabels.forEach((_, c) => {
            if (colData.groupForColumn![c] === g) {
              const v = r[c];
              if (v != null && Number.isFinite(v)) vals.push(v);
            }
          });
        });
        return vals;
      });
    } else {
      columnLabels = colData.columnLabels;
      columnValues = colData.columnLabels.map((_, c) =>
        colData.rows
          .map((r) => r[c])
          .filter((v): v is number => v != null && Number.isFinite(v))
      );
    }

    try {
      const pyodide = await getPyodide();
      if (pyodide) {
        const bayesianRows = await runDescriptivePyMC(
          pyodide,
          columnLabels,
          columnValues
        );
        const byColumn = base.byColumn.map((col, i) => ({
          ...col,
          meanCrI: bayesianRows[i]?.meanCrI,
          meanSD: bayesianRows[i]?.meanSD,
        }));
        return { ok: true, value: { type: 'descriptive', byColumn } };
      }
    } catch (_) {
      // Fall through to TS conjugate
    }
    return {
      ok: true,
      value: addDescriptiveBayesianFields(base) as AnalysisResult,
    };
  }

  if (analysisType === 'linear_regression') {
    if (format !== 'xy' || !('x' in tableData)) {
      return { ok: false, error: 'Linear regression requires XY table.' };
    }
    const opts = options as { type: 'linear_regression'; ySeriesLabel?: string };
    let yIdx = 0;
    if (opts.ySeriesLabel) {
      const idx = tableData.yLabels.indexOf(opts.ySeriesLabel);
      if (idx === -1) {
        return { ok: false, error: `Y series "${opts.ySeriesLabel}" not found.` };
      }
      yIdx = idx;
    }
    const xRaw = tableData.x;
    const yRaw = tableData.ys[yIdx] ?? [];
    const pairs: { x: number; y: number }[] = [];
    for (let i = 0; i < xRaw.length; i++) {
      const xi = xRaw[i];
      const yi = yRaw[i];
      if (
        xi != null && Number.isFinite(xi) &&
        yi != null && Number.isFinite(yi)
      ) {
        pairs.push({ x: xi, y: yi });
      }
    }
    if (pairs.length < 2) {
      return { ok: true, value: runLinearRegression(xRaw, yRaw) };
    }
    const xArr = pairs.map((p) => p.x);
    const yArr = pairs.map((p) => p.y);
    try {
      const pyodide = await getPyodide();
      if (pyodide) {
        const result = await runRegressionPyMC(pyodide, xArr, yArr);
        return {
          ok: true,
          value: {
            type: 'linear_regression',
            slope: result.slope,
            intercept: result.intercept,
            r2: result.r2,
            p: result.p,
            slopeCI: result.slopeCI,
            interceptCI: result.interceptCI,
            curve: result.curve,
          },
        };
      }
    } catch (_) {
      // fall through to TS
    }
    return Promise.resolve(
      runAnalysis(format, 'linear_regression', tableData, options)
    );
  }

  if (analysisType === 'dose_response_4pl') {
    if (format !== 'xy' || !('x' in tableData)) {
      return { ok: false, error: '4PL dose-response requires XY table.' };
    }
    const opts = options as { type: 'dose_response_4pl'; logX: boolean };
    const xRaw = tableData.x;
    const yRaw = tableData.ys[0] ?? [];
    const pairs: { x: number; y: number }[] = [];
    for (let i = 0; i < xRaw.length; i++) {
      const xi = xRaw[i];
      const yi = yRaw[i];
      if (
        xi != null && Number.isFinite(xi) &&
        yi != null && Number.isFinite(yi)
      ) {
        pairs.push({ x: xi, y: yi });
      }
    }
    if (pairs.length < 4) {
      return Promise.resolve(
        runAnalysis(format, 'dose_response_4pl', tableData, options)
      );
    }
    const xArr = pairs.map((p) => p.x);
    const yArr = pairs.map((p) => p.y);
    try {
      const pyodide = await getPyodide();
      if (pyodide) {
        const result = await runDoseResponse4plPyMC(
          pyodide,
          xArr,
          yArr,
          opts.logX
        );
        return {
          ok: true,
          value: {
            type: 'dose_response_4pl',
            ec50: result.ec50,
            ec50CI: result.ec50CI,
            bottom: result.bottom,
            top: result.top,
            hillSlope: result.hillSlope,
            curve: result.curve,
            bottomCI: result.bottomCI,
            topCI: result.topCI,
            hillSlopeCI: result.hillSlopeCI,
          },
        };
      }
    } catch (_) {
      // fall through to TS
    }
    return Promise.resolve(
      runAnalysis(format, 'dose_response_4pl', tableData, options)
    );
  }

  return Promise.resolve(runAnalysis(format, analysisType, tableData, options));
}
