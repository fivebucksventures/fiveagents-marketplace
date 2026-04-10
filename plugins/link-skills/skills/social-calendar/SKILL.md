---
name: social-calendar
description: Plan weekly 14-post social media content calendar across LinkedIn, Facebook, Instagram for any active brand. Runs Sunday 09:00 SGT.
allowed-tools: Read, Grep, Glob, Bash, WebSearch
---

# SKILL.md — Social Calendar

You are a senior social media strategist for the active brand. Your job is to plan a **1-week content calendar** (next Mon–Sat) across LinkedIn, Facebook, and Instagram — optimized for the brand's primary conversion goals (read from `brands/{brand}/product.md`).

Runs weekly Sunday 09:00 SGT. Output is a **planning table only** — topics, formats, angles, CTAs. The content-generator skill handles actual copy.

---

## Step 1 — Read Brand Context

Read these files before planning:
- `brands/{brand}/brand.md`
- `brands/{brand}/product.md`
- `brands/{brand}/audience.md`
- `brands/{brand}/competitors.md`

---

## Step 1b — Research Viral Content & Trending Topics

**Run `/link-skills:research-strategy` before planning.** Focus the research on:

1. **Viral content formats** — what's getting high engagement on LinkedIn, Facebook, Instagram right now in the brand's niche? (e.g. carousel threads, talking-head Reels, meme formats, hot takes, before/after)
2. **Trending topics** — what industry conversations, news, or pain points are blowing up this week?
3. **Competitor social content** — what did competitors post recently that got high engagement? What format/hook did they use?
4. **High-performing keywords** — from DataforSEO, what search terms are trending in the brand's space?

Read the research output from `outputs/{brand}/strategy/` after it completes.

**This research MUST drive the content mix and topic selection in Step 2.** Do not default to a fixed content mix — adapt based on what's actually working in the market right now.

---

## Step 2 — Plan 14 Posts

Generate exactly 14 posts for the upcoming Mon–Sat week using the fixed slot assignments below.

### Fixed Slot Assignments — do not deviate

| Day | Platform | Format |
|---|---|---|
| Monday | LinkedIn | Post |
| Monday | Facebook | Post |
| Monday | Instagram | Post |
| Tuesday | Facebook | Post |
| Tuesday | Instagram | Reel |
| Wednesday | LinkedIn | Carousel |
| Wednesday | Instagram | Post |
| Thursday | Facebook | Reel |
| Thursday | Instagram | Story |
| Friday | LinkedIn | Post |
| Friday | Facebook | Story |
| Friday | Instagram | Reel |
| Saturday | Facebook | Post |
| Saturday | Instagram | Carousel |

### Argil Video Selection — 1 Reel per brand per week

Each week has 3 Reels (Tue IG, Thu FB, Fri IG) and 2 Stories (Thu IG, Fri FB). Argil AI avatar videos are expensive — **pick exactly 1 Reel per week** for Argil treatment. The rest use Ken Burns background video (pre-stored images, no API cost). Stories always use static images (pre-stored backgrounds).

**Selection criteria for the Argil Reel** — pick the one most likely to drive conversions:
1. Strongest pain-point hook (scroll-stopping opener)
2. Clear ROI proof or case study angle (e.g., "7 hours → 30 minutes")
3. Direct CTA to book a call or start a trial
4. Authority/founder content (founder avatar — see `brands/{brand}/avatars.md`)

Mark the chosen Reel by adding `(Argil)` after the Format in the calendar table, e.g., `Reel (Argil)`. All other Reels are just `Reel` (content-generator will use Ken Burns background video for these).

**Example:**
| Thursday | Facebook | Reel (Argil) | ... | — this one gets Argil avatar
| Tuesday | Instagram | Reel | ... | — this one gets Ken Burns background video
| Friday | Instagram | Reel | ... | — this one gets Ken Burns background video

### For each post output ONLY these fields (one row per post, no extra commentary):

| Field | Constraint |
|---|---|
| Date | DD Mon YYYY |
| Platform | LinkedIn / Facebook / Instagram |
| Format | From fixed slot table above. For the 1 chosen Argil Reel, use `Reel (Argil)` instead of `Reel`. |
| Topic | Short topic name (≤6 words) |
| Persona | One of the persona slugs defined in `brands/{brand}/audience.md` — max 2× per persona per week. Examples: `content-mgr`, `seo-pro`, `sales-rep`, `agency-owner`, `solopreneur`, `growth-mktr` |
| Content Angle | Hook + key message (1 sentence, ≤20 words) |
| CTA | Specific action (≤8 words) |
| Hashtags | 3–5 hashtags |
| Image Brief | Scene description for image gen (1 sentence). End with: "No text. No logos. No watermarks." |
| Status | Planned |

### Content mix across 14 posts:

**Adapt the mix based on Step 1b research findings.** If viral content in the niche is heavy on hot takes and opinion pieces, lean into that. If competitors are winning with educational carousels, plan more of those.

Default mix (use ONLY if research is unavailable):
- Educational / How-to: 5 posts
- Social Proof / Results: 3 posts
- Product Spotlight: 3 posts
- Direct CTA: 2 posts
- Engagement / Opinion: 1 post

Research-driven adjustments:
- If trending formats are Reels/video → shift more slots to Reel format where possible
- If a viral topic is relevant to the brand → dedicate 2-3 posts to ride the trend (different angles per platform)
- If competitor content is heavily educational → differentiate with more social proof or opinion content
- If a keyword is trending → build posts around that keyword's intent
- Always keep at least 2 Direct CTA posts per week (non-negotiable)

### Rotation rules:
- No persona more than 2× in the week
- Rotate across all personas defined in `brands/{brand}/audience.md` (e.g. `content-mgr`, `seo-pro`, `sales-rep`, `agency-owner`, `solopreneur`, `growth-mktr`)
- Direct CTAs at least 3 slots apart per platform
- No same topic twice

---

## Step 3 — Save to Notion

Use **Notion MCP** to save the calendar to Notion.

Page title: `SocialCalendar_[DDMon]-[DDMonYYYY]`
e.g. `SocialCalendar_17Mar-22Mar2026`

### Steps

1. Save local backup first: `outputs/{brand}/strategy/SocialCalendar_[DDMon]-[DDMonYYYY].md`

2. **Check if page already exists:** Use `mcp__notion__API-post-search` with `query: "SocialCalendar_[DDMon]-[DDMonYYYY]"` and `filter: {"property": "object", "value": "page"}`. If a matching page is found, update it (step 2b). Otherwise, create it (step 2a).

3. **Create new page (2a):** Use `mcp__notion__API-post-page` with:
   - `parent`: `{"database_id": "<BRAND_NOTION_DB>"}`
   - `properties`: `{"Name": {"title": [{"text": {"content": "SocialCalendar_[DDMon]-[DDMonYYYY]"}}]}}`
   - `children`: Convert the markdown calendar into Notion blocks — heading_1 for `#`, heading_2 for `##`, table block for the calendar table (10 columns, has_column_header: true), paragraphs for other text. Max 100 blocks per call; use `mcp__notion__API-patch-block-children` for overflow.

4. **Update existing page (2b):** Delete all existing child blocks via `mcp__notion__API-get-block-children` + `mcp__notion__API-delete-a-block` for each, then append new blocks via `mcp__notion__API-patch-block-children`.

5. Capture the page URL from the response for the Slack notification.

### Local backup file structure

```markdown
---
Date: YYYY-MM-DD
Skill Used: social-calendar
Brand: {brand}
Week: Mon DD Mon – Sat DD Mon YYYY
Status: Planned
Notion: {url}
---

# Social Calendar: [Mon DD Mon] – [Sat DD Mon YYYY]

| Date | Platform | Format | Topic | Persona | Content Angle | CTA | Hashtags | Image Brief | Status |
|---|---|---|---|---|---|---|---|---|---|
| 06 Apr 2026 | LinkedIn | Post | ... | ... | ... | ... | ... | ... | Planned |
... (14 data rows)

## Content Mix

| Type | Count | Posts |
|---|---|---|
| Educational / How-to | 5 | ... |
... (5 rows)

## Persona Distribution

| Persona | Count | Posts |
|---|---|---|
| content-mgr | 2 | ... |
... (6-7 rows)
```

---

## Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

DM the user via **Slack MCP** (`slack_send_message`, `channel_id: "$SLACK_NOTIFY_USER"`):

```
📅 [{brand}] Social Calendar Ready — Week of [DD Mon YYYY]
• 14 posts planned (Mon–Sat)
• Platforms: LinkedIn, Facebook, Instagram
• Mix: [x] edu / [x] proof / [x] product / [x] CTA / [x] engage
• Notion: [page URL]
```

---

## Quality Checklist

- [ ] Exactly 14 posts
- [ ] Formats match fixed slot table
- [ ] Exactly 1 Reel marked `(Argil)` per week — no more, no less
- [ ] Tuesday + Friday Instagram = Reel
- [ ] Wednesday LinkedIn = Carousel
- [ ] Thursday Facebook = Reel, Thursday Instagram = Story
- [ ] Friday Facebook = Story, Saturday Instagram = Carousel
- [ ] Persona rotation applied — no persona used more than 2× across 14 posts
- [ ] Content mix: 5 edu / 3 proof / 3 product / 2 CTA / 1 engage
- [ ] All image briefs end with "No text. No logos. No watermarks."
- [ ] Notion page URL logged to memory
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "social-calendar"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "week": "DD-DD Mon YYYY",
    "posts_planned": 14,
    "calendar_status": "Published",
    "notion_url": "https://notion.so/...",
    "posts": [{ "date": "DD Mon", "platform": "LinkedIn", "topic": "...", "persona": "...", "format": "static", "status": "Published" }],
    "content_mix": [{ "type": "static", "count": 11, "percentage": 78.6 }],
    "persona_distribution": [{ "persona": "seo-pro", "count": 3 }]
  }
```
