# Sample data for each table type — Implementation plan

**Created**: 2026-03-06  
**Design**: [HLD](../high-level-design.md) §3 Sample data, [LLD Data tables — Sample data](../llds/data-tables-and-formats.md#sample-data-for-each-table-type)  
**EARS**: [prism-clone-specs.md](../specs/prism-clone-specs.md) PRISM-TBL-021, PRISM-TBL-022, PRISM-TBL-023

---

## Overview

Provide one sample dataset per implemented table format (Column, XY, Grouped, Contingency, Survival, Parts of whole) so users can create a table pre-filled with valid, analysis-ready data from the Sidebar or from the New Table flow.

## Success criteria

- Every implemented format has a sample data module that passes `validateTableData(format, data)`.
- Sidebar exposes a way to add a table from sample for each format (PRISM-TBL-022).
- Optionally: New Table dialog offers “Start with sample data” for the selected format (PRISM-TBL-023).
- `npm run build` and `npm test` pass; new/updated tests for sample data index and validation.

---

## Phase 1: Sample data modules and index

**Specs**: PRISM-TBL-021 (data content)

### Deliverables

1. **New sample data modules** in `src/data/`:
   - [x] `sampleGrouped.ts` — export `sampleGroupedData` (GroupedTableData), `sampleGroupedName`. Example: 2×2 (e.g. Male/Female × Control/Treated) with a few replicates per cell.
   - [x] `sampleContingency.ts` — export `sampleContingencyData` (ContingencyTableData), `sampleContingencyName`. Example: 2×2 or 2×3 count table with meaningful labels.
   - [x] `sampleSurvival.ts` — export `sampleSurvivalData` (SurvivalTableData), `sampleSurvivalName`. Example: ~8–12 (time, event) pairs, optional groups; at least one event and one censored.
   - [x] `samplePartsOfWhole.ts` — export `samplePartsOfWholeData` (PartsOfWholeTableData), `samplePartsOfWholeName`. Example: 4–6 labels and values summing to 100.

2. **Central index** `src/data/sampleDataIndex.ts`:
   - [x] Export a list or map of `{ format: TableFormatId, name: string, data: TableData }` for all six formats (Column, XY, Grouped, Contingency, Survival, Parts of whole), using existing sampleColumn/sampleXY and the new modules.
   - [x] Optionally export `getSampleForFormat(format): { name, data } | null` for lookup by format.

### Testing

- [ ] For each format, `validateTableData(format, sampleData)` returns success (no errors).
- [ ] Unit test (e.g. `src/data/sampleDataIndex.test.ts`) that the index returns exactly one entry per implemented format and each entry’s data validates.

### Definition of Done

- [ ] All four new sample modules exist and export correctly typed data and name.
- [ ] sampleDataIndex.ts exists and is used (or ready to be used) by the UI.
- [ ] PRISM-TBL-021 satisfied: sample data for all six formats is valid and suitable for at least one analysis and one graph.

---

## Phase 2: Sidebar — add table from sample for all formats

**Specs**: PRISM-TBL-022

### Deliverables

1. **Sidebar UI**
   - [ ] Replace or extend the current “Sample Col” and “Sample XY” buttons with a scalable pattern:
     - **Option A:** One “Sample” button that opens a dropdown/menu listing each format (Column, XY, Grouped, Contingency, Survival, Parts of whole); choosing an item adds a table with that format’s sample data and name.
     - **Option B:** Keep “Sample Col” and “Sample XY” as quick buttons; add a “More samples…” dropdown for Grouped, Contingency, Survival, Parts of whole.
   - [ ] Use `sampleDataIndex` (or equivalent) so adding a new format in the future only requires adding the sample module and registering it in the index.

2. **Store**
   - [ ] Reuse existing `addTable({ name, format, data })`; no store changes required.

### Testing

- [ ] Manual: From Sidebar, add a table from sample for each format; confirm table appears with correct format and data; run one allowed analysis and create one allowed graph for each.
- [ ] Optional: Cypress or Vitest that Sidebar renders sample controls and that invoking “add from sample” for a format adds a table with that format.

### Definition of Done

- [x] User can add a table pre-filled with sample data for Column, XY, Grouped, Contingency, Survival, and Parts of whole from the Sidebar.
- [x] PRISM-TBL-022 satisfied.

---

## Phase 3 (optional): New Table dialog — “Start with sample data”

**Specs**: PRISM-TBL-023

### Deliverables

1. **NewTableDialog**
   - [x] When user selects a format (Column, XY, Grouped, etc.), show an option “Start with sample data” (checkbox or secondary button).
   - [x] If selected, on submit create the table with `name = sampleName` and `data = sampleData` for that format (from sampleDataIndex); otherwise create empty table as today.

### Testing

- [ ] Manual: Open New Table, select e.g. Grouped, check “Start with sample data”, create; confirm table is created with sample grouped data and correct name.

### Definition of Done

- [x] "Start with sample data" available in New Table flow for each format; when used, new table is pre-filled with that format’s sample.
- [x] PRISM-TBL-023 satisfied.

---

## Traceability

| Spec           | Phase | Deliverable |
|----------------|-------|-------------|
| PRISM-TBL-021  | 1     | Sample modules + index; validation passes |
| PRISM-TBL-022  | 2     | Sidebar sample control(s) for all formats |
| PRISM-TBL-023  | 3     | NewTableDialog “Start with sample data” |

After implementation, update spec markers in [prism-clone-specs.md](../specs/prism-clone-specs.md) from `[ ]` to `[x]` for PRISM-TBL-021, PRISM-TBL-022, and (if implemented) PRISM-TBL-023.
