import { describe, it, expect } from 'vitest';
import { parsePzfx } from './parsePzfx';

function toBuffer(xml: string): ArrayBuffer {
  return new TextEncoder().encode(xml).buffer;
}

describe('parsePzfx', () => {
  it('returns error when root is not GraphPadPrismFile', () => {
    const xml = '<?xml version="1.0"?><OtherRoot></OtherRoot>';
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Not a valid Prism');
  });

  it('parses minimal OneWay (column) table', () => {
    const xml = `<?xml version="1.0"?>
<GraphPadPrismFile>
<Table TableType="OneWay">
<Title>ColTable</Title>
<YColumn><Title>A</Title><Subcolumn><d>1</d><d>2</d></Subcolumn></YColumn>
<YColumn><Title>B</Title><Subcolumn><d>3</d><d>4</d></Subcolumn></YColumn>
</Table>
</GraphPadPrismFile>`;
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.tables[0].name).toBe('ColTable');
    expect(result.value.tables[0].format).toBe('column');
    if (result.value.tables[0].format === 'column' && 'columnLabels' in result.value.tables[0].data && 'rows' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.columnLabels).toEqual(['A', 'B']);
      expect(result.value.tables[0].data.rows).toEqual([[1, 3], [2, 4]]);
    }
    expect(result.value.analyses).toHaveLength(0);
    expect(result.value.graphs).toHaveLength(0);
  });

  it('parses XY table', () => {
    const xml = `<?xml version="1.0"?>
<GraphPadPrismFile>
<Table TableType="XY">
<Title>XYTable</Title>
<XColumn><Title>X</Title><Subcolumn><d>1</d><d>2</d><d>3</d></Subcolumn></XColumn>
<YColumn><Title>Y</Title><Subcolumn><d>10</d><d>20</d><d>30</d></Subcolumn></YColumn>
</Table>
</GraphPadPrismFile>`;
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(1);
    expect(result.value.tables[0].name).toBe('XYTable');
    expect(result.value.tables[0].format).toBe('xy');
    if (result.value.tables[0].format === 'xy' && 'x' in result.value.tables[0].data) {
      expect(result.value.tables[0].data.xLabel).toBe('X');
      expect(result.value.tables[0].data.yLabels).toEqual(['Y']);
      expect(result.value.tables[0].data.x).toEqual([1, 2, 3]);
      expect(result.value.tables[0].data.ys).toEqual([[10, 20, 30]]);
    }
  });

  it('parses multiple tables', () => {
    const xml = `<?xml version="1.0"?>
<GraphPadPrismFile>
<Table TableType="OneWay"><Title>T1</Title><YColumn><Title>C</Title><Subcolumn><d>1</d></Subcolumn></YColumn></Table>
<Table TableType="OneWay"><Title>T2</Title><YColumn><Title>D</Title><Subcolumn><d>2</d></Subcolumn></YColumn></Table>
</GraphPadPrismFile>`;
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tables).toHaveLength(2);
    expect(result.value.tables[0].name).toBe('T1');
    expect(result.value.tables[1].name).toBe('T2');
  });

  it('treats Excluded="1" as null', () => {
    const xml = `<?xml version="1.0"?>
<GraphPadPrismFile>
<Table TableType="OneWay">
<Title>Ex</Title>
<YColumn><Title>A</Title><Subcolumn><d>1</d><d Excluded="1">2</d><d>3</d></Subcolumn></YColumn>
</Table>
</GraphPadPrismFile>`;
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    if (result.value.tables[0].format === 'column' && 'rows' in result.value.tables[0].data) {
      const col = result.value.tables[0].data.rows.map((r) => r[0]);
      expect(col).toEqual([1, null, 3]);
    }
  });

  it('returns empty tables array for valid root but no Table elements', () => {
    const xml = '<?xml version="1.0"?><GraphPadPrismFile></GraphPadPrismFile>';
    const result = parsePzfx(toBuffer(xml));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tables).toHaveLength(0);
  });
});
