---
name: background-generator
description: Generate 20 background images per brand for Reel video production. Run manually or schedule externally.
allowed-tools: Read, Grep, Glob, Bash
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.2.15 | May 05, 2026 |

**Description:** Generate 20 background images per brand for Reel video production. Run manually or schedule externally.

### Change Log

**v2.2.15** — May 05, 2026
- Role section clarified — produces backgrounds library at brands/{brand}/backgrounds/ for Reel production, distinct from social-{carousel,story}-template/ apps

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

**v2.2.2** — April 10, 2026
- gemini_generate_image result decoded via Python to brands/{brand}/backgrounds/

# SKILL.md — Background Generator

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You generate 20 pre-stored background images per brand for use in Ken Burns Reel videos. These backgrounds are stored at `brands/{brand}/backgrounds/` and used as raw material for video production. Run manually when the library needs refreshing.

**Relationship to Claude Design shell collections** — `brands/{brand}/social-carousel-template/` and `brands/{brand}/social-story-template/` (when present) hold pre-rendered branded background **shells** for static social posts (Carousel + Story / Reel static frames). Those shells are populated by `brand-setup` Step 4c and consumed by `content-generator` and `creative-designer` via their shell-path. The `backgrounds/` library this skill produces is a separate, more general-purpose set used by Reel video production and as the Gemini fallback library. The two systems are independent — this skill does not need to read or write the shell folders.

---

## When to use

- When the user asks to refresh or add backgrounds
- When the library feels repetitive (content-generator reusing same images)
- After adding a new brand

Do NOT use for:
- Generating post-specific images → content-generator handles that
- Generating video → content-generator or creative-designer

---

## Step 1 — Read upcoming social calendar briefs

Read the next 2 weeks of social calendar entries for the brand to get fresh `ImageBrief` values.

Use **Notion MCP** to query the calendar:

1. Use `mcp__notion__API-query-data-source` with the brand's Notion DB ID (from env var `${BRAND}_NOTION_DB`) to find the latest `SocialCalendar_` pages (sort by name descending, page_size 5).

2. For each page whose date range covers the next 2 weeks, use `mcp__notion__API-get-block-children` to get the page blocks, find the table block, then get its children (table rows).

3. Parse each row — column order: `Date, Platform, Format, Topic, Persona, ContentAngle, CTA, Hashtags, ImageBrief, Status`. Filter for rows with Status = `"Planned"` and dates within the next 14 days.

Extract all unique `ImageBrief` values (column index 8). These are the prompts.

---

## Step 2 — Build prompt list (20 per brand)

Take up to 20 unique ImageBriefs from Step 1. If fewer than 20, create variations of existing briefs by changing:
- Lighting (morning light, golden hour, dim ambient, bright studio)
- Setting (office, cafe, co-working, home office, outdoor)
- Composition (top-down flat lay, close-up, wide angle, aerial)

**Prompt rules:**
- Use the `ImageBrief` exactly as written in the calendar
- NEVER use the word "portrait" — Gemini generates actual portrait photos
- Every prompt must end with: "No text. No logos. No watermarks."

---

## Step 3 — Generate images

Create the backgrounds folder if it doesn't exist: `brands/{brand}/backgrounds/`

For each image:
```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "{ImageBrief}"
- aspect_ratio: "1:1" (default for background library; content-generator crops to target canvas at overlay time)
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

If user has selected a folder, save directly to `brands/{brand}/backgrounds/` — not a temp path.

Wait 6 seconds between calls (rate limit: ~10 requests per minute).

**Filename convention:** Use a descriptive slug based on the Topic or ImageBrief content. Examples:
- `finance_dashboard_laptop.png`
- `singapore_skyline_timelapse.png`
- `abstract_purple_silk.png`
- `cafe_laptop_notepad.png`

Filenames must be descriptive enough that the content-generator can pick the right background based on the post's Topic.

**Rate limit:** 6 seconds between image generation calls.

---

## Step 4 — Verify

Count the PNG files in `brands/{brand}/backgrounds/`. Must have at least 20 NEW images generated. Skip filenames that already exist — the library grows each month. If any failed, retry.

---

## Step 5 — Notify via Slack

DM the user via Slack MCP (`channel_id: "$SLACK_NOTIFY_USER"`):

```
🖼️ [{brand}] Monthly backgrounds refreshed

New images: 20
Total library: [count] images
Location: brands/{brand}/backgrounds/
```

---

## Quality Checklist

- [ ] 20 images per brand generated
- [ ] Filenames are descriptive (content-generator can pick by Topic)
- [ ] No "portrait" in any prompt
- [ ] All prompts end with "No text. No logos. No watermarks."
- [ ] 6-second delay between image generation calls
- [ ] Existing images NOT deleted (library grows)
- [ ] Slack notification sent
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "background-generator"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: { "date": "YYYY-MM-DD", "images_generated": 0, "total_library": 0 }
```
