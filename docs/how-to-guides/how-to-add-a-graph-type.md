# How to add a new graph type

**Goal:** Make a new chart kind (e.g. pie, box) available in the UI and in Chat.

## 1. Extend the type

**File:** `src/types/project.ts`

- Add the new id to the `GraphTypeId` union (e.g. `| 'pie'` or `| 'box'`).

## 2. Register the graph type

**File:** `src/lib/tableRegistry.ts`

- In `getAllowedGraphTypes()`, add the new id for the table formats where it makes sense (e.g. `column` → bar, scatter, **pie**).
- Optionally add constraints (e.g. “pie only for column tables with ≤ N columns”).

## 3. Build Plotly spec

**File:** `src/charts/adapter.ts`

- In `buildPlotlySpec()`, add a branch for your `graphType` (and table format, if needed).
- Return one or more `PlotlyTrace` objects (see existing `bar` and `scatter` branches).
- Use `PlotlyTrace`: `type: 'bar' | 'scatter'`, plus `x`, `y`, optional `hovertext`, `error_y`, etc.

## 4. Bar vs categorical X

**File:** `src/components/GraphView.tsx`

- If the new chart uses **categorical** x-axis (e.g. bar, pie), set `xaxis.type` to `'category'` for that graph type (see `isBarChart` and the `layout.xaxis.type` logic).
- Linear/numeric x can keep the default.

## 5. Chat / tools

The Chat “create graph” tool already sends `graphType` as a string; the LLM gets allowed types from context. If you added the type to `getAllowedGraphTypes()`, it will appear in the context. No change needed in `src/nl/` unless you add a new tool or constrain which types the model can suggest.

## Checklist

- [ ] `GraphTypeId` updated in `src/types/project.ts`
- [ ] `getAllowedGraphTypes()` updated in `src/lib/tableRegistry.ts`
- [ ] `buildPlotlySpec()` handles the new type in `src/charts/adapter.ts`
- [ ] `GraphView` layout (e.g. `xaxis.type`) correct for the new chart kind
- [ ] Manual test: add table → Add graph → choose new type → see chart
