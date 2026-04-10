// Version information (production)
const DEFAULT_VERSION = 'v2.1.2';
const DEFAULT_DATE = 'April 10, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
  {
    version: 'v2.1.2',
    date: 'April 10, 2026',
    changes: [
      'brand-setup: Claude in Chrome traverses homepage + all 1st-level navbar pages',
      'brand-setup: auto-detects primary/secondary colors and Google Fonts from computed styles',
      'brand-setup: Step 5 runs /research-strategy to fill product.md and competitors.md',
      'brand-setup: Step 6 is logo-only (fonts no longer asked separately)',
      'brand-setup: prerequisites no longer asks for colors/fonts (auto-detected in Step 4)',
      'brand-setup: fixed sub-step labels 7a/7b/7c and 8a/8b/8c',
      'brand-setup: removed fonts/ from folder structure (Google Fonts replaces local .ttf)',
    ],
  },
  {
    version: 'v2.1.1',
    date: 'April 10, 2026',
    changes: [
      'brand-setup: added Step 1 Cowork Setup (capabilities, Claude in Chrome, connectors)',
      'brand-setup: website analysis uses Claude in Chrome instead of WebFetch',
      'brand-setup: renumbered all steps (1-9), fixed cross-references',
      'brand-setup: fonts changed from .ttf to Google Fonts in prerequisites',
    ],
  },
  {
    version: 'v2.1.0',
    date: 'April 10, 2026',
    changes: [
      'brand-setup: Five Agents connector setup, GA4 key event discovery, Canva MCP, funnel.md with event mapping',
      'brand-setup: full validation suite — 15 tests including vault, email, text overlay, logo overlay',
      'digital-marketing-analyst: Windsor.ai MCP, Meta Ads GA4 funnel, Postmark email, data source footer',
      'content-generator: Gemini fallback for missing backgrounds, updated asset type table',
      'social-calendar: research-driven content mix via /research-strategy, trending topic discovery',
      'campaign-presenter: Canva MCP for presentation generation (replaces markdown slides)',
      'data-analysis: Windsor.ai data pull, funnel.md benchmarks, consistent with digital-marketing-analyst',
    ],
  },
  {
    version: 'v2.0.1',
    date: 'April 10, 2026',
    changes: [
      'Rewrote docs/plugin-mcp.md — clean v2.0.0 summary (removed stale migration plan)',
    ],
  },
  {
    version: 'v2.0.0',
    date: 'April 10, 2026',
    changes: [
      'MCP gateway migration — all external API calls now go through fiveagents-gateway (Vercel)',
      'Removed all curl, urllib, gws CLI, and ga4_pull.py from skills',
      'Removed media-server local MCP, PIL scripts, and ffmpeg dependencies',
      'Added gateway tools: gemini_generate_image, gemini_generate_text, late_*, argil_*, dataforseo_*, meta_ads_insights',
      'Added gateway tools: fiveagents_log_run, fiveagents_store_credential, fiveagents_send_email',
      'Added gateway tools: image_add_text_overlay (Satori + Google Fonts), image_add_logo (sharp)',
      'brand-setup: added FiveAgents gateway connector setup, Windsor.ai MCP, credential vault storage',
      'brand-setup: Google Fonts support (replaces .ttf files), logo paste in chat',
      'digital-marketing-analyst: migrated to Windsor.ai MCP (Google Ads, Meta Ads, GA4)',
      'digital-marketing-analyst: email briefs via fiveagents_send_email (Postmark)',
      'All skills now Cowork-compatible (except Ken Burns video — ffmpeg removed)',
      'Late rebranded to Zernio (user-facing only, tool names unchanged)',
      'Removed userConfig: meta_ads_token, meta_ad_account_id, ga4_property_id, ga4_sa_key_path, notion_api_key',
      '.mcp.json: gateway-only (media-server removed)',
    ],
  },
  {
    version: 'v1.0.2',
    date: 'April 8, 2026',
    changes: [
      'brand-setup: updated FIVEAGENTS_API_KEY instructions — clients get key from their own dashboard instead of admin',
    ],
  },
  {
    version: 'v1.0.1',
    date: 'April 8, 2026',
    changes: [
      'brand-setup: added Step 1 prerequisites overview (API keys, MCP connections, brand assets)',
      'brand-setup: replaced "scrape" with "analyze" throughout',
      'brand-setup: ask for HEX codes instead of color names',
      'brand-setup: no suggested brand names — free-text input only',
      'brand-setup: Meta Ads, GA4, DataforSEO moved to standard onboarding',
      'brand-setup: Notion, Slack, Gmail, Google Calendar MCP moved to standard onboarding',
      'Added versions/version.ts and workflow/commit-to-git.md',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'April 8, 2026',
    changes: [
      'Initial marketplace release — link-skills plugin v1.0.0',
      'brand-setup: guided onboarding skill with website analysis, brand context generation',
      'brand-setup: standard onboarding for Meta Ads, GA4, DataforSEO, MCP connections',
      'brand-setup: HEX code color input, no suggested brand names',
      '14 skills: brand-setup, background-generator, campaign-presenter, commit-to-git, content-creation, content-generator, creative-designer, data-analysis, digital-marketing-analyst, research-strategy, social-calendar, social-publisher',
      'Workflow: commit-to-git versioning workflow',
      'Scripts: add_logo, add_text_overlay, add_text_overlay_video, ga4_pull, generate_text_video',
      'Servers: media-server MCP',
    ],
  },
];
