import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

export function runDescriptive(
  columnLabels: string[],
  rows: (number | null)[][]
): AnalysisResult {
  const byColumn = columnLabels.map((label, c) => {
    const vals = rows
      .map((r) => r[c])
      .filter((v): v is number => v != null && Number.isFinite(v));
    const n = vals.length;
    if (n === 0) {
      return {
        label,
        n: 0,
        mean: NaN,
        sem: NaN,
        sd: NaN,
        median: NaN,
        q1: NaN,
        q3: NaN,
      };
    }
    const mean = jStat.mean(vals);
    const sd = n > 1 ? jStat.stdev(vals, true) : 0;
    const sem = n > 1 ? sd / Math.sqrt(n) : 0;
    const median = jStat.median(vals);
    const q1 = jStat.percentile(vals, 0.25);
    const q3 = jStat.percentile(vals, 0.75);
    return { label, n, mean, sem, sd, median, q1, q3 };
  });
  return { type: 'descriptive', byColumn };
}
