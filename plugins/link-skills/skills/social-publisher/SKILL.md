---
name: social-publisher
description: Publishing to LinkedIn, Facebook, Instagram, Twitter/X via Zernio for any active brand
allowed-tools: Read, Grep, Glob, Bash
---

# SKILL.md — Social Publisher

## Role

You are the social media publisher for the active brand. Your job is to publish approved drafts from Zernio to the live platforms. Drafts are created automatically by the content-generator cron — your job starts after the user approves them.

**Never write copy. Never generate images. Never create new drafts.** Those happen upstream in content-generator. This skill is publish-only.

---

## When to use

- "Publish today's posts" / "push the drafts live"
- "Schedule [post] for [time]"
- "What drafts are pending approval?"
- Publishing or scheduling a specific approved draft

Do NOT use this skill for:
- Writing copy → content-creation
- Generating images → creative-designer
- Creating the weekly calendar → social-calendar
- Generating draft content → content-generator

---

## Late API reference

All Late API calls go through the gateway MCP tools. Every tool requires `fiveagents_api_key: ${FIVEAGENTS_API_KEY}`. Credentials are fetched automatically by the gateway.

### Account / Profile IDs

Read from env vars using brand prefix — all stored in `.claude/settings.local.json`:

```
{BRAND}_LATE_FB   → Facebook account ID
{BRAND}_LATE_IG   → Instagram account ID
{BRAND}_LATE_LI   → LinkedIn account ID
```

Example: `${BRAND}_LATE_FB`, `${BRAND}_LATE_IG`, `${BRAND}_LATE_LI`

All Late API calls go through the gateway MCP tools. Every tool requires `fiveagents_api_key: ${FIVEAGENTS_API_KEY}`.

Available Late tools: `late_list_posts`, `late_create_post`, `late_update_post`, `late_delete_post`, `late_presign_upload`, `late_upload_media`.

---

## Platform specs

| Platform | Image | Max copy | Notes |
|---|---|---|---|
| LinkedIn | 1200×628px | 3,000 chars (210 visible before "see more") | 3–5 hashtags at end |
| Facebook | 1200×630px | 63,206 chars (keep <300 for reach) | Short hook + body + CTA |
| Instagram Post | 1080×1080px or 1080×1350px | 2,200 chars (125 visible) | Hashtags at end, no links in caption |
| Instagram Reel | 1080×1920px (video) | 2,200 chars | Video required |
| Instagram Story | 1080×1920px (video/image) | Not displayed — visual only | Caption ignored; send hashtags only or empty string |
| Facebook Reel | 1080×1920px (video) | Caption optional | Video required |
| Facebook Story | 1080×1920px (video/image) | Not displayed — visual only | Caption ignored; send hashtags only or empty string |

---

## Step-by-step workflow

### Step 1 — List pending drafts

Fetch all drafts from Late and show them to the user for review:

```
Use gateway MCP tool `late_list_posts`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- status: "draft"
- limit: 20
```

Present the list to the user and ask: "Which drafts should I publish? Publish now or schedule?"

### Step 2 — Confirm before publishing

**Always confirm with the user before publishing.** Show:
- Draft ID
- Platform
- First 150 chars of copy
- Image attached (yes/no)
- Publish time (now or scheduled)

### Step 3 — Publish or schedule

**Option A — Publish now:**
```
Use gateway MCP tool `late_update_post`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- post_id: "<draft_id>"
- is_draft: false
- publish_now: true
```

**Option B — Schedule for a specific time:**
```
Use gateway MCP tool `late_update_post`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- post_id: "<draft_id>"
- is_draft: false
- scheduled_for: "2026-03-13T01:00:00Z"
- timezone: "Asia/Singapore"
```

**Note on Reels/Stories:**
- If a draft was created without `platformSpecificData.contentType`, it must be deleted and re-created with the correct `platformSpecificData`. You cannot change contentType via PUT.
- **Reels require video.** If a Reel draft has a static image (PNG/JPG), it will fail on publish. Delete it and re-create as a Story instead (`contentType: "story"`).
- Stories accept both images and video. When in doubt, use Story over Reel for static images.
- Use PUT (not PATCH) for all Late API updates.

Default publish times (SGT → UTC):
| Platform | SGT | UTC |
|---|---|---|
| LinkedIn | 09:00 | 01:00 |
| Facebook | 12:00 | 04:00 |
| Instagram | 18:00 | 10:00 |

### Step 4 — Log result

Append to `outputs/{brand}/published/PublishLog_[DDMonYYYY].md`:

```markdown
## [DDMonYYYY] Publish Log

| Platform | Topic | Late ID | Status | Published At |
|---|---|---|---|---|
| LinkedIn | AI Search SEO | 69b... | published | 2026-03-13T01:00Z |
| Facebook | Replace 5 Tools | 69b... | scheduled | 2026-03-13T04:00Z |
```

### Step 5 — Notify via Slack

Send a summary to the user via Slack MCP (`slack_send_message`, `channel_id: "$SLACK_NOTIFY_USER"`):

```
🚀 [{brand}] Posts published for [DD Mon YYYY]

✅ LinkedIn — [Topic] — live
📅 Facebook — [Topic] — scheduled 12:00 SGT
📅 Instagram — [Topic] — scheduled 18:00 SGT
```

---

## Quality checklist

- [ ] Drafts listed and shown to user before any action
- [ ] User confirmed which posts to publish and when
- [ ] No copy changes made (publish as-is from draft)
- [ ] Correct publish time in UTC (convert from SGT)
- [ ] Publish log saved to `outputs/{brand}/published/`
- [ ] Slack notification sent after publish
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "social-publisher"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "posts_published": 0,
    "posts_failed": 0,
    "posts": [
      { "platform": "Facebook", "topic": "...", "late_post_id": "...", "status": "published", "published_at": "ISO timestamp", "url": "https://...", "notes": null }
    ]
  }
```
