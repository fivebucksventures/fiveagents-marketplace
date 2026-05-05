---
name: content-generator
description: Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack. Runs daily on cron schedule.
allowed-tools: Read, Grep, Glob, Bash
---

# SKILL.md — Content Generator

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are a content production agent for the active brand. Your job is to generate copy and images for today's scheduled social media posts from the Notion Social Calendar, save all outputs, update Notion, and notify via Slack.

Runs daily Mon–Sun on cron schedule. Targets posts scheduled for **today** (in the brand's timezone from `brands/{brand}/brand.md` Locale section).

---

## Inputs

- **Social calendar**: Notion Social Media Calendar database — DB ID from env var `{BRAND}_NOTION_DB` (e.g. `FIVEBUCKS_NOTION_DB`)
- **Publishing**: Zernio API — publish immediately (`isDraft: false`, `publishNow: true`)
- **Brand context**: `brands/{brand}/brand.md`, `brands/{brand}/audience.md`, `brands/{brand}/product.md`
- **Mode**: `AUTO_PUBLISH=true` — publish immediately, do NOT save as draft

---

## Step 1 — Find tomorrow's posts in Notion

**Target date**: today in the brand's timezone (read from `brands/{brand}/brand.md` Locale section, e.g. `TZ=Asia/Jakarta date '+%d %b %Y'`)

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
- `Date` matches today's date (in brand timezone)
- `Status` == `"Planned"`

Save each row's block ID as `_row_id` — needed for Step 6 status update.

If no matching rows, log "No posts scheduled for [date]" and exit.

---

## Step 2 — Read brand context

Read before writing any copy:
- `brands/{brand}/brand.md` — voice, tone, approved phrases
- `brands/{brand}/audience.md` — persona pain points and triggers
- `brands/{brand}/product.md` — features, pricing, differentiators

Read before generating any image:
- `brands/{brand}/design-system/` — Claude Design visual system (colors, fonts, components). **Mandatory.** If missing, log a `failed` run with summary "design-system folder missing — run brand-setup Step 4b" and exit before generating images.

Also detect optional templates (used in Step 4):
- `brands/{brand}/social-carousel-template/` — if present, used for IG/FB Carousel formats
- `brands/{brand}/social-story-template/` — if present, used for IG/FB Story / Reel (static) formats

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
2. **Reel caption** (posted to Zernio API as `content`): clean, readable copy — hook + 1-2 short paragraphs + CTA + hashtags. No script formatting, no timing markers. ~300 chars.

**For Stories**: caption text is NOT displayed (Stories are visual-only). Still write a production script for the `_copy.md` file, but send minimal text to Zernio (just hashtags or empty string).

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

**Every image is generated fresh via Gemini** based on the post's Topic, ImageBrief, and brand visual style.

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
| Mon | center | bottom | top-right |
| Tue | center | top | top-left |
| Wed | center | bottom | top-right |
| Thu | center | top | top-left |
| Fri | center | bottom | top-right |
| Sat | center | top | top-left |

`text_align` is **always "center"**. `text_position` alternates between "bottom" (Mon/Wed/Fri) and "top" (Tue/Thu/Sat).

### Step 4c — Choose asset type: Image or Video

Check the post `Format` from the calendar:

| Platform | Format | Asset Type | Tool |
|---|---|---|---|
| FB/IG | Carousel | Static images | If `social-carousel-template/` exists → render via template (Step 4c-template). Else → Gemini per-slide + text overlay + logo |
| FB/IG | Story | Static image | If `social-story-template/` exists → render via template (Step 4c-template). Else → Gemini + text overlay + logo (publish as Story) |
| FB/IG | Reel (Argil) | **AI avatar video** | **Argil API** (1 per brand per week, tagged by social-calendar) |
| FB/IG | Reel | **Static image as Story** | If `social-story-template/` exists → render via template. Else → Gemini + text overlay + logo (publish as Story) |
| LinkedIn | Post | Static image | Gemini + text overlay + logo (templates do not apply on LinkedIn) |
| LinkedIn | Reel/Story | Static image | Gemini + text overlay + logo (publish as post) |
| Any | Post | Static image | Gemini + text overlay + logo |

**Decision logic:**
1. Check the `Format` field from the Notion calendar
2. If Format = `"Reel (Argil)"` → use **Step 4c-argil** (AI avatar talking-head)
3. If Format = `"Carousel"` AND platform ∈ {Instagram, Facebook} AND `brands/{brand}/social-carousel-template/` exists → use **Step 4c-template**
4. If Format ∈ {`"Story"`, `"Reel"`} AND platform ∈ {Instagram, Facebook} AND `brands/{brand}/social-story-template/` exists → use **Step 4c-template**
5. If Format = `"Reel"` (no template, no Argil tag) → use **Step 4c-image** (static image, publish as Story)
6. All other formats → use **Step 4c-image** (Gemini-generated image + text overlay)

### Step 4c-template — Render via Claude Design template (Carousel / Story)

Use this path when an applicable template folder is installed under the brand. This produces on-brand output without Pillow text/logo overlays (the template includes them).

**Gemini is still required.** The template provides layout, fonts, colors, text frames, and logo placement — but the actual photograph/illustration that fills each visual slot is generated fresh by Gemini per post. Do not skip Gemini.

**Steps:**

1. **Inspect the template** — list files in `brands/{brand}/social-carousel-template/` (or `.../social-story-template/`). Read the entry HTML (typically `index.html`). Identify:
   - Per-slide structure — separate `slide-N.html` files OR sections within `index.html`
   - Text placeholder elements (e.g. `data-slot="headline"`, `data-slot="body"`, or class names like `.slot-headline`). If no explicit slots, treat the placeholder copy in the template as text-replace anchors.
   - Image placeholder elements (e.g. `<img data-slot="visual">` or CSS `background-image`)

2. **Generate visuals for image slots** — use `gemini_generate_image` matching slot dimensions and the brand's design-system aesthetic (pass design-system colors/fonts into the prompt for tonal alignment). Save to `tmp/{brand}/{slug}/visual-{N}.png`. Image prompt rules from Step 4c-image still apply (no text, no logos in the generated image).

3. **Substitute content into a working copy** — copy the template folder to `tmp/{brand}/{slug}/template/`. Do not modify the source under `brands/`. For each slide:
   - Replace text placeholders with the post's hook / body / CTA from Step 3
   - Replace image placeholders with local `tmp/{brand}/{slug}/visual-{N}.png` paths
   - Carousel: produce one HTML per slide (typically 3–6 slides — match what the template defines)

4. **Render to PNG via Playwright MCP:**
```
For each slide HTML:
  - browser_navigate file:///<absolute-path>/slide-N.html
  - Set viewport:
      Carousel (4:5): 1080 × 1350
      Story / Reel (9:16): 1080 × 1920
  - browser_take_screenshot → outputs/{brand}/posts/[Platform]/[Slug]_[DDMonYYYY]_slide-{N}_final.png
```

For a single Story/Reel (one frame), name the file `[Slug]_[DDMonYYYY]_final.png` (no slide suffix).

5. **Skip Steps 4d (text overlay) and 4e (logo overlay)** — the template already includes text and logo. Do not double-stamp.

6. **Cleanup** — delete `tmp/{brand}/{slug}/` after final PNGs are confirmed saved.

**Fallback:** If Playwright MCP fails or the template structure cannot be parsed (no obvious placeholders, no entry HTML), log a Slack note and fall back to **Step 4c-image** for this post. Do not block the daily run.

### Step 4c-argil — Generate Reel video via Argil API (1 per brand per week)

Only for Reels tagged `(Argil)` in the social calendar. Generate a talking-head video:

1. **Write a 15–30 second script** from the post's Topic, ContentAngle, and CTA:
   - Hook (first 3 seconds) — scroll-stopping opener from the post hook
   - Value (10–20 seconds) — the key insight from the content angle
   - CTA (3–5 seconds) — from the calendar CTA field

2. **Set aspect ratio** — always `"9:16"` for Reels (Argil is only used for Reels, never Stories).

3. **Create the video:**
```
Use gateway MCP tool `argil_create_video`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- name: "[Brand] [Platform] Reel - [Topic] - [Date]"
- aspect_ratio: "9:16"
- moments: [{ avatarId: "AVATAR_ID", voiceId: "VOICE_ID", transcript: "Your 15-30 second script here..." }]
→ Returns video ID
```

4. **Render:** `argil_render_video` with `fiveagents_api_key` + `video_id`

5. **Poll:** `argil_get_video` with `fiveagents_api_key` + `video_id` until status=DONE, extract videoUrl

6. **Download and save:** Download the video from `videoUrl` and save to `outputs/{brand}/posts/[Platform]/[Slug]_[Date]_final.mp4`

**Fallback:** If Argil fails (API error, timeout > 10 min, no credits), fall back to static image (Step 4c-image) and publish as Story instead of Reel.

**Avatar selection — rotate for variety, prefer Asian characters for SEA markets:**

Pick avatar based on the post's Persona and platform. Don't repeat the same avatar on consecutive posts for the same platform. Use `argil_list_avatars` gateway tool to get current IDs.

Read avatar-to-persona mappings from `brands/{brand}/avatars.md`. This file defines which avatars to use for each persona slug, the founder avatar + voice clone, and market preferences. Example mapping below:

| Persona Slug | Suggested Avatars | Why |
|---|---|---|
| sme-founder, solopreneur | Founder avatar, Arjun, Hassan | Founder/business owner feel |
| ops-manager, content-mgr | Ananya, Kabir, Koki | Professional/operational |
| sales-leader, sales-rep | Rahul, Hassan, Budi | Sales/outreach energy |
| cs-manager | Amira, Anjali, Ananya | Customer-facing |
| agency-owner, growth-mktr | Kabir, Arjun, Founder avatar | Strategy/leadership |
| general | Rotate any Asian avatar | Variety |

Use the founder avatar + voice clone only for authority/founder content. For all other avatars, pick a matching English voice from `argil_list_voices` gateway tool.

### Step 4c-image — Generate image via Gemini

Generate a fresh image for every post using Gemini:

```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: Build from: brand visual style (from brand.md), post topic, mood, and ImageBrief from the Notion calendar entry. Example: "Professional clean desk workspace with laptop showing analytics dashboard, soft natural lighting, warm tones, no text, no people, bokeh background"
- aspect_ratio: match target canvas from Step 4a (e.g. "1:1" for IG square, "9:16" for Story/Reel, "191:100" for LinkedIn)
- model: "gemini-3.1-flash-image-preview"

Result is auto-saved to a temp file. Use Python to locate, decode, and save to disk:
```python
import glob, json, base64, os
result_file = max(glob.glob('/sessions/*/mnt/.claude/projects/*/tool-results/mcp-*gemini_generate_image*.txt'), key=os.path.getmtime)
with open(result_file) as f:
    parsed = json.loads(json.load(f)[0]['text'])
with open('brands/{brand}/backgrounds/{descriptive_filename}.png', 'wb') as f:
    f.write(base64.b64decode(parsed['image_base64']))
```

**Prompt rules:**
- Always include "no text, no people" — text and logo are added in Steps 4d/4e
- Match the brand's visual style and color palette from `brand.md`
- Keep it clean and uncluttered — the text overlay needs readable space at the bottom

### Step 4d — Apply text overlay — USE PILLOW

Use Python Pillow to add gradient scrim + headline + subline. Do NOT use `image_add_text_overlay` gateway MCP tool.

```python
from PIL import Image, ImageDraw, ImageFont
import textwrap

def add_text_overlay(input_path, output_path, headline, subline, target_w, target_h, text_position='bottom'):
    img = Image.open(input_path).convert('RGBA')
    # Resize + center-crop to target canvas
    r = img.width / img.height; tr = target_w / target_h
    if r > tr: nw = int(img.width * target_h / img.height); nh = target_h
    else: nw = target_w; nh = int(img.height * target_w / img.width)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw-target_w)//2, (nh-target_h)//2, (nw-target_w)//2+target_w, (nh-target_h)//2+target_h))

    pad = int(target_w * 0.06)
    hs = max(36, int(target_w * 0.048))
    ss2 = max(22, int(target_w * 0.026))
    try:
        fh = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', hs)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', ss2)
    except:
        fh = fs = ImageFont.load_default()

    # Word-wrap both lines to fit within canvas width minus padding
    max_chars = max(10, int((target_w - 2 * pad) / (hs * 0.55)))
    h_lines = textwrap.wrap(headline, width=max_chars)
    s_lines = textwrap.wrap(subline, width=max_chars + 10)

    # Measure total text block height
    line_gap = int(hs * 0.3)
    block_h = len(h_lines) * (hs + line_gap) + int(hs * 0.5) + len(s_lines) * (ss2 + line_gap)

    # Position scrim and text block
    scrim_h = block_h + pad * 2
    scrim = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scrim)

    if text_position == 'bottom':
        scrim_top = target_h - scrim_h
        text_y = scrim_top + pad
        # Gradient: transparent at top, dark at bottom
        for y in range(scrim_top, target_h):
            alpha = int(200 * (y - scrim_top) / (target_h - scrim_top))
            ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))
    else:  # top
        scrim_top = 0
        text_y = pad
        # Gradient: dark at top, transparent at bottom
        for y in range(0, scrim_h):
            alpha = int(200 * (1 - y / scrim_h))
            ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)

    # Draw headline lines (white, centered)
    for line in h_lines:
        bbox = draw.textbbox((0, 0), line, font=fh)
        lw = bbox[2] - bbox[0]
        x = (target_w - lw) // 2
        draw.text((x, text_y), line, font=fh, fill=(255, 255, 255, 255))
        text_y += hs + line_gap

    text_y += int(hs * 0.3)  # gap between headline and subline

    # Draw subline lines (pink, centered)
    for line in s_lines:
        bbox = draw.textbbox((0, 0), line, font=fs)
        lw = bbox[2] - bbox[0]
        x = (target_w - lw) // 2
        draw.text((x, text_y), line, font=fs, fill=(236, 72, 153, 255))
        text_y += ss2 + line_gap

    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

- `headline`: max 6–8 words, title case or all caps — use the post hook (NOT the topic name verbatim)
- `subline`: **always provide a subline** — never pass `""`. Use a short supporting line: brand tagline, key benefit, or CTA teaser (read from `brands/{brand}/brand.md`)
- `target_w`, `target_h`: canvas dimensions from Step 4a
- `text_position`: from day-of-week rotation (Step 4b) — either `"bottom"` or `"top"`
- Text is always **centered horizontally** and word-wrapped to stay within canvas bounds. Save output as `_with_text.png`.

### Step 4e — Apply logo overlay — USE PILLOW

Use Python Pillow to composite the logo. Do NOT use `image_add_logo` gateway MCP tool.

```python
from PIL import Image

def add_logo(image_path, output_path, logo_path, position='top-right', scale=0.18):
    img = Image.open(image_path).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')
    w, h = img.size
    logo_w = int(w * scale)
    logo_h = int(logo.height * logo_w / logo.width)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    margin = int(w * 0.03)
    positions = {
        'top-right':    (w - logo_w - margin, margin),
        'top-left':     (margin, margin),
        'bottom-right': (w - logo_w - margin, h - logo_h - margin),
        'bottom-left':  (margin, h - logo_h - margin),
    }
    x, y = positions[position]
    img.paste(logo, (x, y), logo)
    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

- Logo path: `brands/{brand}/logo.png`. Scale: 0.18. Position: from day-of-week rotation.
- Save as `_final.png`.

### Step 4f — Save final image

```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_final.png
```

**Always overwrite** — never skip existing files.

### Step 4g — Cleanup

Only `_final.png` (or `_final.mp4`) should remain in the output folder. Delete any intermediate files (`_raw.png`, `_with_text.png`) for every post before moving to Step 5.

---

### Step 4h — Visual verification (MANDATORY before publishing)

For every `_final.png`, read the image file and visually inspect it before uploading to Zernio. Check all of the following:

**Text overlay:**
- [ ] Headline is fully visible — no characters clipped at the left, right, or bottom edge
- [ ] Subline is fully visible — not cut off
- [ ] Text has sufficient contrast against the background (gradient scrim is dark enough)
- [ ] Text does not overlap the logo

**Logo:**
- [ ] Logo is fully visible — not clipped by any edge
- [ ] Logo has sufficient contrast/visibility against the background behind it
- [ ] Logo visual margin from the top edge and right (or left) edge looks approximately equal — the logo should not appear to "float" lower or higher than its corner margin

**Overall composition:**
- [ ] Text and logo do not overlap each other
- [ ] The image looks intentional and on-brand — not accidental or broken

**If any check fails, fix before publishing:**

| Issue | Fix |
|---|---|
| Text clipped at left/right edge | Increase `pad` to `int(target_w * 0.08)` and re-render |
| Text clipped at top/bottom edge | Reduce `hs` by 10% and re-render |
| Subline cut off | Reduce `ss2` by 10% and re-render |
| Low text contrast | Increase scrim opacity — change `200` to `230` in the gradient alpha and re-render |
| Text overlaps logo | If `text_position == 'bottom'` and logo is `bottom-*`: switch logo to `top-*` position. If text is `top` and logo is `top-*`: switch logo to `bottom-*`. Re-render. |
| Logo clipped at edge | Reduce `scale` by 0.02 and re-render |
| Logo visually offset (top margin ≠ side margin) | Crop transparent padding: `logo = logo.crop(logo.getbbox())` before resizing, then re-render |
| Logo too small to read | Increase `scale` to 0.22 and re-render |
| Logo too large / dominates image | Reduce `scale` to 0.14 and re-render |
| Logo blends into background (low contrast) | Add a subtle white semi-transparent circle/rect behind the logo: `bg = Image.new('RGBA', (logo_w + pad, logo_h + pad), (255,255,255,160))`, paste at `(x - pad//2, y - pad//2)` before pasting logo |
| Logo placed over busy image area | Switch to the opposite corner (e.g. `top-right` → `top-left`) where the background is calmer, then re-render |

Re-render until all checks pass. Only then proceed to Step 5.

---

## Step 5 — Publish to Zernio API

Upload the image and copy directly to Zernio API and publish immediately. See TOOLS.md → "Social Publishing" for account IDs and helper functions.

**IMPORTANT: Always pass `platformSpecificData.contentType` for Reels and Stories.** Without this, Zernio defaults everything to a feed Post regardless of image dimensions.

**Reel video publishing:** When the asset is a video (from Argil), upload as `"type": "video"` and use `"contentType": "video/mp4"` in the presign call. The `platformSpecificData.contentType` mapping for Reels stays the same.

**Reel fallback rule:** If Argil video generation failed and you have a static image instead, Zernio API will return a 400 aspect ratio error for Reels. In this case, fall back to `"story"` for both Instagram and Facebook — same 1080×1920 image dimensions, no changes needed. Log the fallback in the Slack notification and memory.

For each post, use gateway MCP tools:

```
1. Use `late_presign_upload`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - filename: "<filename>.png" (or .mp4 for video)
   - content_type: "image/png" (or "video/mp4")
   → Returns uploadUrl + publicUrl

2. Use Python requests to upload the file directly to S3 (do NOT use `late_upload_media` MCP — it requires passing large base64 through context):
```python
import requests
with open('path/to/final_image.png', 'rb') as f:
    requests.put(uploadUrl, data=f, headers={'Content-Type': 'image/png'})
```

3. Use `late_create_post`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - content: <copy text with hashtags>
   - platforms: [{ platform: "<platform>", accountId: "<id>", platformSpecificData: { contentType: "<type>" } }]
   - media_items: [{ url: "<publicUrl from step 1>", type: "image" or "video" }]
   - publish_now: true (or is_draft: true)
```

Follow the platformSpecificData.contentType mapping and Reel fallback logic below.

**Account IDs** — read from env vars using brand prefix (e.g. `FIVEBUCKS_LATE_FB`):
```python
B = BRAND.upper()
LATE_ACCOUNTS = {
    "facebook":  os.environ[f"{B}_LATE_FB"],
    "instagram": os.environ[f"{B}_LATE_IG"],
    "linkedin":  os.environ[f"{B}_LATE_LI"],
}
```

**platformSpecificData.contentType mapping** — Instagram uses "reels" (plural); Facebook uses "reel" (singular):
```python
LATE_CONTENT_TYPE = {
    "reel":     {"instagram": "reels", "facebook": "reel"},
    "story":    {"instagram": "story", "facebook": "story"},
    "carousel": {},   # Zernio handles carousels via multiple mediaItems — no contentType needed
    "post":     {},   # default feed post — no contentType needed
}
LATE_CONTENT_TYPE_FALLBACK = {
    "reel": {"instagram": "story", "facebook": "story"},
}
```

**FALLBACK:** Reels require video. If publishing a static image as a Reel and Zernio returns 400, retry with contentType "story" for both Instagram and Facebook (same 1080x1920 dimensions).

**For each post**, determine the platform object:
- `platform_key` = post platform lowercase ("facebook" | "instagram" | "linkedin")
- `post_format` = post format lowercase ("post" | "reel" | "story" | "carousel")
- `account_id` = from env var `{BRAND}_LATE_{PLATFORM}` (e.g. `FIVEBUCKS_LATE_FB`)
- Add `platformSpecificData.contentType` using the mapping above (required for Reels/Stories)

Then call `late_create_post` with the assembled platform object, media URL from step 2, and copy text.

**Do NOT store copy in Notion** — Zernio is the single source of truth.

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
  - Zernio draft id: [id]
- Images generated: N
- Social Calendar updated: yes/no
- Slack notified: yes/no
```

---

## Quality Checklist

- [ ] All "Planned" posts for tomorrow processed
- [ ] Copy matches persona voice and brand tone
- [ ] Hook is scroll-stopping; CTA is specific
- [ ] `brands/{brand}/design-system/` was read before generating any image
- [ ] Image dimensions are correct for platform/format
- [ ] For IG/FB Carousel: if `social-carousel-template/` exists, it was used (Gemini still ran for visual slots); else fallback documented
- [ ] For IG/FB Story/Reel (static): if `social-story-template/` exists, it was used (Gemini still ran for visual slots); else fallback documented
- [ ] When falling back to Gemini-only path: text overlay applied with correct day-of-week text_position (bottom Mon/Wed/Fri, top Tue/Thu/Sat), text always centered horizontally
- [ ] When falling back to Gemini-only path: logo at 0.18 scale with correct day-of-week logo_position
- [ ] When falling back to Gemini-only path: both text overlay and logo overlay applied (never skip either)
- [ ] When using template path: text/logo overlays NOT applied (template already includes them — no double-stamp)
- [ ] Final images saved to correct `outputs/{brand}/posts/[Platform]/` folder
- [ ] Intermediate files deleted — `_raw.png` and `_with_text.png` removed after `_final.png` confirmed
- [ ] `platformSpecificData.contentType` set correctly for Reels/Stories (never omitted)
- [ ] Published to Zernio API with correct mode (publishNow or isDraft)
- [ ] Notion Social Calendar rows updated to "Published" (if published) or "Draft Ready" (if draft) — never hardcoded
- [ ] Slack notification sent with Zernio post IDs and correct status
- [ ] Memory logged
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "content-generator"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "images_generated": 0,
    "videos_generated": 0,
    "posts": [
      { "platform": "Facebook", "topic": "...", "persona": "...", "format": "static", "asset_type": "image", "status": "Published", "late_post_id": "..." }
    ]
  }
```

**Status values:** `success` (all posts generated + published), `partial` (some posts failed), `failed` (skill errored).
