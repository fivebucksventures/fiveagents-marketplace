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

## Step 1 — Find today's posts in Notion

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
`[0] Date`, `[1] Platform`, `[2] Format`, `[3] Topic`, `[4] Persona`, `[5] ContentAngle`, `[6] CTA`, `[7] Hashtags`, `[8] ImageBrief`, `[9] Direction`, `[10] Status`

`Direction` is set by `social-calendar` at planning time and tells content-generator which template variant to use:
- **Story format:** one of `"A"` (Spotlight Dark, brand-led), `"B"` (Editorial Stat, single big claim), `"C"` (Cream Press, case studies / testimonials).
- **Carousel format:** one of `"type-allnumbers"` (default), `"sticker-editorial"`, `"editorial-mixed"`, or whatever `coverVariant-bodyVariant` combination the brand's template supports.
- **Other formats** (Post, LinkedIn, Reel-Argil): leave blank — Direction does not apply.

If Direction is blank for a Story or Carousel post, default to `"A"` (story) or `"type-allnumbers"` (carousel) and log a warning — the calendar should have assigned one.

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

Read before generating any image — **all optional, never block on missing folders:**
- `brands/{brand}/design-system/` — Claude Design visual system (colors, fonts, components, spacing). When present, informs the Gemini-only image-path's prompt aesthetic. When absent, fall back to the Colors and Voice & Tone sections of `brands/{brand}/brand.md` plus the Google Font names captured in brand-setup Step 4.
- `brands/{brand}/social-carousel-template/` — when present, contains a Claude Design React + Babel template app (entry HTML + JSX + CSS + assets) with an `EDITMODE-BEGIN`/`EDITMODE-END` JSON block in the entry HTML. Used for IG/FB Carousel via Step 4c-template.
- `brands/{brand}/social-story-template/` — when present, contains the same kind of Claude Design template app with the EDITMODE contract, plus three direction styles (A/B/C). Used for IG/FB Story / Reel via Step 4c-template.

If `design-system/` and the relevant template folder are both missing, fall back to the Gemini-only path (Step 4c-image) using brand.md colors/voice. Never log a `failed` run for missing visual assets.

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

### Step 3b — Generate structured `_copy.json` for template-path posts

For posts that will render via the template-path (Carousel / Story / Reel on IG or FB when the matching `brands/{brand}/social-carousel-template/` or `brands/{brand}/social-story-template/` folder exists with an `EDITMODE-BEGIN` block), produce a structured copy artifact alongside `_copy.md`:

```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_copy.json
```

The JSON's keys MUST match the template's contract — the canonical key set + per-key character budgets are documented in `content-creation/SKILL.md` ("Carousel template copy contract" and "Story template copy contract"). Read those budgets before writing.

Map the post's hook/body/CTA (from Step 3) into the template's per-slide structure:

- **Carousel** (6 slides): map the post's narrative into Cover (`cover_eyebrow` + `cover_title` + `cover_sub`) → 4 sign slides (`s2_kicker`/`s2_title`/`s2_body` through `s5_*`, with optional `s2_pullquote`, `s3_stat_value`/`s3_stat_label`, `s5_before`/`s5_after`) → CTA (`cta_eyebrow` + `cta_title` + `cta_sub` + `cta_button`).
- **Story** (6 slides): map into Hook (`s1_*` — eyebrow + headline_pre + headline_accent + sub + live + big + big_unit) → Problem (`s2_*` — eyebrow + headline + 3 pain bullets) → Solution (`s3_*`) → Proof (`s4_*` — 4 stats + quote + author) → Offer (`s5_*` — 4 bullets + pill) → CTA (`s6_*` — eyebrow + headline_pre + headline_accent + sub + cta + url).

If the post brief is too thin to fill all required keys, leave the template's defaults in place for those keys (the EDITMODE block already has sample copy that won't break the render) and log a warning to memory.

**Skip Step 3b for non-template posts** — LinkedIn posts, Reel(Argil), and any post where the matching template folder is missing. For those, only `_copy.md` is required; content-generator's image-path uses the headline + body from `_copy.md` directly via Pillow text overlay.

---

## Step 4 — Generate images

**Two image-production paths depending on Format and template availability — see Step 4c for the dispatcher.**
- **Template-path** (Carousel / Story / Reel on IG/FB when the matching template folder is installed): the React + Babel template renders the slides; no Gemini call, no Pillow overlay.
- **Image-path** (LinkedIn posts; non-template formats; any post where the template folder is missing or the EDITMODE block can't be parsed): Gemini generates the background fresh + Pillow stamps text and logo. Universal fallback — always available.

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

⚠️ **The day-of-week rotation table applies only on the Gemini-only image-path (Step 4c-image).** On the template-path (Step 4c-template) all text, logo, kicker numerals, and CTA chrome are produced by the React template's render — Pillow text overlay and logo overlay are both skipped, and neither `text_align` nor `logo_position` rotation has any effect on template-path posts.

### Step 4c — Choose asset type: Image or Video

Check the post `Format` from the calendar:

| Platform | Format | Asset Type | Tool |
|---|---|---|---|
| FB/IG | Carousel | Static images | If `social-carousel-template/` has an entry HTML with EDITMODE block → **Step 4c-template** (substitute copy → Playwright render → 6 PNGs). Else → **Step 4c-image** (Gemini background → text overlay → logo). |
| FB/IG | Story | Static image | If `social-story-template/` has an entry HTML with EDITMODE block → **Step 4c-template** (substitute copy → Playwright render → 6 PNGs, one direction). Else → **Step 4c-image** (publish as Story). |
| FB/IG | Reel (Argil) | **AI avatar video** | **Argil API** (1 per brand per week, tagged by social-calendar) |
| FB/IG | Reel | **Static image as Story** | If `social-story-template/` has entry HTML with EDITMODE block → **Step 4c-template**. Else → **Step 4c-image** (publish as Story). |
| LinkedIn | Post | Static image | **Step 4c-image** (templates don't apply on LinkedIn) |
| LinkedIn | Reel/Story | Static image | **Step 4c-image** (publish as post) |
| Any | Post | Static image | **Step 4c-image** |

**Decision logic:**
1. Check the `Format` field from the Notion calendar.
2. If Format = `"Reel (Argil)"` → use **Step 4c-argil** (AI avatar talking-head).
3. If Format = `"Carousel"` AND platform ∈ {Instagram, Facebook} AND `brands/{brand}/social-carousel-template/` contains an entry HTML with `EDITMODE-BEGIN`/`EDITMODE-END` block → use **Step 4c-template**.
4. If Format ∈ {`"Story"`, `"Reel"`} AND platform ∈ {Instagram, Facebook} AND `brands/{brand}/social-story-template/` contains an entry HTML with `EDITMODE-BEGIN`/`EDITMODE-END` block → use **Step 4c-template**.
5. If Format = `"Reel"` (no template, no Argil tag) → use **Step 4c-image** (static image, publish as Story).
6. All other formats (or template missing / EDITMODE block absent) → use **Step 4c-image** (Gemini-generated background + text overlay + logo).

### Step 4c-template — Render via Claude Design template (Carousel / Story)

Use this path when the applicable template folder contains an entry HTML with an `EDITMODE-BEGIN`/`EDITMODE-END` JSON block. The template is a self-contained React + Babel app installed via brand-setup Step 4c. The agent:
1. Substitutes post-specific copy into the EDITMODE JSON block,
2. Renders the modified template in a Playwright browser context,
3. Screenshots each slide via stable offscreen DOM IDs.

**No Pillow text overlay, no Pillow logo overlay, no Gemini focal compositing on this path** — the template's React app produces fully-rendered slides with all chrome (logo, page indicator, kicker numerals, CTA buttons, eyebrow chips, themes) baked in. The agent's only job is copy substitution.

**Steps:**

#### 1. Locate the entry HTML and parse the EDITMODE block

```python
import re, json
from pathlib import Path

template_dir = Path("brands") / brand / "social-carousel-template"  # or social-story-template
entry_html = next(
    (p for p in template_dir.glob("*.html")
     if "EDITMODE-BEGIN" in p.read_text(encoding="utf-8")),
    None
)
if entry_html is None:
    use_path("4c-image"); return  # fall back

source = entry_html.read_text(encoding="utf-8")
m = re.search(r'/\*EDITMODE-BEGIN\*/(.*?)/\*EDITMODE-END\*/', source, re.DOTALL)
tweaks = json.loads(m.group(1))   # current defaults; we'll mutate per post
```

#### 2. Build the post copy dict

`content-creation` produces a structured copy artifact for each Carousel / Story post matching the template's key contract. Read it from the post's `_copy.json` if present (next to `_copy.md`), or derive from the calendar entry + persona context.

**Carousel keys** (must include all required, optional ones welcome): `cover_eyebrow`, `cover_title`, `cover_sub`, `s2_kicker`, `s2_title`, `s2_body`, `s3_kicker`, `s3_title`, `s3_body`, `s4_kicker`, `s4_title`, `s4_body`, `s5_kicker`, `s5_title`, `s5_body`, `cta_eyebrow`, `cta_title`, `cta_sub`, `cta_button`. Optional template-specific: `s2_pullquote`, `s3_stat_value`, `s3_stat_label`, `s5_before`, `s5_after`.

**Story keys**: `s1_eyebrow`, `s1_headline_pre`, `s1_headline_accent`, `s1_sub`, `s1_live`, `s1_big`, `s1_big_unit`, `s2_eyebrow`, `s2_headline`, `s2_pain1`, `s2_pain2`, `s2_pain3`, `s3_eyebrow`, `s3_headline_pre`, `s3_headline_accent`, `s3_sub`, `s4_eyebrow`, `s4_headline`, `s4_stat1_num`, `s4_stat1_lbl` (×4), `s4_quote`, `s4_quote_author`, `s5_eyebrow`, `s5_headline`, `s5_b1`–`s5_b4`, `s5_pill`, `s6_eyebrow`, `s6_headline_pre`, `s6_headline_accent`, `s6_sub`, `s6_cta`, `s6_url`.

#### 3. Apply the calendar's Direction to the tweaks

Direction is set by `social-calendar` per post (column 9 in the Notion table — see Step 1c).

**For Story posts:** map `Direction` to the template's `_direction` key:
```python
if format == "Story" or format == "Reel":
    tweaks["_direction"] = post.direction or "A"   # default to A if unset
```

**For Carousel posts:** parse `Direction` as `"<coverVariant>-<bodyVariant>"`:
```python
if format == "Carousel" and post.direction:
    cover_v, body_v = post.direction.split("-", 1)
    tweaks["coverVariant"] = cover_v   # e.g. "type" / "sticker" / "editorial"
    tweaks["bodyVariant"]  = body_v    # e.g. "allnumbers" / "editorial" / "mixed"
```

If `Direction` is blank, leave the template defaults in place.

#### 4. Merge post copy into tweaks and write modified HTML to tmp

```python
tweaks.update(post_copy)        # post_copy is the dict from step 2 (only keys present in post_copy are overwritten)

new_block = "/*EDITMODE-BEGIN*/" + json.dumps(tweaks, indent=2, ensure_ascii=False) + "/*EDITMODE-END*/"
modified = re.sub(r'/\*EDITMODE-BEGIN\*/.*?/\*EDITMODE-END\*/', new_block, source, count=1, flags=re.DOTALL)

import shutil
tmp_dir = Path("tmp") / brand / slug
if tmp_dir.exists(): shutil.rmtree(tmp_dir)
shutil.copytree(template_dir, tmp_dir)             # copy assets, fonts, jsx, css
(tmp_dir / entry_html.name).write_text(modified, encoding="utf-8")
```

#### 5. Render via Playwright and screenshot each slide

The template renders all slides into hidden offscreen DOM elements with stable IDs. Use Playwright MCP browser tools:

```
1. browser_navigate to file:///{absolute-path-to-tmp}/index.html (or whatever the entry HTML is named)
2. Wait for React render to settle: browser_wait_for selector e.g. "#export-cover" (carousel) or "#export-A-0" (story)
3. For each slide, screenshot the offscreen export element:

   Carousel — 6 slides at IDs (matches template defaults):
     #export-cover, #export-s2, #export-s3, #export-s4, #export-s5, #export-cta

   Story — 6 slides for the chosen direction (A, B, or C):
     #export-{D}-0 ... #export-{D}-5  where {D} is the direction letter

4. Save each screenshot to outputs/{brand}/posts/[Platform]/[Slug]_[Date]_slide-{N}_final.png
   For single-frame Story (publish as a Story, not a Reel sequence), only screenshot the slide the post needs — typically slide 0 (Hook) or whichever slide makes sense for that post's narrative beat. The calendar's ImageBrief / ContentAngle hints which slide to use for single-Story posts. For multi-slide Story sequences (rare, treat as a "story carousel"), screenshot all 6.
```

If the offscreen export DOM IDs are not present (older or non-standard template), fall back to `browser_take_screenshot` of each visible slide artboard; consult the template's `slides.jsx` / `app.jsx` for the actual selectors.

#### 6. Cleanup

Delete `tmp/{brand}/{slug}/` after final PNGs are saved.

#### 7. Skip Steps 4d and 4e for the template-path

Template-path PNGs are already final — they include text, logo, kicker numerals, CTA buttons, all chrome. Do **not** apply `add_text_overlay` or `add_logo` on this path. Day-of-week `text_align` and `logo_position` rotations apply only to the Gemini-only image-path (Step 4c-image).

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

Set Status (cell index 10) based on what was actually done in Step 5:

| Step 5 action | Notion status |
|---|---|
| `publishNow: true` (live post) | `"Published"` |
| `isDraft: true` (saved as draft) | `"Draft Ready"` |

Use **Notion MCP** to update the row's Status cell.

For each published post, use `mcp__notion__API-update-a-block` with the row's `_row_id` (saved from Step 1). Rebuild the full cells array with the Status cell (index 10 — Direction was inserted at index 9) set to the new value:

```
block_id: <_row_id>
type: { "table_row": { "cells": [ [{"type":"text","text":{"content":"<cell_0>"}}], ..., [{"type":"text","text":{"content":"Published"}}] ] } }
```

- If published live → Status = `"Published"`
- If saved as draft → Status = `"Draft Ready"`

You must include ALL 11 cells in the update (not just the Status cell) — the Notion API replaces the entire row. The 11 columns are: `[0] Date, [1] Platform, [2] Format, [3] Topic, [4] Persona, [5] ContentAngle, [6] CTA, [7] Hashtags, [8] ImageBrief, [9] Direction, [10] Status`.

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
- [ ] `brands/{brand}/design-system/` was read when present (informs Gemini prompt aesthetic); fallback to `brand.md` colors/voice when absent — never block on missing design-system
- [ ] Image dimensions are correct for platform/format
- [ ] Template-path used when the matching template folder has an entry HTML with EDITMODE block; image-path used otherwise (no `failed` run for missing templates)
- [ ] **Template-path:** EDITMODE-BEGIN/END block parsed; post-copy dict matches the template's key contract (carousel: cover_*/s2-5_*/cta_*; story: s1-6_*)
- [ ] **Template-path:** Direction from Notion calendar applied (`_direction` for story; `coverVariant`/`bodyVariant` for carousel) — defaults used only if calendar Direction is blank
- [ ] **Template-path:** modified HTML written to `tmp/{brand}/{slug}/`, original template under `brands/` left untouched
- [ ] **Template-path:** Playwright renders, waits for React, screenshots each slide via stable export DOM IDs (`#export-cover`/`#export-s2`...`#export-cta` for carousel; `#export-{A|B|C}-0`...`-5` for story)
- [ ] **Template-path:** Pillow text overlay AND logo overlay BOTH skipped — template renders include all chrome
- [ ] **Image-path (Gemini-only):** Pillow text overlay (Step 4d) AND logo overlay (Step 4e) BOTH applied — Gemini background has no logo
- [ ] **Image-path:** text overlay applied with correct day-of-week `text_position` (bottom Mon/Wed/Fri, top Tue/Thu/Sat), text always centered horizontally
- [ ] **Image-path:** Logo at 0.18 scale with correct day-of-week `logo_position`
- [ ] Day-of-week rotation does NOT apply on template-path (template chrome is fixed)
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
