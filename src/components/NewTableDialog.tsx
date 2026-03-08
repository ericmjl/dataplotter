import { useState } from 'react';
import type {
  ColumnTableData,
  XYTableData,
  GroupedTableData,
  ContingencyTableData,
  SurvivalTableData,
  PartsOfWholeTableData,
  MultipleVariablesTableData,
  NestedTableData,
} from '../types';
import { useStore } from '../store';

type DialogFormat =
  | 'xy'
  | 'column'
  | 'grouped'
  | 'contingency'
  | 'survival'
  | 'partsOfWhole'
  | 'multipleVariables'
  | 'nested';

const FORMAT_ORDER: DialogFormat[] = [
  'xy',
  'column',
  'grouped',
  'contingency',
  'survival',
  'partsOfWhole',
  'multipleVariables',
  'nested',
];

const FORMAT_LABELS: Record<DialogFormat, string> = {
  xy: 'XY',
  column: 'Column',
  grouped: 'Grouped',
  contingency: 'Contingency',
  survival: 'Survival',
  partsOfWhole: 'Parts of whole',
  multipleVariables: 'Multiple variables',
  nested: 'Nested',
};

const FORMAT_DESCRIPTIONS: Record<DialogFormat, string> = {
  xy: 'XY tables: Each point is defined by an X and Y coordinate.',
  column: 'Column tables have one grouping variable, with each group defined by a column.',
  grouped: 'Grouped tables have two grouping variables (rows × columns), with replicates per cell.',
  contingency: 'Contingency tables contain counts of subjects in categories (rows × columns).',
  survival: 'Survival tables: Each row tabulates the survival or censored time of a subject.',
  partsOfWhole: 'Parts of whole tables: Values that are fractions of a whole (e.g. pie chart).',
  multipleVariables: 'Multiple variables: One row per case, one column per variable (e.g. correlation, regression).',
  nested: 'Nested data: Hierarchical design when each treatment was tested in experimental replicates and each replicate was assessed multiple times (technical replicates).',
};

const EXAMPLE_GRAPH_ARIA: Record<DialogFormat, string> = {
  xy: 'Example: scatter or line graph',
  column: 'Example: bar chart',
  grouped: 'Example: grouped bar chart',
  contingency: 'Example: bar chart of counts',
  survival: 'Example: survival curve',
  partsOfWhole: 'Example: pie chart',
  multipleVariables: 'Example: scatter plot of variables',
  nested: 'Example: dot plot or nested bars',
};

/** Mini static SVG illustrating the typical graph for the given table format. */
export function ExampleGraphThumbnail({ format }: { format: DialogFormat }) {
  const vb = '0 0 120 50';
  const ariaLabel = EXAMPLE_GRAPH_ARIA[format];

  if (format === 'xy') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          <path d="M 10 38 L 35 28 L 55 22 L 80 15 L 105 8" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
          {[10, 35, 55, 80, 105].map((x, i) => (
            <circle key={i} cx={x} cy={[38, 28, 22, 15, 8][i]} r="3" fill="var(--accent)" />
          ))}
        </svg>
      </div>
    );
  }

  if (format === 'column') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          {[20, 45, 70, 95].map((x, i) => (
            <rect key={i} x={x - 6} y={50 - [18, 28, 14, 32][i]} width={10} height={[18, 28, 14, 32][i]} fill="var(--accent)" rx="1" />
          ))}
        </svg>
      </div>
    );
  }

  if (format === 'grouped') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          {[18, 42, 66].flatMap((x, i) => [
            <rect key={`a-${i}`} x={x - 8} y={50 - 20} width={6} height={20} fill="var(--accent)" rx="1" />,
            <rect key={`b-${i}`} x={x - 2} y={50 - 28} width={6} height={28} fill="var(--text-muted)" rx="1" />,
          ])}
        </svg>
      </div>
    );
  }

  if (format === 'contingency') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          {[25, 55, 85].map((x, i) => (
            <rect key={i} x={x - 8} y={50 - [12, 22, 16][i]} width={14} height={[12, 22, 16][i]} fill="var(--accent)" rx="1" />
          ))}
        </svg>
      </div>
    );
  }

  if (format === 'survival') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          <path d="M 10 10 L 35 10 L 35 22 L 60 22 L 60 35 L 95 35 L 95 48 L 110 48" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (format === 'partsOfWhole') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          <circle cx="60" cy="25" r="22" fill="none" stroke="var(--border-default)" strokeWidth="1" />
          <path d="M 60 25 L 60 3 A 22 22 0 0 1 78 20 Z" fill="var(--accent)" />
          <path d="M 60 25 L 78 20 A 22 22 0 0 1 60 47 Z" fill="var(--text-muted)" />
          <path d="M 60 25 L 60 47 A 22 22 0 0 1 42 20 Z" fill="var(--accent-subtle)" />
          <path d="M 60 25 L 42 20 A 22 22 0 0 1 60 3 Z" fill="var(--border-default)" />
        </svg>
      </div>
    );
  }

  if (format === 'multipleVariables') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          {[[15, 35], [30, 18], [45, 28], [60, 12], [75, 38], [90, 22], [105, 32]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill="var(--accent)" />
          ))}
        </svg>
      </div>
    );
  }

  if (format === 'nested') {
    return (
      <div className="new-table-visual-placeholder new-table-example-graph" role="img" aria-label={ariaLabel}>
        <svg viewBox={vb} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ minHeight: '5rem' }}>
          {[25, 60, 95].flatMap((x, i) =>
            [35, 40, 45].map((y, j) => (
              <circle key={`${i}-${j}`} cx={x + j * 4} cy={y} r="2" fill="var(--accent)" />
            ))
          )}
        </svg>
      </div>
    );
  }

  return null;
}

const previewTableStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  borderCollapse: 'collapse',
  width: '100%',
  color: 'var(--text-muted)',
  background: 'var(--bg-base)',
};
const previewCellStyle: React.CSSProperties = {
  border: '1px solid var(--border-default)',
  padding: '0.2rem 0.35rem',
  textAlign: 'left',
};

function TableFormatPreview({ format }: { format: DialogFormat }) {
  return (
    <div
      className="new-table-format-preview"
      role="img"
      aria-label={`Table structure preview for ${FORMAT_LABELS[format]} format`}
    >
      {format === 'xy' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>X</th>
              <th style={previewCellStyle}>Y1</th>
              <th style={previewCellStyle}>Y2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'column' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>A</th>
              <th style={previewCellStyle}>B</th>
              <th style={previewCellStyle}>C</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'grouped' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle} rowSpan={2}>
                —
              </th>
              <th style={previewCellStyle} colSpan={2}>
                Col1
              </th>
              <th style={previewCellStyle} colSpan={2}>
                Col2
              </th>
            </tr>
            <tr>
              <th style={previewCellStyle}>1</th>
              <th style={previewCellStyle}>2</th>
              <th style={previewCellStyle}>1</th>
              <th style={previewCellStyle}>2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>Ctrl</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>Trt</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'contingency' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>—</th>
              <th style={previewCellStyle}>A</th>
              <th style={previewCellStyle}>B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>Yes</td>
              <td style={previewCellStyle}>0</td>
              <td style={previewCellStyle}>0</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>No</td>
              <td style={previewCellStyle}>0</td>
              <td style={previewCellStyle}>0</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'survival' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>Time</th>
              <th style={previewCellStyle}>Event</th>
              <th style={previewCellStyle}>Group</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>0/1</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>0/1</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'partsOfWhole' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>Label</th>
              <th style={previewCellStyle}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>A</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>B</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>C</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'multipleVariables' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>Var1</th>
              <th style={previewCellStyle}>Var2</th>
              <th style={previewCellStyle}>Var3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
      {format === 'nested' && (
        <table style={previewTableStyle}>
          <thead>
            <tr>
              <th style={previewCellStyle}>S1</th>
              <th style={previewCellStyle}>S2</th>
              <th style={previewCellStyle}>S3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
            <tr>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
              <td style={previewCellStyle}>—</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

interface NewTableDialogProps {
  open: boolean;
  onClose: () => void;
}

type GroupRow = { name: string; replicates: number };

export function NewTableDialog({ open, onClose }: NewTableDialogProps) {
  const addTable = useStore((s) => s.addTable);
  const [format, setFormat] = useState<DialogFormat>('xy');
  const [dataSource, setDataSource] = useState<'enter' | 'tutorial'>('enter');
  const [name, setName] = useState('');
  const [columnLabelsStr, setColumnLabelsStr] = useState('A, B, C');
  const [xLabel, setXLabel] = useState('X');
  const [yLabelsStr, setYLabelsStr] = useState('Y');
  const [groupedRows, setGroupedRows] = useState<GroupRow[]>([
    { name: 'Control', replicates: 3 },
    { name: 'Treated', replicates: 3 },
  ]);
  const [contingencyRowLabels, setContingencyRowLabels] = useState('Yes, No');
  const [contingencyColLabels, setContingencyColLabels] = useState('A, B');
  const [survivalTimeLabel, setSurvivalTimeLabel] = useState('Time');
  const [survivalEventLabel, setSurvivalEventLabel] = useState('Event');
  const [partsLabelsStr, setPartsLabelsStr] = useState('A, B, C');
  const [variableLabelsStr, setVariableLabelsStr] = useState('Var1, Var2, Var3');
  const [nestedColumnLabelsStr, setNestedColumnLabelsStr] = useState('S1, S2, S3');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (format === 'column') {
      const columnLabels = columnLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (columnLabels.length === 0) return;
      const data: ColumnTableData = {
        columnLabels,
        rows: [],
      };
      addTable({ name: name || 'Column table', format: 'column', data });
    } else if (format === 'grouped') {
      const groups = groupedRows.filter((g) => g.name.trim() && g.replicates >= 1);
      if (groups.length === 0) return;
      const rowGroupLabels = groups.map((g) => g.name.trim());
      const colGroupLabels = ['Col1', 'Col2'];
      const a = rowGroupLabels.length;
      const b = colGroupLabels.length;
      const cellValues: (number | null)[][][] = Array.from({ length: a }, () =>
        Array.from({ length: b }, () => Array(2).fill(null))
      );
      const data: GroupedTableData = {
        rowGroupLabels,
        colGroupLabels,
        cellValues,
      };
      addTable({ name: name || 'Grouped table', format: 'grouped', data });
    } else if (format === 'contingency') {
      const rowLabels = contingencyRowLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const colLabels = contingencyColLabels.split(',').map((s) => s.trim()).filter(Boolean);
      if (rowLabels.length === 0 || colLabels.length === 0) return;
      const counts = Array.from({ length: rowLabels.length }, () =>
        Array.from({ length: colLabels.length }, () => 0)
      );
      const data: ContingencyTableData = { rowLabels, columnLabels: colLabels, counts };
      addTable({ name: name || 'Contingency table', format: 'contingency', data });
    } else if (format === 'survival') {
      const data: SurvivalTableData = {
        timeLabel: survivalTimeLabel || 'Time',
        eventLabel: survivalEventLabel || 'Event',
        groupLabels: ['Control', 'Treatment'],
        times: [],
        events: [],
      };
      addTable({ name: name || 'Survival table', format: 'survival', data });
    } else if (format === 'partsOfWhole') {
      const labels = partsLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (labels.length === 0) return;
      const data: PartsOfWholeTableData = {
        labels,
        values: labels.map(() => 0),
      };
      addTable({ name: name || 'Parts of whole', format: 'partsOfWhole', data });
    } else if (format === 'multipleVariables') {
      const variableLabels = variableLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (variableLabels.length === 0) return;
      const data: MultipleVariablesTableData = {
        variableLabels,
        rows: [],
      };
      addTable({ name: name || 'Multiple variables', format: 'multipleVariables', data });
    } else if (format === 'nested') {
      const columnLabels = nestedColumnLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (columnLabels.length < 2) return;
      const data: NestedTableData = {
        columnLabels,
        rows: [],
      };
      addTable({ name: name || 'Nested table', format: 'nested', data });
    } else {
      const yLabels = yLabelsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (yLabels.length === 0) return;
      const data: XYTableData = {
        xLabel: xLabel || 'X',
        yLabels,
        x: [],
        ys: yLabels.map(() => []),
      };
      addTable({ name: name || 'XY table', format: 'xy', data });
    }
    setName('');
    setColumnLabelsStr('A, B, C');
    setXLabel('X');
    setYLabelsStr('Y');
    setGroupedRows([{ name: 'Control', replicates: 3 }, { name: 'Treated', replicates: 3 }]);
    setContingencyRowLabels('Yes, No');
    setContingencyColLabels('A, B');
    onClose();
  }

  const defaultName =
    format === 'xy'
      ? 'XY table'
      : format === 'column'
        ? 'Column table'
        : format === 'grouped'
          ? 'Grouped table'
          : format === 'contingency'
            ? 'Contingency table'
            : format === 'survival'
              ? 'Survival table'
              : format === 'partsOfWhole'
                ? 'Parts of whole'
                : format === 'multipleVariables'
                  ? 'Multiple variables'
                  : 'Nested table';

  return (
    <div
      className="new-table-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-table-dialog-title"
    >
      <div className="new-table-modal-panel">
        <nav className="new-table-sidebar" aria-label="Table format">
          <div className="new-table-sidebar-section">NEW TABLE & GRAPH</div>
          {FORMAT_ORDER.map((f) => (
            <button
              key={f}
              type="button"
              className={`new-table-sidebar-item ${format === f ? 'selected' : ''}`}
              onClick={() => setFormat(f)}
              aria-pressed={format === f}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
          <div className="new-table-sidebar-section" style={{ marginTop: '0.5rem' }}>
            EXISTING FILE
          </div>
          <button type="button" className="new-table-sidebar-item" disabled aria-disabled="true">
            Clone a Graph
          </button>
        </nav>

        <form onSubmit={handleSubmit} className="new-table-content">
          <h2 id="new-table-dialog-title">New Data Table and Graph</h2>
          <p className="new-table-content-desc">{FORMAT_DESCRIPTIONS[format]}</p>

          <div className="new-table-visual-row">
            <TableFormatPreview format={format} />
            <ExampleGraphThumbnail format={format} />
            <a href="#" className="new-table-learn-more" onClick={(e) => e.preventDefault()}>
              ? Learn more
            </a>
          </div>

          <fieldset className="new-table-data-options">
            <legend>Data table:</legend>
            <div className="new-table-radio-group">
              <label>
                <input
                  type="radio"
                  name="dataSource"
                  checked={dataSource === 'enter'}
                  onChange={() => setDataSource('enter')}
                  aria-label="Enter or import data into a new table"
                />
                Enter or import data into a new table
              </label>
              <label>
                <input
                  type="radio"
                  name="dataSource"
                  checked={dataSource === 'tutorial'}
                  onChange={() => setDataSource('tutorial')}
                  disabled
                  aria-label="Start with sample data to follow a tutorial (to be implemented)"
                />
                Start with sample data to follow a tutorial (to be implemented)
              </label>
            </div>
          </fieldset>

          {dataSource === 'enter' && (
            <div className="new-table-creation-fields">
              <div className="dialog-field">
                <label htmlFor="new-table-name" className="dialog-label">
                  Table name
                </label>
                <input
                  id="new-table-name"
                  type="text"
                  className="dialog-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultName}
                  aria-label="Table name"
                />
              </div>

              {format === 'column' && (
                <div className="dialog-field">
                  <label htmlFor="columnLabels" className="dialog-label">
                    Column labels (comma-separated)
                  </label>
                  <input
                    id="columnLabels"
                    type="text"
                    className="dialog-input"
                    value={columnLabelsStr}
                    onChange={(e) => setColumnLabelsStr(e.target.value)}
                    placeholder="A, B, C"
                    aria-label="Column labels"
                  />
                </div>
              )}
              {format === 'grouped' && (
                <div className="dialog-field">
                  <span className="dialog-label">Groups (name + number of replicate columns)</span>
                  {groupedRows.map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginTop: '0.375rem',
                      }}
                    >
                      <input
                        type="text"
                        className="dialog-input"
                        value={row.name}
                        onChange={(e) =>
                          setGroupedRows((prev) =>
                            prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r))
                          )}
                        placeholder="Group name"
                        aria-label={`Group ${i + 1} name`}
                      />
                      <input
                        type="number"
                        min={1}
                        className="dialog-input"
                        style={{ width: '4rem' }}
                        value={row.replicates}
                        onChange={(e) =>
                          setGroupedRows((prev) =>
                            prev.map((r, j) =>
                              j === i
                                ? { ...r, replicates: Math.max(1, parseInt(e.target.value, 10) || 1) }
                                : r
                            )
                          )}
                        aria-label={`Group ${i + 1} replicates`}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>cols</span>
                      {groupedRows.length > 1 && (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '0.2rem 0.4rem' }}
                          onClick={() => setGroupedRows((prev) => prev.filter((_, j) => j !== i))}
                          aria-label={`Remove group ${i + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setGroupedRows((prev) => [...prev, { name: '', replicates: 2 }])}
                  >
                    + Add group
                  </button>
                </div>
              )}
              {format === 'contingency' && (
                <>
                  <div className="dialog-field">
                    <label htmlFor="contingencyRows" className="dialog-label">
                      Row labels (comma-separated)
                    </label>
                    <input
                      id="contingencyRows"
                      type="text"
                      className="dialog-input"
                      value={contingencyRowLabels}
                      onChange={(e) => setContingencyRowLabels(e.target.value)}
                      placeholder="Yes, No"
                      aria-label="Row labels"
                    />
                  </div>
                  <div className="dialog-field">
                    <label htmlFor="contingencyCols" className="dialog-label">
                      Column labels (comma-separated)
                    </label>
                    <input
                      id="contingencyCols"
                      type="text"
                      className="dialog-input"
                      value={contingencyColLabels}
                      onChange={(e) => setContingencyColLabels(e.target.value)}
                      placeholder="A, B"
                      aria-label="Column labels"
                    />
                  </div>
                </>
              )}
              {format === 'survival' && (
                <>
                  <div className="dialog-field">
                    <label htmlFor="survivalTimeLabel" className="dialog-label">
                      Time column label
                    </label>
                    <input
                      id="survivalTimeLabel"
                      type="text"
                      className="dialog-input"
                      value={survivalTimeLabel}
                      onChange={(e) => setSurvivalTimeLabel(e.target.value)}
                    />
                  </div>
                  <div className="dialog-field">
                    <label htmlFor="survivalEventLabel" className="dialog-label">
                      Event column label
                    </label>
                    <input
                      id="survivalEventLabel"
                      type="text"
                      className="dialog-input"
                      value={survivalEventLabel}
                      onChange={(e) => setSurvivalEventLabel(e.target.value)}
                    />
                  </div>
                </>
              )}
              {format === 'partsOfWhole' && (
                <div className="dialog-field">
                  <label htmlFor="partsLabels" className="dialog-label">
                    Labels (comma-separated)
                  </label>
                  <input
                    id="partsLabels"
                    type="text"
                    className="dialog-input"
                    value={partsLabelsStr}
                    onChange={(e) => setPartsLabelsStr(e.target.value)}
                    placeholder="A, B, C"
                  />
                </div>
              )}
              {format === 'multipleVariables' && (
                <div className="dialog-field">
                  <label htmlFor="variableLabels" className="dialog-label">
                    Variable labels (comma-separated)
                  </label>
                  <input
                    id="variableLabels"
                    type="text"
                    className="dialog-input"
                    value={variableLabelsStr}
                    onChange={(e) => setVariableLabelsStr(e.target.value)}
                    placeholder="Var1, Var2, Var3"
                    aria-label="Variable labels"
                  />
                </div>
              )}
              {format === 'nested' && (
                <div className="dialog-field">
                  <label htmlFor="nestedColumnLabels" className="dialog-label">
                    Column labels (comma-separated, at least 2)
                  </label>
                  <input
                    id="nestedColumnLabels"
                    type="text"
                    className="dialog-input"
                    value={nestedColumnLabelsStr}
                    onChange={(e) => setNestedColumnLabelsStr(e.target.value)}
                    placeholder="S1, S2, S3"
                    aria-label="Nested column labels"
                  />
                </div>
              )}
              {format === 'xy' && (
                <>
                  <div className="dialog-field">
                    <label htmlFor="xLabel" className="dialog-label">
                      X axis label
                    </label>
                    <input
                      id="xLabel"
                      type="text"
                      className="dialog-input"
                      value={xLabel}
                      onChange={(e) => setXLabel(e.target.value)}
                      aria-label="X axis label"
                    />
                  </div>
                  <div className="dialog-field">
                    <label htmlFor="yLabels" className="dialog-label">
                      Y series labels (comma-separated)
                    </label>
                    <input
                      id="yLabels"
                      type="text"
                      className="dialog-input"
                      value={yLabelsStr}
                      onChange={(e) => setYLabelsStr(e.target.value)}
                      placeholder="Y"
                      aria-label="Y series labels"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="new-table-modal-footer">
            <button type="button" onClick={onClose} aria-label="Cancel">
              Cancel
            </button>
            <button
              type="submit"
              className="dialog-submit"
              aria-label="Create table"
              disabled={dataSource === 'tutorial'}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
