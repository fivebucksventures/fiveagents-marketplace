---
description: Onboard a new brand — configure API keys, connect integrations, analyze website, generate brand context files
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.3.2 | May 06, 2026 |

**Description:** Onboard a new brand — configure API keys, connect integrations, analyze website, generate brand context files

### Change Log

**v2.3.2** — May 06, 2026
- Step 1 — Added `## Arguments` section + project-session redirect at end of Step 1a: after creating the project, user is instructed to open the project and run `/brand-setup -- project created`; all subsequent steps run inside the project session
- Steps 4c-i/ii Step A (carousel + story prompts) — added IMAGE SLOTS AND SIZE LIMIT paragraph: bans embedded images/base64/bundled photos, mandates `uploads/<slot>.png` naming, enforces 3 MB export limit
- Step 4c-i Step C — added 3 MB size check before `shutil.copytree`; if exceeded, blocks copy and surfaces ready-to-paste claude.ai/design re-export prompt
- Step 4c-ii Step C — same 3 MB size check added before copy with tailored re-export prompt

**v2.3.1** — May 06, 2026
- Steps 4c-i/ii Step D — `compute_version_hash` fixed: added `__MACOSX` to exclusion set, unified IGNORE/IGNORE_DIRS into single set, switched directory check from `p.relative_to().parts` to `rel.split("/")` (matches canonical gateway algorithm — without this fix, macOS-extracted templates produce a different hash than the gateway, breaking drift detection permanently)
- Steps 4c-i/ii Step D — zip creation loops updated to use same unified IGNORE set (was using separate IGNORE_DIRS variable)
- Step 4c-i Step A (carousel prompt) — removed stale Playwright offscreen DOM ID requirements; replaced with `.slide` CSS class convention and `uploads/` slot-naming rule (per template authoring requirements)
- Step 4c-ii Step A (story prompt) — same Playwright DOM ID removal; `.slide` CSS class and server-side rendering convention added
- Steps 4c-i/ii Step F — `template_list` brand parameter documented as OPTIONAL

**v2.3.0** — May 06, 2026
- Step 9a — version stamp extracted from link.md Maintenance table; embedded into CLAUDE.md as `<!-- link.md version: ... | Last Changed: ... | Embedded: ... -->` comment inside BEGIN/END markers
- Step 9b — placeholder list extended: `{link_version}`, `{link_version_date}`, `{embed_date}` added for version stamp substitution
- Steps 4c-i/ii (D/E/F) — template upload sub-flow added: zip with noise exclusion, `template_upload` gateway call, `## Social Templates` persisted to brand.md, `template_list` verification
- Step 9c — Visual System block updated: gateway template_render path documented; no local Playwright required for rendering

**v2.2.15** — May 05, 2026
- Step 9 ↔ Step 10 swap — CLAUDE.md initialization now runs before completion email
- Step 4b (Claude Design System) MANDATORY → OPTIONAL — fallback to brand.md colors/voice
- Step 4b/4c install flow rewritten — user provides unzipped folder path, agent copies + renames
- Step 4c rewrite — social templates are React + Babel apps with EDITMODE-BEGIN/END contracts
- Step 9c — detects design-system/, carousel/story templates for CLAUDE.md Visual System block

**v2.2.13** — May 05, 2026
- Meta Ads framing reversed — Windsor.ai is now MANDATORY; Meta Ads MCP is optional enhancement
- Step 7c — META_ADS_SOURCE env var contract documented
- Step 8 #14 — Windsor.ai test verifies all three connectors (Google Ads, GA4, Facebook)

**v2.2.12** — May 04, 2026
- Step 7b — save DEFAULT_BRAND and {BRAND}_NOTION_DB to settings.local.json
- Step 8d — mandatory validation checks for DEFAULT_BRAND and {BRAND}_NOTION_DB
- Step 10b CLAUDE.md template — "Workspace Defaults" section with hardcoded brand slug

**v2.2.11** — May 04, 2026
- Step 10 — CLAUDE.md now embeds full agents/link.md (idempotent BEGIN/END markers)
- Added Meta Ads MCP custom connector (https://mcp.facebook.com/ads)
- Windsor.ai narrowed to Google Ads + GA4 only

**v2.2.10** — May 04, 2026
- Step 4b — Claude Design system installed at brands/{brand}/design-system/
- Step 4c — Social Carousel (4:5) and Social Story (9:16) templates installed
- Step 10a hardened — ABSOLUTE path enforced for agents/link.md

# Brand Setup — New Client Onboarding

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

You are the onboarding agent for the Link marketing plugin. Walk the user through setting up their brand step by step. Be friendly but efficient — explain what each step does and why.

## When to invoke

- First time using the plugin
- Adding a new brand
- User says "set up", "onboard", "add brand", "configure"

## Arguments

| Argument | Meaning |
|---|---|
| `-- project created` | User is already inside the project session. **Skip step 1a** and begin at step 1b. |

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

Once the project is created, ask the user to:

1. Click the project name to **open its session**
2. Inside that project session, run:
   ```
   /brand-setup -- project created
   ```

Brand setup will resume from step 1b inside the correct project context. **Do not continue in this session.**

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
- A Claude account — we'll optionally create your visual design system at https://claude.ai/design (Step 4b — recommended for strongest brand consistency, but skippable; skills fall back to `brand.md` colors/fonts when absent)

**Required API keys:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 1 | `FIVEAGENTS_API_KEY` | Dashboard logging, credential vault, email sending | 1. Go to https://fiveagents.io and sign in<br>2. Go to Dashboard → API Keys<br>3. Copy your `fa_live_...` key |
| 2 | `GEMINI_API_KEY` | Image generation (social graphics, backgrounds) | 1. Go to https://aistudio.google.com/apikey<br>2. Click "Create API Key"<br>3. Copy the key (free tier: 10 images/min) |
| 3 | `SLACK_NOTIFY_USER` | Slack DM notifications after each skill run | 1. Open Slack<br>2. Click your profile photo → "Profile"<br>3. Click the three dots ⋯ → "Copy member ID" |
| 4 | `REPORT_EMAIL` | Daily/weekly marketing report delivery | Your work email address |

**Required for social publishing:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 5 | `LATE_API_KEY` | Social media publishing (Facebook, Instagram, LinkedIn) | 1. Sign up at https://zernio.com<br>2. Create a Profile for your brand<br>3. Connect your social accounts (Facebook, Instagram, LinkedIn) via OAuth<br>4. Go to Settings → API → copy your API key |

**Optional API keys:**

| # | Key | What it's for | How to get it |
|---|---|---|---|
| 6 | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | Keyword research (search volume, suggestions) | 1. Sign up at https://dataforseo.com<br>2. Go to Dashboard → API Settings<br>3. Copy your login email and API password |
| 7 | `ARGIL_API_KEY` | AI avatar talking-head videos (Reels) | 1. Sign up at https://argil.ai<br>2. Create your avatar (upload a video of yourself)<br>3. Go to Settings → API → copy your API key |

**MCP connections (connect in Claude settings):**

| # | MCP | What it's for | How to connect |
|---|---|---|---|
| 1 | **FiveAgents** | All external API calls (Gemini, Zernio, Argil, DataforSEO, email, logging) | Required — configured in Step 7a |
| 2 | **Notion** | Content calendar management | Settings → Connected Apps → Notion → Authorize |
| 3 | **Slack** | Notifications | Settings → Connected Apps → Slack → Authorize |
| 4 | **Gmail** | Reading emails | Settings → Connected Apps → Gmail → Authorize |
| 5 | **Google Calendar** | Scheduling | Settings → Connected Apps → Google Calendar → Authorize |
| 6 | **Windsor.ai** *(required)* | Google Ads + GA4 + Meta Ads (Facebook + Instagram) analytics data — the universal source for all paid-ads + analytics reporting | 1. Sign up for a free account at https://windsor.ai/register<br>2. In Windsor dashboard, connect **all three**: Google Ads, GA4, and Meta Ads (Facebook Ads)<br>3. In Claude, go to Settings → Connected Apps → Windsor.ai → Authorize |
| 7 | **Meta Ads** *(optional enhancement — limited rollout)* | Meta's official MCP for direct Marketing API access. When available, skills prefer it for Meta data; otherwise the Windsor.ai connection above already covers Meta Ads. | Custom Connector — URL `https://mcp.facebook.com/ads` (configured in Step 7c). Skip without prejudice if your account doesn't have access yet — Windsor.ai already covers Meta Ads. |
| 8 | **Canva** | Campaign presentations and pitch decks | Settings → Connected Apps → Canva → Authorize |

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
├── backgrounds/
├── design-system/                  ← installed in Step 4b (Claude Design — OPTIONAL, recommended)
├── social-carousel-template/       ← installed in Step 4c-i (Claude Design — OPTIONAL)
└── social-story-template/          ← installed in Step 4c-ii (Claude Design — OPTIONAL)
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

**Do not proceed to Step 4b until the user has reviewed and confirmed `brand.md` and `audience.md`.**

### Step 4b — Claude Design System (OPTIONAL — recommended)

Anthropic ships **Claude Design** — a visual brand-system builder at https://claude.ai/design. When installed, it becomes the source of truth for visual identity (fonts, colors, components, spacing) and is preferred by every downstream skill that produces visuals. **It is recommended for the strongest brand consistency, but it is not required** — Step 9c will detect whether the design system was installed and skills will fall back to the colors/fonts/voice in `brands/{brand}/brand.md` (plus Gemini + Pillow rendering) when it isn't there.

Ask the user:
> Want me to walk you through creating a Claude Design system for your brand? It's the strongest way to keep every image, post, and deck visually consistent. We can also skip and rely on the brand colors / fonts you already confirmed in `brand.md` — skills will fall back gracefully.

If the user says skip, acknowledge and move on to Step 4c. If yes, walk them through the installation:

> **Step A — Create the design system:**
> 1. Open https://claude.ai/design in your browser
> 2. Click **Create new project** (or **New Design System**)
> 3. Define your brand:
>    - **Colors** — primary, secondary, accent (paste the HEX codes from `brands/{brand}/brand.md` we just generated)
>    - **Typography** — heading font + body font (use the Google Fonts identified in Step 4)
>    - **Components** — buttons, cards, headers (Claude Design will scaffold these)
>    - **Logo** — upload your logo file
>    - **Voice / aesthetic notes** — paste your brand voice from `brand.md`
> 4. Iterate with Claude until the design system feels on-brand
>
> **Step B — Export the design system:**
> 1. Click **Share** → **Download Project as .zip**
> 2. Unzip the file on your computer (you'll get a folder named something like "{Brand Name} Design System")
>
> **Step C — Tell me the path to the unzipped folder; I'll copy it into place for you:**
> 1. Make sure the unzipped folder is somewhere I can read it. In Cowork that means **inside your project folder** (anywhere — root, a subfolder, doesn't matter, as long as it's inside the project mount).
> 2. Tell me the absolute or project-relative path to the folder. I'll copy its contents into `brands/{brand}/design-system/` and rename automatically — no manual renaming required.

Then ask:
> What's the path to your unzipped Claude Design folder? (Examples: `./design-temp/Acme Design System` if you dropped it into your project, or `~/Downloads/Acme Design System` if you're running this locally and your home directory is mounted.)

After the user provides the path, copy the folder using Python:

```python
import shutil
from pathlib import Path

raw = user_input.strip().strip('"').strip("'")
src = Path(raw).expanduser().resolve()

assert src.exists(),   f"Source not found: {src}"
assert src.is_dir(),   f"Not a directory: {src}"
assert any(src.iterdir()), f"Source folder is empty: {src}"

# Handle the common nested-zip case — sometimes unzipping creates a wrapper
# folder containing one inner folder with the same name. Reach inside it.
contents = list(src.iterdir())
if len(contents) == 1 and contents[0].is_dir():
    src = contents[0]

dst = Path("brands") / brand / "design-system"
if dst.exists():
    shutil.rmtree(dst)              # idempotent re-run support
shutil.copytree(src, dst)
```

Confirm to the user:
> ✅ Copied to `brands/{brand}/design-system/`. Your original folder is untouched and can be deleted whenever you like.

If the user-provided path is invalid (not found, not a directory, or empty), tell them what was wrong and ask again — don't fall back to "manually rename" since the whole point of this step is to remove that burden.

**Verification (after the copy succeeds):**

Read `brands/{brand}/design-system/index.html` (or whatever entry file is present — `index.html`, `index.tsx`, `App.tsx`, `README.md`, etc.) to confirm the design system contains the brand's colors and typography. If nothing identifiable is found, surface the file listing to the user and ask whether the export looks right — Claude Design's export structure can vary.

If colors/fonts in the Claude Design system differ from `brands/{brand}/brand.md` (e.g. user refined them in Claude Design), update `brand.md` to match. When the design system is installed, it is authoritative; when it isn't, `brand.md` remains the source of truth on its own.

**Proceed to Step 4c whether or not the design system was installed** — Step 9c will record the actual installed/missing state in CLAUDE.md, and skills will branch accordingly at runtime.

---

### Step 4c — Social Templates (OPTIONAL — recommended)

Two Claude Design templates can be installed — one for IG/FB Carousel posts (4:5, 6 slides: Cover + 4 sign slides + CTA), one for IG/FB Stories and Reels (9:16, 6 slides: Hook → Problem → Solution → Proof → Offer → CTA, with three direction styles A/B/C). Each template is a **self-contained React + Babel app** (entry HTML + JSX + CSS + assets + fonts) with an `EDITMODE-BEGIN`/`EDITMODE-END` JSON block inside the entry HTML that exposes every editable copy field. At runtime, content-generator generates Gemini visuals for each image slot (held in memory as base64), then calls the gateway `template_render` tool which renders the template server-side (Vercel + Playwright on the gateway) and delivers rendered slide PNGs directly to presigned Zernio upload URLs — so brand consistency comes from the template's full React render (logo, layout chrome, slide-number kickers, CTA buttons, eyebrow chips, themes), not from any post-render Pillow overlay. **No local Playwright required.**

**Both are optional.** If skipped, content-generator and creative-designer fall back to a Gemini-generated background + Pillow text overlay + Pillow logo overlay (no brand-specific layout chrome, but still produces working assets).

Ask the user:
> Want me to walk you through the optional social templates? They give every Carousel and Story / Reel a fully branded layout instead of a generic Gemini-generated background — much more polished. We can skip if you're not ready.

If the user says skip, acknowledge and move on to Step 5.

#### 4c-i. Social Carousel Template (Instagram + Facebook, 4:5)

**Step A — Generate the template in Claude Design:**

The agent gives the user a fully-composed, copy-pasteable prompt to drop into Claude Design. Claude Design produces a ready-to-use React + Babel template app with an EDITMODE block — the user iterates on the design, not the code.

**Compose the prompt before showing the user.** Substitute the placeholders below from `brands/{brand}/brand.md`. The user must see only the finished prompt — no `{...}` markers left over.

| Placeholder | Source |
|---|---|
| `{BRAND_NAME}` | proper-cased brand name (from Step 3 — not the slug) |
| `{PRIMARY_HEX}`, `{SECONDARY_HEX}`, `{ACCENT_HEX}` | `brand.md` Colors section |
| `{HEADING_FONT}`, `{BODY_FONT}` | Google Fonts identified in Step 4 |
| `{VOICE_TONE}` | `brand.md` Voice & Tone section, summarized to one short phrase |

**Then present to the user, framed exactly like this:**

> Here's a prompt I've put together for your carousel template. Copy and paste it into Claude Design:
>
> 1. Open https://claude.ai/design in your browser
> 2. Create a new project (name it whatever you like — e.g. "Acme Carousel Template")
> 3. Paste the prompt below into Claude Design's chat:
>
> ```
> "I need a configurable Instagram + Facebook carousel template for {BRAND_NAME}. 4:5 portrait, 1080×1350, 6 slides total: 1 Cover slide + 4 sign / value slides + 1 CTA slide. Build it as a React + Babel app rendered from a single index.html (use Babel standalone via CDN — no build step). The agent will modify copy programmatically per post, so structure matters more than specific sample copy.
>
> The brand uses {PRIMARY_HEX} as primary, {SECONDARY_HEX} as secondary, {ACCENT_HEX} as accent. Headings are set in {HEADING_FONT}, body in {BODY_FONT}. The aesthetic is {VOICE_TONE}. Include the {BRAND_NAME} brand logo subtly in a corner of every slide. Each slide should also have a small page indicator (e.g. '1/6', '2/6'), and the 4 sign slides should have a large kicker numeral on the left ('01', '02', '03', '04').
>
> CRITICAL CONTRACT — wrap all editable copy in a single JSON object inside index.html, marked with /*EDITMODE-BEGIN*/ and /*EDITMODE-END*/ comment markers, exactly like this:
>
> ```
> window.__TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
>   \"accent\": \"purple\",
>   \"footer\": true,
>   \"coverVariant\": \"type\",
>   \"bodyVariant\": \"allnumbers\",
>   \"slideTheme_1\": \"dark\",
>   \"slideTheme_2\": \"cream\",
>   \"slideTheme_3\": \"cream\",
>   \"slideTheme_4\": \"cream\",
>   \"slideTheme_5\": \"cream\",
>   \"slideTheme_6\": \"dark\",
>   \"handle\": \"@{BRAND_NAME_SLUG}\",
>   \"hashtag\": \"#YourTag\",
>   \"cover_eyebrow\": \"sample eyebrow\",
>   \"cover_title\": \"sample cover headline\",
>   \"cover_sub\": \"sample cover subline\",
>   \"s2_kicker\": \"01\", \"s2_title\": \"...\", \"s2_body\": \"...\",
>   \"s3_kicker\": \"02\", \"s3_title\": \"...\", \"s3_body\": \"...\",
>   \"s4_kicker\": \"03\", \"s4_title\": \"...\", \"s4_body\": \"...\",
>   \"s5_kicker\": \"04\", \"s5_title\": \"...\", \"s5_body\": \"...\",
>   \"cta_eyebrow\": \"...\",
>   \"cta_title\": \"...\",
>   \"cta_sub\": \"...\",
>   \"cta_button\": \"...\"
> }/*EDITMODE-END*/;
> ```
>
> Use these EXACT key names — the agent substitutes copy by parsing the JSON between the markers and writing back. Optional supporting keys per sign slide are welcome (e.g. s2_pullquote, s3_stat_value/s3_stat_label, s5_before/s5_after) — the agent can populate them when the post copy provides matching fields, otherwise leave defaults.
>
> Each slide must carry the CSS class `slide` (e.g. `<div class=\"slide\">`) so the gateway can screenshot each `.slide` element in DOM order for server-side rendering. Do NOT use Playwright-specific offscreen DOM IDs — the gateway renders entirely server-side via Vercel.
>
> IMAGE SLOTS AND SIZE LIMIT — the exported ZIP must be under 3 MB. Do NOT embed images as base64 data URIs or bundle any photo or background assets. Use solid colour rectangles or CSS gradients as visual placeholders instead. If a slide needs a swappable image (e.g. a product photo or background), place a plain CSS placeholder and add a corresponding file at `uploads/<slot_name>.png` in the template root — the filename without extension is the slot name the agent fills at render time (e.g. `uploads/s4_visual.png` → slot `s4_visual`). No demo images, no bundled icon sprites, no unused fonts.
>
> Use the brand colors and fonts above. The template's sample copy will be replaced at runtime — don't worry about it being final."
> ```
>
> Iterate with Claude inside Claude Design until the 6 slide layouts look on-brand — you can ask for tweaks like "make the cover darker" or "swap the gradient direction on slide 4". Don't worry about the sample copy; it gets replaced per post at runtime. Once the layout looks good, let me know and we'll move to Step B (export).

**Wait for the user to confirm they're happy with the template before moving on to Step B.** Don't rush — the iteration inside Claude Design is the creative step; brand-setup should pause cleanly here.

**Step B — Export the template from Claude Design:**

Once the user confirms the template is ready, tell them how to export. Claude Design exports the project as a ZIP containing the **React + Babel source code** (entry HTML, `*.jsx`, `*.css`, assets, fonts). The skill copies it locally and uploads it to the gateway — the gateway renders per-post server-side via `template_render`, so no local Playwright is needed.

> Great — let's export it. In Claude Design's main toolbar, click **Share → Download Project as .zip** (the standard project export — gives you the full HTML/JSX/CSS source). Unzip the file somewhere inside your Cowork project mount so I can read it, then let me know the path.

**Wait for the user to confirm the file is downloaded and unzipped before moving on to Step C.**

**Step C — Give me the path; I'll copy the template into place:**

Ask the user:

> What's the path to your unzipped Carousel Template folder? (e.g. `./carousel-temp/Acme Carousel Template`)

After the user provides the path, copy the folder and verify the EDITMODE contract:

```python
import re, shutil
from pathlib import Path

raw = user_input.strip().strip('"').strip("'")
src = Path(raw).expanduser().resolve()
assert src.exists() and src.is_dir() and any(src.iterdir()), f"Invalid source folder: {src}"

# Handle nested-zip case
contents = list(src.iterdir())
if len(contents) == 1 and contents[0].is_dir():
    src = contents[0]

# Size check — must be ≤ 3 MB before copying
total_bytes = sum(p.stat().st_size for p in src.rglob("*") if p.is_file())
if total_bytes > 3 * 1024 * 1024:
    total_mb = total_bytes / (1024 * 1024)
    raise ValueError(f"SIZE_EXCEEDED:{total_mb:.1f}")

dst = Path("brands") / brand / "social-carousel-template"
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)

# Verify EDITMODE block exists in an entry HTML
entry_html = next(
    (p for p in dst.glob("*.html")
     if "EDITMODE-BEGIN" in p.read_text(encoding="utf-8")),
    None
)
assert entry_html is not None, (
    f"No entry HTML with EDITMODE-BEGIN block found in {dst}. "
    "Re-export from Claude Design — the template must contain index.html (or similar) with "
    "/*EDITMODE-BEGIN*/...JSON.../*EDITMODE-END*/ markers."
)

# Verify the JSON parses and contains the expected carousel keys
import json
m = re.search(r'/\*EDITMODE-BEGIN\*/(.*?)/\*EDITMODE-END\*/', entry_html.read_text(encoding="utf-8"), re.DOTALL)
tweaks = json.loads(m.group(1))
required_carousel_keys = {
    "cover_eyebrow", "cover_title", "cover_sub",
    "s2_kicker", "s2_title", "s2_body",
    "s3_kicker", "s3_title", "s3_body",
    "s4_kicker", "s4_title", "s4_body",
    "s5_kicker", "s5_title", "s5_body",
    "cta_eyebrow", "cta_title", "cta_sub", "cta_button",
}
missing_keys = required_carousel_keys - set(tweaks.keys())
assert not missing_keys, (
    f"EDITMODE block is missing required carousel keys: {sorted(missing_keys)}. "
    "Re-iterate with Claude Design to ensure all Cover, s2-s5, and CTA keys are present."
)
```

**If `ValueError: SIZE_EXCEEDED:{X}` is raised**, do not copy. Show the user:

> ⚠️ Your carousel template is **{X} MB** — over the 3 MB limit. Embedded images are the most common cause.
>
> Go back to [claude.ai/design](https://claude.ai/design), open your carousel project, and paste this prompt:
>
> ```
> This template is used by an automated agent that uploads and renders it server-side. It must be under 3 MB. Please:
> 1. Remove all embedded images (base64 data URIs, <img> tags with data: src, or any bundled photo assets) — replace with a solid colour placeholder or CSS gradient
> 2. Remove any unused fonts, icon sets, or external CDN resources that aren't actually referenced in the layout
> 3. Remove sample/demo background photos — the agent supplies images at render time via named files in the uploads/ folder
> 4. Keep only the HTML, CSS, and JavaScript needed for the layout structure
> Re-export, re-download, and unzip the new version. Then tell me the new folder path.
> ```

Ask the user to let you know the new folder path once re-exported. Then re-run Step C from the top.

Confirm to the user:
> ✅ Copied to `brands/{brand}/social-carousel-template/` — entry HTML `{entry_html.name}` validated, EDITMODE contract present with all required keys. Original folder untouched.

**Step D — Zip and upload to gateway:**

Compute the canonical `version_hash` and create the upload zip using Python:

```python
import hashlib, io, base64, zipfile
from pathlib import Path

folder = Path("brands") / brand / "social-carousel-template"
IGNORE = {".DS_Store", "Thumbs.db", ".git", "node_modules", "__MACOSX"}

def compute_version_hash(folder: Path) -> str:
    h = hashlib.sha256()
    files = sorted(
        (p for p in folder.rglob("*") if p.is_file()),
        key=lambda p: p.relative_to(folder).as_posix()
    )
    for p in files:
        rel = p.relative_to(folder).as_posix()
        if any(part in IGNORE for part in rel.split("/")):
            continue
        h.update(hashlib.sha256(rel.encode()).hexdigest().encode())
        h.update(b":")
        h.update(hashlib.sha256(p.read_bytes()).hexdigest().encode())
        h.update(b"\n")
    return h.hexdigest()

local_hash = compute_version_hash(folder)

buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    for path in folder.rglob("*"):
        if not path.is_file(): continue
        rel = path.relative_to(folder).as_posix()
        if any(part in IGNORE for part in rel.split("/")):
            continue
        zf.write(path, arcname=rel)
zip_b64 = base64.b64encode(buf.getvalue()).decode()
zip_mb = len(buf.getvalue()) / 1_048_576
assert zip_mb < 10, f"Zip is {zip_mb:.1f} MB — remove large assets and retry."
```

Upload to gateway:
```
Use gateway MCP tool template_upload:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"
- template_type: "carousel"
- zip_base64: <zip_b64>
```

On success, capture: `version_hash`, `edit_keys`, `image_slots`, `uploaded_at` from the response.
On 5xx → retry once after 5 seconds, then fail with "gateway error — try again later".
On 4xx (zip/schema invalid) → show the error and ask the user to re-export from Claude Design. Do not write to brand.md.

| Failure | Action |
|---|---|
| `template_upload` 4xx | Show error + ask user to re-export from Claude Design, do not retry |
| `template_upload` 5xx | Retry once after 5s, then fail with "gateway error — try again later" |
| Zip > 10 MB | Abort with instructions to remove large assets |

**Step E — Persist to `brands/{brand}/brand.md`:**

After a successful `template_upload` response, append (or update if already present) the `## Social Templates` section in `brand.md`:

```markdown
## Social Templates

- Carousel — version `{version_hash}` uploaded {uploaded_at}
  - Edit keys: {len(edit_keys)}
  - Image slots: {len(image_slots)}
```

If a `## Social Templates` section already exists (re-run scenario), replace its Carousel entry while preserving any Story entry. Only write this after a confirmed successful upload response.

**Step F — Verification gate:**

```
Use gateway MCP tool template_list:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"   # OPTIONAL — omit to list all brands; pass brand to scope to this brand only
- verbose: false
```

Confirm the response includes `template_type: "carousel"` with `version_hash` matching the value returned by `template_upload`. If absent or hash mismatch, fail and instruct the user to re-run Step D. Do not mark the step complete until this check passes.

> ✅ Carousel template uploaded to gateway — version `{version_hash[:8]}...`, {len(edit_keys)} edit keys, {len(image_slots)} image slot(s). Verified with `template_list`.

If the path is invalid, re-ask. If the EDITMODE block is missing or the required keys are absent, tell the user what was wrong and ask them to re-iterate with Claude Design (referencing the prompt in Step A). If the user skips this template entirely, leave the folder absent — Step 9c records `missing` and skills fall back to Gemini + Pillow.

#### 4c-ii. Social Story Template (Instagram + Facebook, 9:16)

**Step A — Generate the template in Claude Design:**

Same pattern as Step 4c-i: the agent composes a copy-pasteable prompt and gives it to the user. Claude Design produces a React + Babel template app with an EDITMODE block; the user iterates on the design.

**Compose the prompt before showing the user.** Substitute the same placeholders as in 4c-i (from `brands/{brand}/brand.md`): `{BRAND_NAME}`, `{PRIMARY_HEX}`, `{SECONDARY_HEX}`, `{ACCENT_HEX}`, `{HEADING_FONT}`, `{BODY_FONT}`, `{VOICE_TONE}`. The user must see only the finished prompt — no `{...}` markers left over.

**Then present to the user, framed exactly like this:**

> Here's a prompt I've put together for your Story / Reel template. Copy and paste it into Claude Design:
>
> 1. Open https://claude.ai/design in your browser
> 2. Create a new project (name it whatever you like — e.g. "Acme Story Template")
> 3. Paste the prompt below into Claude Design's chat:
>
> ```
> "I need a configurable Instagram + Facebook Story / Reel template for {BRAND_NAME}. 9:16 vertical, 1080×1920, 6 slides total following a Hook → Problem → Solution → Proof → Offer → CTA narrative. Build it as a React + Babel app rendered from a single entry HTML (Babel standalone via CDN — no build step). Three direction styles (A / B / C) sharing the same copy but different visual treatments.
>
> The brand uses {PRIMARY_HEX} as primary, {SECONDARY_HEX} as secondary, {ACCENT_HEX} as accent. Headings are set in {HEADING_FONT}, body in {BODY_FONT}. Aesthetic: {VOICE_TONE}. Include the {BRAND_NAME} brand logo on every slide. Respect IG safe zones (top ~14% for username/header, bottom ~14% for reply bar / Reel UI).
>
> Direction styles:
> - **Direction A — Spotlight Dark:** brand-led campaigns. Eyebrow → headline → divider pill, dark backgrounds, accent color leading.
> - **Direction B — Editorial Stat:** when a single big number is the hero. Oversized stat as the centerpiece.
> - **Direction C — Cream Press:** light, magazine-style. For case studies, testimonials, founder posts.
>
> CRITICAL CONTRACT — wrap all editable copy in a JSON object inside the entry HTML, marked with /*EDITMODE-BEGIN*/ and /*EDITMODE-END*/ comment markers, using these EXACT key names per slide:
>
> ```
> /*EDITMODE-BEGIN*/{
>   \"_direction\": \"all\",
>   \"_brandLogo\": true,
>   \"handle\": \"@{BRAND_NAME_SLUG}\",
>   \"s1_eyebrow\": \"...\", \"s1_headline_pre\": \"...\", \"s1_headline_accent\": \"...\", \"s1_sub\": \"...\", \"s1_live\": \"...\", \"s1_big\": \"...\", \"s1_big_unit\": \"...\",
>   \"s2_eyebrow\": \"...\", \"s2_headline\": \"...\", \"s2_pain1\": \"...\", \"s2_pain2\": \"...\", \"s2_pain3\": \"...\",
>   \"s3_eyebrow\": \"...\", \"s3_headline_pre\": \"...\", \"s3_headline_accent\": \"...\", \"s3_sub\": \"...\",
>   \"s4_eyebrow\": \"...\", \"s4_headline\": \"...\", \"s4_stat1_num\": \"...\", \"s4_stat1_lbl\": \"...\", \"s4_stat2_num\": \"...\", \"s4_stat2_lbl\": \"...\", \"s4_stat3_num\": \"...\", \"s4_stat3_lbl\": \"...\", \"s4_stat4_num\": \"...\", \"s4_stat4_lbl\": \"...\", \"s4_quote\": \"...\", \"s4_quote_author\": \"...\",
>   \"s5_eyebrow\": \"...\", \"s5_headline\": \"...\", \"s5_b1\": \"...\", \"s5_b2\": \"...\", \"s5_b3\": \"...\", \"s5_b4\": \"...\", \"s5_pill\": \"...\",
>   \"s6_eyebrow\": \"...\", \"s6_headline_pre\": \"...\", \"s6_headline_accent\": \"...\", \"s6_sub\": \"...\", \"s6_cta\": \"...\", \"s6_url\": \"...\"
> }/*EDITMODE-END*/;
> ```
>
> Each slide (across all directions) must carry the CSS class `slide` (e.g. `<div class="slide">`) so the gateway can screenshot each `.slide` element in DOM order for server-side rendering. Do NOT use Playwright-specific offscreen DOM IDs — the gateway renders entirely server-side via Vercel.
>
> IMAGE SLOTS AND SIZE LIMIT — the exported ZIP must be under 3 MB. Do NOT embed images as base64 data URIs or bundle any photo or background assets. Use solid colour rectangles or CSS gradients as visual placeholders instead. If a slide needs a swappable image (e.g. a background photo or visual), place a plain CSS placeholder and add a corresponding file at `uploads/<slot_name>.png` in the template root — the filename without extension is the slot name the agent fills at render time (e.g. `uploads/hero.png` → slot `hero`). No demo images, no bundled icon sprites, no unused fonts.
>
> Use brand colors and fonts. Sample copy will be replaced at runtime."
> ```
>
> Iterate with Claude inside Claude Design until the 6 slide layouts (Hook → Problem → Solution → Proof → Offer → CTA) and the 3 directions (A/B/C) all look on-brand. Don't worry about the sample copy; it gets replaced per post at runtime. Once the layout looks good, let me know and we'll move to Step B (export).

**Wait for the user to confirm they're happy with the template before moving on to Step B.** Don't rush — the iteration inside Claude Design is the creative step; brand-setup should pause cleanly here.

**Step B — Export the template from Claude Design:**

Once the user confirms the template is ready, tell them how to export. Claude Design exports the project as a ZIP containing the **React + Babel source code** (entry HTML, `*.jsx`, `*.css`, assets, fonts). The skill copies it locally and uploads it to the gateway — the gateway renders per-post server-side via `template_render`, so no local Playwright is needed.

> Great — let's export it. In Claude Design's main toolbar, click **Share → Download Project as .zip** (the standard project export — gives you the full HTML/JSX/CSS source). Unzip the file somewhere inside your Cowork project mount so I can read it, then let me know the path.

**Wait for the user to confirm the file is downloaded and unzipped before moving on to Step C.**

**Step C — Give me the path; I'll copy the template into place:**

Ask the user:

> What's the path to your unzipped Story Template folder? (e.g. `./story-temp/Acme Story Template`)

After the user provides the path, copy the folder and verify the EDITMODE contract:

```python
import json, re, shutil
from pathlib import Path

raw = user_input.strip().strip('"').strip("'")
src = Path(raw).expanduser().resolve()
assert src.exists() and src.is_dir() and any(src.iterdir()), f"Invalid source folder: {src}"

contents = list(src.iterdir())
if len(contents) == 1 and contents[0].is_dir():
    src = contents[0]

# Size check — must be ≤ 3 MB before copying
total_bytes = sum(p.stat().st_size for p in src.rglob("*") if p.is_file())
if total_bytes > 3 * 1024 * 1024:
    total_mb = total_bytes / (1024 * 1024)
    raise ValueError(f"SIZE_EXCEEDED:{total_mb:.1f}")

dst = Path("brands") / brand / "social-story-template"
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src, dst)

# Verify EDITMODE block exists in an entry HTML
entry_html = next(
    (p for p in dst.glob("*.html")
     if "EDITMODE-BEGIN" in p.read_text(encoding="utf-8")),
    None
)
assert entry_html is not None, (
    f"No entry HTML with EDITMODE-BEGIN block found in {dst}. "
    "Re-export from Claude Design — the template must contain an entry HTML with "
    "/*EDITMODE-BEGIN*/...JSON.../*EDITMODE-END*/ markers."
)

# Verify the JSON parses and contains the expected story keys
m = re.search(r'/\*EDITMODE-BEGIN\*/(.*?)/\*EDITMODE-END\*/', entry_html.read_text(encoding="utf-8"), re.DOTALL)
tweaks = json.loads(m.group(1))
required_story_keys = {
    "s1_eyebrow", "s1_headline_pre", "s1_headline_accent", "s1_sub",
    "s2_eyebrow", "s2_headline", "s2_pain1", "s2_pain2", "s2_pain3",
    "s3_eyebrow", "s3_headline_pre", "s3_headline_accent", "s3_sub",
    "s4_eyebrow", "s4_headline",
    "s5_eyebrow", "s5_headline", "s5_b1", "s5_b2", "s5_b3", "s5_b4",
    "s6_eyebrow", "s6_headline_pre", "s6_headline_accent", "s6_sub", "s6_cta", "s6_url",
}
missing_keys = required_story_keys - set(tweaks.keys())
assert not missing_keys, (
    f"EDITMODE block is missing required story keys: {sorted(missing_keys)}. "
    "Re-iterate with Claude Design to ensure all H/P/S/P/O/CTA slide keys (s1_* through s6_*) are present."
)
```

**If `ValueError: SIZE_EXCEEDED:{X}` is raised**, do not copy. Show the user:

> ⚠️ Your story template is **{X} MB** — over the 3 MB limit. Embedded images are the most common cause.
>
> Go back to [claude.ai/design](https://claude.ai/design), open your story project, and paste this prompt:
>
> ```
> This template is used by an automated agent that uploads and renders it server-side. It must be under 3 MB. Please:
> 1. Remove all embedded images (base64 data URIs, <img> tags with data: src, or any bundled photo assets) — replace with a solid colour placeholder or CSS gradient
> 2. Remove any unused fonts, icon sets, or external CDN resources that aren't actually referenced in the layout
> 3. Remove sample/demo background photos — the agent supplies images at render time via named files in the uploads/ folder
> 4. Keep only the HTML, CSS, and JavaScript needed for the layout structure
> Re-export, re-download, and unzip the new version. Then tell me the new folder path.
> ```

Ask the user to let you know the new folder path once re-exported. Then re-run Step C from the top.

Confirm to the user:
> ✅ Copied to `brands/{brand}/social-story-template/` — entry HTML `{entry_html.name}` validated, EDITMODE contract present with all required H/P/S/P/O/CTA keys. Original folder untouched.

**Step D — Zip and upload to gateway:**

Compute the canonical `version_hash` and create the upload zip using Python (same algorithm as Step 4c-i Step D — `compute_version_hash`, `IGNORE`):

```python
folder = Path("brands") / brand / "social-story-template"
local_hash = compute_version_hash(folder)

buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    for path in folder.rglob("*"):
        if not path.is_file(): continue
        rel = path.relative_to(folder).as_posix()
        if any(part in IGNORE for part in rel.split("/")):
            continue
        zf.write(path, arcname=rel)
zip_b64 = base64.b64encode(buf.getvalue()).decode()
zip_mb = len(buf.getvalue()) / 1_048_576
assert zip_mb < 10, f"Zip is {zip_mb:.1f} MB — remove large assets and retry."
```

Upload to gateway:
```
Use gateway MCP tool template_upload:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"
- template_type: "story"
- zip_base64: <zip_b64>
```

On success, capture: `version_hash`, `edit_keys`, `image_slots`, `uploaded_at` from the response.
On 5xx → retry once after 5 seconds. On 4xx → show error, ask user to re-export. Same failure table as Step 4c-i Step D.

**Step E — Persist to `brands/{brand}/brand.md`:**

Update the `## Social Templates` section in `brand.md` (append Story entry, preserve any Carousel entry already written by Step 4c-i):

```markdown
- Story — version `{version_hash}` uploaded {uploaded_at}
  - Edit keys: {len(edit_keys)}
  - Image slots: {len(image_slots)}
```

**Step F — Verification gate:**

```
Use gateway MCP tool template_list:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"   # OPTIONAL — omit to list all brands; pass brand to scope to this brand only
- verbose: false
```

Confirm the response includes `template_type: "story"` with `version_hash` matching the value returned by `template_upload`. If absent or hash mismatch, fail and instruct re-upload.

> ✅ Story template uploaded to gateway — version `{version_hash[:8]}...`, {len(edit_keys)} edit keys, {len(image_slots)} image slot(s). Verified with `template_list`.

If the path is invalid, re-ask. If the EDITMODE block is missing or required keys are absent, tell the user what was wrong and ask them to re-iterate with Claude Design (referencing the prompt in Step A). If the user skips this template entirely, leave the folder absent — Step 9c records `missing` and skills fall back to Gemini + Pillow.

**Do not proceed to Step 5 until both 4b and 4c have been addressed — installed or explicitly skipped. Either outcome is acceptable; Step 9c will record the actual state in CLAUDE.md.**

### Step 5 — Research & Context Generation

Now that `brand.md` and `audience.md` exist, run `/link-skills:research-strategy` to fill in the remaining context files. The research skill will:
- Read brand.md + audience.md for context
- Research competitors automatically (no need to ask the user)
- Analyze market positioning, strengths, weaknesses
- Keyword research is skipped at this stage — DataforSEO keys are not entered until Step 7. After completing Step 7, the user can re-run `/link-skills:research-strategy` to add keyword data to the strategy outputs.

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

**Do not proceed until `product.md`, `competitors.md`, `funnel.md`, and `avatars.md` are generated and the user has confirmed the funnel mapping.**

### Step 6 — Logo

Make sure the logo file is somewhere I can read it. **In Cowork that means inside your project folder** (anywhere — root, a subfolder, doesn't matter, as long as it's inside the project mount). On local Claude Code, any path under your `$HOME` works.

Ask the user:
> What is the file path to your logo? (PNG, transparent background preferred. Examples: `./logo.png` or `./assets/logo.png` if you dropped it into your project — for Cowork, this needs to be inside your project mount.)

Copy the file from the provided path to `brands/{brand}/logo.png`:

```python
import shutil
from pathlib import Path

raw = user_input.strip().strip('"').strip("'")
src = Path(raw).expanduser().resolve()

assert src.exists(),  f"Logo not found: {src}"
assert src.is_file(), f"Not a file: {src}"

dst = Path("brands") / brand / "logo.png"
dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(src, dst)
```

If the path is invalid, tell the user what was wrong and ask again. This file is read by Python Pillow in content-generator and creative-designer for logo compositing.

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

**Optional (ask for each — skip if not ready):**

| # | Key | What it does | How to get it |
|---|---|---|---|
| 6 | `DATAFORSEO_LOGIN` | Keyword research & search volume | https://dataforseo.com — sign up, copy login email |
| 7 | `DATAFORSEO_PASSWORD` | Keyword research & search volume | DataforSEO dashboard → API Settings → API password |
| 8 | `ARGIL_API_KEY` | AI avatar videos for Reels | https://argil.ai — sign up, create your avatar, go to Settings → API → copy key |

**Save ALL keys to `.claude/settings.local.json`:**

For every key the user provides in Step 7b (including `FIVEAGENTS_API_KEY`, `GEMINI_API_KEY`, `SLACK_NOTIFY_USER`, `REPORT_EMAIL`, `LATE_API_KEY`, and any optional keys), save it to `.claude/settings.local.json` under the `"env"` object using the exact env var name shown in the tables above. This is required — all skills read credentials from env vars at runtime.

**Also save these two vars — required for all automated skills:**

```
DEFAULT_BRAND   → the brand slug (e.g. "five-agents", "npc-office") — used by all skills to determine the active brand without user input
{BRAND}_NOTION_DB → the Notion Social Calendar DB page ID (e.g. "320c93e588f880b69cf6f52bd50444b5") — required by social-calendar and content-generator
```

To get the Notion DB ID: open the Social Calendar database in Notion → click Share → Copy link → the 32-character hex string in the URL is the page ID. Save it as `{BRAND}_NOTION_DB` where `{BRAND}` is the brand slug uppercased with hyphens removed (e.g. `FIVEAGENTS_NOTION_DB`, `NPCOFFICE_NOTION_DB`).

**Also store API keys in the credential vault (for Cowork use):**

After saving ALL keys to `settings.local.json`, store each external API key in the encrypted vault so the gateway can access it:

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

Note: `FIVEAGENTS_API_KEY`, `SLACK_NOTIFY_USER`, and `REPORT_EMAIL` do NOT need vault storage — they are passed directly as tool parameters or used by built-in MCP connectors. They still MUST be saved to `.claude/settings.local.json` (done above).

Note: Google Ads, GA4, and Meta Ads (Facebook + Instagram) credentials are all handled by the Windsor.ai MCP connector — no gateway storage needed. The optional Meta Ads custom connector (`https://mcp.facebook.com/ads`) likewise authenticates via OAuth and stores nothing in the gateway vault. The Meta Ads MCP is in limited rollout — when available, downstream skills prefer it; when not, Windsor.ai already covers Meta data.

Keys are encrypted via Supabase Vault and can never be retrieved after storage. If the user needs to update a key later, they can re-run this step or use the dashboard UI at fiveagents.io.

**7c. MCP Connectors:**

Walk the user through each one. Explain what it does, ask the user to confirm they've connected it. If "not now", move on and note as unconfigured.

**Meta Ads — Windsor.ai is the standard path; Meta Ads MCP is an optional enhancement:**

Meta Ads (Facebook + Instagram) data is **always pulled through Windsor.ai** (`source: "facebook"`) because Windsor is universally available and exposes near-parity with Meta's Marketing API — campaign / ad-set / ad / lp_views / video_views / conversions are all surfaced under their Windsor field names. **Connecting Meta Ads inside the Windsor.ai dashboard is mandatory** for every brand, and is part of the standard Windsor.ai Connected App setup further down this step.

Meta also ships an **official MCP server** at `https://mcp.facebook.com/ads`. It is currently in **limited rollout** — many accounts can't add it yet. Treat it as an **optional enhancement**: when the user has access, downstream skills will prefer it (it queries Meta's Marketing API directly with no Windsor middle-layer). When the user doesn't have access, Windsor.ai already covers everything those skills need — there is no degraded mode.

**Optional — try the Meta Ads MCP (skip without prejudice if the user can't access it):**

1. In Cowork, go to **Customize → Connectors → "Add custom connector"**
2. Name: `Meta Ads`
3. URL: `https://mcp.facebook.com/ads`
4. Click **Connect** and sign in with the Facebook/Meta Business account that owns the brand's ad accounts

Ask:
> (Optional) Meta has an official MCP server you can also try, which gives skills slightly more direct access to the Marketing API. Want to give it a shot? If "Add custom connector" isn't visible, or sign-in fails with a "not available" error, no problem — your Windsor.ai connection (next) already covers Meta Ads fully.

- **If the user adds it successfully** → save `META_ADS_SOURCE=meta_ads_mcp` to `.claude/settings.local.json` `env` block. Downstream skills (`digital-marketing-analyst`, `data-analysis`) will prefer the MCP for Meta data.
- **If the user skips or can't add it** → leave `META_ADS_SOURCE` unset. Downstream skills default to Windsor for Meta data, which is the universally-supported path.

⚠️ **Connecting Meta Ads inside Windsor.ai is required regardless of whether the optional MCP was added** — never skip it. The MCP, when present, is layered on top of (not in place of) the Windsor connection.

**Connected Apps (OAuth via Settings → Connected Apps):**

| # | MCP | What it does | How to connect |
|---|---|---|---|
| 1 | **Notion** | Content calendar, strategies & briefs | Settings → Connected Apps → Notion → Authorize |
| 2 | **Slack** | Notifications after each skill run | Settings → Connected Apps → Slack → Authorize |
| 3 | **Gmail** | Reading emails + report delivery | Settings → Connected Apps → Gmail → Authorize |
| 4 | **Google Calendar** | Scheduling content drops and meetings | Settings → Connected Apps → Google Calendar → Authorize |
| 5 | **Windsor.ai** *(required)* | Google Ads + GA4 + Meta Ads (Facebook + Instagram) — **all three are mandatory**. Connecting Meta Ads in Windsor is required regardless of whether the optional Meta Ads MCP was added above. | 1. Sign up for a free account at https://windsor.ai/register (if you don't have one yet)<br>2. In Windsor dashboard, connect Google Ads, GA4, **and** Meta Ads (Facebook Ads)<br>3. Then in Claude: Settings → Connected Apps → Windsor.ai → Authorize |
| 6 | **Canva** | Campaign presentations and pitch decks | Settings → Connected Apps → Canva → Authorize |

For Notion, Slack, Gmail, Google Calendar, and Canva, ask:
> Have you connected {MCP name} in your Claude settings? (Settings → Connected Apps)

For Windsor.ai specifically, walk the user through all 3 steps before asking if they're done:
1. "First, do you have a Windsor.ai account? If not, sign up free at https://windsor.ai/register"
2. "Once you have an account, go to your Windsor dashboard and connect three accounts: **Google Ads, GA4, and Meta Ads (Facebook Ads)**. All three are required — Meta Ads in Windsor is the universal source for Meta data, regardless of whether you also added the optional Meta Ads MCP earlier."
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

14. **Windsor.ai** (mandatory) — Try Windsor MCP `get_connectors`. Verify the result includes **all three required connectors**: Google Ads, GA4, **and** Facebook (Meta Ads). All three are non-skippable — if any are missing, ask the user to connect the missing one in their Windsor dashboard before continuing. Mark ❌ if any of the three is absent; do not pass partial.

15. **Meta Ads MCP** (only if `META_ADS_SOURCE=meta_ads_mcp` — user opted into the optional MCP) — Call a basic listing tool on the Meta Ads connector (e.g. list ad accounts) and confirm it returns the user's Meta ad accounts without an auth error. If the call fails with an authorization error, ask the user to re-sign-in to the Meta Ads custom connector. **If `META_ADS_SOURCE` is unset** (user did not add the optional MCP, or couldn't), mark this row as ⏭ skipped — Meta data is fully validated through the Windsor.ai check above and downstream skills will use Windsor for Meta automatically.

16. **Canva** (if connected) — Try `list-brand-kits`. If it returns results (even empty), Canva is connected.

17. **GA4 event discovery** (if Windsor.ai connected AND funnel.md has TBD events) — Discover the client's actual GA4 conversion events:
```
Use Windsor.ai MCP tool `get_fields`:
- source: "googleanalytics4"
```
Look for key events and custom events (e.g. `click_whatsapp`, `click_email`, `schedule_call`, `signup_form_submit`, `trial_activated`, `purchase`, etc.). Filter out standard GA4 events (page_view, session_start, first_visit) — focus on key events (formerly called "conversions") and custom events that look like conversion actions.

Show the user the events found:
> "I found these key events / custom events in your GA4 account: [list]. Which of these are your conversion actions for the funnel?"

After the user confirms, **update `brands/{brand}/funnel.md`** — replace any `TBD` event names with the confirmed GA4 event names.

**8d. Workspace env vars (mandatory — required by automated skills):**

18. **`DEFAULT_BRAND`** — Confirm `.claude/settings.local.json` `env` block contains `DEFAULT_BRAND` set to the brand slug (e.g. `"five-agents"`, `"npc-office"`). If missing, ask the user for the brand slug and save it now. Required by every skill to determine the active brand without user input on scheduled runs.

19. **`{BRAND}_NOTION_DB`** — Confirm `.claude/settings.local.json` `env` block contains `{BRAND}_NOTION_DB` (e.g. `FIVEAGENTS_NOTION_DB`, `NPCOFFICE_NOTION_DB` — `{BRAND}` is the slug uppercased, hyphens removed) set to the 32-character hex page ID of the brand's Notion Social Calendar database. If missing, walk the user through it: Notion → open the Social Calendar database → click Share → Copy link → extract the 32-hex-char ID from the URL → save it now. Required by social-calendar and content-generator.

Both env var checks are mandatory — they are NOT skippable. If either is missing, do not show ⏭ in the summary table; show ❌ and stop until the user provides the value.

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
| Windsor.ai (Google Ads + GA4 + Meta Ads — all required) | ✅ / ❌ |
| Meta Ads MCP (optional enhancement) | ✅ / ❌ / ⏭ skipped |
| Canva | ✅ / ❌ / ⏭ skipped |
| `DEFAULT_BRAND` env var | ✅ / ❌ |
| `{BRAND}_NOTION_DB` env var | ✅ / ❌ |

Show the table to the user. If any tests failed, offer to retry or troubleshoot before moving on. Save all results — they are used in the Step 10 completion email after CLAUDE.md is wired in Step 9.

**Do not proceed to Step 9 until every configured integration has been tested and the summary table has been shown to the user.**

### Step 9 — Initialize Workspace CLAUDE.md

**This step is mandatory and must not be skipped.** It ensures every future session in this workspace (including scheduled/automated runs) loads the Link agent identity and credentials automatically. It runs **before** the completion email in Step 10 so that any CLAUDE.md write failure is caught and surfaced in the email rather than silently leaving the workspace half-configured.

We **embed the full content of `agents/link.md` directly into `CLAUDE.md`** rather than referencing an absolute path. This way the workspace is self-contained — scheduled runs, fresh clones, and machines without the plugin installed all still get the agent identity, because Claude Code auto-loads `CLAUDE.md` at session start.

#### 9a. Locate and read agents/link.md

The agent definition file is bundled with the plugin. Find it on disk and read its contents into a variable.

The skill runs inside the **Cowork sandbox** (Ubuntu Linux VM, regardless of host OS), so the canonical search location is `$CLAUDE_CONFIG_DIR/**/agents/link.md`. The host-OS patterns are kept as fallbacks for the rare case the skill is invoked outside Cowork (e.g. local Claude Code on the user's machine).

```python
import glob, os

# Cowork-first: $CLAUDE_CONFIG_DIR is the canonical plugin root inside the sandbox
# (e.g. /sessions/<name>/mnt/.claude). $HOME/.claude is a secondary location.
config_dir = os.environ.get("CLAUDE_CONFIG_DIR")

patterns = []
if config_dir:
    patterns.append(os.path.join(config_dir, "**/agents/link.md"))
patterns.extend([
    os.path.expanduser("~/.claude/**/agents/link.md"),                              # Linux / Cowork sandbox $HOME
    os.path.expandvars(r"%APPDATA%\Claude\**\agents\link.md"),                      # Windows host (Claude Code locally)
    os.path.expanduser("~/Library/Application Support/Claude/**/agents/link.md"),   # macOS host (Claude Code locally)
])

found = [f for p in patterns for f in glob.glob(p, recursive=True)]

if found:
    link_md_path = os.path.abspath(os.path.realpath(found[0]))
    link_md_content = open(link_md_path, encoding='utf-8').read()
else:
    link_md_path = ""
    link_md_content = ""
```

**Why `$CLAUDE_CONFIG_DIR` first:** Cowork runs all skill code inside a sandboxed Ubuntu VM where `process.platform === "linux"` always. The Windows `%APPDATA%` and macOS `~/Library/Application Support/Claude` patterns will never match inside the sandbox (they're for the user's host OS, which isn't reachable from skill code). `$CLAUDE_CONFIG_DIR` is the env var Cowork sets to point at the mounted plugin tree (typically `/sessions/<session>/mnt/.claude`), so it's the only pattern guaranteed to find link.md inside Cowork. The `~/.claude` pattern works in some Cowork configurations via bindfs mounts but isn't reliable.

If the search returns empty, ask the user:
> I couldn't auto-detect `agents/link.md`. Can you paste the **full absolute path** to it? (Hint: in Cowork, run `echo $CLAUDE_CONFIG_DIR` in a terminal and look under that directory; on local Claude Code, search your Claude application data folder — Windows `%APPDATA%\Claude`, macOS `~/Library/Application Support/Claude`, Linux `~/.claude`.)

After the user pastes a path, normalize, validate, and read:

```python
user_path = os.path.abspath(os.path.expanduser(os.path.expandvars(user_input.strip().strip('"').strip("'"))))
assert os.path.isfile(user_path), f"File not found: {user_path}"
link_md_path = user_path
link_md_content = open(link_md_path, encoding='utf-8').read()
```

**Strip the YAML frontmatter** from `link_md_content` before embedding (the `---` block at the top with `name:` / `description:`). The frontmatter is a plugin-loader directive and has no meaning inside `CLAUDE.md`:

```python
import re
link_md_body = re.sub(r'^---\s*\n.*?\n---\s*\n', '', link_md_content, count=1, flags=re.DOTALL).lstrip()
```

**Extract the version from the Maintenance table** so it can be stamped into `CLAUDE.md`:

```python
import datetime
version_match = re.search(r'\|\s*Link\s*\|\s*(v[\S]+)\s*\|\s*([^|\n]+)\s*\|', link_md_content)
link_version = version_match.group(1).strip() if version_match else "unknown"
link_version_date = version_match.group(2).strip() if version_match else "unknown"
embed_date = datetime.date.today().isoformat()   # e.g. 2026-05-06
```

`link_md_body` is what gets embedded in 9b.

#### 9b. Read or create CLAUDE.md

Check if `CLAUDE.md` exists at the workspace root (same folder as `brands/` and `outputs/`).

Build the **workspace block** to inject. Substitute these placeholders verbatim:
- `{LINK_MD_BODY}` — the stripped contents of `link_md_body` from 9a
- `{brand}` — the brand slug from Step 3 (same value saved as `DEFAULT_BRAND`, e.g. `five-agents`)
- `{BRAND}` — the brand slug uppercased with hyphens removed, used as the env var prefix (e.g. `FIVEAGENTS`, `NPCOFFICE`)
- `{notion_db_id}` — the 32-character Notion Social Calendar DB page ID collected in Step 7b
- `{link_version}` — the version string extracted from link.md's Maintenance table (e.g. `v2.3.0`)
- `{link_version_date}` — the Last Changed date from link.md's Maintenance table (e.g. `May 06, 2026`)
- `{embed_date}` — today's date in ISO format (e.g. `2026-05-06`), set by `datetime.date.today().isoformat()`

```markdown
# {Brand Name} — Workspace Instructions

## Agent Identity (auto-loaded every session)

The full content of `agents/link.md` is embedded below. It defines your identity (Link), active brand logic, available skills, tools, integrations, output conventions, and quality checklist. All skill runs depend on it.

<!-- BEGIN agents/link.md (embedded by brand-setup) -->
<!-- link.md version: {link_version} | Last Changed: {link_version_date} | Embedded: {embed_date} -->

{LINK_MD_BODY}

<!-- END agents/link.md -->

---

## Credential Loading (REQUIRED — read this first on every run)

Scheduled and automated runs do **not** automatically inject environment variables from `.claude/settings.local.json`. You must load them manually at the start of every skill run using this snippet:

    import os, json
    from pathlib import Path

    def load_credentials():
        search = Path(os.getcwd())
        for p in [search] + list(search.parents):
            settings_file = p / ".claude" / "settings.local.json"
            if settings_file.exists():
                data = json.loads(settings_file.read_text())
                for k, v in data.get("env", {}).items():
                    if not os.environ.get(k):
                        os.environ[k] = v
                return True
        return False

    load_credentials()

Run this **before** reading any env var (`FIVEAGENTS_API_KEY`, `SLACK_NOTIFY_USER`, `{BRAND}_LATE_FB`, etc.). If `FIVEAGENTS_API_KEY` is still missing after this step, log a `failed` run and exit — do not skip publishing silently.

---

## Workspace Defaults

These values are hardcoded here at brand-setup time so any session reading `CLAUDE.md` has them immediately — no env lookup required for the common path. They are also saved in `.claude/settings.local.json` `env` block as a fallback.

- **Active brand:** `{brand}` (env: `DEFAULT_BRAND`)
- **Brand files:** `brands/{brand}/`
- **Notion Social Calendar DB:** `{notion_db_id}` (env: `{BRAND}_NOTION_DB`)

**Fallback rule:** if either tagged value above looks empty or stale (e.g. a literal `{brand}` placeholder that never got substituted, or this `CLAUDE.md` was copied from another workspace), run the credential loader and read from env:

    brand = os.environ["DEFAULT_BRAND"]
    notion_db = os.environ[f"{brand.replace('-', '').upper()}_NOTION_DB"]

## Workspace Structure

    brands/{brand}/                          — brand context root
      ├─ brand.md, audience.md, product.md,  — written by brand-setup Steps 4–5
      │  competitors.md, funnel.md,
      │  avatars.md, logo.png
      ├─ backgrounds/                        — pre-generated background images (background-generator skill)
      ├─ design-system/                      — Claude Design export (Step 4b — see Visual System below)
      ├─ social-carousel-template/           — 4:5 IG/FB carousel template (Step 4c-i — optional)
      └─ social-story-template/              — 9:16 Stories/Reels template (Step 4c-ii — optional)
    outputs/{brand}/                         — all generated content (copy .md, images .png, videos .mp4)
    tmp/                                     — scratch space for scripts, intermediate files

## Account IDs (Zernio / Late API)

Read from env vars after credential loading:
- Facebook:  `{BRAND}_LATE_FB`
- Instagram: `{BRAND}_LATE_IG`
- LinkedIn:  `{BRAND}_LATE_LI`

---
```

**If `CLAUDE.md` already exists:**
- If it contains the markers `<!-- BEGIN agents/link.md (embedded by brand-setup) -->` and `<!-- END agents/link.md -->`, replace everything between (and including) those markers with the freshly read `{LINK_MD_BODY}` wrapped in the same markers **and a refreshed version stamp comment** (`<!-- link.md version: {link_version} | Last Changed: {link_version_date} | Embedded: {embed_date} -->`). Leave the rest of the file untouched.
- If it contains an older `## Agent Identity` section that points to an absolute path (the previous format), replace the entire block from `## Agent Identity` down through the `---` separator with the new workspace block above.
- Otherwise, prepend the new workspace block above all existing content.
- Refresh the `## Workspace Defaults` section: rewrite **Active brand**, **Brand files**, and **Notion Social Calendar DB** to point at the brand from this run. For multi-brand workspaces, do NOT overwrite — append a new sub-block under `## Workspace Defaults` titled `### Brand: {brand}` with the same three bullets, leaving prior brands' sub-blocks intact. The `DEFAULT_BRAND` env var still selects which brand is active per session.

**If `CLAUDE.md` does not exist:**
- Create it with the full workspace block above.

Show the user what was written:
> ✅ `CLAUDE.md` updated — the Link agent definition is now embedded directly in this workspace, so every future session loads it automatically (no plugin path lookups needed).

#### 9c. Detect and wire brand visual assets (best-effort — non-mandatory)

After `CLAUDE.md` is written by 9b, scan `brands/{brand}/` for the three brand visual asset folders that Steps 4b and 4c may have installed. Their canonical names (lowercase, hyphenated — exactly as the user was instructed to rename them) are:

| Folder | Installed by | Used by |
|---|---|---|
| `brands/{brand}/design-system/` | Step 4b (Claude Design system export) | every visual-producing skill — colors, typography, components, spacing |
| `brands/{brand}/social-carousel-template/` | Step 4c-i (4:5 IG/FB carousel template export) | content-generator and creative-designer for rendering; content-creation reads the EDITMODE key contract to size copy correctly |
| `brands/{brand}/social-story-template/` | Step 4c-ii (9:16 Stories/Reels template export) | content-generator and creative-designer for rendering; content-creation reads the EDITMODE key contract to size copy correctly |

⚠️ **Non-mandatory.** All three folders are optional (Steps 4b and 4c are recommended-but-skippable). This detection step does **not** fail or block when folders are missing — it just records each as `missing` so the email and CLAUDE.md reflect reality. Skills fall back to `brand.md` colors/fonts + Gemini + Pillow rendering when a folder is absent. Never error out, never block the Step 10 completion email.

```python
from pathlib import Path

brand_root = Path("brands") / brand  # `brand` is the slug from Step 3

def folder_status(name):
    p = brand_root / name
    if p.is_dir() and any(p.iterdir()):
        return "installed"
    return "not installed"

design_system_status = folder_status("design-system")
carousel_template_status = folder_status("social-carousel-template")
story_template_status = folder_status("social-story-template")
```

**Build the Visual System block** to inject into `CLAUDE.md`. Substitute each `{*_status}` placeholder verbatim with `installed` or `not installed`:

```markdown
<!-- BEGIN visual-system (managed by brand-setup Step 9c) -->

## Visual System

Detected at brand-setup time. Re-run Step 9c (or the full brand-setup) after installing additional templates to refresh.

- **Design system:** `brands/{brand}/design-system/` — **{design_system_status}** (source of truth for colors, typography, components, spacing — read by every visual-producing skill)
- **Carousel template (4:5, IG/FB feed):** `brands/{brand}/social-carousel-template/` — **{carousel_template_status}**
- **Story template (9:16, Stories/Reels):** `brands/{brand}/social-story-template/` — **{story_template_status}**

**How skills use this:** when a template folder shows `installed`, `creative-designer` and `content-generator` render via the gateway `template_render` tool — the skill generates Gemini visuals for each image slot (base64 in memory), presigns Zernio upload slots, then calls `template_render` which renders the template server-side and PUTs rendered slide PNGs directly to the presigned Zernio URLs. `content-creation` reads the EDITMODE key contract to size per-slide copy correctly (it does not render). When `not installed`, all skills fall back to Gemini image generation + Pillow text overlay + Pillow logo overlay. The fallback path is fully functional — visuals are still produced, just without brand-specific layout chrome. Skills should still filesystem-probe at runtime as a safety check; this section is a hint, not a contract.

<!-- END visual-system (managed by brand-setup Step 9c) -->
```

**Inject into `CLAUDE.md` idempotently:**
- If `CLAUDE.md` already contains the markers `<!-- BEGIN visual-system (managed by brand-setup Step 9c) -->` and `<!-- END visual-system (managed by brand-setup Step 9c) -->`, replace everything between (and including) those markers with the freshly built block. Leave the rest of the file untouched.
- Otherwise, append the new block to the end of `CLAUDE.md` preceded by a blank line.

Show the user a concise status line:
> ✅ `CLAUDE.md` Visual System section refreshed:
> - design-system: **{design_system_status}**
> - social-carousel-template: **{carousel_template_status}**
> - social-story-template: **{story_template_status}**

If all three came back `not installed`, gently prompt:
> Heads up — none of your brand visual asset folders are present yet. Skills will still work (they fall back to Gemini + Pillow), but for the most on-brand visuals, run Step 4b (design system) and optionally Step 4c (carousel/story templates) when you have time.

This step is non-blocking and safe to re-run on its own at any later point — useful when the user finishes installing a template after initial brand-setup.

**Do not proceed to Step 10 until 9b has written `CLAUDE.md` (9c is best-effort and may report `not installed` for any folder without blocking).** If the 9b write itself failed, fix it first — Step 10 will report the actual write status in the email, but a hard write failure should be resolved before the user is told setup is complete.

### Step 10 — Summary & Completion Email

**This step is mandatory and must not be skipped.** It is the final step of brand-setup. Always send the completion email and Slack notification once Steps 8 (validation) and 9 (CLAUDE.md) have completed, regardless of how many integrations were configured.

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

Build the JSON payload from Step 8 validation results **and** Step 9 CLAUDE.md / visual-asset status:

```json
{
  "brand": "{brand}",
  "files": [
    { "file": "brands/{brand}/brand.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/product.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/audience.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/competitors.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/funnel.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/avatars.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/logo.png", "status": "present | missing | failed" },
    { "file": "CLAUDE.md", "status": "present | missing | failed" },
    { "file": "brands/{brand}/design-system/", "status": "present | missing | failed" },
    { "file": "brands/{brand}/social-carousel-template/", "status": "present | missing | failed" },
    { "file": "brands/{brand}/social-story-template/", "status": "present | missing | failed" }
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
    { "integration": "Windsor.ai", "status": "pass | fail", "notes": "Required: Google Ads + GA4 + Meta Ads (Facebook + Instagram) all connected — universal source for paid ads + analytics" },
    { "integration": "Meta Ads MCP", "status": "pass | fail | skipped", "notes": "Optional enhancement — Marketing API direct access. When connected (META_ADS_SOURCE=meta_ads_mcp), downstream skills prefer it over Windsor for Meta data. When skipped or unavailable, Windsor.ai already covers Meta Ads fully." },
    { "integration": "Canva", "status": "pass | fail | skipped", "notes": "" },
    { "integration": "DEFAULT_BRAND env var", "status": "pass | fail", "notes": "Active brand slug — required by every skill (mandatory, not skippable)" },
    { "integration": "{BRAND}_NOTION_DB env var", "status": "pass | fail", "notes": "Notion Social Calendar DB page ID — required by social-calendar and content-generator (mandatory, not skippable)" }
  ],
  "action_items": [
    { "integration": "{name}", "message": "{what failed or was skipped and how to fix / which skill needs it}" }
  ]
}
```

**`files[]` status enum** — every row uses the same three values:
- `present` — file or folder exists with expected content (the happy path; covers "newly created", "already existed and updated", and "installed by user").
- `missing` — file/folder absent because the relevant step was skipped or the user didn't supply input (e.g. `logo.png` when the user skipped Step 6, `social-carousel-template/` when the user skipped Step 4c).
- `failed` — the write/copy/folder-probe operation raised an error during this run (e.g. permission denied, disk full, Step 9b couldn't write CLAUDE.md). A `failed` value on `CLAUDE.md` MUST also produce an `action_items` entry pointing the user to retry Step 9.

**Where each `files[]` status comes from:**
- `.md` rows and `logo.png` — set during the file-generation steps (3, 4, 5, 6). Use `present` if written, `missing` if the user skipped the step, `failed` if the write raised.
- `CLAUDE.md` — set by Step 9b: `present` if the file is on disk with the expected workspace block (whether newly created or refreshed in place), `failed` if the write raised. (`missing` should never appear since Step 9 is mandatory.)
- The three visual asset folder rows — set by Step 9c's `folder_status()` results: `present` when the folder exists and is non-empty, `missing` when absent or empty.

**`connections[]` status enum** — `pass | fail | skipped`. Use `"pass"` for ✅, `"fail"` for ❌, `"skipped"` for ⏭. Only include `action_items` entries for failures and skips that **actually affect skill functionality**. Specifically:

- ✅ **Do** add an action item for any `fail` (these always need user action).
- ✅ **Do** add an action item for `skipped` keys/MCPs whose absence breaks a skill (e.g. `LATE_API_KEY` skipped → social-publisher can't post; `GEMINI_API_KEY` skipped → no image generation).
- ✅ **Do** add an action item if `CLAUDE.md` came back `failed` from Step 9b — scheduled / automated runs depend on it.
- ❌ **Do NOT** add an action item for skipped **Meta Ads MCP** — Windsor.ai already covers Meta data fully when the MCP isn't available, so a skip here is a no-op for downstream skills, not a gap.
- ❌ **Do NOT** add an action item for genuinely optional integrations the user explicitly declined (e.g. `ARGIL_API_KEY` skipped because the brand doesn't want avatar videos).
- ❌ **Do NOT** add an action item for visual asset folders showing `missing` — Step 9c already nudged the user inline; padding the email with these rows isn't useful.

Also print the same summary to the chat and send a Slack notification to `$SLACK_NOTIFY_USER`:

```
✅ Brand "{brand}" setup complete
• {N}/18 integrations connected
• CLAUDE.md: {present | failed}
• {N} action items (see email for details)
• Brand files: brands/{brand}/
```
