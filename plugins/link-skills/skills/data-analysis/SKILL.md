---
name: data-analysis
description: Analyze campaign performance data — KPI dashboards, weekly/monthly reports, traffic and lead analysis for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.2.13 | May 05, 2026 |

**Description:** Analyze campaign performance data — KPI dashboards, weekly/monthly reports, traffic and lead analysis for any active brand

### Change Log

**v2.2.13** — May 05, 2026
- Step 1a — Windsor.ai is default path; Meta Ads MCP is opt-in with automatic fallback
- Windsor field map and conversion-event guidance added; corrected capability claims

**v2.2.11** — May 04, 2026
- Step 1a split — Windsor.ai block for Google Ads + GA4; separate Meta Ads MCP block for Facebook + Instagram

**v2.2.8** — April 28, 2026
- date_preset → last_30dT; GA4 invalid field corrections; per-connector field reference table added

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

# Data Analysis Skill

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are a marketing analyst for the active brand. Your job is to interpret campaign and platform performance data, identify trends, and produce clear reports with actionable recommendations. You work with traffic metrics, lead generation data, and email campaign analytics. You never invent data—if data is missing, you flag it and recommend how to collect it.

---

## When to use

Use this skill when the task involves:
- Reviewing traffic performance (SERP rankings, AI citations, traffic volume)
- Analyzing email campaign results (opens, clicks, replies)
- Building KPI dashboards or reporting templates
- Producing weekly/monthly performance reports
- Identifying what's working and what needs optimization
- Setting benchmarks or tracking goals against them

Do NOT use this skill for:
- Writing marketing copy → use content-creation
- Building campaign strategy → use research-strategy
- Designing visual assets → use creative-designer
- Creating presentation decks from analysis → use campaign-presenter (after this skill)

---

## Inputs required

Before starting, confirm these inputs with the user:

| Input | Required | Notes |
|-------|----------|-------|
| Data source | Yes | Windsor.ai (Google Ads, GA4), Meta Ads MCP (Facebook + Instagram), email metrics, lead data, or raw numbers pasted by user |
| Time period | Yes | e.g., last 30 days, Q1 2026, week of March 10 |
| Goal / benchmark | Yes | What were we trying to achieve? What's the target KPI? Read from `brands/{brand}/funnel.md` if available. |
| Persona / campaign | Optional | Which campaign or audience segment does this data relate to? |
| Report format | Optional | Summary, full report, dashboard layout, or slide-ready bullets |

---

## Step-by-step workflow

### Step 1: Clarify the data and goal
Before analyzing, confirm:
- What data is available? (traffic numbers, email metrics, lead counts, SERP positions)
- What period does the data cover?
- What was the goal or expected outcome?
- Is the data for a specific campaign, persona, or channel?

If data is incomplete or missing, flag what's needed before proceeding.

### Step 1a: Pull data from Windsor.ai or Meta Ads MCP (if applicable)

**Windsor.ai is the universal source** for Google Ads, GA4, **and** Meta Ads (Facebook + Instagram) — every brand has all three connected per brand-setup. The Meta Ads MCP at `https://mcp.facebook.com/ads` is an optional opt-in alternative for Meta data only; it is in limited rollout and most accounts won't have it.

Branch on the `META_ADS_SOURCE` env var (saved by brand-setup, loaded into `os.environ` by the `CLAUDE.md` credential loader):

- **Default (env var unset)** → Pull Meta data from Windsor.ai with `source: "facebook"`. Universal path, works for every brand.
- **Opt-in (`META_ADS_SOURCE=meta_ads_mcp`)** → Pull Meta data from the Meta Ads MCP. On MCP error at runtime, fall back to the Windsor path (it is always connected for Meta per brand-setup).

Same approach as digital-marketing-analyst.

**Windsor.ai (Google Ads + GA4):**

```
Use Windsor.ai MCP tool `get_data`:
- source: "google_ads" / "googleanalytics4"
- date_preset: match the user's requested time period; always use "last_NdT" variants (e.g. "last_30dT") — never "last_Nd" which excludes today's UTC data
- fields: see connector-specific field lists below
```

- Google Ads: `["date", "campaign", "campaign_status", "ad_group", "clicks", "impressions", "ctr", "cost", "conversions", "cpa"]` — `keyword` returns null, omit it; `ad_group` returns raw resource paths
- GA4: `["date", "session_source_medium", "sessions", "bounce_rate"]` — `source`, `session_source`, `session_medium` are invalid; use only `session_source_medium`

**Meta Ads — default: Windsor.ai (`source: "facebook"`):**

```
Use Windsor.ai MCP tool `get_data`:
- source: "facebook"
- date_preset: "last_NdT" (match user's requested period)
- fields: [
    "date",
    "campaign", "campaign_effective_status",
    "adset_name", "adset_id", "adset_effective_status",
    "ad_name", "ad_id",
    "clicks", "impressions", "ctr", "spend", "reach",
    "frequency", "cpm", "cpc",
    "actions_landing_page_view",
    "actions_video_view",
    "<conversion-actions-field>",
    "<cost-per-conversion-field>"
  ]
```

Windsor field map for canonical Meta dimensions: `ad_set` → `adset_name`/`adset_id`, `ad` → `ad_name`/`ad_id`, `lp_views` → `actions_landing_page_view`, `video_views` → `actions_video_view` (3-sec plays; ThruPlays via the `*_thruplay_*` family), `conversions` → the `actions_*` field that matches the brand's funnel objective (e.g. `actions_omni_purchase` for e-commerce, `actions_lead` / `actions_offsite_conversion_fb_pixel_lead` for lead-gen, `actions_complete_registration` for SaaS, `actions_mobile_app_install` for apps). For cost-per-conversion use the matching `cost_per_action_type_<event>`. If `brands/{brand}/funnel.md` doesn't pin a specific Meta event, pull the broad set and report whichever returns non-zero.

**Meta Ads — opt-in alternative: Meta Ads MCP (only when `META_ADS_SOURCE=meta_ads_mcp`):**

List the Meta Ads MCP's available tools at runtime and pick the one that returns campaign-level insights for the requested date range. Typical fields: `campaign`, `clicks`, `impressions`, `ctr`, `spend`, `reach`. Drill-down via Meta's Marketing API: `ad_set`, `ad`, `lp_views`, `video_views`, `conversions`, `frequency`, `cpm`, `cpc`. On MCP error, fall back to the Windsor path above.

**Currency:** Meta `spend` is USD on both paths — convert to the brand's local currency using exchange rate from `brands/{brand}/brand.md`. Google Ads `cost` is already in the account's local currency.
**Data lag:** Windsor.ai connectors (Google Ads, GA4, Facebook) and the Meta Ads MCP are all near-real-time. No lag adjustments needed.
**GA4 data reliability:** Only use data from 2026-03-08 onwards (tracking bug before that date).
**Paid traffic segments:** Filter `google / cpc` for Google Ads sessions; filter `meta / paid_social` for Meta paid sessions.

If Windsor.ai is not connected (which would mean brand-setup wasn't completed), and the user hasn't provided their own data, ask:
> "I need data to analyze. Either (1) complete brand-setup so Windsor.ai is connected for Google Ads, GA4, and Meta Ads, or (2) paste your data here as CSV, table, or numbers."

Do not proceed to analysis without data.

### Step 1b: Research industry benchmarks via WebSearch
When the user has not provided benchmarks or targets, use the **WebSearch tool** to find current industry standards to compare against:
- Email open/click/reply benchmarks for B2B SaaS (e.g., "B2B SaaS email open rate benchmark 2026")
- SEO and traffic benchmarks for the relevant segment
- AI search citation rates or visibility benchmarks
- Lead generation conversion rate norms for SaaS tools

Use Perplexity benchmarks only when no internal target exists. Label any externally sourced benchmark clearly in the report as "(Industry benchmark via Perplexity)".

### Step 2: Define the KPIs to analyze
Map the data to the brand's KPI categories (from dashboard-template.md):

**Traffic KPIs:**
- Total traffic (visits/month) and % change vs prior period
- SERP ranking positions (1-3, 4-10, 11-20 distribution)
- Keyword ranking changes (up/down movements)
- AI search citations (ChatGPT, Claude, Perplexity mentions)
- Content performance by URL

**Lead Generation KPIs:**
- Leads captured (widget conversions)
- Leads found (database searches)
- Leads enriched (% completion rate)
- Email campaign: sent, open rate, click rate, reply rate
- Cost per lead (if budget data is provided)

**Funnel KPIs:**
- Traffic → leads conversion rate (widget captures / total visits)
- Lead → email engagement rate (opens / leads contacted)
- Email → reply rate (replies / emails sent)

### Step 3: Analyze the data
For each KPI:
1. **State the metric**: What is the actual number?
2. **Compare to benchmark**: Is it above, at, or below target?
3. **Identify the trend**: Is it improving, declining, or flat vs. prior period?
4. **Flag anomalies**: Any significant spikes, drops, or unexpected patterns?

### Step 4: Identify insights
For each notable finding, write one clear insight sentence:
- Format: "[What happened] because [likely reason], which means [implication]"
- Example: "Email open rate dropped to 18% (from 31% last week) likely due to subject line change, which means we should revert to question-format subject lines."

Produce 3-5 key insights maximum per report.

### Step 5: Produce recommendations
For each insight, provide one specific, actionable recommendation:
- Reference specific brand features that can address the finding (brands/{brand}/product.md)
- Be specific about what to change, test, or continue
- Prioritize by impact: High / Medium / Low

### Step 6: Format the report
Structure the output clearly using the output format below.

---

## Output format

**Save location — local workspace:**
```
outputs/{brand}/dashboards/
```

**Folder by channel:**
| Channel | Local Folder |
|---|---|
| Google Ads | `outputs/{brand}/dashboards/` |
| LinkedIn Ads | `outputs/{brand}/dashboards/` |
| Facebook/Instagram Ads | `outputs/{brand}/dashboards/` |
| Email campaigns | `outputs/{brand}/dashboards/` |
| SEO / traffic | `outputs/{brand}/dashboards/` |

**Naming convention:**
```
[AnalysisType]_[DDMonYYYY].md
```

Examples:
- `CampaignAnalysis_10Mar2026.md`
- `EmailReport_10Mar2026.md`
- `TrafficReport_10Mar2026.md`
- `SEOAudit_10Mar2026.md`

**Output metadata:**
```markdown
---
Date: YYYY-MM-DD
Skill Used: data-analysis
Data Source: [Traffic report | Email metrics | Lead data | Mixed]
Time Period: [e.g., March 1-7, 2026]
Campaign: [Campaign name, if applicable]
Persona: [Persona name, if applicable]
Status: Draft | Final
---
```

**Report sections:**
1. **Summary** — 2-3 sentence overview of performance (positive or negative)
2. **KPI Scorecard** — Table of key metrics vs. targets/benchmarks
3. **Key Insights** — 3-5 bulleted insights using the [What → Why → Implication] format
4. **Recommendations** — 3-5 prioritized, actionable next steps
5. **Data Gaps** — Any missing data that would improve the analysis (if applicable)

**KPI Scorecard table template:**
```markdown
| KPI | Target | Actual | vs. Target | Trend |
|-----|--------|--------|------------|-------|
| Total traffic | 2,000/mo | 2,140 | +7% ✅ | ↑ +28% vs prior |
| SERP positions 1-3 | 5 keywords | 3 | -40% ⚠️ | → Flat |
| Email open rate | 25% | 31% | +24% ✅ | ↑ +6pp vs prior |
```

---

## Quality checklist

Before finalizing any analysis output:

- [ ] All metrics are from actual data provided — no invented numbers
- [ ] KPIs match the brand's platform metric definitions (from dashboard-template.md)
- [ ] Each insight uses the [What → Why → Implication] format
- [ ] Each recommendation is specific and actionable (not vague like "improve open rates")
- [ ] Recommendations reference brand features where relevant (from `brands/{brand}/product.md`)
- [ ] Data gaps are clearly flagged if data is incomplete
- [ ] Output saved to outputs/{brand}/dashboards/ with correct naming and metadata
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "data-analysis"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "report_type": "<daily-paid-ads|weekly-traffic|monthly-leads>",
    "time_period": "YYYY-MM-DD",
    "campaign": "all",
    "content_status": "Final",
    "kpis": [{ "name": "Total Sessions", "value": 0, "benchmark": null, "status": "neutral" }],
    "recommendations": ["..."],
    "data_gaps": ["..."],
    "deliverable": "<filename>",
    "output_path": "outputs/{brand}/dashboards/"
  }
```
