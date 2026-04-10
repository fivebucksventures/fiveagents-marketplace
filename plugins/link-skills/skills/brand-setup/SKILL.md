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

### Step 1 — Cowork Setup (one-time, skip if already done)

Before anything else, ensure your Cowork environment is configured:

> To use this plugin, you'll need to adjust a few settings first. Go to **Settings → Capabilities** and check the following:

1. **Cloud code execution and file creation** — toggle ON (required for skills)
2. **Allow network egress** — toggle ON (required for API calls)
3. **Claude in Chrome** — go to Settings → Claude in Chrome → enable and install the extension (required for website analysis)
4. Confirm all your **MCP connectors** are connected (we'll set these up in Step 2)

> Have you enabled these settings? Once confirmed, we'll move on.

---

### Step 2 — What You'll Need (Prerequisites Overview)

Before we begin, here's everything you'll want to have ready. You don't need all of these right now — we'll walk through each one — but having them handy will make setup faster.

**Brand basics:**
- Your brand name
- Your website URL
- Your brand colors as HEX codes (e.g. `#1A73E8`)
- Your logo file (PNG, transparent background preferred)
- Your Google Font name (e.g. "Inter", "Montserrat") — browse at https://fonts.google.com

**Required API keys:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 1 | `FIVEAGENTS_API_KEY` | Dashboard logging, credential vault, email sending | 1. Go to https://fiveagents.io and sign in<br>2. Go to Dashboard → API Keys<br>3. Copy your `fa_live_...` key |
| 2 | `GEMINI_API_KEY` | Image generation (social graphics, backgrounds) | 1. Go to https://aistudio.google.com/apikey<br>2. Click "Create API Key"<br>3. Copy the key (free tier: 10 images/min) |
| 3 | `LATE_API_KEY` | Social media publishing (Facebook, Instagram, LinkedIn) | 1. Sign up at https://zernio.com<br>2. Connect your social media accounts in Zernio dashboard<br>3. Go to Settings → API → copy your API key |
| 4 | `SLACK_NOTIFY_USER` | Slack DM notifications after each skill run | 1. Open Slack<br>2. Click your profile photo → "Profile"<br>3. Click the three dots ⋯ → "Copy member ID" |
| 5 | `REPORT_EMAIL` | Daily/weekly marketing report delivery | Your work email address |

**Optional API keys:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 6 | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Keyword research (search volume, suggestions) | 1. Sign up at https://dataforseo.com<br>2. Go to Dashboard → API Settings<br>3. Copy your login email and API password |
| 7 | `ARGIL_API_KEY` | AI avatar talking-head videos (Reels) | 1. Sign up at https://argil.ai<br>2. Create your avatar (upload a video of yourself)<br>3. Go to Settings → API → copy your API key |

**MCP connections (connect in Claude settings):**

| # | MCP | What it's for | How to connect |
|---|---|---|---|
| 1 | **FiveAgents** | All external API calls (Gemini, Zernio, Argil, DataforSEO, email, logging) | 1. In Claude, go to Settings → Connectors<br>2. Click "Add custom connector"<br>3. Name: `FiveAgents`<br>4. URL: `https://gateway.fiveagents.io/api/mcp`<br>5. Click Connect |
| 2 | **Notion** | Content calendar management | Settings → Connected Apps → Notion → Authorize |
| 3 | **Slack** | Notifications | Settings → Connected Apps → Slack → Authorize |
| 4 | **Gmail** | Reading emails | Settings → Connected Apps → Gmail → Authorize |
| 5 | **Google Calendar** | Scheduling | Settings → Connected Apps → Google Calendar → Authorize |
| 6 | **Windsor.ai** | Google Ads, Meta Ads, GA4 analytics data | 1. Settings → Connected Apps → Windsor.ai → Authorize<br>2. In Windsor dashboard, connect your Google Ads, Facebook Ads, and GA4 accounts |

Present this overview to the user, then ask:
> Ready to get started? We'll go through each step together.

---

### Step 3 — Brand Name & Folder

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

### Step 4 — Website Analysis

Ask the user:
> What is your website URL? (e.g. https://acme.com)

Use **Claude in Chrome** (preferred in Cowork) to navigate to the site and extract content directly through the user's browser:
1. Homepage — extract tagline, value propositions, hero copy, CTAs
2. Pricing page (if exists) — extract plans, pricing, features
3. About page (if exists) — extract company story, team, mission
4. Blog/resources (if exists) — extract content themes and topics

If Claude in Chrome is not available, ask the user to paste the key content directly into the chat.

Use the analyzed data to draft the brand context files below. Show the user each draft and let them review/edit before saving.

### Step 5 — Generate Brand Context Files

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

**Step A — Ask the user about their funnel:**
> What does your conversion funnel look like? What happens after someone clicks your ad?
> (e.g. "website visit → WhatsApp chat → close deal" or "visit → trial signup → paid conversion")

**Step B — Discover actual GA4 events (if Windsor.ai is connected):**

```
Use Windsor.ai MCP tool `get_fields`:
- source: "googleanalytics4"
```

This returns all available fields including key events and custom events. Look for event names that match the user's described funnel actions (e.g. `click_whatsapp`, `click_email`, `schedule_call`, `signup_form_submit`, `trial_activated`, `purchase`).

Show the user the relevant events found and confirm the mapping:
> I found these key events / custom events that match your funnel: [list]. Can you confirm which event maps to each step?

If Windsor.ai is not connected yet, ask the user for their GA4 key event / custom event names directly. If they don't know, leave event names as `TBD` — they will be discovered during Step 8 (Connection Validation) when Windsor.ai is connected.

**Step C — Generate funnel.md with the confirmed mapping:**

```markdown
# {Brand Name} — Conversion Funnel

## Funnel Type
{e.g. "Lead gen", "SaaS trial", "E-commerce", "Service inquiry"}

## Stages (Google Ads)
| Stage | GA4 Event / Source | Benchmark | Status Threshold |
|---|---|---|---|
| Impressions | Google Ads | — | — |
| Clicks | Google Ads | CTR >{X}% | 🟢 >{X}% / 🟡 {Y}-{X}% / 🔴 <{Y}% |
| GA4 Sessions | GA4: session_source_medium = google / cpc | {X}-{Y}% of clicks | 🟢/🟡/🔴 |
| {Conversion Action 1} | GA4: {event_name} | {X}% of sessions | 🟢/🟡/🔴 |
| {Conversion Action 2} | GA4: {event_name} | {X}% of {previous stage} | 🟢/🟡/🔴 |
{...add as many stages as the client's funnel has}

## Stages (Meta Ads)
| Stage | GA4 Event / Source | Benchmark | Status Threshold |
|---|---|---|---|
| Impressions | Meta Ads | — | — |
| Clicks | Meta Ads | CTR >{X}% | 🟢/🟡/🔴 |
| LP Views | Meta Ads | >{X}% of clicks | 🟢/🟡/🔴 |
| GA4 Sessions | GA4: session_source_medium = meta / paid_social | {X}-{Y}% of clicks | 🟢/🟡/🔴 |
| {Conversion Action 1} | GA4: {event_name} | {X}% of sessions | 🟢/🟡/🔴 |
| {Conversion Action 2} | GA4: {event_name} | {X}% of {previous stage} | 🟢/🟡/🔴 |
{...same conversion actions, different source filter}

## Cost Benchmarks
| Metric | Target (SGD) |
|---|---|
| Cost per {Conversion Action 1} | {X} |
| Cost per {Conversion Action 2} | {X} |

## Notes
- Benchmarks are initial estimates. Update after 2-4 weeks of data.
- If GA4 events are TBD, the digital-marketing-analyst will skip funnel stages without mapped events.
```

Each client's funnel is unique — the digital-marketing-analyst reads this file and builds the email funnel table dynamically from whatever stages are defined here.

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

### Step 6 — Logo & Fonts

Ask the user:
> Please paste your logo image directly into this chat (PNG, transparent background preferred).
> What Google Font does your brand use? (e.g. "Inter", "Montserrat", "Poppins", "Roboto")
> Browse fonts at https://fonts.google.com

When the user pastes the logo, save it to `brands/{brand}/logo.png`. This file is read and passed as base64 to the `image_add_logo` gateway tool.

Save the font name to `brands/{brand}/brand.md` under the Typography section. The `image_add_text_overlay` gateway tool accepts a `font_family` parameter — pass the Google Font name exactly as it appears on Google Fonts (e.g. "Inter", "Montserrat"). The font is loaded automatically at runtime.

### Step 7 — API Keys & Connections

Walk through each integration one by one. For each one, explain what it does and whether it's required or optional. Ask: "Do you have your {integration} ready?" If the user says "not now" or "skip", acknowledge and move on — note it as unconfigured for the summary.

**6a. Five Agents custom connector (MUST be first — all gateway tools depend on this):**

Ask the user to add the Five Agents connector in Claude:
1. Go to Settings → Connectors → "Add custom connector"
2. Name: `Five Agents`
3. URL: `https://gateway.fiveagents.io/api/mcp`
4. Click Connect

If the user is on terminal (Claude Code), they can skip this — terminal skills use env vars directly.

**6b. API Keys:**

**Required:**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 1 | `FIVEAGENTS_API_KEY` | Dashboard logging, credential vault, email sending | Go to fiveagents.io → Dashboard → API Keys |
| 2 | `GEMINI_API_KEY` | Image generation + text overlay (Google Fonts) | https://aistudio.google.com/apikey — free tier: 10 images/min |
| 3 | `SLACK_NOTIFY_USER` | Slack DM notifications after each skill run | Open Slack → click your profile → three dots → "Copy member ID" |
| 4 | `REPORT_EMAIL` | Email address for daily/weekly marketing reports | Your work email |

**Required for social publishing:**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 5 | `LATE_API_KEY` | Publish to social platforms via Zernio | https://zernio.com — sign up, connect social accounts, go to Settings → API → copy key |

**Standard (ask for each — skip if not ready):**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 6 | `DATAFORSEO_LOGIN` | Keyword research & search volume | https://dataforseo.com — sign up, copy login email |
| 7 | `DATAFORSEO_PASSWORD` | Keyword research & search volume | DataforSEO dashboard → API Settings → API password |

**Optional (enables specific skills):**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 8 | `ARGIL_API_KEY` | AI avatar videos for Reels | https://argil.ai — sign up, create your avatar, go to Settings → API → copy key |

For each key the user provides, save it to `.claude/settings.local.json` under the appropriate env var name (for terminal use).

**Also store keys in the credential vault (for Cowork use):**

After saving to `settings.local.json`, store each API key in the encrypted vault so the gateway can access it:

```
For each key provided, use gateway MCP tool `fiveagents_store_credential`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- service: "<service_name>"
- key: "<the_api_key>"
```

Use these service names (must match what the gateway expects):

| Env Var | Service Name |
|---------|-------------|
| `GEMINI_API_KEY` | `gemini` |
| `LATE_API_KEY` | `late` |
| `ARGIL_API_KEY` | `argil` |
| `DATAFORSEO_LOGIN` | `dataforseo_login` |
| `DATAFORSEO_PASSWORD` | `dataforseo_password` |

Note: `FIVEAGENTS_API_KEY`, `SLACK_NOTIFY_USER`, and `REPORT_EMAIL` do NOT need vault storage — they are passed directly as tool parameters or used by built-in MCP connectors.

Note: Google Ads, Meta Ads, and GA4 credentials are handled by the Windsor.ai MCP connector — no gateway storage needed.

Keys are encrypted via Supabase Vault and can never be retrieved after storage. If the user needs to update a key later, they can re-run this step or use the dashboard UI at fiveagents.io.

**6c. MCP Connectors (user connects in Claude settings → Connected Apps):**

Walk the user through each one. Explain what it does, ask the user to confirm they've connected it. If "not now", move on and note as unconfigured.

| # | MCP | What it does | How to connect |
|---|---|---|---|
| 1 | **Notion** | Content calendar, strategies & briefs | Settings → Connected Apps → Notion → Authorize |
| 2 | **Slack** | Notifications after each skill run | Settings → Connected Apps → Slack → Authorize |
| 3 | **Gmail** | Reading emails + report delivery | Settings → Connected Apps → Gmail → Authorize |
| 4 | **Google Calendar** | Scheduling content drops and meetings | Settings → Connected Apps → Google Calendar → Authorize |
| 5 | **Windsor.ai** | Google Ads, Meta Ads, GA4 data | Settings → Connected Apps → Windsor.ai → Authorize. Then connect your ad accounts in the Windsor.ai dashboard. |
| 6 | **Canva** | Campaign presentations and pitch decks | Settings → Connected Apps → Canva → Authorize |

For each, ask:
> Have you connected {MCP name} in your Claude settings? (Settings → Connected Apps)

If yes, proceed. If "not now", acknowledge and move on.

### Step 8 — Validate Connections

**Only validate integrations the user configured in Step 7.** Skip any the user chose not to set up. For each test, show ✅ or ❌ with a clear error message if it fails.

**7a. Gateway connector (MUST pass — all other gateway tests depend on this):**

1. **Five Agents gateway** — Log a test run:
```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "brand-setup"
- brand: "{brand}"
- status: "success"
- summary: "Brand setup validation for {brand}"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: { "date": "YYYY-MM-DD", "brand": "{brand}", "step": "validation" }
```
If error → tell user to verify their `FIVEAGENTS_API_KEY` and that the Five Agents connector URL is correct (`https://gateway.fiveagents.io/api/mcp`). Do NOT proceed with other gateway tests until this passes.

**7b. Gateway API key tests (only if configured in Step 6):**

2. **Credential vault** — Store a test value and confirm it works:
```
Use gateway MCP tool `fiveagents_store_credential`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- service: "test"
- key: "validation-check"
```

3. **Email sending** — Send a test email:
```
Use gateway MCP tool `fiveagents_send_email`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- to: ${REPORT_EMAIL}
- subject: "✅ Five Agents connected — {brand}"
- html: "<p>Your Five Agents plugin is set up for <strong>{brand}</strong>.</p>"
```

4. **Gemini** (if `GEMINI_API_KEY` configured):
```
Use gateway MCP tool `gemini_generate_text`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "Say hello"
- model: "gemini-2.5-flash"
```

5. **Image text overlay** (if `GEMINI_API_KEY` configured — tests Satori + Sharp):
```
Use gateway MCP tool `image_add_text_overlay`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- image_base64: "<any small test image base64>"
- text: "Test"
- position: "bottom-center"
- font_family: "Inter"
```

6. **Image logo overlay** (if logo was provided in Step 6 — tests Sharp composite):
```
Use gateway MCP tool `image_add_logo`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- image_base64: "<any small test image base64>"
- logo_base64: "<logo base64 from brands/{brand}/logo.png>"
- position: "bottom-right"
- logo_width: 80
```

7. **Zernio** (if `LATE_API_KEY` configured):
```
Use gateway MCP tool `late_list_posts`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- limit: 1
```

8. **Argil** (if `ARGIL_API_KEY` configured):
```
Use gateway MCP tool `argil_list_avatars`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
```

9. **DataforSEO** (if `DATAFORSEO_LOGIN` configured):
```
Use gateway MCP tool `dataforseo_search_volume`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- keywords: ["test"]
- location_code: 2702
```

**7c. MCP connectors (only if connected in Step 7):**

10. **Slack** (if connected) — Send a test DM:
```
slack_send_message to channel $SLACK_NOTIFY_USER:
"✅ Link plugin connected successfully for brand: {brand}"
```

11. **Notion** (if connected) — Try `notion-search` for any page. If it returns results, Notion is connected.

12. **Gmail** (if connected) — Try `gmail_get_profile`. If it returns the user's email, Gmail is connected.

13. **Google Calendar** (if connected) — Try `gcal_list_calendars`. If it returns calendars, Google Calendar is connected.

14. **Windsor.ai** (if connected) — Try Windsor MCP `get_connectors`. If it returns Google Ads / Facebook / GA4 accounts, Windsor is connected.

15. **GA4 event discovery** (if Windsor.ai connected AND funnel.md has TBD events) — Discover the client's actual GA4 conversion events:
```
Use Windsor.ai MCP tool `get_fields`:
- source: "googleanalytics4"
```
Look for key events and custom events (e.g. `click_whatsapp`, `click_email`, `schedule_call`, `signup_form_submit`, `trial_activated`, `purchase`, etc.). Filter out standard GA4 events (page_view, session_start, first_visit) — focus on key events (formerly called "conversions") and custom events that look like conversion actions.

Show the user the events found:
> "I found these key events / custom events in your GA4 account: [list]. Which of these are your conversion actions for the funnel?"

After the user confirms, **update `brands/{brand}/funnel.md`** — replace any `TBD` event names with the confirmed GA4 event names.

**After all tests, show a summary table:**

| Integration | Status |
|---|---|
| Five Agents gateway | ✅ / ❌ |
| Credential vault | ✅ / ❌ |
| Email (Postmark) | ✅ / ❌ |
| Gemini | ✅ / ❌ / ⏭ skipped |
| Image text overlay | ✅ / ❌ / ⏭ skipped |
| Image logo overlay | ✅ / ❌ / ⏭ skipped |
| Zernio | ✅ / ❌ / ⏭ skipped |
| Argil | ✅ / ❌ / ⏭ skipped |
| DataforSEO | ✅ / ❌ / ⏭ skipped |
| Slack | ✅ / ❌ / ⏭ skipped |
| Notion | ✅ / ❌ / ⏭ skipped |
| Gmail | ✅ / ❌ / ⏭ skipped |
| Google Calendar | ✅ / ❌ / ⏭ skipped |
| Windsor.ai | ✅ / ❌ / ⏭ skipped |

**Report results:**
```
Connection Status:

Gateway:
  {✅|❌} FiveAgents gateway — {connected|error}

API Keys (via gateway vault):
  {✅|⬜} Gemini — {connected|not configured}
  {✅|⬜} Zernio — {connected|not configured}
  {✅|⬜} Argil — {connected|not configured (optional)}
  {✅|⬜} DataforSEO — {connected|not configured}

MCP Connectors:
  {✅|⬜} Slack — {connected|not configured}
  {✅|⬜} Notion — {connected|not configured}
  {✅|⬜} Gmail — {connected|not configured}
  {✅|⬜} Google Calendar — {connected|not configured}
  {✅|⬜} Windsor.ai — {connected|not configured} (Google Ads, Meta Ads, GA4)
```

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
