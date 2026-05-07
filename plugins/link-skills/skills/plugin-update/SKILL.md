---
description: Bring an existing brand's setup up to date with the latest plugin version — detects gaps since the user last ran brand-setup and fills them interactively.
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.4.1 | May 07, 2026 |

**Description:** Bring an existing brand's setup up to date with the latest plugin version — detects gaps since the user last ran brand-setup and fills them interactively

### Change Log

**v2.4.1** — May 07, 2026
- Step 1e — added MCP probe rows for PostHog, Gamma, and Meta Ads MCP (optional). Now matches every connector validated by brand-setup Step 8c-bis.
- Step 2 — gap report example expanded to surface the new business-operations MCPs and the 5 v2.4.0 brand-context files (sales/CS/finance/investors/operations)
- Step 3a — added top-of-section pre-fill rule + per-bullet pre-fill summaries for the 5 v2.4.0 files. Plugin-update context guarantees v2.0 source files exist, so pre-fill is essentially mandatory; agent reads brand.md/product.md/audience.md/etc. and drafts answers instead of asking from scratch
- Step 3f — rewrote MCP gap-fill flow with explicit per-MCP walkthrough prompts for **all 14 MCPs** (was only Windsor + Playwright). Closes the gap where business-ops MCPs flagged in Step 1e were silently skipped during interactive fill.
- **Step 3g — fixed CLAUDE.md re-embed bug.** Previous version only refreshed the `<!-- link.md version: ... -->` stamp comment, leaving the embedded `agents/link.md` body unchanged. After a `git pull` that brought new content (e.g. v2.4.0's 10 business-ops skills), CLAUDE.md would stamp `v2.4.0` while its embedded body still described v2.3.x. New logic strips link.md's frontmatter, builds a full BEGIN/END block (stamp + body), and atomically replaces everything between the markers. Added post-write verification: grep for a string unique to the new version (e.g. `apollo-lead-prospector` after a v2.4.0 upgrade) to confirm the body was actually swapped.
- **Step 4b (NEW) — Agent Readiness Summary** using the canonical spec from brand-setup Step 8d. Same translation table, status rules, display format. Inputs come from Step 1 audit overlaid with Step 3 fix outcomes, so the matrix reflects post-fix state.
- Step 5b — email payload + Slack DM use the same readiness-first format as brand-setup Step 10. Top 3 fixes inline, full list in email.

**v2.4.0** — May 07, 2026
- Step 1a — added 5 new brand context file rows: sales.md, customer-success.md, finance.md, investors.md, operations.md
- Step 1d — added 7 new auto-bootstrapped Notion DB env vars (${BRAND}_CRM_DB, ${BRAND}_CUSTOMER_DB, ${BRAND}_INVOICE_TRACKER_DB, ${BRAND}_REPORTS_DB, ${BRAND}_COMPETITOR_DB, ${BRAND}_MEETINGS_DB, ${BRAND}_ACTIONS_DB)
- Step 1e — added MCP probe rows for Apollo.io, Calendly, Stripe, Xero (used by new business-operations skills)
- Step 1j — added 10 new skill rows in version-audit table: apollo-lead-prospector, outreach-sequencer, proposal-generator, customer-onboarder, churn-predictor, invoice-collector, financial-reporter, competitor-monitor, investor-update-writer, meeting-analyzer
- Step 3a — added fill handlers for 5 new context files + competitors.md extension (each delegates to the matching brand-setup Step 5g–5l sub-step)
- Step 3e — handled new DB env vars (mostly "auto-bootstrapped, no action")
- Step 3j — added 10 new changelog → brand-action mappings for the new skills
- UX intro audit — added top-level "What this skill does" overview + per-step intro paragraphs across all 6 steps; conversational tone, time estimates per step

**v2.3.2** — May 06, 2026
- Step 3c upload sub-flow — added step 0 size check (3 MB) before zip/upload; if local template exceeds limit, blocks upload and surfaces ready-to-paste claude.ai/design re-export prompt; Case 3 reference updated to Steps 0–5

**v2.3.1** — May 06, 2026
- Step 1h `compute_version_hash` — fixed: added `__MACOSX` to exclusion set, unified IGNORE/IGNORE_DIRS into single set, switched directory check to `rel.split("/")` (matches canonical gateway algorithm — without this fix hash drift detection always mismatches macOS-extracted templates)
- Step 1h `template_list` call — brand parameter documented as OPTIONAL

**v2.3.0** — May 06, 2026
- New skill introduced — audits brand folder, env vars, MCP connectors, Claude Code settings, Notion DB
- Step 0 — version gap detection using skill/agent maintenance sections; brand.md Plugin Version tracking
- Step 1h — template upload status check via template_list + local version_hash comparison
- Step 1j — skill/agent version audit: reads all maintenance sections, builds version delta table
- Step 3c — 4 remediation cases for template gaps (missing, not uploaded, hash drift, remote only)
- Step 3j — changelog-driven brand action mapping: maps skill changelog entries to required brand actions
- Step 5 — writes current plugin version to brand.md `## Plugin Version` after completion

# Plugin Update — Catch Existing Brands Up to Latest Plugin Version

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

You are the upgrade agent for the Link marketing plugin. The user has already run `brand-setup` at some earlier plugin version, and the plugin has since added new requirements (mandatory files, env vars, MCPs, CLAUDE.md sections, etc.). Your job is to **detect what's missing** in the current brand setup and walk the user through filling **only those gaps** — never re-run steps that are already complete.

This skill is **idempotent**. Running it twice in a row should produce a clean "nothing to do" report on the second pass.

## When to invoke

- After upgrading to a new plugin version (e.g. `git pull` in the marketplace folder)
- When a brand was set up months ago and skills are throwing "missing file / missing env var" errors
- User says "update", "upgrade", "catch up", "what's missing", "plugin-update"

## How this differs from brand-setup

| Aspect | brand-setup | plugin-update |
|---|---|---|
| When | First time, new brand | Existing brand, after plugin upgrade |
| Greenfield | Yes — writes everything | No — only fills gaps |
| Order | Linear, all 10 steps | Skips anything already complete |
| Re-asks for known data | Yes | No — reuses what's on disk |

If `brands/{brand}/` does not exist at all, this skill exits and tells the user to run `/link-skills:brand-setup` first.

## What this skill does

When you upgrade the plugin (e.g. `git pull` in the marketplace folder), some skills will have new requirements — new brand context files, new env vars, new MCP integrations, new sections in `brand.md`. Plugin-update is the **idempotent catch-up runner**: it inspects every brand asset, env var, MCP probe, and `CLAUDE.md` setting against the current plugin's expectations, then walks you through filling **only the gaps**. It never re-asks for data that's already on disk.

**Estimated time:** 5–30 minutes for a typical run. A clean brand (no gaps) finishes in ~5 minutes (mostly automated inspection). A heavily-outdated brand (e.g. last set up 6 months ago, missing the v2.4.0 sales/finance/customer-success files) can take 30–60 minutes if you choose to fill all the new context files in this session.

**The 6 steps:**

| # | Step | Purpose | Time |
|---|---|---|---|
| 0 | Determine version gap | Read current plugin version + brand's last-applied version; build the changeset that needs catching up | ~30 sec (auto) |
| 1 | Detect current state | Inspect every brand file, env var, MCP connector, CLAUDE.md section — no user prompts, just look | 1–2 min (auto) |
| 2 | Show the gap report | Compact summary of what's present / missing / optional, grouped by category. One question: "want to fill these now?" | 1 min |
| 3 | Fill the gaps interactively | Walk through each missing item in order. Each fill delegates to the matching brand-setup sub-step | 2–60 min (variable) |
| 4 | Re-validate | Test only the integrations touched in Step 3 to confirm fixes worked | 1–2 min |
| 5 | Record version + email + Slack | Write current plugin version to `brand.md`, send completion email, DM Slack | 30 sec |

The skill is **idempotent** by design — running it twice in a row should produce a clean "nothing to do" report on the second pass. You can pause anywhere (e.g. say "skip" to a gap you don't want to fill now) and re-run later to pick up where you left off.

---

## Step 0 — Determine version gap

First the agent figures out **what changed** between the version your brand was set up at and the version you have installed now. It reads `version.ts` for the current installed version, looks at `brands/{brand}/brand.md` for the brand's last-applied version stamp, and reads every skill's maintenance section to build a per-skill version delta. The output is a list of what's new since the brand was last configured — the input that drives Step 3's brand-action mapping.

**Expect ~30 seconds.** Fully automated. Only asks you a question if the brand's last-applied version is missing from `brand.md` (in which case it asks you to recall when the brand was last set up).

### 0a. Read current plugin version

Open `plugins/link-skills/versions/version.ts` and read `DEFAULT_VERSION` (e.g. `v2.2.15`). This is the version the user has installed right now.

### 0b. Read last-applied version for this brand

Open `brands/{brand}/brand.md` and look for a `## Plugin Version` section:
- If present → `last_applied = that version string`
- If missing → ask the user: "What version were you on when you last ran brand-setup or plugin-update? (Run `git log --oneline -5` in this folder if unsure.)"
- If unknown → treat `last_applied = v2.0.0` (full audit)

### 0c. Read skill and agent maintenance sections

For each of the following files, read the `## Maintenance` block and extract the `Version` value from the table:

| File | Extract |
|---|---|
| `plugins/link-skills/agents/link.md` | Version |
| `plugins/link-skills/skills/brand-setup/SKILL.md` | Version |
| `plugins/link-skills/skills/content-generator/SKILL.md` | Version |
| `plugins/link-skills/skills/creative-designer/SKILL.md` | Version |
| `plugins/link-skills/skills/content-creation/SKILL.md` | Version |
| `plugins/link-skills/skills/social-calendar/SKILL.md` | Version |
| `plugins/link-skills/skills/digital-marketing-analyst/SKILL.md` | Version |
| `plugins/link-skills/skills/data-analysis/SKILL.md` | Version |
| `plugins/link-skills/skills/social-publisher/SKILL.md` | Version |
| `plugins/link-skills/skills/research-strategy/SKILL.md` | Version |
| `plugins/link-skills/skills/campaign-presenter/SKILL.md` | Version |
| `plugins/link-skills/skills/background-generator/SKILL.md` | Version |
| `plugins/link-skills/skills/plugin-update/SKILL.md` | Version |

### 0d. Build the version delta

Flag each skill/agent whose maintenance `Version` is **newer than `last_applied`**. These are the files that changed since the user's brand was last configured. Also flag any skill/agent that is **new** (did not exist at `last_applied` — compare the file list on disk against what version.ts history shows was introduced).

---

## Step 1 — Detect current state

Now the agent does a **read-only inspection sweep** of everything related to this brand — folder contents, brand.md sections, env vars, MCP connectors, CLAUDE.md, Notion DBs, template uploads, skill versions. No questions yet, no fixes — just look. Each sub-step (1a–1j) checks one category and tags items as present / missing / drift. The output of this step is the gap report you'll see in Step 2.

**Expect 1–2 minutes.** Mostly automated; a few MCP probes will hit external services (e.g. Notion, Apollo, Xero) which can be slow if connections are flaky.

Read everything that exists for the active brand. Do **not** prompt the user yet — just inspect.

### 1a. Brand folder contents

Check existence of each path under `brands/{brand}/`. Mark present/missing:

| Path | Required since | Status |
|---|---|---|
| `brand.md` | v2.0 | present / missing |
| `product.md` | v2.0 | present / missing |
| `audience.md` | v2.0 | present / missing |
| `competitors.md` | v2.0 | present / missing |
| `funnel.md` | v2.1.0 | present / missing |
| `avatars.md` | v2.1.0 | present / missing |
| `logo.png` | v2.0 | present / missing |
| `backgrounds/` | v2.0 (now empty by design) | present / missing |
| `design-system/` | v2.2.10 (optional — brand.md fallback since v2.2.15) | present / missing |
| `social-carousel-template/` | v2.2.10 (optional) | present / missing |
| `social-story-template/` | v2.2.10 (optional) | present / missing |
| `sales.md` | v2.4.0 | present / missing |
| `customer-success.md` | v2.4.0 | present / missing |
| `finance.md` | v2.4.0 | present / missing |
| `investors.md` | v2.4.0 (optional — only required if brand has raised external capital) | present / missing |
| `operations.md` | v2.4.0 (optional — meeting-analyzer falls back gracefully) | present / missing |

### 1b. brand.md sections

Read `brands/{brand}/brand.md` and check for these section headers (added in different versions):

| Section | Required since | Status |
|---|---|---|
| `## Tagline` | v2.0 | present / missing |
| `## Voice & Tone` | v2.0 | present / missing |
| `## Colors (HEX codes)` | v2.0 | present / missing |
| `## Locale` (Currency / Timezone / Meta USD exchange rate) | v2.2.0 | present / missing |
| `## Approved Phrases` | v2.0 | present / missing |
| `## Do NOT Say` | v2.0 | present / missing |
| `## Social Publishing` (Zernio profile + connected platforms) | v2.2.1 | present / missing |

### 1c. funnel.md schema

Open `brands/{brand}/funnel.md` if present. Confirm it has:
- `## Stages (Google Ads)` table with GA4 event mappings
- `## Stages (Meta Ads)` table
- `## Cost Benchmarks` table
- No remaining `TBD` event names (if any → flag for re-mapping)

### 1d. Env vars in `.claude/settings.local.json`

Read `.claude/settings.local.json` (search up from cwd). Check the `env` block:

**Required:**
| Env var | Required since |
|---|---|
| `FIVEAGENTS_API_KEY` | v2.0 |
| `GEMINI_API_KEY` | v2.0 |
| `SLACK_NOTIFY_USER` | v2.0 |
| `REPORT_EMAIL` | v2.0 |
| `LATE_API_KEY` | v2.1.0 |
| `{BRAND}_LATE_FB` / `_IG` / `_LI` | v2.2.1 |
| `{BRAND}_NOTION_DB` | v2.2.10 (social-calendar bootstraps if missing) |

**Optional:**
| Env var | Notes |
|---|---|
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | Keyword research |
| `ARGIL_API_KEY` | AI avatar Reels |
| `DEFAULT_BRAND` | Workspace default brand |

**Auto-bootstrapped (no user action required at setup; created on first run of the relevant skill):**
| Env var | Bootstrapped by | Required since |
|---|---|---|
| `${BRAND}_CRM_DB` | apollo-lead-prospector / outreach-sequencer / proposal-generator | v2.4.0 |
| `${BRAND}_CUSTOMER_DB` | customer-onboarder / churn-predictor | v2.4.0 |
| `${BRAND}_INVOICE_TRACKER_DB` | invoice-collector | v2.4.0 |
| `${BRAND}_REPORTS_DB` | financial-reporter / investor-update-writer | v2.4.0 |
| `${BRAND}_COMPETITOR_DB` | competitor-monitor | v2.4.0 |
| `${BRAND}_MEETINGS_DB` | meeting-analyzer | v2.4.0 |
| `${BRAND}_ACTIONS_DB` | meeting-analyzer | v2.4.0 |

For each: if present + the matching DB exists in Notion → ✅ skip. If missing → not flagged as a gap (the skill will create on first run). The audit reports presence informationally only.

For each missing key, mark whether it's required or optional.

### 1e. MCP connectors

You cannot directly probe what the user has connected in Claude settings. Instead, **lazily test** each one with a low-cost call and treat connection errors as "not connected":

| MCP | Probe | Required since |
|---|---|---|
| Five Agents (gateway) | `fiveagents_log_run` (test entry) | v2.0 |
| Notion | `notion-search` query="ping" | v2.0 |
| Slack | `slack_search_users` query="me" | v2.0 |
| Gmail | `list_labels` | v2.0 |
| Google Calendar | `list_calendars` | v2.0 |
| Windsor.ai | `get_connectors` | v2.1.0 |
| Canva | `list-brand-kits` | v2.1.0 |
| Playwright | check `claude mcp list` (Bash) | v2.1.4 (website analysis in brand-setup Step 4 — template rendering now uses gateway) |
| Apollo.io | `apollo_users_api_profile` | v2.4.0 |
| Calendly | OAuth status check (Calendly MCP gates real tools behind authenticate) | v2.4.0 |
| Stripe | OAuth status check (Stripe MCP gates real tools behind authenticate) | v2.4.0 |
| Xero | `whoami` | v2.4.0 |
| PostHog | `user-get` | v2.4.0 (used by `churn-predictor`; `data-analysis` may already validate it — reuse if so) |
| Gamma | `get_themes` | v2.4.0 (used by `investor-update-writer`; `campaign-presenter` may already validate it — reuse if so) |
| Meta Ads MCP *(optional enhancement — limited rollout)* | attempt any `ads_*` tool call (e.g. `ads_get_ad_accounts`); 401 / not-found → not connected | v2.2.13 (Windsor.ai already covers Meta data fully when this isn't connected — never flag as a required gap) |

### 1f. Workspace CLAUDE.md

Check `CLAUDE.md` at the workspace root (alongside `brands/`).

| Item | Required since |
|---|---|
| File exists | v2.2.7 |
| Contains `## Agent Identity` block | v2.2.7 |
| `link.md` path is **absolute** (`os.path.isabs == True`) | **v2.2.10** |
| `link.md` path is correct (file exists at that location) | v2.2.7 |
| Contains `## Credential Loading` block with `load_credentials()` snippet | v2.2.7 |
| `## Active Brand` section names the current brand | v2.2.7 |
| Version stamp `<!-- link.md version: ... -->` present inside BEGIN/END markers | v2.3.0 |
| Version stamp matches current `agents/link.md` Maintenance version (will be refreshed in Step 3g regardless) | v2.3.0 |

### 1g. Claude Code settings

Read `.claude/settings.local.json` and `~/.claude/settings.json` for:

| Setting | Required since |
|---|---|
| Bypass permissions mode (`Allow bypass permissions mode`) | v2.2.3 |
| Domain Allowlist set to **All Domains** | v2.2.4 |
| Project Permission set to **Act without asking** | v2.2.5 |

These are UI settings — surface them to the user as a manual checklist if you can't read them programmatically.

### 1h. Template upload status (v2.3.0)

For each social template folder that exists locally, check whether it is uploaded to the gateway and whether the local hash matches:

```
Use gateway MCP tool template_list:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- brand: "{brand}"   # OPTIONAL — omit to list all brands; pass brand to scope to this brand only
- verbose: false
```

For each local template folder (`social-carousel-template/` and `social-story-template/`):

| Local state | Gateway state | Flag |
|---|---|---|
| Folder exists | No gateway entry | ❌ not uploaded — upload needed |
| Folder exists | Gateway entry present | Compute local hash and compare |
| Folder missing | Any | Skip (covered by Step 1a) |
| No local folder | Gateway entry exists | ⚠️ local copy missing (no action needed — gateway still renders) |

Compute the local `version_hash` for each present local folder using the canonical algorithm:

```python
import hashlib
from pathlib import Path

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
```

Compare to the `version_hash` from `template_list`. Mark as `match` (✅), `drift` (⚠️ local changed since last upload), or `not uploaded` (❌).

### 1i. Notion DB for social calendar

If `{BRAND}_NOTION_DB` is set:
- `notion-fetch` it. If success and the returned object is a database with `Name` (title) property → OK.
- If the fetch returns `not_found` or the object is not a database → mark for re-bootstrap.

If `{BRAND}_NOTION_DB` is unset → mark as missing (social-calendar will bootstrap on first run, but we offer to do it now).

### 1j. Skill and agent version audit

Using the data collected in Step 0, build a version table:

| File | Installed version | Changed since {last_applied}? |
|---|---|---|
| agents/link.md | v2.3.0 | ✅ yes |
| brand-setup | v2.2.15 | ✅ yes |
| content-generator | v2.2.15 | ✅ yes |
| creative-designer | v2.2.15 | ✅ yes |
| content-creation | v2.2.15 | ✅ yes |
| social-calendar | v2.2.15 | ✅ yes |
| background-generator | v2.2.15 | ✅ yes |
| digital-marketing-analyst | v2.2.13 | — no |
| data-analysis | v2.2.13 | — no |
| social-publisher | v2.2.5 | — no |
| research-strategy | v2.2.5 | — no |
| campaign-presenter | v2.2.5 | — no |
| plugin-update | v2.3.0 | ✅ yes (new) |
| `apollo-lead-prospector` | v2.4.0 | ✅ yes (new) |
| `outreach-sequencer` | v2.4.0 | ✅ yes (new) |
| `proposal-generator` | v2.4.0 | ✅ yes (new) |
| `customer-onboarder` | v2.4.0 | ✅ yes (new) |
| `churn-predictor` | v2.4.0 | ✅ yes (new) |
| `invoice-collector` | v2.4.0 | ✅ yes (new) |
| `financial-reporter` | v2.4.0 | ✅ yes (new) |
| `competitor-monitor` | v2.4.0 | ✅ yes (new) |
| `investor-update-writer` | v2.4.0 | ✅ yes (new) |
| `meeting-analyzer` | v2.4.0 | ✅ yes (new) |

Flag any skill that is entirely **new** (folder exists on disk but `last_applied` predates its introduction). For each changed/new skill, extract the relevant changelog bullets from its `### Change Log` section — these drive Step 3j.

---

## Step 2 — Show the gap report

The agent shows you a **single compact summary** of every category checked in Step 1 — what's present (✅), what's missing required (❌), what's missing optional (⏭). You see the whole picture before any fix work starts, so you can scan it and decide whether to walk through the gaps now or come back later. Optional gaps (e.g. design-system, social templates, investors.md if you haven't raised) are clearly marked so you don't feel pressured to fill them.

**Expect 1 minute.** Single question at the end: "Want me to walk through these gaps now?" If you say no, the skill exits cleanly and the gap report is logged to memory so you can revisit later.

Build a **compact gap table** and show it to the user before doing anything. Group by category. Mark each item as ✅ (present) / ❌ (missing required) / ⏭ (optional missing). Example:

```
[{brand}] Plugin Update — Gap Report
Plugin version: {last_applied} → {DEFAULT_VERSION}

Skills/agents updated since {last_applied}
  ✅ agents/link.md       v2.3.0  template_upload / template_list / template_render added
  ✅ brand-setup          v2.2.15  Step 4c rewrite (EDITMODE contracts); design-system/ now optional
  ✅ content-generator    v2.2.15  Direction column; _copy.json; gateway template_render
  ✅ creative-designer    v2.2.15  template-path → gateway; design-system/ optional
  ✅ content-creation     v2.2.15  _copy.json output; naming convention split
  ✅ social-calendar      v2.2.15  Direction column added (11 columns)
  ✅ plugin-update        v2.3.0   new skill

Brand context files
  ✅ brand.md, product.md, audience.md, competitors.md, funnel.md, avatars.md, logo.png
  ❌ sales.md                             ← v2.4.0 (apollo-lead-prospector / outreach-sequencer / proposal-generator)
  ❌ customer-success.md                  ← v2.4.0 (customer-onboarder / churn-predictor)
  ❌ finance.md                           ← v2.4.0 (invoice-collector / financial-reporter)
  ⏭ investors.md                         ← v2.4.0 optional (only required if brand has raised external capital)
  ⏭ operations.md                        ← v2.4.0 optional (only required if user processes meeting transcripts)
  ⏭ design-system/                       ← optional (recommended; brand.md fallback if absent)
  ⏭ social-carousel-template/            ← optional
  ⏭ social-story-template/               ← optional

Template uploads (v2.3.0)
  ❌ social-carousel-template/ exists locally but not uploaded to gateway
  ⚠️ social-story-template/ uploaded but local hash drifted — re-upload needed?

brand.md sections
  ✅ Tagline / Voice & Tone / Colors / Approved Phrases / Do NOT Say
  ❌ Locale (Currency / Timezone / Meta USD)        ← v2.2.0
  ❌ Social Publishing (Zernio profile + accounts)  ← v2.2.1

Env vars (.claude/settings.local.json)
  ✅ FIVEAGENTS_API_KEY, GEMINI_API_KEY, SLACK_NOTIFY_USER, REPORT_EMAIL
  ❌ LATE_API_KEY, {BRAND}_LATE_FB, {BRAND}_LATE_IG, {BRAND}_LATE_LI
  ❌ {BRAND}_NOTION_DB                    ← will be created by social-calendar on first run, or bootstrap now

MCP connectors
  ✅ Five Agents, Notion, Slack, Gmail, Google Calendar
  ❌ Windsor.ai (required for digital-marketing-analyst)
  ❌ Canva (required for campaign-presenter)
  ❌ Playwright (required for website analysis in brand-setup Step 4)
  ❌ Apollo.io (required for apollo-lead-prospector, outreach-sequencer)
  ❌ Calendly (required for customer-onboarder, meeting-analyzer)
  ❌ Stripe (required for invoice-collector, financial-reporter)
  ❌ Xero (required for invoice-collector, financial-reporter)
  ⏭ PostHog (optional — churn-predictor falls back to support-ticket + login signals)
  ⏭ Gamma (optional — investor-update-writer needs it; skip if you don't deliver investor decks)
  ⏭ Meta Ads MCP (optional enhancement — Windsor.ai already covers Meta Ads fully)

Workspace CLAUDE.md
  ❌ link.md path is RELATIVE — must be absolute (v2.2.10)
  ✅ Agent Identity block
  ✅ Credential Loading block

Settings
  Manual: confirm Bypass permissions ON, Domain Allowlist = All Domains, Project = Act without asking

→ {N} required gaps · {M} optional gaps · ready to walk through them?
```

Ask the user:
> Want me to walk through these gaps now? I'll skip anything you say "skip" to. Anything I miss won't break — just won't be set up.

If the user says no / not now, exit cleanly and offer to re-run later. Log the gap report to memory either way.

---

## Step 3 — Fill the gaps interactively

The agent walks through each missing item in order, **only prompting for items that came back ❌ or ⏭ in Step 2** — never re-asking for known-good state. For most fills, the agent delegates to the matching brand-setup sub-step (e.g. missing `sales.md` triggers `brand-setup` Step 5g, missing `LATE_API_KEY` triggers Step 7b's Late onboarding flow). You can say "skip" to any optional gap.

**Expect 2–60 minutes** depending on how many gaps you have. A brand with 3 missing context files + 2 missing env vars + a CLAUDE.md path fix takes ~10 min. A brand with 10+ gaps and lots of optional templates can stretch to an hour. The skill saves progress as it goes, so you can interrupt and resume.

Walk through each missing item in this order. **Skip any that came back ✅ in Step 2** — never re-prompt for known-good state.

### 3a. Brand context files (only if missing)

For each missing file in `brands/{brand}/`:

**Pre-fill rule — applies to every v2.4.0 file below (sales / customer-success / finance / investors / operations).** In a plugin-update context, the brand has been around for a while, so the v2.0 files (`brand.md`, `product.md`, `audience.md`, `competitors.md`, `funnel.md`) almost always already exist with rich content. **You MUST follow the "Read existing context first" mapping table at the top of each brand-setup sub-step (Step 5g intro, 5h intro, 5i intro, 5j intro, 5k intro) before asking the user anything.** Read those source files, draft answers from them, then ask "Confirm or edit?" per block — never ask from scratch what's already on disk. In a plugin-update context this rule is essentially mandatory because the source data is virtually guaranteed to exist; in a fresh brand-setup run it is best-effort because the source files are being built up in the same session.

- `brand.md` / `audience.md` missing → run `brand-setup` Step 4 (Website Analysis) for this brand only. Re-extract from the website.
- `product.md` / `competitors.md` missing → run `/link-skills:research-strategy` to regenerate.
- `funnel.md` missing → run `brand-setup` Step 5 funnel block (ask user about funnel + GA4 events).
- `avatars.md` missing → run `brand-setup` Step 5 avatars block.
- `logo.png` missing → ask the user for the file path, copy into `brands/{brand}/logo.png`.
- `backgrounds/` missing → just `mkdir`. No content needed (Gemini generates fresh per post since v2.2.9).
- `sales.md` missing → run `brand-setup` Step 5g (Sales context). **Apply the Read-first pre-fill table at the top of Step 5g** — Sender Persona drafts from brand.md (founder name/title), ICP filters draft per persona from audience.md, disqualification blocklist drafts from competitors.md URLs, default tier per persona drafts from product.md Pricing. Only ask the user from scratch for fields that have no source.
- `customer-success.md` missing → run `brand-setup` Step 5h. **Apply the Read-first pre-fill table at the top of Step 5h** — Plan Tiers drafts from product.md Pricing, Onboarding Milestone trigger events draft from funnel.md GA4 events, Intervention Playbook copy drafts from brand.md voice. Only ask the user from scratch for fields that have no source.
- `finance.md` missing → run `brand-setup` Step 5i. **Apply the Read-first pre-fill table at the top of Step 5i** — Escalation Tone Ladder copy drafts from brand.md voice, currency / Alert Threshold formatting from brand.md `## Locale`, KPIs to Highlight defaults to MRR/ARR if product.md Pricing implies subscription else project margin / cash collected. Only ask the user from scratch for fields that have no source.
- `investors.md` missing → ask first: "Have you raised external capital?" If no → skip (not flagged as gap). If yes → run `brand-setup` Step 5j. **Apply the Read-first pre-fill table at the top of Step 5j** — Sections to Include KPIs draft from finance.md (if present), drafting tone falls back to brand.md voice if user pastes <2 prior updates, sender attribution drafts from sales.md Sender Persona. Only ask the user from scratch for the investor list and prior-updates archive (those have no other source).
- `operations.md` missing → ask first: "Do you run regular meetings (1:1s, standups, client calls) and want Claude to process transcripts?" If no → skip (not flagged as gap; meeting-analyzer falls back). If yes → run `brand-setup` Step 5k. **Apply the Read-first pre-fill table at the top of Step 5k** — Sales tasks owner drafts from sales.md Sender Persona, Customer issues owner drafts from customer-success.md CSM mentions, Finance tasks owner drafts from finance.md alert recipient. Only ask the user from scratch for owners that have no other-file source.
- `competitors.md` extension missing (existing file present but lacks `monitor_urls` / `track_pages` / `exec_team` per competitor) → run `brand-setup` Step 5l. Prompts user to add the new fields per existing competitor entry.

### 3b. design-system/ (optional — recommended)

If `brands/{brand}/design-system/` is missing, offer installation but accept "skip" — the brand.md colors and fonts are a fully functional fallback:

> Your brand doesn't have a Claude Design system installed. It's optional — skills fall back to the colors and fonts in `brand.md`. Installing it gives tighter visual consistency across all outputs. Want to set it up now?

If yes, walk the user through `brand-setup` Step 4b:
1. Open https://claude.ai/design → Create new project
2. Define colors, typography, components using values already in `brands/{brand}/brand.md`
3. Share → Download Project as .zip → unzip
4. Move the unzipped folder into `brands/{brand}/` and rename to `design-system/`

Verify `brands/{brand}/design-system/` exists and is non-empty before marking complete. If the user skips, mark as ⏭ — not a gap that blocks any skill.

### 3c. Optional templates (offer, don't force)

**Case 1 — Local folder missing entirely:**

If `social-carousel-template/` or `social-story-template/` is missing from disk, offer installation but accept "skip":

> Want to install the optional Carousel (4:5) and Story (9:16) templates from Claude Design? They make IG/FB content more polished. Skip and we'll fall back to standard Gemini + Pillow generation.

If yes, walk through `brand-setup` Steps 4c-i and 4c-ii (includes the gateway upload sub-steps D, E, F).

**Case 2 — Local folder exists but not uploaded to gateway (detected in Step 1h):**

Run the upload sub-flow automatically (no prompt needed — the folder is already installed locally; the upload is the missing piece):

0. **Size check** — compute total folder size before attempting upload:
   ```python
   total_bytes = sum(p.stat().st_size for p in folder.rglob("*") if p.is_file())
   ```
   If `total_bytes > 3 * 1024 * 1024`, do not proceed. Show the user:

   > ⚠️ The local `{template_type}` template is **{X} MB** — over the 3 MB gateway limit. Embedded images are the most common cause.
   >
   > Go back to [claude.ai/design](https://claude.ai/design), open the `{template_type}` project, and paste this prompt:
   >
   > ```
   > This template is used by an automated agent that uploads and renders it server-side. It must be under 3 MB. Please:
   > 1. Remove all embedded images (base64 data URIs, <img> tags with data: src, or any bundled photo assets) — replace with a solid colour placeholder or CSS gradient
   > 2. Remove any unused fonts, icon sets, or external CDN resources that aren't actually referenced in the layout
   > 3. Remove sample/demo background photos — the agent supplies images at render time via named files in the uploads/ folder
   > 4. Keep only the HTML, CSS, and JavaScript needed for the layout structure
   > Re-export, re-download, and re-install the template (run `/link-skills:brand-setup` Step 4c), then re-run plugin-update.
   > ```

   Skip this template and continue with the rest of the gap report.

1. Compute `version_hash` from local folder (canonical algorithm from Step 1h).
2. Zip the folder with noise-file exclusion (same code as brand-setup Step 4c-i Step D).
3. Call `template_upload` via gateway MCP tool.
4. Update `## Social Templates` section in `brand.md`.
5. Verify with `template_list`.

Report to user: `"Carousel template not yet uploaded to gateway — uploading now... ✅ Done."`

**Case 3 — Local hash ≠ remote hash (drift detected in Step 1h):**

Ask the user:
> "The local `{template_type}` template has changed since it was last uploaded (hash drifted). Re-upload to the gateway now? [Y/n]"

If yes → run the upload sub-flow above (Steps 0–5).
If no → note the drift in the gap report. Content-generator will use the older gateway version until re-uploaded.

**Case 4 — Remote entry exists but no local folder:**

Note in the gap report:
> "Gateway has a `{template_type}` template (version `{version_hash[:8]}...`) but no local copy. The gateway version is still used for rendering — content-generator will continue to work. A future `template_download` tool will let you pull the template back locally — currently no action is required for rendering to continue using the gateway version."

No action required for rendering to continue.

### 3d. brand.md sections (only the missing ones)

For each missing section header in `brand.md`, append it without rewriting existing content:

- **Locale missing** — extract Currency / Timezone / Meta USD exchange rate from the website (re-use Step 4 logic). Append a `## Locale` section to `brand.md`.
- **Social Publishing missing** — re-run `brand-setup` Step 7b Step D (auto-discover Zernio profile + connected accounts via `late_list_profiles` + `late_list_accounts`). Append a `## Social Publishing` section.

### 3e. Env vars (only the missing ones)

For each missing required env var, ask the user for the value and append/update `.claude/settings.local.json` under `env`. Preserve all existing keys — never overwrite the file wholesale.

For missing `{BRAND}_LATE_FB/IG/LI`: re-run `late_list_profiles` + `late_list_accounts` to auto-discover.

For missing `{BRAND}_NOTION_DB`: ask the user if they want to bootstrap now (calls `notion-create-database` per `social-calendar` Step 3a) or defer to first social-calendar run.

After updating `.claude/settings.local.json`, also store any external API keys in the gateway vault via `fiveagents_store_credential` (mapping per `brand-setup` Step 7b vault table).

For the auto-bootstrapped DB env vars (`${BRAND}_CRM_DB`, `${BRAND}_CUSTOMER_DB`, `${BRAND}_INVOICE_TRACKER_DB`, `${BRAND}_REPORTS_DB`, `${BRAND}_COMPETITOR_DB`, `${BRAND}_MEETINGS_DB`, `${BRAND}_ACTIONS_DB`):

- If env var is missing → no action. The skill that depends on it will create the Notion DB on first run and persist the ID to `.claude/settings.local.json` (same pattern as `${BRAND}_NOTION_DB` for social-calendar).
- If env var is present but the Notion DB has been deleted → ask the user: "Re-bootstrap now or defer to first run?" Both paths work; bootstrap-now avoids a confusing error on next skill run.

Surface this informationally in the gap report — do not flag as a required gap.

### 3f. MCP connectors

**For every MCP flagged ❌ or ⏭ in Step 1e, walk the user through the specific connector flow below — do not just list them in the gap report and move on.** The user's brand-setup run is the only place these prompts appear in full; if plugin-update silently skips them, the user will end up with skills that error on first use because their MCP isn't connected.

Iterate through the missing MCPs in this order. For each one, post the prompt verbatim, wait for the user to confirm (or say "skip"), then re-probe. Mark complete only when the probe call succeeds.

**Connected Apps (OAuth via Settings → Connected Apps):**

- **Notion not connected** (required — content calendar, briefs, auto-bootstrapped DBs):
  > Notion isn't connected — used for the content calendar, strategy briefs, and the auto-bootstrapped CRM / customer / invoice / report / competitor / meeting / actions DBs. Go to **Settings → Connected Apps → Notion → Authorize**, then tell me when done.

- **Slack not connected** (required — skill-run notifications):
  > Slack isn't connected — used for "skill done" DMs after each run. Go to **Settings → Connected Apps → Slack → Authorize**, then tell me when done.

- **Gmail not connected** (required — email reading + report delivery):
  > Gmail isn't connected — used for reading inbound replies and delivering reports. Go to **Settings → Connected Apps → Gmail → Authorize**, then tell me when done.

- **Google Calendar not connected** (required — scheduling content drops & meetings):
  > Google Calendar isn't connected — used for scheduling content drops and meetings. Go to **Settings → Connected Apps → Google Calendar → Authorize**, then tell me when done.

- **Windsor.ai not connected** (mandatory — Google Ads + GA4 + Meta Ads): walk all 3 steps, do not collapse to one prompt:
  > Windsor.ai isn't connected — this is the universal source for Google Ads + GA4 + Meta Ads (Facebook + Instagram).
  > 1. If you don't have an account yet, sign up free at https://windsor.ai/register
  > 2. In your Windsor dashboard, connect **all three**: Google Ads, GA4, and Meta Ads (Facebook Ads). All three are required — Meta Ads in Windsor is mandatory regardless of whether the optional Meta Ads MCP is added.
  > 3. Then in Claude: **Settings → Connected Apps → Windsor.ai → Authorize**.
  > Tell me when done.

  After the user confirms, re-run `get_connectors` and verify the result includes Google Ads, GA4, **and** Facebook. If any of the three is missing, ask the user to connect the missing one in their Windsor dashboard before marking complete.

- **Canva not connected** (used by `campaign-presenter`):
  > Canva isn't connected — used for campaign decks and pitch presentations. Go to **Settings → Connected Apps → Canva → Authorize**, then tell me when done. (Skip if you don't deliver Canva decks — `campaign-presenter` will be unconfigurable for this brand.)

**Business-operations MCPs (added in v2.4.0):**

- **Apollo.io not connected** (used by `apollo-lead-prospector`, `outreach-sequencer`):
  > Apollo.io isn't connected — used for lead enrichment, contact search, and email-sequence injection. Go to **Settings → Connected Apps → Apollo.io → Authorize**, then tell me when done. (Skip if you don't run outbound — those two skills will be unconfigurable for this brand.)

- **Calendly not connected** (used by `customer-onboarder`, `meeting-analyzer`):
  > Calendly isn't connected — used for kickoff scheduling and meeting metadata pulls. Go to **Settings → Connected Apps → Calendly → Authorize**, then tell me when done. (Skip if you don't use Calendly — `customer-onboarder` falls back to manual scheduling and `meeting-analyzer` reads transcripts directly.)

- **Stripe not connected** (used by `invoice-collector`, `financial-reporter`):
  > Stripe isn't connected — used for invoice status and payment data. Go to **Settings → Connected Apps → Stripe → Authorize**, then complete the OAuth flow it gates the real tools behind. Tell me when both `authenticate` and `complete_authentication` have succeeded. (Skip if you bill outside Stripe — `invoice-collector` and `financial-reporter` will be unconfigurable for this brand.)

- **Xero not connected** (used by `invoice-collector` for invoice sync, `financial-reporter` for P&L):
  > Xero isn't connected — used for invoice status sync and pulling the P&L. Go to **Settings → Connected Apps → Xero → Authorize**, then tell me when done. (Skip if you don't use Xero — `financial-reporter` will fall back to Stripe-only data.)

- **PostHog not connected** (used by `churn-predictor` for product-usage signals):
  > PostHog isn't connected — used by `churn-predictor` for product-usage signals (login frequency, feature engagement). Go to **Settings → Connected Apps → PostHog → Authorize**, then tell me when done. (Skip if you don't use PostHog — `churn-predictor` falls back to support-ticket + login-frequency signals only.)

- **Gamma not connected** (used by `investor-update-writer` for investor decks):
  > Gamma isn't connected — used by `investor-update-writer` for monthly investor decks. Go to **Settings → Connected Apps → Gamma → Authorize**, then tell me when done. (Skip if you don't deliver investor updates — `investor-update-writer` will be unconfigurable for this brand.)

**Custom connectors (Settings → Connectors → Add custom connector):**

- **Meta Ads MCP not connected** (optional enhancement — limited rollout):
  > (Optional) Meta has an official MCP server that gives skills slightly more direct Marketing API access than Windsor.ai. If you want to try it: **Settings → Connectors → Add custom connector**, name `Meta Ads`, URL `https://mcp.facebook.com/ads`, sign in with the Facebook/Meta Business account that owns the brand's ad accounts. If "Add custom connector" isn't visible or sign-in fails — no problem, your Windsor.ai connection already covers Meta Ads fully. Tell me whether you added it or skipped.

  - If the user added it successfully → save `META_ADS_SOURCE=meta_ads_mcp` to `.claude/settings.local.json` `env` block.
  - If the user skipped or couldn't add it → leave `META_ADS_SOURCE` unset. Downstream skills default to Windsor for Meta data. **Do not flag as a required gap** — this is purely an enhancement.

**CLI-installed MCPs:**

- **Playwright not connected** (required for website analysis in `brand-setup` Step 4):
  ```bash
  claude mcp add playwright -- npx @playwright/mcp@latest
  ```
  Then ask the user to restart Claude Code and confirm `/mcp` shows `playwright`.

After every walkthrough, re-run the corresponding probe from Step 1e and only mark the gap closed when the probe succeeds. If the user said "skip", record it as ⏭ in the final summary so they can revisit later.

### 3g. CLAUDE.md (re-run brand-setup Step 9)

**First — always re-embed the full `agents/link.md` body between the BEGIN/END markers, regardless of any other CLAUDE.md gaps. Refreshing the stamp comment alone is wrong — after a `git pull` that adds new skills (e.g. v2.4.0's 10 business-ops skills), the stamp will read "v2.4.0" while the embedded body still describes v2.3.x as a "marketing agent" with no Apollo / Stripe / Xero / etc. mentions. Always replace the body too.**

```python
import glob, os, re, datetime

# Locate agents/link.md (same search order as brand-setup Step 9a)
config_dir = os.environ.get("CLAUDE_CONFIG_DIR")
patterns = []
if config_dir:
    patterns.append(os.path.join(config_dir, "**/agents/link.md"))
patterns.extend([
    os.path.expanduser("~/.claude/**/agents/link.md"),
    os.path.expandvars(r"%APPDATA%\Claude\**\agents\link.md"),
    os.path.expanduser("~/Library/Application Support/Claude/**/agents/link.md"),
])
found = [f for p in patterns for f in glob.glob(p, recursive=True)]
link_md_path = os.path.abspath(os.path.realpath(found[0])) if found else None
if not link_md_path:
    raise RuntimeError("Could not locate agents/link.md — ask user for the full path.")

# Read current link.md from disk + strip YAML frontmatter (same as brand-setup Step 9a)
link_md_content = open(link_md_path, encoding='utf-8').read()
link_md_body = re.sub(r'^---\s*\n.*?\n---\s*\n', '', link_md_content, count=1, flags=re.DOTALL).lstrip()

# Extract version from the Maintenance table
version_match = re.search(r'\|\s*Link\s*\|\s*(v[\S]+)\s*\|\s*([^|\n]+)\s*\|', link_md_content)
link_version = version_match.group(1).strip() if version_match else "unknown"
link_version_date = version_match.group(2).strip() if version_match else "unknown"
embed_date = datetime.date.today().isoformat()

# Build the full replacement block (stamp + body), wrapped in the existing BEGIN/END markers
new_block = (
    f"<!-- BEGIN agents/link.md (embedded by brand-setup) -->\n"
    f"<!-- link.md version: {link_version} | Last Changed: {link_version_date} | Embedded: {embed_date} -->\n"
    f"\n"
    f"{link_md_body}\n"
    f"\n"
    f"<!-- END agents/link.md -->"
)

# Replace EVERYTHING between (and including) the markers — body and stamp together
claude_md = open("CLAUDE.md", encoding='utf-8').read()
if "<!-- BEGIN agents/link.md (embedded by brand-setup) -->" in claude_md and "<!-- END agents/link.md -->" in claude_md:
    claude_md_new = re.sub(
        r'<!-- BEGIN agents/link\.md \(embedded by brand-setup\) -->.*?<!-- END agents/link\.md -->',
        lambda m: new_block,  # lambda avoids re.sub's backslash interpretation in link_md_body
        claude_md,
        count=1,
        flags=re.DOTALL,
    )
else:
    # Markers absent — fall through to the "Missing entirely" branch below; do not partial-write here.
    claude_md_new = claude_md

if claude_md_new != claude_md:
    # Show the diff to the user before writing (per the rule at the bottom of this step)
    open("CLAUDE.md", "w", encoding='utf-8').write(claude_md_new)
```

This runs unconditionally every time plugin-update executes — it is the equivalent of what brand-setup Step 9b does on first install. After a `git pull`, both the version stamp **and** the embedded `link.md` body are refreshed, so CLAUDE.md always reflects the currently installed version's full content (skills table, MCP list, context-file rows, etc.).

**Verification after re-embed** — confirm the stamp matches `agents/link.md`'s current Maintenance version AND that a string unique to the new version appears in the embedded body. Example: after upgrading to v2.4.0, grep CLAUDE.md for `apollo-lead-prospector` (one of the 10 new skills); if absent, the body did not get re-embedded and you should retry the regex with the full text re-read.

**Then patch any remaining CLAUDE.md gaps** — only the affected lines:

- **Missing entirely** → create from scratch (full brand-setup Step 9 flow, including version stamp).
- **Relative path** → resolve absolute path (Step 9a) and replace the line in place. Validate `os.path.isabs` before writing. Do not rewrite the rest of the file.
- **Missing Credential Loading block** → append it under the existing Agent Identity block.
- **Active Brand mismatch** → update the brand line; if multi-brand, append rather than replace.

Show a unified diff to the user before writing any changes to CLAUDE.md.

### 3h. Settings (manual)

For UI-only settings, show a checklist and ask the user to confirm each one:

> Please confirm in Claude settings:
> - [ ] Settings → Claude Code → Allow bypass permissions mode = ON
> - [ ] Settings → Capabilities → Domain Allowlist = All Domains
> - [ ] Project → Permission = Act without asking
> Reply "all set" when done.

### 3i. Funnel TBD events

If `funnel.md` had `TBD` entries in Step 1c and Windsor.ai is now connected, re-run the GA4 event-discovery flow from `brand-setup` Step 8 #16 and patch in the confirmed event names.

### 3j. Version-specific brand actions

For each skill/agent flagged as changed in Step 1j, read its `### Change Log` bullets and map them to required brand configuration actions. Use this decision table:

| Changelog entry | Brand action required |
|---|---|
| Direction column added (content-generator / social-calendar v2.2.15) | ✅ Check Notion Social Calendar DB has a `Direction` select column at position 10; add it if missing |
| template_upload / template_list / template_render added (agents/link.md v2.3.0) | ✅ Check brand.md `## Social Templates` section; if templates installed locally but not uploaded → run upload sub-flow (Step 3c Case 2) |
| design-system/ MANDATORY → OPTIONAL (brand-setup v2.2.15) | ❌ No action — constraint relaxed |
| _copy.json output added (content-generator / content-creation v2.2.15) | ❌ No action — additive output format |
| Naming convention split: social vs non-social (content-creation v2.2.15) | ❌ No action — future outputs only |
| Step 4c rewrite — EDITMODE-BEGIN/END contracts (brand-setup v2.2.15) | ✅ If carousel/story templates installed, verify EDITMODE-BEGIN block is present in entry HTML; if templates predate v2.2.15 they may need reinstalling |
| Meta Ads framing reversed — Windsor.ai MANDATORY (brand-setup v2.2.13) | ✅ Confirm Windsor.ai has Meta Ads (Facebook) connected; if not → Step 3f |
| DEFAULT_BRAND + {BRAND}_NOTION_DB env vars (brand-setup v2.2.12) | ✅ Check env block for both; add if missing |
| CLAUDE.md embeds agents/link.md (brand-setup v2.2.11) | ✅ Check CLAUDE.md for embedded link.md content (BEGIN/END markers); if absent → Step 3g |
| date_preset → last_30dT (digital-marketing-analyst v2.2.8) | ❌ No action — runtime parameter, no brand config |
| `apollo-lead-prospector introduced (link-skills v2.4.0)` | ✅ Check `brands/{brand}/sales.md` exists. If not → run brand-setup Step 5g sales sub-step |
| `outreach-sequencer introduced (link-skills v2.4.0)` | ✅ Same as apollo-lead-prospector — sales.md must exist |
| `proposal-generator introduced (link-skills v2.4.0)` | ✅ Same as apollo-lead-prospector — sales.md must exist |
| `customer-onboarder introduced (link-skills v2.4.0)` | ✅ Check `brands/{brand}/customer-success.md` exists. If not → run brand-setup Step 5h |
| `churn-predictor introduced (link-skills v2.4.0)` | ✅ Same as customer-onboarder — customer-success.md must exist |
| `invoice-collector introduced (link-skills v2.4.0)` | ✅ Check `brands/{brand}/finance.md` exists. If not → run brand-setup Step 5i |
| `financial-reporter introduced (link-skills v2.4.0)` | ✅ Same as invoice-collector — finance.md must exist |
| `investor-update-writer introduced (link-skills v2.4.0)` | ✅ Check `brands/{brand}/investors.md` exists. If not → ask if brand has raised external capital; if yes → run brand-setup Step 5j |
| `competitor-monitor introduced (link-skills v2.4.0)` | ✅ Check `brands/{brand}/competitors.md` has the new `monitor_urls`/`track_pages`/`exec_team` fields per competitor. If not → run brand-setup Step 5l (extension) |
| `meeting-analyzer introduced (link-skills v2.4.0)` | ⏭ Optional — ask user if they want operations.md set up. If yes → brand-setup Step 5k |

For changelog entries not in this table, apply judgment: if the change touches a per-brand configuration file (`brand.md`, `funnel.md`, `.claude/settings.local.json`, `CLAUDE.md`) → flag for review. If it is a skill-internal logic change → no brand action needed.

Show the user only the rows where brand action is required:

```
Version-specific actions ({N} required)
  ✅ Direction column — checking Notion DB...
  ✅ Template upload check — reading brand.md Social Templates...
  ✅ Windsor.ai Meta Ads — re-probing connector...
```

---

## Step 4 — Re-validate

After you've filled the selected gaps, the agent runs a **focused validation pass** — only re-testing the integrations that were touched in Step 3 (not re-running the full Step 1 inspection). The output is a summary table of what was fixed, what was skipped, and what passed validation. If any fix failed validation (e.g. you re-authorized Windsor.ai but the probe still 401s), the agent flags it for retry.

**Expect 1–2 minutes.** No questions unless a validation fails.

After all selected gaps are filled, run a focused validation pass — only test integrations that were touched in Step 3. Reuse the test calls from `brand-setup` Step 8.

### 4a. Show what was fixed

| Gap | Action taken | Status |
|---|---|---|
| design-system/ missing | Installed via Claude Design | ✅ |
| Locale section in brand.md | Extracted from site, appended | ✅ |
| LATE_API_KEY missing | Saved to settings.local.json + vault | ✅ |
| Windsor.ai not connected | User authorized, probe passed | ✅ |
| CLAUDE.md link.md path relative | Replaced with absolute path | ✅ |
| social-carousel-template/ | User chose to skip | ⏭ |
| ... | ... | ... |

This is the **diagnostic** view — useful for "what changed?" but not what the user actually wants to know.

### 4b. Agent Readiness Summary (business-friendly)

The "what was fixed" table answers a technical question. The owner wants the business answer: *which agents will run on my brand starting today, which still need a fix, and which did I skip?* Step 4b produces that answer.

**Build the readiness matrix using the exact spec in `brand-setup` Step 8d** (translation table, status rules, display format, JSON schema). The only difference is where the inputs come from:

| Input | brand-setup Step 8d source | plugin-update Step 4b source |
|---|---|---|
| MCP connection state | Step 8a–8c-bis probe results | Step 1e probe results, **updated** by any Step 3f re-probes |
| Brand context file presence | Step 5/6 generation outcomes | Step 1a inspection, **updated** by any Step 3a fills |
| Env vars / Notion DBs | Step 7b save + Step 8d validation | Step 1d inspection, **updated** by any Step 3e fills |

In other words: take the Step 1 audit, overlay every successful fix from Step 3, and compute the matrix from the post-fix state. Skills the user explicitly skipped during Step 3 (e.g. "skip Apollo, I don't run outbound") map to ⏭ in the matrix; skills that had a missing dep neither fixed nor skipped map to ❌.

Print the matrix to chat in the same exact format documented in `brand-setup` Step 8d-iii. Save the structured `agent_readiness[]` + `readiness_summary` object — Step 5b reads it directly into the email payload.

**Do not proceed to Step 5 until the readiness matrix has been printed to chat and saved.**

---

## Step 5 — Record version + completion email + Slack

Final step — wrap up. The agent writes the **current plugin version** into `brands/{brand}/brand.md` `## Plugin Version` section so future `plugin-update` runs know where to start their delta from. It then sends a completion email and Slack DM summarizing what was fixed, what was skipped, and any gaps that remain. After this step, the brand is fully caught up to the current plugin version.

**Expect 30 seconds.** No questions.

### 5a. Write plugin version to brand.md

Append or update the `## Plugin Version` section in `brands/{brand}/brand.md`:

```markdown
## Plugin Version
Last applied: {DEFAULT_VERSION} — {today's date}
```

If the section already exists, replace the `Last applied:` line in place — do not rewrite anything else. This is the anchor that future `plugin-update` runs use in Step 0b to determine the delta.

### 5b. Send completion email and Slack DM

Send completion email and Slack DM. Reuse the `brand-setup.ts` server-side template via `tag: "brand-setup"` — the same template handles upgrades.

```
Use gateway MCP tool `fiveagents_send_email`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- to: ${REPORT_EMAIL}
- subject: "🔧 Plugin update complete — {brand}"
- html_body: JSON.stringify(payload)
- tag: "brand-setup"
```

JSON payload mirrors the `brand-setup` Step 10 schema:
- **`agent_readiness[]` + `readiness_summary`** — primary block; reuse the structured object saved in Step 4b verbatim. Same schema as brand-setup. The server-side template renders this as the headline section.
- **`files[]` and `connections[]`** — secondary diagnostic blocks; only contain items that were touched in Step 3 (not the full inventory).
- Add a top-level `mode: "update"` field so the template (or downstream telemetry) can distinguish a fresh setup from an upgrade.

Slack DM (lead with readiness, integration deltas as secondary diagnostic):
```
🔧 [{brand}] Plugin update applied

Agent Readiness (20 total):
  ✅ {N_ready} ready · ⚠️ {N_degraded} works with limitations · ❌ {N_not_ready} need fixing · ⏭ {N_skipped} skipped

{If N_not_ready > 0:}
Top fixes to unlock more agents:
  • {Agent name 1} — {one-line fix from agent_readiness[].fix}
  • {Agent name 2} — {one-line fix}
  (full list in the email)

This update: {N} gaps fixed · {M} skipped
Detail in email
```

Cap the "top fixes" list at 3. If `N_not_ready == 0`, omit the Top fixes block; lead with "🎉 Every connected agent is ready to run on schedule."

---

## Quality Checklist

- [ ] Step 0 read `version.ts` DEFAULT_VERSION and brand.md `## Plugin Version` before doing anything
- [ ] Step 0 read every skill/agent maintenance section and built the version delta table
- [ ] Step 1 ran a full inspection without prompting the user
- [ ] Step 1a checked all 5 new brand-context files (sales.md, customer-success.md, finance.md, investors.md, operations.md) with optional annotations applied to investors.md and operations.md
- [ ] Step 1d checked the 7 new auto-bootstrapped DB env vars without flagging missing ones as required gaps
- [ ] Step 1e probed all 7 v2.4.0 / v2.2.13 MCP rows (Apollo.io, Calendly, Stripe, Xero, PostHog, Gamma, optional Meta Ads MCP)
- [ ] Step 3f walked the user through every ❌/⏭ MCP with the explicit per-MCP prompt — never silently skipped a missing connector
- [ ] Step 1j produced a version table showing which skills/agents changed since `last_applied`
- [ ] Step 2 gap report opened with the version delta block (updated skills listed with changelog summaries)
- [ ] Step 3 only walked through items marked ❌ or offered ⏭ — never re-asked for known-good state
- [ ] Step 3a fill handlers ran the matching brand-setup Step 5g–5l sub-step for any missing brand context file
- [ ] Step 3j mapped changelog entries to brand actions and only surfaced rows requiring action
- [ ] Step 3j changelog → brand-action mapping covered all 10 new skills
- [ ] All file writes were patches (preserve existing content), not full rewrites
- [ ] Step 3g refreshed the `<!-- link.md version: ... -->` stamp in CLAUDE.md unconditionally
- [ ] CLAUDE.md `link.md` path is absolute (`os.path.isabs == True`) after the run
- [ ] `.claude/settings.local.json` retained all pre-existing keys
- [ ] Re-validation in Step 4 only tested touched integrations
- [ ] Idempotent — a second immediate run produces zero gaps and `last_applied == DEFAULT_VERSION`
- [ ] `template_list` called for each brand's templates in Step 1h; local hash compared to remote for each installed template
- [ ] Missing uploads (Case 2) triggered the upload sub-flow automatically; hash drift (Case 3) prompted the user before re-uploading
- [ ] Step 5a wrote `## Plugin Version` to brand.md with the current DEFAULT_VERSION
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "plugin-update"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars — e.g. 'Filled 5 gaps; design-system installed; Windsor.ai connected'>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "plugin_version": "<from versions/version.ts DEFAULT_VERSION>",
    "gaps_detected": 0,
    "gaps_fixed": 0,
    "gaps_skipped": 0,
    "fixes": [
      { "category": "files", "item": "design-system/", "action": "installed", "status": "ok" },
      { "category": "env", "item": "LATE_API_KEY", "action": "saved", "status": "ok" },
      { "category": "mcp", "item": "Windsor.ai", "action": "user_connected", "status": "ok" },
      { "category": "claude_md", "item": "link.md path", "action": "replaced_with_absolute", "status": "ok" }
    ]
  }
```

**Status values:** `success` (all required gaps fixed), `partial` (some required gaps still missing — user skipped), `failed` (skill errored).
