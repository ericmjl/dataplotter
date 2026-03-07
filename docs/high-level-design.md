# High-Level Design: GraphPad Prism Clone (Dataplotter)

**Created**: 2026-03-06
**Status**: In progress (phased implementation; see [plan](planning/prism-clone.2026-03-06.md) and [EARS](specs/prism-clone-specs.md))
**Related**: [Architecture](reference/architecture.md), [Design decisions](explanation/design-decisions.md)

---

## 1. Problem statement and goals

**Problem:** Scientists and analysts need to explore data, run appropriate statistical analyses, and produce publication-ready figures without switching between spreadsheets, stats tools, and plotting software. GraphPad Prism is the de facto standard for this workflow but is commercial and desktop-only. An open, web-based alternative that preserves the core “data → analysis → graph, hot-linked” mental model would serve users who want reproducibility, sharing, or a Prism-like experience in the browser.

**Goals:**

1. **Prism-like workflow in the browser and, optionally, as a desktop app:** Create tables by format (XY, Column, Grouped, etc.), enter or import data, run analyses constrained by table type, and create graphs that stay linked to data and (where applicable) analysis results. No scripting required. The app is available in the browser and can be distributed as a desktop app (Electron).
2. **Build on dataplotter:** Extend the existing app (Zustand state, table/analysis/graph model, Plotly charts, NL chat, JSON save, Prism/Pzfx import) rather than replace it. Add missing table formats, analyses, and graph types in the same architecture.
3. **Full analysis parity:** Reimplement all Prism analysis types (parametric and nonparametric: t-tests, ANOVA, regression, contingency, survival, dose-response, ROC, Bland–Altman, etc.) so the clone supports the same analyses as Prism, specified and phased in LLDs and EARS.
4. **Prism file round-trip:** Support both import and export of .pzfx/.prism so users can open Prism projects and save back to Prism-compatible files.
5. **Same technical constraints:** Single-page app (browser and/or desktop); no backend required; analyses run in the browser (current engine plus Bayesian layer; optional Pyodide/PyMC for richer models).

---

## 2. Target users and personas

- **Primary:** Lab scientists and analysts who today use Prism (or Excel + other tools) for routine analyses (t-tests, ANOVA, regression, dose-response) and figures. They want to paste or import data, choose an analysis, get results and a graph, and export for papers or presentations.
- **Secondary:** Educators and students learning statistics and data visualization; teams that need to share analyses via a link or JSON project file.
- **Out of scope for v1:** Enterprise deployment and scripting. All Prism analysis types are in scope and will be phased in via LLDs and EARS.

---

## 3. System architecture overview

The system stays the same as current dataplotter at the top level:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Shell: Sidebar | Main (TableView / AnalysisPanel / GraphView /         │
│         LayoutView) | Chat                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  State (Zustand): Project = { tables, analyses, graphs, layouts,       │
│                             selection }                                 │
│  Persistence: JSON save/load; Prism/Pzfx import and export              │
├─────────────────────────────────────────────────────────────────────────┤
│  Data layer: Table formats (Column, XY, Grouped, Contingency, Survival, │
│              Parts of whole, …) → Registry → Schema/Validate            │
│  Engine: runAnalysis(format, type, data, options) → AnalysisResult     │
│  Charts: buildPlotlySpec(type, tableData, result, options) → Plotly    │
│  NL: Chat + tools (create_table, run_analysis, create_graph, …)         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Implemented for the Prism clone:**

- **Table formats:** Prism defines [eight kinds of data tables](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm); the clone supports them as follows. **Implemented (six):** Column (one grouping variable; replicates per column), XY (X + one or more Y series), **Grouped** (two grouping variables; cell replicates), **Contingency** (integer counts; row/column categories), **Survival** (time + event per subject ± group), **Parts of whole** (labels + values; e.g. pie data). **Planned (two):** **Multiple variables** (one row per case, one column per variable; correlation, multiple regression), **Nested** (hierarchical replication; nested t-test, nested one-way ANOVA). Each implemented format has data shape, registry (allowed analyses/graphs), schema/validation, and UI. Design and specs are informed by the scraped Prism user guide (Data tables section: `scripts/prism_guide_pages` with `--section data_tables`).
- **Analyses:** Descriptive, unpaired/paired t-test, one-way/two-way ANOVA, linear regression, dose-response 4PL; **Chi-square**, **Fisher’s exact**; **Kaplan–Meier**; **fraction of total**; **Mann–Whitney**, **Kruskal–Wallis**; **ROC AUC**; **normality test**. Single `runAnalysis()` (and async path for Bayesian); engine branches by format and analysis type. Bayesian-by-default: see §6.
- **Graph types:** Bar, grouped bar, scatter/line/scatterLine, dose-response, **survival** (step curves), **pie**; error bars, log axes, **two Y-axes**, **line of identity**; graph export **PNG/SVG**. Optional later: heat map, forest plot, box-and-whisker. See LLD graphs-and-charts.
- **Data prep:** **Normality test** (Column) implemented. **In-table transformations** are in scope: users define column transformations via an equation (e.g. log10(y)), toggle between raw and transformed view in the table, and choose per-analysis and per-graph whether to use raw or transformed data; transformations stay linked to the same table (no new tables). See LLD [Transformations](llds/transformations.md). Transform, normalize, remove baseline, identify outliers (Phase 9). See LLD analyses-and-engine.
- **Workflows:** **Layouts** (layout sheet, add/remove graphs, export layout PNG); **wand** (copy analysis/graph setup from one table to another); **rename table** (from sidebar or main UI; name in store propagates everywhere). Apply style from example and info sheets deferred. See LLD project-and-workflows.

---

## 4. Key design decisions and trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Table format growth** | Add formats incrementally with full stack (types, registry, engine, UI) per format. | Avoids half-supported types (e.g. Survival in types but no schema). Grouped can be first (builds on Column); then Contingency, Survival, Parts of whole. |
| **Analysis placement** | One engine (`runAnalysis()`), result types in `analysis.ts`, options in `analysisSchemas.ts`. | Matches current pattern; keeps one place for “what analyses exist” and one for execution. |
| **Graphs per table** | Keep multiple graphs per table; each graph can reference one optional analysis (e.g. fit overlay). | Already supported in state; no change. Layouts will add a separate “layout” entity that references graphs. |
| **Persistence** | JSON save/load plus Prism/Pzfx import and export. | Round-trip with Prism files is in scope; JSON remains the native format. |
| **Scope of “clone”** | Full analysis parity (all Prism analysis types reimplemented); Prism-like workflow and table/graph semantics; UI can evolve. | Clone supports the same analyses as Prism; implementation is phased via LLDs and EARS. |

---

## 5. Non-goals (explicit out of scope)

- **No scripting or macro language:** All workflows are GUI- and chat-driven. No Prism-style scripting.
- **No commercial licensing or activation:** No trial limits or license keys; open-source or non-commercial use.
- **No required desktop install:** Web remains a first-class target. Electron is an optional distribution channel; no requirement to ship installers.
- **No three separate “guides”:** Single documentation set; no need to mirror Prism’s Statistics / Curve Fitting / User Guide split.

---

## 5b. Distribution

- **Web:** Primary target. Build with Vite; run with `npm run dev` / `npm run build` / `npm run preview`. Deploy as static assets.
- **Desktop (optional):** Electron build produces standalone installers (e.g. .dmg, .exe, AppImage). Same UI and engine; no backend. API keys and secrets are never in the build; users configure them in the app (Settings).

---

## 6. Bayesian-by-default analysis layer (folded in)

Statistical analyses in the clone use **Bayesian estimation by default**: report posterior summaries and credible intervals (and optionally retain or reframe p-values as posterior probabilities). This is part of the Prism clone design, not a separate track.

**Architecture:**

- **Single entry point:** UI and NL continue to call `runAnalysis()` (or an async variant when needed). The engine invokes Bayesian implementations by default.
- **Result types:** Existing `AnalysisResult` variants are extended with Bayesian fields (e.g. credible intervals, P(diff > 0), posterior SD). Same result shape for charts and UI.
- **Implementation path:** Pyodide + PyMC first. Bayesian analyses run via Pyodide (CPython in WASM) and PyMC; load on demand so initial app load stays fast. Async only: `runAnalysis()` (or an async variant) returns a Promise; UI shows loading state. Use a single-threaded sampler to avoid Pyodide multiprocessing issues. No bayes.js or TypeScript Bayesian implementations; the engine calls into PyMC for all Bayesian analyses.
- **Scope:** Descriptive, t-tests, one-way ANOVA, linear regression, dose-response 4PL (and all new analyses as they are added) get Bayesian versions; result types carry posterior/credible output. Detailed task breakdown remains in `docs/plans/2025-03-05-bayesian-by-default.md` for implementation; the HLD commits to Bayesian-by-default as part of the clone.

**Current codebase:** HLD assumes dataplotter’s existing architecture (see [reference/architecture.md](reference/architecture.md)). LLDs and EARS detail changes per component.

---

**Next:** Low-Level Designs (LLDs), EARS specifications, and the implementation plan.

- **LLDs:** [Data tables and formats](llds/data-tables-and-formats.md), [Analyses and engine](llds/analyses-and-engine.md), [Graphs and charts](llds/graphs-and-charts.md), [Project and workflows](llds/project-and-workflows.md), [Transformations](llds/transformations.md).
- **EARS:** [Prism clone specs](specs/prism-clone-specs.md) — PRISM-TBL, PRISM-ANA, PRISM-GPH, PRISM-WKF.
- **Implementation plan:** [prism-clone.2026-03-06](planning/prism-clone.2026-03-06.md) — phased execution with spec traceability.
