#!/usr/bin/env python3
"""
download_video.py — Download videos from YouTube, Instagram, TikTok, Twitter/X, etc.

Uses yt-dlp under the hood. Outputs the downloaded file path to stdout.

Usage:
    python3 download_video.py "https://youtube.com/watch?v=..." -o /tmp/downloads
    python3 download_video.py "https://instagram.com/reel/..." -q 720
    python3 download_video.py "https://tiktok.com/..." -a  # audio only
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


def download(url, output_dir="/tmp/downloads", quality="best", fmt="mp4", audio_only=False):
    """Download a video using yt-dlp."""
    os.makedirs(output_dir, exist_ok=True)

    out_template = os.path.join(output_dir, "%(title).80s.%(ext)s")

    if audio_only:
        cmd = [
            "yt-dlp",
            "-x",
            "--audio-format", "mp3",
            "--no-playlist",
            "--no-warnings",
            "-o", out_template,
            url,
        ]
    else:
        # Build format string based on quality
        if quality == "best":
            format_str = f"bestvideo[ext={fmt}]+bestaudio/best[ext={fmt}]/best"
        else:
            format_str = f"bestvideo[height<={quality}][ext={fmt}]+bestaudio/best[height<={quality}][ext={fmt}]/best[height<={quality}]"

        cmd = [
            "yt-dlp",
            "-f", format_str,
            "--merge-output-format", fmt,
            "--no-playlist",
            "--no-warnings",
            "-o", out_template,
            url,
        ]

    print(f"Downloading: {url}", file=sys.stderr)
    print(f"Output dir: {output_dir}", file=sys.stderr)
    print(f"Quality: {quality}, Format: {'mp3 (audio)' if audio_only else fmt}", file=sys.stderr)

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

    if result.returncode != 0:
        print(f"yt-dlp stderr: {result.stderr}", file=sys.stderr)
        # Try simpler format as fallback
        if not audio_only:
            print("Retrying with simpler format...", file=sys.stderr)
            cmd_simple = [
                "yt-dlp",
                "-f", f"best[ext={fmt}]/best",
                "--no-playlist",
                "--no-warnings",
                "-o", out_template,
                url,
            ]
            result = subprocess.run(cmd_simple, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                print(f"Fallback also failed: {result.stderr}", file=sys.stderr)
                sys.exit(1)
        else:
            sys.exit(1)

    # Find the most recently modified file in output dir
    files = sorted(Path(output_dir).iterdir(), key=lambda f: f.stat().st_mtime, reverse=True)
    if not files:
        print("Error: No output file found", file=sys.stderr)
        sys.exit(1)

    downloaded = files[0]
    print(f"Downloaded: {downloaded} ({downloaded.stat().st_size / 1024 / 1024:.1f} MB)", file=sys.stderr)

    # Print just the path to stdout (for piping to other tools)
    print(str(downloaded))
    return str(downloaded)


def main():
    parser = argparse.ArgumentParser(description="Download videos from any platform")
    parser.add_argument("url", help="Video URL to download")
    parser.add_argument("-o", "--output", default="/tmp/downloads", help="Output directory")
    parser.add_argument("-q", "--quality", default="best", choices=["best", "1080", "720", "480", "360"], help="Video quality")
    parser.add_argument("-f", "--format", default="mp4", choices=["mp4", "webm", "mkv"], help="Output format")
    parser.add_argument("-a", "--audio", action="store_true", help="Download audio only (MP3)")

    args = parser.parse_args()
    download(args.url, args.output, args.quality, args.format, args.audio)


if __name__ == "__main__":
    main()
