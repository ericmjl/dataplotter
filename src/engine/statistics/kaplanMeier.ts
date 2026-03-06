/**
 * Kaplan–Meier survival curve estimation.
 * @spec PRISM-ANA-010
 */

import type { AnalysisResult, SurvivalTableData } from '../../types';

export function runKaplanMeier(data: SurvivalTableData): AnalysisResult {
  const { times, events, groups } = data;
  const n = times.length;
  if (n === 0) {
    return { type: 'kaplan_meier', curves: [] };
  }

  if (groups?.length) {
    const groupSet = [...new Set(groups)];
    const curves: { group: string; time: number[]; survival: number[] }[] = [];
    for (const g of groupSet) {
      const idx = groups
        .map((_, i) => i)
        .filter((i) => groups[i] === g);
      const t = idx.map((i) => times[i]!);
      const e = idx.map((i) => events[i]!);
      const { time, survival } = kmCurve(t, e);
      curves.push({ group: g, time, survival });
    }
    return { type: 'kaplan_meier', curves };
  }

  const { time, survival } = kmCurve(times, events);
  return {
    type: 'kaplan_meier',
    curves: [{ group: 'All', time, survival }],
  };
}

function kmCurve(
  times: number[],
  events: number[]
): { time: number[]; survival: number[] } {
  const n = times.length;
  const order = times.map((_, i) => i).sort((a, b) => times[a]! - times[b]!);
  const time: number[] = [0];
  const survival: number[] = [1];
  let atRisk = n;
  let s = 1;
  for (const i of order) {
    const t = times[i]!;
    const ev = events[i]!;
    atRisk--;
    if (ev > 0) {
      s *= atRisk / (atRisk + 1);
    }
    time.push(t);
    survival.push(s);
  }
  return { time, survival };
}
