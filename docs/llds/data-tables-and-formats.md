# LLD: Data tables and table formats

**Created**: 2026-03-06  
**Status**: Implemented (Column, XY, Grouped, Contingency, Survival, Parts of whole)  
**References**: [HLD](../high-level-design.md), [project layout](../reference/project-layout.md)

---

## Context and design philosophy

Table format drives which analyses and graph types the system offers. Prism supports eight formats; dataplotter currently implements two (Column, XY) with full stack. Full analysis parity (HLD) means that for each supported format, the clone will offer all Prism analyses applicable to that format. This LLD defines how to add and maintain formats so that registry, engine, and UI stay in sync (see how-to: [add a graph type](../how-to-guides/how-to-add-a-graph-type.md), [add an analysis type](../how-to-guides/how-to-add-an-analysis-type.md)). Each new format must have a defined data shape, schema/validation, allowed analyses and graph types, and a way to create/edit tables of that format.

---

## Current state: Column and XY

**Column:** `ColumnTableData`: `columnLabels`, `rows` (row-major grid), optional `groupLabels` and `groupForColumn` for grouped columns. Used for single grouping variable (e.g. control vs treated). Grouped display in UI is implemented as column data with group metadata. Column headers are editable in the grid (click to rename); adding a column appends a placeholder label "New column" so the user can name it immediately.

**XY:** `XYTableData`: `xLabel`, `yLabels`, `x` (one array), `ys` (array of Y arrays). Used for paired X/Y (e.g. concentration vs response, time series).

**Registry** (`src/lib/tableRegistry.ts`): `getSchema(format, data)`, `validateTableData(format, data)`, `validateForAnalysis(format, data, analysisType)`, `getAllowedAnalyses(format)`, `getAllowedGraphTypes(format)`, `getDefaultOptions(analysisType, format, tableData)`. All supported formats return concrete lists and schema.

---

## Table format catalog (target)

| Format ID | Data shape | Purpose | Status |
|-----------|------------|---------|--------|
| column | ColumnTableData | One grouping variable; replicates per column | ✅ Implemented |
| xy | XYTableData | X + one or more Y series | ✅ Implemented |
| grouped | GroupedTableData | Two grouping variables (rowGroupLabels × colGroupLabels); cellValues[row][col] = replicates | ✅ Implemented |
| contingency | ContingencyTableData | Integer counts; rowLabels, columnLabels, counts[][] | ✅ Implemented |
| survival | SurvivalTableData | Time + event; optional group; one row per subject | ✅ Implemented |
| partsOfWhole | PartsOfWholeTableData | labels[], values[] (sum to whole) | ✅ Implemented |
| multipleVariables | MultipleVariablesTableData (new) | One row per case, one column per variable | P3 / deferred |
| nested | (TBD) | Nested design | Deferred |

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
- Prism user guide (downloaded): table types and when to use each
