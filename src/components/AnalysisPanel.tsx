import { useStore } from '../store';
import { runAnalysis } from '../engine/statistics';

export function AnalysisPanel() {
  const project = useStore((s) => s.project);
  const updateAnalysisResult = useStore((s) => s.updateAnalysisResult);
  const updateAnalysisError = useStore((s) => s.updateAnalysisError);
  const selection = project.selection;

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

  function handleRun() {
    const result = runAnalysis(
      table!.format,
      analysis!.type,
      table!.data,
      analysis!.options
    );
    if (result.ok) {
      updateAnalysisResult(analysis!.id, result.value);
    } else {
      updateAnalysisError(analysis!.id, result.error);
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
        >
          Run
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
    return (
      <table className="data-grid" aria-label="Descriptive statistics">
        <thead>
          <tr>
            <th>Column</th>
            <th>n</th>
            <th>Mean</th>
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
  if (result.type === 'linear_regression') {
    return (
      <table className="data-grid" aria-label="Linear regression results">
        <tbody>
          <tr><td>Slope</td><td>{result.slope.toFixed(4)}</td></tr>
          <tr><td>Intercept</td><td>{result.intercept.toFixed(4)}</td></tr>
          <tr><td>R²</td><td>{result.r2.toFixed(4)}</td></tr>
          <tr><td>p</td><td>{result.p.toFixed(4)}</td></tr>
          <tr><td>95% CI (slope)</td><td>[{result.slopeCI[0].toFixed(4)}, {result.slopeCI[1].toFixed(4)}]</td></tr>
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
