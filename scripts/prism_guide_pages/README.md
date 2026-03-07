# GraphPad Prism guide pages (context)

Download the official GraphPad Prism user guide (and optionally Statistics and Curve Fitting guides) as plain text for use as context. Uses the site’s sitemap and `jstopics` JS files; no browser required.

**Data tables section:** The page [Using Prism's data table](https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm) and recursively all child pages (eight table types, creating tables, format, etc.) are in a dedicated scraped list. To re-download only that section: `--section data_tables`.

## Run (with uv)

From the repo root or this directory:

```bash
uv run scripts/prism_guide_pages/download_prism_guide.py
# or from this directory:
uv run download_prism_guide.py
```

## Options

```bash
# All three guides (user, statistics, curve fitting)
uv run download_prism_guide.py --guides ALL

# Only statistics or curve-fitting guide
uv run download_prism_guide.py --guides STAT
uv run download_prism_guide.py --guides CURVE

# Custom output directory
uv run download_prism_guide.py --out-dir /path/to/context

# Throttle requests (default 0.5 s between pages)
uv run download_prism_guide.py --delay 0.3

# Limit pages per guide (for testing)
uv run download_prism_guide.py --limit 5

# Data tables section only (using_prisms_data_table.htm + child pages)
uv run download_prism_guide.py --section data_tables
```

Output: one `.txt` file per guide page under `guide_pages/{user_guide|statistics|curve_fitting}/`. Each file starts with the page title, then the body text.
