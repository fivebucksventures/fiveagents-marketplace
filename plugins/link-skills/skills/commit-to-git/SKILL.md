---
name: commit-to-git
description: Stage all changes, bump patch version in version.ts, commit with version-prefixed message, push to origin, and tag the release
allowed-tools: Bash, Read, Edit
---

# Commit to Git Skill

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are the release manager for this repository. Your job is to stage all changes, bump the patch version, write a descriptive commit message, push to origin, and tag the release. This runs in production — never use DEV versioning.

---

## When to use

Use this skill when:
- The user asks to commit / push / release changes
- Running as a scheduled daily task (on cron schedule)
- After a session where files were created or modified

Do NOT run if:
- The working directory has no changes (`git status` is clean)
- There are merge conflicts that need manual resolution

---

## Step-by-step workflow

### Step 1 — Check git status

```bash
git status
```

If the working directory is clean (nothing to commit), log "No changes to commit — skipping." and exit.

### Step 2 — Get today's date and current version

```bash
TZ=<brand timezone from brands/{brand}/brand.md> date '+%B %-d, %Y'
```

Read current version from `versions/version.ts` — look at `DEFAULT_VERSION`.

### Step 3 — Determine new version

Bump the **patch** number only (this is an automated daily commit, not a feature release):
- `v0.2.0` → `v0.2.1`
- `v0.2.9` → `v0.2.10`

Never bump minor or major from this skill — that requires manual release decisions.

### Step 4 — Summarize changes for VERSION_HISTORY

Run:
```bash
git diff --stat HEAD
git status --short
```

From the output, write a concise list of changes (3–8 bullets). Each bullet:
- States what changed, not how (e.g. "content-generator: added intermediate file cleanup step")
- Starts with the affected file/component
- Is max 12 words

### Step 5 — Update versions/version.ts

Edit `versions/version.ts` to:
1. Set `DEFAULT_VERSION` to the new version string
2. Set `DEFAULT_DATE` to today's date (format: `'Month D, YYYY'` — e.g. `'April 1, 2026'`)
3. Prepend a new entry to `VERSION_HISTORY` array with the new version, date, and changes list

Keep only the last 15 entries in `VERSION_HISTORY` — remove the oldest if needed.

**VERSION_HISTORY entry format:**
```typescript
{
  version: 'v0.2.1',
  date: 'April 1, 2026',
  changes: [
    'CLAUDE.md: added persona slugs and quick reference section',
    'content-generator: added intermediate file cleanup step (Step 4g)',
    'digital-marketing-analyst: added date consistency rule for daily/weekly briefs',
  ],
},
```

### Step 6 — Stage all changes

```bash
git add .
```

### Step 7 — Commit

Commit message format: start with the version number, then a short description of what this batch covers:

```bash
git commit -m "$(cat <<'EOF'
v0.2.1 — skill audits, CLAUDE.md updates, content-generator cleanup

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Message rules:
- First line: `{version} — {short summary}` (max 72 chars total)
- No bullet points in the commit message — save those for VERSION_HISTORY
- Always include the Co-Authored-By trailer

### Step 8 — Push to origin

```bash
git push origin main
```

If push fails (e.g. remote has diverged), do NOT force push. Log the error and notify via Slack:
```
⚠️ Git push failed for [version]. Manual intervention needed — possible remote divergence. Run: git pull --rebase origin main
```

### Step 9 — Tag the release

```bash
git tag {new_version}
git push origin {new_version}
```

Example:
```bash
git tag v0.2.1
git push origin v0.2.1
```

### Step 10 — Notify via Slack

**Before calling `slack_send_message`, you MUST first call `ToolSearch` with query `"slack_send_message"` to load the tool schema.** The Slack MCP tool is deferred — calling it without loading the schema first will cause the task to hang.

DM the user via Slack MCP (`slack_send_message`, `channel_id: "$SLACK_NOTIFY_USER"`):

```
✅ Git commit pushed — {version}

Changes: {N} files changed
Tag: {version}
Branch: main
Time: {HH:MM} [timezone]
```

If any step failed, send:
```
⚠️ Git commit failed at Step {N} — {error summary}
Manual check needed.
```

---

## Quality Checklist

- [ ] `git status` checked — changes exist before proceeding
- [ ] Version bumped at patch level only
- [ ] `DEFAULT_VERSION` and `DEFAULT_DATE` updated in version.ts
- [ ] New entry prepended to `VERSION_HISTORY` with accurate change list
- [ ] `VERSION_HISTORY` trimmed to max 15 entries
- [ ] `git add .` staged all changes
- [ ] Commit message starts with version number
- [ ] Co-Authored-By trailer included
- [ ] `git push origin main` succeeded
- [ ] Tag created and pushed
- [ ] Slack notification sent
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "commit-to-git"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "version": "<new version>",
    "files_changed": 0,
    "tag_pushed": true
  }
```
