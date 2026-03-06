#!/usr/bin/env python3
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "youtube-transcript-api>=0.6.0",
#     "yt-dlp>=2024.1.0",
# ]
# ///
"""
Search YouTube for videos teaching how to use GraphPad Prism and download their transcripts.

Run with: uv run fetch_prism_transcripts.py [--max-videos N] [--out-dir DIR]
"""

import argparse
import re
import sys
from pathlib import Path

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)


def sanitize_filename(s: str, max_len: int = 80) -> str:
    """Make a string safe for use in filenames."""
    s = re.sub(r'[^\w\s\-]', '', s)
    s = re.sub(r'[\s_]+', '_', s).strip('_')
    return s[:max_len] if s else "untitled"


def search_youtube(query: str, max_videos: int) -> list[dict]:
    """Use yt-dlp to search YouTube and return list of {id, title}."""
    url = f"ytsearch{max_videos}:{query}"
    opts = {
        "quiet": True,
        "extract_flat": True,
        "no_download": True,
    }
    videos = []
    with yt_dlp.YoutubeDL(opts) as ydl:
        result = ydl.extract_info(url, download=False)
        if not result or "entries" not in result:
            return videos
        for entry in result["entries"]:
            if not entry:
                continue
            vid = entry.get("id")
            title = entry.get("title") or "untitled"
            if vid:
                videos.append({"id": vid, "title": title})
    return videos


def get_transcript(video_id: str) -> list[dict] | None:
    """Fetch transcript for a video. Returns list of {text, start, duration} or None."""
    api = YouTubeTranscriptApi()
    try:
        transcript = api.fetch(video_id, languages=("en", "en-US", "en-GB"))
        return transcript.to_raw_data()
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable):
        return None
    except Exception as e:
        print(f"  Warning: {e}", file=sys.stderr)
        return None


def save_transcript(video_id: str, title: str, transcript: list[dict], out_dir: Path) -> Path:
    """Save transcript as plain text and return path to file."""
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_title = sanitize_filename(title)
    base = f"{video_id}_{safe_title}"
    path = out_dir / f"{base}.txt"
    lines = [item["text"] for item in transcript]
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Search YouTube for GraphPad Prism tutorials and download transcripts.",
    )
    parser.add_argument(
        "--max-videos",
        type=int,
        default=30,
        help="Max number of search results to fetch (default 30).",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "transcripts",
        help="Directory to save transcript .txt files.",
    )
    parser.add_argument(
        "--search",
        type=str,
        default="graphpad prism tutorial how to use",
        help="YouTube search query (default: graphpad prism tutorial how to use).",
    )
    args = parser.parse_args()

    print(f"Searching YouTube for: {args.search!r} (max {args.max_videos} videos)")
    videos = search_youtube(args.search, args.max_videos)
    print(f"Found {len(videos)} videos.")

    if not videos:
        print("No videos found. Check your query or yt-dlp.", file=sys.stderr)
        sys.exit(1)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    saved = 0
    for v in videos:
        vid, title = v["id"], v["title"]
        print(f"  {vid}: {title[:60]}...")
        transcript = get_transcript(vid)
        if transcript:
            path = save_transcript(vid, title, transcript, args.out_dir)
            print(f"    -> {path}")
            saved += 1
        else:
            print("    -> no transcript")

    print(f"\nDone. Saved {saved}/{len(videos)} transcripts to {args.out_dir}")


if __name__ == "__main__":
    main()
