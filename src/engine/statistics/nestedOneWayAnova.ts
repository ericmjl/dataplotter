import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

/**
 * Nested one-way ANOVA: one grouping variable with nested replicates.
 * Column = experimental unit; groupForColumn assigns columns to groups. ANOVA on column means.
 * @spec PRISM-TBL-010
 */
export function runNestedOneWayAnova(
  columnLabels: string[],
  rows: (number | null)[][],
  groupLabels: string[],
  groupForColumn: number[]
): AnalysisResult {
  const colMeans = columnLabels.map((_, c) => {
    const vals = rows
      .map((r) => r[c])
      .filter((v): v is number => v != null && Number.isFinite(v));
    return vals.length > 0 ? jStat.mean(vals) : NaN;
  });

  const groupsByLabel = groupLabels.map((_label, g) => {
    const means: number[] = [];
    columnLabels.forEach((_, c) => {
      if (groupForColumn[c] === g && Number.isFinite(colMeans[c])) {
        means.push(colMeans[c]);
      }
    });
    return means;
  });

  const validGroups = groupsByLabel.filter((g) => g.length > 0);
  if (validGroups.length < 2) {
    const groupMeans = groupLabels.map((label, g) => ({
      label,
      mean: jStat.mean(groupsByLabel[g]) || NaN,
    }));
    return {
      type: 'nested_one_way_anova',
      f: NaN,
      p: NaN,
      dfBetween: validGroups.length - 1,
      dfWithin: validGroups.reduce((s, g) => s + g.length, 0) - validGroups.length,
      groupMeans,
    };
  }

  const f = jStat.anovafscore(...validGroups);
  const dfBetween = validGroups.length - 1;
  const n = validGroups.reduce((s, g) => s + g.length, 0);
  const dfWithin = n - validGroups.length;
  const p = dfWithin > 0 ? jStat.anovaftest(f, dfBetween, dfWithin) : NaN;

  const groupMeans = groupLabels.map((label, g) => ({
    label,
    mean: jStat.mean(groupsByLabel[g]) || NaN,
  }));

  return {
    type: 'nested_one_way_anova',
    f,
    p,
    dfBetween,
    dfWithin,
    groupMeans,
  };
}
