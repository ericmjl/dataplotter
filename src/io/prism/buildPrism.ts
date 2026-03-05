import JSZip from 'jszip';
import Papa from 'papaparse';
import type { Project, DataTable, ColumnTableData, XYTableData } from '../../types';
import { CURRENT_PROJECT_VERSION } from '../../types';

function tableToCSV(table: DataTable): string {
  if (table.format === 'column' && 'columnLabels' in table.data) {
    const d = table.data as ColumnTableData;
    const rows = [d.columnLabels, ...d.rows.map((row) => row.map((v) => (v == null ? '' : String(v))))];
    return Papa.unparse(rows);
  }
  if (table.format === 'xy' && 'x' in table.data) {
    const d = table.data as XYTableData;
    const header = [d.xLabel, ...d.yLabels];
    const rows = d.x.map((_, i) => [
      d.x[i] == null ? '' : String(d.x[i]),
      ...d.ys.map((col) => (col[i] == null ? '' : String(col[i]))),
    ]);
    return Papa.unparse([header, ...rows]);
  }
  return '';
}

export async function buildPrism(project: Project): Promise<Blob> {
  const zip = new JSZip();
  const manifest = {
    version: CURRENT_PROJECT_VERSION,
    tables: project.tables.map((t) => ({ id: t.id, name: t.name, format: t.format })),
    analyses: project.analyses.map((a) => ({ id: a.id, tableId: a.tableId, type: a.type })),
    graphs: project.graphs.map((g) => ({ id: g.id, tableId: g.tableId, analysisId: g.analysisId ?? null, name: g.name, graphType: g.graphType })),
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  const dataFolder = zip.folder('data');
  if (dataFolder) {
    for (const t of project.tables) {
      dataFolder.file(`${t.id}.csv`, tableToCSV(t));
    }
  }
  const analysesFolder = zip.folder('analyses');
  if (analysesFolder) {
    for (const a of project.analyses) {
      analysesFolder.file(`${a.id}.json`, JSON.stringify(a, null, 2));
    }
  }
  const graphsFolder = zip.folder('graphs');
  if (graphsFolder) {
    for (const g of project.graphs) {
      graphsFolder.file(`${g.id}.json`, JSON.stringify({ id: g.id, name: g.name, tableId: g.tableId, analysisId: g.analysisId, graphType: g.graphType, options: g.options }, null, 2));
    }
  }
  return zip.generateAsync({ type: 'blob' });
}
