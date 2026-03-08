# LLD: Analyses and engine

**Created**: 2026-03-06  
**Status**: Implemented (full set per format; see table below)  
**References**: [HLD](../high-level-design.md), [project layout](../reference/project-layout.md)

---

## Context and design philosophy

The analysis engine turns table data + analysis type + options into a result (or an error). All analyses go through a single entry point, `runAnalysis()`, so the UI and NL layer do not branch on implementation details. Result types are a discriminated union keyed by `type`; options are a discriminated union keyed by analysis type. The registry determines which analyses are allowed per table format. Full analysis parity with Prism is in scope (HLD): all Prism analysis types are to be reimplemented, phased via EARS. Bayesian-by-default is part of the HLD (§6): analyses use Bayesian estimation by default; this LLD describes the engine and result shapes that support both full parity and Bayesian outputs.

---

## Entry point and flow

**File:** `src/engine/statistics/index.ts` (and optionally `src/engine/curveFitting/` for 4PL).

**Signature:** `runAnalysis(format, analysisType, tableData, options): Result<AnalysisResult>`.

1. Validate format + analysisType + tableData (e.g. via tableRegistry and analysisSchemas).
2. Branch on `(format, analysisType)` and call the appropriate implementation (e.g. `runUnpairedTtest`, `runOneWayAnova`, `runLinearRegression`, `runDoseResponse4pl`).
3. Return `{ ok: true, value: AnalysisResult }` or `{ ok: false, error: string }`.
4. Store does not call engine directly; components (AnalysisPanel, orchestrator) call `runAnalysis()` and then `updateAnalysisResult` / `updateAnalysisError`.

Analyses that need table data from a specific format: Column (descriptive, t-tests, one-way ANOVA), XY (linear regression, dose-response 4PL). New formats will add new branches (e.g. Grouped → two-way ANOVA; Contingency → Chi-square, Fisher; Survival → Kaplan–Meier; Parts of whole → fraction of total, Chi-square goodness of fit).

---

## Current analysis types and result shapes

| AnalysisTypeId | Format(s) | Result type (analysis.ts) | Options | Status |
|----------------|-----------|---------------------------|---------|--------|
| descriptive | column, xy | descriptive (byColumn) | DescriptiveOptions | ✅ |
| unpaired_ttest | column | unpaired_ttest | UnpairedTtestOptions (columnLabels) | ✅ |
| paired_ttest | column | paired_ttest | PairedTtestOptions (columnLabels) | ✅ |
| one_way_anova | column | one_way_anova | OneWayAnovaOptions | ✅ |
| two_way_anova | grouped | two_way_anova | TwoWayAnovaOptions | ✅ |
| chi_square | contingency | chi_square | ChiSquareOptions | ✅ |
| fisher_exact | contingency | fisher_exact | FisherExactOptions | ✅ |
| kaplan_meier | survival | kaplan_meier | KaplanMeierOptions | ✅ |
| fraction_of_total | partsOfWhole | fraction_of_total | FractionOfTotalOptions | ✅ |
| mann_whitney | column | mann_whitney | MannWhitneyOptions (columnLabels) | ✅ |
| kruskal_wallis | column | kruskal_wallis | KruskalWallisOptions | ✅ |
| roc_auc | column | roc_auc | RocAucOptions (columnLabels) | ✅ |
| normality_test | column | normality_test | NormalityTestOptions (columnLabel) | ✅ |
| linear_regression | xy | linear_regression | LinearRegressionOptions (ySeriesLabel) | ✅ |
| dose_response_4pl | xy | dose_response_4pl | DoseResponse4plOptions (ySeriesLabel, logX) | ✅ |

---

## Bayesian result fields (side-by-side with frequentist)

Analyses that support Bayesian estimation (via PyMC) include optional Bayesian fields in their result types. These fields are populated when PyMC completes successfully; otherwise, only frequentist fields are present.

**unpaired_ttest / paired_ttest (group comparisons):**
- `mean1CrI?: [number, number]` — 95% credible interval for group 1 mean
- `mean2CrI?: [number, number]` — 95% credible interval for group 2 mean
- `meanDiffCrI?: [number, number]` — 95% credible interval for mean difference
- `pSuperiority?: number` — P(μ₁ > μ₂), probability that group 1 mean exceeds group 2
- `effectSize?: number` — Cohen's d (posterior mean)
- `effectSizeCrI?: [number, number]` — 95% CrI for Cohen's d

**Implementation notes:**
- PyMC model uses improper flat priors (concept validation phase)
- Posterior samples: μ₁, μ₂ ~ Normal(μ, σ) with flat priors on means, half-flat on σs
- Async only: `runAnalysisAsync()` loads PyMC and extends the frequentist result

---

## Bayesian survival analysis (PyMC)

**Goal (HLD §6):** When PyMC is available, survival (Kaplan–Meier) analysis may include a Bayesian path: posterior survival curves and credible intervals, so users get both the classic Kaplan–Meier curve and Bayesian summaries (e.g. median survival CrI, hazard ratio CrI when comparing two groups).

**Current state:** Kaplan–Meier is implemented in TypeScript only (`src/engine/statistics/kaplanMeier.ts`); no PyMC survival path exists. Result type `kaplan_meier` has `curves: { group, time, survival }[]`.

**Target design:**

1. **Model choice:** A parametric or semi-parametric survival model in PyMC (e.g. Weibull survival, or piecewise exponential) that takes (time, event) per subject and optional group. Output: posterior samples of survival function (and optionally hazard), median survival, and—for two groups—hazard ratio with CrI.
2. **Result extension:** Extend `kaplan_meier` result with optional Bayesian fields, e.g. `medianSurvivalCrI?: [number, number]` (or per-group), `hazardRatioCrI?: [number, number]` when two groups, and optionally `posteriorSurvivalCurves?:` (summary curves with uncertainty bands). Same result shape for charts and UI; Bayesian fields populated when PyMC completes.
3. **Engine flow:** In `runAnalysisAsync()`, when `analysisType === 'kaplan_meier'` and format is survival: run TS Kaplan–Meier first (frequentist result); if Pyodide/PyMC is available, run PyMC survival script and merge posterior summaries into the result; otherwise leave Bayesian fields undefined. Fall-forward: if PyMC fails or is unavailable, return frequentist-only result (no error).
4. **Implementation:** New module `src/engine/pymc/survival.ts` (or similar) that accepts SurvivalTableData, runs a PyMC survival model (script string or API), and returns the posterior summaries to merge. Same loader/runner pattern as `descriptive.ts`, `regression.ts`, `doseResponse4pl.ts`.

**Traceability:** EARS PRISM-ANA-019 (Bayesian survival with PyMC); implementation plan phase for “Bayesian survival”.

---

## Result type contract

Each result variant has `type: '<analysis_type>'` and a set of fields. The chart adapter and UI may depend on specific fields (e.g. `curve` for dose-response overlay; `groupMeans` for ANOVA). New analyses must:

1. Add a discriminated branch to `AnalysisResult` in `analysis.ts`.
2. Add the corresponding options type and schema in `analysisSchemas.ts`.
3. Implement the engine function and call it from `runAnalysis()`.
4. Register the analysis in `tableRegistry.getAllowedAnalyses(format)` for the right format(s).
5. If graphs or NL tools depend on it, extend charts and orchestrator.

---

## Analyses for new table formats (target)

Full analysis parity with Prism is in scope. All analysis types that Prism offers for each table format shall be implemented (parametric, nonparametric, regression, contingency, survival, dose-response, ROC, Bland–Altman, etc.). Phasing is defined in EARS and implementation plans.

| Format | Analyses to support (representative; full set per Prism) |
|--------|--------------------------------------------------------|
| grouped | Two-way ANOVA (ordinary, mixed); row means with error; multiple t-tests per row; nonparametrics (e.g. Friedman) where applicable. |
| contingency | Chi-square test; Fisher’s exact test; odds ratio; relative risk. |
| survival | Kaplan–Meier (survival curve, median survival); log-rank (or similar) comparison of curves. |
| partsOfWhole | Fraction of total; Chi-square goodness of fit (observed vs expected). |
| multipleVariables | Correlation matrix; multiple linear regression; PCA; identify outliers; descriptive. |
| column (extend) | Paired t-test; nonparametrics (Mann-Whitney, Wilcoxon, Kruskal-Wallis, etc.); ROC; Bland–Altman; normality tests; frequency distribution; P value summary methods; etc. |
| xy (extend) | Deming (model II) regression; spline/LOWESS; AUC; interpolate standard curve; etc. |

Implementation order should follow table format rollout and EARS priorities.

---

## Data prep (transform, normalize, remove baseline)

Prism’s “Transform, Normalize…” analyses produce new result tables (or sheets) rather than modifying the source table. These are in scope for full parity and are phased in the implementation plan (Phase 9).

- **Transform:** Apply a function to Y (or X): e.g. Y*K, log(Y), sqrt(Y), z-score(Y), rank(Y), or kinetics transforms (Eadie-Hofstee, Lineweaver-Burk, Scatchard, Hill). Result: new table with transformed values. Can be implemented as an analysis type that takes a table and outputs a derived table, or as a dedicated “Transform” operation; same engine/registry pattern.
- **Normalize:** Scale Y to 0–100% (or 0–1) with user-defined baselines (e.g. min/max, first/last row, entered value, sum). Result: new table. Often used before dose-response fitting.
- **Remove baseline:** Subtract a baseline (e.g. first row or constant) from Y. Can be a separate analysis or part of Normalize.
- **Normality tests** and **identify outliers** (Column) support “when to use which test” workflows (parametric vs nonparametric); already listed in the column (extend) row above. Implementation plan Phase 9 calls them out explicitly.

Traceability: Implementation plan Phase 9 (data prep and graph formatting parity) references these; EARS can add specs (e.g. PRISM-ANA for normality, identify outliers, transform, normalize) when formalizing.

---

## Error handling and validation

- **Pre-check:** Before calling an analysis implementation, validate that table data has the right shape and required values (e.g. no all-null columns for t-test; contingency counts non-negative integers). Return `Result.err("...")` with a user-facing message.
- **Engine errors:** Implementations can return `Result.err(...)` for numerical failures (e.g. singular matrix, non-convergence). The store sets `analysis.error` and clears `analysis.result`; UI shows the error.
- **Clearing results:** When table data changes, the store clears result/error for analyses linked to that table (existing behavior). No need to re-run automatically; user clicks Run again.

---

## Bayesian-by-default (HLD §6)

The HLD folds in Bayesian-by-default: analyses use Bayesian estimation by default (posterior summaries, credible intervals). The same `runAnalysis()` entry point invokes Bayesian implementations; result types are extended with Bayesian fields (e.g. credible intervals, P(diff > 0)). Primary path is TypeScript (conjugate priors, lightweight MCMC); optional Pyodide/PyMC path for richer models is async and on demand. Task-level detail and implementation order remain in `docs/plans/2025-03-05-bayesian-by-default.md`; this LLD assumes result shapes and engine branching support those extensions.

---

## Open questions and future decisions

### Resolved

1. ✅ **Single entry point:** Keep `runAnalysis()` as the only public API for running analyses; no separate “runBayesianAnalysis” in the UI unless we add a toggle later.
2. ✅ **Paired t-test:** Implement as first “gap fix” before adding new formats; it reuses Column data and fits the current engine pattern.

### Deferred

1. **Two-way ANOVA result shape:** Detailed fields (main effects, interaction, post-hoc); align with Prism’s output for interpretability.
Phase 9 or later.

---

## References

- `src/types/analysis.ts` — AnalysisResult, AnalysisOptions
- `src/types/analysisSchemas.ts` — Zod schemas and union
- `src/engine/statistics/` — implementations
- `src/lib/tableRegistry.ts` — getAllowedAnalyses
