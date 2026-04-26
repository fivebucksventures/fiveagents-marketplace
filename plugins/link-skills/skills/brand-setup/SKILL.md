---
description: Onboard a new brand — configure API keys, connect integrations, analyze website, generate brand context files
---

# Brand Setup — New Client Onboarding

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

You are the onboarding agent for the Link marketing plugin. Walk the user through setting up their brand step by step. Be friendly but efficient — explain what each step does and why.

## When to invoke

- First time using the plugin
- Adding a new brand
- User says "set up", "onboard", "add brand", "configure"

## Flow

Run these steps in order. **Do not skip or rush any step.** At the end of each step, explicitly ask the user to confirm before proceeding to the next. Never assume a step is already done — always ask. The only exception is if the user explicitly says "skip" or "already done" for a specific step.

---

### Step 1 — Cowork Setup

Before anything else, ensure your Cowork environment is configured. **Both 1a and 1b are mandatory — do not proceed until both are confirmed.**

#### 1a. Work in a Project

All brand assets, outputs, and temp files live inside a Cowork project on your machine. **This is required — brand setup cannot run without an active project.**

> Let's get your project set up. In Cowork:
> 1. Look for **Projects** just below the chat input area
> 2. Click **"Create a new Project"**
> 3. Choose either **"Start from scratch"** or **"Use an existing folder"**
> 4. Name your project (e.g. your brand name)
> 5. Set Claude Permission as **"Act without asking"** — this ensures your scheduled jobs will run without needing your approval (after successfully tested). ⚠️ *By enabling this, you agree to accept the risks raised by Claude when it acts autonomously. Review Claude's warnings carefully before confirming.*

**Do not proceed until the user confirms they have a project open and are working inside it.** All subsequent steps create files relative to this project.

#### 1b. Configure settings

> To use this plugin, you'll need to adjust a few settings first. Go to **Settings → Capabilities** and check the following:

1. **Settings → Claude Code → Allow bypass permissions mode** — toggle ON (required for skills to run without interruption)
2. **Settings → Capabilities → Domain Allowlist → All Domains** — toggle ON (required for skills to fetch external URLs)

> Have you enabled these settings? Once confirmed, we'll move on.

**Do not proceed to Step 2 until the user confirms both 1a and 1b are done.**

---

### Step 2 — What You'll Need (Prerequisites Overview)

Before we begin, here's everything you'll want to have ready. You don't need all of these right now — we'll walk through each one — but having them handy will make setup faster.

**Brand basics:**
- Your brand name
- Your website URL (we'll auto-detect colors and fonts from your site)
- Your logo file path (PNG, transparent background preferred — e.g. `~/Documents/my-brand/logo.png`)

**Required API keys:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 1 | `FIVEAGENTS_API_KEY` | Dashboard logging, credential vault, email sending | 1. Go to https://fiveagents.io and sign in<br>2. Go to Dashboard → API Keys<br>3. Copy your `fa_live_...` key |
| 2 | `GEMINI_API_KEY` | Image generation (social graphics, backgrounds) | 1. Go to https://aistudio.google.com/apikey<br>2. Click "Create API Key"<br>3. Copy the key (free tier: 10 images/min) |
| 3 | `LATE_API_KEY` | Social media publishing (Facebook, Instagram, LinkedIn) | 1. Sign up at https://zernio.com<br>2. Create a Profile for your brand<br>3. Connect your social accounts (Facebook, Instagram, LinkedIn) via OAuth<br>4. Go to Settings → API → copy your API key |
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
| 6 | **Windsor.ai** | Google Ads, Meta Ads, GA4 analytics data | 1. Sign up for a free account at https://windsor.ai/register<br>2. In Windsor dashboard, connect your Google Ads, Meta Ads (Facebook Ads), and GA4 accounts<br>3. In Claude, go to Settings → Connected Apps → Windsor.ai → Authorize |
| 7 | **Canva** | Campaign presentations and pitch decks | Settings → Connected Apps → Canva → Authorize |

Present this overview to the user, then ask:
> Ready to get started? We'll go through each step together.

**Do not proceed to Step 3 until the user confirms they are ready.**

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
└── backgrounds/
```

Also create:
```
outputs/{brand}/
outputs/{brand}/strategy/
```

**Do not proceed to Step 4 until the brand name is confirmed and all directories are created.**

### Step 4 — Website Analysis

Ask the user:
> What is your website URL? (e.g. https://acme.com)

Use **Playwright MCP** to navigate to the site and extract content:

1. `browser_navigate` to the homepage — extract tagline, value propositions, hero copy, CTAs
2. `browser_snapshot` to read the DOM and discover all top-level navbar links
3. Visit each navbar page (e.g. Pricing, Services, Portfolio, About, Contact, Blog) using `browser_navigate` + `browser_snapshot` and extract key content from each

While browsing, also extract the brand's **locale** and **visual identity**:
- **Locale** — infer from the website's TLD (e.g. `.co.id` → Indonesia), language, physical address, phone number country code, or currency symbols on the page. Determine:
  - Currency code and symbol (e.g. `Rp` for IDR, `SGD`, `$` for USD)
  - Timezone (e.g. `Asia/Jakarta`, `Asia/Singapore`)
  - Meta Ads USD exchange rate (Facebook spend is always USD — this rate converts to local currency)
  If ambiguous, confirm with the user.
- **Colors** — use `browser_evaluate` to inspect computed CSS styles on buttons, headings, and nav elements to find primary, secondary, and accent HEX codes:
  ```js
  {
    button: getComputedStyle(document.querySelector('button, .btn, [class*="btn"]') || document.body).backgroundColor,
    heading: getComputedStyle(document.querySelector('h1, h2') || document.body).color,
    nav: getComputedStyle(document.querySelector('nav, header') || document.body).backgroundColor,
    link: getComputedStyle(document.querySelector('a') || document.body).color
  }
  ```
- **Fonts** — use `browser_evaluate` to check `<link>` tags for Google Fonts URLs and `font-family` on headings/body:
  ```js
  {
    googleFonts: [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].map(l => l.href),
    headingFont: getComputedStyle(document.querySelector('h1, h2') || document.body).fontFamily,
    bodyFont: getComputedStyle(document.body).fontFamily
  }
  ```

If Playwright MCP is unavailable, blocked (e.g. Cloudflare protection), or fails to load the site, ask the user to paste the key content directly into the chat and provide their brand colors (HEX codes) and Google Font name manually.

Present the discovered colors and fonts to the user for confirmation:
> I found these brand colors on your site: Primary: `#1A73E8`, Secondary: `#34A853`, Accent: `#FBBC04`. Are these correct?
> Your site uses the Google Font **Inter** for headings and **Roboto** for body text. Should I use these?

If colors or fonts couldn't be extracted, ask the user directly:
- **Brand Colors** — "What are your brand colors? Please provide HEX codes (e.g. #1A73E8)."
- **Google Font** — "What Google Font does your brand use? Browse at https://fonts.google.com"
- **Voice & Tone** — if unclear from the website copy, ask the user to describe it

Using the analyzed data + any corrections from the user, generate **two files**:

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

## Locale
- Currency: {e.g. Rp, SGD, USD — infer from website/country}
- Timezone: {e.g. Asia/Jakarta, Asia/Singapore — infer from location}
- Meta USD exchange rate: {e.g. 16200 for IDR, 1.36 for SGD — USD to local currency}

## Approved Phrases
- {key phrases from the website}

## Do NOT Say
- {common mistakes to avoid — infer from brand positioning}
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

Show the user each draft and let them review/edit before saving.

**Do not proceed to Step 5 until the user has reviewed and confirmed `brand.md` and `audience.md`.**

### Step 5 — Research & Context Generation

Now that `brand.md` and `audience.md` exist, run `/link-skills:research-strategy` to fill in the remaining context files. The research skill will:
- Read brand.md + audience.md for context
- Research competitors automatically (no need to ask the user)
- Analyze market positioning, strengths, weaknesses
- Run keyword research (if DataforSEO is configured)

Read the research output from `outputs/{brand}/strategy/` and use it to generate:

**`brands/{brand}/product.md`**
```markdown
# {Brand Name} — Product

## Overview
{1-2 sentence summary}

## Features
{extracted from website in Step 4}

## Pricing
{extracted from pricing page or "Ask user"}

## Differentiators
{what makes this product unique — informed by competitive research}
```

**`brands/{brand}/competitors.md`**

Generated from research-strategy output. No need to ask the user — competitors are discovered automatically:
```markdown
# {Brand Name} — Competitive Landscape

## {Competitor 1}
- **URL:** {url}
- **Positioning:** {how they position themselves}
- **Strengths:** {what they do well}
- **Weaknesses:** {where they fall short}
- **Counter-messaging:** {how to position against them}

## {Competitor 2}
...
```

**`brands/{brand}/funnel.md`**

**Step A — Ask the user about their funnel:**
> What does your conversion funnel look like? What happens after someone clicks your ad?
> (e.g. "website visit → WhatsApp chat → close deal" or "visit → trial signup → paid conversion")

**Step B — Discover actual GA4 events:**

Windsor.ai is set up in Step 7, so at this point it is likely not connected yet. Ask the user for their GA4 key event / custom event names directly. If they don't know, leave event names as `TBD` — they will be discovered and filled in during Step 8 (Connection Validation) once Windsor.ai is connected.

If Windsor.ai happens to already be connected (e.g. returning user), use Windsor MCP tool `get_fields` with `source: "googleanalytics4"` to discover actual events now. Look for event names that match the user's described funnel actions (e.g. `click_whatsapp`, `click_email`, `schedule_call`, `signup_form_submit`, `trial_activated`, `purchase`).

Show the user the relevant events found and confirm the mapping:
> I found these key events / custom events that match your funnel: [list]. Can you confirm which event maps to each step?

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
| Metric | Target ({currency from brand.md Locale}) |
|---|---|
| Cost per {Conversion Action 1} | {X} |
| Cost per {Conversion Action 2} | {X} |

## Notes
- Benchmarks are initial estimates. Update after 2-4 weeks of data.
- If GA4 events are TBD, the digital-marketing-analyst will skip funnel stages without mapped events.
```

Each client's funnel is unique — the digital-marketing-analyst reads this file and builds the email funnel table dynamically from whatever stages are defined here.

**Do not proceed until `product.md`, `competitors.md`, `funnel.md` are generated and the user has confirmed the funnel mapping.**

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

### Step 6 — Logo

Ask the user:
> What is the file path to your logo? (PNG, transparent background preferred — e.g. `~/Documents/my-brand/logo.png`)

Copy the file from the provided path to `brands/{brand}/logo.png`. This file is read by Python Pillow in content-generator and creative-designer for logo compositing.

Note: Google Font and brand colors were already discovered and saved to `brands/{brand}/brand.md` in Step 4.

**Do not proceed to Step 7 until the logo file is confirmed copied (or the user explicitly skips it).**

### Step 7 — API Keys & Connections

Walk through each integration one by one. For each one, explain what it does and whether it's required or optional. Ask: "Do you have your {integration} ready?" If the user says "not now" or "skip", acknowledge and move on — note it as unconfigured for the summary.

**7a. Five Agents custom connector (MUST be first — all gateway tools depend on this):**

Ask the user to add the Five Agents connector in Claude:
1. Go to Settings → Connectors → "Add custom connector"
2. Name: `Five Agents`
3. URL: `https://gateway.fiveagents.io/api/mcp`
4. Click Connect

This connector is required for all skills — it routes Gemini, Zernio, Argil, DataforSEO, email, and logging calls through the gateway.

**7b. API Keys:**

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
| 5 | `LATE_API_KEY` | Publish to social platforms via Zernio | See Zernio setup below |

**Zernio setup (social media publishing):**

Walk the user through connecting their social platforms to Zernio. This must be done before the content-generator or social-publisher skills can post.

> To publish content to your social media accounts, we need to set up Zernio. Here's what to do:
>
> **Step A — Create account & get API key:**
> 1. Go to https://zernio.com and sign up for an account
> 2. Go to **Settings → API** and copy your API key
> 3. Paste it here — I'll save it as `LATE_API_KEY`
>
> **Step B — Create a Profile:**
> In the Zernio dashboard, create a **Profile** for your brand. A profile groups all your social accounts together.
> 1. Go to **Profiles** in the Zernio dashboard
> 2. Click **Create Profile**
> 3. Name it your brand name (e.g. "NPC Office")
>
> **Step C — Connect your social platforms:**
> For each platform you want to publish to, connect it via OAuth in the Zernio dashboard:
> 1. In your Profile, click **Connect Account**
> 2. Select the platform (Facebook, Instagram, LinkedIn, etc.)
> 3. Authorize Zernio to post on your behalf
> 4. Repeat for each platform
>
> Supported platforms: Facebook, Instagram, LinkedIn, Twitter/X, TikTok, YouTube, Pinterest, Threads, and more.
>
> **Important for Instagram:** Instagram requires a Facebook Business Page linked to your Instagram Professional account. If you see an authorization error, check that your Instagram is set to Professional (not Personal) and is connected to a Facebook Page.
>
> **Important for LinkedIn:** Connect your personal LinkedIn profile first. To post to a LinkedIn Company Page, you must be an admin of that page.
>
> Let me know once you've connected your platforms and I'll automatically detect everything.

**Step D — Auto-discover profile and account IDs:**

After the user confirms they've connected their platforms, use the gateway to discover the profile ID and account IDs automatically:

```
1. Use gateway MCP tool `late_list_profiles`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   → Returns list of profiles. Pick the profile matching the brand name.
   → Save the profile `_id`.

2. Use gateway MCP tool `late_list_accounts`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - profile_id: "<profile _id from step 1>"
   → Returns list of connected accounts with `_id`, `platform`, `username`.
```

Show the user what was found:
> I found your Zernio profile and these connected accounts:
> - Facebook: @{username} (ID: {_id})
> - Instagram: @{username} (ID: {_id})
> - LinkedIn: {displayName} (ID: {_id})

Save the account IDs as env vars in `.claude/settings.local.json` (the content-generator and social-publisher skills need these):

```
{BRAND}_LATE_FB   → Facebook account _id from late_list_accounts
{BRAND}_LATE_IG   → Instagram account _id from late_list_accounts
{BRAND}_LATE_LI   → LinkedIn account _id from late_list_accounts
```

Example: `NPCOFFICE_LATE_FB`, `NPCOFFICE_LATE_IG`, `NPCOFFICE_LATE_LI`

Only create env vars for platforms that were found. If a platform isn't connected, skip it.

Save the profile ID and connected platforms to `brands/{brand}/brand.md`:

```markdown
## Social Publishing
- Zernio Profile ID: {profile_id}
- Connected platforms: {Facebook (@username), Instagram (@username), LinkedIn (name), etc.}
```

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

**7c. MCP Connectors (user connects in Claude settings → Connected Apps):**

Walk the user through each one. Explain what it does, ask the user to confirm they've connected it. If "not now", move on and note as unconfigured.

| # | MCP | What it does | How to connect |
|---|---|---|---|
| 1 | **Notion** | Content calendar, strategies & briefs | Settings → Connected Apps → Notion → Authorize |
| 2 | **Slack** | Notifications after each skill run | Settings → Connected Apps → Slack → Authorize |
| 3 | **Gmail** | Reading emails + report delivery | Settings → Connected Apps → Gmail → Authorize |
| 4 | **Google Calendar** | Scheduling content drops and meetings | Settings → Connected Apps → Google Calendar → Authorize |
| 5 | **Windsor.ai** | Google Ads, Meta Ads, GA4 data | 1. Sign up for a free account at https://windsor.ai/register (if you don't have one yet)<br>2. In Windsor dashboard, connect your Google Ads, Meta Ads, and GA4 accounts<br>3. Then in Claude: Settings → Connected Apps → Windsor.ai → Authorize |
| 6 | **Canva** | Campaign presentations and pitch decks | Settings → Connected Apps → Canva → Authorize |

For Notion, Slack, Gmail, Google Calendar, and Canva, ask:
> Have you connected {MCP name} in your Claude settings? (Settings → Connected Apps)

For Windsor.ai specifically, walk the user through all 3 steps before asking if they're done:
1. "First, do you have a Windsor.ai account? If not, sign up free at https://windsor.ai/register"
2. "Once you have an account, go to your Windsor dashboard and connect your Google Ads, Meta Ads, and GA4 accounts"
3. "Then in Claude, go to Settings → Connected Apps → Windsor.ai → Authorize"

If yes to all, proceed. If "not now", acknowledge and move on.

**Do not proceed to Step 8 until the user has responded to every integration in Step 7 — either configured or explicitly skipped.**

### Step 8 — Validate Connections

**This step is mandatory and must not be skipped.** Run validation for every integration the user configured in Step 7. For each test, show ✅ or ❌ with a clear error message if it fails. Only skip a specific test if the user explicitly chose not to set up that integration in Step 7.

**8a. Gateway connector (MUST pass — all other gateway tests depend on this):**

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

**8b. Gateway API key tests (only if configured in Step 7):**

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
- html_body: "<p>Your Five Agents plugin is set up for <strong>{brand}</strong>.</p>"
- tag: "brand-setup-test"
```

4. **Gemini** (if `GEMINI_API_KEY` configured):
```
Use gateway MCP tool `gemini_generate_text`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "Say hello"
- model: "gemini-2.5-flash"
```

5. **Image text overlay** (if `GEMINI_API_KEY` configured — tests Python Pillow):
```python
from PIL import Image, ImageDraw
img = Image.new('RGB', (100, 100), color='gray')
draw = ImageDraw.Draw(img)
draw.text((10, 10), "Test", fill='white')
img.save('/tmp/test_overlay.png')
# If no error, Pillow is working
```

6. **Image logo overlay** (if logo was provided in Step 6 — tests Python Pillow composite):
```python
from PIL import Image
img = Image.new('RGBA', (100, 100), color='gray')
logo = Image.open('brands/{brand}/logo.png').convert('RGBA')
logo = logo.resize((20, 20), Image.LANCZOS)
img.paste(logo, (5, 5), logo)
img.save('/tmp/test_logo.png')
# If no error, logo compositing is working
```

7. **Zernio** (if `LATE_API_KEY` configured):
```
Use gateway MCP tool `late_list_profiles`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
→ Verify at least one profile exists

Use gateway MCP tool `late_list_accounts`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- profile_id: "<brand's profile ID>"
→ Verify connected accounts match what's in brands/{brand}/brand.md Social Publishing section
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
- location_code: <infer from brand timezone/country — e.g. Indonesia=2360, Singapore=2702, Malaysia=2458, US=2840>
```

**8c. MCP connectors (only if connected in Step 7):**

10. **Slack** (if connected) — Send a test DM:
```
slack_send_message to channel $SLACK_NOTIFY_USER:
"✅ Link plugin connected successfully for brand: {brand}"
```

11. **Notion** (if connected) — Try `notion-search` for any page. If it returns results, Notion is connected.

12. **Gmail** (if connected) — Try `gmail_get_profile`. If it returns the user's email, Gmail is connected.

13. **Google Calendar** (if connected) — Try `gcal_list_calendars`. If it returns calendars, Google Calendar is connected.

14. **Windsor.ai** (if connected) — Try Windsor MCP `get_connectors`. If it returns Google Ads / Facebook / GA4 accounts, Windsor is connected.

15. **Canva** (if connected) — Try `list-brand-kits`. If it returns results (even empty), Canva is connected.

16. **GA4 event discovery** (if Windsor.ai connected AND funnel.md has TBD events) — Discover the client's actual GA4 conversion events:
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
| Canva | ✅ / ❌ / ⏭ skipped |

Show the table to the user. If any tests failed, offer to retry or troubleshoot before moving to Step 9. Save all results — they're used in the Step 9 completion email.

**Do not proceed to Step 9 until every configured integration has been tested and the summary table has been shown to the user.**

### Step 9 — Summary & Completion Email

**This step is mandatory and must not be skipped.** Always send the completion email and Slack notification at the end of setup, regardless of how many integrations were configured.

Send a completion email to `$REPORT_EMAIL` with the full setup report.

⚠️ **Do NOT generate HTML.** Build a JSON object. The server-side template (`brand-setup.ts`) renders the styled email with tables, status badges, and callouts.

```
Use gateway MCP tool `fiveagents_send_email`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- to: ${REPORT_EMAIL}
- subject: "✅ Brand setup complete — {brand}"
- html_body: JSON.stringify(payload)
- tag: "brand-setup"
```

⚠️ **`tag` must be exactly `"brand-setup"`** — this routes to the server-side template.

Build the JSON payload from Step 8 validation results:

```json
{
  "brand": "{brand}",
  "files": [
    { "file": "brands/{brand}/brand.md", "status": "created" },
    { "file": "brands/{brand}/product.md", "status": "created" },
    { "file": "brands/{brand}/audience.md", "status": "created" },
    { "file": "brands/{brand}/competitors.md", "status": "created" },
    { "file": "brands/{brand}/funnel.md", "status": "created" },
    { "file": "brands/{brand}/avatars.md", "status": "created" },
    { "file": "brands/{brand}/logo.png", "status": "created | missing" }
  ],
  "connections": [
    { "integration": "Five Agents gateway", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Credential vault", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Email (Postmark)", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Gemini", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Image text overlay", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Image logo overlay", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Zernio", "status": "pass | fail | skipped", "notes": "Connected: Facebook, Instagram, LinkedIn" },
    { "integration": "Argil", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "DataforSEO", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Slack", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Notion", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Gmail", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Google Calendar", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "Windsor.ai", "status": "pass | fail | skipped", "notes": "Connected: Google Ads, Meta Ads, GA4" },
    { "integration": "Canva", "status": "pass | fail | skipped", "notes": "" }
  ],
  "action_items": [
    { "integration": "{name}", "message": "{what failed or was skipped and how to fix / which skill needs it}" }
  ]
}
```

Use `"status": "pass"` for ✅, `"fail"` for ❌, `"skipped"` for ⏭. Only include `action_items` entries for failures and skips that affect skill functionality.

Also print the same summary to the chat and send a Slack notification to `$SLACK_NOTIFY_USER`:

```
✅ Brand "{brand}" setup complete
• {N}/16 integrations connected
• {N} action items (see email for details)
• Brand files: brands/{brand}/
```
