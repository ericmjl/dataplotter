# Prism Clone Implementation Plan

**Created**: 2026-03-06  
**Status**: Planning  
**Design**: [HLD](../high-level-design.md), [LLDs](../llds/)  
**EARS Specs**: [prism-clone-specs.md](../specs/prism-clone-specs.md)

---

## Overview

Implement the GraphPad Prism clone as specified: Pyodide + PyMC–first Bayesian analyses, full analysis parity, new table formats (Grouped, Contingency, Survival, Parts of whole), corresponding graph types, Prism/Pzfx round-trip export, and workflow extensions (wand, NL exposure). Phases are ordered so that the PyMC foundation ships first, then paired t-test and export, then each new table format with its analyses and graphs.

## Success Criteria

- Users can run Bayesian analyses (posterior summaries, credible intervals) via PyMC in the browser with loading state.
- All Prism analysis types applicable to each supported table format are implemented (phased).
- Users can export the project to .pzfx/.prism and open it in GraphPad Prism (round-trip).
- New table formats have full stack: types, registry, UI, analyses, graphs, and NL tools.
- Specs in prism-clone-specs.md are traceable to code via @spec annotations and tests.

---

## Traceability to HLD and LLDs

- **HLD** ([docs/high-level-design.md](../high-level-design.md)): Goals 3–4 and “Additions for the Prism clone” call out full analysis parity, Prism export, graph types (including two Y-axes, line of identity, box-and-whisker; optional heat map, forest plot), **data prep** (transform, normalize, remove baseline; normality tests, identify outliers), and **workflows** (wand, apply style from example, layouts). Phase 9 and the content sources below are scoped by that HLD.
- **LLDs:** [analyses-and-engine](../llds/analyses-and-engine.md) (data prep, normality, identify outliers; column/xy extend row), [graphs-and-charts](../llds/graphs-and-charts.md) (two Y-axes, line of identity, box-and-whisker, forest plot, heat map), [project-and-workflows](../llds/project-and-workflows.md) (apply style from example, wand, layouts), [data-tables-and-formats](../llds/data-tables-and-formats.md) (excluded values deferred). Each phase in this plan maps to those LLD sections and to EARS where defined.

---

## Parity and content sources

The plan is informed by two living content sources in this repo. Use them during implementation for acceptance criteria and workflow details.

### Guide pages (`scripts/prism_guide_pages/guide_pages/`)

Downloaded Prism user guide (246 pages). **Data tables section:** [Using Prism's data table](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm) and recursively all child pages are in the scraped list; re-download with `--section data_tables`. These pages define the eight table types (XY, Column, Grouped, Contingency, Survival, Parts of whole, Multiple variables, Nested) and inform HLD/LLD/EARS. Key topics that affect parity:

| Topic | What the guide says | Plan / EARS |
|-------|---------------------|-------------|
| **Heat maps** | Grouped table, no subcolumns (or mean/median/SD/SEM/CV of replicates); color-coded cells; color mapping, gaps, legends. | Not yet a graph type; add when Grouped exists (Phase 3+). |
| **Forest plot** | Column table: one column per study; enter odds ratio + low + high CI; plot “median and range”; horizontal bar; log X; grid line at 1. | Special case of column graph (PRISM-GPH-009 / forest); Phase 7 or follow-on. |
| **Box-and-whisker** | From XY with ≥5 replicates (or column); change graph type via Format Graph → Appearance → Box-and-whiskers; size/color/border. | Box-and-whisker as graph option (column/XY); Phase 7 or with grouped bar. |
| **Two Y-axes** | Right Y-axis in Format Axes; assign data sets to left vs right in Format Graph; axis colors; only two Y-axes. | PRISM-GPH-010 (deferred); Phase 7 or 9. |
| **Prism Magic (apply style)** | Make one or more graphs look like another (fonts, colors, axis range/ticks, etc.); different from wand (which copies analysis+graph setup). | Not in current EARS; add as “apply graph style from example” in Phase 9 or follow-on. |
| **Transform** | New results table; Y = f(Y) or f(X,Y): log, sqrt, z-score, rank, *K, +K, etc.; Eadie-Hofstee, Lineweaver-Burk, Scatchard, Hill for kinetics; user-defined equations. | Data prep; Phase 9. |
| **Normalize** | 0–100% with baseline definitions (min/max, first/last row, entered value, sum); per data set; Transform, Normalize… | Data prep; Phase 9. |
| **Excluding points** | Exclude data sets in Analyze dialog; exclude individual points (blue italics); empty data sets in results. | Excluded values (data-tables LLD deferred); Phase 9 or follow-on. |
| **Line of identity** | Format Graph → draw line where X=Y; or plot function (slope 1, intercept 0). | Graph option; Phase 7 or 9. |
| **Combine bars and points** | XY with bars/spikes; Grouped with points; or two graphs superimposed on a layout. | Partly layout (Phase 8); graph appearance options in Phase 7/9. |

### YouTube tutorials (`scripts/youtube_prism_transcripts/transcripts/`)

45 tutorial transcripts. They emphasize:

| Theme | Transcripts (examples) | Use for plan |
|-------|------------------------|---------------|
| **Wand (copy setup)** | neCHK9Y7AB4 (two-way ANOVA + graph from experiment 1 → experiment 2; prefix sheet names). | PRISM-WKF-005; Phase 7. Consider “prefix new sheet names” in wand deliverable. |
| **When to use which test** | _il4IiGYwI4 (parametric vs nonparametric, normality first, t-test vs ANOVA vs Mann-Whitney vs Kruskal-Wallis). | Order of analysis implementation; optional “analysis checklist” or guidance in UI. |
| **Normality tests** | TJgmOdTEL4E (D'Agostino-Pearson, Shapiro-Wilk; Column statistics; before choosing parametric test). | Add **normality test** as explicit analysis (Column); Phase 7 or 9. |
| **Identify outliers** | opOE31H3uLI (ROUT, Grubbs, iterative Grubbs; Q value; identify then remove). | Add **identify outliers** explicitly to Phase 7 (ANA-014); Column analysis. |
| **Layouts** | H6I2JqgnPoo (combine multiple graphs like a pro). | PRISM-WKF-006; Phase 8. |
| **Graph consistency** | 1Fy9EhFXg2M (life-changing tips for consistent graphs). | Supports “apply style from example” (Prism Magic) in Phase 9. |
| **Domain workflows** | IC50/MTT (3Cb2vpM3TTw), ELISA (5IqqpKSnXfI), PCA (idp2vP3O52w), correlation (ln2CI-mtEnI), Kaplan–Meier (L_XtKqJg1ug), Chi-square (22NxmSVS8_g), two-way ANOVA (sA4lPpKyNyE). | Acceptance tests: run same workflow in clone; tutorials are test scripts. |

### Gaps and additions to the plan

- **Normality test (Column):** Explicit analysis (D'Agostino-Pearson, Shapiro-Wilk, etc.) before parametric vs nonparametric. Add to Phase 7 “remaining analyses” or Phase 9.
- **Identify outliers (Column):** ROUT, Grubbs; result with flagged/removed values. Add to Phase 7.
- **Data prep (Transform, Normalize, Remove baseline):** New “Phase 9: Data prep and graph formatting parity” below.
- **Graph formatting parity:** Two Y-axes (GPH-010), line of identity, box-and-whisker appearance, apply style from example. Phase 7 or 9.
- **Heat map:** New graph type for Grouped data; Phase 3 follow-on or Phase 9.
- **Forest plot:** Column graph variant (median + range, horizontal, log scale, line at 1); Phase 7 or 9.
- **Excluding points/sets:** Cell-level or data-set-level exclusion; Phase 9 or follow-on.

---

## Implementation Phases

### Phase 1: PyMC foundation (async engine + one Bayesian analysis)

**Goal**: Load Pyodide + PyMC on demand, run at least one existing analysis through PyMC, extend result types with Bayesian fields, and make the analysis path async with UI loading state.

#### Deliverables

1. **Pyodide + PyMC loader**
   - Load Pyodide on first analysis run (or on app init behind a flag); install PyMC via micropip; single-threaded sampler to avoid multiprocessing issues.
   - No EARS (enabling work for HLD §6).

2. **Async analysis entry point**
   - Add `runAnalysisAsync(project, analysisId)` (or equivalent) that returns `Promise<Result<AnalysisResult>>`; call into PyMC for Bayesian implementation; map PyMC/ArviZ output to existing result shape plus Bayesian fields.
   - **Specs**: Establishes pattern for PRISM-ANA-001 through PRISM-ANA-005 (Bayesian versions).

3. **Extended result types**
   - Add Bayesian fields to at least one result variant (e.g. descriptive: meanCrI, meanSD; or unpaired_ttest: meanDiffCrI, pDiffPositive) in `src/types/analysis.ts`.
   - **Specs**: Supports HLD §6 result-type contract.

4. **UI loading state**
   - AnalysisPanel (and any caller) shows loading indicator while async analysis runs; display posterior/credible output when present.
   - **Specs**: Part of analysis UX; no single spec ID.

#### Testing Requirements

- ✅ Pyodide loads and PyMC runs a minimal model (e.g. Normal likelihood) in test or dev harness.
- ✅ `runAnalysisAsync` returns a result that matches extended AnalysisResult shape for one analysis type.
- ✅ UI shows loading state during run and result (including credible interval) after completion.

#### Definition of Done

- [ ] Pyodide + PyMC load on demand without blocking initial app load.
- [ ] At least one analysis (e.g. descriptive or unpaired t-test) runs via PyMC and populates extended result.
- [ ] AnalysisPanel (or equivalent) uses async path and shows loading state.
- [ ] `npm run build` and `npm test` pass; no regressions in existing analyses if still callable synchronously during transition.

---

### Phase 2: Paired t-test + Prism export

**Goal**: Implement paired t-test (via PyMC) end-to-end and add export to .pzfx/.prism for round-trip.

#### Deliverables

1. **Paired t-test**
   - **Specs**: PRISM-ANA-006  
   - Result variant in `analysis.ts`; options and schema in `analysisSchemas.ts`; PyMC model for paired t-test; branch in async engine; add to COLUMN_ANALYSES in tableRegistry; NL tool and context.

2. **Prism/Pzfx export**
   - **Specs**: PRISM-WKF-011  
   - Build/serialize from Project to .pzfx (and/or .prism) in `src/io/pzfx/` (or new module); file save UI option “Save as Prism”; document lossy round-trip where our model has no equivalent.

#### Testing Requirements

- ✅ **PRISM-ANA-006**: Paired t-test runs from Column table (two columns), result has mean difference, t, p, df, CI (and Bayesian fields when using PyMC).
- ✅ **PRISM-WKF-011**: Exported .pzfx (or .prism) opens in GraphPad Prism with tables/analyses/graphs represented; re-import into dataplotter yields equivalent project where supported.

#### Definition of Done

- [ ] Paired t-test available for Column tables in UI and NL; implemented via PyMC.
- [ ] Export to .pzfx/.prism available from file menu; exported file opens in Prism.
- [ ] Specs PRISM-ANA-006 and PRISM-WKF-011 verified with @spec annotations and tests.

---

### Phase 3: Grouped table format + two-way ANOVA + grouped bar

**Goal**: Full stack for Grouped format and two-way ANOVA; grouped/stacked bar chart option.

#### Deliverables

1. **Grouped table format**
   - **Specs**: PRISM-TBL-004, PRISM-TBL-008  
   - Data shape (GroupedTableData) in types; schema and validation in projectSchema and tableRegistry; getSchema, getAllowedAnalyses, getAllowedGraphTypes for `grouped`; NewTableDialog and TableView/DataGrid (or custom editor) for grouped tables.

2. **Two-way ANOVA**
   - **Specs**: PRISM-ANA-007  
   - Result variant; options and schema; PyMC model for two-way ANOVA; engine branch; registry; NL tool.

3. **Grouped/stacked bar chart**
   - **Specs**: PRISM-GPH-007, PRISM-GPH-009  
   - buildPlotlySpec branch for grouped bar from GroupedTableData; add to allowed graph types for grouped; optional bar mode (grouped vs stacked) in options.

4. **NL exposure**
   - **Specs**: PRISM-WKF-008  
   - Context and tools expose Grouped format and two-way ANOVA so the LLM can create tables and run analyses.

#### Testing Requirements

- ✅ **PRISM-TBL-004, PRISM-TBL-008**: Create Grouped table, enter data, save/load JSON; validation rejects invalid data.
- ✅ **PRISM-ANA-007**: Two-way ANOVA runs from Grouped table; result has main effects, interaction, optional post-hoc.
- ✅ **PRISM-GPH-009**: Grouped bar chart renders from Grouped table data; registry allows it for grouped format.
- ✅ **PRISM-WKF-008**: Chat can create a grouped table and run two-way ANOVA via tools.

#### Definition of Done

- [ ] Grouped format supported end-to-end (create, edit, save, load, validate).
- [ ] Two-way ANOVA implemented via PyMC and available in UI and NL.
- [ ] Grouped (or stacked) bar chart available for Grouped tables.
- [ ] All Phase 3 specs annotated in code and covered by tests.

---

### Phase 4: Contingency table + Chi-square + Fisher

**Goal**: Contingency table format and contingency analyses.

#### Deliverables

1. **Contingency table format**
   - **Specs**: PRISM-TBL-005, PRISM-TBL-008  
   - ContingencyTableData (rowLabels, columnLabels, counts); schema, validation, registry; UI for integer count grid.

2. **Chi-square and Fisher’s exact**
   - **Specs**: PRISM-ANA-008, PRISM-ANA-009  
   - Result types; PyMC (or TS for Fisher exact) implementations; engine branches; registry; NL tools.

3. **NL exposure**
   - **Specs**: PRISM-WKF-008  
   - Contingency format and Chi-square/Fisher in context and tools.

#### Testing Requirements

- ✅ **PRISM-TBL-005, PRISM-TBL-008**: Contingency table create/edit/save/load; validation for non-negative integers.
- ✅ **PRISM-ANA-008, PRISM-ANA-009**: Chi-square and Fisher run from Contingency table; results match expected structure.
- ✅ **PRISM-WKF-008**: Chat can create contingency table and run Chi-square/Fisher.

#### Definition of Done

- [ ] Contingency format and both analyses implemented and exposed in UI and NL.
- [ ] Phase 4 specs verified with @spec and tests.

---

### Phase 5: Survival table + Kaplan–Meier + survival curves

**Goal**: Survival format, Kaplan–Meier analysis, and survival curve graph type.

#### Deliverables

1. **Survival table format**
   - **Specs**: PRISM-TBL-006, PRISM-TBL-008  
   - SurvivalTableData (time, event, optional group); schema, validation, registry; UI (e.g. time + event columns).

2. **Kaplan–Meier analysis**
   - **Specs**: PRISM-ANA-010  
   - Result with curve coordinates, median survival, optional comparison; PyMC or dedicated survival implementation; engine branch; registry; NL.

3. **Survival curve graph**
   - **Specs**: PRISM-GPH-005, PRISM-GPH-007  
   - buildPlotlySpec branch for survival (step/scatter+lines from result); add survival to allowed graph types for survival format.

4. **NL exposure**
   - **Specs**: PRISM-WKF-008  
   - Survival format and Kaplan–Meier in tools and context.

#### Testing Requirements

- ✅ **PRISM-TBL-006, PRISM-TBL-008**: Survival table create/edit/save/load.
- ✅ **PRISM-ANA-010**: Kaplan–Meier runs; result has curve and median survival.
- ✅ **PRISM-GPH-005**: Survival curve renders from Survival table and/or result.
- ✅ **PRISM-WKF-008**: Chat can create survival table and run Kaplan–Meier.

#### Definition of Done

- [ ] Survival format, Kaplan–Meier, and survival graph implemented and exposed.
- [ ] Phase 5 specs verified with @spec and tests.

---

### Phase 6: Parts of whole + pie chart

**Goal**: Parts of whole table format, fraction/Chi-square goodness of fit, and pie chart graph type.

#### Deliverables

1. **Parts of whole table format**
   - **Specs**: PRISM-TBL-007, PRISM-TBL-008  
   - PartsOfWholeTableData (labels, values); schema, validation, registry; UI.

2. **Fraction of total / Chi-square goodness of fit**
   - **Specs**: PRISM-ANA-011  
   - Result types and implementations; engine branches; registry; NL.

3. **Pie chart**
   - **Specs**: PRISM-GPH-006, PRISM-GPH-007  
   - buildPlotlySpec branch for pie (Plotly type: 'pie'); add pie to allowed graph types for partsOfWhole (and optionally column).

4. **NL exposure**
   - **Specs**: PRISM-WKF-008  
   - Parts of whole format and analyses in tools and context.

#### Testing Requirements

- ✅ **PRISM-TBL-007, PRISM-TBL-008**: Parts of whole table create/edit/save/load.
- ✅ **PRISM-ANA-011**: Fraction of total and/or Chi-square goodness of fit run and store result.
- ✅ **PRISM-GPH-006**: Pie chart renders from Parts of whole data.
- ✅ **PRISM-WKF-008**: Chat can create parts-of-whole table and run analyses.

#### Definition of Done

- [ ] Parts of whole format, analyses, and pie chart implemented and exposed.
- [ ] Phase 6 specs verified with @spec and tests.

---

### Phase 7: Nonparametrics + remaining analyses + wand + graph export

**Goal**: Nonparametric analyses, other Prism analyses (ROC, Bland–Altman, etc.), wand (copy setup), and graph PNG/SVG export where not already present.

#### Deliverables

1. **Nonparametric analyses**
   - **Specs**: PRISM-ANA-013  
   - Mann-Whitney, Kruskal-Wallis, Wilcoxon, Friedman (or subset) via PyMC or TS; result types; registry; NL. Phased by table format (column first, then grouped).

2. **Remaining analyses (full parity)**
   - **Specs**: PRISM-ANA-014  
   - ROC, Bland–Altman, Deming regression, three-way ANOVA, and others per registry; implement in priority order; extend result types and engine.

3. **Wand (copy setup from table)**
   - **Specs**: PRISM-WKF-005  
   - Store action copyAnalysesAndGraphsFromTable(sourceTableId, targetTableId); UI button/menu; optional NL tool.

4. **Graph export PNG/SVG**
   - **Specs**: PRISM-GPH-008  
   - Ensure current graph exports as PNG and SVG with title, axes, error bars, annotations (implement or verify existing).

5. **NL exposure for all new analyses**
   - **Specs**: PRISM-WKF-008  
   - Context and tools updated for any analyses/formats added in this phase.

#### Testing Requirements

- ✅ **PRISM-ANA-013**: At least one nonparametric analysis runs per applicable format and produces correct result shape.
- ✅ **PRISM-ANA-014**: Representative “remaining” analyses (e.g. ROC, Bland–Altman) implemented and callable.
- ✅ **PRISM-WKF-005**: Wand copies analysis and graph setup to target table; no data copied; user can run analyses on target.
- ✅ **PRISM-GPH-008**: Graph view exports PNG and SVG with full content.

#### Definition of Done

- [ ] Nonparametrics and remaining analyses (per phase scope) implemented.
- [ ] Wand implemented and exposed in UI (and optionally NL).
- [ ] Graph export verified for PNG/SVG.
- [ ] Phase 7 specs verified with @spec and tests.

---

### Phase 8: Layouts (optional / later)

**Goal**: Layout sheet that composes multiple graphs (and optionally result tables) and exports as a single image.

#### Deliverables

1. **Layout entity and store**
   - **Specs**: PRISM-WKF-006  
   - Layout type (id, name, items: graphId/position/size); addLayout, removeLayout, updateLayout; selection can be layout.

2. **LayoutView and export**
   - Render layout as grid or positioned panels; double-click to focus source graph; export layout as single PNG/PDF (or image).

#### Testing Requirements

- ✅ **PRISM-WKF-006**: Create layout, add graphs, resize/arrange, export layout as one image.

#### Definition of Done

- [ ] Layouts implemented and export working; PRISM-WKF-006 verified.

---

### Phase 9: Data prep and graph formatting parity

**Goal**: Transform/normalize/remove baseline (data prep), normality test and identify outliers (analyses), and graph formatting parity (two Y-axes, line of identity, box-and-whisker, apply style; optional heat map and forest plot). Scope can be split across multiple sprints; order below is suggested.

#### Deliverables

1. **Normality test (Column)**
   - Analysis: D'Agostino-Pearson omnibus and/or Shapiro-Wilk; result indicates pass/fail or test statistic; used to choose parametric vs nonparametric (per tutorials). Add to registry and NL.

2. **Identify outliers (Column)**
   - Analysis: ROUT (recommended), Grubbs, iterative Grubbs; Q value option; result table with outliers flagged or with cleaned values. Add to registry and NL.

3. **Transform**
   - New “Transform” analysis (or data operation): create result table with Y = f(Y) or f(X,Y) (log, sqrt, z-score, rank, *K, +K, etc.); optional Eadie-Hofstee, Lineweaver-Burk, Scatchard, Hill for XY. Reference: guide `using_transform.txt`.

4. **Normalize**
   - New “Normalize” analysis: 0–100% (or 0–1) with baseline definitions (min/max, first/last row, entered value, sum per column). Reference: guide `using_normalizing_data.txt`.

5. **Remove baseline**
   - Optional analysis or transform: subtract baseline (e.g. first row or user value) from Y. Referenced in Normalize guide.

6. **Graph: two Y-axes**
   - **Specs**: PRISM-GPH-010  
   - GraphOptions: assign series to left vs right Y-axis; Format Axes → Right Y axis; Plotly yaxis2. Reference: guide `graphs_with_two_y_axes.txt`.

7. **Graph: line of identity**
   - Option to draw line where X=Y (Format Graph or overlay). Reference: guide `adding_a_line_of_identity.txt`.

8. **Graph: box-and-whisker appearance**
   - For Column or XY (with replicates): Format Graph → Appearance → Box-and-whiskers; Plotly box trace. Reference: guide `box-and-whiskers-plot.txt`.

9. **Apply style from example (Prism Magic)**
   - Copy formatting (fonts, colors, axis range/ticks, etc.) from one graph to one or more others; distinct from wand (which copies analysis+graph setup). Reference: guide `prism_magic_apply_style_from_an_example.txt`; tutorial 1Fy9EhFXg2M.

10. **Optional: heat map (Grouped)**
    - New graph type: color-coded cells from Grouped table (mean/median/SD/SEM/CV or no subcolumns). Reference: guide `heat_maps.txt`.

11. **Optional: forest plot**
    - Column graph: median + range (odds ratio + CI); horizontal; log X; reference line at 1. Reference: guide `forest_plot.txt`.

12. **Excluding points / data sets**
    - Per–data-set exclusion in Analyze dialog; optional cell-level exclusion (blue italics) and propagation to results/graphs. Reference: guide `using_excluding_points.txt`. Can be deferred to follow-on.

#### Testing Requirements

- ✅ Normality test runs from Column table; result used to inform parametric vs nonparametric choice.
- ✅ Identify outliers runs (e.g. ROUT); result flags or removes outliers.
- ✅ Transform produces result table with expected formula (e.g. log(Y)).
- ✅ Normalize produces 0–100% (or 0–1) with chosen baselines.
- ✅ Two Y-axes: at least one series on right axis; line of identity appears when enabled; box-and-whisker renders for column/XY.
- ✅ Apply style copies selected formatting from example graph to target graph(s).
- ✅ Heat map and forest plot (if in scope) render from Grouped/Column data.

#### Definition of Done

- [ ] Normality test and identify outliers implemented and in UI/NL.
- [ ] Transform and Normalize (and optionally Remove baseline) implemented.
- [ ] Two Y-axes, line of identity, box-and-whisker, and apply style implemented (or explicitly deferred).
- [ ] Phase 9 specs verified; guide/tutorial references documented in code or tests where useful.

---

## Requirements Traceability

| Phase | Specs |
|-------|--------|
| 1 | HLD §6 (PyMC foundation); enables ANA-001–005 Bayesian |
| 2 | PRISM-ANA-006, PRISM-WKF-011 |
| 3 | PRISM-TBL-004, PRISM-TBL-008, PRISM-ANA-007, PRISM-GPH-007, PRISM-GPH-009, PRISM-WKF-008 |
| 4 | PRISM-TBL-005, PRISM-TBL-008, PRISM-ANA-008, PRISM-ANA-009, PRISM-WKF-008 |
| 5 | PRISM-TBL-006, PRISM-TBL-008, PRISM-ANA-010, PRISM-GPH-005, PRISM-GPH-007, PRISM-WKF-008 |
| 6 | PRISM-TBL-007, PRISM-TBL-008, PRISM-ANA-011, PRISM-GPH-006, PRISM-GPH-007, PRISM-WKF-008 |
| 7 | PRISM-ANA-012 (existing), PRISM-ANA-013, PRISM-ANA-014, PRISM-WKF-005, PRISM-GPH-008, PRISM-WKF-008 |
| 8 | PRISM-WKF-006 |
| 9 | PRISM-GPH-010; normality test, identify outliers, transform, normalize (data prep); two Y-axes, line of identity, box-and-whisker, apply style; optional heat map, forest plot, excluding points |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Pyodide bundle size / slow first load | Load on demand (e.g. on first Run); show clear loading state; consider CDN and caching. |
| PyMC async and current sync runAnalysis | Introduce runAnalysisAsync; UI and NL call async path; keep sync path only for legacy or remove once migrated. |
| Prism export format drift | Base export on existing import (pzfx/prism) structure; test round-trip with sample files; document lossy cases. |
| Scope creep in “remaining analyses” (ANA-014) | Phase 7 defines a concrete subset (e.g. ROC, Bland–Altman, Deming); further analyses go in a follow-on plan. |

---

## References

- [HLD](../high-level-design.md)
- [LLDs](../llds/) — data-tables, analyses-and-engine, graphs-and-charts, project-and-workflows
- [Prism clone specs](../specs/prism-clone-specs.md)
- [Bayesian plan](../plans/2025-03-05-bayesian-by-default.md) — task-level detail for Bayesian result types and engine
- [Architecture](../reference/architecture.md)
- **Guide pages** — `scripts/prism_guide_pages/guide_pages/` (246 .txt pages) for Prism behavior and UI details.
- **YouTube transcripts** — `scripts/youtube_prism_transcripts/transcripts/` (45 .txt) for tutorial workflows and acceptance scenarios.
