# How to add a new analysis type

**Goal:** Add a new statistical analysis (e.g. paired t-test, new regression) that can be run from the UI and from Chat.

## 1. Extend types

**Files:** `src/types/project.ts`, `src/types/analysis.ts`, `src/types/analysisSchemas.ts`, `src/types/result.ts`

- Add the new analysis id to `AnalysisTypeId` in `project.ts` (e.g. `| 'paired_ttest'`).
- In `analysis.ts`, ensure `Analysis` and options types allow the new type.
- In `analysisSchemas.ts`, add a Zod schema for the new analysis **options** (e.g. `PairedTtestOptionsSchema`) and include it in `AnalysisOptionsSchema` (discriminated union on `type`).
- In `result.ts`, extend `AnalysisResult` with the new result shape (e.g. `| { type: 'paired_ttest'; t: number; p: number; ... }`).

## 2. Register allowed analyses

**File:** `src/lib/tableRegistry.ts`

- In `getAllowedAnalyses()`, return the new analysis id for the table formats where it applies (e.g. `column` → descriptive, unpaired_ttest, **paired_ttest**, anova).
- In `getDefaultOptions()` (if present), return default options for the new type when creating an analysis from the UI or Chat.

## 3. Implement the analysis

**File:** `src/engine/statistics/index.ts` (and optionally a new file under `src/engine/statistics/`)

- Implement a function that takes (table format, table data, options) and returns `Result<YourResultType, string>`.
- In `runAnalysis()`, add a branch for the new `analysisType` that calls your implementation and returns the result in the shape defined in `result.ts`.

## 4. Show results in the UI

**File:** `src/components/AnalysisPanel.tsx`

- In `AnalysisResultTable`, add a branch for `result.type === 'your_new_type'` and render a table (or other UI) from the result fields.

## 5. Chat / NL layer

**Files:** `src/nl/schemas.ts`, `src/nl/orchestrator.ts`

- In `runAnalysisArgsSchema`, `analysisType` is already a string; the LLM gets allowed types from context. Ensure the new type is returned by `getAllowedAnalyses()` so it appears in context.
- In the orchestrator’s tool-call handling, the `run_analysis` branch uses `runAnalysis()` from the engine; no change needed unless you add a new tool.

## Checklist

- [ ] `AnalysisTypeId` and options/result types updated
- [ ] Options Zod schema added and wired into `AnalysisOptionsSchema`
- [ ] `getAllowedAnalyses()` and default options updated in `tableRegistry.ts`
- [ ] `runAnalysis()` implements the new type in `src/engine/statistics/`
- [ ] `AnalysisResultTable` in `AnalysisPanel.tsx` renders the new result type
- [ ] Manual test: add table → Add analysis → choose new type → Run → see result
