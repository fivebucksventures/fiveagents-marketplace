// Version information (production)
const DEFAULT_VERSION = 'v1.0.1';
const DEFAULT_DATE = 'April 8, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
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
