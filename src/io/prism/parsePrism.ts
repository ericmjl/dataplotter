import JSZip from 'jszip';
import Papa from 'papaparse';
import type { Result } from '../../types';
import type { Project, DataTable, Analysis, Graph } from '../../types';
import { CURRENT_PROJECT_VERSION } from '../../types';
import { ProjectSchema, migrateProject } from '../../lib/projectSchema';

const manifestSchema = {
  version: 1 as number,
  tables: [] as { id: string; name: string; format: string }[],
  analyses: [] as { id: string; tableId: string; type: string }[],
  graphs: [] as { id: string; tableId: string; analysisId: string | null; name: string; graphType: string }[],
};

export async function parsePrism(blob: Blob): Promise<Result<Project>> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(blob);
  } catch {
    return { ok: false, error: 'Invalid or corrupted .prism file.' };
  }
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) {
    return { ok: false, error: 'manifest.json not found in .prism file.' };
  }
  const manifestText = await manifestFile.async('string');
  let manifest: typeof manifestSchema;
  try {
    manifest = JSON.parse(manifestText) as typeof manifestSchema;
  } catch {
    return { ok: false, error: 'Invalid manifest.json.' };
  }
  if (typeof manifest.version !== 'number' || manifest.version > CURRENT_PROJECT_VERSION) {
    return { ok: false, error: 'Unsupported .prism version.' };
  }

  const tables: DataTable[] = [];
  const dataFolder = zip.folder('data');
  if (dataFolder) {
    for (const entry of manifest.tables ?? []) {
      const file = dataFolder.file(`${entry.id}.csv`);
      if (!file) {
        return { ok: false, error: `Missing data/${entry.id}.csv` };
      }
      const csvText = await file.async('string');
      const parsed = Papa.parse<unknown[]>(csvText, { skipEmptyLines: true });
      const rows = parsed.data as (string | number)[][];
      if (rows.length < 1) {
        return { ok: false, error: `Empty table ${entry.id}.` };
      }
      const format = entry.format === 'xy' ? 'xy' : 'column';
      if (format === 'column') {
        const columnLabels = (rows[0] as string[]).map(String);
        const dataRows = rows.slice(1).map((row) =>
          (row as (string | number)[]).map((v) => {
            if (v === '' || v == null) return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          })
        );
        tables.push({
          id: entry.id,
          name: entry.name,
          format: 'column',
          data: { columnLabels, rows: dataRows },
        });
      } else {
        const header = rows[0] as string[];
        const xLabel = header[0] ?? 'X';
        const yLabels = header.slice(1).map(String);
        const dataRows = rows.slice(1);
        const x: (number | null)[] = [];
        const ys: (number | null)[][] = yLabels.map(() => []);
        for (const row of dataRows) {
          const r = row as (string | number)[];
          const xv = r[0];
          x.push(xv === '' || xv == null ? null : (Number.isFinite(Number(xv)) ? Number(xv) : null));
          for (let s = 0; s < yLabels.length; s++) {
            const v = r[s + 1];
            ys[s].push(v === '' || v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
          }
        }
        tables.push({
          id: entry.id,
          name: entry.name,
          format: 'xy',
          data: { xLabel, yLabels, x, ys },
        });
      }
    }
  }

  const analyses: Analysis[] = [];
  const analysesFolder = zip.folder('analyses');
  if (analysesFolder && manifest.analyses?.length) {
    const tableIds = new Set(tables.map((t) => t.id));
    for (const entry of manifest.analyses) {
      if (!tableIds.has(entry.tableId)) continue;
      const file = analysesFolder.file(`${entry.id}.json`);
      if (!file) continue;
      const text = await file.async('string');
      try {
        const a = JSON.parse(text) as Analysis;
        analyses.push(a);
      } catch {
        // skip invalid analysis
      }
    }
  }

  const graphs: Graph[] = [];
  const graphsFolder = zip.folder('graphs');
  if (graphsFolder && manifest.graphs?.length) {
    const tableIds = new Set(tables.map((t) => t.id));
    const analysisIds = new Set(analyses.map((a) => a.id));
    for (const entry of manifest.graphs) {
      if (!tableIds.has(entry.tableId)) continue;
      if (entry.analysisId != null && !analysisIds.has(entry.analysisId)) continue;
      const file = graphsFolder.file(`${entry.id}.json`);
      if (!file) continue;
      const text = await file.async('string');
      try {
        const g = JSON.parse(text) as Graph;
        graphs.push(g);
      } catch {
        // skip invalid graph
      }
    }
  }

  const project: Project = {
    version: CURRENT_PROJECT_VERSION,
    tables,
    analyses,
    graphs,
    selection: null,
  };
  const validated = ProjectSchema.safeParse(migrateProject(project));
  if (!validated.success) {
    return { ok: false, error: validated.error.message };
  }
  return { ok: true, value: validated.data as Project };
}
