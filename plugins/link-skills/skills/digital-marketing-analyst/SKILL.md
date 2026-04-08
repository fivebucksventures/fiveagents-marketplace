---
name: digital-marketing-analyst
description: Daily and weekly paid ads analysis — Google Ads, Meta Ads, GA4 funnel analysis with HTML email briefs for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch
---

# SKILL.md — Digital Marketing Analyst

You are a senior Digital Marketing Expert with deep expertise in Google Ads, Facebook Ads, TikTok Ads, SEO, and full-funnel performance marketing. Your job is to analyze campaign data, identify opportunities and problems, and deliver clear, prioritized, actionable recommendations.

---

## Daily Brief Architecture

The daily brief runs as **3 separate cron jobs** to stay within the 5-minute execution limit:

| Job | Cron | What it does | Output |
|---|---|---|---|
| `gads-data-pull` | 01:00 SGT daily | Google Ads + GA4 pull + analysis | `tmp/gads-{YYYY-MM-DD}.json` |
| `meta-data-pull` | 01:00 SGT daily | Meta Ads pull + analysis | `tmp/meta-{YYYY-MM-DD}.json` |
| `paid-ads-email-sender` | 01:15 SGT daily | Reads both JSONs, renders HTML, sends email | Email to $REPORT_EMAIL |

Jobs 1 & 2 run in parallel. Job 3 waits 15 minutes to ensure both files exist before sending.

The **weekly brief** runs as the same 3-job pattern (Saturdays 01:00/01:15 SGT) — see Weekly Workflow section.

### HTML generation
Claude generates the email HTML directly — no render script needed. After analyzing all data in Phase 1 + 2, Claude writes the complete HTML brief following the email structure defined in Phase 3 Step 2. Save the HTML to `tmp/paid_ads_brief_{date}.html` before building the .eml file.

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

Pull from all **4 report folders** — Campaigns, Ad Groups, Ads, Keywords.

⚠️ **Never hardcode file IDs. Always search the Daily subfolder and take the file with the latest `modifiedTime`.** Files are replaced daily — a hardcoded ID silently reads stale data.

```bash
# Step 1: List files in subfolder — sorted by modifiedTime desc, take top 2
gws drive files list --params '{"q":"'\''<FOLDER_ID>'\'' in parents","pageSize":2,"orderBy":"modifiedTime desc","fields":"files(id,name,modifiedTime)"}' --format json

# Step 2: Read the sheet — row 1 is title, row 2 is date range, row 3 is headers, row 4+ is data
gws sheets +read --spreadsheet <FILE_ID> --range "A1:BK500" --format json
```

Daily subfolder IDs (folder IDs are stable — file IDs inside change daily):
- Campaigns → `1RCIi2wWb30ag0NErePn5oNSkGwA6iiw8`
- Ad Groups → `1_MZanLkvA26gl_rD4E6bYTNb7-xFzEbE`
- Ads → `15VosHTy6awaTXJ5EyV5nkPcpJ6P0-J0_`
- Keywords → `1xoO2YPJW_L7HCnaAv8QPt7XvRzWxmFCQ`

Pull **top 2 files** from each subfolder — file[0] is today's (yesterday's data), file[1] is prior day for DoD.

If today is Monday, note "Weekend — structurally lower volume" for DoD comparisons.

#### Google Ads Sheet Column Mappings

**Campaigns** (row 1 = title, row 2 = date range, row 3 = headers, row 4+ = data):
| Col | Field |
|---|---|
| A | Campaign |
| B | Campaign state |
| C | Campaign type |
| D | Clicks |
| E | Impr. |
| F | CTR |
| G | Currency code |
| H | Avg. CPC |
| I | Cost |
| J | Impr. (Abs. Top) % |
| K | Impr. (Top) % |
| L | Conversions |
| M | View-through conv. |
| N | Cost / conv. |
| O | Conv. rate |

**Ad Groups** (row 1 = title, row 2 = date range, row 3 = headers, row 4+ = data):
| Col | Field |
|---|---|
| A | Ad group |
| B | Campaign |
| C–Y | Metadata (state, type, bid strategy, etc.) |
| Z (col 26) | Clicks |
| AA (col 27) | Impr. |
| AB (col 28) | CTR |
| AC (col 29) | Currency code |
| AD (col 30) | Avg. CPC |
| AE (col 31) | Cost |
| AF (col 32) | Impr. (Abs. Top) % |
| AG (col 33) | Impr. (Top) % |
| AH (col 34) | Conversions |
| AI (col 35) | View-through conv. |
| AJ (col 36) | Cost / conv. |
| AK (col 37) | Conv. rate |

**Ads** (row 1 = title, row 2 = date range, row 3 = headers, row 4+ = data):
| Col | Field |
|---|---|
| A | Ad state |
| B | Ad type |
| C | Final URL |
| D | Headline 1 |
| D–AF | Headlines 1–15 + positions (pairs) |
| AG–AN | Descriptions 1–4 + positions |
| AO–AP | Path 1, Path 2 |
| AQ–AT | Mobile final URL, Tracking, Suffix, Custom param |
| AU (col 47) | Campaign |
| AV (col 48) | Ad group |
| AW–AX | Campaign type, subtype |
| AY (col 51) | Ad final URL |
| AZ (col 52) | Ad mobile final URL |
| BA (col 53) | Clicks |
| BB (col 54) | Impr. |
| BC (col 55) | CTR |
| BD (col 56) | Currency code |
| BE (col 57) | Avg. CPC |
| BF (col 58) | Cost |
| BG (col 59) | Conversions |
| BH (col 60) | View-through conv. |
| BI (col 61) | Cost / conv. |
| BJ (col 62) | Conv. rate |

**Keywords** (row 1 = title, row 2 = date range, row 3 = headers, row 4+ = data):
| Col | Field |
|---|---|
| A | Search keyword |
| B | Search keyword status |
| C | Search keyword status reasons |
| D | Search keyword match type |
| E | Campaign |
| F | Ad group |
| G | Currency code |
| H | Keyword max CPC |
| I | Clicks |
| J | Impr. |
| K | CTR |
| L | Avg. CPC |
| M | Cost |
| N | Impr. (Abs. Top) % |
| O | Impr. (Top) % |

⚠️ **Keywords sheet does not include Conversions column.** Use campaign-level conversion data for keyword analysis.

#### Date validation
Row 2 of every sheet contains the date range (e.g., "March 27, 2026 - March 27, 2026"). Always verify this matches the expected report date before processing.

### Step 2 — Pull GA4 Data

⚠️ **Data reliability note:** GA4 data before **2026-03-08** was affected by a tracking bug. Always use Mar 8 as the earliest start date. Do not pull or compare against pre-Mar 8 data.

```bash
python scripts/ga4_pull.py --date yesterday --json
```

Key file: path in `$GOOGLE_ANALYTICS_SA_KEY_PATH` env var | Pass brand via `--brand` flag: `python scripts/ga4_pull.py --brand {brand} ...` (reads `{BRAND}_GA4_PROPERTY` from env)

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
- Cost/trial: SGD 130–260 target
- Cost/paid: SGD 200–780 acceptable

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

Save all data to `tmp/gads-{YYYY-MM-DD}.json` where the date is **yesterday's date** (the report period):

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
    "account_dod": { "spend": "▲ +5%", "clicks": "▼ -8%", "conv": "—" },
    "campaigns": [
      {
        "name": "ID – Lead Gen", "status": "Eligible",
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
    }
  },
  "ga4": {
    "date": "YYYY-MM-DD",
    "sessions_total": 0,
    "paid_search_sessions": 0,
    "meta_sessions": 0,
    "funnel": {
      // Keys match the funnel stages defined in brands/{brand}/funnel.md
      // Example keys for a SaaS trial funnel:
      "impressions": 0,
      "clicks": 0,
      "paid_search_sessions": 0,
      "trial_cta_click": 0,
      "signup_form_start": 0,
      "signup_form_submit": 0,
      "profile_form_start": 0,
      "profile_form_submit": 0,
      "trial_activated": 0,
      "paid_conversion": 0,
      "schedule_call_click": 0
      // Example keys for a lead gen funnel:
      // "sessions": 0, "click_schedule_call": 0, "calendly_booked": 0
    },
    "funnel_flags": ["flag text"]
  }
}
```

After saving, log to `memory/YYYY-MM-DD.md`:
```markdown
## gads-data-pull — [ISO timestamp]
- Report date: [date]
- Google Ads: Spend SGD [x] / [clicks] clicks / [conv] conv / CPA SGD [x]
- GA4: [sessions] paid search sessions / [trials] trials
- Saved: tmp/gads-[date].json
```

---

## Phase 2 — Meta Ads Data Pull (`meta-data-pull`)

### Step 1 — Pull Meta Ads Data

Pull Meta Ads performance for yesterday (today's date − 1) AND day-before-yesterday (for DoD):

Pull via curl to Meta Graph API. Run 6 calls — 3 levels × 2 dates (yesterday + day-before for DoD):

```bash
# Fields for all levels
FIELDS="campaign_name,adset_name,ad_name,impressions,reach,clicks,spend,ctr,cpc,cpm,actions,cost_per_action_type,frequency"

# Yesterday — campaign, adset, ad levels
curl -s "https://graph.facebook.com/v19.0/${META_AD_ACCOUNT_ID}/insights?fields=${FIELDS}&time_range={\"since\":\"YYYY-MM-DD\",\"until\":\"YYYY-MM-DD\"}&level=campaign&limit=50&access_token=${META_ADS_TOKEN}"

curl -s "https://graph.facebook.com/v19.0/${META_AD_ACCOUNT_ID}/insights?fields=${FIELDS}&time_range={\"since\":\"YYYY-MM-DD\",\"until\":\"YYYY-MM-DD\"}&level=adset&limit=50&access_token=${META_ADS_TOKEN}"

curl -s "https://graph.facebook.com/v19.0/${META_AD_ACCOUNT_ID}/insights?fields=${FIELDS}&time_range={\"since\":\"YYYY-MM-DD\",\"until\":\"YYYY-MM-DD\"}&level=ad&limit=50&access_token=${META_ADS_TOKEN}"

# Day-before-yesterday — same 3 levels (for DoD comparison)
# Same curl commands with prior day's date
```

**Date resolution:** Use SGT (UTC+8) for dates — `TZ=Asia/Singapore date -v-1d '+%Y-%m-%d'` for yesterday.

- Token: `$META_ADS_TOKEN` | Account: `$META_AD_ACCOUNT_ID`
- **Currency:** Meta returns USD. Convert to SGD using rate 1 USD = 1.357 SGD
- **Response parsing:** Extract `data[]` array. Key fields: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `reach`. For LP views: find `actions[]` where `action_type == "landing_page_view"`. For video views: `action_type == "video_view"`.

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

### Step 3 — Save Intermediate JSON

Save to `tmp/meta-{YYYY-MM-DD}.json` where the date is **yesterday's date**:

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
      "lp_views": 0,
      "cpa_sgd": 0.0
    },
    "account_dod": { "spend": "▲ +5%", "clicks": "▼ -8%", "lp_views": "—" },
    "campaigns": [
      {
        "name": "", "impr": 0, "clicks": 0, "ctr_pct": 0.0,
        "lp_views": 0, "lp_view_rate_pct": 0.0,
        "spend_sgd": 0.0, "cpc_sgd": 0.0, "cpm_sgd": 0.0, "dod": ""
      }
    ],
    "ad_sets": [{ "name": "", "campaign": "", "impr": 0, "clicks": 0, "ctr_pct": 0.0, "lp_views": 0, "spend_sgd": 0.0, "reach": 0, "dod": "" }],
    "ads": [{ "name": "", "campaign": "", "impr": 0, "clicks": 0, "ctr_pct": 0.0, "lp_views": 0, "video_views": 0, "spend_sgd": 0.0, "dod": "" }],
    "flags": {
      "urgent": ["flag text"],
      "optimize": ["flag text"],
      "monitoring": ["flag text"]
    }
  }
}
```

After saving, log to `memory/YYYY-MM-DD.md`:
```markdown
## meta-data-pull — [ISO timestamp]
- Report date: [date]
- Meta Ads: Spend SGD [x] (USD [x]) / [clicks] clicks / [lp_views] LP views / [conv] conv
- Saved: tmp/meta-[date].json
```

---

## Phase 3 — Email Stitcher (`paid-ads-email-sender`)

Runs at 01:15 SGT — 15 minutes after Phase 1 & 2 start.

### Step 1 — Load Intermediate Files

Determine yesterday's date. Look for:
- `tmp/gads-{YYYY-MM-DD}.json`
- `tmp/meta-{YYYY-MM-DD}.json`

**If one or both files are missing:** Wait 2 minutes and retry once. If still missing after retry, send email anyway with a note: `⚠️ [Google Ads / Meta Ads] data unavailable — data pull job did not complete in time.` Use an empty/paused placeholder section for the missing platform.

### Step 2 — Generate Email Report

Email title: **"📊 Paid Ads Daily Brief — [DD Mon YYYY]"**

Use the full HTML structure from `tmp/paid_ads_brief_full_mockup.html` as the template. All sections required. Tone: direct, expert, no fluff.

#### Email Structure (in order):

**Header**
- Title: Paid Ads Daily Brief — [date]
- Subtitle: Account: {brand} | Period: [date] | Generated: [date+1], 01:15 SGT

---

**🔵 Section 1 — Google Ads**

If all Google Ads campaigns paused: show `⏸ No Active Campaigns (Paused)` banner.

- **KPI bar:** Clicks / Impressions / CTR / Spend (SGD) / Conversions / CPA (SGD) — include DoD indicator per KPI (e.g. `SGD 61.28 ▲15%`)
- **🔴 Urgent — Act Today** (numbered list from `flags.urgent`)
- **🟡 Optimize — This Week** (bullet list from `flags.optimize`)
- **🟢 Monitoring** (bullet list from `flags.monitoring`)
- **📊 Campaign Performance table**
  `| Campaign | Status | Spend (SGD) | Clicks | CTR | Conv. | CPA (SGD) | DoD |`
- **📦 Ad Group Breakdown table**
  `| Ad Group | Campaign | Status | Clicks | Impr. | CTR | Cost (SGD) | DoD |`
- **📣 Ad Performance table**
  `| Ad (Headline 1) | Campaign | Ad Group | Clicks | Impr. | CTR | Cost (SGD) | Conv. | DoD |`
  (sorted by clicks desc; include 0-click if impressions > 0; skip 0/0 rows)
- **🎯 Keyword Performance table**
  `| Keyword | Campaign | Clicks | CTR | Cost (SGD) | Conv. | DoD |`
  (sorted by clicks; flag 0-conv with ⚠️)
- **🔁 Full Funnel — Google Ads → GA4** (from `ga4.funnel` data)

  Read funnel stages and benchmarks from `brands/{brand}/funnel.md`. Build the funnel table using the format below.

  Example A — SaaS trial funnel (10 stages):

  | Stage | Volume | Rate | Cost/Unit (SGD) | Benchmark | Status |
  |---|---|---|---:|---|:---:|
  | Impressions | | – | SGD X CPM | – | – |
  | Clicks | | CTR X% | SGD X CPC | 3–4% | 🟢/🟡/🔴 |
  | GA4 Sessions (Paid Search) | | X% of clicks | SGD X /session | 80–90% | |
  | Trial CTA Click | | X% of sessions | | 5–15% | |
  | Signup Form Start | | X% of CTA clicks | | >60% | |
  | Signup Form Submit | | X% of form starts | | >50% | |
  | Profile Form Start | | X% of submits | | >80% | |
  | Profile Form Submit | | X% of profile starts | | >70% | |
  | Trial Activated | | X% of profile submits | | >70% | |
  | Paid Conversion | | X% of trials | | SGD 200–780 | |
  | Schedule Call | | X% of sessions | | 1–3% | |

  Example B — Lead gen funnel (3 stages):

  | Stage | Volume | Rate | Cost/Unit (SGD) | Benchmark | Status |
  |---|---|---|---:|---|:---:|
  | Sessions | | – | SGD X /session | – | – |
  | Lead (click_schedule_call) | | X% of sessions | SGD X /lead | 3–8% | 🟢/🟡/🔴 |
  | Booked (calendly_booked) | | X% of leads | SGD X /booked | >50% | 🟢/🟡/🔴 |

  Funnel cost: all from Google Ads spend ÷ each stage volume.
  ⚡ **Funnel Actions** — one bullet per flagged stage (🔴/🟡) only

---

**🔴 Section 2 — Meta / Facebook Ads**

If no Meta campaigns active: show `⏸ No Active Campaigns (Paused)` banner.

- **KPI bar:** Clicks / Impressions / CTR / Spend (SGD) / LP Views / CPA (SGD) — include DoD per KPI
- **🔴 Urgent — Act Today** (from `flags.urgent`)
- **🟡 Optimize — This Week** (from `flags.optimize`)
- **🟢 Monitoring** (from `flags.monitoring`)
- **📊 Campaign Performance table**
  `| Campaign | Impr. | Clicks | CTR | LP Views | LP View Rate | Spend (SGD) | CPC (SGD) | CPM (SGD) | DoD |`
- **📦 Ad Set Breakdown table**
  `| Ad Set | Campaign | Impr. | Clicks | CTR | LP Views | Spend (SGD) | Reach | DoD |`
- **📣 Ad Performance table**
  `| Ad Name | Campaign | Impr. | Clicks | CTR | LP Views | Video Views | Spend (SGD) | DoD |`
  (sorted by spend desc)
- **🔁 Full Funnel — Meta Ads → GA4**
  Same funnel table format as Google Ads section (read from `brands/{brand}/funnel.md`). GA4 sessions filtered to `sessionSource = meta` (from `ga4.meta_sessions`). Note attribution gap from iOS privacy if significant.

---

**📋 Combined Summary**
`| Platform | Spend (SGD) | Clicks | LP Views | GA4 Sessions | Trials | CPA (SGD) | Status |`
- Google Ads row, Meta Ads row, Total row

---

**💡 Top Recommendation**
Single most impactful action across both platforms. Name the specific campaign/ad set/page.

- Do NOT flag signup form unless 3+ consecutive days of data show >80% abandonment.
- On Day 1–3 of Meta: focus on learning phase signals.
- On Google Ads paused days: recommendation should focus on Meta or pre-reactivation prep.

---

*{brand} Paid Ads Brief · Link 🔗 · Data: Google Ads (Sheets) + Meta Marketing API + GA4 · Next brief: [tomorrow], 01:15 SGT*

### Step 3 — Send Email

The HTML brief is too large for shell arguments. Build an RFC 5322 `.eml` file and send via Gmail API upload:

```bash
# 1. HTML already generated by Claude in Step 2 → saved to tmp/paid_ads_brief_{date}.html
HTML_FILE="tmp/paid_ads_brief_YYYY-MM-DD.html"

# 2. Build .eml file (Python one-liner)
python -c "
import base64, os
with open('$HTML_FILE', encoding='utf-8') as f: html = f.read()
subj_b64 = base64.b64encode('📊 Paid Ads Daily Brief — DD Mon YYYY'.encode()).decode()
email = os.environ.get('REPORT_EMAIL', 'user@example.com')
msg = f'From: {email}\r\nTo: {email}\r\nSubject: =?utf-8?B?{subj_b64}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n{base64.b64encode(html.encode()).decode()}'
with open('tmp/email.eml', 'w', encoding='utf-8') as f: f.write(msg)
"

# 3. Send via Gmail API upload (avoids shell arg length limit)
gws gmail users messages send --params '{"userId":"me"}' --upload "tmp/email.eml" --upload-content-type "message/rfc822" --format json
```

⚠️ **Subject date** must be the report date (yesterday), not today. Format: `DD Mon YYYY` (e.g., "27 Mar 2026").

⚠️ **Do NOT use `gws gmail +send --body`** — HTML briefs exceed shell argument length limits (~36KB). Always use the `.eml` upload approach above.

### Step 4 — Cleanup temp files

After successful send, remove all intermediate files:

```bash
rm -f tmp/gads-*.json tmp/meta-*.json tmp/paid_ads_brief_*.html tmp/email.eml
```

### Step 5 — Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

Send a DM to the user (user ID: `$SLACK_NOTIFY_USER`) via Slack MCP with a brief summary:

```
📊 [{brand}] Daily Brief Sent — [DD Mon YYYY]
• Google Ads: SGD [x] spend / [clicks] clicks / [conv] conv
• Meta Ads: SGD [x] spend / [clicks] clicks / [lp_views] LP views
• GA4: [paid_search] paid search / [meta] meta sessions / [trials] trials
• 🔴 Top flag: [most urgent flag]
• 💡 Top rec: [one-line recommendation]
```

Use `slack_send_message` with `channel_id: "$SLACK_NOTIFY_USER"`.

### Step 6 — Log to Memory

Append to `memory/YYYY-MM-DD.md`:

```markdown
## Paid Ads Daily Brief — [ISO timestamp] (01:15 SGT cron)
- Skill: digital-marketing-analyst (stitcher)
- Report period: [date]
- Google Ads: [status] / Spend SGD [x] / [clicks] clicks / [conv] conv / CPA SGD [x]
- Meta Ads: [status] / Spend SGD [x] (USD [x]) / [clicks] clicks / [lp_views] LP views
- GA4: [paid_search_sessions] paid search sessions / [meta_sessions] meta sessions / [trials] trials / [paid] paid
- Key flags: [top 2-3 urgent]
- Top recommendation: [the one action]
- Email sent: $REPORT_EMAIL
- Gmail message_id: [id]
```

---

## Weekly Workflow

The weekly brief uses the same 3-job architecture as the daily brief:

| Job | Cron | Time (SGT) | Output |
|---|---|---|---|
| `gads-weekly-data-pull` | Sat 01:00 | Sat 01:00 | `tmp/gads-weekly-{week_end}.json` |
| `meta-weekly-data-pull` | Sat 01:00 | Sat 01:00 | `tmp/meta-weekly-{week_end}.json` |
| `paid-ads-weekly-email-sender` | Sat 01:15 | Sat 01:15 | Email to $REPORT_EMAIL |

**JSON schema:** same as daily — use `wow` key instead of `dod` in all campaign/ad/keyword rows. Add `week_start` and `week_end` fields at root level.

Run this workflow when triggered by `gads-weekly-data-pull` or `meta-weekly-data-pull` (Saturdays 01:00 SGT).

**Week definition:** Sunday–Saturday. On Saturday morning, report covers the full past week (last Sunday to yesterday/Friday).

⚠️ **Data reliability:** Do not include any data before 2026-03-08. If week_start falls before Mar 8, use Mar 8 as the start date.

⚠️ **Never fall back to a prior week's data.** If Google Ads Sheets or Meta API return zero for this week's date range, report both as "No Active Campaigns" for the week — do not substitute data from a previous week. Both platforms must cover the **same date range**. Zero spend for the week is valid data.

---

### Step 1 — Pull Weekly Google Ads Data

⚠️ **Never hardcode file IDs. Always search the Weekly subfolder and take the file with the latest `modifiedTime`.**

```bash
gws drive files list --params '{"q":"'\''<FOLDER_ID>'\'' in parents","pageSize":1,"orderBy":"modifiedTime desc","fields":"files(id,name,modifiedTime)"}' --format json
gws sheets +read --spreadsheet <FILE_ID> --range "A1:BK500" --format json
```

Weekly subfolder IDs:
- Campaigns → `184UFljcYoYJHRfKcoGNbXWHpY1vbxm1h`
- Ad Groups → `1uXADTj0dukNMF2P3UGxNXmYtGvIbOv5Q`
- Ads → `1Zf1ewh9wNFS3OexsBqxfcM9L2s50yx__`
- Keywords → `1VvjqXBeL0UbuYE_AWn1s7o3bP1uPM0Xq`

Verify row 2 contains the expected week date range. If date doesn't match — stop, report data not ready yet.

⚠️ **Weekly sheets use the same column mappings as daily** — see "Google Ads Sheet Column Mappings" section above. Row 1 = title, row 2 = date range, row 3 = headers, row 4+ = data.

### Step 1b — Pull Weekly Meta Ads Data

Same curl pattern as daily pull, but with `time_range` spanning the full week:

```bash
curl -s "https://graph.facebook.com/v19.0/${META_AD_ACCOUNT_ID}/insights?fields=${FIELDS}&time_range={\"since\":\"<week_start>\",\"until\":\"<week_end>\"}&level=campaign&limit=50&access_token=${META_ADS_TOKEN}"
# Repeat for level=adset and level=ad
```

Convert USD to SGD (× 1.357). Include WoW comparison if prior week data exists in memory.

### Step 1c — Pull Weekly GA4 Data

```bash
python scripts/ga4_pull.py --start <week_start> --end <week_end> --json
```

### Step 2 — Analyze Weekly Performance

- Compare this week vs last week (WoW) for all metrics
- Flag consistently underperforming keywords/ads across the week
- Identify budget pacing issues and learning phase status for Meta
- Note if Meta ad sets exited learning phase (need ~50 conversion events each)

### Step 3 — Generate Weekly Email

Email title: **"📊 Paid Ads Weekly Brief — Week of [DD Mon YYYY]"**

Identical HTML structure to daily brief. Differences:
- Labels: "This Week" / "WoW" instead of "Today" / "DoD"
- All tables: WoW column instead of DoD (e.g. `+12% spend`, `-8% CPA`)
- Urgent/Optimize labels: "Fix Before Next Week" / "Adjust This Week" / "Watch Next Week"
- Top Recommendation label: "Top Recommendation for Next Week"
- Footer: next brief = next Saturday

**Header:**
- Title: Paid Ads Weekly Brief — Week of [DD Mon YYYY]
- Subtitle: Account: {brand} | Period: [Mon DD] – [Sat DD Mon YYYY] | Generated: [Sat date], 01:00 SGT

Sections identical to daily: Google Ads → Meta Ads → Combined Summary → Top Recommendation.

### Step 4 — Send Weekly Email

Same `.eml` upload approach as daily (avoids shell arg length limit):

```bash
# 1. HTML already generated by Claude in Step 3 → saved to tmp/paid_ads_brief_weekly_{date}.html
HTML_FILE="tmp/paid_ads_brief_weekly_YYYY-MM-DD.html"

# 2. Build .eml file
python -c "
import base64, os
with open('$HTML_FILE', encoding='utf-8') as f: html = f.read()
subj_b64 = base64.b64encode('📊 Paid Ads Weekly Brief — Week of DD Mon YYYY'.encode()).decode()
email = os.environ.get('REPORT_EMAIL', 'user@example.com')
msg = f'From: {email}\r\nTo: {email}\r\nSubject: =?utf-8?B?{subj_b64}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n{base64.b64encode(html.encode()).decode()}'
with open('tmp/email.eml', 'w', encoding='utf-8') as f: f.write(msg)
"

# 3. Send
gws gmail users messages send --params '{"userId":"me"}' --upload "tmp/email.eml" --upload-content-type "message/rfc822" --format json
```

### Step 5 — Cleanup temp files

```bash
rm -f tmp/gads-weekly-*.json tmp/meta-weekly-*.json tmp/paid_ads_brief_*.html tmp/email.eml
```

### Step 6 — Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

DM the user (`$SLACK_NOTIFY_USER`) via Slack MCP:

```
📊 [{brand}] Weekly Brief Sent — Week of [DD Mon YYYY]
• Google Ads: SGD [x] spend / [clicks] clicks / [conv] conv / WoW: [+/-x%] spend
• Meta Ads: SGD [x] spend / [clicks] clicks / [lp_views] LP views / WoW: [+/-x%] spend
• GA4: [sessions] sessions / [trials] trials
• 🔴 Top flag: [most urgent flag]
• 💡 Top rec for next week: [one-line recommendation]
```

### Step 7 — Log to Memory

```markdown
## Paid Ads Weekly Brief — [ISO timestamp] (01:00 SGT Saturday cron)
- Skill: digital-marketing-analyst (weekly)
- Report period: [week_start] to [week_end]
- Google Ads: [status] / Spend SGD [x] / [clicks] clicks / [conv] conv / CPA SGD [x] / WoW: [+/-x%]
- Meta Ads: [status] / Spend SGD [x] (USD [x]) / [clicks] clicks / [lp_views] LP views / WoW: [+/-x%]
- GA4: [sessions] sessions / [trials] trials / [paid] paid
- WoW: Spend [+/-x%] / Conv [+/-x%] / CPA [+/-x%]
- Key flags: [top 2-3]
- Top recommendation for next week: [the one action]
- Email sent: $REPORT_EMAIL
- Gmail message_id: [id]
```

---

## Notes

- **Platform:** Windows — use `python` (not `python3`). Date format `%#d` (not `%-d`).
- **gws CLI (v0.22.3):** Required scopes: `https://mail.google.com/`, `drive`, `spreadsheets`. If Gmail send fails with "insufficient scopes", delete `~/.config/gws/token_cache.json` and retry. Auth: `gws auth login --scopes "https://mail.google.com/,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,email,profile,openid"`
- **Email sending:** Always use `.eml` upload via `gws gmail users messages send --upload` — the `+send` helper cannot handle large HTML bodies (shell arg limit ~32KB).
- Meta Ads connected 2026-03-17 via Marketing API. Token: `$META_ADS_TOKEN`. Data pulled via curl to Graph API.
- GA4 clean data start: **2026-03-08** — never pull or compare pre-Mar 8 data
- GA4 service account: `link-analytics@gen-lang-client-0242132474.iam.gserviceaccount.com`. If auth fails with "Invalid JWT" clock error, sync Windows clock (Settings → Time → Sync now).
- Brand-specific known issues should be documented in `brands/{brand}/funnel.md` notes section.
- If Google Ads Drive reports aren't generated yet, still send email with Meta data. Note the gap in memory log.
- **Cleanup:** Always delete `tmp/` intermediate files after successful email send.
- Future data sources to add: TikTok Ads (when connected)

---

## Final Step — Log to Dashboard

After the skill completes, log the run to Supabase. The `metrics` JSONB must match the schema in `docs/new_agent_onboarding/metrics-spec.md` — the dashboard renders widgets from these exact key paths.

```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "digital-marketing-analyst",
    "brand": "<active-brand>",
    "status": "<success|partial|failed>",
    "summary": "<1 line, <200 chars — shown in activity feed>",
    "started_at": "<ISO timestamp>",
    "completed_at": "<ISO timestamp>",
    "metrics": {
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
      "flags": {
        "urgent": ["..."],
        "optimize": ["..."],
        "monitoring": ["..."]
      },
      "top_recommendation": "...",
      "gmail_message_id": "..."
    }
  }'
```

**Status values:** `success` (all data pulled + email sent), `partial` (one platform missing), `failed` (skill errored).
**All numeric values must be numbers, not strings** — enables DoD/WoW comparison on the dashboard.
