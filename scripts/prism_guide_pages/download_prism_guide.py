#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "requests>=2.28.0",
#     "beautifulsoup4>=4.11.0",
# ]
# ///
"""
Download GraphPad Prism user guide (and optional Statistics/Curve Fitting) pages as text for context.

Uses the official sitemap to discover pages and the printable-view URL for each page to get
plain content without JavaScript. Saves one .txt file per page under --out-dir.

Run with: uv run download_prism_guide.py [--guides USER|STAT|CURVE|ALL] [--out-dir DIR]
"""

import argparse
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://www.graphpad.com/guides/prism/latest"

# Data tables section: https://www.graphpad.com/guides/prism/latest/user-guide/using_prisms_data_table.htm
# and recursively all child pages (eight kinds, creating, format, etc.). Stems = filename without .htm.
DATA_TABLES_SECTION_STEMS = [
    "using_prisms_data_table",
    "distinguishing_the_six_kinds_o",
    "using_key_concepts_data_tables",
    "using_key_concepts___data_tables",
    "using_data_table_format",
    "creating_data_tables",
    "using_which_table_should_i_use_to_cr",
    "xy_table",
    "column_tables",
    "two_grouping_variable_table",
    "contingency_table",
    "stacked_vs_side-by-side_repli",
    "stacked_vs__side-by-side_repli",
    "survival_table",
    "about_parts_of_whole",
    "multiple-variable-tables",
    "nested-tables",
    "the-difference-between-nested-",
    "data_table_limits",
    "editing_data_tables",
    "using_changing_a_data_table_format",
    "makeanothertable",
    "bar_graphs",
    "column_titles",
    "subcolumn_titles",
    "use_of_row_titles_in_xy_graphs",
    "using_sorting_data",
    "column_widths",
    "using_decimal_format",
    "excluding_values",
    "deleting_or_removing_entire_da",
    "missing_values",
    "data_objects",
    "rounding",
    "mv_how_mv_are_different",
    "mv_variable_types",
    "mv_format_data_table",
    "mv_data_table_row_labels",
    "nested-tables2",
    "creating_a_table_to_combine_ba",
    "inserting_a_series",
    "xy_tables_x_represents_dates",
    "xy_tables__x_represents_dates_",
]

# Sitemap and print-window paths per guide (latest redirects to a versioned path; sitemap may be versioned)
GUIDES = {
    "user-guide": {
        "sitemap": f"{BASE}/user-guide/sitemap.xml",
        "name": "Prism User Guide",
    },
    "statistics": {
        "sitemap": f"{BASE}/statistics/sitemap.xml",
        "name": "Prism Statistics Guide",
    },
    "curve-fitting": {
        "sitemap": f"{BASE}/curve-fitting/sitemap.xml",
        "name": "Prism Curve Fitting Guide",
    },
}

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "PrismGuideDownloader/1.0 (context gathering)"})


def sanitize_filename(s: str, max_len: int = 120) -> str:
    """Make a string safe for use in filenames."""
    s = re.sub(r"[^\w\s\-.]", "", s)
    s = re.sub(r"[\s_]+", "_", s).strip("_.")
    return s[:max_len] if s else "untitled"


def fetch_sitemap(url: str) -> list[str]:
    """Fetch sitemap XML and return list of page URLs (loc) that end in .htm."""
    try:
        r = SESSION.get(url, timeout=30)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"  Sitemap error: {e}", file=sys.stderr)
        return []

    # Simple extraction of <loc>...</loc>
    locs: list[str] = []
    for m in re.finditer(r"<loc>\s*([^<]+)\s*</loc>", r.text):
        u = m.group(1).strip()
        if u.endswith(".htm"):
            locs.append(u)
    return locs


def page_url_to_js_url(page_url: str) -> str:
    """Turn a guide page URL into the jstopics .js URL that contains hmTitle and hmBody."""
    parsed = urlparse(page_url)
    path = parsed.path.rstrip("/")
    if "/" in path:
        base_path = path.rsplit("/", 1)[0]
        filename = path.rsplit("/", 1)[1]
    else:
        base_path = path
        filename = "index.htm"
    stem = filename.replace(".htm", "")
    js_path = f"{base_path}/jstopics/{stem}.js"
    return f"{parsed.scheme}://{parsed.netloc}{js_path}"


def extract_hm_from_js(js_text: str) -> tuple[str, str] | None:
    """Extract hmTitle and hmBody from hmLoadTopic({ ... }) JS. Returns (title, body_html) or None."""
    # Find hmBody:" then capture the string value (handles \", \n, \', etc.)
    body_match = re.search(r'hmBody:\s*"((?:[^"\\]|\\.)*)"', js_text, re.DOTALL)
    title_match = re.search(r'hmTitle:\s*"((?:[^"\\]|\\.)*)"', js_text)
    if not body_match:
        return None
    def unescape_js(s: str) -> str:
        # JS allows \/ (escaped slash); Python's unicode_escape doesn't. Remove \/ first.
        s = s.replace("\\/", "/")
        return s.encode("utf-8").decode("unicode_escape")

    title = unescape_js(title_match.group(1)) if title_match else "Untitled"
    body_raw = body_match.group(1)
    body_html = unescape_js(body_raw)
    return (title, body_html)


def html_to_text(html: str) -> str:
    """Convert HTML fragment to plain text."""
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n", strip=True)


def download_page(page_url: str, out_path: Path, delay: float = 0.5) -> bool:
    """Fetch one page (jstopics .js), extract title and body, save as text. Returns True on success."""
    time.sleep(delay)
    js_url = page_url_to_js_url(page_url)
    try:
        r = SESSION.get(js_url, timeout=30)
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"    Error: {e}", file=sys.stderr)
        return False

    parsed = extract_hm_from_js(r.text)
    if not parsed:
        print("    (could not parse topic JS)", file=sys.stderr)
        return False

    title, body_html = parsed
    text = f"{title}\n\n{html_to_text(body_html)}"
    if len(text.strip()) < 30:
        print("    (empty or very short content)", file=sys.stderr)
        return False

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download GraphPad Prism guide pages as text for context.",
    )
    parser.add_argument(
        "--guides",
        choices=["USER", "STAT", "CURVE", "ALL"],
        default="USER",
        help="Which guide(s) to download: USER (user guide), STAT (statistics), CURVE (curve fitting), ALL.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "guide_pages",
        help="Directory to save .txt files (one per page).",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Seconds to wait between page requests (default 0.5).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="If set, only download this many pages per guide (for testing).",
    )
    parser.add_argument(
        "--section",
        choices=["data_tables"],
        default=None,
        help="If set, only download pages in this section (e.g. data_tables = using_prisms_data_table.htm and child pages).",
    )
    args = parser.parse_args()

    if args.guides == "ALL":
        keys = list(GUIDES.keys())
    else:
        key_map = {"USER": "user-guide", "STAT": "statistics", "CURVE": "curve-fitting"}
        keys = [key_map[args.guides]]

    def url_stem(url: str) -> str:
        path = urlparse(url).path.rstrip("/")
        filename = path.rsplit("/", 1)[-1] if "/" in path else path
        return filename.replace(".htm", "") if filename.endswith(".htm") else filename

    total_saved = 0
    for key in keys:
        meta = GUIDES[key]
        print(f"\n{meta['name']}")
        print(f"  Sitemap: {meta['sitemap']}")
        urls = fetch_sitemap(meta["sitemap"])
        if not urls:
            print("  No pages found.")
            continue

        if args.section == "data_tables":
            stems_set = set(DATA_TABLES_SECTION_STEMS)
            urls = [u for u in urls if url_stem(u) in stems_set]
            print(f"  Section filter: data_tables -> {len(urls)} pages")

        # Subdir per guide
        subdir = args.out_dir / key.replace("-", "_")
        saved = 0
        to_fetch = urls[: args.limit] if args.limit else urls
        for page_url in to_fetch:
            filename = page_url.rstrip("/").rsplit("/", 1)[-1]
            stem = filename.replace(".htm", "")
            safe_name = sanitize_filename(stem) or "index"
            out_path = subdir / f"{safe_name}.txt"

            print(f"  {filename} -> {out_path.name}")
            if download_page(page_url, out_path, delay=args.delay):
                saved += 1
        print(f"  Saved {saved}/{len(to_fetch)} pages to {subdir}")
        total_saved += saved

    print(f"\nDone. Total pages saved: {total_saved} to {args.out_dir}")


if __name__ == "__main__":
    main()
