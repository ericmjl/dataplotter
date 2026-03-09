# LLD: Graphs and charts

**Created**: 2026-03-06  
**Status**: Implemented (survival, pie, groupedBar, two Y-axes, line of identity, export PNG/SVG)  
**References**: [HLD](../high-level-design.md), [project layout](../reference/project-layout.md)

---

## Context and design philosophy

Graphs are built from table data and optionally an analysis result (e.g. regression line, 4PL curve). The chart layer is stateless: given graph type, table data, result, and options, it produces Plotly traces and layout. The registry defines which graph types are allowed per table format. This LLD covers the current adapter behavior and the additions needed for the Prism clone: survival curves, pie charts, and any format-specific options (error bars, log axes, two Y-axes) that align with Prism expectations.

---

## Current adapter contract

**File:** `src/charts/adapter.ts`.

**Signature:** `buildPlotlySpec(graphType, tableData, analysisResult, graphOptions): BuildPlotlyResult`.

- **BuildPlotlyResult:** `{ traces: PlotlyTrace[], layout?: BarChartLayout }`. Bar charts use a custom layout to set `xaxis.type: 'category'` and tick labels; other types use default layout or extend as needed.
- **PlotlyTrace:** type `'bar' | 'scatter'`, optional `error_y`, `mode: 'markers' | 'lines' | 'lines+markers'`, name, hovertext.
- **GraphOptions** (from `graph.ts`): title, xAxisLabel, yAxisLabel, xAxisScale, yAxisScale, errorBarType (sem/sd/ci/none), showLegend, annotations.

**Implemented graph types:**

| GraphTypeId | Format(s) | Behavior |
|-------------|-----------|----------|
| bar | column | Column means with error bars; optional scatter overlay (replicates); categorical x. |
| groupedBar | grouped | One bar series per row group; x = col groups; cell means. |
| scatter | xy | One scatter trace per Y series; optional second Y-axis (yAxis2SeriesIndex). |
| line | xy | Line(s) through points; optional line of identity (X=Y). |
| scatterLine | xy | Markers + lines. |
| doseResponse | xy | Points + optional 4PL curve from analysis result; log x optional. |
| survival | survival | Step curves from Kaplan–Meier result or computed from SurvivalTableData. |
| pie | partsOfWhole | Pie trace from PartsOfWholeTableData or fraction_of_total result. |

---

## Graph types to add or complete

### Survival (survival) — implemented

- **Data source:** SurvivalTableData; adapter uses runKaplanMeier when no analysis result, or kaplan_meier result curves.
- **Trace:** Scatter with mode `'lines'`, `line: { shape: 'hv' }` (step). One trace per group.

### Pie (pie) — implemented

- **Data source:** PartsOfWholeTableData or fraction_of_total result; PlotlyPieTrace (type: 'pie', labels, values).
- **Registry:** pie in getAllowedGraphTypes('partsOfWhole').

### Grouped bar — implemented

- **groupedBar** for GroupedTableData; one bar trace per row group; x = col groups, cell means from cellValues.

---

## Options and layout

- **Error bars:** Already supported (sem, sd, ci, none). Column bar uses colSEM/colSD or CI from descriptive/ANOVA if needed.
- **Log axes:** xAxisScale / yAxisScale (linear | log) in GraphOptions; adapter or GraphView must pass these to Plotly layout (xaxis.type, yaxis.type).
- **Two Y-axes:** Implemented. GraphOptions.yAxis2SeriesIndex (0-based) assigns one XY series to right axis; layout.yaxis2 (overlaying, side: right). PRISM-GPH-010.
- **Line of identity:** Implemented. GraphOptions.showLineOfIdentity adds X=Y trace for XY/scatter/line graphs.
- **Box-and-whisker:** For Column or XY with replicates, offer “box-and-whiskers” as an appearance option (Plotly box trace). In scope; Phase 9.
- **Annotations:** Already in GraphOptions; included in export (PNG/SVG) per existing behavior.
- **Axis label decimal places:** Allow up to 14 decimal places for numeric axis labels (Prism 10.5 Standard; [FAQ 2259](https://www.graphpad.com/support/faqid/2259/)). GraphOptions: e.g. `axisLabelDecimals?: number` (0–14).

**Extended visuals (Prism Pro/Standard parity, [FAQ 2259](https://www.graphpad.com/support/faqid/2259/)):**

- **Heat map:** From Multiple variables: (a) categorical X and Y variables + continuous metric, or (b) treat MV table as matrix (rows/columns as axis variables). When Grouped exists, heat map from cell means (or similar) remains an option. LLD: add `heatmap` graph type; adapter produces Plotly heatmap trace.
- **Dendrograms:** From hierarchical clustering result; standalone graph or overlaid on heat map rows/columns. New graph type or trace type; registry allows for multipleVariables (and optionally column/xy when clustering is offered).
- **Confidence ellipses and convex hulls:** For scatter/XY graphs: optional overlay of confidence ellipses (e.g. 95% for population parameters) or convex hulls per group. GraphOptions: e.g. `showConfidenceEllipse?: boolean`, `showConvexHull?: boolean`, per series or per group.
- **Axis variable assignment (MV graphs):** When graph is from Multiple variables table, Graph Inspector (or options) lets user choose which variable is X and which is Y (or cycle through variables). Enables flexible XY plots from the same MV table without restructuring. Store in GraphOptions (e.g. `xVariableId`, `yVariableId` or variable labels).

---

## Export and view

- **GraphView** renders the result of `buildPlotlySpec()` with react-plotly.js; export PNG/SVG uses the same spec. No change required for new trace types as long as Plotly supports them (pie, scatter/line for survival).
- **Selection:** Clicking a bar can highlight and show details (existing selected-bar panel); survival and pie may have different interaction (e.g. hover slice, hover point). Can stay minimal for v1.

---

## Open questions and future decisions

### Resolved

1. ✅ **Survival as scatter/line:** Use scatter with lines (and optional step) rather than a custom Plotly chart type; keeps adapter consistent.
2. ✅ **Pie from partsOfWhole:** Primary data source for pie is PartsOfWholeTableData; column with one column is an optional fallback.

### Deferred

1. **Grouped/stacked bar layout:** Exact trace structure (one trace per group vs one trace with multiple series) and layout (bargap, barmode) when Grouped format exists.
2. **Forest plot:** Specialized column graph (odds ratio + CI; median+range display, horizontal, log X, line at 1). In scope when Column/analyses support it; Phase 9 optional.
3. **Heat map:** From Grouped (cell means) or from Multiple variables (categorical X/Y + metric, or matrix view). See Extended visuals above and HLD § Extended features; Phase 9 or with MV format.

---

## References

- `src/charts/adapter.ts` — buildPlotlySpec, PlotlyTrace, BarChartLayout
- `src/types/graph.ts` — Graph, GraphOptions
- `src/lib/tableRegistry.ts` — getAllowedGraphTypes
- `src/components/GraphView.tsx` — render and export
