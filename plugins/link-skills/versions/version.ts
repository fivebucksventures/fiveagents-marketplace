// Version information (production)
const DEFAULT_VERSION = 'v2.6.5';
const DEFAULT_DATE = 'May 16, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
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
  {
    version: 'v2.4.7',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_text_overlay — geometry fix. Text bottom now anchored directly via text_y = (target_h - safe_bottom_px) - block_h. The previous scrim_h = block_h + 2*pad framing left an extra pad of empty gradient below text on every canvas (feed text drifted up to ~77% down on LinkedIn 1200x628 instead of hugging the bottom; 9:16 text sat one pad above the safe-zone boundary instead of at it). Feed text now sits exactly pad above the natural edge; 9:16 text sits exactly at the 18% safe-zone boundary.',
      'content-generator + creative-designer: add_text_overlay — brightness sample now reads the actual text zone (text_y to text_bottom) instead of the upper half of the old scrim_h slot. Sample area shrinks from "top half of scrim region" to "exact text region" — adaptive color picks become more accurate.',
      'content-generator + creative-designer: add_text_overlay — runtime asserts added inside the function: text_y + block_h == target_h - safe_bottom_px, scrim_top + pad == text_y, scrim_bottom == target_h, text_y >= 0. Geometric regressions now raise AssertionError at execution time instead of silently shipping a misplaced text block. Each assert message names the exact mismatch.',
      'content-generator + creative-designer: add_logo — runtime asserts added: cropped logo has non-zero dimensions; resize aspect-ratio matches cropped aspect within 1%. Catches anyone who reorders the crop/resize sequence and re-introduces the v2.4.5 logo-distortion bug.',
      'content-generator Step 4h + creative-designer Step 3b fix tables: replaced "Headline cut off at bottom of scrim" (stale wording from the old scrim_h geometry where the scrim was a tight block_h + 2*pad slot) with "Headline clipped at top of canvas (block too tall for canvas)" — under the new geometry the scrim runs to target_h regardless and any clipping happens at the canvas top, not the scrim bottom.',
    ],
  },
  {
    version: 'v2.4.6',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_logo — fixed logo aspect-ratio distortion. logo.crop(logo.getbbox()) now runs BEFORE logo_w/logo_h are computed, so the resize target is derived from the cleaned (cropped) logo bounds instead of the original padded ones. Previously the resize calc used padded proportions but the crop-then-resize sequence applied them to a different aspect ratio, stretching the mark.',
      'content-generator Step 4h + creative-designer Step 3b: fix tables updated — the "Logo visually offset" row now confirms the crop is automatic; new "Logo aspect ratio looks distorted" row points to the crop-order requirement.',
    ],
  },
  {
    version: 'v2.4.5',
    date: 'May 08, 2026',
    changes: [
      'content-generator + creative-designer: add_text_overlay — gradient now runs from scrim_top to target_h on every canvas (was target_h - safe_bottom_px). Decoupled text_bottom anchors text above the inset for 9:16; on feed text_bottom = target_h - pad. Eliminates the raw-image gap below the scrim that was visible on every FB/IG Story (~346 px) and feed post (~60 px).',
      'content-generator + creative-designer: add_text_overlay — feed text inset corrected to pad on every side (was 60 / max(pad, 60), mislabeled as "safe zone"). Meta safe zones are Stories/Reels-only — feed posts use a pad design inset so text reads in IG/FB tile views and survives IG profile-grid 3:4 cropping. 9:16 18%/13% safe zones unchanged.',
      'content-generator + creative-designer: add_text_overlay — scrim max-alpha 200→230 + brightness threshold 0.45→0.40. Heavier scrim flattens busy and light backgrounds enough that the dark-pink subline stays legible (IG Story subline was barely visible at the previous 200/0.45 settings).',
      'content-generator + creative-designer: add_logo — flat margin = max(int(w * 0.03), 30) on every canvas. Removed the 9:16 safe-zone inheritance that pushed the logo 269 px from top + 140 px from sides — logos were floating mid-canvas instead of anchored to the corner. Dropped bottom-right/bottom-left dict entries (already marked NEVER USE).',
      'content-generator: Step 4a safe-zone table rewritten — 9:16 row reflects platform UI; feed row labeled as design inset (not a platform safe zone); logo flat-margin and gradient-to-canvas-bottom rules stated explicitly. Step 4b note clarified that the 18% offset applies to 9:16 only.',
      'content-generator: Step 4h visual verification rewritten — feed pad inset, gradient-reaches-canvas-bottom, logo-anchored-to-corner checks added; fix table updated for the four new symptoms.',
      'creative-designer: Layout rules section rewritten — 9:16 / feed / logo / gradient blocks brought into sync with the new implementation; replaced the "60 px rendering buffer" claim with the pad design inset framing. Step 3b checklist + fix table mirror content-generator.',
    ],
  },
  {
    version: 'v2.4.4',
    date: 'May 07, 2026',
    changes: [
      'plugin metadata sync — plugin.json description and keywords were stuck on the v2.4.0 expansion gap (still said "Marketing agent — research, create, design, analyze, publish content"; keywords missed sales/customer-success/finance/strategy/productivity). Updated description to match link.md frontmatter ("Multi-brand business operations agent — marketing, sales, customer success, finance, strategy, productivity for any active brand") and extended keywords. Same fix applied to .claude-plugin/marketplace.json (top-level metadata.description and per-plugin description + keywords).',
      'plugin.json + marketplace.json: bumped version field from 1.0.0 (had been stuck since launch) to 2.4.4 — now in lockstep with version.ts. Bug surfaced during v2.4.3 release: drift between version.ts (vN) and plugin.json/marketplace.json (1.0.0) meant marketplace consumers never saw a version bump.',
      'commit-to-git workflow: Step 5b rewritten — now requires updating all three version files in lockstep (version.ts, plugin.json, marketplace.json metadata.version + plugin entry version). Quality checklist extended with three new boxes covering the metadata files. Step 6 stage command extended to include .claude-plugin/marketplace.json. Prevents the version-drift bug from recurring.',
    ],
  },
  {
    version: 'v2.4.3',
    date: 'May 07, 2026',
    changes: [
      'agents/link.md: one-time audit of every skill\'s Deps cell against actual tool calls in each SKILL.md — 19 of 22 skill rows corrected. Stale claims removed: data-analysis (PostHog), campaign-presenter (Gamma), outreach-sequencer (Apollo.io), investor-update-writer (Gamma), meeting-analyzer (Calendly). Missing tokens added: MCP: Slack on 6 skills (social-publisher, digital-marketing-analyst, social-calendar, proposal-generator, churn-predictor, outreach-sequencer), Gateway: Argil on creative-designer + content-generator, MCP: Notion on background-generator, MCP: Google Drive + Gmail on meeting-analyzer, MCP: PayPal (opt) + Notion + Google Drive (opt) on financial-reporter, Gateway: email on outreach-sequencer, MCP: Gmail on churn-predictor, MCP: Stripe (opt) + Gateway: email (opt) on invoice-collector. Missing Files refs added across most skills (audience.md, product.md, competitors.md, design-system/ opt). Companion fix: removed MCP: Notion from social-publisher row (initial cleanup that motivated the audit).',
      'brand-setup: Step 10 email payload — added top-level brand_name field. Display name (e.g. "Five Agents"), read from the first # heading in brands/{brand}/brand.md. Lets the server-side template render the brand\'s actual name in the email title instead of the slug.',
      'brand-setup: Step 8d-iv — clarified that connected_tools[] derivation reads agents/link.md Deps as the single source of truth (no per-agent table here).',
      'brand-setup: Step 8d-i translation table — added "PayPal MCP → PayPal (revenue)" row to match link.md\'s expanded Deps vocabulary (financial-reporter now lists PayPal opt).',
      'plugin-update: Step 5b email payload — added top-level brand_name field, mirrors the same field added to brand-setup Step 10 so the upgrade email title also renders the display name.',
    ],
  },
  {
    version: 'v2.4.2',
    date: 'May 07, 2026',
    changes: [
      'brand-setup: Step 8d agent_readiness[] schema — JSON example in 8d-iii and Step 10 email payload brought into sync; added `name` (renamed from `agent`), `category`, `status_label`, and `connected_tools[]` fields. Step 10 was lagging the 8d-iii schema after v2.4.1.',
      'brand-setup: Step 8d-ii / 8d-iii / Step 10 Slack DM — dropped "run on schedule starting today" framing in favor of "configured and available to run" / "configured and ready to run". Three call-sites were contradicting each other after v2.4.1.',
      'brand-setup: Step 8d-iv (NEW) — derivation rule for connected_tools[]: pull each agent\'s MCP:/Gateway: tokens from agents/link.md Deps column, translate via 8d-i, preserve (opt) markers. Replaces a duplicate per-agent mapping table that would have drifted from link.md. Keeps agents/link.md as the single source of truth (matching its own v2.4.1 claim).',
      'plugin-update: Step 4b — references brand-setup Step 8d-iv derivation rule for connected_tools[] (pulled from agents/link.md Deps + 8d-i translation) instead of a separate mapping table.',
      'plugin-update: Step 5b Slack DM "no fixes needed" line synchronized with brand-setup Step 10 — "configured and ready to run" instead of "ready to run on schedule".',
    ],
  },
];
