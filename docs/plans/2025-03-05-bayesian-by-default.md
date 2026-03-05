# Bayesian-by-Default Statistical Analyses — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all default statistical analyses use Bayesian estimation: report posterior summaries and credible intervals instead of (or in addition to) p-values and confidence intervals, while keeping the app running fully in the browser.

**Architecture:** Add a Bayesian engine layer that can run either via (1) JavaScript/TypeScript implementations using conjugate priors or a lightweight MCMC (e.g. bayes.js-style), or (2) an optional Pyodide + PyMC path for richer models. Extend existing analysis result types to carry Bayesian outputs (posterior mean/median, credible intervals, optional P(ROPE) or P(diff>0)). UI shows “Credible interval (95%)” and posterior summaries; p-values become optional or reframed as posterior probabilities.

**Tech Stack:** TypeScript (existing), jStat (retain for descriptive stats and utilities), new: either a JS Bayesian library (e.g. bayes.js or custom conjugate + simple MCMC) and/or Pyodide + PyMC (async, worker or main thread). No backend required; all runs in browser.

---

## Can we use PyMC here? Can we use it in WASM?

**Short answers:**

- **Yes, you can use PyMC in this app.** The app is a browser-based React/Vite front end with no backend; analyses today run in the browser via jStat. PyMC can run in the browser by using **Pyodide** (CPython compiled to WebAssembly), so Python (and PyMC) execute client-side.
- **Yes, you can use it in WASM.** The standard way is **Pyodide + (optionally) PyScript**: load Pyodide, install PyMC via `micropip`, and run `pyodide.runPythonAsync()` with a string that builds a PyMC model and runs NUTS. There are working demos (e.g. [PyMC in the browser](https://twiecki.io/pymc-in-browser/)).
- **Caveats:**
  - **Bundle size and startup:** Pyodide is a full Python runtime (tens of MB). Load it asynchronously (e.g. in a Web Worker or on first “Run” of a Bayesian analysis) so the initial app load stays fast.
  - **Multiprocessing:** PyMC has optional multiprocessing code that can break under Pyodide (see [pymc-devs/pymc#7519](https://github.com/pymc-devs/pymc/issues/7519)). Use a single-threaded sampler or a build that avoids multiprocessing imports; the in-browser demo avoids this by design.
  - **Async only:** Pyodide runs asynchronously. The current `runAnalysis()` is synchronous. So any “PyMC path” must be async: e.g. `runAnalysisAsync()` or a dedicated `runBayesianAnalysisPyMC()` that returns a `Promise<Result<AnalysisResult>>`, and the UI (e.g. AnalysisPanel) must handle loading state and await the result.

**Recommendation for the plan:** Support two paths so you can ship without depending on Pyodide:

1. **Primary (ship first):** Implement Bayesian versions of each analysis in **TypeScript**, using conjugate priors where closed-form (e.g. Normal-Normal for means, Bayesian t-test style for two groups, Bayesian linear regression) and a small MCMC or existing JS library (e.g. bayes.js) where needed. No WASM, no Python; synchronous or small async.
2. **Optional enhancement:** Add an optional “Use PyMC (WASM)” mode that loads Pyodide on demand and runs a PyMC model for the same analysis, then maps PyMC/ArviZ output into the same `AnalysisResult` shape. This gives full flexibility (e.g. 4PL with full posteriors) but is heavier and async-only.

---

## 1. Scope: Which analyses become Bayesian

| Analysis            | Current (frequentist)     | Bayesian target |
|---------------------|---------------------------|------------------|
| Descriptive         | Mean, SEM, SD, median     | Add posterior mean ± 95% CrI per group/column (conjugate Normal-Normal or similar). |
| Unpaired t-test     | t, p, df, means, 95% CI   | Mean difference, 95% credible interval, P(diff > 0) or P(ROPE); optional Bayes factor. |
| One-way ANOVA       | F, p, df, group means     | Group means with 95% CrIs; effect/contrast posteriors (e.g. pairwise differences). |
| Linear regression   | Slope, intercept, R², p, CI| Posterior mean and 95% CrI for slope/intercept; posterior predictive R² or similar. |
| Dose-response 4PL   | Point EC50, etc. (no CI)  | Posterior mean and 95% CrI for EC50, bottom, top, hill slope (MCMC or PyMC). |

---

## 2. Type and schema changes

**Files:** `src/types/analysis.ts`, `src/types/analysisSchemas.ts` (if options gain a “use PyMC” flag later).

- **AnalysisResult** (in `analysis.ts`): Extend each variant to include Bayesian-oriented fields; keep existing fields for backward compatibility or replace where it’s clearly “Bayesian by default.”
  - **descriptive:** Add optional `byColumn[].meanCrI?: [number, number]`, `byColumn[].meanSD?: number` (posterior s.d. of mean). Keep `mean`, `sem`, `sd`, etc.
  - **unpaired_ttest:** Add `meanDiffCrI: [number, number]`, `pDiffPositive?: number` (P(μ1 > μ2)); rename or dual-use `ci` as “credible interval” in UI when Bayesian. Keep `mean1`, `mean2`; consider `df` optional or drop for Bayesian.
  - **one_way_anova:** Add `groupMeans[].meanCrI?: [number, number]`, optional effect/contrast summaries. Keep or adapt `df*`, `f` for optional display.
  - **linear_regression:** Add `slopeCrI`, `interceptCrI` (or repurpose existing `slopeCI` as credible); add optional `r2Posterior?: number`. Keep `slope`, `intercept`, `r2`; `p` can become optional or P(slope ≠ 0).
  - **dose_response_4pl:** Already has `ec50CI`; ensure it’s populated as credible interval from Bayesian fit; add optional CrIs for `bottom`, `top`, `hillSlope` if available.
- **Options:** For now, no new option required if everything is “Bayesian by default.” Later, add optional `analysisOptions.usePyMC?: boolean` (or a global “Use PyMC when available”) and wire in `analysisSchemas.ts`.

---

## 3. Engine layout: Bayesian layer

**Files:** Create `src/engine/bayesian/` (or under `src/engine/statistics/bayesian/`).

- **Index:** `runBayesianAnalysis(format, analysisType, tableData, options): Result<AnalysisResult>` (sync) and optionally `runBayesianAnalysisPyMC(...): Promise<Result<AnalysisResult>>` (async).
- **Per-analysis modules:** e.g. `descriptive.ts`, `ttest.ts`, `anova.ts`, `regression.ts`, `doseResponse4pl.ts` that implement Bayesian versions and return the extended result shapes.
- **Shared:** Priors (e.g. weak Normal for means, Normal-Inverse-Gamma for regression), and if using JS MCMC: a thin wrapper around bayes.js or a minimal Metropolis–Hastings for 4PL.
- **Integration:** In `src/engine/statistics/index.ts`, change `runAnalysis()` to call the Bayesian implementations by default (or add a `runAnalysis(..., { bayesian: true })` and make `bayesian: true` the default). Keep a single entry point so the UI and Chat continue to call `runAnalysis(...)`.

---

## 4. Implementation tasks (bite-sized)

### Task 1: Extend AnalysisResult types for Bayesian outputs

**Files:**  
- Modify: `src/types/analysis.ts`

**Steps:**

1. Add to descriptive `byColumn`: `meanCrI?: [number, number]`, `meanSD?: number`.
2. Add to unpaired_ttest: `meanDiffCrI: [number, number]`, `pDiffPositive?: number`; document that `ci` is credible interval when Bayesian.
3. Add to one_way_anova: `groupMeans[].meanCrI?: [number, number]`.
4. Add to linear_regression: `slopeCrI` and `interceptCrI` (or state that `slopeCI` is CrI); `r2Posterior?: number`.
5. Ensure dose_response_4pl has optional CrIs for bottom, top, hillSlope if you will compute them.

**Test:** Run `npm run build`; fix any type errors in `AnalysisPanel.tsx` or engine that reference result shapes.

**Commit:** `feat(types): extend AnalysisResult for Bayesian credible intervals and posterior probs`

---

### Task 2: Bayesian descriptive (conjugate Normal-Normal)

**Files:**  
- Create: `src/engine/bayesian/descriptive.ts`  
- Modify: `src/engine/statistics/index.ts` (or `src/engine/bayesian/index.ts`) to call it for `descriptive`.

**Steps:**

1. Implement function that, per column/group: computes sample mean and variance, applies conjugate Normal-Normal (or Normal-Inverse-Gamma) with weak prior, returns posterior mean, posterior s.d. of mean, and 95% credible interval for the mean.
2. Return the same structure as current descriptive plus `meanCrI` and `meanSD` per column.
3. Wire `runAnalysis(..., 'descriptive', ...)` to use this implementation so descriptive is “Bayesian by default.”
4. Add unit test: known data → check posterior mean and CrI in expected range.

**Commit:** `feat(engine): Bayesian descriptive statistics with conjugate prior`

---

### Task 3: Bayesian unpaired t-test

**Files:**  
- Create: `src/engine/bayesian/ttest.ts`  
- Modify: `src/engine/statistics/index.ts` to use it for `unpaired_ttest`.

**Steps:**

1. Implement Bayesian two-sample model (e.g. independent Normal likelihoods with weak priors on μ1, μ2, σ1, σ2; or use closed-form approximation for mean difference). Compute posterior of (μ1 − μ2), 95% CrI, and P(μ1 > μ2).
2. Return extended unpaired_ttest result with `meanDiffCrI`, `pDiffPositive`; set `ci` to the same as `meanDiffCrI` for compatibility.
3. Add test: two samples → posterior P(μ1 > μ2) and CrI.
4. Wire into `runAnalysis()`.

**Commit:** `feat(engine): Bayesian unpaired t-test with credible interval and P(diff>0)`

---

### Task 4: Bayesian one-way ANOVA

**Files:**  
- Create: `src/engine/bayesian/anova.ts`  
- Modify: `src/engine/statistics/index.ts` to use it for `one_way_anova`.

**Steps:**

1. Implement hierarchical Bayesian one-way (e.g. group means μ_g ~ Normal(μ, τ), data ~ Normal(μ_g, σ)); weak priors. Sample or use approximation to get posterior group means and 95% CrIs.
2. If using a JS MCMC (e.g. bayes.js), define log-posterior and run sampler; summarize posteriors. Return group means with `meanCrI`.
3. Add test; wire into `runAnalysis()`.

**Commit:** `feat(engine): Bayesian one-way ANOVA with group mean CrIs`

---

### Task 5: Bayesian linear regression

**Files:**  
- Create: `src/engine/bayesian/regression.ts`  
- Modify: `src/engine/statistics/index.ts` to use it for `linear_regression`.

**Steps:**

1. Implement Bayesian linear regression (conjugate Normal-Inverse-Gamma prior on (β, σ²) or simple MCMC). Return posterior mean and 95% CrI for slope and intercept; optional posterior R² or predictive R².
2. Map to existing linear_regression result shape; set `slopeCI` to slope CrI, add `interceptCrI` and optional `r2Posterior`.
3. Add test; wire into `runAnalysis()`.

**Commit:** `feat(engine): Bayesian linear regression with slope/intercept CrIs`

---

### Task 6: Bayesian dose-response 4PL (MCMC in JS or defer to PyMC)

**Files:**  
- Modify: `src/engine/curveFitting/fourPL.ts` or create `src/engine/bayesian/doseResponse4pl.ts`  
- Modify: `src/engine/statistics/index.ts` for `dose_response_4pl`.

**Steps:**

1. **Option A (preferred for “no PyMC”):** Implement a simple MCMC (Metropolis–Hastings or use bayes.js) for the 4PL model: likelihood Normal(y | 4PL(x; bottom, top, ec50, hillSlope), σ), weak priors on parameters. Summarize posterior for ec50, bottom, top, hillSlope; compute 95% CrIs and fill `ec50CI` and optional CrIs for other params.  
2. **Option B (defer):** Keep current 4PL point estimate; add a TODO and document that full Bayesian 4PL will come with PyMC path. Still extend result type so UI can show CrIs when present.
3. Add test for Option A if implemented; wire into `runAnalysis()`.

**Commit:** `feat(engine): Bayesian 4PL dose-response (MCMC) with EC50 and param CrIs` or `docs(engine): document Bayesian 4PL as future PyMC work`

---

### Task 7: Update AnalysisPanel UI to show Bayesian labels

**Files:**  
- Modify: `src/components/AnalysisPanel.tsx`

**Steps:**

1. For each result type, where a “CI” is shown, label it “95% credible interval” (or “95% CrI”) when the result includes Bayesian fields (e.g. `meanDiffCrI` or `slopeCrI`).
2. For unpaired t-test, show `pDiffPositive` as “P(μ1 > μ2)” or “P(diff > 0).”
3. For descriptive, show `meanCrI` per column if present.
4. For ANOVA, show group `meanCrI` if present; for regression, show slope/intercept CrI with “credible” in the label.
5. No new dependencies; use existing `result` fields.

**Commit:** `feat(ui): label credible intervals and posterior probabilities in AnalysisPanel`

---

### Task 8: Optional — Pyodide + PyMC integration (async path)

**Files:**  
- Create: `src/engine/pymc/loadPyodide.ts` (load Pyodide, install PyMC via micropip).  
- Create: `src/engine/pymc/runPyMC.ts` (per-model Python strings, run via `pyodide.runPythonAsync`, parse ArviZ summary back to AnalysisResult).  
- Modify: `src/engine/statistics/index.ts` or store to support “use PyMC” option and call async path; **Modify:** `src/components/AnalysisPanel.tsx` to support async run (loading state, await), and optionally a setting or analysis option “Use PyMC (WASM).”

**Steps:**

1. Load Pyodide from CDN in a Web Worker or on first use; install `pymc` (and optionally `arviz`) via `micropip.install`.
2. For one analysis type (e.g. unpaired t-test), implement a Python string that builds the PyMC model, runs `pm.sample(..., cores=1)`, computes summary, and returns a simple dict (e.g. mean difference, CrI, P(diff>0)).
3. In TS, call `pyodide.runPythonAsync(...)`, read the result from Pyodide, map to `AnalysisResult`.
4. In AnalysisPanel, if “Use PyMC” is on, call async runner and show “Running (PyMC)…” until the promise resolves; then display result as usual.
5. Document in `docs/reference/environment-variables.md` or how-to that no env vars are required for Pyodide (it loads from CDN unless self-hosted).

**Commit:** `feat(engine): optional Pyodide+PyMC async path for Bayesian analyses`

---

## 5. Testing and docs

- **Tests:** For each new Bayesian module, add `*.test.ts` next to the implementation (e.g. `src/engine/bayesian/descriptive.test.ts`). Use fixed data and check that CrIs contain the true parameter when known, and that posterior probabilities are in [0, 1]. Run `npm test` and `npm run build` after each task.
- **Docs:** Update `docs/reference/architecture.md` to mention “Bayesian by default” and the optional PyMC path. Update `docs/how-to-guides/how-to-add-an-analysis-type.md` to say new analyses should provide Bayesian result shapes (CrI, posterior summaries). Add a short `docs/explanation/bayesian-default.md` explaining why Bayesian estimation is the default (credible intervals, interpretability, no p-value misuse).

---

## 6. Summary: PyMC and WASM

| Question | Answer |
|----------|--------|
| Can we use PyMC here? | Yes. The app runs in the browser; PyMC can run there via Pyodide (Python in WASM). |
| Can we use PyMC in WASM? | Yes. Pyodide is CPython compiled to WebAssembly; PyMC’s NUTS sampler runs in the browser. Use async loading and single-threaded sampling to avoid multiprocessing issues. |
| Recommended path | Implement Bayesian analyses first in TypeScript (conjugate + JS MCMC) so the app stays fast and synchronous by default; add optional “Use PyMC” (Pyodide) for power users or complex models (e.g. full Bayesian 4PL). |

---

## Execution handoff

Plan complete and saved to `docs/plans/2025-03-05-bayesian-by-default.md`.

**Two execution options:**

1. **Subagent-driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans in the same (or a dedicated worktree) and run through the plan with checkpoints.

Which approach do you prefer?
