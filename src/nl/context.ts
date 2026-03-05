import type { Project } from '../types';
import { getAllowedAnalyses, getAllowedGraphTypes } from '../lib/tableRegistry';

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
  if (project.selection) {
    const sel = project.selection;
    if (sel.type === 'table') {
      const t = project.tables.find((x) => x.id === sel.tableId);
      parts.push(`Selected: table "${t?.name ?? '?'}" (${t?.format ?? '?'} format).`);
      if (t) {
        const analyses = getAllowedAnalyses(t.format);
        const graphTypes = getAllowedGraphTypes(t.format);
        parts.push(`Allowed analyses: ${analyses.join(', ')}. Allowed graph types: ${graphTypes.join(', ')}.`);
      }
    } else if (sel.type === 'analysis') {
      const a = project.analyses.find((x) => x.id === sel.analysisId);
      parts.push(`Selected: analysis "${a?.type ?? '?'}".`);
    } else if (sel.type === 'graph') {
      const g = project.graphs.find((x) => x.id === sel.graphId);
      parts.push(`Selected: graph "${g?.name ?? '?'}".`);
    }
  } else {
    parts.push('No selection.');
  }
  return parts.join('\n');
}
