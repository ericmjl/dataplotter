/**
 * Build .pzfx (Prism XML) from a Project for round-trip export.
 * @spec PRISM-WKF-011
 * Exports tables only (column and XY); analyses and graphs are not serialized to PZFX.
 * Lossy: re-import yields tables only; analyses/graphs must be recreated.
 */

import type { Project, DataTable, ColumnTableData, XYTableData } from '../../types';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnTableToXml(table: DataTable): string {
  const data = table.data as ColumnTableData;
  const { columnLabels, rows } = data;
  const nCols = columnLabels.length;
  const nRows = rows.length;
  const parts: string[] = [
    `<Table TableType="OneWay">`,
    `<Title>${escapeXml(table.name)}</Title>`,
  ];
  for (let c = 0; c < nCols; c++) {
    parts.push(`<YColumn>`, `<Title>${escapeXml(columnLabels[c] ?? '')}</Title>`, `<Subcolumn>`);
    for (let r = 0; r < nRows; r++) {
      const v = rows[r]?.[c];
      const excluded = v == null || Number.isNaN(v) ? ' Excluded="1"' : '';
      parts.push(`<d${excluded}>${v != null && Number.isFinite(v) ? String(v) : ''}</d>`);
    }
    parts.push(`</Subcolumn>`, `</YColumn>`);
  }
  parts.push(`</Table>`);
  return parts.join('');
}

function xyTableToXml(table: DataTable): string {
  const data = table.data as XYTableData;
  const { xLabel, yLabels, x, ys } = data;
  const n = x.length;
  const parts: string[] = [
    `<Table TableType="XY">`,
    `<Title>${escapeXml(table.name)}</Title>`,
    `<XColumn>`,
    `<Title>${escapeXml(xLabel)}</Title>`,
    `<Subcolumn>`,
  ];
  for (let r = 0; r < n; r++) {
    const v = x[r];
    const excluded = v == null || Number.isNaN(v) ? ' Excluded="1"' : '';
    parts.push(`<d${excluded}>${v != null && Number.isFinite(v) ? String(v) : ''}</d>`);
  }
  parts.push(`</Subcolumn>`, `</XColumn>`);
  for (let c = 0; c < yLabels.length; c++) {
    const col = ys[c] ?? [];
    parts.push(`<YColumn>`, `<Title>${escapeXml(yLabels[c] ?? '')}</Title>`, `<Subcolumn>`);
    for (let r = 0; r < n; r++) {
      const v = col[r] ?? null;
      const excluded = v == null || Number.isNaN(v) ? ' Excluded="1"' : '';
      parts.push(`<d${excluded}>${v != null && Number.isFinite(v) ? String(v) : ''}</d>`);
    }
    parts.push(`</Subcolumn>`, `</YColumn>`);
  }
  parts.push(`</Table>`);
  return parts.join('');
}

export function buildPzfx(project: Project): string {
  const xmlDecl = '<?xml version="1.0" encoding="UTF-8"?>';
  const tablesXml = project.tables
    .filter((t) => t.format === 'column' || t.format === 'xy')
    .map((t) => (t.format === 'column' ? columnTableToXml(t) : xyTableToXml(t)))
    .join('\n');
  return `${xmlDecl}\n<GraphPadPrismFile xmlns="http://graphpad.com/prism/xml/">\n${tablesXml}\n</GraphPadPrismFile>`;
}
