---
name: content-generator
description: Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack. Runs daily on cron schedule.
allowed-tools: Read, Grep, Glob, Bash
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.4.0 | May 07, 2026 |

**Description:** Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack

### Change Log

**v2.4.0** — May 07, 2026
- Notion MCP tool prefix normalized — `mcp__notion__notion-*` → `mcp__claude_ai_Notion__notion-*` (matches the actual registered tool names)
- Step 6 (status update) — replaced obsolete `mcp__notion__API-update-a-block` call (block-level update not exposed by current Notion connector) with `notion-update-page` using `command: "update_content"` for targeted search-and-replace on the calendar page's markdown table

**v2.3.8** — May 07, 2026
- `add_text_overlay` + `add_logo` — replaced `is_vertical = target_h > target_w` with `is_story_reel = (target_h / target_w) >= 1.7`; fixes IG portrait 4:5 (1080×1350) incorrectly receiving 9:16 safe zones instead of flat 60px feed buffer
- Step 4a safe zone note — updated to reference the ratio threshold (9:16 = 1.78, IG portrait 4:5 = 1.25)

**v2.3.7** — May 07, 2026
- Step 4a safe zone table — added clarifying note: the "Top" column for 9:16 applies to logo placement only; `add_text_overlay` has no top constraint (text is always bottom)
- `add_logo` positions dict — added `# NEVER USE` comments on `bottom-right` and `bottom-left` entries (text occupies bottom zone)

**v2.3.6** — May 07, 2026
- Visual verification (Step 4h) — full rewrite: added safe zone checks per canvas type (9:16 vs feed), text alignment check, logo-always-top check, logo/text separate-zone check, adaptive color scheme check; fix table updated to match all implemented rules

**v2.3.5** — May 07, 2026
- `add_text_overlay` (Step 4d) + `add_logo` (Step 4e) — feed post safe zones: `safe_bottom_px = 60`, `safe_side_px = max(pad, 60)`, `feed_margin = max(margin, 60)` for all non-9:16 canvases; was 0/pad/margin
- Step 4a — added per-platform safe zone reference table (6 canvas types with px values and reasoning)

**v2.3.4** — May 07, 2026
- `add_text_overlay` (Step 4d) — adaptive text color: samples image brightness in the text zone before scrim is applied; dark backgrounds → white + pink `#ec4899`; light backgrounds → near-black + dark-pink `#be185d`; `ImageStat` added to PIL import
- Visual verification checklist (Step 4h) — added text color contrast check

**v2.3.3** — May 07, 2026
- Step 4a — added 9:16 safe zone reference note (top 14%, bottom 18%, sides 13%)
- `add_text_overlay` (Step 4d) — restored left/center/right `text_align` rotation (was center-only since v2.2.14); text position always bottom; safe zones enforced: bottom 18% (~346 px), sides 13% (~140 px) for 9:16 canvas
- `add_logo` (Step 4e) — logo positions now respect 9:16 safe zone margins: top 14%, bottom 18%, sides 13%; non-9:16 canvases unchanged
- Rotation table (Step 4b) restored to left/center/right `text_align` with `text_position` always bottom; quality checklist updated to match

**v2.3.1** — May 06, 2026
- Step 4c-template Step 1 — `template_list` brand parameter documented as OPTIONAL; verbose response now includes `entry_html` field (root HTML filename, e.g. `"index.html"`)
- Step 4c-template Step 5 — `template_render` call updated: `version_hash` optional pinning field added; `slots` type now accepts PNG or JPEG (was PNG-only, which bloated file sizes for Gemini photo output)

**v2.3.0** — May 06, 2026
- Step 4c-template — migrated from Playwright to gateway template_render MCP tool; no local browser required
- _copy.json shell_path now resolved via template_list then passed to template_render as template_id

**v2.2.15** — May 05, 2026
- Step 4c-template — Playwright render via stable offscreen DOM IDs (#export-cover, #export-s2…)
- Notion calendar schema gained Direction column (now 11 columns)
- Step 3b — generate structured _copy.json for template-path posts
- design-system/ MANDATORY → OPTIONAL — fallback to brand.md

**v2.2.14** — May 05, 2026
- text_align fixed to "center"; text_position alternates top/bottom by day-of-week
- Complete Pillow text overlay — textwrap, textbbox pixel measurement, gradient scrim
- Step 4h — mandatory visual verification before Zernio publish

**v2.2.10** — May 04, 2026
- Step 4c-template — renders via Playwright for IG/FB Carousel/Story when templates installed
- Step 2 reads design-system/ + detects optional templates

**v2.2.9** — April 30, 2026
- Removed pre-stored background lookup — all images now generated fresh via Gemini

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

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

> ⚠️ **Never run a bare workspace-wide `notion-search`** (e.g. searching `"SocialCalendar_"` with no `data_source_url` filter). It returns matches from every brand and other unrelated databases in the workspace, and content-generator will publish the wrong brand's content. The search MUST be scoped to the active brand's database.

**1a. Resolve the brand's database to a `collection://` URL, then search inside it:**

The available Notion MCP tools are `notion-fetch` and `notion-search`. Use this two-step pattern:

1. **Fetch the brand's DB to discover its collection URL:**
```
Use mcp__claude_ai_Notion__notion-fetch:
- id: "${BRAND}_NOTION_DB"   # the brand's DB ID from env var, e.g. FIVEBUCKS_NOTION_DB
```
Inspect the response and extract the `collection://` URL — typically returned as `data_sources[0].url` or under a `collection` field. Save it as `data_source_url`.

2. **Search inside that collection:**
```
Use mcp__claude_ai_Notion__notion-search:
- query: "SocialCalendar_"
- data_source_url: <data_source_url from step 1>
- query_type: "internal"
```

This restricts results to pages inside the brand's social calendar DB. From the results, pick the page whose title contains `SocialCalendar_` and whose date range covers today. Title format: `SocialCalendar_DDMon-DDMonYYYY` (e.g. `SocialCalendar_06Apr-11Apr2026`).

**Brand-header validation (mandatory before proceeding):** open the candidate page with `notion-fetch` and confirm the page's parent / database title matches `${BRAND}` — e.g. parent is "Fivebucks Social Media Calendar", not "NPC Office Social Media Calendar". If the brand header doesn't match, abort with a `failed` run log — do not publish content from another brand's calendar.

**Fallback (only if step 1 returns no `collection://` URL):**

If `notion-fetch` on the DB ID does not yield a usable `data_source_url`, fall back to a workspace-wide `notion-search` AND apply the brand-header validation strictly:

```
Use mcp__claude_ai_Notion__notion-search:
- query: "SocialCalendar_ ${BRAND}"   # include brand name to disambiguate
```

Filter every result by checking the page's parent database title contains the brand. Reject any result whose parent does not include the active brand. If no result passes the brand check, log `failed` and exit — never default to the first match.

**1b. Read the table from the chosen page:**

Use `mcp__claude_ai_Notion__notion-fetch` with the page ID to retrieve the page content. Locate the table block (or the page's child database, depending on how the calendar was structured) and extract its `table_row` children. If the table is nested as a child page rather than inline, fetch the child page first.

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
- `brands/{brand}/brand.md` `## Social Templates` section — when present, records the `version_hash` and slot/key counts written by brand-setup Step 4c after gateway upload. If this section exists for a template type, it means the template is uploaded to the gateway and ready for `template_render`.

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

**Safe zones by canvas type — enforced automatically by the Pillow functions in Steps 4d and 4e:**

| Canvas | Top | Bottom | Left / Right | Reason |
|---|---|---|---|---|
| 9:16 Story/Reel (1080×1920) | 14% (~269 px) | 18% (~346 px) | 13% (~140 px) | Platform UI overlays: Stories header top, Reels UI stack bottom, right-rail action buttons |
| Instagram feed square (1080×1080) | 60 px | 60 px | 60 px | No UI overlay — rendering buffer + grid thumbnail crop guard |
| Instagram feed portrait (1080×1350) | 60 px | 60 px | 60 px | No UI overlay — rendering buffer + grid thumbnail crop guard |
| Facebook feed post (1200×630) | 60 px | 60 px | 60 px | No UI overlay — rendering buffer for device/viewport variation |
| LinkedIn feed post (1200×628) | 60 px | 60 px | 60 px | No UI overlay — rendering buffer; notification card crops can clip edges |
| X/Twitter post (1200×675 or 1600×900) | 60 px | 60 px | 60 px | No UI overlay — 60 px guards against 16:9 center-crop algorithm |

For all feed formats, `(target_h / target_w) >= 1.7` is `False` (9:16 = 1.78 is the only format above the threshold; IG portrait 4:5 = 1.25 is below it), so `safe_bottom_px = 60` and `safe_side_px = max(pad, 60)` apply automatically — no extra logic needed.

> **Note:** The "Top" column in the 9:16 row (14% / ~269 px) governs **logo placement only**. Text has no top constraint — `add_text_overlay` always positions the scrim from the bottom. The top safe zone is irrelevant to text rendering.

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

`text_position` is **always "bottom"** — the 18% safe-zone offset lifts the scrim above IG/FB platform UI. `text_align` rotates left/center/right across days.

⚠️ **The day-of-week rotation table applies only on the Gemini-only image-path (Step 4c-image).** On the template-path (Step 4c-template) all text, logo, kicker numerals, and CTA chrome are produced by the React template's render — Pillow text overlay and logo overlay are both skipped, and neither `text_align` nor `logo_position` rotation has any effect on template-path posts.

### Step 4c — Choose asset type: Image or Video

Check the post `Format` from the calendar:

| Platform | Format | Asset Type | Tool |
|---|---|---|---|
| FB/IG | Carousel | Static images | If `social-carousel-template/` has an entry HTML with EDITMODE block → **Step 4c-template** (Gemini base64 → presign Zernio slots → gateway `template_render` → 6 publicUrls). Else → **Step 4c-image** (Gemini background → text overlay → logo). |
| FB/IG | Story | Static image | If `social-story-template/` has an entry HTML with EDITMODE block → **Step 4c-template** (same gateway render flow, 6 slides per direction). Else → **Step 4c-image** (publish as Story). |
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

### Step 4c-template — Render via gateway template_render (Carousel / Story)

Use this path when the applicable template folder contains an entry HTML with an `EDITMODE-BEGIN`/`EDITMODE-END` JSON block AND the brand's `## Social Templates` section in `brand.md` confirms the template is uploaded to the gateway (written by brand-setup Step 4c). Rendering is server-side — **no local Playwright required**.

**No Pillow text overlay, no Pillow logo overlay on this path.** The gateway renders the React + Babel template server-side (Vercel + Playwright) and PUTs finished slide PNGs directly to presigned Zernio URLs. The skill's jobs: Gemini visuals (base64 only, in memory) → presign Zernio slots → call template_render → receive publicUrls.

**Steps:**

#### 1. Call `template_list` to get schema (cache for the run)

```
Use gateway MCP tool template_list:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"   # OPTIONAL — omit to list all brands; pass brand to scope to this brand only
- verbose: true
```

Returns per-template entry with: `edit_keys: string[]`, `image_slots: string[]`, and `entry_html: string` (root HTML filename inside the version directory, e.g. `"index.html"`). Cache the result for the entire daily run — don't call per post.

Derive slide count from `edit_keys`:
- **Carousel**: count distinct slide-section prefixes (cover + s2…s5 + cta = 6 slides by default; let the template's structure be the truth).
- **Story**: 6 slides per direction (each direction A/B/C renders 6 frames).

**Sanity check**: confirm the Direction value from Notion matches values represented in `edit_keys`. If a mismatch, default to template defaults and log a warning.

#### 2. Generate Gemini visual(s) for each image slot

For each slot in `image_slots`, generate a Gemini image. Keep each result **in memory as base64** — do NOT upload to Zernio or anywhere else. These are render inputs only.

```
Use gateway MCP tool gemini_generate_image:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "<ImageBrief from Notion + brand visual style + 'no text, no people'>"
- aspect_ratio: "4:5"   # carousel; use "9:16" for story
- model: "gemini-3.1-flash-image-preview"
```

Decode to base64 string (hold in memory, not written to a permanent path):
```python
import glob, json, os
result_file = max(glob.glob('/sessions/*/mnt/.claude/projects/*/tool-results/mcp-*gemini_generate_image*.txt'), key=os.path.getmtime)
with open(result_file) as f:
    parsed = json.loads(json.load(f)[0]['text'])
slot_b64 = parsed['image_base64']   # in memory only
```

#### 3. Presign one Zernio upload per output slide

Run presigns immediately before the `template_render` call (presigned URLs expire; render p95 < 18 s, well within the 5-minute lifetime):

```python
upload_targets = []
for i in range(1, slide_count + 1):
    presign = late_presign_upload(
        fiveagents_api_key=API_KEY,
        filename=f"{slug}_slide-{i}_{date}.png",
        content_type="image/png",
    )
    upload_targets.append({
        "slide_index":  i,
        "upload_url":   presign["uploadUrl"],
        "content_type": "image/png",
        "public_url":   presign["publicUrl"],
    })
```

#### 4. Build the `edits` payload

Map post copy fields to the template's EDITMODE key contract. Send only keys you're overriding — gateway preserves template defaults for any missing key.

**Carousel** (read full key contract from `content-creation/SKILL.md` carousel copy contract):
```python
edits = {
    "cover_eyebrow": post.eyebrow.upper(),
    "cover_title":   post.hook,
    "cover_sub":     post.subline,
    "s2_kicker": "01", "s2_title": slide_titles[0], "s2_body": slide_bodies[0],
    "s3_kicker": "02", "s3_title": slide_titles[1], "s3_body": slide_bodies[1],
    "s4_kicker": "03", "s4_title": slide_titles[2], "s4_body": slide_bodies[2],
    "s5_kicker": "04", "s5_title": slide_titles[3], "s5_body": slide_bodies[3],
    "cta_eyebrow": post.cta_eyebrow, "cta_title": post.cta_title,
    "cta_sub": post.cta_sub, "cta_button": post.cta_button,
    "handle": brand.handle, "hashtag": post.primary_hashtag,
}
if format == "Carousel" and post.direction:
    cover_v, body_v = post.direction.split("-", 1)
    edits["coverVariant"] = cover_v   # e.g. "type" / "sticker" / "editorial"
    edits["bodyVariant"]  = body_v    # e.g. "allnumbers" / "editorial" / "mixed"
```

**Story** (map into s1_*…s6_* keys per the story EDITMODE contract; include `_direction`):
```python
edits = {
    "s1_eyebrow": ..., "s1_headline_pre": ..., "s1_headline_accent": ..., "s1_sub": ...,
    "s2_eyebrow": ..., "s2_headline": ..., "s2_pain1": ..., "s2_pain2": ..., "s2_pain3": ...,
    # ...s3_* through s6_* from _copy.json or Step 3 post copy
    "handle": brand.handle,
    "_direction": post.direction or "A",   # default to A if calendar Direction is blank
}
```

#### 5. Call `template_render`

```
Use gateway MCP tool template_render:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"
- template_type: "carousel"    # or "story"
- version_hash: "<hash>"       # OPTIONAL — pin to a specific version for reproducibility; omit to render from latest
- edits: { ... from step 4 }
- slots: { "<slot_key>": "<base64 PNG or JPEG>" }   # e.g. { "s4_visual": slot_b64 }; each slot ≤ 4 MB, total ≤ 32 MB
- upload_targets: [ ... from step 3 ]
- options: {
    "direction":    post.direction,          # story only (A/B/C)
    "coverVariant": cover_v,                 # carousel only
    "bodyVariant":  body_v                   # carousel only
  }
```

Gateway renders server-side, PUTs each slide PNG to its `upload_url`, returns:
```json
{ "images": [{ "slide_index": 1, "public_url": "https://..." }, ...] }
```

The skill never downloads or re-uploads the rendered PNGs — they live on Zernio S3 from the moment they're rendered.

**On success:** collect `public_url` values in slide order → pass as `media_items` in `late_create_post` (Step 5). **Skip Steps 4d, 4e, and 4g** — no Pillow overlays, no tmp cleanup (no tmp folder was created on this path). Day-of-week `text_align` and `logo_position` rotations apply only to Step 4c-image, not here.

**On failure (5xx / 504 timeout):**
- Log a Slack warning for this post: `"⚠️ [{brand}] template_render failed for '{topic}' — falling back to Gemini-only path. Post marked Draft Ready."`
- Fall back to **Step 4c-image** (Gemini background → Pillow text overlay → Pillow logo overlay).
- Set Notion status to `"Draft Ready"` instead of `"Published"` so the user reviews the fallback before resending.
- Do NOT retry `template_render` — render once and fall back.

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
from PIL import Image, ImageDraw, ImageFont, ImageStat
import textwrap

def add_text_overlay(input_path, output_path, headline, subline, target_w, target_h, text_align='center'):
    img = Image.open(input_path).convert('RGBA')
    # Resize + center-crop to target canvas
    r = img.width / img.height; tr = target_w / target_h
    if r > tr: nw = int(img.width * target_h / img.height); nh = target_h
    else: nw = target_w; nh = int(img.height * target_w / img.width)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw-target_w)//2, (nh-target_h)//2, (nw-target_w)//2+target_w, (nh-target_h)//2+target_h))

    pad = int(target_w * 0.06)
    # Safe zones by canvas type:
    # is_story_reel: True only for 9:16 (ratio ≥ 1.78). IG portrait 4:5 = 1.25 — feed safe zones apply there.
    # target_h > target_w is NOT sufficient: IG portrait (1080×1350) would wrongly get 9:16 safe zones.
    is_story_reel = (target_h / target_w) >= 1.7
    safe_bottom_px = int(target_h * 0.18) if is_story_reel else 60
    safe_side_px   = int(target_w * 0.13) if is_story_reel else max(pad, 60)
    hs = max(36, int(target_w * 0.048))
    ss2 = max(22, int(target_w * 0.026))
    try:
        fh = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', hs)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', ss2)
    except:
        fh = fs = ImageFont.load_default()

    # Word-wrap within horizontal safe zone (clears IG Reels right-rail action buttons)
    max_chars = max(10, int((target_w - 2 * safe_side_px) / (hs * 0.55)))
    h_lines = textwrap.wrap(headline, width=max_chars)
    s_lines = textwrap.wrap(subline, width=max_chars + 10)

    # Measure total text block height
    line_gap = int(hs * 0.3)
    block_h = len(h_lines) * (hs + line_gap) + int(hs * 0.5) + len(s_lines) * (ss2 + line_gap)

    # Scrim always at bottom, lifted above platform UI by safe_bottom_px
    scrim_h = block_h + pad * 2
    scrim_bottom = target_h - safe_bottom_px
    scrim_top = scrim_bottom - scrim_h

    # Sample the underlying image in the text zone BEFORE the scrim is applied.
    # Use the upper half of the scrim region — that's where text starts and contrast matters most.
    sample = img.convert('RGB').crop((
        safe_side_px, max(0, scrim_top),
        target_w - safe_side_px, min(target_h, scrim_top + scrim_h // 2)
    ))
    bg_brightness = ImageStat.Stat(sample.convert('L')).mean[0]
    # The gradient scrim darkens this zone to ~45% of the original brightness on average.
    # Choose text colors based on the estimated post-scrim brightness.
    if bg_brightness * 0.45 < 85:   # dark result → light text
        headline_color = (255, 255, 255, 255)   # white
        subline_color  = (236, 72, 153, 255)    # pink #ec4899
    else:                            # light result → dark text
        headline_color = (15, 15, 15, 255)      # near-black
        subline_color  = (185, 28, 96, 255)     # dark pink #be185d

    scrim = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scrim)
    for y in range(scrim_top, scrim_bottom):
        alpha = int(200 * (y - scrim_top) / (scrim_bottom - scrim_top))
        ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)
    text_y = scrim_top + pad

    def get_x(lw):
        if text_align == 'left':  return safe_side_px
        if text_align == 'right': return target_w - lw - safe_side_px
        return (target_w - lw) // 2  # center

    # Draw headline lines
    for line in h_lines:
        bbox = draw.textbbox((0, 0), line, font=fh)
        lw = bbox[2] - bbox[0]
        draw.text((get_x(lw), text_y), line, font=fh, fill=headline_color)
        text_y += hs + line_gap

    text_y += int(hs * 0.3)  # gap between headline and subline

    # Draw subline lines
    for line in s_lines:
        bbox = draw.textbbox((0, 0), line, font=fs)
        lw = bbox[2] - bbox[0]
        draw.text((get_x(lw), text_y), line, font=fs, fill=subline_color)
        text_y += ss2 + line_gap

    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

- `headline`: max 6–8 words, title case or all caps — use the post hook (NOT the topic name verbatim)
- `subline`: **always provide a subline** — never pass `""`. Use a short supporting line: brand tagline, key benefit, or CTA teaser (read from `brands/{brand}/brand.md`)
- `target_w`, `target_h`: canvas dimensions from Step 4a
- `text_align`: from day-of-week rotation (Step 4b) — `"left"`, `"center"`, or `"right"`
- Text colors are chosen adaptively: the function samples the image brightness in the text zone before the scrim, then selects white + pink `#ec4899` (dark backgrounds) or near-black + dark-pink `#be185d` (light backgrounds).
- Text position is always bottom. Save output as `_with_text.png`.

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
    # is_story_reel: True only for 9:16 (ratio ≥ 1.78). IG portrait 4:5 = 1.25 — feed safe zones apply there.
    is_story_reel = (h / w) >= 1.7
    feed_margin = max(margin, 60)
    top_y       = int(h * 0.14) if is_story_reel else feed_margin
    bottom_y    = h - logo_h - (int(h * 0.18) if is_story_reel else feed_margin)
    side_margin = int(w * 0.13) if is_story_reel else feed_margin
    positions = {
        'top-right':    (w - logo_w - side_margin, top_y),
        'top-left':     (side_margin, top_y),
        'bottom-right': (w - logo_w - side_margin, bottom_y),  # NEVER USE — text occupies the bottom zone
        'bottom-left':  (side_margin, bottom_y),               # NEVER USE — text occupies the bottom zone
    }
    x, y = positions[position]
    img.paste(logo, (x, y), logo)
    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

- Logo path: `brands/{brand}/logo.png`. Scale: 0.18. Position: always `top-right` or `top-left` (from day-of-week rotation) — **never bottom**, as text occupies the bottom zone.
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

For every `_final.png`, read the image file and visually inspect it before uploading to Zernio. Determine canvas type first: **9:16** = 1080×1920 (Story/Reel); **Feed** = all other formats.

**Text — position and safe zone:**
- [ ] Text block is at the **bottom** of the image — never at the top
- [ ] Text alignment matches the day-of-week rotation: left (Mon/Thu), center (Tue/Fri), right (Wed/Sat)
- [ ] **9:16:** bottom of text block is at least ~346 px (18%) from canvas bottom — clear of IG/FB Reels UI stack
- [ ] **9:16:** text stays within ~140 px (13%) side margins — clear of Reels right-rail action buttons
- [ ] **Feed:** text block is at least 60 px from every edge — no content touching the canvas border

**Text — legibility and color:**
- [ ] Headline is fully visible — no characters clipped at left, right, or bottom
- [ ] Subline is fully visible — not cut off
- [ ] Text color scheme is correct for the background: **dark zone** → white headline + pink `#ec4899` subline; **light zone** → near-black headline + dark-pink `#be185d` subline
- [ ] Scrim gradient provides enough contrast — text is clearly readable against the background

**Logo — position and safe zone:**
- [ ] Logo is at the **top** of the image (top-right or top-left) — **never at the bottom**
- [ ] Logo corner matches the day-of-week rotation: top-right (Mon/Wed/Fri), top-left (Tue/Thu/Sat)
- [ ] Logo and text occupy **separate vertical zones** — logo at top, text at bottom, no overlap between them
- [ ] **9:16:** logo top edge is at least ~269 px (14%) from canvas top — below IG Stories profile header
- [ ] **9:16:** logo stays within the ~140 px (13%) side margin — clear of Reels right-rail
- [ ] **Feed:** logo is at least 60 px from every edge
- [ ] Logo is fully visible — not clipped by any edge
- [ ] Logo has sufficient contrast against the background behind it
- [ ] Logo corner margin looks visually balanced — top gap ≈ side gap (logo not floating)

**Overall composition:**
- [ ] Text (bottom zone) and logo (top zone) do not overlap — they are visually separated
- [ ] The image looks intentional and on-brand — not accidental or broken

**If any check fails, fix before publishing:**

| Issue | Fix |
|---|---|
| **Text too close to bottom edge (9:16)** | Verify `safe_bottom_px = int(target_h * 0.18)` is applied; re-render |
| **Text too close to sides (9:16)** | Verify `safe_side_px = int(target_w * 0.13)` is applied; re-render |
| **Text/logo too close to edge (feed)** | Verify `safe_bottom_px = 60` and `feed_margin = max(margin, 60)` are applied; re-render |
| Wrong text alignment for the day | Check day-of-week and pass correct `text_align` (`'left'`/`'center'`/`'right'`) to `add_text_overlay`; re-render |
| Wrong text color scheme | Adjust the brightness multiplier in `add_text_overlay` (change `0.45` up/down to shift the threshold); re-render |
| Headline clipped at sides | Increase `safe_side_px` by 20 px and re-render |
| Headline cut off at bottom of scrim | Reduce `hs` by 10% and re-render |
| Subline cut off | Reduce `ss2` by 10% and re-render |
| Low text contrast (scrim too light) | Increase scrim opacity — change `200` to `230` in the gradient alpha and re-render |
| Text overlaps logo | Text is always bottom; logo is always `top-*`. If still overlapping (very long text on short canvas), reduce `hs` by 10% to shorten the text block. Never move logo to `bottom-*`. Re-render. |
| Logo at wrong position (not `top-*`) | Correct `position` to `top-right` or `top-left` per day-of-week rotation; re-render |
| Logo in same zone as text | Logo must be `top-*`; if it was placed `bottom-*`, move to `top-right` or `top-left`; re-render |
| Logo too close to top/side edge (9:16) | Verify `top_y = int(h * 0.14)` and `side_margin = int(w * 0.13)` are applied; re-render |
| Logo too close to edge (feed) | Verify `feed_margin = max(margin, 60)` is applied; re-render |
| Logo clipped at edge | Reduce `scale` by 0.02 and re-render |
| Logo visually offset (unequal margins) | Crop transparent padding: `logo = logo.crop(logo.getbbox())` before resizing; re-render |
| Logo too small to read | Increase `scale` to 0.22 and re-render |
| Logo too large / dominates image | Reduce `scale` to 0.14 and re-render |
| Logo blends into background | Add white semi-transparent backing: `bg = Image.new('RGBA', (logo_w + pad, logo_h + pad), (255,255,255,160))`, paste at `(x - pad//2, y - pad//2)` before pasting logo |
| Logo over busy image area | Switch to opposite corner (e.g. `top-right` → `top-left`) where background is calmer; re-render |

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

The current Notion connector does not expose block-level updates, so individual `table_row` cells cannot be patched directly. Use `notion-update-page` with the `update_content` command to do a targeted search-and-replace on the calendar page's markdown table — find the row's previous status text and replace with the new one.

```
Use mcp__claude_ai_Notion__notion-update-page:
- page_id: <calendar_page_id from Step 1>
- command: "update_content"
- content_updates: [
    {
      "old_str": "| <Date> | <Platform> | <Format> | <Topic> | <Persona> | <ContentAngle> | <CTA> | <Hashtags> | <ImageBrief> | <Direction> | Planned |",
      "new_str": "| <Date> | <Platform> | <Format> | <Topic> | <Persona> | <ContentAngle> | <CTA> | <Hashtags> | <ImageBrief> | <Direction> | Published |"
    }
  ]
```

- If published live → new status = `"Published"`
- If saved as draft → new status = `"Draft Ready"`

The 11 columns in the table are: `[0] Date, [1] Platform, [2] Format, [3] Topic, [4] Persona, [5] ContentAngle, [6] CTA, [7] Hashtags, [8] ImageBrief, [9] Direction, [10] Status`. The `old_str` MUST match the row exactly as it appears in the page (whitespace and pipe characters preserved); reconstruct it from the values you parsed in Step 1c. Run one `update_content` operation per published post — or batch all updates into a single call by passing multiple entries in `content_updates`.

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
- [ ] **Template-path:** `template_list(verbose=true)` called at run start; `edit_keys` and `image_slots` cached for the run (not called per-post)
- [ ] **Template-path:** Gemini visual(s) generated per `image_slots` entry, held in memory as base64 — not uploaded to Zernio or anywhere else
- [ ] **Template-path:** Zernio presigned slots created immediately before `template_render` (one per output slide)
- [ ] **Template-path:** `edits` payload maps post copy to EDITMODE key contract; Direction applied (`_direction` for story; `coverVariant`/`bodyVariant` for carousel) — template defaults preserved for missing keys
- [ ] **Template-path:** `template_render` called once; `publicUrls` from response used as `media_items` in `late_create_post`
- [ ] **Template-path:** Pillow text overlay AND logo overlay BOTH skipped — gateway render includes all chrome; Steps 4d, 4e, 4g all skipped
- [ ] **Template-path (failure):** 5xx/504 falls back to Step 4c-image; Notion status set to `"Draft Ready"` (not `"Published"`); Slack warning logged
- [ ] **Image-path (Gemini-only):** Pillow text overlay (Step 4d) AND logo overlay (Step 4e) BOTH applied — Gemini background has no logo
- [ ] **Image-path:** text overlay applied with correct day-of-week `text_align` (left Mon/Thu, center Tue/Fri, right Wed/Sat); text position always bottom
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
