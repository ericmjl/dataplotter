# LLD: Data tables and table formats

**Created**: 2026-03-06  
**Status**: Implemented (Column, XY, Grouped, Contingency, Survival, Parts of whole); Multiple variables and Nested specified, deferred.  
**References**: [HLD](../high-level-design.md), [project layout](../reference/project-layout.md), [Prism: Using Prism's data table](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm) and scraped child pages (`scripts/prism_guide_pages` with `--section data_tables`).

---

## Context and design philosophy

Table format drives which analyses and graph types the system offers. **Prism supports eight kinds of data tables** (see [Distinguishing the eight kinds](https://www.graphpad.com/guides/prism/latest/user-guide/distinguishing_the_six_kinds_o.htm)); the clone shall support all eight. Full analysis parity (HLD) means that for each supported format, the clone will offer all Prism analyses applicable to that format. This LLD defines how to add and maintain formats so that registry, engine, and UI stay in sync (see how-to: [add a graph type](../how-to-guides/how-to-add-a-graph-type.md), [add an analysis type](../how-to-guides/how-to-add-an-analysis-type.md)). Each new format must have a defined data shape, schema/validation, allowed analyses and graph types, and a way to create/edit tables of that format. Design is informed by the scraped Prism user guide (Data tables section).

---

## Current state: Column and XY

**Column:** `ColumnTableData`: `columnLabels`, `rows` (row-major grid), optional `groupLabels` and `groupForColumn` for grouped columns. Used for single grouping variable (e.g. control vs treated). Grouped display in UI is implemented as column data with group metadata. Column headers are editable in the grid (click to rename); adding a column appends a placeholder label "New column" so the user can name it immediately.

**XY:** `XYTableData`: `xLabel`, `yLabels`, `x` (one array), `ys` (array of Y arrays). Used for paired X/Y (e.g. concentration vs response, time series).

**Registry** (`src/lib/tableRegistry.ts`): `getSchema(format, data)`, `validateTableData(format, data)`, `validateForAnalysis(format, data, analysisType)`, `getAllowedAnalyses(format)`, `getAllowedGraphTypes(format)`, `getDefaultOptions(analysisType, format, tableData)`. All supported formats return concrete lists and schema.

---

## Table format catalog (target)

Per the [Prism user guide](https://www.graphpad.com/guides/prism/latest/user-guide/using_data_table_format.htm), the eight kinds are:

| Format ID | Data shape | Purpose (from Prism guide) | Status |
|-----------|------------|----------------------------|--------|
| column | ColumnTableData | One grouping variable; each column defines a group (e.g. control vs. treated). Replicates per column; Prism computes error bars. | ✅ Implemented |
| xy | XYTableData | Every point defined by X and Y; one X column, one or more Y data sets; subcolumns for replicates or error. Used for regression, curve fit. | ✅ Implemented |
| grouped | GroupedTableData | Two grouping variables (rows × columns); e.g. male vs. female × control vs. treated. cellValues[row][col] = replicates. | ✅ Implemented |
| contingency | ContingencyTableData | Actual counts of subjects/observations in categories (rows × columns). Integer counts only; Chi-square, Fisher's exact. | ✅ Implemented |
| survival | SurvivalTableData | One row per subject; time (X) and event code (Y: 1 = event, 0 = censored). Kaplan–Meier, log-rank, Gehan–Wilcoxon. | ✅ Implemented |
| partsOfWhole | PartsOfWholeTableData | Values that are fractions of a whole; labels + values. Fraction of total, Chi-square goodness of fit; pie charts. | ✅ Implemented |
| multipleVariables | MultipleVariablesTableData (new) | One row per case (e.g. subject), one column per variable; no subcolumns. Correlation matrix, multiple regression, extract/rearrange. | [D] Deferred |
| nested | NestedTableData (TBD) | Two levels of nested/hierarchical replication (e.g. rats within treatment, repeated measures per rat). Nested t-test, nested one-way ANOVA. | [D] Deferred |

---

## Data shapes (new formats)

**GroupedTableData:** Two grouping dimensions. Suggested shape:

- `rowGroupLabels: string[]` (e.g. Male, Female)
- `colGroupLabels: string[]` (e.g. Control, Treated)
- `subcolumnsPerCell: number` (replicates per row×col cell)
- **Implemented:** `cellValues: (number | null)[][][]` — cellValues[rowIdx][colIdx] = array of replicates per cell. Must support “mean ± error” and “each replicate” for graphs.

**ContingencyTableData:** Integer counts only.

- `rowLabels: string[]`
- `columnLabels: string[]`
- `counts: number[][]` — counts[i][j] = count for row i, column j.

**SurvivalTableData** (implemented):

- `timeLabel`, `eventLabel`, optional `groupLabel`
- `times: number[]`, `events: number[]` — one pair per subject; optional `groups: string[]` for stratified Kaplan–Meier.

**PartsOfWholeTableData:** Values that sum to a whole (e.g. 100%).

- `labels: string[]`
- `values: number[]` — same length as labels; typically one “column” of data.

**MultipleVariablesTableData:** Case × variable matrix.

- `variableLabels: string[]`
- `rows: (number | null)[][]` — rows[i] = values for case i across variables. No subcolumns; used for correlation matrix, multiple regression, etc.

---

## Registry contract

For each format that is “supported”:

1. **getSchema(format, data?):** Returns `TableSchema` (columns, optional row labels) so the grid or specialized UI can render headers and cells.
2. **validateTableData(format, data):** Returns success or validation errors (e.g. contingency must be integers; survival event codes in {0,1}).
3. **getAllowedAnalyses(format):** Returns `AnalysisTypeId[]` for that format.
4. **getAllowedGraphTypes(format):** Returns `GraphTypeId[]` for that format.
5. **getDefaultOptions(analysisType, format)** and **getDefaultOptions(graphType, format):** Return default options when creating an analysis or graph from this format.

Adding a format requires: (1) extend `project.ts` if the format ID already exists or add it; (2) add data type in types (or reuse a generic); (3) extend `projectSchema.ts` / validation for save/load; (4) implement the four registry functions for that format; (5) add UI to create and edit tables (NewTableDialog + TableView/DataGrid or custom editor).

---

## UI considerations

- **NewTableDialog:** Today offers “Column”, “Grouped” (→ column with groups), “XY”. Must grow to list only formats that are implemented (registry-driven or explicit list). Creating “Grouped” as its own format (grouped) would imply a GroupedTableData shape and a grid that shows row groups × column groups × subcolumns.
- **TableView / DataGrid:** Column and XY use a generic grid. Contingency might be a simple grid (numbers only). Survival might be two columns (time, event) plus optional group. Parts of whole might be a single column + labels. Multiple variables = standard grid. Grouped may need a custom layout (e.g. nested headers).
- **Import:** Prism/Pzfx import already parses some table types; import can map to the closest supported format and optionally drop or coerce unsupported structures.

---

## Table grid interaction (Excel-like)

**Goal:** Data entry in table grids shall feel like a spreadsheet: keyboard-first navigation, clear focus and edit states, and predictable commit/cancel. See HLD design decision "Table interaction" and EARS PRISM-TBL-011 through PRISM-TBL-020.

### States

- **Navigate:** One cell (or header) has *focus*; it is visually indicated (e.g. outline or highlight). No inline editor is active; the cell value is displayed as text.
- **Edit:** The focused cell is in *edit mode*: an input (or equivalent) is rendered in that cell, has DOM focus, and the user can change the value. Committing or cancelling exits edit mode and returns to Navigate.

Transitions: *Navigate → Edit* on Enter or F2 or double-click. *Edit → Navigate* on Escape (cancel, discard in-cell changes), or on Enter/Tab (commit and move), or on blur (commit and stay in Navigate). Clicking another cell from Navigate moves focus; clicking another cell from Edit commits the current cell and moves focus (then optionally enters edit on the new cell if Enter was not used, or leave to single Enter).

### Keyboard behavior

| Key | In Navigate | In Edit |
|-----|-------------|--------|
| **Arrow Up/Down/Left/Right** | Move focus to the adjacent cell in that direction; do not enter edit. At grid edges, do not wrap (or wrap by product decision). | Default browser behavior (cursor movement in text); do not move focus. |
| **Enter** | Enter edit mode for the focused cell. | Commit the value, exit edit, move focus down (same column, next row). If at last row, stay at same cell or add row (product decision). |
| **Shift+Enter** | (Optional) Enter edit, or move focus up. | Commit and move focus up. |
| **Tab** | Move focus to next cell (row-first: right, then wrap to next row). | Commit and move focus to next cell (same as Navigate Tab). |
| **Shift+Tab** | Move focus to previous cell. | Commit and move focus to previous cell. |
| **Escape** | No-op (or blur grid). | Exit edit and return to cell selection (Navigate) on the same cell; discard in-cell changes. Matches Excel. |
| **F2** | Enter edit mode for the focused cell. | No-op or place cursor at end (product decision). |

Header cells (column names, group headers): if they are editable (e.g. Column table), same Enter/F2 to edit, Escape to cancel, Enter to commit. Arrow keys in Navigate may move between header and body or within header row as needed.

### Focus and accessibility

- The grid (or a wrapper) is focusable (e.g. `tabIndex={0}`) so keyboard users can tab into it. Once inside, arrow keys move between cells without leaving the grid.
- Focus is *managed*: the grid tracks the current (row, col) or cell key and renders focus indicator and, in edit mode, the input. Avoid relying on native tab order for data cells (too many tab stops); use a single grid focus and arrow keys.
- ARIA: `role="grid"`, `aria-rowindex`, `aria-colindex`, and for the active cell `aria-selected="true"` when in Navigate; the edited cell contains a focused `input`/`combobox` with appropriate `aria-label`. Screen reader users get "row X, column Y" and "editing" when in edit mode.

### Scope

- Applies to all editable data grids: Column/XY (DataGrid), Grouped, Contingency, Survival (wide and tidy), Parts of whole. Read-only views (e.g. transformed view, tidy view for column/xy when read-only) may show the same grid structure but without edit mode; arrow keys can still move focus for review.
- Special grids (e.g. Survival with group columns, or cells that are dropdowns) still follow the same Navigate vs Edit model: in Navigate, arrow keys move; Enter/F2 enter edit; in Edit, the control (input, select) has focus and Escape cancels, Enter/Tab commit and move.

---

## Open questions and future decisions

### Resolved

1. ✅ **Grouped vs column:** Current “Grouped” in UI is column + group metadata. For full Prism-like grouped, we introduce a distinct `grouped` format and GroupedTableData so two-way ANOVA and grouped bar charts have a clear data model.
2. ✅ **One registry module:** Keep a single `tableRegistry.ts` with format-based branching; avoid separate registries per format.

### Deferred

1. **Exact GroupedTableData shape:** Flat array with (rowGroupIdx, colGroupIdx, subcolIdx) vs nested arrays; affects engine and chart code.
2. **Info sheets / text blocks:** Out of scope for this LLD; see project-and-workflows LLD if added later.
3. **Excluded values (blue italics):** Prism allows marking cells as excluded from analysis; can be a later extension (e.g. `excluded?: boolean[][]` or cell metadata).

---

## References

- `src/types/project.ts` — TableFormatId, ColumnTableData, XYTableData
- `src/lib/tableRegistry.ts` — schema, validation, allowed analyses/graphs
- `src/components/NewTableDialog.tsx`, `TableView.tsx`, `DataGrid.tsx`
- **Prism user guide (scraped):** [Using Prism's data table](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm) and child pages. Re-download with `uv run scripts/prism_guide_pages/download_prism_guide.py --section data_tables`. Key pages: distinguishing_the_six_kinds_o (eight kinds), creating_data_tables, column_tables, xy_table, two_grouping_variable_table, contingency_table, survival_table, about_parts_of_whole, multiple-variable-tables, nested-tables.
