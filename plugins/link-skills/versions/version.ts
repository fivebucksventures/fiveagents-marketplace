// Version information (production)
const DEFAULT_VERSION = 'v2.20.3';
const DEFAULT_DATE = 'August 15, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
  {
    version: 'v2.20.3',
    date: 'August 15, 2026',
    changes: [
      'agents/link.md: corrected fb.ai quota guidance to name the four real paid buckets, mark `traffic_monitor` as free, and compute remaining quota from `quota.quotas.<bucket>` — prevents agents from mispricing batches against a nonexistent `quota.remaining` field.',
      'seo-researcher: split quota accounting by bucket, added optional real competitor discovery via `fivebucks_find_competitors`, and forbade invented competitor URLs or word-count benchmarks from SERP analysis — keeps reports aligned with what fb.ai actually returns.',
      'skills registry CI: added a vendored `fivebucks-tools.json` inventory plus `check_fivebucks_tools.py` and wired it into GitHub Actions — catches SKILL.md references to gateway tools that do not exist before release.',
    ],
  },
  {
    version: 'v2.20.2',
    date: 'August 05, 2026',
    changes: [
      'plugin.json: `agents` field changed from a bare directory string ("./agents/") to the required array-of-paths form (["./agents/link.md"]) — claude plugin validate . was rejecting the string form.',
      'plugin.json: all nine userConfig entries (fiveagents_api_key, default_brand, slack_notify_user, report_email, late_api_key, gemini_api_key, fivebucks_api_key, dataforseo_login, dataforseo_password) now declare the required `type` and `title` fields; fiveagents_api_key also gains `required: true` since every gateway tool call needs it.',
      '.mcp.json: gateway server transport `type` changed from the non-standard "url" to "http" to match the current MCP transport schema.',
    ],
  },
  {
    version: 'v2.20.1',
    date: 'July 13, 2026',
    changes: [
      'agents/link.md: corrected the fb.ai tool count (98 → 100) and the SEO research + lead-import contracts that were wrong in v2.20.0 — fivebucks_research_topic yields keyword clusters, not serpSourceIds directly, and fivebucks_search_leads_status results are not in the CRM until imported.',
      'seo-researcher: added the missing "Research Top Rankings" step — fivebucks_research_topic only produces clusters; the new free Step 4 calls fivebucks_research_top_rankings to turn approved clusters into serpSourceIds. Steps renumbered 4–7 → 5–8.',
      'lead-crm-manager: added the missing "import to CRM" step — fivebucks_search_leads_status results are not in the CRM until fivebucks_import_search_results is called. Corrected the masked-email signal (empty/null email field, not a literal ***) and the whoami quota field.',
      'article-publisher: corrected the whoami quota field (quota.quotas.content_generation, not quota.remaining) and the contentId field name (fivebucks_list_content returns id). Added a use-existing-first check before generating.',
      'campaign-runner: corrected the whoami quota field (quota.quotas.automatic_posting, not quota.remaining).',
      'leadgen-onboarder: corrected the DNS record count — fivebucks_add_domain returns three records (DKIM, Return-Path, DMARC), not two.',
      'site-auditor: added the missing GSC + CMS prerequisite check before Step 3 (previously failed with a 409 mid-run); removed the unnecessary selectedCMSIntegrationId/gscIntegrationId params (fb.ai auto-resolves them); corrected the whoami quota field.',
      'plugin-update: corrected the fb.ai tool count referenced in the key-scope check messaging (98 → 100).',
    ],
  },
  {
    version: 'v2.20.0',
    date: 'July 12, 2026',
    changes: [
      'fb.ai grew from 13 tools to 98 and its API key is now project-scoped across 10 capabilities, enforced server-side (gateway v1.8.0). The same FIVEBUCKS_API_KEY that used to mean "social templates" now drives the brand\'s whole content + traffic + lead-gen stack. agents/link.md gains a new "fb.ai API key — scopes, errors, quota" section: always call fivebucks_whoami first to learn the bound project, granted scopes, and remaining quota; never retry on auth/insufficient-scope (regenerate the key with the scope ticked), auth/key-expired, or quota/* (relay the numbers + upgrade path). Every action\'s quota cost is documented — articles 1.0 each, enrichment 0.075/lead, campaign sends 0.01/email — so batches get priced with the user before they run.',
      'seo-researcher v2.20.0 (NEW, Marketing): topic research → keyword-cluster SERP analysis → scheduled content plan. First skill to drive fb.ai\'s seo_research + content scopes.',
      'article-publisher v2.20.0 (NEW, Marketing): content briefs → generated articles → optional human approval → published to a connected CMS or social platform. Also owns the publishing calendar and fb.ai\'s daily autopilot — these were originally slated for the four social skills, but fivebucks_publish_content resolves contentId against the content table (articles) while fb.ai social posts live in a disjoint social_posts table, so those tools would have 404\'d there. Autopilot is opt-in only: the skill reports automation state but never enables it unasked, and recommends workflowStatusRequired: true so a human still approves before anything goes live.',
      'site-auditor v2.20.0 (NEW, Marketing): discovers real competitors, then runs a benchmarked SEO audit and reports issues with fixes. Drives the site_audit scope.',
      'traffic-reporter v2.20.0 (NEW, Marketing): Search Console + AI-engine/GEO visibility trends. Drives the traffic_monitor scope — every tool it uses is free.',
      'leadgen-onboarder v2.20.0 (NEW, Sales): sending domain + confirmed sender signature, so cold-email campaigns can send at all. Built around the two unavoidable human waits — publish the DNS records, click Postmark\'s confirmation email — at which it stops and hands back rather than polling. Drives leadgen_setup; all its tools are free.',
      'lead-crm-manager v2.20.0 (NEW, Sales): find → import → enrich leads in fb.ai\'s own CRM, then build the lists/segments a campaign targets. Enrichment (0.075/lead) is not optional — unenriched leads are silently dropped by a send. Drives leadgen_crm.',
      'campaign-runner v2.20.0 (NEW, Sales): builds the cold-email workflow, verifies four send gates, sends, and reports. Must poll — an empty sequence returns 200 and then fails as a job. Drives leadgen_campaigns (+ leadgen_crm for the recipient-count pre-flight).',
      'Routing rule for the two cold-email stacks added to link.md Skill Chains, and to the "Do NOT use this skill for:" blocks of apollo-lead-prospector and outreach-sequencer. The Gmail stack (apollo-lead-prospector → outreach-sequencer) and the fb.ai stack (leadgen-onboarder → lead-crm-manager → campaign-runner) share no infrastructure and their CRMs are disjoint — data does not transfer, so prospecting into the wrong one leaves the campaign with no leads. Choose by volume and sending identity.',
      'brand-setup v2.20.0: repointed all 5 key-generation links to the new API Keys page (/dashboard/api-keys; the old /dashboard/social-posts/api-keys still 308-redirects) and added a scope-checkbox walkthrough at the point of generation — all 10 boxes ticked by default, social_posts the minimum for every skill shipping today, unticking a box makes those tools return auth/insufficient-scope. Documents the new 90-day key expiry.',
      'plugin-update v2.20.0: fb.ai key scope check for existing brands via a fivebucks_whoami probe. Pre-scoping keys are legacy full-access and keep working (empty scopes — no action needed), but a regenerated key missing social_posts silently breaks the fb.ai-dependent skills. Reports granted scopes + quota snapshot and surfaces auth/key-expired.',
      'background-generator, campaign-presenter, content-creation, content-generator, creative-designer, financial-reporter, investor-update-writer, proposal-generator, social-calendar, social-publisher v2.20.0: each now declares fivebucks in deps.gateway along with the scope it needs (social_posts), so brand-setup can tell users which capability boxes to tick. No behaviour change.',
      'link.md trimmed: the change log moved out to plugins/link-skills/CHANGELOG.md (link.md is embedded wholesale into every brand\'s CLAUDE.md, so release history was pure context cost), the "fb.ai is more than templates" framing and the "call fivebucks_whoami first" instruction were each de-duplicated (stated in three and two places respectively), and Agent Run Logging was promoted out of the fb.ai section where it had been nested as if it were an fb.ai concern.',
    ],
  },
  {
    version: 'v2.19.0',
    date: 'July 03, 2026',
    changes: [
      'Zernio migration fix (v2.18.0 was validated against prose, not the live schema): the v2.18.0 assumption that Zernio "drops the late_ prefix" and renames date params to date_from/date_to was WRONG. Corrected against the live Zernio MCP schema across social-publisher, content-generator, creative-designer, video-repurposer, content-performance-analyst, data-analysis, digital-marketing-analyst, and agents/link.md. (1) Tool names are resource-prefixed: analytics_get_analytics, accounts_get_follower_stats, ad_campaigns_{get_ads_timeline,get_ad_tree,list_ad_campaigns,update_ad_campaign,update_ad_campaign_status,bulk_update_ad_campaign_status,duplicate_ad_campaign,update_ad_set_status}, ads_{get_ad_analytics,get_ad_comments,list_ad_accounts,search_ad_interests,search_ad_targeting,boost_post,create_ctwa_ad}. (2) Date params are from_date/to_date (NOT date_from/date_to — the wrong names silently returned empty). ads_get_ad_analytics requires ad_id.',
      'Publishing/media fix: media_generate_upload_link is a BROWSER-only upload flow (returns a human upload-page URL) — PUTting to it silently fails. Programmatic uploads of local files now use media_get_media_presigned_url(filename, content_type, size); fb.ai fivebucks_render_post signed URLs are passed DIRECTLY as media_urls (no re-host — the publisher fetches/caches at post-creation time). validate_media before publish; curl local backup after render. posts_create real signature: content + platform (single string) + account_id + media_urls (comma-separated string) + publish_now/is_draft/schedule_minutes — one call per platform (no platforms[] array, no platformSpecificData.contentType, so Story/Reel content-typing is not expressible). posts_update accepts only content/scheduled_for/title. creative-designer bg_image/image-slot values must be "media:{fileId}"; media-folder name-mismatch warning added to content-generator.',
    ],
  },
  {
    version: 'v2.18.0',
    date: 'July 01, 2026',
    changes: [
      'Zernio migration (gateway v1.7.4): the gateway removed all late_* tools — Zernio (formerly Late) now ships its own hosted MCP (https://mcp.zernio.com/mcp, OAuth). Every late_* call across brand-setup, social-publisher, content-generator, creative-designer, video-repurposer, content-performance-analyst, digital-marketing-analyst, and data-analysis was repointed to Zernio native tool names (posts_create/posts_list/posts_update/posts_delete/profiles_list/accounts_list/media_generate_upload_link; ads = late_ minus prefix, with late_search_ad_targeting_locations → search_ad_targeting and late_get_post_analytics → get_analytics); the fiveagents_api_key param was dropped from those calls; all ${BRAND}_LATE_* env vars renamed to ${BRAND}_ZERNIO_* and LATE_API_KEY removed (Zernio is OAuth). Skill deps moved Zernio from gateway to mcp.',
      'DataforSEO migration (gateway v1.7.5): the gateway removed dataforseo_* tools — DataforSEO now ships its own MCP (https://mcp.dataforseo.com/mcp, Basic Auth). research-strategy and trend-radar repointed dataforseo_search_volume → keywords_data_google_ads_search_volume and dataforseo_keyword_suggestions → keywords_data_google_ads_keywords_for_keywords; dep moved gateway → mcp; DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD kept (now feed the connector).',
      'brand-setup: registered Zernio (required, row 2) and DataforSEO (optional, row 7) as their own custom MCP connectors (new Step 7a-ii OAuth / Step 7a-iii Basic Auth); rewrote account discovery + Step 8 validation to the native tool names; renamed the 10 ${BRAND}_ZERNIO_* env vars throughout; removed LATE_API_KEY from key tables, save-list, and gateway vault.',
      'plugin-update: migration for existing brands — Step 1e Zernio/DataforSEO connector probes, Step 3f ${BRAND}_LATE_* → ${BRAND}_ZERNIO_* rename + LATE_API_KEY deletion + native tool names, Step 3g Zernio (required, OAuth) + DataforSEO (optional, Basic Auth) walkthroughs, Step 3k brand-action row (reconnect + re-run account discovery since Zernio-side account _ids may differ from the old gateway-proxied API).',
      'Argil (AI avatar video) retired with no replacement (gateway v1.7.4): removed the last live references in content-creation (Video Ad Scripts subsection + avatars.md pointer) and creative-designer/style-guide.md (Reel-via-Argil → Ken Burns only). Capability gap flagged.',
      'gemini_generate_image model IDs updated (gateway v1.7.4): Google retired all -preview image IDs on 2026-06-25; hardcoded gemini-3.1-flash-image-preview replaced with the GA default gemini-3.1-flash-image ("Nano Banana 2") in creative-designer, background-generator, and content-generator.',
      'link.md + docs: Zernio and DataforSEO moved from "External APIs (via gateway)" to the MCP Connectors section with native tool names; plugin-mcp.md architecture + tool tables refreshed; content-engine.md annotated. Fixed pre-existing brand-setup Calendly consumer (meeting-analyzer → outreach-sequencer).',
    ],
  },
  {
    version: 'v2.17.0',
    date: 'June 21, 2026',
    changes: [
      'Inbound Gig Engine completed — three new Sales skills turn an open freelance job into a submission-ready bid, all sharing one ${BRAND}_GIGS_DB row threaded by Status (New → Reviewing → Drafted → Workflow Built → Demo Ready → Ready to Submit).',
      'gig-proposal-writer v2.17.0 (NEW, Sales): the Write phase. Takes one reviewed gig, maps it to a service the brand actually sells (from product.md), detects any client-required secret word and makes it the literal first line, and drafts a tailored cover letter + 60-second VSL script in brand voice. Writes both back onto the gig row as page-body blocks, advances Status to Drafted, and ends the letter with a tool-agnostic [DEMO VIDEO LINK] placeholder. Distinct from proposal-generator (CRM deals — Gamma deck + Stripe link).',
      'n8n-workflow-builder v2.17.0 (NEW, Sales): the Prove phase. Builds a real, validated, published n8n workflow that demonstrates the gig solution via the n8n Cloud MCP SDK flow (get_sdk_reference → get_workflow_best_practices → search_nodes → get_node_types → validate_node_config → validate_workflow → create_workflow_from_code → publish_workflow) — never guessed JSON or the legacy REST script. Brand design rules: start with a trigger, 3–6 node linear chain, client-language labels, visible outcome. Writes the live workflow URL + ID onto the gig row; Status="Workflow Built". Supersedes the legacy create_n8n_workflow.py REST path.',
      'vsl-demo-producer v2.17.0 (NEW, Sales): the Demo phase. Screenshots the published workflow via Claude in Chrome and turns the 60s VSL into a shot-by-shot recording script pairing each narration beat with the on-screen action. The founder records the video themselves in any recorder (Loom/Tella/Vidyard/ScreenStudio/QuickTime — never hardcoded); capture mode then writes Demo Video URL, fills the [DEMO VIDEO LINK] placeholder, and sets Status="Ready to Submit". No avatar/auto-render — recording stays manual by design.',
      'gig-prospector v2.17.0: now the Discover phase of the full engine — forward-references corrected to gig-proposal-writer (not proposal-generator), and the ${BRAND}_GIGS_DB bootstrap now seeds the full pipeline Status set. Discovery logic unchanged.',
      'brand-setup v2.17.0: registered n8n Cloud as an optional business-ops MCP (Step 2 row 15 + Step 7c) used by n8n-workflow-builder; added the optional ${BRAND}_N8N_PROJECT env var (Step 7b); backfilled the ${BRAND}_GIGS_DB row into the auto-bootstrapped Notion DB table.',
      'plugin-update v2.17.0: migration support for the three new Sales skills — Step 1e n8n Cloud MCP probe (optional), Step 3g connect-walkthrough, Step 3k changelog → brand-action row (connect n8n Cloud + optional ${BRAND}_N8N_PROJECT). Skills auto-detected from skills-manifest.json.',
      'link.md v2.17.0: added the Inbound Gig Engine — 4 Phases table; replaced the thin inbound-gigs chain with the full four-skill chain; n8n Cloud MCP added to the MCP Connectors list. Domain map regenerated (31 skills, Sales now 7).',
    ],
  },
  {
    version: 'v2.16.0',
    date: 'June 20, 2026',
    changes: [
      'gig-prospector v2.16.0 (NEW, Sales): the inbound counterpart to apollo-lead-prospector — instead of sourcing people to email, it scans freelance marketplaces (Upwork, Freelancer.com, Projects.co.id, Sribu, Fastwork, Freelancing.my, PeoplePerHour, Jobbers.io, Airtasker) across the brand\'s chosen markets (Singapore/Indonesia/Malaysia/Thailand/Australia/Global-Remote) via Claude in Chrome, with the Freelancer.com API as a deterministic source when FREELANCER_OAUTH_TOKEN is set. Search terms are derived from product.md (what the brand sells) — never hardcoded. Scores each job for service fit (45/20/20/15), dedupes against ${BRAND}_GIGS_DB by Job UID/URL, and drops matches as Status="New" for proposal-generator. Degrades to API + web research when Chrome MCP is absent.',
      'brand-setup v2.16.0: new Step 5g Step H — Inbound Job Filters. Captures Markets, Platforms (each tagged have-account / no-account), Search Keywords (drafted from product.md, never hardcoded), and Budget Floor / Exclusions / Daily Cap; writes a ## Inbound Job Filters section to the sales.md template. Pre-fill mapping gains product.md → Step H (keywords) and brand.md → Step H (markets) rows. Skippable for brands that don\'t pursue marketplace work.',
      'plugin-update v2.16.0: migration support for gig-prospector — ${BRAND}_GIGS_DB added to the Step 1d auto-bootstrap inventory (9 → 10), Step 1a sales.md ## Inbound Job Filters schema check + Step 3a optional backfill (runs brand-setup Step 5g Step H), and a Step 3k changelog → brand-action row. The skill itself is auto-detected from the shipped skills-manifest.json.',
      'link.md v2.16.0: registered gig-prospector (Sales); added the Inbound gigs skill chain (gig-prospector → proposal-generator) and relabelled the outbound chain; gig-prospector added as a Claude in Chrome consumer in the MCP Connectors list; domain map regenerated (28 skills, Sales now 4).',
    ],
  },
  {
    version: 'v2.15.0',
    date: 'June 09, 2026',
    changes: [
      'trend-radar v2.15.0: Competitor video structure analysis added (Step 2c) — for competitor-remix candidates with YouTube source URLs, Claude in Chrome visits the video, opens the transcript, and extracts a 6-part video_structure anatomy (credibility hook, pattern interruptor, framework/mental model, build-with-escalation, reflection beat, close/CTA). The video_structure JSON is stored on the ${BRAND}_TREND_DB entry (Notion page body, json code fence under "Video Structure Analysis") and saved locally to outputs/{brand}/strategy/VideoStructure_*.json. Degrades gracefully when Chrome MCP is unavailable (text-only metadata preserved). Frontmatter deps + allowed-tools add Claude in Chrome (opt).',
      'social-calendar v2.15.0: Competitor video structure matching added (Step 2a Part 1b) — YouTube-First Mode reads the video_structure JSON from trend_db and maps each structural element to the brand\'s own credibility angle, writing a Video Structure table to the calendar. Clips gain a Source Section column tracing each clip to a video section (1–6 or escalation step), preventing topic-mismatch bugs. Degrades gracefully when no video structure is available.',
      'content-creation v2.10.0: Video structure script support added (Step 2b) — when writing YouTube video scripts, reads the Video Structure table from the social calendar (sourced from trend-radar Step 2c) and turns each structural section into a script segment with technique-specific writing guidance. When present, the video structure overrides the generic AIDA/PAS/BAB framework. Falls back to generic frameworks when no video structure is available.',
      'content-performance-analyst v1.0.4: frontmatter deps corrected — Claude in Chrome added to deps.mcp (opt); it has been the primary engagement-metrics source since v1.0.2 but was never declared, so the generated manifest/SKILLS.md omitted it.',
      'link.md v2.15.0: Content Engine — 5 Phases table updated (Phase 2 Step 2c competitor video analysis via Claude in Chrome; Phase 3 Step 2a Part 1b video-structure application; Phase 4 Step 2b script-skeleton note); trend-radar deps note Claude in Chrome (opt); Claude in Chrome MCP added to the MCP Connectors list (already used by content-performance-analyst, previously undocumented).',
    ],
  },
  {
    version: 'v2.14.5',
    date: 'June 09, 2026',
    changes: [
      'trend-radar v2.14.1: Step 2b Competitor Remix added — reads top 3 posts per competitor from ${BRAND}_PERFORMANCE_DB (sorted by Engagement Rate; recency fallback), generates brand\'s adapted take for each, and writes them as Type="competitor-remix" candidates to ${BRAND}_TREND_DB. Step 3 competitor-differentiation drop rule skipped for remix candidates. TREND_DB schema gains Type select (trend / competitor-remix). ${BRAND}_PERFORMANCE_DB added as read-only env dep.',
      'content-performance-analyst v1.0.3: Step 3 completeness enforced — all competitors in competitors.md must be processed; partial runs must be flagged. ${BRAND}_PERFORMANCE_DB competitor coverage is a hard dependency for trend-radar Step 2b.',
    ],
  },
  {
    version: 'v2.14.4',
    date: 'June 09, 2026',
    changes: [
      'content-performance-analyst v1.0.2: primary engagement source for all rows (own posts + competitors) switched to Claude in Chrome (computer use, user\'s authenticated Chrome — bypasses login walls on social analytics UIs); Zernio retained as fallback for own posts; web-research retained as fallback for competitors. Platform list now driven by late_list_accounts — no hardcoded platform options. DB schema aligned to actual Notion columns: Format adds Reel/Video; Source adds "chrome-browser"; "Impressions" renamed "Impressions / Views"; "Engagement Rate" number field added.',
    ],
  },
  {
    version: 'v2.14.3',
    date: 'June 08, 2026',
    changes: [
      'content-performance-analyst v1.0.1: Step 0 pre-flight switched to late_get_post_analytics (Zernio Analytics add-on) as primary engagement source; 402/403 analytics_addon_required error triggers graceful fallback to late_list_posts + competitor benchmarking — run never blocks. Optional late_get_follower_stats added for per-account follower/growth context (reach denominator). Step 2.3 field mapping made explicit (impressions/likes/comments/shares/saves/engagementRate). Frontmatter deps gateway updated to name Zernio Analytics add-on as a distinct entry.',
      'link.md v2.14.3: Zernio API section expanded with Analytics add-on sub-bullet (late_get_post_analytics / late_get_follower_stats, requires upgrade) — documents the new tools used by content-performance-analyst.',
    ],
  },
  {
    version: 'v2.14.2',
    date: 'June 08, 2026',
    changes: [
      'content-generator v2.12.2: stale _raw.png reference removed from Step 4g and Quality Checklist (filename never created; only _with_text.png is a real intermediate); TOOLS.md dead reference removed from Step 5; Step 6 old_str now matches "Processing" not "Planned" (Fix 2 writes Processing before late_create_post — old match caused Step 6 to silently no-op); §7 carousel reference to "(Step 5)" removed (template-path does not proceed to image-path Step 5); LATE_CONTENT_TYPE dict now has "reel" key; Step 4c routing table and decision logic add explicit Reel row (always image-path, contentType: reel); add_text_overlay comment corrected from ratio ≥ 1.78 to 1.7.',
      'creative-designer v2.12.2: add_text_overlay comment corrected from ratio ≥ 1.78 to 1.7; rate limit rule now includes late_create_post after the Zernio upload (upload alone does not publish); Step 4 upload code corrected from final_image.png to _final.png; late_create_post snippet expanded with content, platforms (including platformSpecificData.contentType for Stories), publish_now, and is_draft.',
    ],
  },
  {
    version: 'v2.14.1',
    date: 'May 30, 2026',
    changes: [
      'content-generator v2.12.1: media pool fallback restructured from a dense paragraph into a numbered sub-step list with bold-labelled fallbacks — so Claude reliably runs both fallback levels (exact folder-name match → all-folders pool → empty), fixing posts that published with no photos despite a populated media library.',
      'creative-designer v2.12.1: same numbered media-pool restructure for parity with content-generator — folders matched by exact name, fall back to pooling all folders, then empty; library photos are now used regardless of folder naming.',
      'link.md v2.14.1: fb.ai media library Context Files entry clarified — documents the exact-name folder matching and the explicit all-folder fallback (photos used regardless of folder naming), naming both fivebucks_list_media_folders and fivebucks_list_media_files.',
    ],
  },
  {
    version: 'v2.14.0',
    date: 'May 29, 2026',
    changes: [
      'video-repurposer v2.14.0 (NEW, Marketing): Phase 4–5 of the YouTube-First pipeline — downloads the week\'s YouTube video (yt-dlp), reads the Clip Release Schedule from the Notion calendar, extracts clips (ffmpeg + optional Whisper), writes platform-native captions, and publishes to connected platforms (LinkedIn/Instagram/TikTok/Twitter-X/Facebook) via Zernio at the scheduled times; writes the PublishLog (same columns as social-publisher) that feeds content-performance-analyst.',
      'social-calendar v2.14.0: YouTube-First Mode added — Step 1 reads brand.md ## Content Strategy to select planning mode; new Step 2a plans one weekly YouTube video + a per-platform Clip Release Schedule (publish day/time per clip, Twitter/X support, comment-to-DM CTAs) for connected platforms only (old Step 2 renamed Step 2b Static Mode); quality checklist branches per mode. Defaults to static when ## Content Strategy is absent.',
      'brand-setup v2.14.0: new Step 4a — Content Strategy captures the brand primary content channel (youtube vs static), distribution + connected platforms (incl. Twitter/X), and clips per video, written to brand.md ## Content Strategy; drives social-calendar planning mode at runtime. Step 7b Step D now also discovers TikTok + Twitter/X organic account IDs (${BRAND}_LATE_TT / _LATE_TW) for video-repurposer.',
      'plugin-update v2.14.0: migration support for the YouTube-First pipeline — Step 1b brand.md checklist row for ## Content Strategy, Step 3e gap-fill (runs brand-setup Step 4a), Step 3k changelog→brand-action rows for YouTube-First Mode + the trend-radar synthesis requirement, and Step 1d/3f coverage for the new ${BRAND}_LATE_TT / _LATE_TW organic account IDs that video-repurposer needs.',
      'trend-radar v2.14.0: synthesis-before-write rule — Step 0 reads the latest Performance Brief (own post performance + competitor benchmarking from content-performance-analyst), mandatory competitor research from competitors.md on first run; Step 3 synthesizes own performance + competitor benchmarking + web research before scoring, adding competitor-differentiation and own-performance-alignment criteria; Step 4 forbids writing to ${BRAND}_TREND_DB before synthesis is complete.',
      'link.md v2.14.0: added the Content Engine — 5 Phases table to the Skills section (Phase 4–5 reflect the YouTube-First create→publish flow via video-repurposer; static path noted); Timely content skill chain updated to content-performance-analyst → trend-radar → social-calendar; v2.13.0 changelog now points to the new table.',
    ],
  },
];
