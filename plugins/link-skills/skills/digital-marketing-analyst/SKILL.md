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
- date_preset: "last_30dT" (includes today — never use "last_30d" which excludes the current UTC day)
- fields: ["date", "campaign", "campaign_status", "ad_group", "clicks", "impressions", "ctr", "cost", "conversions", "cpa"]
```

⚠️ **Known issues:**
- `keyword` field returns null — omit keyword table
- `ad_group` returns raw resource paths, not human-readable names
- `cost` is returned in the account's local currency (no conversion needed)
- Data is near-real-time — no lag. Use yesterday's date as the report date; today's data may be partial.

Pull data for **two dates** — yesterday + the day before for DoD comparison.

If yesterday is a Monday, note "Weekend — structurally lower volume" for DoD comparisons.

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
- date_preset: "last_30dT"
- fields: ["date", "session_source_medium", "sessions", "bounce_rate"]
```

Filter results for the report date. Segment by `session_source_medium`:
- `meta / paid_social` → Meta Ads sessions (paid)
- `google / cpc` → Google Ads sessions (paid)

⚠️ **Invalid fields** (not in Windsor for GA4): `source`, `session_source`, `session_medium` — use only `session_source_medium`.
⚠️ **GA4 data is near-real-time** in Windsor — yesterday's data is available immediately.

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

**Branch on `META_ADS_SOURCE` env var** (saved by brand-setup Step 7c, loaded into `os.environ` by the credential loader in `CLAUDE.md`). Windsor.ai is the universal default because every brand has it connected with Meta Ads — the optional Meta Ads MCP just lets some accounts opt into Marketing-API-direct access:
- `META_ADS_SOURCE` unset (default) → use **Windsor.ai for Meta** — universal path, works for every brand
- `META_ADS_SOURCE=meta_ads_mcp` → use **Meta Ads MCP** — user explicitly opted in during brand-setup because their account had MCP rollout access. If the MCP errors at runtime, fall back to Windsor.ai (it's always connected with Meta Ads, per brand-setup Step 7c).

#### Windsor.ai — universal default (recommended path)

Pull Meta data via the existing Windsor.ai MCP connector with `source: "facebook"`. This is the path used unless the user opted into the MCP. Windsor.ai's Facebook source has near-parity with Meta's Marketing API — campaign / ad-set / ad breakdowns, landing-page views, video views, and conversion actions are all surfaced under their Windsor field names. Use this request shape:

```
Use Windsor.ai MCP tool `get_data`:
- source: "facebook"
- date_preset: "last_30dT" (includes today — never use "last_30d" which excludes the current UTC day)
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

**Field mapping — Windsor.ai field names for the canonical Meta dimensions:**

| Canonical (MCP-style) field | Windsor.ai equivalent |
|---|---|
| campaign / campaign status | `campaign` / `campaign_effective_status` |
| ad_set | `adset_name` (with `adset_id`, `adset_effective_status`) |
| ad | `ad_name` (with `ad_id`) |
| clicks / impressions / ctr / spend / reach | same names: `clicks`, `impressions`, `ctr`, `spend`, `reach` |
| frequency / cpm / cpc | same names: `frequency`, `cpm`, `cpc` |
| lp_views (landing page views) | `actions_landing_page_view` |
| video_views (3-sec plays) | `actions_video_view` (also `cost_per_thruplay_video_view` for ThruPlays) |
| conversions | `actions_*` family — pick by the brand's funnel objective from `brands/{brand}/funnel.md`: e.g. `actions_omni_purchase` (e-commerce), `actions_lead` / `actions_offsite_conversion_fb_pixel_lead` (lead-gen), `actions_complete_registration` (SaaS signup), `actions_mobile_app_install` (apps). For cost-per-conversion use the matching `cost_per_action_type_<event>` field. |

If `funnel.md` doesn't pin a specific Meta conversion event, pull the broad set (`actions_lead`, `actions_omni_purchase`, `actions_complete_registration`) and report whichever returns non-zero values.

Filter results for the report date and roll up by `adset_name` / `adset_id` and `ad_name` / `ad_id` for the ad-set / ad arrays, and aggregate up to campaign / account totals.

#### Meta Ads MCP — opt-in alternative (only when `META_ADS_SOURCE=meta_ads_mcp`)

Pull via the **Meta Ads MCP** custom connector (`https://mcp.facebook.com/ads`) — Meta's official MCP for Facebook + Instagram campaign data. Use this only when the user explicitly added the connector during brand-setup; otherwise stick with the Windsor default above.

At runtime, list the Meta Ads MCP's available tools and pick the one that returns campaign-level insights for the requested date range. Typical request shape:

- **Ad accounts:** the brand's connected Meta Business ad accounts (the MCP knows these from the OAuth session)
- **Date range:** yesterday's date in the brand's timezone (also fetch the prior day for DoD comparison)
- **Required fields:** campaign name + status, clicks, impressions, ctr, spend, reach
- **Drill-down:** ad_set, ad, lp_views (landing page views), video_views, conversions, frequency, cpm, cpc

**Runtime fallback:** if the MCP errors (auth, rate limit, listing failure), fall back to the Windsor.ai path above using the same field map. Windsor is always connected with Meta Ads per brand-setup Step 7c, so the fallback is guaranteed to work — log a warning to memory but do not fail the run.

#### Common to both paths

⚠️ Data is near-real-time — no lag. Use yesterday's date as the report date; today's data may be partial.

- **Currency:** Meta `spend` is USD. Convert to the brand's local currency using the exchange rate from `brands/{brand}/brand.md`.
- **Date resolution:** Use the brand's timezone from `brands/{brand}/brand.md` for dates.
- Record which path was used in the intermediate JSON (`meta_ads.source: "meta_ads_mcp" | "windsor"`) so the dashboard knows whether ad-set / conversion gaps are real or just a fallback artifact.

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
- date_preset: "last_30dT"
- fields: ["date", "session_source_medium", "sessions", "bounce_rate"]
- Filter: session_source_medium contains "meta / paid_social"
```

⚠️ **Invalid fields** (not in Windsor for GA4): `source`, `session_source`, `session_medium` — use only `session_source_medium`.

### Step 2c — Compute Full Funnel (Meta Ads → GA4)

Cross-reference Meta Ads clicks with GA4 sessions from Meta paid traffic:

| Metric | Formula | Benchmark |
|---|---|---|
| Click-to-Session Rate | GA4 paid_social sessions / Meta clicks | Good: 80-90%, Warn: 70-80%, Critical: <70% |
| Weighted Bounce Rate | sum(sessions × bounce_rate) / total_sessions | Warn: >85%, Critical: >90% |

⚠️ **Zero paid traffic alert:** If GA4 shows 0 sessions from `meta / paid_social` for 3+ consecutive days, flag as critical: "Meta paid traffic not reaching site — check UTM parameters, pixel, or landing page."

### Step 3 — Save Intermediate JSON

Save to `tmp/meta-{YYYY-MM-DD}.json` where the date is **yesterday's date**.

**Both paths populate the same JSON shape.** Windsor's field names differ from the Meta Ads MCP's, but the data covers the same dimensions (ad-set, ad, lp_views, video_views, conversions). Map Windsor's `adset_name` → `ad_sets[].name`, `ad_name` → `ads[].name`, `actions_landing_page_view` → `lp_views`, `actions_video_view` → `video_views`, and the brand's chosen `actions_*` conversion field → conversion fields.

**Always set the `source` field inside the `meta_ads` block** — `"windsor"` (default path) or `"meta_ads_mcp"` (opt-in path). The dashboard uses this to know which field-name space the data came from when surfacing data-quality alerts. If the run started on the MCP path but failed over to Windsor, set `"source": "windsor"` (the source of the *data actually used*, not the path attempted first).

```json
{
  "report_date": "YYYY-MM-DD",
  "generated_at": "ISO timestamp",
  "meta_ads": {
    "source": "meta_ads_mcp | windsor",
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

**`ad_sets` and `ads` arrays:** On Path A, populate from the MCP response (Meta's Marketing API returns ad-set and ad-level breakdowns). On Path B, populate by aggregating Windsor rows on `adset_name` / `adset_id` and `ad_name` / `ad_id`. If either path genuinely returns no ad-set / ad rows for a brand (e.g. account uses Advantage+ campaigns with the breakdowns hidden), leave the arrays empty — the template renders "No ad set data available." gracefully.

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
    "source": "meta_ads_mcp | windsor",
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
- date_preset: "last_30dT"
- fields: ["date", "campaign", "campaign_status", "ad_group", "clicks", "impressions", "ctr", "cost", "conversions", "cpa"]
```

Filter results for the target week range. Also pull prior week for WoW comparison.

### Step 1b — Pull Weekly Meta Ads Data

**Branch on `META_ADS_SOURCE`** — same rule as Phase 2 Step 1 in the daily flow:

- **Default (env var unset)** — Pull via **Windsor.ai** with `source: "facebook"` using the field set documented in Phase 2 Step 1 (campaign / `adset_name` / `ad_name` / `clicks` / `impressions` / `ctr` / `spend` / `reach` / `frequency` / `cpm` / `cpc` / `actions_landing_page_view` / `actions_video_view` / brand-specific `actions_*` conversion field). `date_preset: "last_30dT"`. Pull the target week plus the prior week for WoW comparison.
- **Opt-in (`META_ADS_SOURCE=meta_ads_mcp`)** — Pull via the **Meta Ads MCP** custom connector (`https://mcp.facebook.com/ads`). Request campaign-level fields (campaign, clicks, impressions, ctr, spend, reach) plus drill-down (ad_set, ad, lp_views, conversions, cpm, frequency) for the target week range, plus the prior week for WoW comparison. On MCP error, fall back to the Windsor path.

Filter for the target week. Convert USD spend to the brand's local currency using the exchange rate from `brands/{brand}/brand.md`. Include WoW comparison from prior week.

### Step 1c — Pull Weekly GA4 Data

```
Use Windsor.ai MCP tool `get_data`:
- source: "googleanalytics4"
- date_preset: "last_30dT"
- fields: ["date", "session_source_medium", "sessions", "bounce_rate"]
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

- **Data sources:** Google Ads, GA4, and Meta Ads (Facebook + Instagram) data are all pulled via the **Windsor.ai MCP** connector (`get_data` tool) by default — Windsor is the universal source for every brand. When `META_ADS_SOURCE=meta_ads_mcp` (the user opted into the optional Meta Ads custom connector at `https://mcp.facebook.com/ads`), Meta data is pulled from the MCP instead, with automatic fallback to Windsor on MCP error. Both Meta paths cover the same dimensions — campaign / ad-set / ad / lp_views / video_views / conversions — under different field names; see the field map in Phase 2 Step 1. Always record `meta_ads.source` in the JSON so the dashboard knows which field-name space the data came from.
- **Email sending:** Use `fiveagents_send_email` (Postmark, requires Basic/Active maintenance plan). Falls back to `gmail_create_draft` if client has no maintenance plan (403).
- **Data lag:** Windsor.ai (Google Ads, GA4, Meta) and the Meta Ads MCP are all near-real-time — no significant lag. For Windsor calls, always use `last_30dT` (not `last_30d`) so today's UTC data is included. Report on yesterday's date; today may be partial.
- **Currency:** Google Ads cost is in the account's local currency. Meta Ads spend is USD — convert using the exchange rate from `brands/{brand}/brand.md`.
- GA4 clean data start: **2026-03-08** — never pull or compare pre-Mar 8 data.
- Brand-specific known issues should be documented in `brands/{brand}/funnel.md` notes section.
- If one platform has no data yet, still send email with available data. Note the gap.
- Future data sources to add: TikTok Ads (when an official MCP becomes available)

---

## Final Step — Log to Dashboard

After the skill completes, log the run to Supabase. The `metrics` JSONB must match the schema in `docs/new_agent_onboarding/metrics-spec.md` — the dashboard renders widgets from these exact key paths.

⚠️ **Critical: populate every field with ACTUAL values computed during this run.** The schema below shows field names and types only — every numeric field must be replaced with the real number from the analysis. Do NOT copy zeros or empty strings. A log entry with zeros is worse than no entry — it overwrites real data with blanks.

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
    "date": "<report_date YYYY-MM-DD>",
    "brief_type": "<daily|weekly>",
    "google_ads": {
      "totals": {
        "spend": <actual total cost in local currency>,
        "clicks": <actual total clicks>,
        "impr": <actual total impressions>,
        "ctr": <actual avg CTR as decimal, e.g. 0.028>,
        "conv": <actual total conversions>,
        "cpa": <actual CPA or null if no conversions>
      },
      "campaigns": [
        {
          "name": "<campaign name>",
          "status": "<ENABLED|PAUSED>",
          "spend": <actual spend>,
          "clicks": <actual clicks>,
          "ctr": <actual ctr>,
          "conv": <actual conversions>,
          "cpa": <actual cpa or null>
        }
      ],
      "ad_groups": [
        { "name": "<ad group path>", "campaign": "<campaign name>", "status": "<status>", "clicks": <actual>, "impr": <actual>, "ctr": <actual>, "cost": <actual> }
      ],
      "keywords": []
    },
    "google_ads_funnel": [
      { "stage": "Impressions", "volume": <actual>, "rate": null, "cost_per": null, "benchmark": null, "status": null },
      { "stage": "Clicks", "volume": <actual>, "rate": <ctr decimal>, "cost_per": <actual cpc>, "benchmark": 0.02, "status": "<on_track|watch|critical>" },
      { "stage": "GA4 Sessions", "volume": <actual ga4 cpc sessions>, "rate": <click_to_session_rate>, "cost_per": null, "benchmark": 0.8, "status": "<status>" },
      { "stage": "Conversions", "volume": <actual>, "rate": <conv_rate>, "cost_per": <actual cpa or null>, "benchmark": null, "status": "<status>" }
    ],
    "meta_ads": {
      "totals": {
        "spend": <actual spend in local currency>,
        "clicks": <actual clicks>,
        "impr": <actual impressions>,
        "ctr": <actual ctr decimal>,
        "lp_views": null,
        "cpm": <actual cpm>
      },
      "campaigns": [
        {
          "name": "<campaign name>",
          "impr": <actual>,
          "clicks": <actual>,
          "ctr": <actual>,
          "lp_views": null,
          "lp_rate": null,
          "spend": <actual in local currency>,
          "cpc": <actual>,
          "cpm": <actual>
        }
      ],
      "ad_sets": [],
      "ads": []
    },
    "meta_ads_funnel": [
      { "stage": "Impressions", "volume": <actual>, "rate": null, "cost_per": null, "benchmark": null, "status": null },
      { "stage": "Clicks", "volume": <actual>, "rate": <ctr decimal>, "cost_per": <actual cpc>, "benchmark": 0.01, "status": "<status>" },
      { "stage": "GA4 Sessions (Meta)", "volume": <actual meta ga4 sessions>, "rate": <click_to_session>, "cost_per": null, "benchmark": 0.8, "status": "<status>" }
    ],
    "combined_summary": {
      "google_ads": { "spend": <actual>, "clicks": <actual>, "lp_views": null, "ga4_sessions": <actual cpc sessions>, "trials": <actual or 0>, "cpa": <actual or null>, "status": "<Active|Paused|No Data>" },
      "meta_ads": { "spend": <actual>, "clicks": <actual>, "lp_views": null, "ga4_sessions": <actual meta sessions>, "trials": <actual or 0>, "cpa": null, "status": "<Active|Paused|No Data>" },
      "total": { "spend": <sum of both platforms in local currency>, "clicks": <sum>, "lp_views": null, "ga4_sessions": <sum>, "trials": <sum> }
    },
    "flags": { "urgent": ["<actual flag text>"], "optimize": ["<actual flag text>"], "monitoring": ["<actual flag text>"] },
    "top_recommendation": "<actual recommendation — name the specific campaign>",
    "gmail_message_id": "<message_id from send step or null>"
  }
```

**Status values:** `success` (all data pulled + email sent), `partial` (one platform missing or email failed), `failed` (skill errored before completion).
**All numeric fields must be numbers, not strings** — the dashboard uses these for DoD/WoW math. `null` is valid when a metric is unavailable (e.g. CPA with 0 conversions). With the Meta Ads MCP, `lp_views` and conversion-derived fields are now expected to be populated whenever the MCP returns them — only set them to `null` if Meta itself returned no value.
