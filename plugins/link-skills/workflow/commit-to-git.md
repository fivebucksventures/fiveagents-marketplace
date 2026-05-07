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

### 3c. Check for new skills or agents

Compare the list of SKILL.md files on disk against the existing entries in `version.ts` VERSION_HISTORY:

```bash
ls plugins/link-skills/skills/
ls plugins/link-skills/agents/
```

If a new skill or agent folder exists that has never appeared in any VERSION_HISTORY entry, it is a new addition — flag it for the version bump changelog in Step 5.

---

## Step 4 — Sync to Notion Agents Library

### 4a. Find or create the database

Search Notion for a database named **"Five Agents - Agents Library"**:

```
Use Notion MCP tool notion-search:
- query: "Five Agents - Agents Library"
- filter: { "value": "database", "property": "object" }
```

**If found:** read the database ID and proceed to Step 4b.

**If not found:** create it:

```
Use Notion MCP tool notion-create-database:
- parent: { type: "workspace" }
- title: "Five Agents - Agents Library"
- properties:
    "#":              { type: "number" }
    "Agent/Skill Name": { type: "title" }
    "Type":           { type: "select", options: ["Agent", "Skill"] }
    "Version":        { type: "rich_text" }
    "Last Changed":   { type: "date" }
    "Last Changelog": { type: "rich_text" }
```

Save the returned database ID.

### 4b. Read all current rows

```
Use Notion MCP tool notion-fetch:
- id: {database_id}
```

Build a map of existing rows keyed by "Agent/Skill Name" so you can match and update without creating duplicates.

### 4c. Build the full skill/agent inventory

Read the `## Maintenance` block from each of the following files and extract: Name, Type, Version, Last Changed, last changelog entry (the most recent `**vX.X.X**` bullet block):

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
| 13 | `plugins/link-skills/skills/commit-to-git/SKILL.md` | commit-to-git | Skill |
| 14 | `plugins/link-skills/skills/plugin-update/SKILL.md` | plugin-update | Skill |

### 4d. Upsert each row into Notion

For each item in the inventory:

- **Row exists** (matched by name) → update: Version, Last Changed, Last Changelog
- **Row missing** → create new page with all fields including `#` (use the table row number above)

```
Use Notion MCP tool notion-update-page (existing) or notion-create-pages (new):
- "Agent/Skill Name": {name}
- "Type":             {Agent | Skill}
- "Version":          {version from maintenance section}
- "Last Changed":     {date from maintenance section — ISO format}
- "Last Changelog":   {the most recent changelog block — version header + bullet points, plain text}
```

**Do not proceed to Step 5 until every row in the table above is present and up to date in Notion.**

---

## Step 5 — Update version.ts

Open `plugins/link-skills/versions/version.ts` and update:

### 5a. Determine the new version number

**If maintenance sections were already bumped this session:** the target version is the highest version number found across all updated maintenance sections. Use that — do not increment further.

**If maintenance sections are still at the old version:** determine the increment from the diff:
  - **Patch** (`v2.2.x`) — bug fixes, copy corrections, minor skill tweaks
  - **Minor** (`v2.x.0`) — new skill added, significant workflow change, new integration
  - **Major** (`vx.0.0`) — breaking change to the plugin architecture

Ask the user if the increment type is not obvious from the diff.

### 5b. Write the new version

Update the file:

```typescript
const DEFAULT_VERSION = '{new_version}';     // e.g. 'v2.3.0'
const DEFAULT_DATE = '{Month DD, YYYY}';      // e.g. 'May 06, 2026'
```

### 5c. Prepend the new VERSION_HISTORY entry

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

## Step 6 — Stage and commit

```bash
git add plugins/link-skills/
```

Stage only plugin files. Do not stage unrelated changes. Verify with `git diff --cached --stat` before committing.

```bash
git commit -m "{new_version}: {one-line summary of what changed}"
```

The commit message must start with the version number. Example:
```
v2.3.0: social-template gateway rendering — brand-setup uploads templates, content-generator/creative-designer render via template_render MCP
```

---

## Step 7 — Push and tag

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
- [ ] No skill or agent was left with a stale "Last Changed" date
- [ ] Notion "Five Agents - Agents Library" DB is fully up to date — all 14 rows present
- [ ] `version.ts` DEFAULT_VERSION and DEFAULT_DATE match the new version and today's date
- [ ] VERSION_HISTORY entry is at the top of the array and describes every changed file
- [ ] VERSION_HISTORY array is trimmed to ≤ 15 entries
- [ ] Commit message starts with the version number
- [ ] Tag pushed to remote and confirmed with `git ls-remote`
