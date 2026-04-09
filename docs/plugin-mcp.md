# Plugin Refactor Plan — fiveagents-link MCP Migration

## Current State

Skills in `plugins/link-skills/` make direct `curl` calls to external APIs using env vars from `settings.local.json`. This works in terminal (Claude Code) but **fails in Cowork** because the sandbox blocks outbound network.

### Skills and their external dependencies (all migrated to gateway/MCP)

| Skill | APIs Used | Via |
|-------|-----------|-----|
| `creative-designer` | Gemini, Late, Argil, FiveAgents | Gateway MCP tools |
| `background-generator` | Gemini, FiveAgents | Gateway MCP tools |
| `content-generator` | Late, Argil, FiveAgents | Gateway MCP tools |
| `social-publisher` | Late, FiveAgents | Gateway MCP tools |
| `digital-marketing-analyst` | Google Ads, Meta Ads, GA4, FiveAgents (email + log) | Windsor.ai MCP + Gateway |
| `research-strategy` | DataforSEO, FiveAgents | Gateway MCP tools |
| `content-creation` | FiveAgents (log) | Gateway MCP tools |
| `social-calendar` | FiveAgents (log) | Gateway MCP tools |
| `campaign-presenter` | FiveAgents (log) | Gateway MCP tools |
| `data-analysis` | FiveAgents (log) | Gateway MCP tools |
| `commit-to-git` | FiveAgents (log) | Gateway MCP tools |

All skills use gateway MCP tools. No `curl`, `urllib`, `gws`, or `ga4_pull.py` calls remain.

## Phase 1 — ✅ DONE (fiveagents.io credential storage)

Built on the fiveagents.io side. Key decisions:

- **No hardcoded service list** — service names are generic (lowercase alphanumeric + underscores). Each client adds their own services (e.g. `gemini`, `openai`, `stripe`, `meta_ads`).
- **Two separate API routes:**
  - `/api/credentials` — Bearer auth (`fa_live_xxx`), for gateway use
  - `/api/dashboard/credentials` — session auth, client-only dashboard use
- **Admins cannot access client credentials** — explicitly enforced
- **Supabase Vault** — AES-256 encryption at rest

See `fiveagents/docs/mcp.md` for full Phase 1 details.

## Phase 2 — ✅ DONE (Gateway Refactor)

Gateway refactored to use `fiveagents_api_key` param on every tool + `getCredential()` for Vault lookup via fiveagents.io API. See `fiveagents-gateway/docs/gw-mcp.md`.

## Phase 3 — ✅ DONE (Vercel Deployment)

Gateway migrated from Express to Vercel + `mcp-handler`. Deployed at `https://gateway.fiveagents.io/api/mcp`. See `fiveagents-gateway/docs/gw-mcp.md`.

## What Changed (Phase 4 — Plugin Migration) — ✅ DONE

### 1. Update `.mcp.json` — add gateway connector

**Before:**
```json
{
  "mcpServers": {
    "media": {
      "command": "python",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/media-server/server.py"],
      "env": { "PYTHONPATH": "${CLAUDE_PLUGIN_ROOT}/scripts" }
    }
  }
}
```

**After:**
```json
{
  "mcpServers": {
    "media": {
      "command": "python",
      "args": ["${CLAUDE_PLUGIN_ROOT}/servers/media-server/server.py"],
      "env": { "PYTHONPATH": "${CLAUDE_PLUGIN_ROOT}/scripts" }
    },
    "gateway": {
      "type": "url",
      "url": "https://gateway.fiveagents.io/api/mcp"
    }
  }
}
```

### 2. Update every SKILL.md — replace `curl` with MCP tool calls

Each skill must replace inline `curl`/Python API calls with gateway MCP tool calls. Skills should detect which mode they're in:

- **Cowork mode**: gateway MCP tools available → use them
- **Terminal mode**: env vars available → fall back to `curl` (backward compatible)

### 3. Skill-by-skill refactor

---

#### creative-designer/SKILL.md

**Gemini image generation (Step 4b)**

Before:
```bash
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ "contents": [...], "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]} }')
# extract base64 image with python...
```

After:
```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "<your image prompt>"
- model: "gemini-2.0-flash-exp"

Tool returns base64 image directly. Save to file with python:
python3 -c "import base64; open('output.png','wb').write(base64.b64decode('<base64_data>'))"
```

**Late upload + publish (Step 4b Step 3)**

Before:
```bash
# Presign
curl -s -X POST "https://getlate.dev/api/v1/media/presign" \
  -H "Authorization: Bearer $LATE_API_KEY" ...
# PUT file to uploadUrl
# POST /v1/posts
```

After:
```
1. Use gateway MCP tool `late_presign_upload`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - filename: "SocialPost_11Mar2026.png"
   - content_type: "image/png"

2. Use gateway MCP tool `late_upload_media`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - upload_url: <from step 1>
   - base64_data: <base64 encoded image>
   - content_type: "image/png"

3. Use gateway MCP tool `late_create_post`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - content: "<post copy>"
   - platforms: [{ platform: "facebook", accountId: "...", platformSpecificData: {...} }]
   - media_items: [{ url: "<publicUrl from step 1>", type: "image" }]
   - publish_now: true
```

**Argil video (Step 5)**

Before:
```bash
curl -s -X POST "https://api.argil.ai/v1/videos" \
  -H "x-api-key: $ARGIL_API_KEY" ...
```

After:
```
1. Use gateway MCP tool `argil_create_video`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - name: "Ad Video - ..."
   - aspect_ratio: "9:16"
   - moments: [{ avatarId: "...", voiceId: "...", transcript: "..." }]

2. Use gateway MCP tool `argil_render_video`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - video_id: <from step 1>

3. Poll with `argil_get_video` until status=DONE
```

**Dashboard logging (Final Step) — applies to ALL skills**

Before:
```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{ "skill": "creative-designer", ... }'
```

After:
```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "creative-designer"
- brand: "<active-brand>"
- status: "success"
- summary: "<1 line>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: { ... }
```

---

#### background-generator/SKILL.md

Replace Gemini `curl` in Step 3 with `gemini_generate_image` tool call.
Replace dashboard `curl` in Final Step with `fiveagents_log_run` tool call.

---

#### content-generator/SKILL.md

Replace Late Python `urllib` calls in Step 5 with gateway tools:
- `late_presign_upload` + `late_upload_media` + `late_create_post`

Replace Argil `curl` in Step 4c-argil with:
- `argil_create_video` + `argil_render_video` + `argil_get_video`

Replace dashboard `curl` in Final Step with `fiveagents_log_run`.

---

#### social-publisher/SKILL.md

Replace Late Python `urllib` calls with:
- `late_list_posts` (Step 1)
- `late_update_post` (Step 3)
- `late_delete_post` (when re-creating posts with correct contentType)

Replace dashboard `curl` with `fiveagents_log_run`.

---

#### digital-marketing-analyst/SKILL.md

Replace Meta Graph API `curl` calls with:
- Windsor.ai MCP `get_data` (replaces meta_ads_insights — campaign level, daily + weekly)

Replace dashboard `curl` with `fiveagents_log_run`.

---

#### research-strategy/SKILL.md

Replace DataforSEO `curl` calls in Step 1c with:
- `dataforseo_search_volume`
- `dataforseo_keyword_suggestions`

Replace dashboard `curl` with `fiveagents_log_run`.

---

#### content-creation, social-calendar, campaign-presenter, data-analysis, commit-to-git

Only change: replace dashboard logging `curl` with `fiveagents_log_run` tool call.

---

### 4. Update brand-setup/SKILL.md

Add a new step after API key collection to **store keys via the fiveagents.io API**:

```
After user provides their API keys, store them securely:

For each key provided (e.g. gemini, late, argil, etc.):
  curl -s -X POST "https://www.fiveagents.io/api/credentials" \
    -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{ "service": "<service_name>", "key": "<the key>" }'

This encrypts and stores each key in Supabase Vault.
Keys are never stored in plaintext and cannot be retrieved after storage.
```

Service names are generic — the client decides what to call each service. By convention the gateway tools expect names like `gemini`, `late`, `argil`, `meta_ads_token`, `meta_ad_account_id`, `dataforseo_login`, `dataforseo_password`.

Also update the prerequisites table to mention that keys are stored both locally (for terminal use) and in the dashboard (for Cowork use).

### 5. Update agents/link.md

Update the "External APIs" section:

**Before:**
```markdown
### External APIs (via curl in skills)
- **Gemini API** — image generation (`$GEMINI_API_KEY`)
- **Argil API** — AI avatar video generation (`$ARGIL_API_KEY`)
- **Late API** — social media publishing (`$LATE_API_KEY`)
- **Meta Graph API** — paid ads data (`$META_ADS_TOKEN`)
- **DataforSEO API** — keyword research (`$DATAFORSEO_LOGIN` + `$DATAFORSEO_PASSWORD`)
```

**After:**
```markdown
### External APIs (via gateway MCP or curl fallback)
- **Gemini API** — image generation → `gemini_generate_image` / `gemini_generate_text`
- **Argil API** — AI avatar video → `argil_create_video` / `argil_render_video` / `argil_get_video`
- **Late API** — social publishing → `late_presign_upload` / `late_create_post` / `late_list_posts` / `late_update_post`
- **Meta Ads + Google Ads + GA4** — via Windsor.ai MCP `get_data`
- **DataforSEO API** — keywords → `dataforseo_search_volume` / `dataforseo_keyword_suggestions`
- **FiveAgents Dashboard** — run logging → `fiveagents_log_run`

**In Cowork:** Skills use gateway MCP tools (network calls proxied through gateway).
**In terminal:** Skills can use gateway tools OR fall back to curl with env vars.
```

### 6. Update plugin.json `userConfig`

Add note that keys are now also stored server-side:

```json
{
  "gemini_api_key": {
    "description": "Google Gemini API key — stored locally for terminal use, and encrypted in dashboard for Cowork use",
    "sensitive": true
  }
}
```

## Detection Logic for Skills

Skills should check which mode they're in. Add this guidance to each SKILL.md that calls external APIs:

```markdown
### API Call Mode Detection

Before making external API calls, determine the available mode:

1. **Gateway mode** (Cowork): If gateway MCP tools are available
   (e.g. `gemini_generate_image` tool exists), use gateway tools.
   Pass `fiveagents_api_key: ${FIVEAGENTS_API_KEY}` to each tool call.

2. **Terminal mode** (Claude Code): If gateway tools are NOT available,
   fall back to curl/Python with env vars ($GEMINI_API_KEY, $LATE_API_KEY, etc.)
   from settings.local.json.

Gateway tools take priority when available. Both modes produce identical results.
```

## Migration Order

1. **brand-setup** — add credential storage step (so keys get into Vault)
2. **All skills** — add `fiveagents_log_run` replacement (easiest, affects all skills)
3. **creative-designer** — full refactor (Gemini + Late + Argil — most complex)
4. **background-generator** — Gemini only
5. **content-generator** — Late + Argil
6. **social-publisher** — Late only
7. **digital-marketing-analyst** — Meta Ads
8. **research-strategy** — DataforSEO
9. **Test in Cowork** — end-to-end verification

## Files Changed Summary

| File | Change |
|------|--------|
| `.mcp.json` | Add gateway remote connector |
| `agents/link.md` | Update API section to reference MCP tools |
| `skills/brand-setup/SKILL.md` | Add credential storage step |
| `skills/creative-designer/SKILL.md` | Replace curl with gemini/late/argil/fiveagents tools |
| `skills/background-generator/SKILL.md` | Replace curl with gemini/fiveagents tools |
| `skills/content-generator/SKILL.md` | Replace urllib/curl with late/argil/fiveagents tools |
| `skills/social-publisher/SKILL.md` | Replace urllib with late/fiveagents tools |
| `skills/digital-marketing-analyst/SKILL.md` | Replace curl with meta_ads/fiveagents tools |
| `skills/research-strategy/SKILL.md` | Replace curl with dataforseo/fiveagents tools |
| `skills/content-creation/SKILL.md` | Replace dashboard curl with fiveagents_log_run |
| `skills/social-calendar/SKILL.md` | Replace dashboard curl with fiveagents_log_run |
| `skills/campaign-presenter/SKILL.md` | Replace dashboard curl with fiveagents_log_run |
| `skills/data-analysis/SKILL.md` | Replace dashboard curl with fiveagents_log_run |
| `skills/commit-to-git/SKILL.md` | Replace dashboard curl with fiveagents_log_run |
| `.claude-plugin/plugin.json` | Update userConfig descriptions |

## Cowork Compatibility Matrix

Local STDIO MCP servers (media-server) do NOT work in Cowork. Only remote HTTP MCP servers (gateway), Windsor.ai MCP, and Anthropic-hosted connectors (Notion, Slack, Gmail, etc.) work.

### Skills

| Skill | Cowork? | Notes |
|-------|---------|-------|
| brand-setup | **Yes** | All steps work via gateway + MCP connectors |
| creative-designer | **Yes** | Image gen + text/logo overlay via gateway. Argil video via gateway. Ken Burns video is terminal-only (ffmpeg). |
| background-generator | **Yes** | Gemini image gen via gateway |
| content-generator | **Yes** | Copy + image + Late publish via gateway. Argil via gateway. Non-Argil Reels fall back to static Story. |
| social-publisher | **Yes** | All Late tools via gateway |
| digital-marketing-analyst | **Yes** | Google Ads + Meta Ads + GA4 via Windsor.ai MCP. Email via `fiveagents_send_email` (Postmark). |
| research-strategy | **Yes** | DataforSEO via gateway |
| content-creation | **Yes** | Logging via gateway |
| social-calendar | **Yes** | Logging via gateway |
| campaign-presenter | **Yes** | Logging via gateway |
| data-analysis | **Yes** | Logging via gateway |
| commit-to-git | **Yes** | Logging via gateway |

### Tools by environment

| Tool | Terminal | Cowork | Notes |
|------|---------|--------|-------|
| Gateway MCP tools (22 tools) | Yes | **Yes** | All tools work in both environments |
| Windsor.ai MCP (Google Ads, Meta Ads, GA4) | Yes | **Yes** | Replaces gws drive/sheets + meta_ads_insights + ga4_pull.py |
| Anthropic connectors (Notion, Slack, Gmail, Calendar) | Yes | **Yes** | Built-in to Cowork |
| `media-server` (local MCP: PIL text/logo) | Yes | **No** | Replaced by `image_add_text_overlay` + `image_add_logo` gateway tools |
| `ffmpeg` (Ken Burns video) | Yes | **No** | Terminal-only — non-Argil Reels fall back to static Story in Cowork |
