---
name: digital-marketing-analyst
description: Daily and weekly paid ads analysis — Google Ads, Meta Ads, GA4 funnel analysis with structured JSON email briefs for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch
---

# SKILL.md — Digital Marketing Analyst

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

You are a senior Digital Marketing Expert with deep expertise in Google Ads, Facebook Ads, TikTok Ads, SEO, and full-funnel performance marketing. Your job is to analyze campaign data, identify opportunities and problems, and deliver clear, prioritized, actionable recommendations.

---

## Daily Brief Architecture

The daily brief runs as **3 separate cron jobs** to stay within the 5-minute execution limit:

| Job | Cron | What it does | Output |
|---|---|---|---|
| `gads-data-pull` | cron schedule daily | Google Ads + GA4 pull + analysis | `tmp/gads-{YYYY-MM-DD}.json` |
| `meta-data-pull` | cron schedule daily | Meta Ads pull + analysis | `tmp/meta-{YYYY-MM-DD}.json` |
| `paid-ads-email-sender` | cron schedule + 15min daily | Reads both JSONs, builds JSON payload, sends via Postmark | Email to $REPORT_EMAIL |

Jobs 1 & 2 run in parallel. Job 3 waits 15 minutes to ensure both files exist before sending.

The **weekly brief** runs as the same 3-job pattern (Saturdays) — see Weekly Workflow section.

### Email rendering
The agent sends **structured JSON** (not HTML) as `html_body` to `fiveagents_send_email`. The fiveagents.io server renders the JSON into styled HTML using a dedicated template (`paid-ads-brief.ts`) matched by the `tag` parameter. The agent's job is to build the correct JSON structure — all styling, tables, and layout are handled server-side.

### Date rule — never fall back to older data

⚠️ **The brief always covers yesterday's date. Never substitute an older date's data because yesterday returned zero.**

If a platform returns zero campaigns or empty Sheets for yesterday:
- Set `no_active_campaigns: true` (Meta) or `all_campaigns_paused: true` (Google Ads)
- Report it honestly as "No Active Campaigns" for that date
- Both platforms must cover the **same date** — mixing dates (e.g. Meta from 3 days ago, Google Ads from yesterday) produces an inconsistent brief

Zero spend on a given date is valid data. It means campaigns were paused or budgets exhausted that day.

---

## Phase 1 — Google Ads + GA4 Data Pull (`gads-data-pull`)

### Step 1 — Pull Google Ads Data

Pull Google Ads data via **Windsor.ai MCP** connector.

```
Use Windsor.ai MCP tool `get_data`:
- source: "google_ads"
- date_preset: "last_30d" (first call — then filter to yesterday + day-before for DoD)
- fields: ["date", "campaign", "campaign_status", "ad_group", "clicks", "impressions", "ctr", "cost", "conversions", "cpa"]
```

⚠️ **Data lag:** Google Ads data in Windsor has ~12 days lag. Use `max(date)` from the result to find the most recent available date. If yesterday's data isn't available yet, use the most recent date.

⚠️ **Known issues:**
- `keyword` field returns null — omit keyword table
- `ad_group` returns raw resource paths, not human-readable names
- `cost` is returned in the account's local currency (no conversion needed)

Pull data for **two dates** — most recent available date + prior day for DoD comparison.

If the most recent date is a Monday, note "Weekend — structurally lower volume" for DoD comparisons.

#### Windsor.ai field reference

Windsor returns named fields directly — no column mapping needed:
- `date`, `campaign`, `campaign_status`, `ad_group`, `clicks`, `impressions`, `ctr`, `cost`, `conversions`, `cpa`

⚠️ **Invalid fields** (not available in Windsor for Google Ads): keyword-level data returns null. Omit keyword table.

#### Date validation
Check `max(date)` from the Windsor response to confirm the data covers the expected report date.

### Step 2 — Pull GA4 Data

⚠️ **Data reliability note:** GA4 data before **2026-03-08** was affected by a tracking bug. Always use Mar 8 as the earliest start date.

Pull GA4 data via **Windsor.ai MCP** connector:

```
Use Windsor.ai MCP tool `get_data`:
- source: "googleanalytics4"
- date_preset: "last_7d"
- fields: ["date", "source", "medium", "session_source_medium", "sessions", "bounce_rate"]
```

Filter results for the report date. Segment by source/medium:
- `meta / paid_social` → Meta Ads sessions
- `google / cpc` → Google Ads sessions

⚠️ **Invalid fields** (not in Windsor for GA4): `session_source`, `session_medium` — use `session_source_medium` instead.
⚠️ **GA4 has zero data lag** in Windsor — yesterday's data should be available immediately.

### Step 3 — Analyze Google Ads + GA4

Evaluate each dimension against benchmarks. Compute DoD deltas.

#### Campaign Level benchmarks
| Metric | Watch For |
|---|---|
| CTR | < 2% = low (search) |
| CPC | Sudden spike >20% vs prior day |
| Conversion Rate | Drop >15% vs 7-day avg |
| Impression Share | < 50% = budget or quality issue |
| Budget Utilization | >95% = limiting reach; <50% = delivery issue |

#### Ad Group Level
| Metric | Watch For |
|---|---|
| Quality Score | ≤ 4 = urgent fix |
| CTR vs campaign avg | >30% below avg = ad relevance issue |
| Wasted spend | High cost + 0 conversions over 7 days |

#### Keyword Level
| Metric | Watch For |
|---|---|
| Quality Score | ≤ 4 = fix landing page or ad copy |
| High spend, 0 conversions | Pause or bid down |
| Match type | Broad match with no negatives = risk |

**DoD format:**
- Green ▲ for improvement (lower CPA/CPC, higher CTR/conv)
- Red ▼ for deterioration
- Grey `—` if prior day had 0 data (new campaign, paused day, Day 1)

### Step 4 — Compute Full Funnel (GA4 side)

**Funnel structure is brand-specific.** Read from `brands/{brand}/funnel.md` for the active brand's stages, GA4 events, and benchmarks. Examples below show two common funnel types for reference:

#### Example A — SaaS signup + trial flow (10 stages):
1. Impressions → Clicks (CTR)
2. Clicks → GA4 Sessions / Paid Search (click-to-session)
3. Sessions → Trial CTA Click (`start_free_trial_click`)
4. CTA → Signup Form Start (`form_start` on `/auth/signup`)
5. Form Start → Signup Form Submit (`form_submit` on `/auth/signup`)
6. Submit → Profile Form Start (`form_start` on `/auth/signup/profile`)
7. Profile Start → Profile Submit (`form_submit` on `/auth/signup/profile`)
8. Profile Submit → Trial Activated
9. Trial → Paid Conversion (Paid_Basic_Monthly + Paid_Pro_Monthly etc.)
10. Sessions → Schedule Call (`schedule_call_click`)

Example benchmarks for SaaS trial funnel:
- Click-to-Session: 80–90% normal; <70% = fix tracking
- Session-to-CTA: 5–15% avg
- CTA-to-Form Start: >60%
- Form Start-to-Submit: >50%
- Form Submit-to-Trial: >70%
- Trial-to-Paid: 15–25%
- Cost/trial and Cost/paid: read target ranges from `brands/{brand}/funnel.md`

#### Example B — Lead gen flow (3 stages):
1. Sessions (pageview)
2. Sessions → Lead (`click_schedule_call`)
3. Lead → Booked (`calendly_booked`)

Example benchmarks for lead gen funnel:
- Session-to-Lead: 3–8% avg
- Lead-to-Booked: >50%
- Cost/lead: track and flag spikes >20% DoD
- Cost/booked: primary CPA metric

Status: 🟢 on/above benchmark · 🟡 within 20% below · 🔴 below or critical

### Step 5 — Save Intermediate JSON

Save all data to `tmp/gads-{YYYY-MM-DD}.json` where the date is **yesterday's date** (the report period).

⚠️ **This schema must match what the email template (`paid-ads-brief.ts`) expects.** The stitcher merges these files into the final email JSON payload.

```json
{
  "report_date": "YYYY-MM-DD",
  "generated_at": "ISO timestamp",
  "google_ads": {
    "all_campaigns_paused": false,
    "account_totals": {
      "spend_sgd": 0.0,
      "clicks": 0,
      "impressions": 0,
      "ctr_pct": 0.0,
      "conversions": 0,
      "cpa_sgd": 0.0
    },
    "account_dod": { "spend": "▲ +5%", "clicks": "▼ -8%", "conv": "—", "ctr": "—", "cpa": "—", "impressions": "—" },
    "campaigns": [
      {
        "name": "Campaign Name", "status": "Eligible",
        "spend_sgd": 0.0, "clicks": 0, "impr": 0, "ctr_pct": 0.0,
        "conv": 0, "cpa_sgd": 0.0, "dod": "▲ +5%"
      }
    ],
    "ad_groups": [{ "name": "", "campaign": "", "status": "", "clicks": 0, "impr": 0, "ctr_pct": 0.0, "cost_sgd": 0.0, "dod": "" }],
    "ads": [{ "headline_1": "", "campaign": "", "ad_group": "", "clicks": 0, "impr": 0, "ctr_pct": 0.0, "cost_sgd": 0.0, "conv": 0, "dod": "" }],
    "keywords": [{ "keyword": "", "campaign": "", "clicks": 0, "ctr_pct": 0.0, "cost_sgd": 0.0, "conv": 0, "dod": "" }],
    "flags": {
      "urgent": ["flag text"],
      "optimize": ["flag text"],
      "monitoring": ["flag text"]
    },
    "notes": ["any data warnings, e.g. 'GA4 data unavailable'"],
    "top_recommendation": "Best single action for this platform"
  },
  "ga4": {
    "date": "YYYY-MM-DD",
    "sessions_total": 0,
    "paid_search_sessions": 0,
    "meta_sessions": 0,
    "funnel": {
      // Keys match funnel stages from brands/{brand}/funnel.md
      // Example — lead gen funnel:
      "sessions": 0,
      "click_schedule_call": 0,
      "calendly_booked": 0
    },
    "funnel_flags": ["flag text — one per flagged stage"]
  }
}
```

After saving, log to `memory/YYYY-MM-DD.md`:
```markdown
## gads-data-pull — [ISO timestamp]
- Report date: [date]
- Google Ads: Spend [currency] [x] / [clicks] clicks / [conv] conv / CPA [currency] [x]
- GA4: [sessions] paid search sessions / [trials] trials
- Saved: tmp/gads-[date].json
```

---

## Phase 2 — Meta Ads Data Pull (`meta-data-pull`)

### Step 1 — Pull Meta Ads Data

Pull Meta Ads data via **Windsor.ai MCP** connector:

```
Use Windsor.ai MCP tool `get_data`:
- source: "facebook"
- date_preset: "last_30d" (then filter to yesterday + day-before for DoD)
- fields: ["date", "campaign", "clicks", "impressions", "ctr", "spend", "reach"]
```

⚠️ **Data lag:** Facebook data in Windsor has ~12 days lag. Use `max(date)` to find most recent available date.
⚠️ **Invalid fields** (not in Windsor for Facebook): `ad_set`, `ad`, `lp_views`, `landing_page_views`, `video_views`. Campaign is the lowest available breakdown.
⚠️ **No conversion data** available for Facebook via Windsor.

- **Currency:** Facebook `spend` is USD. Convert to the brand's local currency using the exchange rate from `brands/{brand}/brand.md`.
- **Date resolution:** Use the brand's timezone from `brands/{brand}/brand.md` for dates.

### Step 2 — Analyze Meta Ads

Meta CTR benchmarks (video/social ads):
| Metric | Watch For |
|---|---|
| CTR | < 1% = low for video TOF; < 0.5% = urgent |
| LP View Rate | < 25% = page load issue; > 40% = strong |
| Frequency | > 2.5 = audience fatigue, rotate creative |
| CPM | Spike >30% day-over-day = auction pressure |
| Learning phase | Each ad set needs ~50 conversion events to exit |

Compute DoD deltas (same format: ▲/▼/—).

### Step 2b — Pull GA4 Sessions for Meta Traffic

Pull GA4 data filtered to Meta paid traffic for the same date range:

```
Use Windsor.ai MCP tool `get_data`:
- source: "googleanalytics4"
- date_preset: "last_30d" (then filter to yesterday + day-before for DoD)
- fields: ["date", "source", "medium", "session_source_medium", "sessions", "bounce_rate"]
- Filter: session_source_medium contains "meta / paid_social"
```

### Step 2c — Compute Full Funnel (Meta Ads → GA4)

Cross-reference Meta Ads clicks with GA4 sessions from Meta paid traffic:

| Metric | Formula | Benchmark |
|---|---|---|
| Click-to-Session Rate | GA4 paid_social sessions / Meta clicks | Good: 80-90%, Warn: 70-80%, Critical: <70% |
| Weighted Bounce Rate | sum(sessions × bounce_rate) / total_sessions | Warn: >85%, Critical: >90% |

⚠️ **Zero paid traffic alert:** If GA4 shows 0 sessions from `meta / paid_social` for 3+ consecutive days, flag as critical: "Meta paid traffic not reaching site — check UTM parameters, pixel, or landing page."

### Step 3 — Save Intermediate JSON

Save to `tmp/meta-{YYYY-MM-DD}.json` where the date is **yesterday's date**.

⚠️ **Windsor limitations for Facebook:** No ad_set/ad breakdown, no lp_views, no conversions. Campaign is the lowest breakdown. Only use fields Windsor actually returns: `campaign`, `clicks`, `impressions`, `ctr`, `spend`, `reach`.

```json
{
  "report_date": "YYYY-MM-DD",
  "generated_at": "ISO timestamp",
  "meta_ads": {
    "no_active_campaigns": false,
    "account_totals": {
      "spend_usd": 0.0,
      "spend_sgd": 0.0,
      "clicks": 0,
      "impressions": 0,
      "ctr_pct": 0.0,
      "reach": 0,
      "cpa_sgd": 0.0
    },
    "account_dod": { "spend": "▲ +5%", "clicks": "▼ -8%", "reach": "—", "ctr": "—", "impressions": "—" },
    "campaigns": [
      {
        "name": "", "impr": 0, "clicks": 0, "ctr_pct": 0.0,
        "spend_sgd": 0.0, "reach": 0, "dod": ""
      }
    ],
    "ad_sets": [],
    "ads": [],
    "flags": {
      "urgent": ["flag text"],
      "optimize": ["flag text"],
      "monitoring": ["flag text"]
    }
  }
}
```

⚠️ **`ad_sets` and `ads` arrays will be empty** when using Windsor (campaign-level only). The template handles this gracefully — it shows "No ad set data available." The fields exist so that if a future data source provides ad-level data, it renders automatically.

After saving, log to `memory/YYYY-MM-DD.md`:
```markdown
## meta-data-pull — [ISO timestamp]
- Report date: [date]
- Meta Ads: Spend [currency] [x] (USD [x]) / [clicks] clicks / [reach] reach
- Saved: tmp/meta-[date].json
```

---

## Phase 3 — Email Stitcher (`paid-ads-email-sender`)

Runs 15 minutes after Phase 1 & 2 start.

### Step 1 — Load Intermediate Files

Determine yesterday's date. Look for:
- `tmp/gads-{YYYY-MM-DD}.json`
- `tmp/meta-{YYYY-MM-DD}.json`

**If one or both files are missing:** Wait 2 minutes and retry once. If still missing after retry, send email anyway with a note: `⚠️ [Google Ads / Meta Ads] data unavailable — data pull job did not complete in time.` Use an empty/paused placeholder section for the missing platform.

### Step 2 — Build Email JSON Payload

Email title: **"📊 Paid Ads Daily Brief — [DD Mon YYYY]"**

⚠️ **Do NOT generate HTML.** Build a JSON object with the data below. The server-side template (`paid-ads-brief.ts`) handles all rendering, styling, tables, and layout.

Build the JSON payload from the intermediate files. The structure matches `fiveagents_log_run` metrics with these additional top-level fields:

```json
{
  "date": "YYYY-MM-DD",
  "brief_type": "daily",
  "report_date": "DD Mon YYYY",
  "brand": "{brand}",
  "currency": "<read from brands/{brand}/brand.md — e.g. Rp, SGD, USD>",
  "generated_at": "ISO timestamp",
  "google_ads": {
    "all_campaigns_paused": false,
    "account_totals": { "spend_sgd": 0, "clicks": 0, "impressions": 0, "ctr_pct": 0, "conversions": 0, "cpa_sgd": 0 },
    "account_dod": { "spend": "▲ +5%", "clicks": "▼ -8%", "conv": "—", "ctr": "—", "cpa": "—", "impressions": "—" },
    "campaigns": [{ "name": "", "status": "", "spend_sgd": 0, "clicks": 0, "impr": 0, "ctr_pct": 0, "conv": 0, "cpa_sgd": 0, "dod": "" }],
    "ad_groups": [{ "name": "", "campaign": "", "status": "", "clicks": 0, "impr": 0, "ctr_pct": 0, "cost_sgd": 0, "dod": "" }],
    "ads": [{ "headline_1": "", "campaign": "", "ad_group": "", "clicks": 0, "impr": 0, "ctr_pct": 0, "cost_sgd": 0, "conv": 0, "dod": "" }],
    "keywords": [{ "keyword": "", "campaign": "", "clicks": 0, "ctr_pct": 0, "cost_sgd": 0, "conv": 0, "dod": "" }],
    "flags": { "urgent": [], "optimize": [], "monitoring": [] },
    "notes": ["any data warnings, e.g. 'GA4 data unavailable via Windsor.ai'"],
    "top_recommendation": ""
  },
  "meta_ads": {
    "no_active_campaigns": false,
    "account_totals": { "spend_sgd": 0, "clicks": 0, "impressions": 0, "ctr_pct": 0, "reach": 0, "cpa_sgd": 0 },
    "account_dod": { "spend": "", "clicks": "", "reach": "", "ctr": "", "impressions": "" },
    "campaigns": [{ "name": "", "impr": 0, "clicks": 0, "ctr_pct": 0, "spend_sgd": 0, "reach": 0, "dod": "" }],
    "ad_sets": [],
    "ads": [],
    "flags": { "urgent": [], "optimize": [], "monitoring": [] }
  },
  "ga4": {
    "sessions_total": 0,
    "paid_search_sessions": 0,
    "meta_sessions": 0,
    "funnel": {},
    "funnel_flags": []
  },
  "top_recommendation": "Single most impactful action — name the specific campaign/ad set."
}
```

**Analysis guidelines** (apply when writing flags and top_recommendation):
- Do NOT flag signup form unless 3+ consecutive days of data show >80% abandonment.
- On Day 1–3 of Meta: focus on learning phase signals.
- On Google Ads paused days: recommendation should focus on Meta or pre-reactivation prep.
- Tone: direct, expert, no fluff. Name specific campaigns.

**Currency:** Read from `brands/{brand}/brand.md`. The template uses the `currency` field for all money labels.

**For weekly briefs:** Set `"brief_type": "weekly"`, add `"week_start"` and `"week_end"` fields, use `account_wow` / `wow` keys instead of `account_dod` / `dod`.

### Step 3 — Send Email

**Try `fiveagents_send_email` first** (Postmark — requires Basic or Active maintenance plan):

```
fiveagents_send_email({
  fiveagents_api_key: $FIVEAGENTS_API_KEY,
  to: $REPORT_EMAIL,
  subject: "📊 Paid Ads Daily Brief — DD Mon YYYY",
  html_body: JSON.stringify(payload_from_step_2),
  tag: "paid-ads-daily"
})
```

⚠️ **Subject date** must be the report date, not today. Format: `DD Mon YYYY` (e.g., "27 Mar 2026").

⚠️ **`html_body` must be a JSON string** — the server-side template parses it and renders the styled HTML. Do NOT send raw HTML.

⚠️ **`tag` must be exactly `"paid-ads-daily"` or `"paid-ads-weekly"`** — this is how the server routes to the correct template renderer.

**If `fiveagents_send_email` returns 403** ("requires a maintenance plan"), fall back to Gmail MCP:
- Use `gmail_create_draft` to create a draft email with the HTML body
- Tell the user: "Email draft created in Gmail — send manually. Upgrade to a maintenance plan for automated sending via Postmark."

### Step 5 — Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

Send a DM to the user (user ID: `$SLACK_NOTIFY_USER`) via Slack MCP with a brief summary:

```
📊 [{brand}] Daily Brief Sent — [DD Mon YYYY]
• Google Ads: [currency] [x] spend / [clicks] clicks / [conv] conv
• Meta Ads: [currency] [x] spend / [clicks] clicks / [reach] reach
• GA4: [paid_search] paid search / [meta] meta sessions / [trials] trials
• 🔴 Top flag: [most urgent flag]
• 💡 Top rec: [one-line recommendation]
```

Use `slack_send_message` with `channel_id: "$SLACK_NOTIFY_USER"`.

### Step 6 — Log to Memory

Append to `memory/YYYY-MM-DD.md`:

```markdown
## Paid Ads Daily Brief — [ISO timestamp]
- Skill: digital-marketing-analyst (stitcher)
- Report period: [date]
- Google Ads: [status] / Spend [currency] [x] / [clicks] clicks / [conv] conv / CPA [currency] [x]
- Meta Ads: [status] / Spend [currency] [x] (USD [x]) / [clicks] clicks / [reach] reach
- GA4: [paid_search_sessions] paid search sessions / [meta_sessions] meta sessions / [trials] trials / [paid] paid
- Key flags: [top 2-3 urgent]
- Top recommendation: [the one action]
- Email sent: $REPORT_EMAIL
- Gmail message_id: [id]
```

---

## Weekly Workflow

The weekly brief uses the same 3-job architecture as the daily brief:

| Job | Cron | What it does | Output |
|---|---|---|---|
| `gads-weekly-data-pull` | Sat cron schedule | Google Ads + GA4 weekly pull + analysis | `tmp/gads-weekly-{week_end}.json` |
| `meta-weekly-data-pull` | Sat cron schedule | Meta Ads weekly pull + analysis | `tmp/meta-weekly-{week_end}.json` |
| `paid-ads-weekly-email-sender` | Sat cron schedule + 15min | Reads both JSONs, builds JSON payload, sends via Postmark | Email to $REPORT_EMAIL |

**JSON schema:** same as daily — use `wow` key instead of `dod` in all campaign/ad/keyword rows. Add `week_start` and `week_end` fields at root level.

Run this workflow when triggered by `gads-weekly-data-pull` or `meta-weekly-data-pull` (Saturdays at cron schedule).

**Week definition:** Sunday–Saturday. On Saturday morning, report covers the full past week (last Sunday to yesterday/Friday).

⚠️ **Data reliability:** Do not include any data before 2026-03-08. If week_start falls before Mar 8, use Mar 8 as the start date.

⚠️ **Never fall back to a prior week's data.** If Google Ads Sheets or Meta API return zero for this week's date range, report both as "No Active Campaigns" for the week — do not substitute data from a previous week. Both platforms must cover the **same date range**. Zero spend for the week is valid data.

---

### Step 1 — Pull Weekly Google Ads Data

Pull weekly Google Ads data via **Windsor.ai MCP**:

```
Use Windsor.ai MCP tool `get_data`:
- source: "google_ads"
- date_preset: "last_30d"
- fields: ["date", "campaign", "campaign_status", "ad_group", "clicks", "impressions", "ctr", "cost", "conversions", "cpa"]
```

Filter results for the target week range. Also pull prior week for WoW comparison.

### Step 1b — Pull Weekly Meta Ads Data

```
Use Windsor.ai MCP tool `get_data`:
- source: "facebook"
- date_preset: "last_30d"
- fields: ["date", "campaign", "clicks", "impressions", "ctr", "spend", "reach"]
```

Filter for the target week. Convert USD spend to the brand's local currency using the exchange rate from `brands/{brand}/brand.md`. Include WoW comparison from prior week.

### Step 1c — Pull Weekly GA4 Data

```
Use Windsor.ai MCP tool `get_data`:
- source: "googleanalytics4"
- date_preset: "last_30d"
- fields: ["date", "source", "medium", "session_source_medium", "sessions", "bounce_rate"]
```

Filter for the target week range.

### Step 2 — Analyze Weekly Performance

- Compare this week vs last week (WoW) for all metrics
- Flag consistently underperforming keywords/ads across the week
- Identify budget pacing issues and learning phase status for Meta
- Note if Meta ad sets exited learning phase (need ~50 conversion events each)

### Step 3 — Build Weekly JSON Payload

Same JSON structure as daily (see Step 2 above) with these differences:
- `"brief_type": "weekly"`
- Add `"week_start": "YYYY-MM-DD"` and `"week_end": "YYYY-MM-DD"` at root
- Use `account_wow` instead of `account_dod` in google_ads/meta_ads
- Use `wow` instead of `dod` in all campaign/ad/keyword rows

The server-side template automatically handles WoW labels, "Fix Before Next Week" flag labels, and "Top Recommendation for Next Week" heading based on `brief_type`.

### Step 4 — Send Weekly Email

```
fiveagents_send_email({
  fiveagents_api_key: $FIVEAGENTS_API_KEY,
  to: $REPORT_EMAIL,
  subject: "📊 Paid Ads Weekly Brief — Week of DD Mon YYYY",
  html_body: JSON.stringify(payload_from_step_3),
  tag: "paid-ads-weekly"
})
```

**If 403**, fall back to `gmail_create_draft` (same as daily Step 3 fallback).

### Step 6 — Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

DM the user (`$SLACK_NOTIFY_USER`) via Slack MCP:

```
📊 [{brand}] Weekly Brief Sent — Week of [DD Mon YYYY]
• Google Ads: [currency] [x] spend / [clicks] clicks / [conv] conv / WoW: [+/-x%] spend
• Meta Ads: [currency] [x] spend / [clicks] clicks / [reach] reach / WoW: [+/-x%] spend
• GA4: [sessions] sessions / [trials] trials
• 🔴 Top flag: [most urgent flag]
• 💡 Top rec for next week: [one-line recommendation]
```

### Step 7 — Log to Memory

```markdown
## Paid Ads Weekly Brief — [ISO timestamp]
- Skill: digital-marketing-analyst (weekly)
- Report period: [week_start] to [week_end]
- Google Ads: [status] / Spend [currency] [x] / [clicks] clicks / [conv] conv / CPA [currency] [x] / WoW: [+/-x%]
- Meta Ads: [status] / Spend [currency] [x] (USD [x]) / [clicks] clicks / [reach] reach / WoW: [+/-x%]
- GA4: [sessions] sessions / [trials] trials / [paid] paid
- WoW: Spend [+/-x%] / Conv [+/-x%] / CPA [+/-x%]
- Key flags: [top 2-3]
- Top recommendation for next week: [the one action]
- Email sent: $REPORT_EMAIL
- Gmail message_id: [id]
```

---

## Notes

- **Data sources:** All ads/analytics data pulled via Windsor.ai MCP connector (`get_data` tool). Google Ads, Meta Ads (Facebook), and GA4 are all connected in Windsor.
- **Email sending:** Use `fiveagents_send_email` (Postmark, requires Basic/Active maintenance plan). Falls back to `gmail_create_draft` if client has no maintenance plan (403).
- **Windsor data lag:** Google Ads ~12 days, Facebook ~12 days, GA4 ~0 days. Always check `max(date)` to confirm most recent available data.
- **Currency:** Google Ads cost is in the account's local currency. Facebook spend is USD — convert using the exchange rate from `brands/{brand}/brand.md`.
- GA4 clean data start: **2026-03-08** — never pull or compare pre-Mar 8 data.
- Brand-specific known issues should be documented in `brands/{brand}/funnel.md` notes section.
- If one platform has no data yet, still send email with available data. Note the gap.
- Future data sources to add: TikTok Ads (when connected to Windsor)

---

## Final Step — Log to Dashboard

After the skill completes, log the run to Supabase. The `metrics` JSONB must match the schema in `docs/new_agent_onboarding/metrics-spec.md` — the dashboard renders widgets from these exact key paths.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "digital-marketing-analyst"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars — shown in activity feed>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "brief_type": "<daily|weekly>",
    "google_ads": {
      "totals": { "spend": 0, "clicks": 0, "impr": 0, "ctr": 0, "conv": 0, "cpa": 0 },
      "campaigns": [{ "name": "", "status": "", "spend": 0, "clicks": 0, "ctr": 0, "conv": 0, "cpa": 0 }],
      "ad_groups": [{ "name": "", "campaign": "", "status": "", "clicks": 0, "impr": 0, "ctr": 0, "cost": 0 }],
      "keywords": [{ "keyword": "", "campaign": "", "clicks": 0, "ctr": 0, "cost": 0, "conv": 0 }]
    },
    "google_ads_funnel": [
      { "stage": "Impressions", "volume": 0, "rate": null, "cost_per": 0, "benchmark": null, "status": null }
    ],
    "meta_ads": {
      "totals": { "spend": 0, "clicks": 0, "impr": 0, "ctr": 0, "lp_views": 0, "cpm": 0 },
      "campaigns": [{ "name": "", "impr": 0, "clicks": 0, "ctr": 0, "lp_views": 0, "lp_rate": 0, "spend": 0, "cpc": 0, "cpm": 0 }],
      "ad_sets": [{ "name": "", "campaign": "", "impr": 0, "clicks": 0, "ctr": 0, "lp_views": 0, "spend": 0, "reach": 0 }],
      "ads": [{ "name": "", "campaign": "", "impr": 0, "clicks": 0, "ctr": 0, "lp_views": 0, "video_views": 0, "spend": 0 }]
    },
    "meta_ads_funnel": [
      { "stage": "Impressions", "volume": 0, "rate": null, "cost_per": 0, "benchmark": null, "status": null }
    ],
    "combined_summary": {
      "google_ads": { "spend": 0, "clicks": 0, "lp_views": null, "ga4_sessions": 0, "trials": 0, "cpa": 0, "status": "Active" },
      "meta_ads": { "spend": 0, "clicks": 0, "lp_views": 0, "ga4_sessions": 0, "trials": 0, "cpa": 0, "status": "Active" },
      "total": { "spend": 0, "clicks": 0, "lp_views": 0, "ga4_sessions": 0, "trials": 0 }
    },
    "flags": { "urgent": ["..."], "optimize": ["..."], "monitoring": ["..."] },
    "top_recommendation": "...",
    "gmail_message_id": "..."
  }
```

**Status values:** `success` (all data pulled + email sent), `partial` (one platform missing), `failed` (skill errored).
**All numeric values must be numbers, not strings** — enables DoD/WoW comparison on the dashboard.
