import jStat from 'jstat';
import type { AnalysisResult } from '../../types';

/**
 * Pearson correlation matrix for multiple variables (one row per case, one column per variable).
 * @spec PRISM-TBL-009
 */
export function runCorrelation(
  variableLabels: string[],
  rows: (number | null)[][]
): AnalysisResult {
  const nVars = variableLabels.length;
  const r: number[][] = Array.from({ length: nVars }, () => Array(nVars).fill(0));
  const n: number[][] = Array.from({ length: nVars }, () => Array(nVars).fill(0));

  for (let i = 0; i < nVars; i++) {
    r[i][i] = 1;
    n[i][i] = rows.filter((row) => {
      const v = row[i];
      return v != null && Number.isFinite(v);
    }).length;
    for (let j = i + 1; j < nVars; j++) {
      const pairs: { x: number; y: number }[] = [];
      for (let row = 0; row < rows.length; row++) {
        const xi = rows[row][i];
        const yj = rows[row][j];
        if (xi != null && Number.isFinite(xi) && yj != null && Number.isFinite(yj)) {
          pairs.push({ x: xi, y: yj });
        }
      }
      const nn = pairs.length;
      n[i][j] = nn;
      n[j][i] = nn;
      if (nn < 2) {
        r[i][j] = NaN;
        r[j][i] = NaN;
      } else {
        const cor = (jStat as unknown as { corrcoeff(a: number[], b: number[]): number }).corrcoeff(
          pairs.map((p) => p.x),
          pairs.map((p) => p.y)
        );
        r[i][j] = cor;
        r[j][i] = cor;
      }
    }
  }

  return {
    type: 'correlation',
    labels: variableLabels,
    r,
    n,
  };
}
