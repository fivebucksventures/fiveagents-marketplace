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

## Gateway Tools (57 total)

| Category | Tools |
|----------|-------|
| **Gemini** | `gemini_generate_image`, `gemini_generate_text` |
| **Zernio — Publishing** | `late_presign_upload`, `late_upload_media`, `late_create_post`, `late_list_posts`, `late_update_post`, `late_delete_post`, `late_list_profiles`, `late_list_accounts` |
| **Zernio — Ads: accounts & campaigns** | `late_list_ad_accounts`, `late_list_ad_campaigns`, `late_update_ad_campaign`, `late_update_ad_campaign_status`, `late_bulk_update_ad_campaign_status`, `late_duplicate_ad_campaign`, `late_update_ad_set`, `late_update_ad_set_status` |
| **Zernio — Ads: individual ads** | `late_create_ad`, `late_get_ad`, `late_list_ads`, `late_update_ad`, `late_delete_ad` |
| **Zernio — Ads: analytics** | `late_get_ad_analytics`, `late_get_ads_timeline`, `late_get_ad_tree`, `late_get_ad_comments`, `late_list_tiktok_business_centers` |
| **Zernio — Ads: audiences** | `late_create_ad_audience`, `late_list_ad_audiences`, `late_get_ad_audience`, `late_delete_ad_audience`, `late_add_users_to_ad_audience` |
| **Zernio — Ads: conversions** | `late_create_conversion_destination`, `late_list_conversion_destinations`, `late_get_conversion_destination`, `late_update_conversion_destination`, `late_delete_conversion_destination`, `late_send_conversions`, `late_get_conversion_metrics`, `late_list_conversion_associations`, `late_add_conversion_associations`, `late_remove_conversion_associations` |
| **Zernio — Ads: tracking tags** | `late_create_tracking_tag`, `late_list_tracking_tags`, `late_get_tracking_tag`, `late_update_tracking_tag`, `late_delete_tracking_tag`, `late_get_tracking_tag_stats`, `late_list_tracking_tag_shared_accounts`, `late_add_tracking_tag_shared_account`, `late_remove_tracking_tag_shared_account` |
| **Zernio — Ads: targeting & other** | `late_search_ad_interests`, `late_search_ad_targeting_locations`, `late_boost_post`, `late_create_ctwa_ad` |
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
| `digital-marketing-analyst` | `fiveagents_log_run`, `fiveagents_send_email`, `late_get_ads_timeline` (opt fallback), `late_list_ad_campaigns` (opt fallback), `late_update_ad_campaign_status`, `late_bulk_update_ad_campaign_status`, `late_update_ad_set_status`, `late_update_ad_campaign`, `late_duplicate_ad_campaign`, `late_get_ad_analytics`, `late_get_ad_comments`, `late_list_ad_accounts`, `late_boost_post`, `late_create_ctwa_ad`, `late_search_ad_interests`, `late_search_ad_targeting_locations`, `late_list_conversion_destinations`, `late_create_conversion_destination`, `late_list_tracking_tags`, `late_create_tracking_tag`, `late_get_tracking_tag_stats`, `late_send_conversions` | Windsor.ai, Slack |
| `research-strategy` | `dataforseo_search_volume`, `dataforseo_keyword_suggestions`, `fiveagents_log_run` | — |
| `content-creation` | `fiveagents_log_run` | — |
| `social-calendar` | `fiveagents_log_run` | Notion |
| `campaign-presenter` | `fiveagents_log_run` | — |
| `data-analysis` | `fiveagents_log_run`, `late_get_ads_timeline` (opt fallback), `late_list_ad_campaigns` (opt fallback), `late_update_ad_campaign_status` (opt), `late_bulk_update_ad_campaign_status` (opt), `late_update_ad_set_status` (opt), `late_get_ad_analytics` (opt), `late_list_conversion_destinations` (opt), `late_get_tracking_tag_stats` (opt), `late_boost_post` (opt) | — |
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
| `gws` CLI (Drive, Sheets, Gmail) | Windsor.ai MCP + `fiveagents_send_email` (Postmark, fallback: `gmail_create_draft`) |
| `curl` to Meta Graph API | Windsor.ai MCP |
| `curl` to fiveagents.io/api/agent-runs | Gateway `fiveagents_log_run` |
| `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID` userConfig | Windsor.ai MCP connector |
| `GA4_PROPERTY_ID`, `GA4_SA_KEY_PATH` userConfig | Windsor.ai MCP connector |
| `NOTION_API_KEY` userConfig | Notion MCP connector |

## References

- [fiveagents/docs/mcp.md](../../fiveagents/docs/mcp.md) — Master MCP plan (credential storage, gateway architecture)
- [fiveagents-gateway/docs/gw-mcp.md](../../fiveagents-gateway/docs/gw-mcp.md) — Gateway implementation details
- [brand-setup/SKILL.md](../plugins/link-skills/skills/brand-setup/SKILL.md) — Onboarding flow (connector setup, credential storage)
