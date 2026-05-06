---
name: social-calendar
description: Plan weekly 14-post social media content calendar across LinkedIn, Facebook, Instagram for any active brand. Runs weekly on Sunday cron schedule.
allowed-tools: Read, Grep, Glob, Bash, WebSearch
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.2.15 | May 05, 2026 |

**Description:** Plan weekly 14-post social media content calendar across LinkedIn, Facebook, Instagram for any active brand

### Change Log

**v2.2.15** — May 05, 2026
- Direction column added to planning table — picker rules per format (Carousel/Story/LinkedIn)
- Notion table column count 10 → 11
- Quality Checklist requires Direction populated

**v2.2.9** — April 30, 2026
- Replaced "Ken Burns background video (pre-stored images)" references with "Gemini-generated images"

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

# SKILL.md — Social Calendar

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

You are a senior social media strategist for the active brand. Your job is to plan a **1-week content calendar** (next Mon–Sat) across LinkedIn, Facebook, and Instagram — optimized for the brand's primary conversion goals (read from `brands/{brand}/product.md`).

Runs weekly on Sunday cron schedule. Output is a **planning table only** — topics, formats, angles, CTAs. The content-generator skill handles actual copy.

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

Each week has 3 Reels (Tue IG, Thu FB, Fri IG) and 2 Stories (Thu IG, Fri FB). Argil AI avatar videos are expensive — **pick exactly 1 Reel per week** for Argil treatment. The rest use Gemini-generated images (published as Stories). Stories always use Gemini-generated static images.

**Selection criteria for the Argil Reel** — pick the one most likely to drive conversions:
1. Strongest pain-point hook (scroll-stopping opener)
2. Clear ROI proof or case study angle (e.g., "7 hours → 30 minutes")
3. Direct CTA to book a call or start a trial
4. Authority/founder content (founder avatar — see `brands/{brand}/avatars.md`)

Mark the chosen Reel by adding `(Argil)` after the Format in the calendar table, e.g., `Reel (Argil)`. All other Reels are just `Reel` (content-generator will use a Gemini-generated image published as Story).

**Example:**
| Thursday | Facebook | Reel (Argil) | ... | — this one gets Argil avatar
| Tuesday | Instagram | Reel | ... | — Gemini-generated image as Story
| Friday | Instagram | Reel | ... | — Gemini-generated image as Story

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
| Direction | Template variant for the post — see "Direction selection" below. Required for IG/FB Carousel and Story/Reel posts; leave blank for LinkedIn / Reel(Argil) / formats without a Claude Design template. |
| Status | Planned |

### Direction selection — pick the template variant per post

The `Direction` field tells `content-generator` which template variant to render at production time. Direction is your responsibility (planning); content-generator just applies what you set.

**For Carousel posts** — combine the carousel template's two variant axes as `coverVariant-bodyVariant`:
- `type-allnumbers` — default. Big typographic cover, all sign slides have large kicker numerals (01/02/03/04). Good for educational carousels with strong listicle structure.
- `sticker-editorial` — Sticker-style cover (badge / playful), editorial body slides (less number-forward). Good for personality-led / opinion / hot-take content.
- `editorial-mixed` — Editorial cover (magazine), mixed body slide treatments. Good for story / case-study carousels where each slide has a different visual rhythm.

Pick by content type:
- Educational / how-to / "N signs of..." → `type-allnumbers`
- Hot take / opinion / personality → `sticker-editorial`
- Case study / customer story → `editorial-mixed`

**For Story / Reel posts** — pick one of the story template's three direction styles:
- `A` — Spotlight Dark. Brand-led campaigns: eyebrow → headline → divider pill, dark backgrounds, accent color leading. Good for product launches, brand campaigns, urgent CTAs.
- `B` — Editorial Stat. When a single big number is the story (oversized stat as hero). Good for ROI proof, benchmark posts, "X% faster" / "$Y saved" data points.
- `C` — Cream Press. Light, magazine-style. Good for case studies, testimonials, founder posts, customer stories.

Pick by content type:
- Brand campaign / launch / direct CTA → `A`
- Stat-driven proof / benchmark → `B`
- Case study / testimonial / founder voice → `C`

**For LinkedIn posts, Reel(Argil), or any format without a matching Claude Design template** — leave Direction blank.

If you assign a Direction the brand's template doesn't support (e.g. carousel template only ships `type-allnumbers`), content-generator falls back to the template defaults and logs a warning — but planning quality suffers, so check the entry HTML inside `brands/{brand}/social-carousel-template/` and `brands/{brand}/social-story-template/` (look for the `*.html` file that contains the `EDITMODE-BEGIN` block) for which variants the brand actually has before assigning.

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

Use **Notion MCP** to save the calendar to Notion. The calendar page must live **inside the brand's social-calendar database** so `content-generator` Step 1 can find it via `${BRAND}_NOTION_DB`.

Page title: `SocialCalendar_[DDMon]-[DDMonYYYY]`
e.g. `SocialCalendar_17Mar-22Mar2026`

### Step 3a — Ensure the brand's social-calendar DB exists (first-run only)

This step is primarily for the **first-ever calendar run** for a brand. On subsequent weekly runs, the env var is already set and the DB already exists — fetch and proceed.

Read `${BRAND}_NOTION_DB` from `.claude/settings.local.json` (e.g. `FIVEBUCKS_NOTION_DB`).

**Decision:**

```
IF env var is set:
  fetch the DB → if fetch succeeds → DB exists → DO NOT create. Skip to Step 3b.
  (only create if fetch returns 404 / not_found, meaning the DB was deleted)

IF env var is NOT set:
  → first-ever run for this brand → create the DB (instructions below).
```

```
Use mcp__notion__notion-fetch:
- id: "${BRAND}_NOTION_DB"
```

**If env var is set and fetch succeeds → skip to Step 3b. Do not create another DB.**

**Create only when env var is unset (or fetch returns not_found):**
```
Use mcp__notion__notion-create-database:
- parent: { "type": "page_id", "page_id": "<brand_parent_page_or_workspace_root>" }
- title: "{Brand Name} Social Media Calendar"
- properties: {
    "Name":          { "title": {} },
    "Date Range":    { "rich_text": {} },
    "Status":        { "select": { "options": [
                        {"name": "Planned"},
                        {"name": "Published"},
                        {"name": "Archived"}
                      ] } },
    "Posts":         { "number": { "format": "number" } },
    "Created":       { "created_time": {} }
  }
```

If no brand parent page exists yet, `notion-search` for `"{Brand}"` first; if nothing is found, create a parent page with `notion-create-pages` titled `"{Brand Name}"` at the workspace root, then nest the DB under it.

After creation, **persist the new DB ID back to `.claude/settings.local.json`** under `env.{BRAND}_NOTION_DB`. Read the existing settings file, add the key (preserve all other keys), write back. This makes the DB discoverable by `content-generator` and by every future weekly social-calendar run.

Notify the user in chat (first-run only):
> Created new Notion DB **{Brand Name} Social Media Calendar** and saved its ID as `${BRAND}_NOTION_DB` in `.claude/settings.local.json`. Future runs will reuse this DB — no re-creation.

### Step 3b — Save local backup

Save local backup first: `outputs/{brand}/strategy/SocialCalendar_[DDMon]-[DDMonYYYY].md`

### Step 3c — Find or create this week's calendar page inside the brand DB

1. **Resolve the DB to a `data_source_url`** (needed for scoped search):
   ```
   Use mcp__notion__notion-fetch:
   - id: "${BRAND}_NOTION_DB"
   ```
   Extract the `collection://` URL from the response — typically `data_sources[0].url`. Save as `data_source_url`.

2. **Check if the week's page already exists, scoped to the brand DB only:**
   ```
   Use mcp__notion__notion-search:
   - query: "SocialCalendar_[DDMon]-[DDMonYYYY]"
   - data_source_url: <data_source_url from step 1>
   - query_type: "internal"
   ```
   ⚠️ Never run a bare workspace-wide `notion-search` for the page name — it can return another brand's calendar with the same week label. Always pass `data_source_url`.

3. **If no matching page → create it:**
   ```
   Use mcp__notion__notion-create-pages:
   - parent: { "database_id": "${BRAND}_NOTION_DB" }
   - pages: [{
       "properties": { "Name": "SocialCalendar_[DDMon]-[DDMonYYYY]", "Status": "Planned", "Posts": 14 },
       "content": "<markdown of the calendar — heading + 11-column table + content mix + persona distribution>"
     }]
   ```
   The `content` field accepts markdown. Use a markdown table with **11 columns** — Date, Platform, Format, Topic, Persona, Content Angle, CTA, Hashtags, Image Brief, Direction, Status. The Notion connector converts markdown headings, tables, and paragraphs into the appropriate block types automatically.

4. **If the page already exists → update it in place:**
   ```
   Use mcp__notion__notion-update-page:
   - page_id: <existing page id>
   - properties: { "Status": "Planned", "Posts": 14 }
   - replace_content: true
   - content: "<same markdown as step 3>"
   ```
   `replace_content: true` clears existing child blocks before appending the new content — avoids duplicate tables stacking up across re-runs.

5. Capture the returned page URL for the Slack notification.

**Brand-header sanity check before Slack:** the returned page's parent database title must contain the active brand. If somehow it doesn't (shouldn't happen given the DB-scoped flow), abort with a `failed` log — do not announce a calendar that landed in another brand's DB.

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

| Date | Platform | Format | Topic | Persona | Content Angle | CTA | Hashtags | Image Brief | Direction | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 06 Apr 2026 | LinkedIn | Post | ... | ... | ... | ... | ... | ... | (blank) | Planned |
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
- [ ] **Direction column populated** for every IG/FB Carousel post (one of `type-allnumbers` / `sticker-editorial` / `editorial-mixed` — or whatever combos the brand's carousel template supports) and every IG/FB Story / Reel post (one of `A` / `B` / `C`); left blank for LinkedIn posts and Reel(Argil)
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
