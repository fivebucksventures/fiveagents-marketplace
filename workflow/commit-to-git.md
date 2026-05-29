# Commit to Git — Production Release Workflow

Do NOT use DEV versioning. This is PRODUCTION. Every commit increments a real version number visible to all users.

---

## Step 1 — Check git status

```bash
git status
git diff --stat
```

Confirm the working directory shows only intentional changes. If there are unexpected modified or untracked files, stop and ask the user before proceeding.

---

## Step 2 — Check today's date

```python
import datetime
today = datetime.date.today()
print(today.isoformat())          # e.g. 2026-05-06
print(today.strftime("%B %d, %Y")) # e.g. May 06, 2026
```

Use this date for `DEFAULT_DATE` in `version.ts` and for all maintenance section timestamps.

---

## Step 3 — Audit changed skills and agents

### 3a. Identify modified files

```bash
git diff --name-only
git diff --name-only --cached
```

Filter for skill and agent files:
- `plugins/link-skills/agents/link.md`
- `plugins/link-skills/skills/*/SKILL.md`

Build a list of every skill/agent file that was modified in this commit.

### 3b. Verify maintenance sections are up to date

For each modified file, read its `## Maintenance` block and confirm:

| Check | Pass condition |
|---|---|
| `## Maintenance` section exists | Present at the top of the file |
| `Version` in the table is the **new** version being cut (not the previous version) | Matches the version you are about to write to `version.ts` |
| `Last Changed` date matches today's date | Matches Step 2 output |
| `### Change Log` has an entry for the new version | Top entry is the new version with bullet points describing what changed |

If any check fails, **stop and update the maintenance section first** before proceeding. Do not commit with a stale maintenance block.

> **Already bumped this session?** If the skill's maintenance section was already updated during the current work session (version incremented, changelog written, date set to today), treat it as passing — **do not re-increment the version**. Use the version already in the maintenance section as the target version for `version.ts`.

### 3c. Trim every change log to the last 5 entries

After the new version's changelog block has been added, count the `**vX.X.X**` entries in the `### Change Log` section (under `## Maintenance`) of **every** file:

- `plugins/link-skills/agents/link.md`
- every `plugins/link-skills/skills/*/SKILL.md`

If any file has more than 5 entries, **delete the oldest entries** so exactly 5 remain — the newest at the top, the four next-newest below it.

Rationale: every Maintenance change log is a file-local overview that humans skim. An unbounded log buries the current state and adds noise to every commit diff. The full per-version history lives in `version.ts` VERSION_HISTORY (which caps at 15 entries — see Step 7c) and in git tags / GitHub releases. File-level logs should answer "what has shifted recently in this specific skill", not serve as an archive.

Run this trim **every commit**, even if a given file's version wasn't bumped this session — the rule is "always ≤ 5", not "trim when bumping". Files already at 5 or fewer entries are no-ops.

**Operationally:** the trim usually only requires touching the file that just got a new entry prepended (it goes from 5 → 6 → trim back to 5). Files with no new entry this commit are typically already at ≤ 5 and skip silently.

### 3d. Check for new skills or agents

Compare the list of SKILL.md files on disk against the existing entries in `version.ts` VERSION_HISTORY:

```bash
ls plugins/link-skills/skills/
ls plugins/link-skills/agents/
```

If a new skill or agent folder exists that has never appeared in any VERSION_HISTORY entry, it is a new addition — flag it for the version bump changelog in Step 7.

---

## Step 4 — Sync to Notion Agents Library

### 4a. Find or create the database

Resolve the database in this order — env var first, then name search, then create. The env-var-first pattern survives database renames, workspace moves, and accidental duplicate creation.

**Step 1 — Check `AGENTS_LIBRARY_DB` env var:**

Read `.claude/settings.local.json` (search up from cwd). Look for `env.AGENTS_LIBRARY_DB`.

**IF env var is set:**

```
Use Notion MCP tool notion-fetch:
- id: ${AGENTS_LIBRARY_DB}
```

If the fetch succeeds and returns a database object → use this database. Skip to Step 4b.
If the fetch returns `not_found` / 404 → the DB was deleted; fall through to Step 2 (name search) to find or create a replacement.

**Step 2 — Name search (only if env var is unset OR Step 1 returned not_found):**

```
Use Notion MCP tool notion-search:
- query: "Agents Library"
- filter: { "value": "database", "property": "object" }
```

The query is intentionally short — it survives workspace prefix changes (e.g. "Five Agents -", "fiveagents.io -", or no prefix) since Notion's semantic search fuzzy-matches the distinctive words.

Filter results to type=database and pick the one whose title contains "Agents Library". If multiple match, prefer one that contains "Agents Library" with the user's workspace name as prefix.

**If found:** capture the database ID. **Persist it** to `.claude/settings.local.json` `env.AGENTS_LIBRARY_DB` (preserve all other keys). Notify the user once:

> Found existing **{DB title}** at ID `{id}` — saved as `AGENTS_LIBRARY_DB` in `.claude/settings.local.json`. Future commit-to-git runs will use this ID directly.

Then proceed to Step 4b.

**Step 3 — Create (only if Step 2 returned no match):**

```
Use Notion MCP tool notion-create-database:
- parent: { type: "workspace" }
- title: "Five Agents - Agents Library"
- properties:
    "#":              { type: "number" }
    "Agent/Skill Name": { type: "title" }
    "Type":           { type: "select", options: ["Agent", "Skill"] }
    "Version":        { type: "rich_text" }
    "Area":           { type: "select", options: ["Marketing", "Sales", "Customer Success", "Finance", "Strategy", "Productivity", "Setup", "All"] }
    "Description":    { type: "rich_text" }
    "Tools":          { type: "rich_text" }
    "Last Changed":   { type: "date" }
    "Last Changelog": { type: "rich_text" }
```

**Column order in the default view:** `# | Agent/Skill Name | Type | Version | Area | Description | Tools | Last Changed | Last Changelog`. Notion stores schema independently of view order, so after creating the DB you may need to drag the view columns into this order manually (one-time UI tweak).

Save the returned database ID. **Persist it** to `.claude/settings.local.json` `env.AGENTS_LIBRARY_DB`. Notify the user:

> Created new **Five Agents - Agents Library** database at ID `{id}` — saved as `AGENTS_LIBRARY_DB` in `.claude/settings.local.json`.

### 4b. Read all current rows

```
Use Notion MCP tool notion-fetch:
- id: {database_id}
```

Build a map of existing rows keyed by "Agent/Skill Name" so you can match and update without creating duplicates.

### 4c. Build the full skill/agent inventory

For each row in the table below, gather two sets of data:

**From the file's `## Maintenance` block** (changes every release): Name, Type, Version, Last Changed, last changelog entry (the most recent `**vX.X.X**` bullet block).

**From `plugins/link-skills/agents/link.md` Skills table** (changes rarely — single source-of-truth): Area, Description (use the row's "Use For" cell, tightened to one short sentence if needed), Tools (use the row's "Deps" cell verbatim, dropping the `MCP:` / `Gateway:` / `Files:` / `Env:` prefixes for readability — keep the `(opt)` markers and the actual names like `${BRAND}_CRM_DB`). For the `Link` agent itself (which has no row in the Skills table), use Area=`All`, Description=the link.md frontmatter description, Tools=`Agent itself — orchestrates all skills; uses every connected MCP and gateway tool`.

If a skill is in the file table below but missing from link.md's Skills table, treat that as a bug — flag it for the user before proceeding (the Skills table is the SoT and should always be in sync).

| # | File | Name | Type |
|---|---|---|---|
| 1 | `plugins/link-skills/agents/link.md` | Link | Agent |
| 2 | `plugins/link-skills/skills/brand-setup/SKILL.md` | brand-setup | Skill |
| 3 | `plugins/link-skills/skills/content-generator/SKILL.md` | content-generator | Skill |
| 4 | `plugins/link-skills/skills/creative-designer/SKILL.md` | creative-designer | Skill |
| 5 | `plugins/link-skills/skills/content-creation/SKILL.md` | content-creation | Skill |
| 6 | `plugins/link-skills/skills/social-calendar/SKILL.md` | social-calendar | Skill |
| 7 | `plugins/link-skills/skills/digital-marketing-analyst/SKILL.md` | digital-marketing-analyst | Skill |
| 8 | `plugins/link-skills/skills/data-analysis/SKILL.md` | data-analysis | Skill |
| 9 | `plugins/link-skills/skills/social-publisher/SKILL.md` | social-publisher | Skill |
| 10 | `plugins/link-skills/skills/research-strategy/SKILL.md` | research-strategy | Skill |
| 11 | `plugins/link-skills/skills/campaign-presenter/SKILL.md` | campaign-presenter | Skill |
| 12 | `plugins/link-skills/skills/background-generator/SKILL.md` | background-generator | Skill |
| 13 | `plugins/link-skills/skills/plugin-update/SKILL.md` | plugin-update | Skill |
| 14 | `plugins/link-skills/skills/apollo-lead-prospector/SKILL.md` | apollo-lead-prospector | Skill |
| 15 | `plugins/link-skills/skills/outreach-sequencer/SKILL.md` | outreach-sequencer | Skill |
| 16 | `plugins/link-skills/skills/proposal-generator/SKILL.md` | proposal-generator | Skill |
| 17 | `plugins/link-skills/skills/customer-onboarder/SKILL.md` | customer-onboarder | Skill |
| 18 | `plugins/link-skills/skills/churn-predictor/SKILL.md` | churn-predictor | Skill |
| 19 | `plugins/link-skills/skills/invoice-collector/SKILL.md` | invoice-collector | Skill |
| 20 | `plugins/link-skills/skills/financial-reporter/SKILL.md` | financial-reporter | Skill |
| 21 | `plugins/link-skills/skills/competitor-monitor/SKILL.md` | competitor-monitor | Skill |
| 22 | `plugins/link-skills/skills/investor-update-writer/SKILL.md` | investor-update-writer | Skill |
| 23 | `plugins/link-skills/skills/meeting-analyzer/SKILL.md` | meeting-analyzer | Skill |
| 24 | `plugins/link-skills/skills/decision-advisor/SKILL.md` | decision-advisor | Skill |
| 25 | `plugins/link-skills/skills/content-performance-analyst/SKILL.md` | content-performance-analyst | Skill |
| 26 | `plugins/link-skills/skills/trend-radar/SKILL.md` | trend-radar | Skill |
| 27 | `plugins/link-skills/skills/video-downloader/SKILL.md` | video-downloader | Skill |
| 28 | `plugins/link-skills/skills/video-repurposer/SKILL.md` | video-repurposer | Skill |

### 4d. Upsert each row into Notion

For each item in the inventory:

- **Row exists** (matched by name) → update ALL of: Version, Last Changed, Last Changelog, Area, Description, Tools. All six fields must be written on every touched row — do not skip Description/Tools even when only the Maintenance section changed. (Rationale: Description/Tools come from `agents/link.md` which is the single source-of-truth; keeping them in sync on every touch prevents silent drift.)
- **Row missing** → create new page with all fields including `#` (use the table row number above)

```
Use Notion MCP tool notion-update-page (existing) or notion-create-pages (new):
- "Agent/Skill Name": {name}
- "Type":             {Agent | Skill}
- "Version":          {version from maintenance section}
- "Area":             {Marketing | Sales | Customer Success | Finance | Strategy | Productivity | Setup | All — from agents/link.md Skills table Area column}
- "Description":      {one-line business description — from agents/link.md Skills table "Use For" column, tightened if needed}
- "Tools":            {dep list — from agents/link.md Skills table "Deps" column, with MCP:/Gateway:/Files:/Env: prefixes stripped, (opt) markers kept}
- "Last Changed":     {date from maintenance section — ISO format}
- "Last Changelog":   {the most recent changelog block — version header + bullet points, plain text}
```

> ⚠️ **All six fields — every time.** Do not split the update into "version fields" and "documentation fields". Write Version + Last Changed + Last Changelog + Area + Description + Tools in a single `notion-update-page` call per row. Omitting Description/Tools is a common mistake when the SKILL.md was the only file touched.

**Optimization:** if the skill's Maintenance section was NOT touched in this commit (no version bump for that skill), and link.md's Skills table row for that skill also wasn't touched, you can skip the upsert for that row entirely. Most commits only touch 1–4 of the 28 rows.

**Do not proceed to Step 5 until every row in the table above that was touched is present and up to date in Notion.**

---

## Step 5 — Sync to Notion Skills Documentation

The **Skills Documentation** DB is the documentation surface for each skill/agent — one Notion page per skill. The Agents Library DB (Step 4) tracks release metadata; this one tracks the human-readable docs and is updated every release.

The schema:

| Property | Type | Purpose |
|---|---|---|
| `Name` | title | Skill/agent display name (e.g. `content-generator`) |
| `Slug` | text | Folder slug — exactly matches the skill directory name |
| `Area` | select | `General` / `Setup` / `Marketing` / `Sales` / `Customer Success` / `Finance` / `Strategy` / `Productivity` (no `All` option — use `General` for the Link agent) |
| `Status` | select | `Draft` / `In Review` / `Published` — **never overwrite on existing rows** |
| `Last edited time` | auto | Notion sets this |

Page body holds the skill's documentation content — **update it on every touched row** (see 5d).

### 5a. Find or create the database

Same env-var-first → name search → create pattern as Step 4a. Env var name: `SKILLS_DOCUMENTATION_DB`. Known database ID at time of writing: `76873a32fa4341a09a4d03f9651cab85`.

**Step 1 — Check `SKILLS_DOCUMENTATION_DB` env var:**

Read `.claude/settings.local.json`. Look for `env.SKILLS_DOCUMENTATION_DB`.

**IF env var is set:**

```
Use Notion MCP tool notion-fetch:
- id: ${SKILLS_DOCUMENTATION_DB}
```

If the fetch succeeds → use this database. Skip to Step 5b.
If `not_found` / 404 → fall through to Step 2.

**Step 2 — Name search (only if env var is unset OR Step 1 returned not_found):**

```
Use Notion MCP tool notion-search:
- query: "Skills Documentation"
- filter: { "value": "database", "property": "object" }
```

Filter to type=database and pick the one whose title contains "Skills Documentation". If found: capture the ID, persist it to `.claude/settings.local.json` `env.SKILLS_DOCUMENTATION_DB`, notify the user once:

> Found existing **{DB title}** at ID `{id}` — saved as `SKILLS_DOCUMENTATION_DB` in `.claude/settings.local.json`. Future commit-to-git runs will use this ID directly.

Then proceed to Step 5b.

**Step 3 — Create (only if Step 2 returned no match):**

```
Use Notion MCP tool notion-create-database:
- parent: { type: "workspace" }
- title: "Five Agents — Skills Documentation"
- properties:
    "Name":   { type: "title" }
    "Slug":   { type: "rich_text" }
    "Area":   { type: "select", options: ["General", "Setup", "Marketing", "Sales", "Customer Success", "Finance", "Strategy", "Productivity"] }
    "Status": { type: "select", options: ["Draft", "In Review", "Published"] }
```

Persist the returned ID to `.claude/settings.local.json` `env.SKILLS_DOCUMENTATION_DB`. Notify the user.

### 5b. Read all current rows

```
Use Notion MCP tool notion-fetch:
- id: {database_id}
```

Build a map of existing rows **keyed by `Slug`** (the canonical join key — survives Name renames). Skills lacking a Slug fall back to matching by `Name`.

### 5c. Build the touched-skills inventory

Use the same 28-row file table from Step 4c. **Only consider rows whose SKILL.md or `agents/link.md` row was modified in this commit** — most commits touch 1–4 rows. If neither the skill's SKILL.md nor its `link.md` row was touched, skip it entirely (no Notion call).

For each touched row, gather from `plugins/link-skills/agents/link.md` Skills table and the skill's `## Maintenance` block:

- **`Name`** — skill folder name verbatim (e.g. `content-generator`). For the Link agent, use `Link`.
- **`Slug`** — same as `Name` for skills; for the Link agent use `link`.
- **`Area`** — from link.md Skills table `Area` column. Map `All` → `General`.
- **`Use For`** — the "Use For" cell from link.md Skills table (one-line description).
- **`Deps`** — the "Deps" cell from link.md Skills table (MCP:/Gateway:/Files:/Env: prefixes stripped).
- **`Version`** — from the skill's `## Maintenance` block.
- **`Latest changelog entry`** — the most recent `**vX.X.X**` block from the skill's `### Change Log`.

### 5d. Upsert each touched row into Notion

> ⚠️ **This step is mandatory and must not be skipped.** Every touched skill gets a full property update AND a body content update. Skipping body updates leaves the documentation stale.

**Properties to update (existing rows):**

```
Use Notion MCP tool notion-update-page with command: "update_properties":
- "Name":   {skill folder name}
- "Slug":   {skill folder slug}
- "Area":   {General | Setup | Marketing | Sales | Customer Success | Finance | Strategy | Productivity}
```

Do NOT write `Status` on existing rows — preserve whatever the team set.

**Body content to update (existing rows):**

Fetch the current page body first (`notion-fetch` on the page ID). Then use `update_content` or `replace_content` to write the following structure:

```markdown
## What it does
{Use For — one sentence from link.md Skills table}

## Dependencies
{Deps — from link.md Skills table, MCP:/Gateway:/Files:/Env: prefixes stripped}

## Latest changes
{Latest changelog entry — version header + bullet points, plain text}
```

Use `replace_content` if the page already has this structure (safe to overwrite — it is generated content, not hand-written prose). Use `insert_content` at the start if the page is empty.

**New rows:**

Create a new page with `Name`, `Slug`, `Area`, `Status: "Draft"` and the body structure above pre-populated. Notify the user once:
> Created new Skills Documentation page **{name}** (Status: Draft).

**Do not proceed to Step 6 until every touched row has updated properties AND updated body content.**

---

## Step 6 — Sync to Notion Tool Reference (EU Privacy) — only when new tools introduced

The **EU Customer Data Privacy — Tool Reference** DB is the compliance registry — one row per third-party MCP / gateway tool the plugin uses, with vendor metadata (Company, Data Location, GDPR DPA status, Privacy Policy URL, Last Verified date). Required by the EU customer compliance posture.

**This step only runs when this commit introduces a new tool.** Most commits don't — bug fixes, copy edits, and even most new skills reuse the existing MCP / gateway inventory. Skip the whole step if no new tool was introduced.

### 6a. Detect whether any new tool was introduced

Quick early-exit check against this commit's diff:

```bash
git diff --cached -- plugins/link-skills/agents/link.md | grep -E '^\+.*\*\*[A-Za-z]'
```

Look in the added (`+`) lines of `agents/link.md` for bullets under either `### MCP Connectors` or `### External APIs (via gateway MCP tools)`. If no added lines match the pattern of a new tool bullet (`- **{Name} MCP** — …` or `- **{Name} API** — …`), **skip this entire step** and proceed to Step 7.

Edge cases that still count as "new tool introduced" — keep this step running if any apply:
- A new skill folder under `plugins/link-skills/skills/` declares an MCP / gateway dep that is **not** already present in any other skill's Deps cell
- A skill's Deps cell gained an MCP / gateway prefix entry that was never used anywhere else before

If none of the above apply, skip to Step 7. Otherwise continue.

The compliance fields (Data Location, Training on Customer Data, GDPR DPA, Certification, Privacy Policy URL) **must NEVER be auto-populated** — they require manual vendor research and would mislead later audits if guessed. The workflow only creates a stub row with `Tool` + `Role` and flags the user to fill the rest before publishing.

### 6b. Find or create the database

Same env-var-first → name search → create pattern as Steps 4a / 5a. Env var: `TOOL_REFERENCE_DB`. Known database ID at time of writing: `ff63b12f2e404371b2ebdcbfa4474f5f`.

**Step 1 — Check `TOOL_REFERENCE_DB` env var.** If set, `notion-fetch` it; if it returns a database, use it. If 404, fall through.

**Step 2 — Name search** (only if env var unset or returned not_found):

```
Use Notion MCP tool notion-search:
- query: "EU Customer Data Privacy"
- filter: { "value": "database", "property": "object" }
```

Match the title containing "EU Customer Data Privacy — Tool Reference" (or just "Tool Reference" — the prefix may change). Persist the ID to `.claude/settings.local.json` `env.TOOL_REFERENCE_DB` and notify the user once.

**Step 3 — Create** (only if Step 2 returned no match):

```
Use Notion MCP tool notion-create-database:
- parent: { type: "workspace" }
- title: "EU Customer Data Privacy — Tool Reference"
- properties:
    "Tool":                      { type: "title" }
    "Role":                      { type: "rich_text" }
    "Company":                   { type: "rich_text" }
    "Company Location":          { type: "select", options: ["🇺🇸 USA", "🇪🇺 EU", "🌐 Global"] }
    "Data Location":             { type: "select", options: ["USA", "EU", "Global / DPA", "EU default / USA available"] }
    "Training on Customer Data": { type: "select", options: ["❌ No", "✅ Yes", "⚠️ Conditional"] }
    "GDPR DPA":                  { type: "select", options: ["✅ Available", "✅ Native GDPR", "⚠️ Request directly", "❌ Not available"] }
    "Certification":             { type: "rich_text" }
    "Privacy Policy URL":        { type: "url" }
    "Last Verified":             { type: "date" }
    "Notes":                     { type: "rich_text" }
```

Persist the ID to `env.TOOL_REFERENCE_DB`.

### 6c. Extract the canonical tool inventory from link.md

Parse two sections of `plugins/link-skills/agents/link.md`:

1. **`## Tools & Integrations` → `### MCP Connectors`** — each bullet starts with a bolded tool name followed by a description after the em-dash. Example:
   > `- **Notion MCP** — content calendar, page management`

   Extract `Notion MCP` as the tool name and `content calendar, page management` as the Role.

2. **`## Tools & Integrations` → `### External APIs (via gateway MCP tools)`** — same shape. Example:
   > `- **Gemini API** — image generation → gemini_generate_image / gemini_generate_text`

   Extract `Gemini API` as the tool name. The Role is everything between the em-dash and the `→` arrow (or end of line if no arrow). Trim trailing whitespace.

**Skip** entries that are clearly internal implementation, not third-party services:
- "Image processing — Python Pillow (local)"
- "FiveAgents — fiveagents_log_run / ..."  (this is the in-house gateway, not a vendor)
- Anything where the role describes local-only behavior

**Normalize tool names for matching** — strip the trailing `MCP` / `API` token before comparing against Notion (the DB convention is bare vendor names like `Notion`, `Slack`, `Gemini`). Preserve the bolded form as the **canonical creation name** if a new row is needed — let the user rename in Notion if they want a different convention.

### 6d. Read existing Tool Reference rows

```
Use Notion MCP tool notion-fetch:
- id: {database_id}
```

Build a set of existing `Tool` titles. Match case-insensitively and against the normalized form (with `MCP` / `API` stripped) so that link.md "Notion MCP" matches a Notion row called "Notion".

### 6e. Find missing tools

Set-difference: tools mentioned in link.md that have no matching row in Notion. **Most commits will produce zero missing tools** — the inventory is stable. This step is only meaningful when a new MCP / gateway / skill was added.

### 6f. Create stub rows for missing tools

For each missing tool, create a Notion row with **only these two fields populated**:

```
Use Notion MCP tool notion-create-pages:
- "Tool": {canonical bolded name from link.md, e.g. "Notion MCP" or "Gemini API"}
- "Role": {description from link.md, e.g. "content calendar, page management"}
```

Leave Company / Company Location / Data Location / Training on Customer Data / GDPR DPA / Certification / Privacy Policy URL / Last Verified / Notes **blank**. Do not guess values from training data — vendor terms change, and an audit-grade DB poisoned by guesses is worse than a row with honest gaps.

Notify the user once per stub row:

> Created stub row **{tool}** in Tool Reference DB (Role: "{role}"). **Required:** research the vendor's Privacy Policy + DPA terms and populate Company / Company Location / Data Location / Training on Customer Data / GDPR DPA / Certification / Privacy Policy URL / Last Verified in Notion before the next compliance review.

If multiple stubs were created, list them all in one consolidated message so the user can batch the research.

### 6g. Surface stale verification dates (advisory only)

After the upsert, list any existing rows where `Last Verified` is older than 365 days (or blank). Show them once as a warning — do not block the commit:

> ⚠️ {N} Tool Reference rows have Last Verified older than 1 year (or blank): {tool list}. Re-verify the vendor's privacy posture and update Last Verified when convenient.

**Do not modify existing rows automatically.** Even if link.md's Role text changed, leave the existing Notion Role field alone — it may have been hand-curated to be more accurate than the link.md description. Surface the discrepancy in the same advisory warning instead:

> ⚠️ Role drift on {N} tools: link.md description differs from Notion. Tools: {list}. Reconcile manually if intentional.

**Do not proceed to Step 7 until the missing-tools list is empty (every link.md tool has a Notion row, even if it's a fresh stub).**

---

## Step 7 — Update version.ts

Open `plugins/link-skills/versions/version.ts` and update:

### 7a. Determine the new version number

**If maintenance sections were already bumped this session:** the target version is the highest version number found across all updated maintenance sections. Use that — do not increment further.

**If maintenance sections are still at the old version:** determine the increment from the diff:
  - **Patch** (`v2.2.x`) — bug fixes, copy corrections, minor skill tweaks
  - **Minor** (`v2.x.0`) — new skill added, significant workflow change, new integration
  - **Major** (`vx.0.0`) — breaking change to the plugin architecture

Ask the user if the increment type is not obvious from the diff.

### 7b. Write the new version

Update three files in lockstep — they MUST always carry the same version. Drift between them was the v2.4.3 release bug (plugin.json + marketplace.json had been stuck at `1.0.0` since launch while `version.ts` had marched to `v2.4.3`).

**1. `plugins/link-skills/versions/version.ts`** — `v` prefix:

```typescript
const DEFAULT_VERSION = '{new_version}';     // e.g. 'v2.3.0'
const DEFAULT_DATE = '{Month DD, YYYY}';      // e.g. 'May 06, 2026'
```

**2. `plugins/link-skills/.claude-plugin/plugin.json`** — no `v` prefix (npm-style semver):

```json
{
  "name": "fiveagents-link",
  "version": "{new_version_no_v}",   // e.g. '2.3.0' (drop the 'v')
  ...
}
```

**3. `.claude-plugin/marketplace.json`** — two fields, both no `v` prefix:

```json
{
  "metadata": {
    "version": "{new_version_no_v}"
  },
  "plugins": [
    {
      "name": "link-skills",
      "version": "{new_version_no_v}",
      ...
    }
  ]
}
```

After editing, verify all three with `grep -nE '"version"|DEFAULT_VERSION' plugins/link-skills/versions/version.ts plugins/link-skills/.claude-plugin/plugin.json .claude-plugin/marketplace.json` — every match should show the same number (modulo the `v` prefix on `version.ts`).

### 7c. Prepend the new VERSION_HISTORY entry

Add a new object at the **top** of the `VERSION_HISTORY` array. Include one bullet per changed skill/agent, describing WHAT changed and WHY (not just a file name). Keep bullets tight — one sentence each:

```typescript
{
  version: '{new_version}',
  date: '{Month DD, YYYY}',
  changes: [
    'skill-name: what changed — why it matters',
    'skill-name: what changed — why it matters',
    // ...
  ],
},
```

**Trim the array** to the last 15 entries after prepending (delete the oldest entry if needed) — this keeps git diffs manageable.

---

## Step 8 — Regenerate skills manifest, then stage and commit

**Before staging, regenerate `skills-manifest.json`** any time a `SKILL.md` or `link.md` file was added, removed, or had its frontmatter edited. The CI `skills-registry-check` workflow will fail if this file is stale.

```bash
cd plugins/link-skills && python scripts/gen_skills_index.py
```

The script rewrites `plugins/link-skills/skills-manifest.json` and `plugins/link-skills/SKILLS.md` and refreshes the `link.md` domain map. It is idempotent — safe to run even when nothing changed (output will confirm "no changes").

```bash
git add plugins/link-skills/ .claude-plugin/marketplace.json
```

Stage plugin files **and** the top-level marketplace manifest. If `workflow/commit-to-git.md` itself was edited in this commit, also stage `workflow/`. Do not stage unrelated changes. Verify with `git diff --cached --stat` before committing.

```bash
git commit -m "{new_version}: {one-line summary of what changed}"
```

The commit message must start with the version number. Example:
```
v2.3.0: social-template gateway rendering — brand-setup uploads templates, content-generator/creative-designer render via template_render MCP
```

---

## Step 9 — Push and tag

```bash
git push origin main
```

Wait for the push to succeed, then tag:

```bash
git tag {new_version}
git push origin {new_version}
```

Confirm the tag appears on the remote:

```bash
git ls-remote --tags origin | grep {new_version}
```

---

## Quality Checklist

- [ ] All modified SKILL.md / link.md files have updated maintenance sections (Version + Last Changed + Changelog entry for the new version)
- [ ] Every `### Change Log` section (in `plugins/link-skills/agents/link.md` AND every `plugins/link-skills/skills/*/SKILL.md`) contains at most 5 entries (newest at top, oldest trimmed) — Step 3c
- [ ] No skill or agent was left with a stale "Last Changed" date
- [ ] Notion Agents Library DB (resolved via `AGENTS_LIBRARY_DB` env var or fuzzy name search) is fully up to date — all 28 rows present, and every touched row has correct **Version / Last Changed / Last Changelog / Area / Description / Tools** (all six fields sourced from the skill's Maintenance section + `agents/link.md` Skills table; Description and Tools must be written even when only the Maintenance section changed)
- [ ] If `agents/link.md` Skills table changed in this commit (Area / "Use For" / Deps columns), the corresponding Notion row's Area / Description / Tools were re-synced — even if the skill's own Maintenance section wasn't bumped
- [ ] Notion Skills Documentation DB (resolved via `SKILLS_DOCUMENTATION_DB` env var or fuzzy name search) — every touched skill has **properties updated** (Name / Slug / Area, never Status) AND **body content updated** (What it does / Dependencies / Latest changes sections, sourced from link.md Use For + Deps + SKILL.md changelog)
- [ ] If `agents/link.md` Skills table `Area` column changed for a skill, the Skills Documentation row's Area was re-synced (mapping `All` → `General` for the Link agent)
- [ ] If this commit introduces a new MCP / gateway tool (or a new skill that uses a not-already-tracked tool), Notion Tool Reference DB (resolved via `TOOL_REFERENCE_DB` env var or fuzzy name search) gained a stub row with `Tool` + `Role` populated, and the user was notified to fill the compliance fields (Company / Data Location / GDPR DPA / Privacy Policy URL / Last Verified). **Existing row compliance fields and Role text must NOT be auto-overwritten** — surface drift advisories instead
- [ ] `skills-manifest.json` is up to date — `python scripts/gen_skills_index.py` was run before staging and reported no unexpected changes (or changes were staged)
- [ ] `version.ts` DEFAULT_VERSION and DEFAULT_DATE match the new version and today's date
- [ ] `plugins/link-skills/.claude-plugin/plugin.json` `version` matches (no `v` prefix)
- [ ] `.claude-plugin/marketplace.json` `metadata.version` AND the link-skills plugin entry `version` both match (no `v` prefix)
- [ ] VERSION_HISTORY entry is at the top of the array and describes every changed file
- [ ] VERSION_HISTORY array is trimmed to ≤ 15 entries
- [ ] Commit message starts with the version number
- [ ] Tag pushed to remote and confirmed with `git ls-remote`
