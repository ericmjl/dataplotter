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
  const groupMeans = groups.map((g, i) => {
    const mean = jStat.mean(g);
    const n = g.length;
    const sd = n > 1 ? jStat.stdev(g, true) : 0;
    const sem = n > 1 ? sd / Math.sqrt(n) : 0;
    const meanCrI: [number, number] | undefined =
      n > 0 && Number.isFinite(mean) && sem > 0
        ? [mean - 1.96 * sem, mean + 1.96 * sem]
        : undefined;
    return {
      label: columnLabels[i] ?? '',
      mean,
      ...(meanCrI && { meanCrI }),
    };
  });
  return {
    type: 'one_way_anova',
    f,
    p,
    dfBetween: df1,
    dfWithin: df2,
    groupMeans,
  };
}
