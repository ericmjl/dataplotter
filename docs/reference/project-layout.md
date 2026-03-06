# Project layout

**Reference:** Where to find code and config. Paths are relative to the repo root.

## Top level

| Path | Purpose |
|------|--------|
| `package.json` | Scripts, dependencies (React, Vite, AI SDK, Plotly, Zustand, Zod). |
| `vite.config.ts` | Vite config: React plugin, node polyfills, `global` define for Plotly. |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript config. |
| `eslint.config.js` | ESLint config. |
| `cypress.config.ts` | Cypress E2E config (baseUrl, spec pattern). |
| `cypress/e2e/` | E2E specs (`*.cy.ts`). |
| `index.html` | Single HTML entry; script loads `src/main.tsx`. |
| `.env.example` | Example env vars; copy to `.env.local` (gitignored). |
| `docs/` | Documentation (Diataxis). |

## Source: `src/`

| Path | Purpose |
|------|--------|
| `main.tsx` | App mount, React root. |
| `App.tsx` | Shell: sidebar, header, main content area, chat panel. |
| `App.css` | Minimal; most styles in `index.css`. |
| `index.css` | Global design tokens, layout, components (sidebar, header, grid, chat, etc.). |
| `ErrorBoundary.tsx` | Catches React errors and shows a fallback UI. |

## Components: `src/components/`

| File | Role |
|------|------|
| `Sidebar.tsx` | Left nav: brand, add table/sample, list of tables, analyses, graphs; selection state. |
| `TableView.tsx` | Main area when a table is selected: toolbar (add row, add analysis, add graph), data grid. |
| `AnalysisPanel.tsx` | Main area when an analysis is selected: Run button, result table or error. |
| `GraphView.tsx` | Main area when a graph is selected: Plotly chart, export PNG/SVG, optional selected-bar panel. |
| `DataGrid.tsx` | Editable table for column or XY data; used inside TableView. |
| `NewTableDialog.tsx` | Modal to create a table (name, format). |
| `ChatPanel.tsx` | Right-hand chat: messages, input; calls NL orchestrator with `callLLM`. |

## State: `src/store/`

| File | Role |
|------|------|
| `index.ts` | Zustand store: combines project slice + UI slice. |
| `projectSlice.ts` | Project state and actions: tables, analyses, graphs, selection; add/remove/update. |
| `uiSlice.ts` | UI state: `activeTab`, `chatOpen` (legacy); `setChatOpen`, `setActiveTab`. |

## Types: `src/types/`

| File | Role |
|------|------|
| `project.ts` | TableId, AnalysisId, GraphId; TableFormatId, AnalysisTypeId, GraphTypeId; ColumnTableData, XYTableData; DataTable, Project, Selection. |
| `analysis.ts` | Analysis, analysis options. |
| `analysisSchemas.ts` | Zod schemas for analysis options (discriminated union). |
| `graph.ts` | Graph, GraphOptions. |
| `result.ts` | AnalysisResult (discriminated union per analysis type). |
| `index.ts` | Re-exports. |

## Data & engine

| Path | Purpose |
|------|--------|
| `src/data/sampleColumn.ts`, `sampleXY.ts` | Sample table data and names for “New from sample”. |
| `src/engine/statistics/` | Analysis implementations: descriptive, t-test, anova, regression, dose-response; `index.ts` exports `runAnalysis()`. |
| `src/engine/curveFitting/fourPL.ts` | 4PL curve for dose-response. |

## Charts & IO

| Path | Purpose |
|------|--------|
| `src/charts/adapter.ts` | `buildPlotlySpec()`: maps graph type + table data + analysis result → Plotly traces. |
| `src/lib/tableRegistry.ts` | `getSchema`, `validateTableData`, `getAllowedAnalyses`, `getAllowedGraphTypes`, `getDefaultOptions`. |
| `src/lib/importProject.ts`, `exportProject.ts`, `projectSchema.ts` | JSON project load/save and schema. |
| `src/io/prism/` | Prism file parse/build (import only for Prism). |
| `src/io/pzfx/` | Pzfx file parse/build (import only for Pzfx). |

## NL (Chat) layer

| Path | Purpose |
|------|--------|
| `src/nl/callLLM.ts` | LLM provider selection (Groq, Anthropic, OpenAI-compatible), tool definitions, `callLLM` and `getLLMProvider()`. |
| `src/nl/orchestrator.ts` | `handleUserMessage()`: builds context, calls LLM with tools, executes tool calls (run_analysis, create_graph, create_table, etc.). |
| `src/nl/context.ts` | `buildContext()`: serializes project state for the LLM system prompt. |
| `src/nl/schemas.ts` | Zod schemas for tool arguments (run_analysis, create_graph, create_table, …). |

## Hooks & config

| Path | Purpose |
|------|--------|
| `src/hooks/useProjectSaveLoad.ts` | File refs and handlers: JSON load/save, Prism/Pzfx load, localStorage autosave. |
| `src/plotly-react.d.ts` | Declarations for `react-plotly.js` and `plotly.js`. |
| `src/jstat.d.ts` | Declarations for jstat if needed. |

## Tests

- `*.test.ts` next to source (e.g. `src/engine/statistics/descriptive.test.ts`, `src/lib/importProject.test.ts`, `src/lib/tableRegistry.test.ts`). Run with `npm test`.
