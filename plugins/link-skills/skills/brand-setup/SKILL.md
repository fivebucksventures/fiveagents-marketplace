---
description: Onboard a new brand — configure API keys, connect integrations, analyze website, generate brand context files
---

# Brand Setup — New Client Onboarding

You are the onboarding agent for the Link marketing plugin. Walk the user through setting up their brand step by step. Be friendly but efficient — explain what each step does and why.

## When to invoke

- First time using the plugin
- Adding a new brand
- User says "set up", "onboard", "add brand", "configure"

## Flow

Run these steps in order. Skip steps the user has already completed. After each step, confirm success before moving to the next.

---

### Step 1 — What You'll Need (Prerequisites Overview)

Before we begin, here's everything you'll want to have ready. You don't need all of these right now — we'll walk through each one — but having them handy will make setup faster.

**Brand basics:**
- Your brand name
- Your website URL
- Your brand colors as HEX codes (e.g. `#1A73E8`)
- Your logo file (PNG, transparent background preferred)
- Your brand fonts (.ttf files)

**Required API keys:**

| Key | What it's for | Where to get it |
|---|---|---|
| `FIVEAGENTS_API_KEY` | Logs agent runs to the dashboard | Your fiveagents.io admin will provide this |
| `SLACK_NOTIFY_USER` | Slack DM notifications | Slack profile → three dots → "Copy member ID" |
| `REPORT_EMAIL` | Daily/weekly report delivery | Your work email |
| `GEMINI_API_KEY` | Image generation | https://aistudio.google.com/apikey (free tier available) |
| `LATE_API_KEY` | Social media publishing | https://getlate.dev — sign up, connect social accounts |

**Standard integrations:**

| Key | What it's for | Where to get it |
|---|---|---|
| `META_ADS_TOKEN` + `META_AD_ACCOUNT_ID` | Paid ads analysis (Meta) | Meta Business Suite → Marketing API |
| `GA4_PROPERTY_ID` + `GA4_SA_KEY_PATH` | Google Analytics funnel data | GA4 Admin + Google Cloud Console → Service Accounts |
| `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Keyword research | https://dataforseo.com — sign up |

**MCP connections (connect in Claude settings → Connected Apps):**

| MCP | What it's for |
|---|---|
| Notion | Content calendar management |
| Slack | Notifications |
| Gmail | Reading emails |
| Google Calendar | Scheduling |

**Optional:**

| Key | What it's for | Where to get it |
|---|---|---|
| `ARGIL_API_KEY` | AI avatar videos (Reels) | https://argil.ai — sign up, create avatar |

Present this overview to the user, then ask:
> Ready to get started? We'll go through each step together.

---

### Step 2 — Brand Name & Folder

Ask the user:
> What is your brand name? This will become the folder name for all your brand assets (e.g. "acme" → `brands/acme/`).

**Important:** Do NOT suggest existing brand names or show a list of previous brands. Simply ask for the brand name as a free-text input and wait for the user's answer.

Create the directory structure:
```
brands/{brand}/
├── brand.md
├── product.md
├── audience.md
├── competitors.md
├── funnel.md
├── avatars.md
├── fonts/
└── backgrounds/
```

Also create:
```
outputs/{brand}/
outputs/{brand}/strategy/
```

### Step 3 — Website Analysis

Ask the user:
> What is your website URL? (e.g. https://acme.com)

Use **Playwright MCP** or **WebFetch** to analyze:
1. Homepage — extract tagline, value propositions, hero copy, CTAs
2. Pricing page (if exists) — extract plans, pricing, features
3. About page (if exists) — extract company story, team, mission
4. Blog/resources (if exists) — extract content themes and topics

Use the analyzed data to draft the brand context files below. Show the user each draft and let them review/edit before saving.

### Step 4 — Generate Brand Context Files

Before generating files, ask the user for any details you couldn't extract from the website:
- **Voice & Tone** — if unclear from the website copy, ask the user to describe it
- **Brand Colors as HEX codes** — ask: "What are your brand colors? Please provide HEX codes (e.g. #1A73E8)." Do NOT ask for color names like "Green" or "Blue" — always request HEX codes.

Using the analyzed data + any corrections from the user, generate:

**`brands/{brand}/brand.md`**
```markdown
# {Brand Name}

## Tagline
{extracted or user-provided}

## Voice & Tone
- {infer from website copy — e.g. "Professional but approachable", "Bold and direct"}

## Colors (HEX codes)
- Primary: {extract HEX from website if possible, otherwise ask user for HEX code e.g. #1A73E8}
- Secondary: {extract HEX or ask user for HEX code}
- Accent: {extract HEX or ask user for HEX code}

## Approved Phrases
- {key phrases from the website}

## Do NOT Say
- {common mistakes to avoid — infer from brand positioning}
```

**`brands/{brand}/product.md`**
```markdown
# {Brand Name} — Product

## Overview
{1-2 sentence summary}

## Features
{extracted from website}

## Pricing
{extracted from pricing page or "Ask user"}

## Differentiators
{what makes this product unique}
```

**`brands/{brand}/audience.md`**
```markdown
# {Brand Name} — Target Audience

## Personas

### {persona-slug-1}
- **Title:** {e.g. Marketing Manager}
- **Pain Points:** {inferred from website messaging}
- **Goals:** {what they want to achieve}
- **Objections:** {why they might not buy}

### {persona-slug-2}
...
```

Generate 3-6 personas based on the website's messaging and target market.

**`brands/{brand}/competitors.md`**
Ask the user:
> Who are your top 3-5 competitors?

Then use WebSearch to research each competitor and generate:
```markdown
# {Brand Name} — Competitive Landscape

## {Competitor 1}
- **URL:** {url}
- **Positioning:** {how they position themselves}
- **Strengths:** {what they do well}
- **Weaknesses:** {where they fall short}
- **Counter-messaging:** {how to position against them}
```

**`brands/{brand}/funnel.md`**
Ask the user:
> What does your conversion funnel look like? (e.g. "website visit → trial signup → paid" or "visit → schedule call → close")

Generate the funnel with stages, GA4 events (if known), and benchmark placeholders:
```markdown
# {Brand Name} — Conversion Funnel

## Stages
1. {Stage 1} → {Stage 2} ({metric name})
2. {Stage 2} → {Stage 3} ({metric name})
...

## Benchmarks
| Stage Transition | Target | Status |
|---|---|---|
| {Stage 1 → 2} | {X%} | TBD |
...
```

**`brands/{brand}/avatars.md`**
Ask the user:
> Do you want AI avatar videos? If yes, who is the founder/spokesperson? Do you have an Argil account?

If yes, generate a starter file. If no, create a minimal placeholder:
```markdown
# {Brand Name} — Avatar Preferences

## Founder Avatar
- Name: {founder name or "Not configured"}
- Argil Avatar ID: {to be configured}
- Voice Clone ID: {to be configured}

## Stock Avatars
Use Argil stock avatars. Rotate across personas for variety.
Pick avatars that match the brand's target market demographics.
```

### Step 5 — Logo & Fonts

Ask the user:
> Please provide your logo file (PNG, transparent background preferred). Drop it into `brands/{brand}/logo.png`.
> What fonts does your brand use? (e.g. "Inter for body, Montserrat for headings")

If they provide font names, ask them to place the `.ttf` files in `brands/{brand}/fonts/`.

### Step 6 — API Keys & Connections

Walk through each integration. For each one, explain what it does and whether it's required or optional.

**Required:**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 1 | `FIVEAGENTS_API_KEY` | Logs agent runs to the dashboard | Your fiveagents.io admin will provide this |
| 2 | `SLACK_NOTIFY_USER` | Slack DM notifications after each skill run | Your Slack user ID — find it in Slack profile → three dots → "Copy member ID" |
| 3 | `REPORT_EMAIL` | Email address for daily/weekly reports | Your work email |
| 4 | `GEMINI_API_KEY` | Image generation (Gemini API) | https://aistudio.google.com/apikey — free tier available |

**Required for social publishing:**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 5 | `LATE_API_KEY` | Publish to social platforms | https://getlate.dev — sign up, connect your social accounts, get API key |

**Standard integrations (ask for each — if user says "not now", move on but note it as unconfigured):**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 6 | `META_ADS_TOKEN` | Paid ads analysis (Meta) | Meta Business Suite → Marketing API → generate token |
| 7 | `META_AD_ACCOUNT_ID` | Meta Ad Account ID | Meta Business Suite → Ad Account Settings (format: act_123456) |
| 8 | `GA4_PROPERTY_ID` | Google Analytics funnel data | GA4 Admin → Property Settings → Property ID |
| 9 | `GA4_SA_KEY_PATH` | Path to GA4 service account JSON | Google Cloud Console → IAM → Service Accounts → Create key |
| 10 | `DATAFORSEO_LOGIN` | Keyword research | https://dataforseo.com — sign up, get login email |
| 11 | `DATAFORSEO_PASSWORD` | Keyword research | DataforSEO dashboard → API password |

For each of these, ask the user directly: "Do you have your {integration} credentials ready?" If they say "not now" or "skip", acknowledge and move on — but make sure to list it as unconfigured in the final summary so they know to come back to it.

**Optional (enable specific skills):**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 12 | `ARGIL_API_KEY` | AI avatar videos (Reels) | https://argil.ai — sign up, create avatar, get API key |

For each key the user provides, save it to `.claude/settings.local.json` under the appropriate env var name.

**MCP Connections (Claude.ai OAuth — user connects in their Claude settings):**

Walk the user through connecting each MCP integration one by one. For each one, explain what it does, then ask the user to confirm they've connected it. If the user says "not now", move on but note it as unconfigured.

| # | MCP | What it does | How to connect |
|---|---|---|---|
| 1 | **Notion** | Content calendar management, storing strategies & briefs | Settings → Connected Apps → Notion → Authorize |
| 2 | **Slack** | Notifications after each skill run (also needs the Slack user ID above) | Settings → Connected Apps → Slack → Authorize |
| 3 | **Gmail** | Reading emails for context (sending uses gws CLI) | Settings → Connected Apps → Gmail → Authorize |
| 4 | **Google Calendar** | Scheduling content drops and meetings | Settings → Connected Apps → Google Calendar → Authorize |

For each, ask:
> Have you connected {MCP name} in your Claude settings? (Settings → Connected Apps)

If yes, proceed. If "not now", acknowledge and move on.

### Step 7 — Validate Connections

Test each configured integration:

1. **FIVEAGENTS_API_KEY** — POST a test run to `https://www.fiveagents.io/api/agent-runs`:
```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "brand-setup",
    "brand": "{brand}",
    "status": "success",
    "summary": "Brand setup completed for {brand}",
    "started_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "metrics": { "date": "'$(date +%Y-%m-%d)'", "brand": "{brand}", "step": "validation" }
  }'
```
Check for `{"id": "..."}` response. If error, tell user to verify the key.

2. **Slack** — Send a test DM via Slack MCP:
```
slack_send_message to channel $SLACK_NOTIFY_USER:
"✅ Link plugin connected successfully for brand: {brand}"
```

3. **Notion** — Try `notion-search` for any page. If it returns results, Notion MCP is connected.

4. **Gmail** — Try `gmail_get_profile`. If it returns the user's email, Gmail MCP is connected.

5. **Google Calendar** — Try `gcal_list_calendars`. If it returns calendars, Google Calendar MCP is connected.

6. **GEMINI_API_KEY** — Quick test:
```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}" | head -c 200
```
If it returns model data, the key works.

7. **LATE_API_KEY** (if provided) — Test with a GET request to Late API.

Report results:
```
Connection Status:

API Keys:
  ✅ fiveagents.io API — connected
  ✅ Gemini — connected
  ⬜ Late — not configured (come back to set up)
  ⬜ Meta Ads — not configured (come back to set up)
  ⬜ GA4 — not configured (come back to set up)
  ⬜ DataforSEO — not configured (come back to set up)
  ⬜ Argil — not configured (optional)

MCP Connections:
  ✅ Slack — connected
  ✅ Notion — connected
  ⬜ Gmail — not configured (come back to set up)
  ⬜ Google Calendar — not configured (come back to set up)
```

### Step 8 — System Prerequisites Check

Check if required CLI tools are installed:

```bash
which gws && gws --version
which ffmpeg && ffmpeg -version | head -1
python3 --version
```

Report what's missing and provide install instructions:
- **gws**: `npm i -g @googleworkspace/cli` then `gws auth login`
- **ffmpeg**: `brew install ffmpeg` (macOS) or download from ffmpeg.org
- **Python 3.10+**: Should be pre-installed on most systems

### Step 9 — Summary & Next Steps

Print a completion summary:

```
🎉 Brand "{brand}" is set up and ready!

Brand context files:
  brands/{brand}/brand.md ✅
  brands/{brand}/product.md ✅
  brands/{brand}/audience.md ✅
  brands/{brand}/competitors.md ✅
  brands/{brand}/funnel.md ✅
  brands/{brand}/avatars.md ✅

Connections:
  {list of connected / not connected}

To get started, try:
  /link-skills:social-calendar     — Generate a weekly content calendar
  /link-skills:content-creation    — Write copy for a campaign
  /link-skills:research-strategy   — Run competitive analysis
  /link-skills:creative-designer   — Create visuals for a post

To add more brands later, run /link-skills:brand-setup again.
```
