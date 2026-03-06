# Prism file formats and parity

**Reference:** What GraphPad Prism stores in project files, and what dataplotter imports/exports. See also [project layout](project-layout.md), [LLD project and workflows](../llds/project-and-workflows.md).

---

## What GraphPad Prism stores (from Prism user guide)

When you **Save** a Prism file, the file contains **data, analyses, and graphs** (Prism user guide: “Saving vs. exporting”). So a full Prism project file holds:

- **Data tables** (and optional info sheets)
- **Analysis choices** (which analyses, on which tables; optionally **analysis results** in PZF non-compact)
- **Graphs** (linked to tables/analyses)
- **Layouts** (composing multiple graphs)

**PZF vs PZFX (Prism guide: “PZF vs. PZFX file format”):**

- **PZF:** Binary format. Can store analysis results (unless “compact” is on). Opens in Prism 4+.
- **PZFX:** XML at the start for **data tables and info sheets** (plain text); then **results, graphs, and layouts** in a format only Prism can read. **PZFX never contains analysis results**—Prism recomputes when opening. Opens in Prism 5+.

So a **complex** Prism file (many analyses and plots) has table data in readable XML and the rest in Prism-specific form. Our clone does not read or write that Prism-specific section.

---

## Dataplotter’s two formats

### 1. `.pzfx` (GraphPad Prism XML)

| Direction | What we do | What is preserved |
|----------|------------|-------------------|
| **Import** | `parsePzfx()` reads only `<Table>` elements (OneWay → column, XY → xy). | **Tables only** (names, column labels, numeric data). Analyses, results, graphs, layouts in the file are **not** read. |
| **Export** | `buildPzfx()` writes only `<Table>` elements for column and XY tables. | **Tables only.** Analyses and graphs are **not** written. |

**Consequence:** If someone has a **complex** Prism file (data + analyses + graphs) and opens it in dataplotter via “Open .pzfx file”, they get **only the data tables**. All existing analyses and plots are **lost** in our app; they would need to re-run analyses and re-create graphs. We do not parse Prism’s results/graphs/layouts from the PZFX blob.

**Recommendation:** Document this clearly (here and in UI when importing .pzfx) so users know to expect data-only import. For full fidelity (data + analyses + graphs), use our JSON or .prism zip (see below).

### 2. `.prism` (dataplotter zip format)

Our custom format: a zip containing `manifest.json`, `data/<tableId>.csv`, `analyses/<id>.json`, `graphs/<id>.json`.

| Direction | What we do | What is preserved |
|----------|------------|-------------------|
| **Import** | `parsePrism()` reads manifest, CSVs, and analysis/graph JSON. | **Data, analyses, and graphs.** Layouts are set to `[]`. |
| **Export** | `buildPrism()` writes full project to zip. | **Data, analyses, graphs.** (Not currently exposed in the UI; “Save as Prism” uses **buildPzfx** and saves as `.pzfx`.) |

So **full round-trip** (data + analyses + graphs) is supported only for **JSON** (native) and for **.prism** (import and, if we add a “Save as .prism” option, export). The **.pzfx** round-trip is **data-only** by design in the current implementation.

---

## Summary

| Format | Import | Export (UI) | Preserves analyses & graphs? |
|--------|--------|-------------|------------------------------|
| **JSON** | ✅ Full | ✅ Full | Yes |
| **.prism** (zip) | ✅ Full | ❌ No UI option (code exists) | Yes, if we add “Save as .prism” |
| **.pzfx** | Tables only | Tables only (“Save as Prism” → .pzfx) | **No** |

Sources: Prism user guide (`scripts/prism_guide_pages/`), YouTube transcripts (`scripts/youtube_prism_transcripts/`), and `src/io/prism/`, `src/io/pzfx/`.
