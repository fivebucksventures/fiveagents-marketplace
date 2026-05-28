---
name: video-downloader
description: Download a video from YouTube, Instagram, TikTok, Twitter/X, Facebook, Vimeo (and 1000+ yt-dlp sites) to local disk, and optionally transcribe it. Standalone utility for repurposing and analysis — not part of the static publishing pipeline.
allowed-tools: Read, Bash
area: Productivity
use_for: "Download a video from a URL (YouTube/IG/TikTok/X/FB/Vimeo/+) to local disk and optionally transcribe it — a standalone repurposing/analysis utility"
deps:
  files: []
  env: []
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v1.0.0 | May 28, 2026 |

**Description:** Download a video from a URL to local disk and optionally transcribe it — standalone utility.

### Change Log

**v1.0.0** — May 28, 2026
- New standalone utility. Ports content-engine's `download_video.py` (yt-dlp wrapper) and documents an optional Whisper transcription step (the `post-content` pattern). **Not wired into the static publishing pipeline** — it's a repurposing/analysis tool. Transcripts can feed `meeting-analyzer`. No brand context required.

---

# SKILL.md — Video Downloader

A standalone utility — no brand context, no Notion, no dashboard logging required. Use it whenever a video URL needs to come down to local disk for repurposing (clip → static post), analysis (transcribe → summarize), or archiving.

## When to use

- "Download this video: [URL]"
- "Get this reel / short / clip for me: [URL]"
- "Transcribe this video: [URL]" (download + transcribe)

Do **not** use this for the static social pipeline (`social-calendar` → `content-creation` → `creative-designer` → `social-publisher`). This utility stands alone.

## Requirements

Local CLI tools (not gateway/MCP): `yt-dlp` (download), `ffmpeg` (audio extraction), and `whisper` (transcription, only if transcribing). If a tool is missing, report exactly which one and the install command (`pip install yt-dlp openai-whisper`, `brew install ffmpeg`) — don't fail silently.

## Step 1 — Download

Run the bundled script (it prints the downloaded file path to stdout):

```bash
python3 "$CLAUDE_PLUGIN_ROOT/skills/video-downloader/scripts/download_video.py" "VIDEO_URL" -o "OUTPUT_DIR" -q QUALITY -f FORMAT
```

| Flag | Description | Default |
|------|-------------|---------|
| `-o` | Output directory | `/tmp/downloads` |
| `-q` | Quality: `best`, `1080`, `720`, `480`, `360` | `best` |
| `-f` | Format: `mp4`, `webm`, `mkv` | `mp4` |
| `-a` | Audio only (MP3) | off |

Examples:
```bash
# YouTube, default quality
python3 "$CLAUDE_PLUGIN_ROOT/skills/video-downloader/scripts/download_video.py" "https://www.youtube.com/watch?v=ID" -o /tmp/downloads

# Instagram reel at 720p
python3 "$CLAUDE_PLUGIN_ROOT/skills/video-downloader/scripts/download_video.py" "https://www.instagram.com/reel/ABC/" -q 720

# Audio only (for transcription)
python3 "$CLAUDE_PLUGIN_ROOT/skills/video-downloader/scripts/download_video.py" "URL" -a -o /tmp/downloads
```

Report the downloaded file path. Supported: YouTube, Instagram, TikTok, Twitter/X, Facebook, Vimeo, and 1000+ other yt-dlp sites.

## Step 2 — Transcribe (optional)

Only when the user wants a transcript. Extract audio with ffmpeg, then run Whisper (the `post-content` Step 3 pattern):

```bash
ffmpeg -i "/path/to/video.mp4" -ar 16000 -ac 1 -y /tmp/video-audio.wav

python3 -c "
import whisper
model = whisper.load_model('medium')
result = model.transcribe('/tmp/video-audio.wav')
print(result['text'])
"
```

Save the transcript next to the video (`<video-basename>.txt`) or print it, per the user's need. A transcript can be handed to `meeting-analyzer` (for action items) or to `content-creation` (for repurposing into posts).

## Step 3 — Cleanup

Remove temp audio when done: `rm -f /tmp/video-audio.wav`. Leave the downloaded video unless the user asked for transcript-only.

## Notes

- Respect copyright and platform ToS — download only content the user is authorized to use (their own, licensed, or for fair-use analysis).
- If yt-dlp fails on a URL, report its stderr; the script already retries with a simpler format string before giving up.
