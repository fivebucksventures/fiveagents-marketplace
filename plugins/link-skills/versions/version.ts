// Version information (production)
const DEFAULT_VERSION = 'v2.17.0';
const DEFAULT_DATE = 'June 21, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
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
  {
    version: 'v2.13.1',
    date: 'May 28, 2026',
    changes: [
      'video-downloader v1.0.1: removed the bundled scripts/download_video.py + $CLAUDE_PLUGIN_ROOT path — Cowork (the runtime) does not expose that variable and link-skills has no bundled-runtime-script convention. yt-dlp now runs inline (python3 -m pip install yt-dlp → python3 -m yt_dlp) in the skill bash block, matching content-generator local-glue pattern. No other skill affected.',
    ],
  },
  {
    version: 'v2.13.0',
    date: 'May 28, 2026',
    changes: [
      'content-performance-analyst v1.0.0 (NEW, Marketing): organic-content Data phase — pulls per-post engagement from Zernio joined to the social-calendar authored attributes (via the social-publisher PublishLog), benchmarks competitor content via web research, scores outliers vs the brand own baseline, writes a Performance Brief to ${BRAND}_PERFORMANCE_DB (Owner/Source columns). Closes the create→publish→measure→learn loop.',
      'trend-radar v1.0.0 (NEW, Marketing): daily Research phase — WebSearch + Perplexity (+ optional DataforSEO) scan for timely niche topics, scored for relevance/timeliness, 7-day dedup, written as candidates to ${BRAND}_TREND_DB for social-calendar.',
      'video-downloader v1.0.0 (NEW, Productivity): standalone yt-dlp + optional Whisper transcription utility for repurposing/analysis; not wired into the static publishing pipeline.',
      'social-publisher v2.3.0: PublishLog now captures the platform post URL + Late ID + Date/Topic/Platform — the join key content-performance-analyst uses to match engagement back to planned posts.',
      'social-calendar v2.12.0: Step 1b reads the Performance Brief + Trend Radar candidates before market research (precedence brief → trends → research); Content Angle names a hook archetype.',
      'content-creation v2.9.0: added hook-library.md (8 hook archetypes + opening-line patterns); Step 3 selects an archetype for social hooks.',
      'link.md v2.13.0: registered the 3 new skills + content-learning-loop and timely-content chains; domain map regenerated (26 skills).',
      'brand-setup v2.9.1 + plugin-update v2.11.1: registered the two new auto-bootstrapped DBs (${BRAND}_PERFORMANCE_DB, ${BRAND}_TREND_DB).',
    ],
  },
  {
    version: 'v2.12.0',
    date: 'May 23, 2026',
    changes: [
      'content-generator v2.12.0: new media pool — at run start fivebucks_list_media_folders (cached with the template list) builds media_pool[type] by matching folders to template types by exact name (LinkedIn Post / Meta Story / Meta Carousel / Meta Post) and listing each folder\'s files. Step 4 changed from optional photo assignment to active injection: carousel/story cycle photos through body slots s2_image…s5_image, single-image types fill bg_image (+ _position: center / _fit: cover); empty pool leaves slots empty (branded placeholder). Fallbacks: pool all folders when no exact match; empty pool when no folders; skip silently on any error — never fails the run.',
      'brand-setup v2.9.0: Step 4b Claude Design setup rewritten for the new claude.ai/design UI (Design System → Create → "Set up your design system" attach form → Continue to generation), with a placeholder-substitution table and a ready-to-paste, website-aware generation prompt that points Claude at the live site. Step 4d media library now defines the per-template-type folder names (LinkedIn Post / Meta Story / Meta Carousel / Meta Post) content-generator matches photos against.',
      'plugin-update v2.11.0: Step 3b design-system install updated to the new claude.ai/design flow (steps renumbered 1–6) with a website-aware generation prompt; Step 3d media library now specifies the per-template-type folder names matching the content-generator media-pool convention.',
    ],
  },
  {
    version: 'v2.11.1',
    date: 'May 22, 2026',
    changes: [
      'link.md v2.11.1: Argil fully removed — avatars.md context file, Argil API gateway section, "Full social post (video)" skill chain, .mp4 output convention, and Argil from the Deps gateway legend all removed. Calendly corrected to outreach-sequencer + customer-onboarder.',
      'content-generator v2.11.1 + creative-designer v2.11.1: Reel and Argil fully removed — Reel rows from routing table and decision logic, Story-only guard, LATE_CONTENT_TYPE reel key and LATE_CONTENT_TYPE_FALLBACK dict, Reel video publishing rules, Argil gateway dep, is_story_reel → is_story, Reel rows from dimensions/format tables, "Reels UI stack"/"Reels right-rail" → "Meta bottom/side safe zone". Log metric format corrected from "static" to dynamic enum.',
      'social-calendar v2.11.1: Metrics corrected — calendar_status "Published" → "Planned", format "static" → dynamic enum, content_mix.type corrected. Monday/Friday checklist items added. deps.gateway updated.',
      'brand-setup v2.8.3: Argil and avatars.md fully removed — Step 5 overview, directory tree, CLAUDE.md template, Step 10 email, connections[]. Calendly corrected to outreach-sequencer / customer-onboarder across Steps 7b, 8c-bis, 8d, 8 summary table.',
      'plugin-update v2.10.2: Step 3k cross-references corrected (CLAUDE.md row → Step 3h, Windsor.ai → Step 3f). Quality checklist: Step 3f env-var item added. Step 1k version audit annotated as example-only.',
    ],
  },
  {
    version: 'v2.11.0',
    date: 'May 21, 2026',
    changes: [
      'content-generator v2.11.0 + creative-designer v2.11.0: Story publish split — meta-story renders call late_create_post once per slide (6 calls per platform pair) using the Supabase signed URL directly; Zernio auto-proxies Supabase storage URLs so no late_presign_upload/PUT step is needed. meta-carousel and single-image types keep the existing re-host flow.',
      'content-generator v2.11.0 + creative-designer v2.11.0: slide_ids removed for all template types — fb.ai now filters single-image templates (linkedin-post, meta-post) by the direction override server-side; fivebucks_render_post always omits slide_ids. Calendar table 12 → 11 columns (SlideId removed; Status at [10]).',
      'social-calendar v2.11.0: SlideId column removed (12 → 11 columns) — direction is all you need; fb.ai applies server-side direction filtering for single-image types. Direction rotation guidance (spread A/B/C for variety) added.',
      'brand-setup v2.8.2: Step 4c export-marker contract rewritten — renderer captures data-export-id at manifest canvas size (no fragile off-screen mirror needed); Story/Carousel/LinkedIn/Meta Post export prompts updated accordingly.',
    ],
  },
  {
    version: 'v2.10.1',
    date: 'May 21, 2026',
    changes: [
      'plugin-update Step 1: new Step 1i probes fivebucks_list_media_folders during the inspection sweep; media library state reported in Step 2 gap report. Steps 1i→1j (Notion DB) and 1j→1k (version audit) renumbered; cross-references updated.',
      'plugin-update Step 3h: Visual System block refresh added (brand-setup Step 9c equivalent) — probes design-system/, fivebucks_get_brand_kit, fivebucks_list_templates, fivebucks_list_media_folders and idempotently replaces BEGIN/END visual-system markers in CLAUDE.md on every run. Fixes stale blocks for brands set up before Step 9c or before media library row was added in v2.8.0.',
    ],
  },
];
