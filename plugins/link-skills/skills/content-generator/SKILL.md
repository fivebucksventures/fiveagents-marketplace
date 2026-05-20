---
name: content-generator
description: Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack. Runs daily on cron schedule.
allowed-tools: Read, Grep, Glob, Bash
area: Marketing
use_for: "Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack"
deps:
  mcp: ["Notion", "Slack"]
  gateway: ["Gemini", "Argil", "Zernio", "fivebucks (opt — fb.ai templates; falls back to Gemini + Pillow)"]
  files: ["brand.md", "audience.md", "product.md", "design-system/ (opt — local; or fb.ai brand kit via fivebucks_get_brand_kit; brand.md fallback)"]
  env: ["`${BRAND}_NOTION_DB`", "`${BRAND}_LATE_FB/IG/LI`"]
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.8.0 | May 20, 2026 |

**Description:** Daily automated content production — generate copy and images from Notion Social Calendar, publish to Zernio API, update Notion, notify Slack

### Change Log

**v2.8.0** — May 20, 2026
- Brand palette resolution for the Gemini image-path is now a **3-tier lookup**: fb.ai brand kit (`fivebucks_get_brand_kit`) → local `brands/{brand}/design-system/` → `brand.md`, per the Brand kit field map in `agents/link.md`. Trimmed the duplicated design-system reading boilerplate (now centralized in link.md tier 2).

**v2.7.0** — May 20, 2026
- **Render pipeline migrated to fb.ai (`fivebucks_*` gateway tools).** The old `template_list` / `template_render` flow (Gemini base64 → presign Zernio slots → server-side render) is gone — it targeted a gateway API that no longer exists. Step 4c-template now: `fivebucks_list_templates` (cache) → read manifest → `fivebucks_create_post` (copy + direction + optional `media:{fileId}` photos) → `fivebucks_render_post` → 1-hour signed PNG URLs → re-host on Zernio (`late_presign_upload`) → `late_create_post`. Templates live on fb.ai (uploaded via the dashboard in brand-setup Step 4c), discovered by `type` (meta-carousel | meta-story | linkedin-post | meta-post) — no local `social-meta-*-template/` folders.
- **All four template types are template-path now.** Added IG/FB single-image (`meta-post`) and LinkedIn single-image (`linkedin-post`) routing. meta-story uses `_direction` (A/B/C, default A — never `all`); single-image types use the un-prefixed `direction`.
- Requires the brand's fb.ai key (`FIVEBUCKS_API_KEY`, vault service `fivebucks`) — see brand-setup Step 7.

**v2.5.4** — May 16, 2026
- Change log history trimmed — housekeeping pass to keep file-level history compact. No functional change.

**v2.4.8 – v2.5.3** — May 2026 (image-path tuning, condensed)
- Step 4c-image Pillow overlay hardening: per-canvas named insets (`top/bottom/side_inset`, `scrim_fade`); 9:16 uses Meta safe zones (14%/13%/13%), feed uses asymmetric insets (top/bottom `pad // 2`, **sides `pad + pad // 2`** to survive IG's profile-grid 4:5 recrop — do not re-align feed text sides to `pad // 2`); `text_position` top/bottom rotation with scrim following the text; brand palette injected into the Gemini prompt as ambient mood (never hardcode HEX from memory); Story/Reel full-frame guard.

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
- **Brand visual identity for the Gemini-only image-path** — resolve the color/font source in this 3-tier order, feeding the Gemini prompt aesthetic:
  1. **fb.ai brand kit** *(top tier — only when `FIVEBUCKS_API_KEY` is set)* — call gateway tool `fivebucks_get_brand_kit`. If it returns non-null, use its color tokens (HEX) + typography as the authoritative source — resolve fields via the Brand kit field map in `agents/link.md` (secondary→`tokens.colors.accent`, text→`tokens.colors.dark`, fonts from `tokens.fonts.heading`/`body`; the kit has no separate `secondary` or font weight scale). Returns null when no kit is uploaded — fall through to tier 2.
  2. **brands/{brand}/design-system/** *(local folder — when the fb.ai kit is null or `FIVEBUCKS_API_KEY` is unset; the free baseline)* — Claude Design visual system (colors, fonts, components, spacing). When present, informs the Gemini-only image-path's prompt aesthetic.
  3. **brands/{brand}/brand.md** — the Colors and Voice & Tone sections plus the Google Font names captured in brand-setup Step 4. Universal fallback when neither of the above is available.
- **Social templates on fb.ai** — the brand's Claude-designed social templates live on fb.ai (uploaded via the dashboard in brand-setup Step 4c), **not on disk**. Discover them with the gateway tool `fivebucks_list_templates` (needs the brand's fb.ai key in the vault under service `fivebucks` — `FIVEBUCKS_API_KEY`). Each entry has an `id`, a `type` (`meta-carousel` | `meta-story` | `linkedin-post` | `meta-post`), `dimensions`, and a `manifest` (editable fields + image slots + slide IDs). Used by Step 4c-template; **cache the list for the whole run** (don't call per post).

If no matching fb.ai template exists for the post's format, fall back to the Gemini-only path (Step 4c-image) — sourcing colors/fonts via the same 3-tier order (fb.ai brand kit when the key is set → local `design-system/` → brand.md colors/voice). Never log a `failed` run for missing visual assets.

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

For posts that will render via the template-path (a matching fb.ai template exists for the post's format — see Step 4c), produce a structured copy artifact alongside `_copy.md`:

```
outputs/{brand}/posts/[Platform]/[TopicSlug]_[DDMonYYYY]_copy.json
```

The JSON's keys MUST match the template's **fb.ai manifest field keys** (`fivebucks_get_template` → `manifest.fields[].key`) — the canonical key set + per-key character budgets per type are documented in `content-creation/SKILL.md` ("template copy contracts"). Read those budgets before writing.

Map the post's hook/body/CTA (from Step 3) into the template's structure per type:

- **meta-carousel** (6 slides): Cover (`cover_eyebrow` + `cover_title` + `cover_sub`) → 4 sign slides (`s2_kicker`/`s2_title`/`s2_body` through `s5_*`, optional `s2_pullquote`, `s3_stat_value`/`s3_stat_label`, `s5_before`/`s5_after`) → CTA (`cta_eyebrow` + `cta_title` + `cta_sub` + `cta_button`).
- **meta-story** (6 slides): Hook (`s1_*`) → Problem (`s2_*` — eyebrow + headline + 3 pain bullets) → Solution (`s3_*`) → Proof (`s4_*` — 4 stats + quote + author) → Offer (`s5_*` — 4 bullets + pill) → CTA (`s6_*`). Set `_direction` (A/B/C).
- **linkedin-post** (1 slide): `eyebrow` + `headline` + `body` + `stat_value`/`stat_label` + `quote`/`attribution` + `cta_text` + `cta_button`. Set `direction` (A/B/C).
- **meta-post** (1 slide): `eyebrow` + `headline` + `body` + `quote`/`attribution` + `b1`…`b5` + `cta_text` + `cta_button`. Set `direction` (A/B/C).

If the post brief is too thin to fill all required keys, omit those keys — fb.ai seeds the template's defaults for any key you don't send — and log a warning to memory.

**Skip Step 3b for non-template posts** — Reel(Argil) and any post where no matching fb.ai template exists. For those, only `_copy.md` is required; content-generator's image-path uses the headline + body from `_copy.md` directly via Pillow text overlay.

---

## Step 4 — Generate images

**Two image-production paths depending on Format and template availability — see Step 4c for the dispatcher.**
- **Template-path** (Carousel / Story / Reel / single-image Post on IG/FB/LinkedIn when a matching fb.ai template exists): fb.ai renders the slides server-side via `fivebucks_render_post`; no Gemini call, no Pillow overlay.
- **Image-path** (any post with no matching fb.ai template, or when the fb.ai render fails / quota is exhausted): Gemini generates the background fresh + Pillow stamps text and logo. Universal fallback — always available.

### Step 4a — Determine canvas dimensions

> **Template-path posts skip this step** — fb.ai renders each template at its own registered dimensions (e.g. 1080×1350 for 4:5 types, 1080×1920 for meta-story). The table below applies only to the **image-path** (Step 4c-image).

| Format | target_w | target_h |
|--------|----------|----------|
| LinkedIn Post | 1200 | 628 |
| Facebook Post | 1200 | 630 |
| Instagram Post (square) | 1080 | 1080 |
| Instagram Post (portrait) | 1080 | 1350 |
| Instagram Reel / Facebook Reel | 1080 | 1920 |
| Instagram Story / Facebook Story | 1080 | 1920 |

**Per-canvas insets — Story/Reel uses Meta safe zones only; Feed text uses asymmetric pad-derived values (larger sides); Feed logo uses uniform `pad // 2`.**

`pad = int(target_w * 0.06)` (~6% of canvas width). On 9:16 text and logo use the same Meta safe zones. On feed they diverge on **sides only** — text needs extra side clearance to survive IG profile-grid 4:5 recrop (~34 px side trim).

| Canvas | Element | Top | Bottom | Sides | Scrim fade |
|---|---|---|---|---|---|
| 9:16 Story/Reel (1080×1920) | text + logo | `int(target_h * 0.14)` (~269 px) | `int(target_h * 0.13)` (~250 px) | `int(target_w * 0.13)` (~140 px) | `0` |
| All feed formats (IG, FB, LinkedIn, X) | **text** | `pad // 2` (~32–36 px) | `pad // 2` | **`pad + pad // 2` (~96–108 px)** | `pad // 2` |
| All feed formats (IG, FB, LinkedIn, X) | logo | `pad // 2` | `pad // 2` | `pad // 2` | n/a |

**Annotations:**
- **Story/Reel (9:16) — Meta safe zones only.** Top 14% clears the Stories profile header; bottom 13% clears the Reels UI stack; sides 13% clear the Reels right-rail action buttons. `scrim_fade = 0` keeps the gradient flush to the safe-zone boundary with no transition padding (no `pad` anywhere in 9:16 geometry).
- **Feed text — asymmetric.** Top, bottom, and scrim_fade all `pad // 2` (~32–36 px). Sides `pad + pad // 2` (~96–108 px) — Instagram's profile-grid view recrops square feed posts to 4:5 portrait, trimming ~34 px per side; the extra side inset guarantees text survives that crop with visible breathing room. **Do not "simplify" feed text back to uniform `pad // 2`** — that regressed v2.4.8 hardening (see v2.5.2 changelog).
- **Feed logo — uniform `pad // 2`.** All four sides ~32–36 px. Logo is small relative to canvas, so the IG profile-grid crop doesn't impact it the way it impacts text; uniform pad-derived inset reads as intentional corner placement.
- **Gradient scrim direction depends on `text_position`.** Bottom-anchored text → scrim runs `scrim_top → target_h` (alpha 0→230, dark zone at bottom). Top-anchored text → scrim runs `0 → text_bottom + scrim_fade` (alpha 230→0, dark zone at top). The dark zone is always on the same end as the text.

### Step 4b — Day-of-week layout rotation

Determine the day-of-week for the post date, then apply:

| Day | text_align | text_position | logo_position |
|-----|------------|---------------|---------------|
| Mon | left | bottom | top-right |
| Tue | center | top | bottom-left |
| Wed | right | bottom | top-right |
| Thu | left | top | bottom-left |
| Fri | center | bottom | top-right |
| Sat | right | top | bottom-left |

**Text and logo are always on opposite vertical ends** — never on the same row. Mon/Wed/Fri = bottom text + top-right logo; Tue/Thu/Sat = top text + bottom-left logo. `text_align` cycles left → center → right across days.

⚠️ **The day-of-week rotation table applies only on the Gemini-only image-path (Step 4c-image).** On the template-path (Step 4c-template) all text, logo, kicker numerals, and CTA chrome are produced by the React template's render — Pillow text overlay and logo overlay are both skipped, and neither `text_align` nor `logo_position` rotation has any effect on template-path posts.

### Step 4c — Choose asset type: Image or Video

Check the post `Format` from the calendar. "A `<type>` template exists" means the cached `fivebucks_list_templates` result (Step 4c-template, step 1) includes an entry with that `type`.

| Platform | Format | Asset Type | Tool |
|---|---|---|---|
| FB/IG | Carousel | Static images | If a `meta-carousel` template exists on fb.ai → **Step 4c-template**. Else → **Step 4c-image** (Gemini background → text overlay → logo). |
| FB/IG | Story | Static image | If a `meta-story` template exists → **Step 4c-template**. Else → **Step 4c-image** (publish as Story). |
| FB/IG | Reel (Argil) | **AI avatar video** | **Argil API** (1 per brand per week, tagged by social-calendar) |
| FB/IG | Reel | **Static image as Story** | If a `meta-story` template exists → **Step 4c-template**. Else → **Step 4c-image** (publish as Story). |
| FB/IG | Post (single image) | Static image | If a `meta-post` template exists → **Step 4c-template**. Else → **Step 4c-image**. |
| LinkedIn | Post | Static image | If a `linkedin-post` template exists → **Step 4c-template**. Else → **Step 4c-image**. |
| LinkedIn | Reel/Story | Static image | **Step 4c-image** (publish as post) |
| Any | Post | Static image | **Step 4c-image** (no matching template) |

**Decision logic:**
1. Check the `Format` field from the Notion calendar.
2. If Format = `"Reel (Argil)"` → use **Step 4c-argil** (AI avatar talking-head).
3. If Format = `"Carousel"` AND platform ∈ {Instagram, Facebook} AND a `meta-carousel` template exists → use **Step 4c-template**.
4. If Format ∈ {`"Story"`, `"Reel"`} AND platform ∈ {Instagram, Facebook} AND a `meta-story` template exists → use **Step 4c-template**.
5. If Format = `"Post"` AND platform ∈ {Instagram, Facebook} AND a `meta-post` template exists → use **Step 4c-template**.
6. If Format = `"Post"` AND platform = LinkedIn AND a `linkedin-post` template exists → use **Step 4c-template**.
7. If Format = `"Reel"` (no template, no Argil tag) → use **Step 4c-image** (static image, publish as Story).
8. All other formats (or no matching template) → use **Step 4c-image** (Gemini-generated background + text overlay + logo).

### Step 4c-template — Render via fb.ai (`fivebucks_*`)

Use this path when a matching fb.ai template exists for the post's format (see Step 4c). Rendering is server-side on fb.ai — **no local Playwright, no Gemini-for-slots, no Zernio slot presign**. Templates render their own images and tint overlay natively; the skill just supplies copy (and optionally photos) and collects rendered PNGs.

**No Pillow text overlay, no Pillow logo overlay on this path.** The skill's jobs: pick the template by `type` → build copy `overrides` → create a post → render → re-host the PNGs on Zernio for publishing.

Requires the brand's fb.ai key in the vault under service `fivebucks` (`FIVEBUCKS_API_KEY`, brand-setup Step 7). Each render consumes **1.0 CONTENT_GENERATION quota** on fb.ai regardless of slide count.

**Steps:**

#### 1. List templates (cache for the run)

```
Use gateway MCP tool fivebucks_list_templates:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
```

Returns an array of templates, each with `id`, `name`, `type` (`meta-carousel` | `meta-story` | `linkedin-post` | `meta-post`), `dimensions`, and `manifest`. Build a `type → {id, manifest}` map and **cache it for the entire daily run** — don't call per post. If no template of the type this post needs exists, fall back to **Step 4c-image**.

#### 2. Read the manifest

From the cached entry (or `fivebucks_get_template` for the freshest copy) read:
- `manifest.fields[]` — each `{ key, label, group, type, default, bound?, options? }`. **Skip** fields with `bound === false` (hardcoded — editing has no effect). For `type: 'select'` fields, send only a value from `options`. For `type: 'image'` slots, the value is `""` or `"media:{fileId}"`, with companion `{slot}_image_position` / `{slot}_image_fit` selects.
- `manifest.slides[]` — slide IDs. The render returns one PNG per slide, in slide order.
- `manifest.theme` — informational (the template bakes its own overlay: `dark` = 40% black, `light` = 50% white). Use it to pick photos that contrast.

#### 3. Build the `overrides` payload (copy → manifest field keys)

Flat key→value map. Send only fields you're changing; fb.ai seeds defaults for the rest. Use the per-type key sets in `content-creation/SKILL.md` (or the Step 3b `_copy.json`). Set direction:
- **meta-story**: `_direction` = `"A"` / `"B"` / `"C"` (default `"A"` — renders 6 slides). **Never `"all"`** (renders 18 slides and burns the same 1.0 quota at once).
- **linkedin-post / meta-post**: the un-prefixed `direction` = `"A"` / `"B"` / `"C"` (picks the single slide's layout).
- **meta-carousel**: `coverVariant` / `bodyVariant` from the post's Direction field (e.g. `"type-allnumbers"` → `coverVariant="type"`, `bodyVariant="allnumbers"`) if the manifest exposes them.

#### 4. (Optional) Assign photos

By default, **leave image slots empty** — the template renders its own branded placeholder/gradient (on-brand, zero extra cost). To inject a real photo:
- Upload to the fb.ai media library: `fivebucks_presign_media_upload` (folder_id, filename) → `requests.put(uploadUrl, bytes)` → `fivebucks_confirm_media_upload` (file_id, folder_id, size_bytes, mime_type) → use the returned id.
- Add to overrides: `{ "s4_image": "media:{id}", "s4_image_position": "center", "s4_image_fit": "cover" }` (meta-carousel/meta-story body slots `s2_image`…`s5_image`; single-image types `bg_image` + optional `headshot_image`).

(Or pick an existing photo with `fivebucks_list_media_folders` → `fivebucks_list_media_files`. For automated daily runs without curated photos, skip this step.)

#### 5. Create the post

```
Use gateway MCP tool fivebucks_create_post:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- template_id: "<id from step 1>"
- name: "[Brand] [Platform] [Format] — [Topic] — [Date]"
- overrides: { ...copy + direction (+ image slots from step 4)... }
→ Returns the new post id
```

To adjust copy or add photos after creating, call `fivebucks_update_post` (post_id, overrides) — overrides merge.

#### 6. Render

```
Use gateway MCP tool fivebucks_render_post:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- post_id: "<id from step 5>"
- slide_ids: [ ... ]   # OPTIONAL — omit to render every slide
→ Returns 1-hour signed PNG URLs, one per slide, in slide order
```

For meta-story the slide count follows `_direction` (A/B/C = 6, all = 18). fb.ai resolves any `"media:{fileId}"` overrides server-side and the template renders the photo natively — nothing else to wire.

#### 7. Re-host on Zernio, then publish

The fb.ai signed URLs are short-lived (1 h), so re-host each PNG on Zernio before publishing:
```python
import requests
media_urls = []
for i, signed_url in enumerate(render_urls, start=1):
    img = requests.get(signed_url).content
    presign = late_presign_upload(
        fiveagents_api_key=API_KEY,
        filename=f"{slug}_slide-{i}_{date}.png",
        content_type="image/png",
    )
    requests.put(presign["uploadUrl"], data=img, headers={"Content-Type": "image/png"})
    media_urls.append(presign["publicUrl"])
```

Pass `media_urls` (in slide order) as `media_items` in `late_create_post` (Step 5) — a carousel becomes multiple `media_items`; single-image types are one. **Skip Steps 4d, 4e, 4f, 4g** — no Pillow overlays, no local tmp files. Day-of-week `text_align` / `logo_position` rotations apply only to Step 4c-image.

**On quota / subscription error** (`fivebucks_render_post` returns 402/403 with a quota body): surface the upgrade message in the Slack notification, set the Notion status to `"Draft Ready"`, and fall back to **Step 4c-image** for this post.

**On other failure (5xx / timeout):**
- Log a Slack warning for this post: `"⚠️ [{brand}] fb.ai render failed for '{topic}' — falling back to Gemini-only path. Post marked Draft Ready."`
- Fall back to **Step 4c-image** (Gemini background → Pillow text overlay → Pillow logo overlay).
- Set Notion status to `"Draft Ready"` instead of `"Published"` so the user reviews the fallback before resending.
- Do NOT retry the render — render once and fall back.

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

**Story/Reel full-frame guard (defensive — belt-and-suspenders):**

Before building the Gemini prompt, check whether the post is a Story or Reel and whether the `image_brief` already contains the full-frame composition instruction written by `social-calendar` v2.5.0+. If it does not (e.g. the calendar was authored by an older run), wrap it now:

```python
STORY_FULLFRAME_TEMPLATE = (
    "Photorealistic, full-bleed vertical portrait image for a 9:16 social media Story. "
    "{SCENE_DESCRIPTION}. The scene fills the ENTIRE frame from top to bottom — no empty areas, "
    "no plain backgrounds, no flat colour zones anywhere in the image. Rich environmental detail "
    "in the upper, middle, AND lower thirds of the frame. Cinematic lighting, editorial quality. "
    "Shot as if for a magazine cover in portrait orientation. "
    "Do not include any text, logos, or UI elements."
)

if post.format.lower() in ("story", "reel") \
        and "fills the ENTIRE frame" not in post.image_brief:
    image_brief = STORY_FULLFRAME_TEMPLATE.format(SCENE_DESCRIPTION=post.image_brief)
else:
    image_brief = post.image_brief
# Reel (Argil) → guard does NOT apply; Argil uses a video script, not image_brief
```

Use `image_brief` (the potentially-wrapped version) as the Gemini prompt base from this point on — never `post.image_brief` directly.

Generate a fresh image for every post using Gemini:

```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: Build from: brand visual style (from brand.md), post topic, mood, and image_brief (the wrapped version from the guard above). Example: "Professional clean desk workspace with laptop showing analytics dashboard, soft natural lighting, warm tones, no text, no people, bokeh background"
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
- Match the brand's visual style and color palette — **3-tier read order: (1) fb.ai brand kit via `fivebucks_get_brand_kit` when `FIVEBUCKS_API_KEY` is set; (2) `brands/{brand}/design-system/` when the kit is null or the key is unset; (3) `brands/{brand}/brand.md` Colors section as the universal fallback.** Extract the primary/accent/background HEX tokens from whichever source applied and inject them into the prompt as "warm tones around #ec4899 / muted slate around #0f172a" style guidance — when the fb.ai kit is the source, resolve roles via the Brand kit field map in `agents/link.md` (secondary→`tokens.colors.accent`, text→`tokens.colors.dark`; the kit has no separate `secondary` token). Same Visual consistency rule as `agents/link.md` — never hardcode from memory.
- Pillow text rendering in Step 4d uses `DejaVuSans-Bold` as a stable cross-platform rasterizer; the brand font names (fb.ai brand kit / design-system files) are for reference only (Canva / HTML mockups consume them, this image path does not). Colors on text are picked adaptively from the Gemini background, which is why getting the brand palette into the Gemini prompt at this step matters.
- Keep it clean and uncluttered — the text overlay needs readable space at the top or bottom (per the day-of-week `text_position` from Step 4b)

### Step 4d — Apply text overlay — USE PILLOW

Use Python Pillow to add gradient scrim + headline + subline. Do NOT use `image_add_text_overlay` gateway MCP tool.

```python
from PIL import Image, ImageDraw, ImageFont, ImageStat

def add_text_overlay(input_path, output_path, headline, subline, target_w, target_h,
                     text_align='center', text_position='bottom'):
    img = Image.open(input_path).convert('RGBA')
    # Resize + center-crop to target canvas
    r = img.width / img.height; tr = target_w / target_h
    if r > tr: nw = int(img.width * target_h / img.height); nh = target_h
    else: nw = target_w; nh = int(img.height * target_w / img.width)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw-target_w)//2, (nh-target_h)//2, (nw-target_w)//2+target_w, (nh-target_h)//2+target_h))

    pad = int(target_w * 0.06)
    # Per-canvas insets — Story/Reel uses Meta safe zones only; Feed uses pad-derived only.
    # is_story_reel: True only for 9:16 (ratio ≥ 1.78). IG portrait 4:5 = 1.25 → feed treatment.
    # target_h > target_w is NOT sufficient: IG portrait (1080×1350) would wrongly get 9:16 safe zones.
    is_story_reel = (target_h / target_w) >= 1.7
    if is_story_reel:
        # Meta-spec safe zones (matches "central 1080x1420 of 1080x1920" rule)
        top_inset    = int(target_h * 0.14)   # Stories profile header clearance
        bottom_inset = int(target_h * 0.13)   # Reels UI stack clearance
        side_inset   = int(target_w * 0.13)   # Reels right-rail clearance
        scrim_fade   = 0                       # no extra pad transition past text edge
    else:
        # Feed — asymmetric: top/bottom/scrim_fade = pad // 2; sides = pad + pad // 2.
        # Sides need extra room: IG profile-grid view recrops square feed posts to 4:5,
        # trimming ~34 px per side. pad // 2 (~32 px) gets entirely consumed by that crop.
        # Logo (add_logo) stays at uniform pad // 2 — text and logo diverge on sides by design.
        # Do NOT "simplify" sides back to pad // 2 — that regressed v2.4.8 hardening (see v2.5.2).
        top_inset    = pad // 2
        bottom_inset = pad // 2
        side_inset   = pad + pad // 2          # ~9% of width; survives IG profile-grid crop
        scrim_fade   = pad // 2               # gradient transition past the text edge

    hs = max(36, int(target_w * 0.048))
    ss2 = max(22, int(target_w * 0.026))
    try:
        fh = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', hs)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', ss2)
    except:
        fh = fs = ImageFont.load_default()

    # Pixel-width-aware wrapping — no character-count heuristic.
    # Uses a throwaway draw context for measurement; avail_w is exact canvas space.
    _tmp = Image.new('RGBA', (target_w, target_h))
    draw_tmp = ImageDraw.Draw(_tmp)
    avail_w = target_w - 2 * side_inset

    def wrap_to_fit(text, font, max_w, draw):
        """Wrap text word-by-word so no rendered line exceeds max_w pixels."""
        words = text.split()
        lines = []
        current = ""
        for word in words:
            test = (current + " " + word).strip()
            if draw.textbbox((0, 0), test, font=font)[2] <= max_w:
                current = test
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines or [text]

    h_lines = wrap_to_fit(headline, fh, avail_w, draw_tmp)
    s_lines = wrap_to_fit(subline,  fs, avail_w, draw_tmp)

    # Measure total text block height
    line_gap = int(hs * 0.3)
    block_h = len(h_lines) * (hs + line_gap) + int(hs * 0.5) + len(s_lines) * (ss2 + line_gap)

    # Anchor text + scrim based on text_position. Scrim runs from the canvas edge (on text side)
    # past the text by `scrim_fade`, so the gradient fades into the un-darkened image.
    if text_position == 'bottom':
        text_bottom  = target_h - bottom_inset
        text_y       = text_bottom - block_h
        scrim_top    = text_y - scrim_fade
        scrim_bottom = target_h
    else:  # 'top'
        text_y       = top_inset
        text_bottom  = text_y + block_h
        scrim_top    = 0
        scrim_bottom = text_bottom + scrim_fade

    # Geometric invariants — crash loudly on regression instead of shipping a silently-wrong image.
    assert text_y >= 0, \
        f"text overflows canvas top — block_h={block_h} too large for available space; reduce headline/subline length or font size"
    assert text_bottom <= target_h, \
        f"text overflows canvas bottom — block_h={block_h} too large for available space; reduce headline/subline length or font size"
    if text_position == 'bottom':
        assert text_y + block_h == target_h - bottom_inset, \
            f"text bottom must equal target_h - bottom_inset (got {text_y + block_h}, expected {target_h - bottom_inset})"
        assert scrim_top + scrim_fade == text_y, \
            f"scrim must have exactly `scrim_fade` above text (scrim_top={scrim_top}, text_y={text_y}, scrim_fade={scrim_fade})"
        assert scrim_bottom == target_h, \
            f"gradient must run to canvas bottom for bottom-anchored text (scrim_bottom={scrim_bottom}, target_h={target_h})"
    else:  # 'top'
        assert text_y == top_inset, \
            f"text top must equal top_inset (got text_y={text_y}, expected {top_inset})"
        assert scrim_top == 0, \
            f"gradient must start at canvas top for top-anchored text (scrim_top={scrim_top})"
        assert scrim_bottom - scrim_fade == text_bottom, \
            f"scrim must have exactly `scrim_fade` below text (scrim_bottom={scrim_bottom}, text_bottom={text_bottom}, scrim_fade={scrim_fade})"

    # Sample the underlying image in the actual text zone BEFORE the scrim is applied.
    sample = img.convert('RGB').crop((
        side_inset, max(0, text_y),
        target_w - side_inset, min(target_h, text_bottom)
    ))
    bg_brightness = ImageStat.Stat(sample.convert('L')).mean[0]
    # The heavier scrim (max alpha 230/255) darkens this zone to ~40% of the original brightness on average.
    # Choose text colors based on the estimated post-scrim brightness.
    if bg_brightness * 0.40 < 85:   # dark result → light text
        headline_color = (255, 255, 255, 255)   # white
        subline_color  = (236, 72, 153, 255)    # pink #ec4899
    else:                            # light result → dark text
        headline_color = (15, 15, 15, 255)      # near-black
        subline_color  = (185, 28, 96, 255)     # dark pink #be185d

    # Gradient direction depends on which end the text is on:
    #   text at bottom → alpha 0 at scrim_top, 230 at scrim_bottom (dark zone is bottom)
    #   text at top    → alpha 230 at scrim_top, 0 at scrim_bottom (dark zone is top)
    scrim = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scrim)
    span = max(1, scrim_bottom - scrim_top)
    for y in range(scrim_top, scrim_bottom):
        if text_position == 'bottom':
            alpha = int(230 * (y - scrim_top) / span)
        else:  # top
            alpha = int(230 * (scrim_bottom - y) / span)
        ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)

    def get_x(lw):
        if text_align == 'left':  return side_inset
        if text_align == 'right': return target_w - lw - side_inset
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
- `text_position`: from day-of-week rotation (Step 4b) — `"bottom"` (Mon/Wed/Fri) or `"top"` (Tue/Thu/Sat). Must match the day's row in the rotation table; logo is always placed on the opposite end (Step 4e).
- Text colors are chosen adaptively: the function samples the image brightness in the text zone before the scrim, then selects white + pink `#ec4899` (dark backgrounds) or near-black + dark-pink `#be185d` (light backgrounds).
- Save output as `_with_text.png`.

### Step 4e — Apply logo overlay — USE PILLOW

Use Python Pillow to composite the logo. Do NOT use `image_add_logo` gateway MCP tool.

```python
from PIL import Image

def add_logo(image_path, output_path, logo_path, position='top-right', scale=0.18):
    img = Image.open(image_path).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')
    logo = logo.crop(logo.getbbox())                # strip transparent padding BEFORE dimension calc
    cropped_w, cropped_h = logo.size                # capture for aspect-ratio assertion
    assert cropped_w > 0 and cropped_h > 0, \
        f"cropped logo has zero dimension ({cropped_w}x{cropped_h}); check logo file integrity"
    w, h = img.size
    logo_w = int(w * scale)
    logo_h = int(logo.height * logo_w / logo.width)  # aspect ratio preserved from cropped logo
    # Geometric invariant — fail loudly if anyone reorders the crop/resize and distorts the mark.
    assert abs((logo_w / logo_h) - (cropped_w / cropped_h)) / (cropped_w / cropped_h) < 0.01, \
        f"logo resize distorts aspect ratio — logo.crop(getbbox()) must run BEFORE logo_w/logo_h " \
        f"(cropped {cropped_w}/{cropped_h}={cropped_w/cropped_h:.3f}, resize {logo_w}/{logo_h}={logo_w/logo_h:.3f})"
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    # Per-canvas logo insets — Story/Reel uses Meta safe zones; Feed uses uniform pad // 2.
    # Logo can sit at top OR bottom (selected by `position`); insets defined for both ends.
    pad = int(w * 0.06)                 # matches definition in add_text_overlay
    is_story_reel = (h / w) >= 1.7
    if is_story_reel:
        top_inset    = int(h * 0.14)   # Stories profile header clearance
        bottom_inset = int(h * 0.13)   # Reels UI stack clearance
        side_inset   = int(w * 0.13)   # Reels right-rail clearance
    else:
        top_inset    = pad // 2
        bottom_inset = pad // 2
        side_inset   = pad // 2
    top_y    = top_inset
    bottom_y = h - logo_h - bottom_inset
    positions = {
        'top-right':    (w - logo_w - side_inset, top_y),
        'top-left':     (side_inset, top_y),
        'bottom-right': (w - logo_w - side_inset, bottom_y),
        'bottom-left':  (side_inset, bottom_y),
    }
    x, y = positions[position]
    img.paste(logo, (x, y), logo)
    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

- Logo path: `brands/{brand}/logo.png`. Scale: 0.18.
- `position`: from day-of-week rotation (Step 4b) — `"top-right"` (Mon/Wed/Fri, paired with bottom text) or `"bottom-left"` (Tue/Thu/Sat, paired with top text). Logo and text always occupy opposite vertical ends; never both top or both bottom.
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

**Text — position and inset (9:16 = Meta safe zones; feed = asymmetric pad-derived — larger sides):**
- [ ] Text block is at the **top OR bottom** matching `text_position` from Step 4b — never both ends, never mid-canvas
- [ ] Text alignment matches the day-of-week rotation: left (Mon/Thu), center (Tue/Fri), right (Wed/Sat)
- [ ] **9:16 (text at bottom — Mon/Wed/Fri):** bottom of text block is ~250 px (13%) from canvas bottom — clears Reels UI stack
- [ ] **9:16 (text at top — Tue/Thu/Sat):** top of text block is ~269 px (14%) from canvas top — clears Stories profile header
- [ ] **9:16:** text stays within ~140 px (13%) side margins — clears Reels right-rail
- [ ] **Feed:** text has `pad // 2` (~32–36 px) inset on top + bottom, and `pad + pad // 2` (~96–108 px) inset on sides — sides intentionally larger to survive IG profile-grid 4:5 recrop (~34 px side trim)
- [ ] **Gradient scrim reaches the canvas edge on the text side** — bottom-anchored text → scrim hits `target_h`; top-anchored text → scrim starts at y=0

**Text — legibility and color:**
- [ ] Headline is fully visible — no characters clipped at left, right, or bottom
- [ ] Subline is fully visible — not cut off
- [ ] Text color scheme is correct for the background: **dark zone** → white headline + pink `#ec4899` subline; **light zone** → near-black headline + dark-pink `#be185d` subline
- [ ] Scrim gradient provides enough contrast — text is clearly readable against the background

**Logo — position (always opposite end from text):**
- [ ] Logo position matches the day-of-week rotation: top-right (Mon/Wed/Fri, paired with bottom text); bottom-left (Tue/Thu/Sat, paired with top text)
- [ ] Logo and text occupy **separate vertical ends** — never both top, never both bottom
- [ ] **9:16:** logo top = `int(h * 0.14)` (~269 px), logo bottom = `h - logo_h - int(h * 0.13)` (~250 px from bottom), logo sides = `int(w * 0.13)` (~140 px) — Meta safe zones
- [ ] **Feed:** logo top + bottom + side = `pad // 2` (~32–36 px) — uniform pad-derived margin
- [ ] Logo is fully visible — not clipped by any edge
- [ ] Logo has sufficient contrast against the background behind it
- [ ] Logo corner margin looks visually balanced — top/bottom gap ≈ side gap

**Overall composition:**
- [ ] Text and logo occupy opposite vertical ends per the day-of-week rotation — they do not overlap and are visually separated
- [ ] The image looks intentional and on-brand — not accidental or broken

**If any check fails, fix before publishing:**

| Issue | Fix |
|---|---|
| **Text at wrong end of canvas** | Pass `text_position='top'` or `'bottom'` per Step 4b for the post's day-of-week; re-render |
| **Text too close to bottom edge (9:16)** | Verify `bottom_inset = int(target_h * 0.13)` (Meta-spec — Reels UI stack); re-render |
| **Text too close to top edge (9:16)** | Verify `top_inset = int(target_h * 0.14)` (Meta-spec — Stories profile header); re-render |
| **Text too close to sides (9:16)** | Verify `side_inset = int(target_w * 0.13)` (Meta-spec — Reels right-rail); re-render |
| **Gradient has visible gap at canvas edge** | Bottom text → `scrim_bottom == target_h`; top text → `scrim_top == 0`. Gradient must reach the canvas edge on the text side; re-render |
| **Feed text top/bottom not at `pad // 2`** | Confirm feed branch sets `top_inset = bottom_inset = scrim_fade = pad // 2`; re-render |
| **Feed text sides too tight / clipped in IG profile grid** | Confirm feed branch sets `side_inset = pad + pad // 2` (~96–108 px). Do NOT "simplify" to `pad // 2` — that gets consumed by IG's profile-grid 4:5 recrop (~34 px side trim). See v2.5.2 changelog. Re-render. |
| Wrong text alignment for the day | Check day-of-week and pass correct `text_align` (`'left'`/`'center'`/`'right'`) to `add_text_overlay`; re-render |
| Wrong text color scheme | Adjust the brightness multiplier in `add_text_overlay` (change `0.40` up/down to shift the threshold); re-render |
| Subline illegible against busy or light bg | Increase scrim max-alpha — change `230` to `245` in the gradient loop; re-render |
| Headline clipped at sides | Increase `side_inset` by 20 px and re-render |
| Headline clipped at top/bottom of canvas (block too tall for canvas) | Reduce `hs` by 10% and re-render — happens when `block_h > target_h - top_inset - bottom_inset` (the available space between insets), pushing `text_y` negative or `text_bottom` past `target_h` |
| Subline cut off | Reduce `ss2` by 10% and re-render |
| Low text contrast (scrim too light) | Increase scrim opacity — change `230` to `245` in the gradient alpha and re-render |
| Text overlaps logo | Text and logo must occupy opposite vertical ends per Step 4b. If overlapping despite correct positions (very long text on short canvas), reduce `hs` by 10% to shorten the text block. Re-render. |
| Logo at wrong end | Correct `position` per day-of-week rotation: `top-right` for Mon/Wed/Fri (paired with bottom text); `bottom-left` for Tue/Thu/Sat (paired with top text); re-render |
| Logo and text on same row | Verify Step 4b mapping: `text_position` and `logo_position` must always be on opposite vertical ends. Re-pull the rotation row for the post's day; re-render |
| Logo positioned wrong | Verify the `is_story_reel` branch in `add_logo`: 9:16 → `top_inset = int(h * 0.14)`, `bottom_inset = int(h * 0.13)`, `side_inset = int(w * 0.13)` (Meta); feed → all three = `pad // 2`; re-render |
| Logo clipped at edge | Reduce `scale` by 0.02 and re-render |
| Logo visually offset (unequal margins) | `add_logo` already crops transparent padding via `logo.crop(logo.getbbox())` before computing dimensions — verify the crop line is present at the top of the function; re-render |
| Logo aspect ratio looks distorted | Confirm `logo.crop(logo.getbbox())` runs BEFORE `logo_w`/`logo_h` are computed (cropping after the resize-target calc distorts aspect); re-render |
| Logo too small to read | Increase `scale` to 0.22 and re-render |
| Logo too large / dominates image | Reduce `scale` to 0.14 and re-render |
| Logo blends into background | Add white semi-transparent backing: `bg = Image.new('RGBA', (logo_w + pad, logo_h + pad), (255,255,255,160))`, paste at `(x - pad//2, y - pad//2)` before pasting logo |
| Logo over busy image area | Last-resort fallback only: switch to the opposite corner (e.g. `top-right` → `top-left`) on the same end. This overrides the day-of-week `logo_position`; use only when contrast cannot be salvaged via scrim alpha or backing. Re-render. |

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

- [ ] All "Planned" posts for today processed
- [ ] Copy matches persona voice and brand tone
- [ ] Hook is scroll-stopping; CTA is specific
- [ ] Brand visual source resolved in 3-tier order (informs Gemini prompt aesthetic): fb.ai brand kit (`fivebucks_get_brand_kit`, checked first when `FIVEBUCKS_API_KEY` set) → local `brands/{brand}/design-system/` (when present) → `brand.md` colors/voice; never blocked on a missing key or design-system
- [ ] Image dimensions are correct for platform/format
- [ ] Template-path used when a matching fb.ai template exists for the format; image-path used otherwise (no `failed` run for missing templates)
- [ ] **Template-path:** `fivebucks_list_templates` called once at run start and cached (not per-post)
- [ ] **Template-path:** `overrides` map copy → manifest field keys (skip `bound:false`, `select` values from `options`); direction set (`_direction` A/B/C for meta-story — never `all`; `direction` for single-image types)
- [ ] **Template-path:** `fivebucks_create_post` → `fivebucks_render_post`; signed PNGs re-hosted on Zernio and passed as `media_items` to `late_create_post`; Pillow overlays skipped (Steps 4d–4g)
- [ ] **Template-path (failure):** quota/5xx falls back to Step 4c-image; Notion status set to `"Draft Ready"`; Slack warning logged
- [ ] **Image-path (Gemini-only):** Story/Reel full-frame guard applied — `image_brief` passed to Gemini contains `"fills the ENTIRE frame"` (either from `social-calendar` or wrapped by the guard)
- [ ] **Image-path (Gemini-only):** Pillow text overlay (Step 4d) AND logo overlay (Step 4e) BOTH applied — Gemini background has no logo
- [ ] **Image-path:** text overlay applied with correct day-of-week `text_align` (left Mon/Thu, center Tue/Fri, right Wed/Sat) AND `text_position` (bottom Mon/Wed/Fri, top Tue/Thu/Sat) per Step 4b
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
