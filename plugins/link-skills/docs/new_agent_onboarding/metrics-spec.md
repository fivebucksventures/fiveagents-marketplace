# Agent Run Metrics Specification

This is the contract between Link (agent execution) and fiveagents.io (dashboard rendering). Every skill MUST follow this spec when calling `log_agent_run()`.

## Database columns (agent_runs table)

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `client_id` | uuid | Yes | The client this run belongs to |
| `agent_id` | uuid | No | The agent that executed (null if unlinked) |
| `skill` | text | Yes | Skill identifier (e.g. `digital-marketing-analyst`) |
| `brand` | text | Yes | Brand context (e.g. `fivebucks`, `fiveagents`) |
| `status` | text | Yes | `success`, `failed`, or `partial` |
| `summary` | text | Yes | One-line human-readable summary. This is what appears in the activity feed. Keep under 200 chars. |
| `metrics` | jsonb | Yes | Structured data — see per-skill schemas below |
| `started_at` | timestamptz | Yes | When the run started |
| `completed_at` | timestamptz | No | When the run finished |

## Metrics JSONB — common fields

Every skill MUST include these top-level fields in `metrics`:

```json
{
  "date": "2026-03-28"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string (YYYY-MM-DD) | Yes | The report/data date. For weekly reports, use the end date. |

**Do NOT include** `brand`, `skill`, `client_id`, or `agent_id` in metrics — these are already columns.

## Metrics JSONB — how the dashboard renders it

The dashboard uses a **widget-based system** (see `docs/dashboard_pages.md`). When adding an agent to the dashboard:

1. **If `agents.config` exists** — `configToWidgets()` converts the config sections into widgets with exact labels, column order, and formats
2. **If no config** — `metricsToWidgets()` auto-detects the JSONB shape and generates widgets

Either way, the data shapes expected are:

| Data shape | Widget generated | Example |
|---|---|---|
| Scalar values at dot-paths | KPI stat cards | `google_ads.totals.spend` → S$120.69 |
| Array of objects | Table with columns | `google_ads.campaigns` → Campaign Performance table |
| Object with `urgent`/`optimize`/`monitoring` arrays | Color-coded flags | `flags.urgent` → red flag cards |
| Array of strings | Bulleted list | `markets` → ["SG", "MY", "ID"] |
| String | Text block | `top_recommendation` → text widget |
| Nested object with `totals` + arrays | Section heading + KPIs + tables | `google_ads` → "Google Ads" section |

The auto-renderer fallback handles any JSONB shape:
- Primitives → stat cards
- Arrays of objects → tables (keys become column headers)
- Arrays of strings → bulleted lists
- Nested objects → recurse with headings
- Flags-shaped objects → color-coded lists

## Comparison support

The dashboard has a page-level Compare toggle (DoD/WoW/MoM) that shows deltas on KPI and table widgets where `comparison` is configured. For this to work:

1. **Use consistent keys across runs.** If today's run has `google_ads.totals.spend`, yesterday's must use the same path.
2. **Use numeric values** for anything that should be compared. Don't format numbers as strings (e.g. use `100.12` not `"SGD 100.12"`).
3. **Runs must have `agent_id`** set so the dashboard can find the previous run for the same agent.

## Per-skill metrics schemas

### digital-marketing-analyst

```json
{
  "date": "2026-03-19",
  "brief_type": "daily",
  "google_ads": {
    "totals": { "spend": 36.74, "clicks": 23, "impr": 411, "ctr": 5.60, "conv": 0, "cpa": 0 },
    "campaigns": [
      { "name": "ID – Fivebucks Lead Generation", "status": "Enabled", "spend": 29.74, "clicks": 21, "ctr": 5.60, "conv": 0, "cpa": 0 },
      { "name": "SG – Fivebucks Lead Generation", "status": "Enabled", "spend": 7.00, "clicks": 2, "ctr": 5.56, "conv": 0, "cpa": 0 }
    ],
    "ad_groups": [
      { "name": "Apollo Alternative", "campaign": "ID – Fivebucks Lead Generation", "status": "Enabled", "clicks": 11, "impr": 262, "ctr": 4.20, "cost": 17.28 },
      { "name": "Lead Generation Software", "campaign": "ID – Fivebucks Lead Generation", "status": "Enabled", "clicks": 10, "impr": 110, "ctr": 9.09, "cost": 12.46 }
    ],
    "keywords": [
      { "keyword": "lead generation software", "campaign": "ID", "clicks": 7, "ctr": 6.86, "cost": 9.08, "conv": 0 },
      { "keyword": "ai for lead generation", "campaign": "ID", "clicks": 6, "ctr": 8.57, "cost": 8.54, "conv": 0 }
    ]
  },
  "google_ads_funnel": [
    { "stage": "Impressions", "volume": 411, "rate": null, "cost_per": 89.39, "benchmark": null, "status": null },
    { "stage": "Clicks", "volume": 23, "rate": 5.60, "cost_per": 1.60, "benchmark": "3-4%", "status": "green" },
    { "stage": "GA4 Sessions (Paid Search)", "volume": 0, "rate": null, "cost_per": null, "benchmark": "80-90%", "status": "red" },
    { "stage": "Trial CTA Click", "volume": 3, "rate": null, "cost_per": 12.25, "benchmark": "5-15%", "status": null },
    { "stage": "Signup Form Start", "volume": 1, "rate": 33.3, "cost_per": 36.74, "benchmark": ">60%", "status": "red" },
    { "stage": "Signup Form Submit", "volume": 0, "rate": null, "cost_per": null, "benchmark": ">50%", "status": "red" },
    { "stage": "Trial Activated", "volume": 0, "rate": null, "cost_per": null, "benchmark": ">70%", "status": null },
    { "stage": "Paid Conversion", "volume": 0, "rate": null, "cost_per": null, "benchmark": "SGD 200-780", "status": null },
    { "stage": "Schedule Call", "volume": 1, "rate": null, "cost_per": 36.74, "benchmark": "1-3%", "status": null }
  ],
  "meta_ads": {
    "totals": { "spend": 45.64, "clicks": 1001, "impr": 11602, "ctr": 8.63, "lp_views": 894, "cpm": 3.93 },
    "campaigns": [
      { "name": "FBV_SEO_Q1_TOF_2026", "impr": 3650, "clicks": 470, "ctr": 12.88, "lp_views": 414, "lp_rate": 79.6, "spend": 20.17, "cpc": 0.0429, "cpm": 5.525 },
      { "name": "FBV_CS_Q1_TOF_2026", "impr": 7952, "clicks": 531, "ctr": 6.68, "lp_views": 480, "lp_rate": 82.3, "spend": 25.47, "cpc": 0.048, "cpm": 3.203 }
    ],
    "ad_sets": [
      { "name": "FBV_SEO_ID", "campaign": "FBV_SEO_Q1_TOF_2026", "impr": 3650, "clicks": 470, "ctr": 12.88, "lp_views": 414, "spend": 20.17, "reach": 2641 },
      { "name": "FBV_CS_ID", "campaign": "FBV_CS_Q1_TOF_2026", "impr": 7621, "clicks": 530, "ctr": 6.95, "lp_views": 480, "spend": 23.26, "reach": 6777 },
      { "name": "FBV_CS_SG", "campaign": "FBV_CS_Q1_TOF_2026", "impr": 331, "clicks": 1, "ctr": 0.30, "lp_views": 0, "spend": 2.21, "reach": 321 }
    ],
    "ads": [
      { "name": "FBV_CS_ID_Video", "campaign": "FBV_CS_Q1_TOF_2026", "impr": 7621, "clicks": 530, "ctr": 6.95, "lp_views": 480, "video_views": 2695, "spend": 23.26 },
      { "name": "FBV_SEO_ID_Video", "campaign": "FBV_SEO_Q1_TOF_2026", "impr": 3650, "clicks": 470, "ctr": 12.88, "lp_views": 414, "video_views": 2129, "spend": 20.17 },
      { "name": "FBV_CS_SG_Video", "campaign": "FBV_CS_Q1_TOF_2026", "impr": 331, "clicks": 1, "ctr": 0.30, "lp_views": 0, "video_views": 44, "spend": 2.21 }
    ]
  },
  "meta_ads_funnel": [
    { "stage": "Impressions", "volume": 11602, "rate": null, "cost_per": 3.93, "benchmark": null, "status": null },
    { "stage": "Clicks", "volume": 1001, "rate": 8.63, "cost_per": 0.0456, "benchmark": ">1%", "status": "green" },
    { "stage": "LP Views", "volume": 894, "rate": 89.3, "cost_per": 0.05, "benchmark": ">25%", "status": "green" },
    { "stage": "GA4 Sessions (Paid Social)", "volume": 808, "rate": 80.7, "cost_per": 0.06, "benchmark": "80-90%", "status": null },
    { "stage": "Trial CTA Click", "volume": 3, "rate": 0.4, "cost_per": 15.21, "benchmark": "5-15%", "status": null },
    { "stage": "Trial Activated", "volume": 0, "rate": 0, "cost_per": null, "benchmark": ">70%", "status": null },
    { "stage": "Paid Conversion", "volume": 0, "rate": null, "cost_per": null, "benchmark": "SGD 200-780", "status": null },
    { "stage": "Schedule Call", "volume": 1, "rate": 0.1, "cost_per": 45.64, "benchmark": "1-3%", "status": null }
  ],
  "combined_summary": {
    "google_ads": { "spend": 36.74, "clicks": 23, "lp_views": null, "ga4_sessions": 0, "trials": 0, "cpa": 0, "status": "Active" },
    "meta_ads": { "spend": 45.64, "clicks": 1001, "lp_views": 894, "ga4_sessions": 808, "trials": 0, "cpa": 0, "status": "Active" },
    "total": { "spend": 82.38, "clicks": 1024, "lp_views": 894, "ga4_sessions": 808, "trials": 0 }
  },
  "flags": {
    "urgent": [
      "ZERO conversions — SGD 36.74 spent with 0 trials and 0 paid conversions",
      "GA4 shows ZERO Paid Search sessions while Google Ads reports 23 clicks — auto-tagging failure",
      "ANZ and FBV_TOF_ID campaigns showing 0 impressions — confirm intended status"
    ],
    "optimize": [
      "'find b2b leads' (Broad match): 53 impressions, 0 clicks, 0% CTR — pause or tighten match type",
      "SG campaign avg CPC SGD 3.50 vs ID campaign avg CPC SGD 1.42 — review SG bid strategy"
    ],
    "monitoring": [
      "All active keywords have 0 conversions — allow 7-14 days before optimizing bids",
      "ID campaign carrying ~81% of total spend (SGD 29.74 of 36.74)",
      "Overall bounce rate 89.5% — investigate if paid traffic lands on relevant pages"
    ]
  },
  "top_recommendation": "Immediately confirm Google Ads auto-tagging is enabled — GA4 shows zero Paid Search sessions while Ads reports SGD 36.74 in spend.",
  "gmail_message_id": "19d31ebb5b0c2549"
}
```

### content-generator

```json
{
  "date": "2026-03-31",
  "images_generated": 2,
  "videos_generated": 0,
  "posts": [
    {
      "platform": "Facebook",
      "topic": "Agency Consolidates 4 Tools Into One",
      "persona": "agency-owner",
      "format": "static",
      "asset_type": "image",
      "status": "Published",
      "late_post_id": "69cbadd12de214fb9f44af75"
    }
  ]
}
```

### social-calendar

```json
{
  "date": "2026-03-23",
  "week": "23-28 Mar 2026",
  "posts_planned": 14,
  "calendar_status": "Published",
  "notion_url": "https://notion.so/...",
  "posts": [
    {
      "date": "23 Mar",
      "platform": "LinkedIn",
      "topic": "Optimize Content for AI Search",
      "persona": "content-mgr",
      "format": "static",
      "status": "Published"
    }
  ],
  "content_mix": [
    {"type": "static", "count": 11, "percentage": 78.6}
  ],
  "persona_distribution": [
    {"persona": "seo-pro", "count": 3}
  ]
}
```

### social-publisher

```json
{
  "date": "2026-03-31",
  "posts_published": 2,
  "posts_failed": 0,
  "posts": [
    {
      "platform": "Facebook",
      "topic": "Agency Consolidates 4 Tools",
      "late_post_id": "69cbadd12de214fb9f44af75",
      "status": "published",
      "published_at": "2026-03-31T09:00:00+08:00",
      "url": "https://facebook.com/...",
      "notes": null
    }
  ]
}
```

### content-creation

```json
{
  "date": "2026-03-31",
  "format": "linkedin-post",
  "persona": "agency-owner",
  "framework": "problem-agitate-solve",
  "language": "en",
  "campaign": "Q1-2026-launch",
  "content_status": "Final",
  "word_count": 320,
  "deliverable": "AgencyConsolidates4Tools_31Mar2026_copy.md",
  "output_path": "outputs/fivebucks/posts/Facebook/"
}
```

### creative-designer

```json
{
  "date": "2026-03-31",
  "assets": [
    {
      "type": "social-image",
      "platform": "Facebook",
      "dimensions": "1200x630",
      "tool": "gemini-nano-banana-2",
      "avatar": false,
      "file": "AgencyConsolidates4Tools_31Mar2026_final.png",
      "late_uploaded": true
    }
  ],
  "late_uploads": 1
}
```

### research-strategy

```json
{
  "date": "2026-03-28",
  "type": "competitive-analysis",
  "persona": "seo-pro",
  "markets": ["SG", "ID", "MY"],
  "campaign": "Q1-2026-launch",
  "content_status": "Final",
  "competitors_analyzed": 3,
  "core_messages": ["SurferSEO stops at content — no leads, no pipeline", "fivebucks covers SEO + AI search + leads + outreach"],
  "keywords_analyzed": 45,
  "deliverable": "SurferSEO_CompetitiveAnalysis.md",
  "output_path": "outputs/fivebucks/strategy/"
}
```

### data-analysis

```json
{
  "date": "2026-03-27",
  "report_type": "daily-paid-ads",
  "time_period": "2026-03-27",
  "campaign": "all",
  "content_status": "Final",
  "kpis": [
    {"name": "Total Sessions", "value": 700, "benchmark": null, "status": "neutral"},
    {"name": "Bounce Rate", "value": 76.9, "benchmark": 70, "status": "red"},
    {"name": "Trial Activations", "value": 0, "benchmark": 1, "status": "red"}
  ],
  "recommendations": [
    "Audit the trial signup flow",
    "Fix Meta and Google Ads data sources",
    "Review Paid Social audience targeting"
  ],
  "data_gaps": [
    "Meta Ads spend, CPC, CTR — API returned zero",
    "Google Ads spend — sheets empty"
  ],
  "deliverable": "PaidAdsBrief_27Mar2026.md",
  "output_path": "outputs/fivebucks/dashboards/"
}
```

### campaign-presenter

```json
{
  "date": "2026-03-28",
  "deck_type": "weekly-review",
  "campaign": "Q1-2026-launch",
  "deck_audience": "leadership",
  "slide_count": 8,
  "content_status": "Final",
  "slides": [
    {"number": 1, "title": "Executive Summary", "type": "overview"},
    {"number": 2, "title": "Google Ads Performance", "type": "data"},
    {"number": 3, "title": "Meta Ads Performance", "type": "data"},
    {"number": 4, "title": "GA4 Funnel Analysis", "type": "data"},
    {"number": 5, "title": "Competitive Landscape", "type": "analysis"},
    {"number": 6, "title": "Content Calendar Results", "type": "data"},
    {"number": 7, "title": "Recommendations", "type": "action"},
    {"number": 8, "title": "Next Week Plan", "type": "action"}
  ],
  "deliverable": "WeeklyReview_28Mar2026.pptx",
  "output_path": "outputs/fivebucks/presentations/"
}
```

## Rules for custom / client-specific agents

For agents not covered by the 9 canonical skills (e.g. lead-qualification, inbox-triage):

1. Use a stable `skill` label (e.g. `lead-qualification`)
2. Follow the same `metrics` structure: `date` required, numeric values for comparison, arrays of objects for tables
3. Agree the metrics schema with the client before building
4. The auto-renderer (`metricsToWidgets`) will handle any JSONB shape, but defining a config in `agents.config` (via `DEFAULT_CONFIGS` in `src/lib/dashboard/default-configs.ts`) gives precise control over labels, column order, and formats

## Summary for Link SKILL.md authors

At the end of every skill run, call:

```python
log_agent_run(
    client_id="...",
    skill="digital-marketing-analyst",
    brand="fiveagents",
    status="success",           # success | failed | partial
    metrics={...},              # JSONB following the schema above
    summary="One line summary", # shown in activity feed, <200 chars
    agent_id="...",             # optional but recommended for comparison
)
```

- `date` is required in metrics
- Use consistent key names across runs (enables DoD/WoW/MoM)
- Use numeric values (not formatted strings) for anything that should be compared
- `flags` object with `urgent`/`optimize`/`monitoring` arrays renders as color-coded lists
- `summary` should be human-readable, concise, and useful without seeing the full metrics
