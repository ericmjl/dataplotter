# Bayesian-by-Default Statistical Analyses — Implementation Plan

**Status: Deferred.** The PyMC/Python runner (Electron uv + templated scripts) and in-browser Pyodide path have been removed from the codebase. Analyses run in TypeScript only; optional Bayesian-style fields (e.g. descriptive meanCrI/meanSD) use TS conjugate fallbacks. This plan remains for future reintroduction of a Bayesian/PyMC path.

---

**Goal (when reintroduced):** Make default statistical analyses use Bayesian estimation: report posterior summaries and credible intervals instead of (or in addition to) p-values and confidence intervals. In the browser, use TypeScript implementations; in the Electron desktop app, optionally use PyMC via a **reusable script artifact**: templated Python scripts per analysis, run with bundled **uv**, with results round-tripped via **InferenceData** so the same artifact can be exported as a single package (data + script) for reproducibility.

**Architecture:** (1) **Primary:** Bayesian engine in TypeScript (conjugate priors + lightweight JS MCMC where needed) so the app works in browser and Electron without any Python. (2) **Optional (PyMC path, usable everywhere):** Where the app can run the script: **Electron** — bundle **uv** and pre-templated scripts; write filled script + data to disk, run **`uv run <script.py>`**; **browser** — call a configured **backend** that runs the same script and returns InferenceData or summary/plot data. Script writes **ArviZ InferenceData** (e.g. NetCDF); app reads it (or receives from backend) and pipes summary/plot data to the UI. Same script format is the **export artifact**: one-click export = data + script in a single package, runnable with `uv run script.py`. Extend analysis result types to carry Bayesian outputs; UI shows credible intervals and posterior summaries.

**Tech Stack:** TypeScript (existing), jStat, JS Bayesian (conjugate + bayes.js or custom MCMC). Optional PyMC path (everywhere): **Electron** — **uv** binary in extraResources, **templated .py scripts** per analysis (PEP 723), write script + data to disk, `uv run script.py`, read InferenceData; **browser** — optional backend that runs the same script and returns InferenceData or summary/plot data. Extract summary + plot arrays → map to AnalysisResult / chart inputs.

---

## Arrow of intent: uv + templates + disk + InferenceData

**Direction of design (HLD/LLD/EARS):**

1. **Bundle uv.** Ship the [uv](https://github.com/astral-sh/uv) binary (or platform-specific binaries) in the app (e.g. extraResources). uv provides isolated envs and runs scripts without requiring a pre-installed Python; `uv run script.py` creates a venv from PEP 723 metadata in the script and executes it.
2. **Pre-templated scripts per analysis.** One template per PyMC-backed analysis type: e.g. `linear_regression_bayesian.py`, `group_comparison_bayesian.py` (unpaired/paired t, one-way ANOVA), `dose_response_4pl_bayesian.py`. Each template accepts data (embedded or path) and options; runs PyMC; writes **ArviZ InferenceData** to a known path (e.g. `inferencedata.nc` or `idata.json`).
3. **Write script to disk, then `uv run`.** At run time (Electron): fill the template with the current table data and options; write the script (and optionally a small data file) to a working directory; spawn `uv run <script.py>` (using the bundled uv). No long-lived Python server; each run is one-off and produces an InferenceData file.
4. **Read InferenceData and pipe to UI.** After the script exits, the app reads the InferenceData file (NetCDF via a small reader, or ArviZ’s JSON export if the script writes that). Extract posterior summary (mean, CrI, P(superiority), etc.) and any arrays needed for plots (e.g. posterior predictive curves, EC50 posterior). Map these into the existing `AnalysisResult` shape and chart adapter inputs so the UI and graphs show Bayesian results without new UI contracts.
5. **Export = same artifact.** One-click export “data + script” produces a **single package** (e.g. zip or folder) containing the table data and the **same** filled script that was (or would be) run for that analysis. The user can run `uv run script.py` to reproduce the analysis and figures; the script is the reusable artifact shared between “run in app” and “export for reproducibility.”

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

**Files:** `src/types/analysis.ts`, `src/types/analysisSchemas.ts` (if options gain a "use PyMC" flag later).

- **AnalysisResult** (in `analysis.ts`): Extend each variant to include Bayesian-oriented fields; keep existing fields for backward compatibility or replace where it's clearly "Bayesian by default."
  - **descriptive:** Add optional `byColumn[].meanCrI?: [number, number]`, `byColumn[].meanSD?: number` (posterior s.d. of mean). Keep `mean`, `sem`, `sd`, etc.
  - **unpaired_ttest:** Add `meanDiffCrI: [number, number]`, `pDiffPositive?: number` (P(μ1 > μ2)); rename or dual-use `ci` as "credible interval" in UI when Bayesian. Keep `mean1`, `mean2`; consider `df` optional or drop for Bayesian.
  - **one_way_anova:** Add `groupMeans[].meanCrI?: [number, number]`, optional effect/contrast summaries. Keep or adapt `df*`, `f` for optional display.
  - **linear_regression:** Add `slopeCrI`, `interceptCrI` (or repurpose existing `slopeCI` as credible); add optional `r2Posterior?: number`. Keep `slope`, `intercept`, `r2`; `p` can become optional or P(slope ≠ 0).
  - **dose_response_4pl:** Already has `ec50CI`; ensure it's populated as credible interval from Bayesian fit; add optional CrIs for `bottom`, `top`, `hillSlope` if available.
- **Options:** For now, no new option required if everything is "Bayesian by default." Later, add optional `analysisOptions.usePyMC?: boolean` (or a global "Use PyMC when available") and wire in `analysisSchemas.ts`.

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
3. Wire `runAnalysis(..., 'descriptive', ...)` to use this implementation so descriptive is "Bayesian by default."
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

1. **Option A (preferred for "no PyMC"):** Implement a simple MCMC (Metropolis–Hastings or use bayes.js) for the 4PL model: likelihood Normal(y | 4PL(x; bottom, top, ec50, hillSlope), σ), weak priors on parameters. Summarize posterior for ec50, bottom, top, hillSlope; compute 95% CrIs and fill `ec50CI` and optional CrIs for other params.
2. **Option B (defer):** Keep current 4PL point estimate; add a TODO and document that full Bayesian 4PL will come with PyMC path. Still extend result type so UI can show CrIs when present.
3. Add test for Option A if implemented; wire into `runAnalysis()`.

**Commit:** `feat(engine): Bayesian 4PL dose-response (MCMC) with EC50 and param CrIs` or `docs(engine): document Bayesian 4PL as future PyMC work`

---

### Task 7: Update AnalysisPanel UI to show Bayesian labels

**Files:**

- Modify: `src/components/AnalysisPanel.tsx`

**Steps:**

1. For each result type, where a "CI" is shown, label it "95% credible interval" (or "95% CrI") when the result includes Bayesian fields (e.g. `meanDiffCrI` or `slopeCrI`).
2. For unpaired t-test, show `pDiffPositive` as "P(μ1 > μ2)" or "P(diff > 0)."
3. For descriptive, show `meanCrI` per column if present.
4. For ANOVA, show group `meanCrI` if present; for regression, show slope/intercept CrI with "credible" in the label.
5. No new dependencies; use existing `result` fields.

**Commit:** `feat(ui): label credible intervals and posterior probabilities in AnalysisPanel`

---

### Task 8: Optional — PyMC via uv + templated scripts + InferenceData (Electron and/or backend)

**Files:**

- Create: `python/templates/` with one script template per analysis: e.g. `linear_regression_bayesian.py`, `group_comparison_bayesian.py`, `dose_response_4pl_bayesian.py`. Each has PEP 723 metadata (dependencies: pymc, arviz, numpy); reads data (embedded or from a companion file); runs PyMC; writes **ArviZ InferenceData** to a fixed path (e.g. `inferencedata.nc` or script-directory output).
- Create: `src/engine/pymc/` (or under electron): **template filler** (fill template with table data + options), **run** (resolve bundled uv, write script + data to temp dir, spawn `uv run script.py`, wait for exit), **read idata** (read InferenceData file: NetCDF or JSON; extract summary stats and plot arrays), **map to result** (convert to AnalysisResult shape).
- Modify: `package.json` — add **extraResources** for `uv` binary (platform-specific) and for `python/templates/` so both are in the app bundle.
- Modify: `electron/main.cjs` — add `findUv()`, IPC handler that: receives (analysisType, tableData, options), fills template, writes to temp dir, runs `uv run script.py`, reads InferenceData, extracts summary + plot data, returns JSON to renderer.
- Modify: `electron/preload.cjs` — expose `invoke('runBayesianPyMC', { analysisType, tableData, options })` returning Promise with result + optional plot arrays.
- Modify: `src/components/AnalysisPanel.tsx` — when "Use PyMC" is on, call the PyMC runner (Electron: IPC; browser: fetch to configured backend); show "Running (PyMC)…"; map returned data to AnalysisResult and charts.

**Steps:**

1. Add uv binaries (e.g. from uv releases) to `resources/uv/` (or similar) per platform; add to extraResources so packaged app has `uv` on PATH or at known path.
2. Implement one templated script (e.g. group_comparison_bayesian.py): PEP 723 block, load data, PyMC model, `idata.to_netcdf("inferencedata.nc")` (or equivalent). Test with `uv run script.py` from CLI.
3. Implement template filler: given (analysisType, tableData, options), select template, inject data/options, write script (and data file if needed) to temp dir.
4. Implement InferenceData reader: parse NetCDF (or ArviZ JSON) to get summary (mean, hdi, etc.) and any arrays for plots; map to the AnalysisResult fields and optional plot series.
5. Wire execution and UI: **Electron** — main process runs filler → uv run → read idata → return via IPC; **browser** — send filled script + data to configured backend, receive InferenceData or summary, map to result. Renderer shows loading then result. Ensure export flow can serialize the **same** filled script so "Export data + script" produces the reusable artifact.

**Commit:** `feat(electron): PyMC via uv + templated scripts; InferenceData round-trip; bundle uv and templates`

---

## 5. Testing and docs

- **Tests:** For each new Bayesian module, add `*.test.ts` next to the implementation (e.g. `src/engine/bayesian/descriptive.test.ts`). Use fixed data and check that CrIs contain the true parameter when known, and that posterior probabilities are in [0, 1]. Run `npm test` and `npm run build` after each task.
- **Docs:** Update `docs/reference/architecture.md` to mention "Bayesian by default" and the optional PyMC path. Update `docs/how-to-guides/how-to-add-an-analysis-type.md` to say new analyses should provide Bayesian result shapes (CrI, posterior summaries). Add a short `docs/explanation/bayesian-default.md` explaining why Bayesian estimation is the default (credible intervals, interpretability, no p-value misuse).

---

## 6. Summary: uv + templates + InferenceData

| Question | Answer |
|----------|--------|
| How does PyMC run? | Not in-browser. Electron bundles **uv**; we ship **pre-templated scripts** per analysis (linear regression, group comparison, 4PL). App fills template with data, writes to disk, runs `uv run script.py`; script writes **InferenceData**; app reads it and pipes summary/plot data to the UI. |
| Export artifact? | Same script format. One-click export = **data + script in a single package**; user runs `uv run script.py` to reproduce. The script is the reusable artifact for both "run in app" and "export for reproducibility." |
| Package with Electron? | Yes. Bundle **uv** binary and **python/templates/** in extraResources. No embedded full Python; uv creates isolated envs from PEP 723 in the script. Sign/notarize uv binary for distribution. |
| Recommended path | TypeScript Bayesian first (browser + Electron). Then add PyMC path everywhere: Electron (uv + templates, write to disk, uv run, read InferenceData); browser (optional backend runs script, returns InferenceData/summary). Map to AnalysisResult and chart inputs. |

---

## Execution handoff

Plan complete and saved to `docs/plans/2025-03-05-bayesian-by-default.md`.

**Two execution options:**

1. **Subagent-driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel session (separate)** — Open a new session with executing-plans in the same (or a dedicated worktree) and run through the plan with checkpoints.

Which approach do you prefer?
