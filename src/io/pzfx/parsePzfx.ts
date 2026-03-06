import type { Result } from '../../types';
import type { Project, DataTable, ColumnTableData, XYTableData } from '../../types';
import { CURRENT_PROJECT_VERSION } from '../../types';

function parseFloatOrNull(s: string): number | null {
  const t = s.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parsePzfx(buffer: ArrayBuffer): Result<Project> {
  const text = new TextDecoder().decode(buffer);
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const root = doc.documentElement;
  if (!root || root.nodeName !== 'GraphPadPrismFile') {
    return { ok: false, error: 'Not a valid Prism XML file.' };
  }

  const tables: DataTable[] = [];
  const tableEls = root.getElementsByTagName('Table');
  for (let i = 0; i < tableEls.length; i++) {
    const tableEl = tableEls[i];
    const tableType = tableEl.getAttribute('TableType') ?? '';
    const titleEl = tableEl.getElementsByTagName('Title')[0];
    const name = titleEl?.textContent?.trim() ?? `Table ${i + 1}`;
    const id = `table-${i}-${Date.now()}`;

    if (tableType === 'OneWay') {
      const yColumns = tableEl.getElementsByTagName('YColumn');
      const columnLabels: string[] = [];
      const rows: (number | null)[][] = [];
      let maxRows = 0;
      for (let c = 0; c < yColumns.length; c++) {
        const col = yColumns[c];
        const colTitle = col.getElementsByTagName('Title')[0];
        columnLabels.push(colTitle?.textContent?.trim() ?? `Col ${c + 1}`);
        const subcols = col.getElementsByTagName('Subcolumn');
        const colVals: (number | null)[] = [];
        if (subcols.length > 0) {
          const dEls = subcols[0].getElementsByTagName('d');
          for (let r = 0; r < dEls.length; r++) {
            const d = dEls[r];
            if (d.getAttribute('Excluded') === '1') {
              colVals.push(null);
            } else {
              colVals.push(parseFloatOrNull(d.textContent ?? ''));
            }
          }
        }
        maxRows = Math.max(maxRows, colVals.length);
        rows.push(colVals);
      }
      const nCols = columnLabels.length;
      const normalized: (number | null)[][] = Array.from({ length: maxRows }, (_, r) =>
        Array.from({ length: nCols }, (_, c) => rows[c]?.[r] ?? null)
      );
      const data: ColumnTableData = { columnLabels, rows: normalized };
      tables.push({ id, name, format: 'column', data });
    } else if (tableType === 'XY') {
      const xCol = tableEl.getElementsByTagName('XColumn')[0];
      const xLabel = xCol?.getElementsByTagName('Title')[0]?.textContent?.trim() ?? 'X';
      const x: (number | null)[] = [];
      if (xCol) {
        const subcols = xCol.getElementsByTagName('Subcolumn');
        if (subcols.length > 0) {
          const dEls = subcols[0].getElementsByTagName('d');
          for (let r = 0; r < dEls.length; r++) {
            const d = dEls[r];
            x.push(d.getAttribute('Excluded') === '1' ? null : parseFloatOrNull(d.textContent ?? ''));
          }
        }
      }
      const yLabels: string[] = [];
      const ys: (number | null)[][] = [];
      const yColumns = tableEl.getElementsByTagName('YColumn');
      for (let c = 0; c < yColumns.length; c++) {
        const col = yColumns[c];
        yLabels.push(col.getElementsByTagName('Title')[0]?.textContent?.trim() ?? `Y${c + 1}`);
        const subcols = col.getElementsByTagName('Subcolumn');
        const colVals: (number | null)[] = [];
        if (subcols.length > 0) {
          const dEls = subcols[0].getElementsByTagName('d');
          for (let r = 0; r < dEls.length; r++) {
            const d = dEls[r];
            colVals.push(d.getAttribute('Excluded') === '1' ? null : parseFloatOrNull(d.textContent ?? ''));
          }
        }
        ys.push(colVals);
      }
      const n = x.length;
      const ysPadded = ys.map((col) => {
        const arr = [...col];
        while (arr.length < n) arr.push(null);
        return arr.slice(0, n);
      });
      const data: XYTableData = { xLabel, yLabels, x, ys: ysPadded };
      tables.push({ id, name, format: 'xy', data });
    }
  }

  return {
    ok: true,
    value: {
      version: CURRENT_PROJECT_VERSION,
      tables,
      analyses: [],
      graphs: [],
      layouts: [],
      selection: null,
    },
  };
}
