# LLD: In-table column transformations

**Created**: 2026-03-06
**Status**: Design (implementation per plan)
**References**: [HLD §3 Data prep](../high-level-design.md), [Architecture](../reference/architecture.md), [Project layout](../reference/project-layout.md)

---

## Context and goals

Users need to transform column values (e.g. log10, sqrt) without creating a new table or losing the link to raw data. Unlike Prism’s “transform → new table” flow, dataplotter keeps one table: raw data plus optional per-column transformation metadata. Users can toggle the table view between raw and transformed, and choose per-analysis and per-graph whether to use raw or transformed data.

---

## Data model

### ColumnTransformation

- **columnKey** (string): Identifies the column being transformed. Must match the table format’s column identifiers from the registry:
  - **Column format:** `col-0`, `col-1`, … (from `getSchema`: `id: \`col-${i}\``).
  - **XY format:** `x`, `y-0`, `y-1`, … (from `getSchema`: `id: 'x'`, `id: \`y-${i}\``).
- **equation** (string): Expression evaluated row-wise. Variables in the equation are the **effective** values of other columns at that row (see Equation application order). Result must be a number or null (invalid/missing input or evaluation error → null).

### DataTable extensions

- **transformations** (optional): `ColumnTransformation[]`. Empty or absent means no transforms.
- **viewMode** (optional): `'raw' | 'transformed'`. Affects only the table grid display. Default when absent: `'raw'`.

### Analysis and graph options

- **Analysis options:** Each analysis options type gains optional **dataMode**: `'raw' | 'transformed'`. Default when absent: `'raw'`.
- **Graph options:** **dataMode** (optional): `'raw' | 'transformed'`. Default when absent: `'raw'`.

---

## Equation semantics

### Variable names (allowed in equations)

- **Column table:** `col0`, `col1`, … (column index i → variable `col{i}`). Same order as `getSchema` column ids `col-0`, `col-1`.
- **XY table:** `x` for the X column; `y0`, `y1`, … for Y series (index i → `y{i}`). Matches column ids `x`, `y-0`, `y-1`.

Labels (e.g. “Concentration”) are for display only; equations use these stable variable names so that renaming a column does not break the equation.

### Allowed functions

Allowlist only; no arbitrary code. Suggested set: `log10`, `log`, `exp`, `sqrt`, `abs`, `round`, `min`, `max`. Document the full list in the how-to and in UI (e.g. equation editor placeholder or help). Constants `Math.E` and `Math.PI` can be allowed if the evaluator supports them.

### Application order

- Transformations are applied **in array order** of `transformations`. When computing “effective” data for mode `'transformed'`, each row is computed by:
  1. Start with raw row values mapped to variable names (e.g. col0, col1 or x, y0, y1).
  2. For each transformation in order: evaluate the equation for that row using **current** effective values (so the first transform sees raw; the second sees raw + first transformed column, etc.). Store the result in the transformed column; other columns keep their current effective value.
- So column B’s equation can reference column A’s transformed value if A’s transformation appears before B’s in the array. Dependency order is user’s responsibility (no cycle detection required for v1).

### Safety

- No `eval()` of arbitrary code. Use a restricted expression evaluator (allowlist of variable names and function names only). Disallowed names or runtime error (e.g. log of negative) → result null for that cell.

---

## Resolver contract

- **Module:** e.g. `src/lib/effectiveTableData.ts`.
- **Function:** `getEffectiveTableData(table: DataTable, mode: 'raw' | 'transformed'): table.data shape`.
  - **Behavior:** If `mode === 'raw'` or table has no transformations (or empty array), return `table.data` (same reference when no transforms). If `mode === 'transformed'` and table has at least one transformation, return a **new** object in the same shape (ColumnTableData or XYTableData) with transformed columns applied as above; untransformed columns copied from raw. Other formats (grouped, contingency, survival, partsOfWhole) return `table.data` unchanged (transformations not supported for those formats in v1).
- **Consumers:** TableView (display), AnalysisPanel (run analysis), GraphView and LayoutView (buildPlotlySpec). Each passes the appropriate mode (table.viewMode for table; analysis.options.dataMode / graph.options.dataMode for analysis/graph; default `'raw'` when absent).

---

## Invalidation

- When **raw table data** changes (`updateTableData`): existing behavior — clear result/error for all analyses linked to that table.
- When **transformations** are added, removed, or updated (`setTableTransformations`): clear result/error for all analyses linked to that table (effective data changed).
- **viewMode** and **dataMode** do not clear results; they only affect what data is passed on the next run or render.

---

## Table formats in scope

- **Column** and **XY** only for v1. Grouped, Contingency, Survival, Parts of whole: no transformation support in this LLD (return raw from resolver).

---

## UI behaviour

- **TableView:** Add/edit/remove transformation per column (equation editor); toolbar or header toggle “Show: Raw | Transformed” (sets `viewMode`). When `viewMode === 'transformed'`, the grid shows resolved data from `getEffectiveTableData(table, 'transformed')` and is **read-only** (no inverse transform for editing in v1). Optional: badge on transformed column header showing equation or short label.
- **AnalysisPanel:** When the table has transformations, show “Use data: Raw | Transformed” (wired to analysis.options.dataMode). Run analysis with `getEffectiveTableData(table, analysis.options.dataMode ?? 'raw')`.
- **GraphView / LayoutView:** “Use data: Raw | Transformed” in graph options; build spec with `getEffectiveTableData(table, graph.options.dataMode ?? 'raw')`.
- **Accessibility:** Use existing design tokens; ensure new controls have labels/aria.

---

## Persistence

- **JSON:** Include `transformations` and `viewMode` on each table; include `dataMode` in analysis options and graph options. Old JSON without these fields loads with undefined; resolver and options default to raw.
- **Prism/Pzfx export:** Export **raw** table data only; transformation metadata has no Prism equivalent and is not written to .pzfx/.prism.

---

## Store actions

- **setTableTransformations(tableId, transformations):** Set or replace the table’s transformations; clear analysis results for that table.
- **setTableViewMode(tableId, viewMode):** Set table’s viewMode (raw | transformed).
- **updateAnalysisOptions(analysisId, optionsPartial):** Add if not present, so that dataMode (and other option fields) can be updated without replacing the whole analysis. Required for “Use data: Raw | Transformed” in AnalysisPanel.
- **updateGraphOptions** already exists; use for graph dataMode.

---

## Version and migration

- New fields are optional. No project version bump required for backward compatibility; existing JSON continues to load. If the project schema later uses version for migrations, document that transformations/viewMode/dataMode are additive with defaults.
