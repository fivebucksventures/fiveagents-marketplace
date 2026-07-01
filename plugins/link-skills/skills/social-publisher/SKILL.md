---
name: social-publisher
description: Publishing to LinkedIn, Facebook, Instagram, Twitter/X via Zernio for any active brand
allowed-tools: Read, Grep, Glob, Bash
area: Marketing
use_for: "Publishing to LinkedIn, Facebook, Instagram, Twitter/X via Zernio"
deps:
  mcp: ["Slack", "Zernio"]
  gateway: []
  files: ["brand.md"]
  env: ["`${BRAND}_ZERNIO_FB`", "`${BRAND}_ZERNIO_IG`", "`${BRAND}_ZERNIO_LI` (per-platform; only required for platforms the brand publishes to)"]
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.18.0 | July 01, 2026 |

**Description:** Publishing to LinkedIn, Facebook, Instagram, Twitter/X via Zernio for any active brand

### Change Log

**v2.18.0** — July 01, 2026
- **Zernio migrated to its own MCP (gateway v1.7.4).** Repointed `late_list_posts` → `posts_list`, `late_create_post` → `posts_create`, `late_update_post` → `posts_update`, and `late_presign_upload` → `media_generate_upload_link` to Zernio's native MCP tool names; dropped the `fiveagents_api_key` param from those calls (Zernio is now OAuth-connected, not gateway-routed); renamed `${BRAND}_LATE_*` env vars to `${BRAND}_ZERNIO_*` and internal `late_*` PublishLog fields to `zernio_*`.

**v2.3.0** — May 28, 2026
- **PublishLog is now the performance join key.** Step 4 captures the platform post URL (`platformPostUrl`) alongside the Zernio ID, and records `Date` + `Topic` + `Platform` so `content-performance-analyst` can join each published post back to its social-calendar planning row (Persona / Format / Content Angle / Direction / hook archetype) and fetch per-post engagement. Closes the create→publish→measure loop.

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

**v2.2.2** — April 10, 2026
- Removed late_upload_media from tools list; added requests.put note

**v2.2.1** — April 10, 2026
- Zernio publishing integrated (LinkedIn, Facebook, Instagram, Twitter/X)

# SKILL.md — Social Publisher

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

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

## Zernio publishing reference

Zernio ships its own MCP server — its tools are OAuth/session-scoped and take no `fiveagents_api_key` param.

### Account / Profile IDs

Read from env vars using brand prefix — all stored in `.claude/settings.local.json`:

```
{BRAND}_ZERNIO_FB   → Facebook account ID
{BRAND}_ZERNIO_IG   → Instagram account ID
{BRAND}_ZERNIO_LI   → LinkedIn account ID
```

Example: `${BRAND}_ZERNIO_FB`, `${BRAND}_ZERNIO_IG`, `${BRAND}_ZERNIO_LI`

Available Zernio MCP tools: `posts_list`, `posts_create`, `posts_update`, `posts_delete`, `media_generate_upload_link`.

For media uploads, use Python `requests.put` with the presigned URL from `media_generate_upload_link`.

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

Fetch all drafts from Zernio and show them to the user for review:

```
Use Zernio MCP tool `posts_list`:
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
Use Zernio MCP tool `posts_update`:
- post_id: "<draft_id>"
- is_draft: false
- publish_now: true
```

**Option B — Schedule for a specific time:**
```
Use Zernio MCP tool `posts_update`:
- post_id: "<draft_id>"
- is_draft: false
- scheduled_for: "<ISO 8601 UTC datetime>"
- timezone: "<read from brands/{brand}/brand.md Locale section>
```

**Note on Reels/Stories:**
- If a draft was created without `platformSpecificData.contentType`, it must be deleted and re-created with the correct `platformSpecificData`. You cannot change contentType via PUT.
- **Reels require video.** If a Reel draft has a static image (PNG/JPG), it will fail on publish. Delete it and re-create as a Story instead (`contentType: "story"`).
- Stories accept both images and video. When in doubt, use Story over Reel for static images.
- Use PUT (not PATCH) for all Zernio post updates.

Default publish times (convert from brand timezone to UTC using `brands/{brand}/brand.md` Locale):
| Platform | Local Time | Notes |
|---|---|---|
| LinkedIn | 09:00 | Morning — professional audience |
| Facebook | 12:00 | Lunch break — casual browsing |
| Instagram | 18:00 | Evening — peak engagement |

### Step 4 — Log result (this is the performance join key)

Append to `outputs/{brand}/published/PublishLog_[DDMonYYYY].md`. **Capture the platform post URL (`platformPostUrl` from the Zernio publish response) alongside the Zernio ID** — this log is the join key `content-performance-analyst` uses later to match per-post engagement back to the planned post.

```markdown
## [DDMonYYYY] Publish Log

| Date | Platform | Topic | Zernio ID | Post URL | Status | Published At |
|---|---|---|---|---|---|---|
| 13 Mar 2026 | LinkedIn | AI Search SEO | 69b... | https://www.linkedin.com/feed/update/... | published | 2026-03-13T01:00Z |
| 13 Mar 2026 | Facebook | Replace 5 Tools | 69b... | https://www.facebook.com/.../posts/... | scheduled | 2026-03-13T04:00Z |
```

- **`Date` + `Topic` + `Platform`** let `content-performance-analyst` join each published post back to its planning row in the brand's social-calendar (`${BRAND}_NOTION_DB`) — recovering Persona / Format / Content Angle / Direction / hook archetype.
- **`Zernio ID` + `Post URL`** are the keys for fetching engagement from Zernio `posts_list` (matched by Zernio post ID); the URL is the human-readable fallback for matching.
- If the publish response omits `platformPostUrl` (some platforms return it asynchronously), record the Zernio ID and leave the URL blank — re-fetch via `posts_list` on the next analyst run.

### Step 5 — Notify via Slack

Send a summary to the user via Slack MCP (`slack_send_message`, `channel_id: "$SLACK_NOTIFY_USER"`):

```
🚀 [{brand}] Posts published for [DD Mon YYYY]

✅ LinkedIn — [Topic] — live
📅 Facebook — [Topic] — scheduled 12:00 [timezone]
📅 Instagram — [Topic] — scheduled 18:00 [timezone]
```

---

## Quality checklist

- [ ] Drafts listed and shown to user before any action
- [ ] User confirmed which posts to publish and when
- [ ] No copy changes made (publish as-is from draft)
- [ ] Correct publish time in UTC (convert from brand timezone)
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
      { "platform": "Facebook", "topic": "...", "zernio_post_id": "...", "status": "published", "published_at": "ISO timestamp", "url": "https://...", "notes": null }
    ]
  }
```
