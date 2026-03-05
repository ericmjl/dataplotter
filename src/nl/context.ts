import type { Project, AnalysisResult } from '../types';
import { getAllowedAnalyses, getAllowedGraphTypes } from '../lib/tableRegistry';

function formatAnalysisResultForContext(r: AnalysisResult): string {
  if (r.type === 'unpaired_ttest') return `p = ${r.p.toFixed(4)}`;
  if (r.type === 'one_way_anova') return `p = ${r.p.toFixed(4)}`;
  if (r.type === 'linear_regression') return `p = ${r.p.toFixed(4)}, r² = ${r.r2.toFixed(4)}`;
  if (r.type === 'dose_response_4pl') return `EC50, 4PL`;
  return r.type;
}

export function buildContext(project: Project): string {
  const parts: string[] = [];
  parts.push(`Project has ${project.tables.length} tables, ${project.analyses.length} analyses, ${project.graphs.length} graphs.`);
  for (const t of project.tables) {
    if (t.format === 'column' && 'columnLabels' in t.data) {
      parts.push(`Table "${t.name}" (id: ${t.id}): format=column, columnLabels=[${t.data.columnLabels.join(', ')}].`);
    } else if ('xLabel' in t.data) {
      parts.push(`Table "${t.name}" (id: ${t.id}): format=xy, xLabel=${t.data.xLabel}, yLabels=[${t.data.yLabels.join(', ')}].`);
    }
  }
  for (const g of project.graphs) {
    const analysis = g.analysisId ? project.analyses.find((a) => a.id === g.analysisId) : undefined;
    const resultStr = analysis?.result ? `; linked analysis: ${formatAnalysisResultForContext(analysis.result)}` : '';
    parts.push(`Graph "${g.name}" (id: ${g.id})${resultStr}.`);
  }
  if (project.selection) {
    const sel = project.selection;
    if (sel.type === 'table') {
      const t = project.tables.find((x) => x.id === sel.tableId);
      parts.push(`Selected: table "${t?.name ?? '?'}" (id: ${sel.tableId}).`);
      if (t) {
        const analyses = getAllowedAnalyses(t.format);
        const graphTypes = getAllowedGraphTypes(t.format);
        parts.push(`Allowed analyses: ${analyses.join(', ')}. Allowed graph types: ${graphTypes.join(', ')}.`);
      }
    } else if (sel.type === 'analysis') {
      const a = project.analyses.find((x) => x.id === sel.analysisId);
      parts.push(`Selected: analysis "${a?.type ?? '?'}" (id: ${sel.analysisId}).`);
    } else if (sel.type === 'graph') {
      const g = project.graphs.find((x) => x.id === sel.graphId);
      parts.push(`Selected: graph "${g?.name ?? '?'}" (id: ${sel.graphId}). Use this id for update_graph_options.`);
    }
  } else {
    parts.push('No selection.');
  }
  return parts.join('\n');
}
