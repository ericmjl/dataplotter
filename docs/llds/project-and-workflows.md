# LLD: Project state and workflows

**Created**: 2026-03-06  
**Status**: Implemented (layouts, wand, Pzfx export)  
**References**: [HLD](../high-level-design.md), [architecture](../reference/architecture.md)

---

## Context and design philosophy

The project is a single document: tables, analyses, graphs, and selection. Persistence is JSON with Prism/Pzfx import and export (round-trip in scope per HLD). Workflows (create table → analyze → graph, hot-linking, reuse) are realized through store actions and UI; no scripting. This LLD describes the current project model and selection/persistence behavior, then outlines future workflow extensions (layouts, wand) that align with the Prism clone vision without committing to implementation order.

---

## Project state (current)

**Store:** `src/store/projectSlice.ts` + `uiSlice.ts`; combined in `src/store/index.ts`.

**Project shape** (`src/types/project.ts`):

- `version`: number (CURRENT_PROJECT_VERSION).
- `tables`: DataTable[] (id, name, format, data).
- `analyses`: Analysis[] (id, tableId, type, options, result?, error?).
- `graphs`: Graph[] (id, name, tableId, analysisId?, graphType, options).
- `layouts`: Layout[] (id, name, items: { graphId, x, y, width, height }[]).
- `selection`: Selection | null (table | analysis | graph | layout).

**Actions:** addTable, removeTable, updateTableData, **renameTable** (tableId, name), addAnalysis, removeAnalysis, updateAnalysisResult, updateAnalysisError, addGraph, removeGraph, updateGraphOptions, setSelection, copyAnalysesAndGraphsFromTable, addLayout, removeLayout, updateLayout. Editing table data clears result/error for analyses that reference that table. Renaming a table updates only the table’s name in store; all UI and export (sidebar, main area title, JSON/Prism/Pzfx, NL context) read from store so the new name propagates automatically.

**UI:** Sidebar lists tables, analyses, graphs; selection drives main area (TableView, AnalysisPanel, GraphView). Chat panel always visible; NL tools create tables, run analyses, create graphs via the same actions.

---

## Hot-linking (current)

- **Data → analysis:** Analyses reference tableId. When data changes, their result/error is cleared; re-run to recompute.
- **Data → graph:** Graphs reference tableId (and optionally analysisId). buildPlotlySpec is called with current table data and (if analysisId set) that analysis’s result. So changing data immediately affects the graph when the user has run the analysis or when the graph shows raw data.
- **No layout entity yet:** There is no “layout” sheet that composes multiple graphs. Adding layouts would require a new entity (e.g. Layout with list of graph IDs and positions/sizes) and a LayoutView component.

---

## Persistence (current and target)

- **Save:** `exportProject(project)` → JSON; file save and localStorage autosave (debounced). JSON is the native format.
- **Load:** `importProject(json)`, `parsePrism(blob)` (full: tables + analyses + graphs), `parsePzfx(buffer)` (tables only—analyses and graphs in the Prism file are not imported). See [Prism file formats](../reference/prism-file-formats.md).
- **Export to Prism:** “Save as Prism” writes .pzfx via `buildPzfx(project)` — **tables only**; analyses and graphs are not serialized. So .pzfx round-trip is data-only; complex Prism projects lose analyses/plots when opened here. Full fidelity: use JSON or .prism (our zip); .prism import is implemented; .prism export exists in code but has no UI yet.
- **Versioning:** Project has version; import/export can migrate old versions if we introduce migrations later.

---

## Workflow extensions (target, order TBD)

### Wand (copy analysis/graph setup to another table)

- **Intent:** User selects a table A that has analyses and graphs; then selects table B; invokes “Apply analysis/graph setup from A” (wand). System copies the set of analyses (types + options) and graphs (types + options) from A to B, creating new analysis and graph entities linked to B. No data is copied; only structure.
- **Design:** New action(s), e.g. `copyAnalysesAndGraphsFromTable(sourceTableId, targetTableId)`: for each analysis on source, addAnalysis with same type/options and targetTableId; for each graph on source, addGraph with same graphType/options and targetTableId (and link to the newly created analysis on target if source graph had an analysisId). UI: button or menu item “Copy from table…” then pick source table. NL: tool “copy_table_setup” or similar.
- **Scope:** No automatic re-run; user runs analyses on the new table after wand. Result shapes must be compatible (same format and analysis type).

### Apply style from example (Prism Magic)

- **Intent:** Make one or more graphs look like another by copying formatting (fonts, axis range/ticks, colors, etc.). Distinct from wand (which copies analysis + graph *setup* to another *table*); here the target is existing graph(s) and only visual options are copied.
- **Design:** UI: select graph(s), invoke “Apply style from…” or “Format like…”, choose example graph, choose which properties to copy (axis range, fonts, colors, etc.). Store: applyGraphStyleFromExample(targetGraphIds, exampleGraphId, optionsMask) or similar that updates GraphOptions on target graphs from the example graph. No new entity; graph options only.
- **Scope:** Implementation plan Phase 9; EARS can add a WKF spec when formalizing.

### Layouts (compose multiple graphs on one page)

- **Intent:** User can create a “layout” sheet that shows multiple graphs (and optionally result tables or text) in a single view; resize/arrange; export layout as one image/PDF for papers.
- **Design:** New entity Layout: id, name, items: { graphId (or analysisId/tableId for a result table?), x, y, width, height }[]. LayoutView renders each item in a grid or absolute positions; double-click to focus the source graph. Export: render the layout to a single canvas or use Plotly’s subplot/layout capabilities. Store: addLayout, removeLayout, updateLayout; selection can include layout.
- **Status:** Implemented. LayoutView renders items; Export layout PNG; addLayout, removeLayout, updateLayout; selection type layout. PRISM-WKF-006.

### Info / text sheets

- **Intent:** Prism has “info” sheets for notes. Optional: add an InfoSheet type (id, name, content: string or rich text). Shown in sidebar; selecting one shows a simple editor. No analysis or graph; for project notes.
- **Scope:** Deferred in HLD; can be added to project model and LLD when needed.

---

## NL (Chat) integration

- **Current tools:** create_table, run_analysis, create_graph, update_graph_options, list_analyses_for_table, list_graph_types_for_table, etc. (see `src/nl/schemas.ts`, `orchestrator.ts`).
- **Clone extensions:** When new table formats or analyses exist, add or extend tools so the LLM can create grouped/contingency/survival tables, run two-way ANOVA, Chi-square, Kaplan–Meier, etc. Context builder already serializes project state; new types will appear in context once in the store. Tool schemas must include new analysis types and options (e.g. paired_ttest columnLabels).
- **Wand:** Optional tool “copy_table_setup” (sourceTableId, targetTableId) that calls the new store action.

---

## Open questions and future decisions

### Resolved

1. ✅ **Persistence:** JSON save/load plus Prism/Pzfx import and export (round-trip in scope per HLD).
2. ✅ **Wand copies structure only:** No data copy; target table keeps its data; user runs analyses after wand.

### Deferred

1. **Layout export format:** Single PNG/PDF from layout vs multiple images; implementation detail when we implement layouts.
2. **Duplicate family (Prism):** “Duplicate sheet and all linked sheets” then replace data. Similar to wand but duplicates data and all linked analyses/graphs. Can be a separate action/spec later.

---

## References

- `src/store/projectSlice.ts` — actions and state
- `src/types/project.ts` — Project, Selection
- `src/lib/importProject.ts`, `exportProject.ts`, `projectSchema.ts`
- `src/nl/schemas.ts`, `orchestrator.ts` — tools and execution
