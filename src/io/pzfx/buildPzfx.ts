import type { Project, ColumnTableData, XYTableData } from '../../types';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function emitD(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '';
  return String(value);
}

export function buildPzfxDataOnly(project: Project): string {
  const sb: string[] = [];
  sb.push('<?xml version="1.0" encoding="UTF-8"?>');
  sb.push('<GraphPadPrismFile PrismXMLVersion="5.00">');
  sb.push('<TableSequence />');
  project.tables.forEach((table, idx) => {
    sb.push(`<Table ID="${idx + 1}" TableType="${table.format === 'xy' ? 'XY' : 'OneWay'}" XFormat="numbers" YFormat="replicates">`);
    sb.push(`<Title>${escapeXml(table.name)}</Title>`);
    if (table.format === 'column' && 'columnLabels' in table.data) {
      const d = table.data as ColumnTableData;
      d.columnLabels.forEach((label, c) => {
        sb.push('<YColumn>');
        sb.push(`<Title>${escapeXml(label)}</Title>`);
        sb.push('<Subcolumn>');
        d.rows.forEach((row) => {
          sb.push(`<d>${emitD(row[c] ?? null)}</d>`);
        });
        sb.push('</Subcolumn>');
        sb.push('</YColumn>');
      });
    } else if (table.format === 'xy' && 'x' in table.data) {
      const d = table.data as XYTableData;
      sb.push('<XColumn>');
      sb.push(`<Title>${escapeXml(d.xLabel)}</Title>`);
      sb.push('<Subcolumn>');
      d.x.forEach((v) => sb.push(`<d>${emitD(v)}</d>`));
      sb.push('</Subcolumn>');
      sb.push('</XColumn>');
      d.yLabels.forEach((label, yi) => {
        sb.push('<YColumn>');
        sb.push(`<Title>${escapeXml(label)}</Title>`);
        sb.push('<Subcolumn>');
        (d.ys[yi] ?? []).forEach((v) => sb.push(`<d>${emitD(v)}</d>`));
        sb.push('</Subcolumn>');
        sb.push('</YColumn>');
      });
    }
    sb.push('</Table>');
  });
  sb.push('</GraphPadPrismFile>');
  return sb.join('\n');
}
