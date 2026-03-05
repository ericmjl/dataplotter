import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

export function runOneWayAnova(
  columnLabels: string[],
  rows: (number | null)[][]
): AnalysisResult {
  const groups = columnLabels.map((_label, c) => {
    const vals = rows
      .map((r) => r[c])
      .filter((v): v is number => v != null && Number.isFinite(v));
    return vals;
  });
  const f = jStat.anovafscore(...groups);
  const df1 = groups.length - 1;
  const n = groups.reduce((s, g) => s + g.length, 0);
  const df2 = n - groups.length;
  const p = jStat.anovaftest(f, df1, df2);
  const groupMeans = groups.map((g, i) => ({
    label: columnLabels[i] ?? '',
    mean: jStat.mean(g),
  }));
  return {
    type: 'one_way_anova',
    f,
    p,
    dfBetween: df1,
    dfWithin: df2,
    groupMeans,
  };
}
