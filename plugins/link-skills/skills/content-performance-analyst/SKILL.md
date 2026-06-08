---
name: content-performance-analyst
description: Analyze organic content performance for any active brand — your own published posts (engagement by topic, format, persona, angle, hook archetype, Direction) plus competitor content benchmarking — and produce a Performance Brief that feeds the social calendar.
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
area: Marketing
use_for: "Analyze organic content performance — own published posts (engagement by topic/format/persona/angle/hook/Direction, outlier scoring) plus competitor content benchmarking — into a Performance Brief that feeds social-calendar"
deps:
  mcp: ["Notion", "Slack"]
  gateway: ["Zernio", "Zernio Analytics add-on", "FiveAgents (logging)"]
  files: ["brand.md", "audience.md", "competitors.md", "funnel.md (opt)"]
  env: ["`${BRAND}_NOTION_DB`", "`${BRAND}_PERFORMANCE_DB` (auto-bootstraps)"]
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v1.0.1 | June 08, 2026 |

**Description:** Analyze organic content performance — own posts + competitor benchmarking — into a Performance Brief that feeds the social calendar.

### Change Log

**v1.0.1** — June 08, 2026
- Step 0 pre-flight: primary engagement source switched to `late_get_post_analytics` (Zernio Analytics add-on); 402/403 add-on error triggers graceful fallback to `late_list_posts` + competitor benchmarking. Added optional `late_get_follower_stats` for reach denominator.
- Step 2.3: explicit field mapping from `late_get_post_analytics` response (impressions/likes/comments/shares/saves/engagementRate).
- Frontmatter deps: `gateway` now lists `Zernio Analytics add-on` alongside Zernio.

**v1.0.0** — May 28, 2026
- New skill. The organic-content **Data** phase the suite was missing: pulls per-post engagement from Zernio (own posts) joined to the social-calendar's authored attributes, benchmarks competitor content via web research, scores outliers vs the brand's own baseline, and writes a Performance Brief that `social-calendar` Step 1b reads. Closes the create→publish→measure→learn loop. Distinct from `data-analysis` / `digital-marketing-analyst` (paid ads + GA4) and `competitor-monitor` (competitor *website*/strategy diffs).

---

# SKILL.md — Content Performance Analyst

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are an organic-content performance analyst for the active brand. You measure which **published organic posts** actually won — by topic, format, persona, content angle, hook archetype, and template Direction — and you benchmark that against competitors' visible content. You output a dense **Performance Brief** that the social calendar reads to bias next week's plan toward what works.

**Your scope:** organic social content (LinkedIn, Facebook, Instagram) — the brand's own posts + competitor content.
**NOT your scope:**
- Paid ads / GA4 funnel → `data-analysis`, `digital-marketing-analyst`.
- Competitor *website* / pricing / exec / careers diffs → `competitor-monitor`.
- Planning the calendar → `social-calendar` (this skill *feeds* it).

**Never invent metrics.** If a number isn't available from a source, mark it absent — do not estimate engagement as if it were measured.

---

## Step 0 — Data sources & pre-flight

All own-post engagement comes from **`late_get_post_analytics`** (Zernio Analytics add-on). Pre-flight: call it with a small limit. If it returns metrics → use them. If it errors 402 `analytics_addon_required` (or 403 `requiresAddon`) → mark rows **metrics-pending**, state the gap, and fall back to `late_list_posts` (publish status only) + competitor benchmarking — don't block. Optionally call `late_get_follower_stats` for per-account follower/growth context (reach denominator).

| Rows | Source | Notes |
|---|---|---|
| Your posts (all platforms) | **Zernio Analytics** `late_get_post_analytics` — primary; `late_list_posts` (status `published`) — fallback for publish status only | If a field isn't returned for a platform, leave it blank — don't fabricate |
| Competitors (all) | **Web research** (`WebSearch` / `perplexity` / `WebFetch`) over handles in `competitors.md` | Always approximate — see Step 3 |

---

## Step 1 — Ensure `${BRAND}_PERFORMANCE_DB` exists (first-run bootstrap)

This mirrors the `social-calendar` Step 3a DB-bootstrap pattern. Read `${BRAND}_PERFORMANCE_DB` from `.claude/settings.local.json`.

```
IF env var is set:  notion-fetch it → if it resolves, the DB exists → skip to Step 2.
IF env var is NOT set (or fetch returns not_found):  create it (below), then persist the new ID.
```

**Create (only when unset):**
```
Use mcp__claude_ai_Notion__notion-create-database:
- parent: { "type": "page_id", "page_id": "<brand parent page>" }  // notion-search "{Brand}" first; create the parent page if absent (same as social-calendar)
- title: "{Brand Name} Content Performance"
- properties: {
    "Name":           { "title": {} },
    "Owner":          { "select": {} },        // "self" | "<competitor handle>"
    "Source":         { "select": { "options": [ {"name":"zernio"}, {"name":"web-research"} ] } },
    "Platform":       { "select": { "options": [ {"name":"LinkedIn"}, {"name":"Facebook"}, {"name":"Instagram"} ] } },
    "Post URL":       { "url": {} },
    "Post ID":        { "rich_text": {} },
    "Posted Date":    { "date": {} },
    "Topic":          { "rich_text": {} },
    "Format":         { "select": { "options": [ {"name":"Post"}, {"name":"Carousel"}, {"name":"Story"} ] } },
    "Persona":        { "rich_text": {} },
    "Content Angle":  { "rich_text": {} },
    "Hook Archetype": { "select": {} },         // one of the 8 in content-creation/hook-library.md
    "Direction":      { "rich_text": {} },       // A/B/C or carousel coverVariant-bodyVariant
    "Likes":          { "number": {} },
    "Comments":       { "number": {} },
    "Shares":         { "number": {} },
    "Saves":          { "number": {} },
    "Impressions":    { "number": {} },
    "Engagement":     { "number": {} },          // likes+comments+shares+saves
    "Outlier Score":  { "number": {} },          // self rows only — engagement / brand per-platform avg
    "Captured At":    { "date": {} }
  }
```

After creation, **persist the new DB ID to `.claude/settings.local.json`** under `env.${BRAND}_PERFORMANCE_DB` (read existing settings, add the key, preserve all others, write back). Notify the user once (first-run only). This makes the store discoverable by future runs and by `social-calendar`.

---

## Step 2 — Build/refresh YOUR post rows (Owner = self, Source = zernio)

1. **Get the published set + join key.** Read the brand's recent `outputs/{brand}/published/PublishLog_*.md` (written by `social-publisher` — carries `Date · Platform · Topic · Late ID · Post URL`). This is the authoritative list of what went live.
2. **Recover authored attributes.** For each published post, join back to the brand's social-calendar history in `${BRAND}_NOTION_DB` by **Topic + Platform + Date** to recover `Persona`, `Format`, `Content Angle`, `Direction`, and `Hook Archetype` (the dimensions the calendar authored — no need to re-derive them from the creative).
3. **Fetch engagement** from **`late_get_post_analytics`** (match by `post_id`, or list + filter by `account_id`/`date_from`/`date_to`). Map: `Impressions ← impressions`, `Likes ← likes`, `Comments ← comments`, `Shares ← shares`, `Saves ← saves`, `Engagement ← likes+comments+shares+saves` (or `engagementRate`). Leave unreturned fields blank (never fabricate).
4. **Outlier score (self only).** Compute the brand's per-platform average engagement over rows with real metrics, then `Outlier Score = Engagement / platform_avg`. Flag outliers at `>= 2×` (content-engine's threshold). Skip rows that are too recent to have settled (note them; don't block).
5. **Upsert** one row per post into `${BRAND}_PERFORMANCE_DB` with `Owner="self"`, `Source="zernio"`, `Captured At=today`. Match on `Post ID` to avoid duplicates across runs (update metrics in place — this is the `metrics_updated_at` refresh).

---

## Step 3 — Build COMPETITOR rows (Owner = <handle>, Source = web-research)

For each competitor in `brands/{brand}/competitors.md`:
1. Use `WebSearch` / `perplexity` / `WebFetch` to find their recent **top-performing visible posts** on LinkedIn/IG/FB — hooks, formats, topics, and any visible engagement signal (reactions/comments counts when shown).
2. Tag each with the **Hook Archetype** (from `content-creation/hook-library.md`) and `Format` you infer from the post.
3. **Upsert** rows with `Owner="<competitor handle>"`, `Source="web-research"`. **Metrics are approximate or absent** — populate only what's visibly stated; leave the rest blank. **Do not** compute an Outlier Score for competitor rows (no per-account baseline). This is a *directional* benchmark, not a metric-for-metric match — say so in the Brief.

---

## Step 4 — Analysis

Query `${BRAND}_PERFORMANCE_DB` and aggregate in two parts. Use real numbers only; flag small samples.

**Your side (Owner = self):**
1. **Overview** — per platform: posts, avg engagement, top engagement, outliers, outlier rate.
2. **By dimension** — engagement + outlier rate grouped by `Format`, `Persona`, `Hook Archetype`, `Content Angle` theme, and `Direction` (A/B/C, carousel variants).
3. **Top & bottom posts** — 5 best and 5 worst by Outlier Score, with their dimensions.
4. **Cross-platform** — which topics/archetypes travel; which platform amplifies what.

**Competitor side (Owner = competitor):**
5. **Per-competitor** — their recurring hooks/formats/topics.
6. **You vs them** — on shared topics/archetypes, what they do that the brand doesn't; archetypes/formats over-indexed by competitors but under-used by the brand. Keep it directional (their numbers are web-grade).

---

## Step 5 — Output the Performance Brief

Save to `outputs/{brand}/strategy/PerformanceBrief_[DDMonYYYY].md` (the link-skills analog of content-engine's "Scripter Brief"). Dense, scannable, actionable — this is what `social-calendar` Step 1b reads.

```markdown
---
Date: YYYY-MM-DD
Skill Used: content-performance-analyst
Brand: {brand}
Coverage: Zernio own-post metrics [available | metrics-pending] · Competitors [web-research]
Status: Final
---

# Performance Brief — {Brand} — [DD Mon YYYY]

## Data coverage
[One line on what was measurable vs metrics-pending, from Step 0 pre-flight.]

## Winning formula (highest outlier probability)
- Best Format: [X] · Best Persona: [X] · Best Hook Archetype: [X] · Best Direction: [X]
- Platform priority: [ranked]

## Double down
| Dimension | Winner | Evidence (avg engagement / outlier rate) |
|---|---|---|

## Stop / fix
| Dimension | Underperformer | Evidence |
|---|---|---|

## You vs competitors (directional)
- Competitors lean into: [archetypes/formats] — brand currently under-uses: [...]
- Hooks to test (adapted, not copied): [...]

## Next-calendar guidance (read by social-calendar Step 1b)
- Mix shift: [e.g. +1 Carousel educational, -1 text-only Post]
- Directions to favor per format: [...]
- Topics/archetypes to retire: [...]
```

Also confirm the row counts written to `${BRAND}_PERFORMANCE_DB` (self + per competitor).

---

## Step 6 — Notify via Slack

**Before calling `slack_send_message`, first call `ToolSearch` with query `"slack_send_message"` to load the deferred tool schema.** DM the user (`channel_id: "$SLACK_NOTIFY_USER"`):

```
📊 [{brand}] Performance Brief ready — [DD Mon YYYY]
• Analyzed: [N] own posts ([M] with metrics) + [K] competitor posts
• Winning: [best format] · [best hook archetype] · [best Direction]
• Top action: [one-line mix shift for next calendar]
• File: outputs/{brand}/strategy/PerformanceBrief_[DDMonYYYY].md
```

---

## Quality Checklist

- [ ] Active brand resolved; `agents/link.md` read first
- [ ] Step 0 pre-flight run; data coverage stated in the Brief (no fabricated metrics)
- [ ] `${BRAND}_PERFORMANCE_DB` exists (bootstrapped + ID persisted if first run)
- [ ] Own rows joined to calendar attributes via PublishLog (Topic+Platform+Date); upserted by Post ID (no dupes)
- [ ] Outlier scores computed for self rows only; competitor rows have `Source=web-research` and no outlier score
- [ ] Brief saved to `outputs/{brand}/strategy/` with double-down / stop-fix / you-vs-them / next-calendar guidance
- [ ] Slack notification sent
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "content-performance-analyst"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "own_posts_analyzed": 0,
    "own_posts_with_metrics": 0,
    "competitor_posts": 0,
    "coverage": { "zernio": "metrics|metrics-pending" },
    "winners": { "format": "...", "hook_archetype": "...", "direction": "..." },
    "brief_path": "outputs/{brand}/strategy/PerformanceBrief_...md",
    "performance_db_url": "https://notion.so/..."
  }
```

---

## Part of the pipeline

**Phase 1 (Data) of the content loop.** Reads the PublishLog (`social-publisher`) + calendar (`social-calendar`), pulls Zernio per-post engagement, benchmarks competitors via web research, and emits the Performance Brief that `social-calendar` Step 1b consumes.

```
social-publisher (PublishLog: post ID/URL) → content-performance-analyst (this skill → Performance Brief + ${BRAND}_PERFORMANCE_DB) → social-calendar Step 1b (plans from what worked)
```

Run weekly on cron, before the Sunday `social-calendar` run.
