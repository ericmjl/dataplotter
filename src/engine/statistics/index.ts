import type { Result } from '../../types';
import type {
  TableFormatId,
  AnalysisTypeId,
  ColumnTableData,
  XYTableData,
  AnalysisResult,
  AnalysisOptions,
} from '../../types';
import { validateForAnalysis } from '../../lib/tableRegistry';
import { runDescriptive } from './descriptive';
import { runUnpairedTtest } from './ttest';
import { runOneWayAnova } from './anova';
import { runLinearRegression } from './regression';
import { runDoseResponse4pl } from './doseResponse4pl';

export function runAnalysis(
  format: TableFormatId,
  analysisType: AnalysisTypeId,
  tableData: ColumnTableData | XYTableData,
  options: AnalysisOptions
): Result<AnalysisResult> {
  const validation = validateForAnalysis(format, tableData, analysisType);
  if (!validation.valid && validation.errors?.length) {
    return { ok: false, error: validation.errors.join('; ') };
  }

  if (analysisType === 'descriptive') {
    if (format !== 'column' || !('columnLabels' in tableData)) {
      return { ok: false, error: 'Descriptive analysis requires column table.' };
    }
    return {
      ok: true,
      value: runDescriptive(tableData.columnLabels, tableData.rows),
    };
  }

  if (analysisType === 'unpaired_ttest') {
    if (format !== 'column' || !('columnLabels' in tableData)) {
      return { ok: false, error: 'Unpaired t-test requires column table.' };
    }
    const opts = options as { type: 'unpaired_ttest'; columnLabels: [string, string] };
    const i1 = tableData.columnLabels.indexOf(opts.columnLabels[0]);
    const i2 = tableData.columnLabels.indexOf(opts.columnLabels[1]);
    if (i1 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[0]}" not found.` };
    }
    if (i2 === -1) {
      return { ok: false, error: `Column "${opts.columnLabels[1]}" not found.` };
    }
    return {
      ok: true,
      value: runUnpairedTtest(
        opts.columnLabels,
        tableData.rows,
        [i1, i2]
      ),
    };
  }

  if (analysisType === 'one_way_anova') {
    if (format !== 'column' || !('columnLabels' in tableData)) {
      return { ok: false, error: 'One-way ANOVA requires column table.' };
    }
    return {
      ok: true,
      value: runOneWayAnova(tableData.columnLabels, tableData.rows),
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
