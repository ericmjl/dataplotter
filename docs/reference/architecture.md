# Architecture

**Reference:** High-level structure and data flow for developers and coding agents.

## App shell

- **Layout:** `Sidebar` (left) | `app-content` (center: header + main area) | `ChatPanel` (right, fixed width).
- **Selection:** One of table / analysis / graph can be “selected” in the sidebar; the main area shows `TableView`, `AnalysisPanel`, or `GraphView` accordingly.
- **Header:** File actions (Open/Save JSON, Open .prism, Open .pzfx); no command bar. Chat is always open; no toggle.

## State (Zustand)

- **Single store** in `src/store/index.ts`: project state + UI state + actions.
- **Project state:** `project: Project` — tables, analyses, graphs, selection. All mutations go through actions (addTable, addAnalysis, addGraph, updateTableData, setSelection, etc.).
- **UI state:** e.g. `chatOpen`, `activeTab`; used sparingly. Chat is always visible; selection drives the main view.
- **Persistence:** Project is serialized to JSON and saved to localStorage (debounced) and can be saved/loaded as a file (JSON only for save).

## Data flow

1. **User picks table in sidebar** → `setSelection({ type: 'table', tableId })` → main area renders `TableView` for that table.
2. **User adds analysis or graph** → Actions add an entity and optionally set selection to it → corresponding view renders.
3. **User edits table cells** → `DataGrid` calls `onDataChange` → `updateTableData(tableId, newData)` → analyses linked to that table are cleared (result/error set to undefined).
4. **User runs analysis** → `AnalysisPanel` calls `runAnalysis()` from engine → `updateAnalysisResult` or `updateAnalysisError`.
5. **Graph view** → Reads selected graph, its table, and optional analysis result → `buildPlotlySpec()` in `charts/adapter.ts` → Plotly traces and layout → `GraphView` renders `<Plot>` (react-plotly.js). Bar charts use `xaxis.type: 'category'`.

## Transformations and effective data

Table data can be shown and used in two modes: **raw** (stored) or **transformed** (equations applied per column). Raw data and transformation metadata live on the table (`table.data`, `table.transformations`, `table.viewMode`). Consumers do not read `table.data` directly when transformations exist; they call **`getEffectiveTableData(table, mode)`** in `src/lib/effectiveTableData.ts`, which returns data in the same shape (ColumnTableData or XYTableData). The engine and chart adapter receive this effective data; their signatures do not change. **Table view** uses `table.viewMode` (raw vs transformed) for the grid; when showing transformed, the grid is read-only. **Analysis** and **graph** each have an option **dataMode** (raw | transformed); when running an analysis or building a chart, the app passes `getEffectiveTableData(table, analysis.options.dataMode ?? 'raw')` or `graph.options.dataMode ?? 'raw'`. Changing raw data or transformation definitions clears analysis results for that table.

## Chat / NL layer

1. **User sends message** → `ChatPanel` calls `handleUserMessage(msg, getState, actions, callLLM)` in `orchestrator.ts`.
2. **Orchestrator** builds a system message (with serialized project context from `buildContext()`), sends messages + tools to `callLLM` (from `callLLM.ts`).
3. **callLLM** selects provider (Groq / Anthropic / OpenAI-compatible) from env, calls AI SDK `generateText()` with tools defined via Zod schemas; returns `{ content, toolCalls }`.
4. **Orchestrator** parses tool calls and executes them (run_analysis, create_graph, create_table, update_graph_options, list_analyses_for_table, list_graph_types_for_table) by calling store actions and engine; collects outcomes and returns a reply string to the user.

## Key technical choices

- **Bar chart x-axis:** Bar charts use categorical x; layout must set `xaxis.type: 'category'` (see `GraphView.tsx`).
- **Hooks:** All React hooks (useState, useStore, useCallback) must run unconditionally at the top of components (no hooks after early returns).
- **Plotly:** Uses `vite-plugin-node-polyfills` and `define: { global: 'globalThis' }` so Plotly.js runs in the browser.
- **Save format:** Only JSON is supported for saving; .prism and .pzfx are import-only.
