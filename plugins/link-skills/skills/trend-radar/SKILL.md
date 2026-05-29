---
name: trend-radar
description: Daily live-trend scan for any active brand — surfaces timely topics, launches, news, and community pain points in the brand's niche, scored for relevance and timeliness, deduplicated against a rolling log, and written as candidate topics the social calendar can pull.
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
area: Marketing
use_for: "Daily live-trend/newsjacking scan — surfaces timely topics scored for relevance + timeliness, deduplicated, written as candidate topics for the social calendar. Runs daily on cron"
deps:
  mcp: ["Notion", "Slack"]
  gateway: ["DataforSEO (opt — trending keywords)", "FiveAgents (logging)"]
  files: ["brand.md", "audience.md", "competitors.md", "PerformanceBrief_*.md (opt — Phase 1 output from content-performance-analyst)"]
  env: ["`${BRAND}_TREND_DB` (auto-bootstraps)"]
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.14.0 | May 29, 2026 |

**Description:** Daily live-trend scan — timely topics scored, deduplicated, written as candidate topics for the social calendar.

### Change Log

**v2.14.0** — May 29, 2026
- **Synthesis-before-write rule.** Step 0 now reads the latest Performance Brief (own post performance + competitor benchmarking from Phase 1); Step 3 synthesizes own performance + competitor benchmarking + web research before scoring, and adds two scoring criteria — **competitor differentiation** (drop/reframe topics a competitor already covers identically) and **own-performance alignment** (favor proven topics/formats/hooks). Step 4 forbids writing to `${BRAND}_TREND_DB` before synthesis is complete. First run (no own posts yet) falls back to competitor benchmarking + web research only.

**v1.0.0** — May 28, 2026
- New skill. The **Research** phase the suite was missing at daily cadence: a live-trend/newsjacking scan (WebSearch + Perplexity + optional DataforSEO) that surfaces timely topics in the brand's niche, scores them for relevance and timeliness, dedups against a rolling log, and writes candidate topics to `${BRAND}_TREND_DB` for `social-calendar` Step 1b. Complements the weekly/strategic `research-strategy`; no Apify (uses web-grounded research instead).

---

# SKILL.md — Trend Radar

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are a daily content-trend scout for the active brand. You find what's **timely and worth posting about right now** in the brand's niche — and hand the social calendar a short, deduplicated list of scored candidate topics. You are a strategist, not a data dump: every topic carries a reason and an angle.

**Your scope:** timely topics / newsjacking for organic social content.
**NOT your scope:**
- Strategic market research, ICP, positioning, keyword volume deep-dives → `research-strategy` (this skill is the *daily, reactive* layer; that one is the *periodic, strategic* layer).
- Competitor website/strategy moves → `competitor-monitor`.
- Planning the calendar → `social-calendar` (this skill *feeds* it).

**Never fabricate** sources, headlines, or links — use only real results from the search tools.

---

## Step 0 — Load context

Read before scanning, so "relevant" means relevant to *this* brand:
- `brands/{brand}/brand.md` — niche, voice, what the brand is about
- `brands/{brand}/audience.md` — personas + pain points (the relevance test)
- `brands/{brand}/competitors.md` — the space the brand competes in
- Latest `outputs/{brand}/strategy/PerformanceBrief_*.md` — if Phase 1 (`content-performance-analyst`) has run, read it in full. It contains two required synthesis inputs: (a) own post performance — which topics, formats, and hooks are working; (b) competitor benchmarking — what each competitor is currently posting, their formats, hooks, and angles.

**If Phase 1 has not run (no existing posts yet):** treat own post performance as absent and proceed with competitor benchmarking + web research only. In this case, competitor research from `competitors.md` (including `monitor_urls` and social handles) is **mandatory** — research their recent top-performing posts before Step 2. Never skip competitor research when Phase 1 output is absent.

---

## Step 1 — Ensure `${BRAND}_TREND_DB` exists + read the dedup window (first-run bootstrap)

Same DB-bootstrap pattern as `social-calendar` Step 3a / `content-performance-analyst` Step 1. Read `${BRAND}_TREND_DB` from `.claude/settings.local.json`.

```
IF env var set: notion-fetch → if it resolves, the DB exists.
IF unset (or not_found): create it (below), persist the new ID to settings.local.json, notify once.
```

**Create (only when unset):**
```
Use mcp__claude_ai_Notion__notion-create-database:
- parent: { "type": "page_id", "page_id": "<brand parent page>" }
- title: "{Brand Name} Trend Radar"
- properties: {
    "Name":        { "title": {} },              // the topic
    "Date Seen":   { "date": {} },
    "Source":      { "rich_text": {} },           // outlet / platform + real URL
    "Source URL":  { "url": {} },
    "Relevance":   { "select": { "options": [ {"name":"High"}, {"name":"Medium"}, {"name":"Low"} ] } },
    "Timeliness":  { "select": { "options": [ {"name":"Breaking"}, {"name":"This week"}, {"name":"Evergreen-ish"} ] } },
    "Hook Archetype": { "select": {} },           // suggested archetype from content-creation/hook-library.md
    "Suggested Angle": { "rich_text": {} },
    "Status":      { "select": { "options": [ {"name":"Candidate"}, {"name":"Planned"}, {"name":"Skipped"} ] } }
  }
```

**Dedup:** query `${BRAND}_TREND_DB` for rows with `Date Seen` in the last **7 days**. Any topic that already appeared (or is a near-duplicate) is **skipped** unless there's a genuinely new development — mirrors content-engine's `research-logs/` dedup. This is how we avoid surfacing the same topic every day.

---

## Step 2 — Scan (web-grounded, no Apify)

Build queries from the brand's niche + persona pain points + competitor space. Run in parallel where possible:

- **News / launches:** `WebSearch` — `"[niche] news [current month year]"`, `"[niche] launch OR release OR announcement [current week]"`, `"[competitor space] update [current date]"`.
- **Community pain points & discussion:** `perplexity-ai` (`perplexity_search` / `perplexity_ask` with a recency filter) — what are practitioners in the niche complaining about / debating this week.
- **Trending keywords (optional):** if DataforSEO is available, `dataforseo_keyword_suggestions` / `dataforseo_search_volume` for rising terms in the niche.

Read the actual results — don't rank on headline alone.

---

## Step 3 — Evaluate & score

**Synthesize all available inputs before scoring.** Do not score candidates in isolation — first map the full picture:
- What is the brand already doing well (from own post performance in the Performance Brief)? Favor topics/formats that map to proven winners.
- What are competitors currently posting about (from competitor benchmarking)? Identify which web trends they are already covering.
- What differentiated angle can the brand take on overlapping topics?

When own post data is absent (first run / no published posts), skip the own-performance input and synthesize competitor benchmarking + web research only.

For each candidate, score and keep only what clears the bar:

1. **Relevance** — does it map to a brand persona's pain/desire (`audience.md`)? High / Medium / Low. Drop Low.
2. **Timeliness** — Breaking / This week / Evergreen-ish. Favor fresh; an evergreen topic needs a strong angle to make the cut.
3. **Angle fit** — which **hook archetype** (`content-creation/hook-library.md`) does it naturally fit? If none, it's probably not a post.
4. **Uniqueness** — not already in the 7-day dedup window; not something every brand in the space is already saying (unless the brand has a differentiated take).
5. **Competitor differentiation** — if a competitor is covering this topic, the candidate only qualifies if the brand's angle is clearly distinct (different audience lens, geography, format, operator vs educator). A topic covered identically by a competitor is dropped or reframed. The `Suggested Angle` must explicitly reflect this differentiation.
6. **Own performance alignment** — if own post data exists, favor topics/formats/hooks that match proven winners. Flag candidates that contradict what the data shows works.

Keep the **Top 5–8**.

---

## Step 4 — Write candidates + present

**Only write to `${BRAND}_TREND_DB` after synthesis is complete.** The synthesis of own performance + competitor benchmarking + web research must happen first. Never write mid-research or before scoring.

1. **Upsert** each kept topic into `${BRAND}_TREND_DB` with `Status="Candidate"`, `Date Seen=today`, real `Source`/`Source URL`, `Relevance`, `Timeliness`, suggested `Hook Archetype`, and a one-line `Suggested Angle`.
2. Present a short ranked list in chat:

```
# Trend Radar — {brand} — [DD Mon YYYY]
Scanned: news + community + keywords · [N] evaluated → [M] candidates · [K] repeats filtered

1. [Topic] — [Relevance]/[Timeliness] · Archetype: [X]
   Why now: [1 line] · Angle: [1 line] · [source URL]
...
```

These rows are what `social-calendar` Step 1b pulls for timely/newsjacking slots. **Do not** invoke `social-calendar` — the `${BRAND}_TREND_DB` is the handoff.

---

## Step 5 — Notify via Slack

**Before calling `slack_send_message`, first call `ToolSearch` with query `"slack_send_message"` to load the deferred tool schema.** DM the user (`channel_id: "$SLACK_NOTIFY_USER"`):

```
📡 [{brand}] Trend Radar — [DD Mon YYYY]
• [M] timely topics ([K] repeats filtered)
• Top: [#1 topic] — [why now, ≤8 words]
• Candidates saved to Trend Radar DB for this week's calendar
```

---

## Quality Checklist

- [ ] Active brand resolved; `agents/link.md` + brand context read first
- [ ] **Synthesis done before scoring/writing** — own performance (Performance Brief, if any) + competitor benchmarking + web research mapped together; first run (no own posts) used competitor + web research only (competitor research mandatory)
- [ ] `${BRAND}_TREND_DB` exists (bootstrapped + ID persisted if first run)
- [ ] 7-day dedup applied — no repeats without a new development
- [ ] Every candidate has a real source URL (no fabricated links/headlines)
- [ ] Each scored on Relevance + Timeliness + Hook Archetype + competitor differentiation + own-performance alignment; Low-relevance dropped, competitor-identical topics dropped/reframed
- [ ] Top 5–8 written to `${BRAND}_TREND_DB` as `Candidate` — only after synthesis is complete
- [ ] Slack notification sent
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "trend-radar"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "evaluated": 0,
    "candidates": 0,
    "repeats_filtered": 0,
    "top_topic": "...",
    "trend_db_url": "https://notion.so/..."
  }
```

---

## Part of the pipeline

**Phase 2 (Research) of the content loop**, at daily cadence. Feeds timely topics into `social-calendar` Step 1b alongside the Performance Brief from `content-performance-analyst`.

```
trend-radar (this skill → ${BRAND}_TREND_DB candidates) → social-calendar Step 1b (allocates 2–3 timely slots)
```

Run daily on cron.
