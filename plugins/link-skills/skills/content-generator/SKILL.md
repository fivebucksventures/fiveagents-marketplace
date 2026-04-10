---
name: content-generator
description: Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack. Runs daily on cron schedule.
allowed-tools: Read, Grep, Glob, Bash
---

# SKILL.md — Content Generator

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

**Prefer pre-stored backgrounds from `brands/{brand}/backgrounds/`. If none are available or no good match exists, generate on-the-fly via Gemini.**

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
| Any | Post | Static image | Background (pre-stored or Gemini fallback) + text overlay + logo |
| Any | Carousel | Static images | Background (pre-stored or Gemini fallback) + text overlay + logo |
| FB/IG | Story | Static image | Background (pre-stored or Gemini fallback) + text overlay + logo (publish as Story) |
| FB/IG | Reel (Argil) | **AI avatar video** | **Argil API** (1 per brand per week, tagged by social-calendar) |
| FB/IG | Reel | **Static image as Story** | Background (pre-stored or Gemini fallback) + text overlay + logo (publish as Story) |
| LinkedIn | Reel/Story | Static image | Background (pre-stored or Gemini fallback) + text overlay + logo (publish as post) |

**Decision logic:**
1. Check the `Format` field from the Notion calendar
2. If Format = `"Reel (Argil)"` → use **Step 4c-argil** (AI avatar talking-head)
3. If Format = `"Reel"` (without Argil tag) → use **Step 4c-image** (static image, publish as Story)
4. All other formats → use **Step 4c-image** (pre-stored background + text overlay)

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

### Step 4c-image — Get background image

**Option 1 (preferred): Use pre-stored background**

List available backgrounds in `brands/{brand}/backgrounds/`. Pick the closest match by keyword to the post's Topic and ImageBrief. Examples:
- Post about invoices → `finance_dashboard_laptop.png` or `stacked_invoices_desk.png`
- Post about SEO → `seo_performance_graph.png` or `analytics_dashboard_desk.png`
- Post about customer service → `whatsapp_chat_night.png` or `automated_chat_responses.png`

**Don't reuse the same background for consecutive posts on the same platform.**

Read the chosen background, encode to base64, and pass directly to `image_add_text_overlay` in Step 4d — the gateway tool handles resize + center-crop to the target canvas automatically.

**Option 2 (fallback): Generate via Gemini**

If `brands/{brand}/backgrounds/` is empty or no good match exists for the post topic, generate a background on-the-fly:

```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: Build from: brand visual style (from brand.md), post topic, mood, and ImageBrief from the Notion calendar entry. Example: "Professional clean desk workspace with laptop showing analytics dashboard, soft natural lighting, warm tones, no text, no people, bokeh background"
- aspect_ratio: match target canvas from Step 4a (e.g. "1:1" for IG square, "9:16" for Story/Reel, "191:100" for LinkedIn)
- model: "gemini-3.1-flash-image-preview"

Tool returns JSON text: { "image_base64": "...", "mime_type": "...", "description": "..." }
Parse the JSON and extract image_base64 — pass directly to image_add_text_overlay in Step 4d.
```

Important prompt rules for generated backgrounds:
- Always include "no text, no people" — text and logo are added in Steps 4d/4e
- Match the brand's visual style and color palette from `brand.md`
- Keep it clean and uncluttered — the text overlay needs readable space at the bottom

Do NOT fall back to Python PIL. The gateway handles all image generation.

Save the generated image to `brands/{brand}/backgrounds/` for reuse by future posts.

### Step 4d — Apply text overlay

Use gateway MCP tool `image_add_text_overlay`:
- `image_base64`: base64-encoded background image — either read from file and encoded directly (pre-stored), or image_base64 parsed from gemini_generate_image JSON response (on-the-fly fallback)
- `headline`: max 6–8 words, title case or all caps — use the post hook (NOT the topic name verbatim)
- `subline`: **always provide a subline** — never pass `""`. Use a short supporting line: brand tagline, key benefit, or CTA teaser (read from `brands/{brand}/brand.md`)
- `target_w`, `target_h`: canvas dimensions from Step 4a
- `text_align`: from day-of-week rotation (Step 4b)
- `text_position`: bottom (always)

Tool returns JSON text: { "image_base64": "...", "mime_type": "..." } — parse and extract `image_base64` for Step 4e.

### Step 4e — Apply logo overlay

Use gateway MCP tool `image_add_logo`:
- `image_base64`: image_base64 parsed from image_add_text_overlay JSON response
- `logo_base64`: base64-encoded logo PNG (read `brands/{brand}/logo.png` and encode)
- `position`: from day-of-week rotation table (Step 4b)
- `scale`: 0.18 (18% of image width)

Tool returns JSON text: { "image_base64": "...", "mime_type": "..." } — parse and extract `image_base64`. Save as `_final.png`.

### Step 4f — Save final image

```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_final.png
```

**Always overwrite** — never skip existing files.

### Step 4g — Cleanup

Only `_final.png` (or `_final.mp4`) should remain in the output folder. Delete any intermediate files (`_raw.png`, `_with_text.png`) for every post before moving to Step 5.

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

2. Use `late_upload_media`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - upload_url: <uploadUrl from step 1>
   - base64_data: <base64 encoded file>
   - content_type: "image/png" (or "video/mp4")

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
- [ ] Image dimensions are correct for platform/format
- [ ] Text overlay applied with correct day-of-week text_align
- [ ] Logo at 0.18 scale with correct day-of-week logo_position
- [ ] text_position is always "bottom" — never "top"
- [ ] Both text overlay and logo overlay applied (never skip either)
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
