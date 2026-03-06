import { useState } from 'react';
import { useStore } from '../store';
import { runAnalysisAsync } from '../engine/statistics';

export function AnalysisPanel() {
  const project = useStore((s) => s.project);
  const updateAnalysisResult = useStore((s) => s.updateAnalysisResult);
  const updateAnalysisError = useStore((s) => s.updateAnalysisError);
  const selection = project.selection;
  const [running, setRunning] = useState(false);

  if (selection?.type !== 'analysis') {
    return (
      <div className="main-area">
        <p>Select an analysis from the sidebar.</p>
      </div>
    );
  }

  const analysis = project.analyses.find((a) => a.id === selection.analysisId);
  if (!analysis) {
    return (
      <div className="main-area">
        <p>Analysis not found.</p>
      </div>
    );
  }

  const table = project.tables.find((t) => t.id === analysis.tableId);
  if (!table) {
    return (
      <div className="main-area">
        <p>Table for this analysis not found.</p>
      </div>
    );
  }

  async function handleRun() {
    if (!table || !analysis) return;
    setRunning(true);
    try {
      const result = await runAnalysisAsync(
        table.format,
        analysis.type,
        table.data,
        analysis.options
      );
      if (result.ok) {
        updateAnalysisResult(analysis.id, result.value);
      } else {
        updateAnalysisError(analysis.id, result.error);
      }
    } catch (err) {
      updateAnalysisError(
        analysis.id,
        err instanceof Error ? err.message : 'Analysis failed'
      );
    } finally {
      setRunning(false);
    }
  }

  const isStale = analysis.result === undefined && analysis.error === undefined;

  return (
    <div className="main-area" role="region" aria-label="Analysis panel">
      <h2 style={{ marginTop: 0 }}>{analysis.type}</h2>
      <div className="toolbar">
        <button
          type="button"
          onClick={handleRun}
          aria-label="Run analysis"
          disabled={running}
        >
          {running ? 'Running…' : 'Run'}
        </button>
      </div>
      {analysis.error && (
        <div className="validation-errors" role="alert" aria-live="polite">
          {analysis.error}
        </div>
      )}
      {isStale && !analysis.error && (
        <p>Stale — click Run to recompute.</p>
      )}
      {analysis.result && (
        <AnalysisResultTable result={analysis.result} />
      )}
    </div>
  );
}

function AnalysisResultTable({ result }: { result: import('../types').AnalysisResult }) {
  if (result.type === 'descriptive') {
    const hasBayesian = result.byColumn.some(
      (c) => c.meanCrI != null || c.meanSD != null
    );
    return (
      <table className="data-grid" aria-label="Descriptive statistics">
        <thead>
          <tr>
            <th>Column</th>
            <th>n</th>
            <th>Mean</th>
            {hasBayesian && <th>95% CrI (mean)</th>}
            {hasBayesian && <th>Mean SD</th>}
            <th>SEM</th>
            <th>SD</th>
            <th>Median</th>
            <th>Q1</th>
            <th>Q3</th>
          </tr>
        </thead>
        <tbody>
          {result.byColumn.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.n}</td>
              <td>{row.mean.toFixed(4)}</td>
              {hasBayesian && (
                <td>
                  {row.meanCrI != null
                    ? `[${row.meanCrI[0].toFixed(4)}, ${row.meanCrI[1].toFixed(4)}]`
                    : '—'}
                </td>
              )}
              {hasBayesian && (
                <td>{row.meanSD != null ? row.meanSD.toFixed(4) : '—'}</td>
              )}
              <td>{row.sem.toFixed(4)}</td>
              <td>{row.sd.toFixed(4)}</td>
              <td>{row.median.toFixed(4)}</td>
              <td>{row.q1.toFixed(4)}</td>
              <td>{row.q3.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.type === 'unpaired_ttest') {
    return (
      <table className="data-grid" aria-label="Unpaired t-test results">
        <tbody>
          <tr><td>t</td><td>{result.t.toFixed(4)}</td></tr>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          <tr><td>df</td><td>{result.df.toFixed(1)}</td></tr>
          <tr><td>Mean ({result.label1})</td><td>{result.mean1.toFixed(4)}</td></tr>
          <tr><td>Mean ({result.label2})</td><td>{result.mean2.toFixed(4)}</td></tr>
          <tr><td>95% CI</td><td>[{result.ci[0].toFixed(4)}, {result.ci[1].toFixed(4)}]</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'paired_ttest') {
    return (
      <table className="data-grid" aria-label="Paired t-test results">
        <tbody>
          <tr><td>t</td><td>{result.t.toFixed(4)}</td></tr>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          <tr><td>df</td><td>{result.df.toFixed(1)}</td></tr>
          <tr><td>Mean difference</td><td>{result.meanDiff.toFixed(4)}</td></tr>
          <tr><td>95% CI</td><td>[{result.ci[0].toFixed(4)}, {result.ci[1].toFixed(4)}]</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'one_way_anova') {
    return (
      <table className="data-grid" aria-label="One-way ANOVA results">
        <tbody>
          <tr><td>F</td><td>{result.f.toFixed(4)}</td></tr>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          <tr><td>df (between)</td><td>{result.dfBetween}</td></tr>
          <tr><td>df (within)</td><td>{result.dfWithin}</td></tr>
          {result.groupMeans.map((g) => (
            <tr key={g.label}><td>Mean ({g.label})</td><td>{g.mean.toFixed(4)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.type === 'two_way_anova') {
    return (
      <table className="data-grid" aria-label="Two-way ANOVA results">
        <tbody>
          <tr><td>Factor A (rows)</td><td>F = {result.fA.toFixed(4)}, p = {result.pA.toFixed(4)}, df = {result.dfA}</td></tr>
          <tr><td>Factor B (cols)</td><td>F = {result.fB.toFixed(4)}, p = {result.pB.toFixed(4)}, df = {result.dfB}</td></tr>
          <tr><td>Interaction</td><td>F = {result.fAB.toFixed(4)}, p = {result.pAB.toFixed(4)}, df = {result.dfAB}</td></tr>
          <tr><td>df (within)</td><td>{result.dfWithin}</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'chi_square') {
    return (
      <table className="data-grid" aria-label="Chi-square test results">
        <tbody>
          <tr><td>χ²</td><td>{result.chi2.toFixed(4)}</td></tr>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          <tr><td>df</td><td>{result.df}</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'fisher_exact') {
    return (
      <table className="data-grid" aria-label="Fisher's exact test results">
        <tbody>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          {result.oddsRatio != null && (
            <tr><td>Odds ratio</td><td>{result.oddsRatio.toFixed(4)}</td></tr>
          )}
        </tbody>
      </table>
    );
  }
  if (result.type === 'kaplan_meier') {
    return (
      <table className="data-grid" aria-label="Kaplan–Meier results">
        <tbody>
          {result.curves.map((cur) => (
            <tr key={cur.group}>
              <td>Curve ({cur.group})</td>
              <td>{cur.time.length} points</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.type === 'fraction_of_total') {
    return (
      <table className="data-grid" aria-label="Fraction of total">
        <thead>
          <tr><th>Label</th><th>Value</th><th>Fraction</th></tr>
        </thead>
        <tbody>
          {result.fractions.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.value.toFixed(4)}</td>
              <td>{(100 * row.fraction).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.type === 'mann_whitney') {
    return (
      <table className="data-grid" aria-label="Mann-Whitney U results">
        <tbody>
          <tr><td>U</td><td>{result.u.toFixed(2)}</td></tr>
          <tr><td>p</td><td>{Number.isFinite(result.p) ? result.p.toFixed(4) : '—'}</td></tr>
          <tr><td>Median ({result.label1})</td><td>{result.median1.toFixed(4)}</td></tr>
          <tr><td>Median ({result.label2})</td><td>{result.median2.toFixed(4)}</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'kruskal_wallis') {
    return (
      <table className="data-grid" aria-label="Kruskal-Wallis results">
        <tbody>
          <tr><td>H</td><td>{result.h.toFixed(4)}</td></tr>
          <tr><td>df</td><td>{result.df}</td></tr>
          <tr><td>p</td><td>{Number.isFinite(result.p) ? result.p.toFixed(4) : '—'}</td></tr>
          {result.groupMedians.map((row) => (
            <tr key={row.label}><td>Median ({row.label})</td><td>{row.median.toFixed(4)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (result.type === 'roc_auc') {
    return (
      <table className="data-grid" aria-label="ROC AUC results">
        <tbody>
          <tr><td>AUC</td><td>{Number.isFinite(result.auc) ? result.auc.toFixed(4) : '—'}</td></tr>
          <tr><td>n</td><td>{result.n}</td></tr>
          <tr><td>Score column</td><td>{result.labelScore}</td></tr>
          <tr><td>Outcome column</td><td>{result.labelOutcome}</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'normality_test') {
    return (
      <table className="data-grid" aria-label="Normality test results">
        <tbody>
          <tr><td>Column</td><td>{result.label}</td></tr>
          <tr><td>Passed (p &gt; 0.05)</td><td>{result.passed ? 'Yes' : 'No'}</td></tr>
          <tr><td>p</td><td>{Number.isFinite(result.p) ? result.p.toFixed(4) : '—'}</td></tr>
          <tr><td>Statistic (K²)</td><td>{Number.isFinite(result.statistic) ? result.statistic.toFixed(4) : '—'}</td></tr>
          <tr><td>Skewness</td><td>{result.skewness.toFixed(4)}</td></tr>
          <tr><td>Excess kurtosis</td><td>{result.kurtosis.toFixed(4)}</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'linear_regression') {
    const slope = Number(result.slope);
    const intercept = Number(result.intercept);
    const r2 = Number(result.r2);
    const p = Number(result.p);
    const [ci0, ci1] = result.slopeCI;
    return (
      <table className="data-grid" aria-label="Linear regression results">
        <tbody>
          <tr><td>Slope</td><td>{Number.isFinite(slope) ? slope.toFixed(4) : '—'}</td></tr>
          <tr><td>Intercept</td><td>{Number.isFinite(intercept) ? intercept.toFixed(4) : '—'}</td></tr>
          <tr><td>R²</td><td>{Number.isFinite(r2) ? r2.toFixed(4) : '—'}</td></tr>
          <tr><td>p</td><td>{Number.isFinite(p) ? p.toFixed(4) : '—'}</td></tr>
          <tr><td>95% CI (slope)</td><td>[{Number.isFinite(ci0) ? ci0.toFixed(4) : '—'}, {Number.isFinite(ci1) ? ci1.toFixed(4) : '—'}]</td></tr>
        </tbody>
      </table>
    );
  }
  if (result.type === 'dose_response_4pl') {
    return (
      <table className="data-grid" aria-label="4PL dose-response results">
        <tbody>
          <tr><td>EC50</td><td>{result.ec50.toFixed(4)}</td></tr>
          <tr><td>Bottom</td><td>{result.bottom.toFixed(4)}</td></tr>
          <tr><td>Top</td><td>{result.top.toFixed(4)}</td></tr>
          <tr><td>Hill slope</td><td>{result.hillSlope.toFixed(4)}</td></tr>
        </tbody>
      </table>
    );
  }
  return null;
}
