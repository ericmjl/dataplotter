# GraphPad Prism YouTube transcripts

Script to search YouTube for videos about using GraphPad Prism and download their transcripts as text files. Uses [PEP 723](https://peps.python.org/pep-0723/) inline script metadata so you can run it with `uv run` without a separate install.

## Run (with uv)

From the repo root or this directory:

```bash
uv run scripts/youtube_prism_transcripts/fetch_prism_transcripts.py
# or from this directory:
uv run fetch_prism_transcripts.py
```

## Options

```bash
# More videos, custom output directory
uv run fetch_prism_transcripts.py --max-videos 50 --out-dir /path/to/transcripts

# Custom search query
uv run fetch_prism_transcripts.py --search "graphpad prism 10 tutorial"
```

Default: search "graphpad prism tutorial how to use", up to 30 videos, save to `./transcripts`. Transcripts are saved as `transcripts/{video_id}_{sanitized_title}.txt`. Videos with no available transcript are skipped.

## Without uv

Create a venv, install `youtube-transcript-api` and `yt-dlp`, then run with Python:

```bash
cd scripts/youtube_prism_transcripts
python3 -m venv .venv
source .venv/bin/activate
pip install youtube-transcript-api yt-dlp
python fetch_prism_transcripts.py
```
