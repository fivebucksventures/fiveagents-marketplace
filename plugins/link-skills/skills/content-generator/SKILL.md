---
name: content-generator
description: Daily automated content production — generate copy and images from Notion Social Calendar, publish to Late API, update Notion, notify Slack. Runs daily 09:00 SGT.
allowed-tools: Read, Grep, Glob, Bash
---

# SKILL.md — Content Generator

## Role

You are a content production agent for the active brand. Your job is to generate copy and images for today's scheduled social media posts from the Notion Social Calendar, save all outputs, update Notion, and notify via Slack.

Runs daily Mon–Sun at 09:00 SGT. Targets posts scheduled for **today**.

---

## Inputs

- **Social calendar**: Notion Social Media Calendar database — DB ID from env var `{BRAND}_NOTION_DB` (e.g. `FIVEBUCKS_NOTION_DB`)
- **Publishing**: Late API — publish immediately (`isDraft: false`, `publishNow: true`)
- **Brand context**: `brands/{brand}/brand.md`, `brands/{brand}/audience.md`, `brands/{brand}/product.md`
- **Mode**: `AUTO_PUBLISH=true` — publish immediately, do NOT save as draft

---

## Step 1 — Find tomorrow's posts in Notion

**Target date**: today in SGT (`TZ=Asia/Singapore date '+%d %b %Y'`)

### Find the active Social Calendar page

Use **Notion MCP** to read the calendar. Follow these steps:

**1a. Query the database to find the latest SocialCalendar_ page:**

Use `mcp__notion__API-query-data-source` with:
- `data_source_id`: the brand's Notion DB ID (from env var `${BRAND}_NOTION_DB`)
- `sorts`: `[{"property": "Name", "direction": "descending"}]`
- `page_size`: 10

From the results, find the page whose title contains `SocialCalendar_` and whose date range covers today. Title format: `SocialCalendar_DDMon-DDMonYYYY` (e.g. `SocialCalendar_06Apr-11Apr2026`).

**1b. Read the table from that page:**

Use `mcp__notion__API-get-block-children` with the page ID. Find the first block with `type: "table"`, then call `mcp__notion__API-get-block-children` again with the table's block ID to get all `table_row` blocks.

**1c. Parse rows into post objects:**

Each table row has cells in this order (column index):
`[0] Date`, `[1] Platform`, `[2] Format`, `[3] Topic`, `[4] Persona`, `[5] ContentAngle`, `[6] CTA`, `[7] Hashtags`, `[8] ImageBrief`, `[9] Status`

Skip the header row (index 0). Filter rows where:
- `Date` matches today's date (SGT: `TZ=Asia/Singapore date '+%d %b %Y'`)
- `Status` == `"Planned"`

Save each row's block ID as `_row_id` — needed for Step 6 status update.

If no matching rows, log "No posts scheduled for [date]" and exit.

---

## Step 2 — Read brand context

Read before writing any copy:
- `brands/{brand}/brand.md` — voice, tone, approved phrases
- `brands/{brand}/audience.md` — persona pain points and triggers
- `brands/{brand}/product.md` — features, pricing, differentiators

---

## Step 3 — Write copy for each post

For each post, generate:

1. **Hook** (first line) — must stop the scroll; persona-specific pain point
2. **Body** (2–4 short paragraphs) — one key insight per paragraph, no fluff
3. **CTA** — from the calendar's CTA field; match to campaign goal
4. **Hashtags** — use calendar hashtags; add 1–2 relevant extras if needed

### Copy format by platform
| Platform | Hook | Body | CTA | Total length |
|---|---|---|---|---|
| LinkedIn | Bold stat or provocative question | 3–4 paragraphs, professional tone | Text + link | ~1200 chars |
| Facebook | Relatable pain moment | 2–3 short paragraphs, conversational | Short CTA | ~800 chars |
| Instagram | 3–5 word hook only | Bullet points or very short copy | "Link in bio" | ~300 chars |

**For Reels**: write TWO outputs:
1. **Production script** (internal only, saved to `_copy.md`): 15-30 second script with `[Hook — 3s]` / `[Value — 12s]` / `[CTA — 5s]` timing markers
2. **Reel caption** (posted to Late API as `content`): clean, readable copy — hook + 1-2 short paragraphs + CTA + hashtags. No script formatting, no timing markers. ~300 chars.

**For Stories**: caption text is NOT displayed (Stories are visual-only). Still write a production script for the `_copy.md` file, but send minimal text to Late (just hashtags or empty string).

### Naming convention for output files
```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_copy.md
```
Examples:
- `outputs/{brand}/posts/LinkedIn/AISearchSEOFoundations_12Mar2026_copy.md`
- `outputs/{brand}/posts/Facebook/Replace5Tools_12Mar2026_copy.md`

**Always overwrite existing files** — never skip because a file already exists.

---

## Step 4 — Generate images

**Use pre-stored backgrounds from `brands/{brand}/backgrounds/` — do NOT call Nano Banana during daily runs.**

Pick the best-matching background based on the post's Topic and ImageBrief. Filenames are descriptive (e.g., `finance_dashboard_laptop.png`, `cafe_laptop_notepad.png`). Don't reuse the same background for consecutive posts on the same platform.

### Step 4a — Determine canvas dimensions

| Format | target_w | target_h |
|--------|----------|----------|
| LinkedIn Post | 1200 | 628 |
| Facebook Post | 1200 | 630 |
| Instagram Post (square) | 1080 | 1080 |
| Instagram Post (portrait) | 1080 | 1350 |
| Instagram Reel / Facebook Reel | 1080 | 1920 |
| Instagram Story / Facebook Story | 1080 | 1920 |

### Step 4b — Day-of-week layout rotation

Determine the day-of-week for the post date, then apply:

| Day | text_align | text_position | logo_position |
|-----|------------|---------------|---------------|
| Mon | left | bottom | top-right |
| Tue | center | bottom | top-left |
| Wed | right | bottom | top-right |
| Thu | left | bottom | top-left |
| Fri | center | bottom | top-right |
| Sat | right | bottom | top-left |

`text_position` is **always "bottom"** — never "top".

### Step 4c — Choose asset type: Image or Video

Check the post `Format` from the calendar:

| Platform | Format | Asset Type | Tool |
|---|---|---|---|
| Any | Post | Static image | Pre-stored background + text overlay + logo |
| Any | Carousel | Static images | Pre-stored background + text overlay + logo |
| FB/IG | Story | Static image | Pre-stored background + text overlay + logo (publish as Story) |
| FB/IG | Reel (Argil) | **AI avatar video** | **Argil API** (1 per brand per week, tagged by social-calendar) |
| FB/IG | Reel | **Ken Burns video** | Pre-stored background + Ken Burns zoom + text overlay (no API) |
| LinkedIn | Reel/Story | Static image | Pre-stored background + text overlay + logo (publish as post) |

**Decision logic:**
1. Check the `Format` field from the Notion calendar
2. If Format = `"Reel (Argil)"` → use **Step 4c-argil** (AI avatar talking-head)
3. If Format = `"Reel"` (without Argil tag) → use **Step 4c-video** (Ken Burns background video)
4. All other formats → use **Step 4c-image** (pre-stored background + text overlay)

### Step 4c-argil — Generate Reel video via Argil API (1 per brand per week)

Only for Reels tagged `(Argil)` in the social calendar. Generate a talking-head video:

1. **Write a 15–30 second script** from the post's Topic, ContentAngle, and CTA:
   - Hook (first 3 seconds) — scroll-stopping opener from the post hook
   - Value (10–20 seconds) — the key insight from the content angle
   - CTA (3–5 seconds) — from the calendar CTA field

2. **Set aspect ratio** — always `"9:16"` for Reels (Argil is only used for Reels, never Stories).

3. **Create the video:**
```bash
VIDEO_RESPONSE=$(curl -s -X POST "https://api.argil.ai/v1/videos" \
  -H "x-api-key: $ARGIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "[Brand] [Platform] Reel - [Topic] - [Date]",
    "aspectRatio": "9:16",
    "moments": [{
      "avatarId": "AVATAR_ID",
      "voiceId": "VOICE_ID",
      "transcript": "Your 15-30 second script here..."
    }]
  }')
VIDEO_ID=$(echo $VIDEO_RESPONSE | python -c "import sys,json; print(json.load(sys.stdin)['id'])")
```

4. **Render:**
```bash
curl -s -X POST "https://api.argil.ai/v1/videos/$VIDEO_ID/render" \
  -H "x-api-key: $ARGIL_API_KEY"
```

5. **Poll until done** (check every 30 seconds, max 10 minutes):
```bash
curl -s "https://api.argil.ai/v1/videos/$VIDEO_ID" \
  -H "x-api-key: $ARGIL_API_KEY"
```
When `status` = `"DONE"`, extract `videoUrl`.

6. **Download and save:**
```bash
curl -s -o "outputs/{brand}/posts/[Platform]/[Slug]_[Date]_final.mp4" "$VIDEO_URL"
```

**Fallback:** If Argil fails (API error, timeout > 10 min, no credits), fall back to Ken Burns video (Step 4c-video). If that also fails, fall back to static image (Step 4c-image) and publish as Story instead of Reel.

### Step 4c-video — Generate Reel video from pre-stored background (Ken Burns + text overlay)

For Reels NOT tagged `(Argil)` in the calendar. No external API needed — instant, free.

**Pipeline:** Pre-stored background → Ken Burns zoom (ffmpeg) → text + logo overlay → silent .mp4

**1. Pick a background image from `brands/{brand}/backgrounds/`:**

Match the filename to the post's Topic or ImageBrief. Filenames are descriptive (e.g., `finance_dashboard_laptop.png`, `singapore_skyline_timelapse.png`). Pick the closest match. Don't reuse the same background for consecutive Reels on the same platform.

**2. Scale background and apply Ken Burns zoom:**

```bash
# Scale image to 1.2x target for Ken Burns headroom, then zoompan to 1080x1920
python -c "
from PIL import Image
img = Image.open('brands/{brand}/backgrounds/CHOSEN_BG.png').convert('RGB')
scale = max(1080/img.width, 1920/img.height)
img = img.resize((int(img.width*scale), int(img.height*scale)), Image.LANCZOS)
left = (img.width-1080)//2; top = (img.height-1920)//2
img = img.crop((left, top, left+1080, top+1920))
img = img.resize((1296, 2304), Image.LANCZOS)
img.save('tmp/bg_large.png')
"
```

**3. Check brightness to determine text style:**

```bash
python -c "
from PIL import Image, ImageStat
img = Image.open('tmp/bg_large.png').convert('RGB')
w, h = img.size
center = img.crop((w//4, h//3, 3*w//4, 2*h//3))
brightness = sum(ImageStat.Stat(center).mean) / 3
print('DARK' if brightness < 160 else 'LIGHT')
"
```

- **DARK bg:** White text with `shadowcolor=black@0.6:shadowx=3:shadowy=3`
- **LIGHT bg:** Brand-colored text (`fontcolor=0x{brand_primary}`), no shadow

**4. Build ffmpeg command:**

Crop logo with PIL first (transparent PNG):
```bash
python -c "
from PIL import Image
logo = Image.open('brands/{brand}/logo.png').convert('RGBA')
bbox = logo.getbbox()
if bbox: logo = logo.crop(bbox)
logo = logo.resize((160, int(logo.height*(160/logo.width))), Image.LANCZOS)
logo.save('tmp/logo_cropped.png')
"
```

Generate the video (single ffmpeg command — Ken Burns bg + static logo + animated text):
```bash
ffmpeg -y \
  -loop 1 -i "tmp/bg_large.png" \
  -i "tmp/logo_cropped.png" \
  -filter_complex "[0:v]zoompan=z='1+0.012*in/270':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=270:s=1080x1920:fps=30,setsar=1:1,format=rgba[bg0];[1:v]format=rgba[logo];[bg0][logo]overlay=50:50:format=auto[bg];[bg]DRAWTEXT_FILTERS" \
  -t 9 -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an -movflags +faststart \
  "outputs/{brand}/posts/[Platform]/[Slug]_[Date]_final.mp4"
```

The DRAWTEXT_FILTERS use `drawtext` with `enable` and `alpha` for fade-in/fade-out per scene (3 scenes × 3 seconds). Text is centered horizontally, positioned at bottom half of frame. Use brand font from `brands/{brand}/fonts/`.

**5. Cleanup:**
```bash
rm -f tmp/bg_large.png tmp/logo_cropped.png
```

**Fallback:** If Ken Burns generation fails (ffmpeg error), fall back to static image from the same background (Step 4c-image) and publish as Story instead of Reel.

**Avatar selection — rotate for variety, prefer Asian characters for SEA markets:**

Pick avatar based on the post's Persona and platform. Don't repeat the same avatar on consecutive posts for the same platform. Use `GET /avatars` to get current IDs.

Read avatar-to-persona mappings from `brands/{brand}/avatars.md`. This file defines which avatars to use for each persona slug, the founder avatar + voice clone, and market preferences. Example mapping below:

| Persona Slug | Suggested Avatars | Why |
|---|---|---|
| sme-founder, solopreneur | Founder avatar, Arjun, Hassan | Founder/business owner feel |
| ops-manager, content-mgr | Ananya, Kabir, Koki | Professional/operational |
| sales-leader, sales-rep | Rahul, Hassan, Budi | Sales/outreach energy |
| cs-manager | Amira, Anjali, Ananya | Customer-facing |
| agency-owner, growth-mktr | Kabir, Arjun, Founder avatar | Strategy/leadership |
| general | Rotate any Asian avatar | Variety |

Use the founder avatar + voice clone only for authority/founder content. For all other avatars, pick a matching English voice from `GET /voices`.

### Step 4c-image — Pick pre-stored background image

Pick a background from `brands/{brand}/backgrounds/` that best matches the post's Topic and ImageBrief. Filenames are descriptive — match by keyword.

```bash
# List available backgrounds
ls brands/{brand}/backgrounds/*.png
```

Pick the closest match. Examples:
- Post about invoices → `finance_dashboard_laptop.png` or `stacked_invoices_desk.png`
- Post about SEO → `seo_performance_graph.png` or `analytics_dashboard_desk.png`
- Post about customer service → `whatsapp_chat_night.png` or `automated_chat_responses.png`

**Don't reuse the same background for consecutive posts on the same platform.**

Scale the chosen background to the target canvas dimensions (from Step 4a):

```bash
python -c "
from PIL import Image
img = Image.open('brands/{brand}/backgrounds/CHOSEN.png').convert('RGB')
tw, th = TARGET_W, TARGET_H
scale = max(tw/img.width, th/img.height)
img = img.resize((int(img.width*scale), int(img.height*scale)), Image.LANCZOS)
left = (img.width-tw)//2; top = (img.height-th)//2
img = img.crop((left, top, left+tw, top+th))
img.save('outputs/{brand}/posts/[Platform]/[Slug]_[Date]_raw.png')
"
```

**No Nano Banana API call needed.** Backgrounds are pre-generated monthly by the background-generator skill.

### Step 4d — Apply text overlay

Use `media-server` MCP tool `add_text_overlay` with:
- `input_path`: raw image path
- `output_path`: with_text image path
- `headline`, `subline`, `target_w`, `target_h`, `text_align`, `text_position`, `brand`

- `HEADLINE`: max 6–8 words, title case or all caps — use the post hook (NOT the topic name verbatim)
- `Subline`: **always provide a subline** — never pass `""`. Use a short supporting line: brand tagline, key benefit, or CTA teaser (read from `brands/{brand}/brand.md`)
- Always pass `target_w target_h` explicitly — Gemini doesn't return correct dimensions

### Step 4e — Apply logo overlay

Use `media-server` MCP tool `add_logo` with:
- `input_path`: with_text image path
- `output_path`: final image path
- `position`: from day-of-week rotation table
- `scale`: 0.18
- `brand`: active brand name

- Logo: `brands/{brand}/logo.png` — always 0.18 scale (18% of image width)
- `logo_position`: from day-of-week rotation table above

### Step 4f — Save final image

```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_final.png
```

**Always overwrite** — never skip existing files.

### Step 4g — Delete intermediate image files

After `_final.png` is confirmed saved, delete the build artifacts:

```bash
rm -f "outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_raw.png"
rm -f "outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_with_text.png"
```

Only `_final.png` should remain. Run this for every post before moving to Step 5.

---

## Step 5 — Publish to Late API

Upload the image and copy directly to Late API and publish immediately. See TOOLS.md → "Social Publishing" for account IDs and helper functions.

**IMPORTANT: Always pass `platformSpecificData.contentType` for Reels and Stories.** Without this, Late defaults everything to a feed Post regardless of image dimensions.

**Reel video publishing:** When the asset is a video (from Argil or Ken Burns), upload as `"type": "video"` and use `"contentType": "video/mp4"` in the presign call. The `platformSpecificData.contentType` mapping for Reels stays the same.

**Reel fallback rule:** If both Argil and Ken Burns video generation failed and you have a static image instead, Late API will return a 400 aspect ratio error for Reels. In this case, fall back to `"story"` for both Instagram and Facebook — same 1080×1920 image dimensions, no changes needed. Log the fallback in the Slack notification and memory.

```python
import urllib.request

LATE_API_KEY = os.environ["LATE_API_KEY"]
# Account IDs — read from env vars using brand prefix (e.g. FIVEBUCKS_LATE_FB)
B = BRAND.upper()
LATE_ACCOUNTS = {
    "facebook":  os.environ[f"{B}_LATE_FB"],
    "instagram": os.environ[f"{B}_LATE_IG"],
    "linkedin":  os.environ[f"{B}_LATE_LI"],
}

# Maps Notion calendar Format → Late API contentType per platform
# Instagram uses "reels" (plural); Facebook uses "reel" (singular)
# FALLBACK: Reels require video. If publishing a static image as a Reel and Late returns 400,
# retry with contentType "story" for both Instagram and Facebook (same 1080x1920 dimensions).
LATE_CONTENT_TYPE = {
    "reel":     {"instagram": "reels", "facebook": "reel"},
    "story":    {"instagram": "story", "facebook": "story"},
    "carousel": {},   # Late handles carousels via multiple mediaItems — no contentType needed
    "post":     {},   # default feed post — no contentType needed
}
LATE_CONTENT_TYPE_FALLBACK = {
    "reel": {"instagram": "story", "facebook": "story"},
}

def late_request(method, path, body=None):
    url = f"https://getlate.dev/api/v1/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {LATE_API_KEY}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def upload_to_late(file_path, filename):
    content_type = "video/mp4" if filename.endswith(".mp4") else "image/png"
    presign = late_request("POST", "media/presign", {
        "filename": filename,
        "contentType": content_type
    })
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    put_req = urllib.request.Request(presign["uploadUrl"], data=file_bytes, method="PUT",
                                     headers={"Content-Type": content_type})
    with urllib.request.urlopen(put_req): pass
    return presign["publicUrl"]

# For each post:
platform_key = post["platform"].lower()  # "facebook" | "instagram" | "linkedin"
post_format = post["format"].lower()     # "post" | "reel" | "story" | "carousel"
account_id = LATE_ACCOUNTS[platform_key]
image_url = upload_to_late(final_image_path, os.path.basename(final_image_path))

# Build platform object — add platformSpecificData for Reels/Stories
platform_obj = {"platform": platform_key, "accountId": account_id}
content_type = LATE_CONTENT_TYPE.get(post_format, {}).get(platform_key)
if content_type:
    platform_obj["platformSpecificData"] = {"contentType": content_type}

result = late_request("POST", "posts", {
    "content": copy_text,        # full post copy including hashtags
    "isDraft": False,
    "publishNow": True,
    "platforms": [platform_obj],
    "mediaItems": [{"url": media_url, "type": "video" if final_path.endswith(".mp4") else "image"}],
})
late_post_id = result["post"]["_id"]
```

**Do NOT store copy in Notion** — Late is the single source of truth.

---

## Step 6 — Update Social Calendar status in Notion

Set Status (cell index 9) based on what was actually done in Step 5:

| Step 5 action | Notion status |
|---|---|
| `publishNow: true` (live post) | `"Published"` |
| `isDraft: true` (saved as draft) | `"Draft Ready"` |

Use **Notion MCP** to update the row's Status cell.

For each published post, use `mcp__notion__API-update-a-block` with the row's `_row_id` (saved from Step 1). Rebuild the full cells array with the Status cell (index 9) set to the new value:

```
block_id: <_row_id>
type: { "table_row": { "cells": [ [{"type":"text","text":{"content":"<cell_0>"}}], ..., [{"type":"text","text":{"content":"Published"}}] ] } }
```

- If published live → Status = `"Published"`
- If saved as draft → Status = `"Draft Ready"`

You must include ALL 10 cells in the update (not just the Status cell) — the Notion API replaces the entire row.

Run once per post published.

---

## Step 7 — Send Slack notification

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

DM the user via **Slack MCP** (`slack_send_message`, `channel_id: "$SLACK_NOTIFY_USER"`):

```
[{brand}] Content ready for [DD Mon YYYY]

[Platform] — [Format] — [Topic]
  Copy: outputs/{brand}/posts/[Platform]/[Slug]_copy.md
  Image: outputs/{brand}/posts/[Platform]/[Slug]_final.png
  Published: [late_post_id]
  (or Saved as draft: [late_post_id])

Notion Social Calendar updated.
```

---

## Step 8 — Log to memory

Append a summary to `memory/YYYY-MM-DD.md`:

```markdown
## Content generation run — YYYY-MM-DDTHH:MM UTC (daily cron)
- Posts generated: N (for DD Mon YYYY)
- [Platform] "[Topic]" ([persona])
  - Copy: [path]
  - Image: [path]
  - Late draft id: [id]
- Images generated: N
- Social Calendar updated: yes/no
- Slack notified: yes/no
```

---

## Quality Checklist

- [ ] All "Planned" posts for tomorrow processed
- [ ] Copy matches persona voice and brand tone
- [ ] Hook is scroll-stopping; CTA is specific
- [ ] Image dimensions are correct for platform/format
- [ ] Text overlay applied with correct day-of-week text_align
- [ ] Logo at 0.18 scale with correct day-of-week logo_position
- [ ] text_position is always "bottom" — never "top"
- [ ] Both text overlay and logo overlay applied (never skip either)
- [ ] Final images saved to correct `outputs/{brand}/posts/[Platform]/` folder
- [ ] Intermediate files deleted — `_raw.png` and `_with_text.png` removed after `_final.png` confirmed
- [ ] `platformSpecificData.contentType` set correctly for Reels/Stories (never omitted)
- [ ] Published to Late API with correct mode (publishNow or isDraft)
- [ ] Notion Social Calendar rows updated to "Published" (if published) or "Draft Ready" (if draft) — never hardcoded
- [ ] Slack notification sent with Late post IDs and correct status
- [ ] Memory logged
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "content-generator",
    "brand": "<active-brand>",
    "status": "<success|partial|failed>",
    "summary": "<1 line, <200 chars>",
    "started_at": "<ISO timestamp>",
    "completed_at": "<ISO timestamp>",
    "metrics": {
      "date": "YYYY-MM-DD",
      "images_generated": 0,
      "videos_generated": 0,
      "posts": [
        {
          "platform": "Facebook",
          "topic": "...",
          "persona": "...",
          "format": "static",
          "asset_type": "image",
          "status": "Published",
          "late_post_id": "..."
        }
      ]
    }
  }'
```

**Status values:** `success` (all posts generated + published), `partial` (some posts failed), `failed` (skill errored).
