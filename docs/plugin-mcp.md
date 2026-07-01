# Plugin MCP Architecture — fiveagents-link

## Overview

Most external API calls in the `link-skills` plugin go through the **fiveagents-gateway** remote MCP server deployed on Vercel. As of gateway **v1.7.4 / v1.7.5**, two vendors — **Zernio** (social publishing + ads, formerly "Late") and **DataforSEO** (keyword research) — ship their **own** hosted MCP servers and are connected directly, no longer routed through the gateway. The retired **Argil** avatar-video integration was removed with no replacement. No `curl`, `urllib`, `gws`, or local scripts remain in any skill. The plugin is fully Cowork-compatible.

## Architecture

```
Claude (Cowork or Terminal)
  │
  │ MCP tool call
  │
  ├──→ FiveAgents Gateway (https://gateway.fiveagents.io/api/mcp)
  │      → Gemini, Postmark (email)
  │      → Image processing (Satori + sharp)
  │      → Credential vault, dashboard logging
  │
  ├──→ Zernio MCP (https://mcp.zernio.com/mcp — OAuth)
  │      → Social publishing + ads management (formerly gateway late_*)
  │
  ├──→ DataforSEO MCP (https://mcp.dataforseo.com/mcp — Basic Auth)
  │      → Keyword search volume + suggestions (formerly gateway dataforseo_*)
  │
  ├──→ Windsor.ai MCP (Anthropic-hosted connector)
  │      → Google Ads, Meta Ads, GA4
  │
  └──→ Anthropic connectors
         → Notion, Slack, Gmail, Google Calendar, Canva, …
```

## `.mcp.json`

Only the gateway is registered in the plugin's committed `.mcp.json`. Zernio, DataforSEO, Windsor.ai, and the Anthropic connectors are per-user connectors authorized in Claude settings (Settings → Connectors) during `brand-setup`, mirroring the Meta Ads custom-connector pattern.

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

## Gateway Tools

Every gateway tool requires `fiveagents_api_key: ${FIVEAGENTS_API_KEY}` (except image processing tools, which have no credentials).

| Category | Tools |
|----------|-------|
| **Gemini** | `gemini_generate_image` (default model `gemini-3.1-flash-image` — "Nano Banana 2"), `gemini_generate_text` |
| **FiveAgents** | `fiveagents_log_run`, `fiveagents_store_credential`, `fiveagents_send_email` |
| **Image processing** | `image_add_text_overlay` (Satori + Google Fonts), `image_add_logo` (sharp) |

## Standalone vendor MCPs (not gateway-routed)

| MCP | Endpoint / Auth | Tools |
|-----|-----------------|-------|
| **Zernio** *(required for publishing)* | `https://mcp.zernio.com/mcp` — OAuth | *Publishing:* `media_generate_upload_link`, `posts_create`, `posts_list`, `posts_update`, `posts_delete`, `profiles_list`, `accounts_list` · *Analytics:* `get_analytics` (per-post; pass `postId`), `get_follower_stats` · *Ads — accounts & campaigns:* `list_ad_accounts`, `list_ad_campaigns`, `update_ad_campaign`, `update_ad_campaign_status`, `bulk_update_ad_campaign_status`, `duplicate_ad_campaign`, `update_ad_set`, `update_ad_set_status` · *Ads — individual:* `create_standalone_ad`, `get_ad`, `list_ads`, `update_ad`, `delete_ad` · *Ads — analytics:* `get_ad_analytics`, `get_ads_timeline`, `get_ad_tree`, `get_ad_comments`, `list_ads_business_centers` · *Ads — audiences:* `create_ad_audience`, `list_ad_audiences`, `get_ad_audience`, `delete_ad_audience`, `add_users_to_ad_audience` · *Ads — conversions:* `create_conversion_destination`, `list_conversion_destinations`, `get_conversion_destination`, `update_conversion_destination`, `delete_conversion_destination`, `send_conversions`, `get_conversion_metrics`, `list_conversion_associations`, `add_conversion_associations`, `remove_conversion_associations` · *Ads — tracking tags:* `create_tracking_tag`, `list_tracking_tags`, `get_tracking_tag`, `update_tracking_tag`, `get_tracking_tag_stats`, `list_tracking_tag_shared_accounts`, `add_tracking_tag_shared_account`, `remove_tracking_tag_shared_account` · *Ads — targeting & other:* `search_ad_interests`, `search_ad_targeting`, `boost_post`, `create_ctwa_ad` |
| **DataforSEO** *(optional)* | `https://mcp.dataforseo.com/mcp` — Basic Auth (`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`) | `keywords_data_google_ads_search_volume`, `keywords_data_google_ads_keywords_for_keywords` (module `KEYWORDS_DATA`) |
| **Meta Ads** *(optional enhancement)* | `https://mcp.facebook.com/ads` — OAuth (limited rollout) | Direct Marketing API access; superseded by Windsor.ai for `digital-marketing-analyst` when unavailable |

Zernio/DataforSEO tool calls do **not** take `fiveagents_api_key` — they authenticate via their own connector session.

## Skills × Dependencies

| Skill | Gateway Tools | MCP Connectors |
|-------|--------------|----------------|
| `brand-setup` | `fiveagents_log_run`, `fiveagents_store_credential`, `gemini_generate_text` | Zernio (`profiles_list`, `accounts_list`, `list_ad_accounts`), DataforSEO (`keywords_data_google_ads_search_volume`), Notion, Slack, Gmail, Calendar, Windsor.ai |
| `creative-designer` | `gemini_generate_image`, `image_add_text_overlay`, `image_add_logo` | Zernio (`media_generate_upload_link`, `posts_create`) |
| `background-generator` | `gemini_generate_image`, `fiveagents_log_run` | Notion (calendar read) |
| `content-generator` | `image_add_text_overlay`, `image_add_logo`, `fiveagents_log_run` | Zernio (`media_generate_upload_link`, `posts_create`), Notion, Slack |
| `social-publisher` | `fiveagents_log_run` | Zernio (`posts_list`, `posts_update`, `posts_delete`, `posts_create`, `media_generate_upload_link`), Slack |
| `video-repurposer` | `fiveagents_log_run` | Zernio (`posts_create`, `media_generate_upload_link`) |
| `content-performance-analyst` | `fiveagents_log_run` | Zernio (`accounts_list`, `posts_list`, `get_analytics`, `get_follower_stats`), Notion, Claude in Chrome (primary) |
| `digital-marketing-analyst` | `fiveagents_log_run`, `fiveagents_send_email` | Zernio ads fallback (`get_ads_timeline`, `list_ad_campaigns`, `update_ad_campaign_status`, `bulk_update_ad_campaign_status`, `update_ad_set_status`, `update_ad_campaign`, `duplicate_ad_campaign`, `get_ad_analytics`, `get_ad_comments`, `get_ad_tree`, `list_ad_accounts`, `boost_post`, `create_ctwa_ad`, `search_ad_interests`, `search_ad_targeting`, `list_conversion_destinations`, `create_conversion_destination`, `list_tracking_tags`, `create_tracking_tag`, `get_tracking_tag_stats`, `send_conversions`), Windsor.ai, Slack |
| `data-analysis` | `fiveagents_log_run` | Zernio ads fallback (`get_ads_timeline`, `list_ad_campaigns`, `update_ad_campaign_status`, `bulk_update_ad_campaign_status`, `update_ad_set_status`, `get_ad_analytics`, `get_ad_tree`, `list_conversion_destinations`, `get_tracking_tag_stats`, `boost_post`) |
| `research-strategy` | `fiveagents_log_run` | DataforSEO (`keywords_data_google_ads_search_volume`, `keywords_data_google_ads_keywords_for_keywords`) |
| `trend-radar` | `fiveagents_log_run` | DataforSEO (opt — trending keywords), Notion, Slack, Claude in Chrome (opt) |
| `content-creation` | `fiveagents_log_run` | — |
| `social-calendar` | `fiveagents_log_run` | Notion |
| `campaign-presenter` | `fiveagents_log_run` | — |
| `commit-to-git` | `fiveagents_log_run` | — |

## Cowork Compatibility

| Skill | Cowork? | Notes |
|-------|---------|-------|
| brand-setup | **Yes** | All steps work |
| creative-designer | **Yes** | Reels fall back to Ken Burns background video / static Story (no ffmpeg; avatar video retired with Argil) |
| background-generator | **Yes** | |
| content-generator | **Yes** | Reels fall back to static Story |
| social-publisher | **Yes** | |
| video-repurposer | **Yes** | |
| digital-marketing-analyst | **Yes** | Windsor.ai + Postmark email |
| research-strategy | **Yes** | |
| content-creation | **Yes** | |
| social-calendar | **Yes** | |
| campaign-presenter | **Yes** | |
| data-analysis | **Yes** | |
| commit-to-git | **Yes** | |

## Notable removals

| Removed | Replaced by |
|---------|------------|
| Gateway `late_*` tools (v1.7.4) | **Zernio's own MCP** (`https://mcp.zernio.com/mcp`) — native tool names, OAuth |
| Gateway `dataforseo_*` tools (v1.7.5) | **DataforSEO's own MCP** (`https://mcp.dataforseo.com/mcp`) — Basic Auth |
| `argil_*` (AI avatar video, v1.7.4) | Not replaced — feature retired; avatar-video Reels no longer available |
| `LATE_API_KEY` userConfig | Zernio OAuth connector (no key) |
| `gemini-3.1-flash-image-preview` (Google 404'd all `-preview` image IDs 2026-06-25) | `gemini-3.1-flash-image` ("Nano Banana 2") |
| `scripts/add_text_overlay.py` (PIL) | Gateway `image_add_text_overlay` (Satori + Google Fonts) |
| `scripts/*_video.py` (ffmpeg) | Not replaced — Reels use static Story / Ken Burns |
| `scripts/ga4_pull.py`, `curl` to Meta Graph API | Windsor.ai MCP |

## References

- [gateway-changes-v1.7.4.json](gateway-changes-v1.7.4.json) — Zernio/Argil removal + Gemini model update
- [brand-setup/SKILL.md](../plugins/link-skills/skills/brand-setup/SKILL.md) — Onboarding flow (connector setup, credential storage)
- [agents/link.md](../plugins/link-skills/agents/link.md) — current tool inventory (source of truth)
