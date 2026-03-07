# EARS: GraphPad Prism clone (Dataplotter)

**Created**: 2026-03-06
**Design**: [HLD](../high-level-design.md), [LLDs](../llds/)
**Status markers**: `[x]` implemented, `[ ]` active gap, `[D]` deferred

**Table types source:** [Prism: Using Prism's data table](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm) and child pages (scraped via `scripts/prism_guide_pages` with `--section data_tables`). Prism defines eight kinds: XY, Column, Grouped, Contingency, Survival, Parts of whole, Multiple variables, Nested.

---

## Tables and formats (PRISM-TBL)

- [x] **PRISM-TBL-001**: The system shall allow creating a table with format Column (single grouping variable) and storing column labels and row data.
- [x] **PRISM-TBL-002**: The system shall allow creating a table with format XY (X + one or more Y series) and storing labels and data.
- [x] **PRISM-TBL-003**: The system shall constrain which analyses and graph types are offered based on the selected table format (via registry).
- [x] **PRISM-TBL-004**: The system shall support the Grouped table format (two grouping variables; replicates per cell) with a defined data shape and registry entries.
- [x] **PRISM-TBL-005**: The system shall support the Contingency table format (integer counts; row/column labels) with a defined data shape and registry entries.
- [x] **PRISM-TBL-006**: The system shall support the Survival table format (time + event per subject; optional group) with a defined data shape and registry entries.
- [x] **PRISM-TBL-007**: The system shall support the Parts of whole table format (labels + values summing to a whole) with a defined data shape and registry entries.
- [x] **PRISM-TBL-008**: Where a new table format is supported, the system shall provide schema and validation so that create/edit and save/load handle that format correctly.
- [x] **PRISM-TBL-009**: The system shall support the Multiple variables table format (one row per case, one column per variable; Prism: correlation matrix, multiple regression, extract/rearrange) with registry and analyses.
- [x] **PRISM-TBL-010**: The system shall support the Nested table format (hierarchical replication; Prism: nested t-test, nested one-way ANOVA, descriptive/normality/outlier per subcolumn).

---

## Analyses (PRISM-ANA)

- [x] **PRISM-ANA-001**: The system shall run descriptive statistics on Column and XY tables and store result (mean, SEM, SD, median, etc. per column/series).
- [x] **PRISM-ANA-002**: The system shall run unpaired t-test on Column tables (two columns) and store result (means, t, p, df, CI).
- [x] **PRISM-ANA-003**: The system shall run one-way ANOVA on Column tables and store result (group means, F, p, df).
- [x] **PRISM-ANA-004**: The system shall run linear regression on XY tables and store result (slope, intercept, R², p, CI).
- [x] **PRISM-ANA-005**: The system shall run dose-response 4PL on XY tables and store result (EC50, curve, etc.).
- [x] **PRISM-ANA-006**: The system shall run paired t-test on Column tables (two columns, matched pairs) and store result (mean difference, t, p, df, CI).
- [x] **PRISM-ANA-007**: When Grouped table format exists, the system shall run two-way ANOVA and store result (main effects, interaction, optional post-hoc).
- [x] **PRISM-ANA-008**: When Contingency table format exists, the system shall run Chi-square test and store result.
- [x] **PRISM-ANA-009**: When Contingency table format exists, the system shall run Fisher's exact test and store result.
- [x] **PRISM-ANA-010**: When Survival table format exists, the system shall run Kaplan–Meier analysis and store result (curve coordinates, median survival, optional comparison).
- [x] **PRISM-ANA-011**: When Parts of whole table format exists, the system shall support "fraction of total" and/or Chi-square goodness of fit as specified.
- [x] **PRISM-ANA-012**: The system shall clear analysis result and error when the linked table's data is edited, and require the user to re-run to recompute.

---

## Graphs (PRISM-GPH)

- [x] **PRISM-GPH-001**: The system shall create bar charts from Column table data (mean ± error; optional replicates overlay) with categorical x-axis.
- [x] **PRISM-GPH-002**: The system shall create scatter, line, and scatter+line graphs from XY table data.
- [x] **PRISM-GPH-003**: The system shall create dose-response graphs from XY data with optional 4PL curve overlay from analysis result.
- [x] **PRISM-GPH-004**: The system shall allow graph options: title, axis labels, linear/log scale, error bar type (SEM/SD/CI/none), legend, annotations.
- [x] **PRISM-GPH-005**: The system shall create survival curves (Kaplan–Meier style) from Survival table data and optional analysis result, with time on x-axis and survival probability on y-axis.
- [x] **PRISM-GPH-006**: The system shall create pie charts from Parts of whole table data (or single column) with labels and values.
- [x] **PRISM-GPH-007**: Where a new graph type is supported, the system shall include it in the allowed graph types for the relevant table format(s) in the registry.
- [x] **PRISM-GPH-008**: The system shall export the current graph as PNG and SVG including title, axes, error bars, and annotations.
- [x] **PRISM-GPH-009**: The system shall support grouped or stacked bar charts when Grouped table format exists.
- [x] **PRISM-GPH-010**: The system shall support a second Y-axis for graphs where specified in options.

---

## Project and workflows (PRISM-WKF)

- [x] **PRISM-WKF-001**: The system shall persist the project as JSON (tables, analyses, graphs, selection) for save and load.
- [x] **PRISM-WKF-002**: The system shall import Prism (.prism) and Pzfx files. .prism (our zip) imports tables, analyses, and graphs. .pzfx imports **table data only**; analyses and graphs in the file are not loaded (see [Prism file formats](../reference/prism-file-formats.md)).
- [x] **PRISM-WKF-003**: The system shall maintain hot-linking: when table data changes, linked analyses' results are cleared and graphs reflect current data (and analysis result if present) when recomputed or redrawn.
- [x] **PRISM-WKF-004**: The system shall allow multiple analyses per table and multiple graphs per table, with each graph optionally linked to one analysis (e.g. for curve overlay).
- [x] **PRISM-WKF-005**: When the user invokes "copy setup from table" (wand), the system shall create analyses and graphs on the target table with the same types and options as the source table, without copying data.
- [x] **PRISM-WKF-006**: When layouts are implemented, the system shall allow creating a layout sheet that composes multiple graphs (and optionally result tables) on one page and export that layout as a single image.
- [x] **PRISM-WKF-007**: The system shall provide NL (chat) tools to create tables, run analyses, and create graphs so that workflows can be driven by natural language within the same architecture.
- [x] **PRISM-WKF-008**: Where new table formats or analyses are added, the system shall expose them to the NL layer (context and tools) so the LLM can create and run them.
- [x] **PRISM-WKF-011**: The system shall export the project to .pzfx (UI: “Save as Prism”) so that it can be opened in GraphPad Prism. Export is **tables only**; analyses and graphs are not written to .pzfx. Full project export: use JSON; .prism zip export exists in code but has no UI.
- [x] **PRISM-WKF-012**: The system shall allow the user to rename a table from the UI (sidebar or main view). The name shall be stored in project state and propagate everywhere the table is referenced (sidebar, main area title, export, NL context).
- [D] **PRISM-WKF-009**: The system shall support "duplicate family" (duplicate a table and all linked analyses and graphs, then replace data in the new table).
- [D] **PRISM-WKF-010**: The system shall support info/text sheets for project notes.

---

## Analyses — full parity (PRISM-ANA, continued)

- [x] **PRISM-ANA-013**: The system shall support nonparametric alternatives (e.g. Mann-Whitney, Kruskal-Wallis, Wilcoxon, Friedman) for applicable table types.
- [x] **PRISM-ANA-014**: The system shall implement all Prism analysis types applicable to each table format (including ROC, Bland–Altman, Deming regression, three-way ANOVA, and others as defined in the registry) so that the clone achieves full analysis parity with Prism. (Representative set implemented: ROC AUC, normality test; full parity phased.)

---

## In-table transformations (TRANSFORM)

**Reference:** [LLD: Transformations](../llds/transformations.md)

- [x] **TRANSFORM-001**: The system shall allow defining a per-column transformation on Column and XY tables via an equation (e.g. log10(y)) and store it as metadata on the table (no new table).
- [x] **TRANSFORM-002**: The system shall evaluate transformation equations in a restricted way (allowlist of variable names and functions only; no arbitrary code execution).
- [x] **TRANSFORM-003**: The system shall provide a resolver that, given a table and mode (raw | transformed), returns effective table data in the same shape; raw mode or no transformations returns raw data; transformed mode returns data with transformations applied row-wise.
- [x] **TRANSFORM-004**: The system shall allow the user to toggle the table view between raw and transformed; when showing transformed, the grid shall display resolved data and be read-only.
- [x] **TRANSFORM-005**: The system shall allow the user to choose per-analysis whether to use raw or transformed data (dataMode), and pass the corresponding effective data when running the analysis.
- [x] **TRANSFORM-006**: The system shall allow the user to choose per-graph whether to use raw or transformed data (dataMode), and pass the corresponding effective data when building the chart.
- [x] **TRANSFORM-007**: The system shall clear analysis results for a table when that table's transformations are added, edited, or removed (same as when raw data changes).
- [x] **TRANSFORM-008**: The system shall persist transformations and viewMode on the table and dataMode on analyses and graphs in JSON save/load; old projects without these fields shall load with defaults (raw).
- [x] **TRANSFORM-009**: The system shall support add, edit, and remove of a column transformation from the table UI.

---

## New Data Table modal (PRISM-UI)

The "New Data Table and Graph" modal shall replicate the Prism-style two-column layout: left sidebar for format selection, right content for format-specific description and options. Tutorial datasets are deferred.

- [x] **PRISM-UI-001**: The system shall present a modal titled "New Data Table and Graph" with a two-column layout: a left sidebar (dark background) listing table formats and an "EXISTING FILE" section, and a right main content area that updates when the user selects a format.
- [x] **PRISM-UI-002**: The left sidebar shall list under "NEW TABLE & GRAPH" all eight formats in order: XY, Column, Grouped, Contingency, Survival, Parts of whole, Multiple variables, Nested. The selected format shall be visually highlighted. Under "EXISTING FILE" the system shall show "Clone a Graph" (behavior may be deferred).
- [x] **PRISM-UI-003**: For each selected format, the right panel shall show: (a) a short format-specific description, (b) an optional visual example (table and/or graph preview), (c) a "Learn more" link (placeholder href or no-op), (d) a "Data table:" section with two radio options: "Enter or import data into a new table" and "Start with sample data to follow a tutorial". Tutorial dataset list is not implemented initially; "Start with sample data" may be disabled or hidden.
- [x] **PRISM-UI-004**: The modal shall include footer buttons: "Cancel" (dismiss without creating) and "Create" (primary; create table with selected format and current options). Creation logic shall remain as in the existing NewTableDialog (name, format-specific fields).
- [x] **PRISM-UI-005**: Format-specific creation fields (column labels, X/Y labels, group definitions, etc.) shall remain available in the right panel when "Enter or import data into a new table" is selected, consistent with current behavior per format.

### Implementation plan (parallel subagents)

Work is split so subagents can run in parallel with minimal overlap:

| Subagent | Scope | Deliverable |
|----------|--------|-------------|
| **Layout** | Modal shell, two-column CSS, sidebar nav (format list + EXISTING FILE), footer Cancel/Create. Single component structure; no format-specific content. | Updated `NewTableDialog.tsx` structure and new CSS classes (e.g. `new-table-modal`, `new-table-sidebar`, `new-table-content`). |
| **Content A** | Right-panel content for **XY, Column, Grouped**: description text, optional mini table/graph placeholder, "Data table" radios, "Learn more" link. Copy for each of the three formats. | Format-specific description and UI blocks for XY, Column, Grouped (data-driven or inline). |
| **Content B** | Right-panel content for **Contingency, Survival, Parts of whole**: same as Content A. | Format-specific description and UI blocks for Contingency, Survival, Parts of whole. |
| **Content C** | Right-panel content for **Multiple variables, Nested**: same as Content A. | Format-specific description and UI blocks for Multiple variables, Nested. |

**Integration:** After Layout and Content A/B/C are done, merge into one `NewTableDialog`: sidebar sets `format` state; right panel renders the content for that format and includes existing creation fields (name, column labels, etc.) and submit handler. Tutorial datasets: do not implement; "Start with sample data" can be present but disabled or hidden.

---

## Traceability summary

| Area      | Implemented | Active gap | Deferred |
|-----------|-------------|------------|----------|
| TBL       | 8           | 0          | 2        |
| ANA       | 14          | 0          | 0        |
| GPH       | 10          | 0          | 0        |
| WKF       | 10          | 0          | 2        |
| TRANSFORM | 9           | 0          | 0        |
| UI (modal)| 5           | 0          | 0        |

Implementation plans in `docs/planning/` should reference these spec IDs by phase.
