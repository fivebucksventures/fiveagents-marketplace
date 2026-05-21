// Version information (production)
const DEFAULT_VERSION = 'v2.10.1';
const DEFAULT_DATE = 'May 21, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
  {
    version: 'v2.10.1',
    date: 'May 21, 2026',
    changes: [
      'plugin-update Step 1: new Step 1i probes fivebucks_list_media_folders during the inspection sweep; media library state reported in Step 2 gap report. Steps 1i→1j (Notion DB) and 1j→1k (version audit) renumbered; cross-references updated.',
      'plugin-update Step 3h: Visual System block refresh added (brand-setup Step 9c equivalent) — probes design-system/, fivebucks_get_brand_kit, fivebucks_list_templates, fivebucks_list_media_folders and idempotently replaces BEGIN/END visual-system markers in CLAUDE.md on every run. Fixes stale blocks for brands set up before Step 9c or before media library row was added in v2.8.0.',
    ],
  },
  {
    version: 'v2.10.0',
    date: 'May 20, 2026',
    changes: [
      'fivebucks_render_post slide selection is now template-type-specific (verified against the live fb.ai gateway + renderer). Single-image types (linkedin-post, meta-post) render all three direction artboards into the DOM and fb.ai applies no direction filter for them, so content-generator + creative-designer now PASS slide_ids — resolved by the Direction position (A=1st, B=2nd, C=3rd) against manifest.slides[], with the calendar SlideId cell as a fast path. Multi-slide types omit slide_ids: meta-story uses _direction (A/B/C, never all); meta-carousel renders all 6 and rotates coverVariant/bodyVariant. Omitting slide_ids for single-image renders all 3 (or errors).',
      'social-calendar v2.10.0: NEW SlideId column (calendar table 11 → 12 columns) for the two single-image template types, with PER-TYPE labels — linkedin-post: 01 Hook Headline / 02 Stat Hero / 03 Pull Quote (verified against the live manifest); meta-post: 01 Hero Visual / 02 Quote Card / 03 Listicle Teaser (per brand-setup). Blank for Carousel, Story/Reel, Reel(Argil), and non-template formats. Field table, SlideId section, Step 3c column count/example, local-backup table, and quality checklist updated.',
      'content-generator v2.10.0: Step 1c row parsing now reads [10] SlideId, [11] Status; Step 4c-template §6 render made template-type-specific with position-against-manifest slide_ids resolution; Step 6 status-update string match + cell index updated to 12 columns; checklist bullet added.',
      'creative-designer v2.10.0: Step 4a render mirrors the same per-type + position-based slide_ids rule (canonical impl in content-generator Step 4c-template §6); checklist updated.',
      'brand-setup v2.8.1 + plugin-update v2.8.1: explicit fb.ai paid-product context shown before any fivebucks.ai link, and the Cowork directory-access flow (mcp__cowork__request_cowork_directory on the user-provided design-system path; skipped in local Claude Code; in-project fallback if declined).',
    ],
  },
  {
    version: 'v2.9.0',
    date: 'May 20, 2026',
    changes: [
      'Design system stays LOCAL (brands/{brand}/design-system/) as the crucial free baseline, with an OPTIONAL fb.ai brand-kit upload for paid users. brand-setup Step 4b keeps the local copy flow and adds optional Step D (upload ZIP to fb.ai /dashboard/social-posts/brand-kit); plugin-update Step 3b restores the local copy flow + optional fb.ai upload.',
      'New optional Media Library step — brand-setup Step 4d + plugin-update Step 3d: upload brand photos to the fb.ai media library (/dashboard/social-posts/media), discovered via fivebucks_list_media_folders / fivebucks_list_media_files.',
      '3-tier brand color/font lookup wired across agents/link.md + 8 visual skills: fb.ai brand kit (fivebucks_get_brand_kit) → local design-system/ → brand.md. New Brand kit field map in link.md documents only the non-obvious JSON mappings (secondary→tokens.colors.accent, text→tokens.colors.dark, no font weight scale). Gamma payloads (financial-reporter, investor-update-writer, proposal-generator) no longer request an unfillable secondary {HEX}.',
      'fb.ai template upload moved to the new dashboard URLs (/dashboard/social-posts/api-keys → /templates); credential setup points to the api-keys page.',
      'Skills bumped: brand-setup v2.8.0, plugin-update v2.8.0, background-generator v2.8.0, content-creation v2.8.0, content-generator v2.8.0, creative-designer v2.8.0, campaign-presenter v2.3.0, financial-reporter v2.5.0, proposal-generator v2.5.0, investor-update-writer v2.6.0, agents/link.md v2.11.0.',
    ],
  },
  {
    version: 'v2.8.0',
    date: 'May 20, 2026',
    changes: [
      'NEW skill decision-advisor (v2.8.0, Strategy area): structures a hard business decision — frame → options → weighted-criteria scoring → pre-mortem/stress-test → recommendation + decision record. No external integrations (reads brand context files). MIT-attributed patterns (alirezarezvani/claude-skills).',
      'Phase 0 — generated skill registry (foundation for scaling to 300+ skills). Each SKILL.md now carries area/use_for/deps frontmatter as the single source of truth; scripts/gen_skills_index.py generates skills-manifest.json (machine) + SKILLS.md (full human table) + the domain map in agents/link.md. brand-setup Step 8d + plugin-update read the committed manifest (the generator is build/CI-time only — never run in Cowork). CI drift gate (.github/workflows/skills-registry-check.yml) + formatter-exclusion (.prettierignore) protect the generated artifacts.',
      'Phase 1 — thinned the CLAUDE.md embed. agents/link.md (embedded into every brand CLAUDE.md) now carries a compact domain map (areas + counts + names) instead of the full per-skill table; the embedded block dropped ~12x (~9 KB → ~0.7 KB at 23 skills). Full per-skill table moved to the generated, non-embedded SKILLS.md.',
      'agents/link.md v2.10.0: Working discipline section added; compact domain map between generated markers; decision-advisor row + chain; fivebucks_* tool references.',
      'brand-setup v2.7.1: Step 8d readiness reads skills-manifest.json (Phase 0); 8d-i translation table fivebucks label fix (stale gateway: templates row → gateway: fivebucks). plugin-update v2.7.1: reads the pre-generated manifest (no generator run in Cowork).',
    ],
  },
  {
    version: 'v2.7.0',
    date: 'May 20, 2026',
    changes: [
      'Social-post templates migrated to fb.ai (fivebucks_* gateway tools). The dead template_upload/template_list/template_render API and local brands/{brand}/social-meta-*-template/ folders are gone. Templates are authored in Claude Design, uploaded via the fb.ai dashboard, discovered via fivebucks_list_templates (by type: meta-carousel | meta-story | linkedin-post | meta-post), and rendered via fivebucks_create_post → fivebucks_render_post → re-host on Zernio. Affects content-generator, creative-designer, brand-setup (Step 4c), plugin-update, content-creation, social-calendar, background-generator, agents/link.md.',
      'brand-setup Step 4c collapsed four near-identical install blocks into one shared flow (author → export → fb.ai dashboard upload → fivebucks_list_templates verify) + four type-specific Claude Design prompts using the native-image contract (per-slot _image/_image_position/_image_fit; template renders its own <img> + tint overlay; logo bundled at assets/logo.png, never in EDITMODE).',
      'New credential FIVEBUCKS_API_KEY (fbai_live_..., vault service fivebucks) added to brand-setup Step 2 + Step 7 and plugin.json userConfig. Optional — the Gemini + Pillow fallback path is unchanged when absent.',
    ],
  },
  {
    version: 'v2.6.6',
    date: 'May 16, 2026',
    changes: [
      'digital-marketing-analyst v2.3.3 + data-analysis v2.3.3: silent-failure bug fix — Zernio tool params standardized to snake_case (date_from/date_to, account_id) across late_get_ads_timeline, late_get_ad_tree, late_list_ad_campaigns, late_get_ad_analytics. Old fromDate/toDate/accountId were silently returning empty/wrong data. Verified against live MCP schema.',
      'digital-marketing-analyst v2.3.3 + data-analysis v2.3.3: late_get_ad_tree documented as the recommended path for Campaign → Ad Group/Set → Ad hierarchy in Google + Meta Zernio fallbacks (date-filterable, paginated 20/page default, max 100). late_list_ad_campaigns clearly flagged as lifetime-only (no date filter) — campaign metadata only. Google Ads adSets[] response field is actually ad-groups (Zernio naming quirk).',
      'digital-marketing-analyst v2.3.3: critical template gotcha documented — meta_ads.no_active_campaigns: true skips the entire Meta summary box. Always set false; use new all_campaigns_paused field for pause state. Payload schema additions: Meta last_spend_date / days_dark / lp_views / leads / video_views / spend_*_lifetime + note on lifetime campaign rows / spend_usd: null for Zernio source; Google Ads conversions_note; richer GA4 funnel block (click_to_session_*_pct + per-stage event counts keyed off brand funnel.md).',
      'digital-marketing-analyst v2.3.3 + data-analysis v2.3.3: brand-agnostic refactor — removed Five Agents-specific 2026-03-08 GA4 tracking-bug date (now read from brands/{brand}/funnel.md ga4_clean_data_start if set). Removed hardcoded trials KPI from Slack/log/combined_summary templates (now primary_conversions driven by brand\'s primary conversion event + primary_conversion_event / primary_conversion_label companion fields). Removed signup form assumption from analysis guidelines. Google Ads Zernio quirks: conversions always 0 — source proxy from brand\'s primary GA4 event in funnel.md (no hardcoded event name).',
    ],
  },
  {
    version: 'v2.6.5',
    date: 'May 16, 2026',
    changes: [
      'agents/link.md v2.6.5: change log trimmed to the last 5 entries per Step 3c policy. Oldest entry (v2.4.1) removed.',
      'brand-setup v2.5.2 + content-generator v2.5.4 + creative-designer v2.5.4 + data-analysis v2.3.2 + digital-marketing-analyst v2.3.2 + plugin-update v2.5.2: change log history trimmed across SKILL.md files — housekeeping pass to keep file-level history compact. No functional change.',
    ],
  },
  {
    version: 'v2.6.4',
    date: 'May 15, 2026',
    changes: [
      'data-analysis v2.3.1 + digital-marketing-analyst v2.3.1: Google Ads Zernio fallback now passes BOTH account_id (Zernio SocialAccount _id) AND ad_account_id (Google Ads customer ID, 10-digit). Passing only the SocialAccount ID was returning empty results — this is a bug fix for the Windsor.ai → Zernio fallback path.',
      'data-analysis v2.3.1 + digital-marketing-analyst v2.3.1: NEW LinkedIn Ads support (opt-in per brand). Windsor.ai primary (source: linkedin, fields incl. lead_form_opens / lead_form_completions); Zernio fallback uses same two-ID pattern (account_id + ad_account_id) as Google Ads. data-analysis adds the LinkedIn block to Step 1a; digital-marketing-analyst adds NEW Phase 2.5 (linkedin-data-pull cron) + weekly Step 1d, plus conditional load in Phase 3 Email Stitcher and conditional Slack DM line. Skipped silently when ${BRAND}_LATE_LINKEDIN_ADS / _CID env vars are absent.',
      'brand-setup v2.5.1: Step 7b Step D Google Ads env var renamed from ${BRAND}_LATE_GOOGLE_ADS_ACCOUNT_ID → ${BRAND}_LATE_GOOGLE_ADS (Zernio SocialAccount _id) + new ${BRAND}_LATE_GOOGLE_ADS_CID (Google Ads customer ID via late_list_ad_accounts; on 429 / empty, prompts user). LinkedIn Ads discovery added: new ${BRAND}_LATE_LINKEDIN_ADS + ${BRAND}_LATE_LINKEDIN_ADS_CID pair, same two-ID pattern, distinct from organic ${BRAND}_LATE_LI. CLAUDE.md Account IDs section extended.',
      'plugin-update v2.5.1: Step 3e auto-discover restructured into 4 sub-steps (SocialAccount IDs → Google Ads customer ID → LinkedIn sponsored account ID → legacy rename handler that auto-migrates ${BRAND}_LATE_GOOGLE_ADS_ACCOUNT_ID → ${BRAND}_LATE_GOOGLE_ADS). Step 1d env vars table and Step 3j checklist row both extended with the new pair.',
      'agents/link.md v2.6.4: data-analysis + digital-marketing-analyst rows in the Skills table gained Env: deps blocks listing the Zernio fallback env-var pairs (Google Ads + Meta Ads + LinkedIn Ads). digital-marketing-analyst "Use For" updated from "Google Ads, Meta Ads, GA4" → "Google Ads, Meta Ads, LinkedIn Ads (opt), GA4". brand-setup Step 8d-iv parses Deps to compute agent_readiness matrix — without these declarations, the readiness email understated actual env-var dependencies.',
    ],
  },
  {
    version: 'v2.6.3',
    date: 'May 14, 2026',
    changes: [
      'digital-marketing-analyst v2.3.0: Windsor.ai fallback — if Windsor errors or returns 0 rows, fall back to Zernio late_get_ads_timeline + late_list_ad_campaigns for Google Ads and Meta Ads. GA4 is Windsor-only. Phase 4 (new) — Ads Actions: pause campaigns/ad sets, bulk-pause, duplicate winners, boost posts, create CTWA ads, audit conversion tracking via Zernio.',
      'data-analysis v2.3.0: matching Windsor.ai fallback in Step 1a (Google Ads + Meta Ads via Zernio; GA4 Windsor-only). Step 7 (new) — act on findings: pause campaigns, drill ad analytics, audit conversion tracking, boost top posts.',
      'brand-setup v2.5.0: Step 7b Step D now extracts Google Ads and Meta Ads SocialAccount IDs from late_list_accounts and saves as ${BRAND}_LATE_GOOGLE_ADS_ACCOUNT_ID / ${BRAND}_LATE_META_ADS_ACCOUNT_ID. CLAUDE.md Account IDs section extended.',
      'plugin-update v2.5.0: Step 1d adds two new optional env var rows; Step 3e auto-discovers ads SocialAccount IDs via late_list_accounts; Step 3j adds v2.5.0 mapping row.',
      'agents/link.md v2.6.3: Zernio API section expanded into 8 sub-categories covering all ~35 ads management tools. Deps updated for digital-marketing-analyst and data-analysis.',
      'docs/plugin-mcp.md: tool count updated to 57; Zernio split into 8 rows; digital-marketing-analyst and data-analysis rows updated.',
    ],
  },
  {
    version: 'v2.6.2',
    date: 'May 12, 2026',
    changes: [
      'design-system audit across every content-generating skill — closes the gap where users had to manually remind skills to read brands/{brand}/design-system/. The global Visual consistency rule in agents/link.md was correct, but four skills (campaign-presenter, background-generator, proposal-generator, investor-update-writer) silently omitted design-system/ from their Deps and SKILL.md, and three others had a probe but didn\'t use it where it mattered. brand-setup Step 8d-iv parses Deps to compute the agent_readiness matrix — drift here lied to users.',
      'investor-update-writer v2.5.0: NEW Step 9 — Generate the Branded Deck. Gamma deck primary, Google Doc fallback. Previously dispatched a Gmail draft with markdown body and a separate Google Doc archive copy — investors got a wall of email. New flow: local markdown audit → Gamma generate_from_template with brand HEX + font-family → fall back to GDoc on Gamma failure → abort entirely (skip Gmail) only if BOTH error. Frontmatter allowed-tools gained Gamma MCP. Gmail body rewritten as a tight cover note (opener + TL;DR + deck link + reply CTA) — the deck is the deliverable. Step 11b Notion archive + Step 12 Slack + Output metadata + metrics JSONB all carry deck_url, deck_format (gamma|gdoc), pdf_url. Mirrors proposal-generator Step 5 + financial-reporter Step 6.',
      'campaign-presenter v2.2.6 (had zero design-system mention): Step 1 restructured with leading Brand visual system block (design-system/ preferred, brand.md fallback). Step 4 Canva generate-design query now explicitly carries extracted HEX values + font-family. brand_kit_id still wins when available. New Visual identity block in the quality checklist.',
      'background-generator v2.4.1 (had zero design-system mention): Step 2 added explicit "Read brand visual identity FIRST" block. Every Gemini prompt now appends a brand-palette hint (HEX values phrased as ambient mood, e.g. "warm tones around #ec4899"). Library is on-brand instead of generic stock-photo aesthetics. Two new quality checklist entries.',
      'proposal-generator v2.4.1: Step 1 restructured with leading Brand visual identity block. Step 5 Gamma additionalInstructions expanded from vague "Use brand colors {primary, secondary}" to explicit primary/secondary/accent/background HEX + typography family. Decks now match the brand instead of defaulting to Gamma templates. Two new checklist entries.',
      'financial-reporter v2.4.1: Step 6 restructured with the same Brand visual identity FIRST block. Gamma additionalInstructions expanded with explicit HEX/font payload (was a hand-wavy "Pass these into the Gamma generation request"). Two new checklist entries.',
      'content-generator v2.5.3: Step 4c-image Prompt rules expanded to spell out the read order (design-system/ first, brand.md fallback) AND how to inject palette into the Gemini prompt (HEX values as ambient mood). New clarifying note on why Pillow uses DejaVuSans-Bold regardless of brand (universal rasterizer) — colors are the lever for on-brand output on the Pillow path. Fixed stale "text overlay needs readable space at the bottom" claim — now correctly references top OR bottom per day-of-week rotation.',
      'creative-designer v2.5.3: matching Step 4b Image prompt guidelines bullet — inject brand HEX into the Gemini prompt with phrasing rules. Matching callout on Pillow fonts. Closes the loop where Step 1 read design-system but the Gemini prompt-construction guide didn\'t tell the model to use it.',
      'agents/link.md v2.4.4: four Deps rows updated (campaign-presenter, background-generator, proposal-generator, investor-update-writer) to declare design-system/ (opt). investor-update-writer row also rewrote Use For to reflect the new Gamma deck deliverable and added Gamma MCP as a first-class dep.',
    ],
  },
  {
    version: 'v2.6.1',
    date: 'May 12, 2026',
    changes: [
      'content-generator v2.5.2: add_text_overlay feed side_inset bumped from pad // 2 to pad + pad // 2 (~9% of canvas width, ~96–108 px). Restores breathing room on left/right edges and survives Instagram\'s profile-grid 4:5 recrop (~34 px side trim). Top/bottom/scrim_fade unchanged at pad // 2; add_logo unchanged at uniform pad // 2 — text and logo feed insets diverge on sides by design. Reason: v2.5.0\'s "uniform pad // 2 on all four sides" regressed the IG profile-grid crop hardening that v2.4.8 introduced.',
      'creative-designer v2.5.2: mirror of content-generator fix — same add_text_overlay feed side_inset bump (pad // 2 → pad + pad // 2). Layout rules + Step 3b checklist + fix table rewritten to reflect text/logo feed-side divergence.',
      'content-generator + creative-designer: Step 4a/Step 4h tables and fix tables call out the regression risk explicitly — any future "simplification" that re-aligns feed text sides with feed logo sides will reintroduce the bug.',
    ],
  },
  {
    version: 'v2.6.0',
    date: 'May 10, 2026',
    changes: [
      'social-calendar v2.5.0: image_brief for Story/Reel posts now wrapped in full-frame composition template before saving to Notion — enforces full-bleed photorealistic 9:16 composition (no bottom void). Reel(Argil) excluded (uses script, not image_brief). Quality checklist corrected: adaptive content mix, Direction/Argil carve-out, raw-scene watermark rule.',
      'content-generator v2.5.1: defensive full-frame guard added at Step 4c-image — if Story/Reel image_brief lacks "fills the ENTIRE frame" (calendar authored before v2.6.0), wraps it in composition template before calling gemini_generate_image. Reel(Argil) excluded. Quality checklist item added.',
      'creative-designer v2.5.1: same defensive full-frame guard at Step 4b — wraps Story/Reel prompts in composition template before gemini_generate_image. Safe asset_type variable check via dir() fallback. Quality checklist item added.',
      'workflow/commit-to-git.md: new release workflow document added — git status, skill version audit (no double-bump), Notion Agents Library sync, three-file version lockstep, commit and push steps with quality checklist.',
    ],
  },
  {
    version: 'v2.5.1',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_text_overlay — replaced character-count textwrap heuristic with pixel-aware wrap_to_fit() using draw.textbbox(). Fixes headline overflow on wide feed canvases (LinkedIn 1200×628, Facebook 1200×630) where DejaVu Bold widths exceeded the hs * 0.55 estimate, causing text to spill past the side inset. Removed import textwrap.',
      'brand-setup: Step 5g Step A (Sender Persona) now collects Booking URL alongside Name/Title/Signature/Photo. sales.md template Sender Persona block adds Booking URL: line. Reply Routing {link} placeholder now resolves explicitly from Sender Persona Booking URL (was unresolved — silent breakage in outbound CTAs).',
      'plugin-update: Step 1a — added inline schema check for sales.md Booking URL: line in ## Sender Persona block (flags ⚠ schema gap if missing). Step 3a — new targeted single-question backfill handler for present-but-incomplete sales.md (asks only the Booking URL, no full Step 5g re-walk).',
      'outreach-sequencer: Step 4 fallback contract pinned — was "stored in sales.md Sender Persona section", now reads "the Booking URL: line inside the ## Sender Persona block" with explicit abort + Slack alert if missing/empty. No more silent CTAs with empty booking links.',
      'customer-onboarder: Step 4c — added explicit fallback path. If Calendly OAuth fails, no event-type matches kickoff, or single-use scheduling-link tool errors out, read Booking URL from sales.md Sender Persona instead (standing link, acceptable degradation). If that is also missing, abort + Slack alert routing user to /link-skills:plugin-update.',
    ],
  },
  {
    version: 'v2.5.0',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_text_overlay — new text_position parameter (\'bottom\' default or \'top\'). Text and scrim anchor per position; gradient direction flips so the dark end is always on the same end as the text. Position-aware asserts.',
      'content-generator + creative-designer: text + logo geometry refactored to named per-canvas insets (top_inset / bottom_inset / side_inset / scrim_fade). Single rule across both functions — 9:16 = Meta safe zones only (14% top, 13% bottom, 13% sides, scrim_fade 0); feed = uniform pad // 2. Eliminates the legacy safe_bottom_px / safe_side_px / scrim_h naming.',
      'content-generator + creative-designer: add_logo bottom-right and bottom-left positions restored, enabling bottom-anchored logo placement. Per-canvas insets match the text rule.',
      'content-generator Step 4b + creative-designer rotation table: day-of-week rotation now alternates text_position. Mon/Wed/Fri = bottom text + top-right logo; Tue/Thu/Sat = top text + bottom-left logo. Text and logo always on opposite vertical ends. **Tue/Thu/Sat posts will look different on this release.**',
      'content-generator Step 4a/4d/4e/4h + creative-designer Layout rules/Step 4a/Step 4b/Step 3b: tables, narratives, checklists, fix-table rows rewritten to reflect named insets, top/bottom text, rotated logo placements.',
      'creative-designer bug fix: Step 5 "Run quality checklist" empty stub deleted; Argil section renumbered Step 6 → Step 5.',
      'creative-designer bug fix: avatar table in Argil section had a duplicated empty header above the populated rows; merged into single header + rows.',
      'content-generator bug fix: Quality Checklist line said "All Planned posts for tomorrow processed" but Step 1 targets today; corrected to "today".',
      'creative-designer bug fix: broken cross-references "(Step 4f)" (line 273) and "(Step 4d)"/"(Step 4e)" (lines 275, 815) pointed to step IDs that exist in content-generator but not creative-designer; rewritten to refer to the actual sections inside creative-designer.',
      'creative-designer bug fix: rotation-rule sentences referenced only text_align and logo_position; added text_position to match the new rotation.',
      'content-generator Step 4h fix table "Logo over busy image area" reworded as a last-resort fallback that explicitly overrides the day-of-week rotation, used only when contrast cannot be salvaged via scrim alpha or backing.',
    ],
  },
  {
    version: 'v2.4.8',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_text_overlay — bottom inset tuned to push text closer to the natural edge. 9:16 (Story/Reel): safe_bottom_px = int(target_h * 0.13), down from 0.18 — now matches Meta\'s published safe zone (central 1080x1420 of a 1080x1920 frame, ~250 px from bottom). Text moves 96 px lower; still clears the Reels UI stack.',
      'content-generator + creative-designer: add_text_overlay — feed bottom inset halved: safe_bottom_px = pad // 2 (was pad). Side inset stays at pad. Feed text now sits ~32-36 px above the natural edge (down from ~65-72 px). The asymmetry is deliberate: Meta has no bottom safe zone for feed posts, but IG profile-grid 3:4 cropping (~34 px side trim) is real, so sides keep the larger inset.',
      'content-generator Step 4a + Step 4h + creative-designer Layout rules + Step 3b: tables, checklists, and fix-table rows updated to reflect the new 13% / pad // 2 values. Rationale rewritten to cite Meta docs for 9:16 and explain the feed bottom-vs-sides asymmetry.',
    ],
  },
];
