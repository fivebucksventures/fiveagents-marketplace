# Plugin MCP Architecture — fiveagents-link v2.0.0

## Overview

All external API calls in the `link-skills` plugin go through the **fiveagents-gateway** remote MCP server deployed on Vercel. No `curl`, `urllib`, `gws`, or local scripts remain in any skill. The plugin is fully Cowork-compatible.

## Architecture

```
Claude (Cowork or Terminal)
  │
  │ MCP tool call
  │
  ├──→ FiveAgents Gateway (https://gateway.fiveagents.io/api/mcp)
  │      → Gemini, Zernio, Argil, DataforSEO, Postmark
  │      → Image processing (Satori + sharp)
  │      → Credential vault, dashboard logging
  │
  ├──→ Windsor.ai MCP (Anthropic-hosted connector)
  │      → Google Ads, Meta Ads, GA4
  │
  └──→ Anthropic connectors
         → Notion, Slack, Gmail, Google Calendar
```

## `.mcp.json`

```json
{
  "mcpServers": {
    "gateway": {
      "type": "url",
      "url": "https://gateway.fiveagents.io/api/mcp"
    }
  }
}
```

## Gateway Tools (22 total)

| Category | Tools |
|----------|-------|
| **Gemini** | `gemini_generate_image`, `gemini_generate_text` |
| **Zernio (Late)** | `late_presign_upload`, `late_upload_media`, `late_create_post`, `late_list_posts`, `late_update_post`, `late_delete_post` |
| **Argil** | `argil_create_video`, `argil_render_video`, `argil_get_video`, `argil_list_avatars`, `argil_list_voices` |
| **DataforSEO** | `dataforseo_search_volume`, `dataforseo_keyword_suggestions` |
| **Meta Ads** | `meta_ads_insights` (available but superseded by Windsor.ai for digital-marketing-analyst) |
| **FiveAgents** | `fiveagents_log_run`, `fiveagents_store_credential`, `fiveagents_send_email` |
| **Image processing** | `image_add_text_overlay` (Satori + Google Fonts), `image_add_logo` (sharp) |

Every tool requires `fiveagents_api_key: ${FIVEAGENTS_API_KEY}` (except image processing tools which have no credentials).

## Skills × Dependencies

| Skill | Gateway Tools | MCP Connectors |
|-------|--------------|----------------|
| `brand-setup` | `fiveagents_log_run`, `fiveagents_store_credential`, `gemini_generate_text`, `late_list_posts`, `argil_list_avatars` | Notion, Slack, Gmail, Calendar, Windsor.ai |
| `creative-designer` | `gemini_generate_image`, `image_add_text_overlay`, `image_add_logo`, `late_presign_upload`, `late_upload_media`, `argil_*` | — |
| `background-generator` | `gemini_generate_image`, `fiveagents_log_run` | Notion (calendar read) |
| `content-generator` | `image_add_text_overlay`, `image_add_logo`, `late_*`, `argil_*`, `fiveagents_log_run` | Notion, Slack |
| `social-publisher` | `late_list_posts`, `late_update_post`, `late_delete_post`, `fiveagents_log_run` | Slack |
| `digital-marketing-analyst` | `fiveagents_log_run`, `fiveagents_send_email` | Windsor.ai, Slack |
| `research-strategy` | `dataforseo_search_volume`, `dataforseo_keyword_suggestions`, `fiveagents_log_run` | — |
| `content-creation` | `fiveagents_log_run` | — |
| `social-calendar` | `fiveagents_log_run` | Notion |
| `campaign-presenter` | `fiveagents_log_run` | — |
| `data-analysis` | `fiveagents_log_run` | — |
| `commit-to-git` | `fiveagents_log_run` | — |

## Cowork Compatibility

| Skill | Cowork? | Notes |
|-------|---------|-------|
| brand-setup | **Yes** | All steps work |
| creative-designer | **Yes** | Non-Argil Reels fall back to static Story (no ffmpeg) |
| background-generator | **Yes** | |
| content-generator | **Yes** | Non-Argil Reels fall back to static Story |
| social-publisher | **Yes** | |
| digital-marketing-analyst | **Yes** | Windsor.ai + Postmark email |
| research-strategy | **Yes** | |
| content-creation | **Yes** | |
| social-calendar | **Yes** | |
| campaign-presenter | **Yes** | |
| data-analysis | **Yes** | |
| commit-to-git | **Yes** | |

## What Was Removed in v2.0.0

| Removed | Replaced by |
|---------|------------|
| `scripts/add_text_overlay.py` (PIL) | Gateway `image_add_text_overlay` (Satori + Google Fonts) |
| `scripts/add_logo.py` (PIL) | Gateway `image_add_logo` (sharp) |
| `scripts/add_text_overlay_video.py` (ffmpeg) | Not replaced — non-Argil Reels use static Story |
| `scripts/generate_text_video.py` (ffmpeg) | Not replaced |
| `scripts/ga4_pull.py` | Windsor.ai MCP |
| `servers/media-server/` (local MCP) | Gateway image tools |
| `gws` CLI (Drive, Sheets, Gmail) | Windsor.ai MCP + `fiveagents_send_email` |
| `curl` to Meta Graph API | Windsor.ai MCP |
| `curl` to fiveagents.io/api/agent-runs | Gateway `fiveagents_log_run` |
| `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID` userConfig | Windsor.ai MCP connector |
| `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH` userConfig | Windsor.ai MCP connector |
| `NOTION_API_KEY` userConfig | Notion MCP connector |

## References

- [fiveagents/docs/mcp.md](../../fiveagents/docs/mcp.md) — Master MCP plan (credential storage, gateway architecture)
- [fiveagents-gateway/docs/gw-mcp.md](../../fiveagents-gateway/docs/gw-mcp.md) — Gateway implementation details
- [brand-setup/SKILL.md](../plugins/link-skills/skills/brand-setup/SKILL.md) — Onboarding flow (connector setup, credential storage)
