import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { runAnalysisAsync } from '../engine/statistics';
import { getEffectiveTableData } from '../lib/effectiveTableData';
import type { Analysis, DataTable } from '../types';

/**
 * When table data or transformations change, analyses for that table are cleared.
 * This hook re-runs those analyses in the background and only applies results
 * if the table's data version is unchanged (avoids applying stale results).
 */
export function useAutoRunAnalyses(): void {
  const project = useStore((s) => s.project);
  const prevHadResultOrErrorRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    const state = useStore.getState();
    const proj = state.project;
    const prev = prevHadResultOrErrorRef.current;

    const toRun: { analysis: Analysis; table: DataTable; version: number }[] = [];
    for (const a of proj.analyses) {
      const hasResultOrError = a.result !== undefined || a.error !== undefined;
      if (!hasResultOrError && prev.get(a.id)) {
        const table = proj.tables.find((t) => t.id === a.tableId);
        if (table) {
          toRun.push({
            analysis: a,
            table,
            version: table.tableDataVersion ?? 0,
          });
        }
      }
    }

    prevHadResultOrErrorRef.current = new Map(
      proj.analyses.map((a) => [a.id, !!(a.result !== undefined || a.error !== undefined)])
    );

    for (const { analysis, table, version } of toRun) {
      const dataMode = (analysis.options as { dataMode?: 'raw' | 'transformed' }).dataMode ?? 'raw';
      const effectiveData = getEffectiveTableData(table, dataMode);
      runAnalysisAsync(table.format, analysis.type, effectiveData, analysis.options)
        .then((result) => {
          const latest = useStore.getState();
          const t = latest.project.tables.find((x) => x.id === table.id);
          if ((t?.tableDataVersion ?? 0) !== version) return;
          if (result.ok) {
            latest.updateAnalysisResult(analysis.id, result.value);
          } else {
            latest.updateAnalysisError(analysis.id, result.error);
          }
        })
        .catch((err) => {
          const latest = useStore.getState();
          const t = latest.project.tables.find((x) => x.id === table.id);
          if ((t?.tableDataVersion ?? 0) !== version) return;
          latest.updateAnalysisError(
            analysis.id,
            err instanceof Error ? err.message : 'Analysis failed'
          );
        });
    }
  }, [project]);
}
