// Version information (production)
const DEFAULT_VERSION = 'v2.6.1';
const DEFAULT_DATE = 'May 12, 2026';

// Export constants initially with default values
export let APP_VERSION = DEFAULT_VERSION;
export let RELEASE_DATE = DEFAULT_DATE;

// NOTE: Keep only last 15 versions to prevent git overload (following Next.js pattern)
// Full history available in GitHub releases and git commits
export let VERSION_HISTORY: Array<{ version: string; date: string; changes: string[] }> = [
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
  {
    version: 'v2.4.1',
    date: 'May 07, 2026',
    changes: [
      'agents/link.md: Skills table extended with Area (Marketing/Sales/Customer Success/Finance/Strategy/Productivity/Setup) and Deps columns — single source-of-truth for the agent readiness matrix that brand-setup Step 8d and plugin-update Step 4b compute. Added prefix notation guide (MCP: / Gateway: / Files: / Env: with (opt) marker) and per-skill dep mappings for all 22 entries.',
      'brand-setup: Step 2 prereqs table — added 6 business-ops MCP rows (Apollo.io, Calendly, Stripe, Xero, PostHog, Gamma) so users see what they\'ll be asked to connect upfront',
      'brand-setup: Step 3 directory tree + Step 9b Workspace Structure — added 5 v2.4.0 brand-context files (sales/CS/finance/investors/operations) with skip annotations for the conditional ones',
      'brand-setup: Step 7c — added "Business-operations MCPs" walkthrough block with explicit per-MCP prompts (each names dependent skill + skip impact). Closes the gap where Step 8c-bis would probe MCPs the user was never asked to connect.',
      'brand-setup: Steps 5g/5h/5i/5j/5k — added "Read existing context first" mapping table at the top of each new sub-step. Lists which existing brand files (brand.md, audience.md, product.md, etc.) to pre-fill from, so the agent never asks for info already on disk.',
      'brand-setup: Step 8d (NEW) — Agent Readiness Summary. Translation table (technical → business labels), status rules (Ready / Works with limitations / Not ready / You skipped), display format with worked example, structured save schema for Step 10. Owners get the business answer ("which agents will run on my brand starting today"), not the engineering answer ("which connections passed").',
      'brand-setup: Step 10 email payload — restructured around agent_readiness[] + readiness_summary as primary blocks; demoted connections[] and files[] to diagnostic detail. Slack DM leads with readiness counts + top 3 fixes instead of integration count. Requires server-side template update at fiveagents/src/lib/email/templates/brand-setup.ts (handed off via JSON instruction spec).',
      'plugin-update: Step 1e — added MCP probe rows for PostHog, Gamma, Meta Ads MCP (optional). Now matches every connector validated by brand-setup Step 8c-bis.',
      'plugin-update: Step 2 gap report example — expanded to surface business-ops MCPs and the 5 v2.4.0 brand-context files',
      'plugin-update: Step 3a — added top-of-section pre-fill rule + per-bullet pre-fill summaries for the 5 v2.4.0 files. In plugin-update context the v2.0 source files are essentially guaranteed to exist, so pre-fill is mandatory; agent reads existing brand files and drafts answers instead of asking from scratch.',
      'plugin-update: Step 3f — rewrote MCP gap-fill flow with explicit per-MCP walkthrough prompts for all 14 MCPs (was only Windsor + Playwright). Closes the gap where business-ops MCPs flagged in Step 1e were silently skipped during interactive fill.',
      'plugin-update: Step 3g — fixed CLAUDE.md re-embed bug. Previous version only refreshed the version stamp comment, leaving the embedded agents/link.md body unchanged after a git pull. New logic strips link.md frontmatter, builds a full BEGIN/END block (stamp + body), and atomically replaces everything between the markers using re.sub with re.DOTALL + lambda replacement (avoids backslash interpretation). Added post-write verification: grep CLAUDE.md for a string unique to the new version.',
      'plugin-update: Step 4b (NEW) + Step 5b — Agent Readiness Summary using brand-setup Step 8d spec; same readiness-first email + Slack format. Inputs come from Step 1 audit overlaid with Step 3 fix outcomes, so the matrix reflects post-fix state.',
    ],
  },
  {
    version: 'v2.4.0',
    date: 'May 07, 2026',
    changes: [
      '10 new business-operations skills shipped: apollo-lead-prospector, outreach-sequencer, proposal-generator (sales pipeline); customer-onboarder, churn-predictor (retention); invoice-collector, financial-reporter (back-office); competitor-monitor, investor-update-writer (strategy); meeting-analyzer (productivity)',
      'agents/link.md: rewritten from "marketing agent" → "business operations agent"; added 5 new context-file rows (sales.md, customer-success.md, finance.md, investors.md, operations.md); added 4 new skill chains (Sales pipeline, Customer retention, Monthly close, Strategic intelligence); added Apollo.io / Calendly / Stripe / Xero / Gamma MCP rows',
      'brand-setup: Step 5 expanded with 6 new sub-steps (5g sales, 5h customer-success, 5i finance, 5j investors, 5k operations, 5l competitors.md extension verification); Step 7 documents 7 new auto-bootstrapped Notion DB env vars; Step 8 adds probes for Apollo/Calendly/Stripe/Xero; Step 10 files[] block expanded',
      'brand-setup: full UX intro audit — added top-level "What this skill does" overview with 10-step time-budget table, plus per-step intro paragraphs across all 10 main steps and the 6 new sub-steps',
      'plugin-update: Step 1a/1d/1e/1j extended to detect new context files, env vars, MCPs, and skill versions; Step 3a/3e/3j extended with fill handlers and changelog → brand-action mappings for all 10 new skills; conditional consent gates added for investors.md and operations.md',
      'plugin-update: matching UX intro audit — top-level overview + per-step intros for all 6 steps with time estimates',
      'commit-to-git workflow: Step 4a hardened with env-var-first DB resolution (`AGENTS_LIBRARY_DB`) + fuzzy name search fallback + auto-persist of resolved ID — survives Notion DB renames and workspace moves',
      'commit-to-git skill + workflow: moved out of plugins/link-skills/ into the new gitignored /admin-skills/ + /workflow/ folders at repo root — release tooling separated from the marketplace plugin',
      'creative-designer: fixed is_vertical edge case where IG portrait 4:5 (1080×1350) was incorrectly receiving 9:16 safe zones; replaced with `is_story_reel = (target_h / target_w) >= 1.7`',
      'social-calendar + content-generator + background-generator: normalized Notion MCP tool prefix from legacy `mcp__notion__notion-*` to canonical `mcp__claude_ai_Notion__notion-*`; replaced obsolete `API-update-a-block` / `API-query-data-source` calls with current connector tools',
      'docs/metrics-spec.md: sanitized real campaign data, real spend numbers, and real competitive positioning from example payloads (Acme-style placeholders); plugin.json: replaced real Slack user ID example with generic format',
    ],
  },
  {
    version: 'v2.3.7',
    date: 'May 07, 2026',
    changes: [
      'content-generator: Step 4a safe zone table — added note clarifying Top 14% column applies to logo placement only, not text (add_text_overlay has no top constraint)',
      'content-generator + creative-designer: add_logo positions dict — added # NEVER USE comments on bottom-right and bottom-left entries; text always occupies the bottom zone so these positions are forbidden',
      'creative-designer: frontmatter description — removed stale "with Nano Banana Pro" (Nano Banana replaced by Gemini in v2.2.2)',
      'creative-designer: add_text_overlay prose note — clarified 18% safe-zone offset applies to 9:16 only; feed canvases use flat 60 px buffer instead',
      'creative-designer/style-guide.md — replaced "Nano Banana" brand name with "Claude\'s continue_editing" in two Don\'t rules (more durable phrasing)',
      'link.md: skills table — removed stale "with Nano Banana Pro" from creative-designer description row',
      'commit-to-git workflow — Step 3b: added "already bumped this session" rule (do not re-increment if maintenance sections were updated in the current session); Step 5a: added branch to use highest existing version instead of incrementing again',
    ],
  },
  {
    version: 'v2.3.2',
    date: 'May 06, 2026',
    changes: [
      'brand-setup: Arguments section added — /brand-setup -- project created skips Step 1a and starts at 1b, ensuring all setup steps run inside the project session',
      'brand-setup: Step 1a — after project creation, user is redirected into the project session to continue; session does not proceed in-place',
      'brand-setup: carousel + story design prompts (Step A) — added IMAGE SLOTS AND SIZE LIMIT paragraph banning embedded images/base64/bundled photos, mandating uploads/<slot>.png placeholder naming, enforcing 3 MB export limit',
      'brand-setup: Step 4c-i Step C — 3 MB size check added before shutil.copytree; if exceeded, blocks copy and surfaces claude.ai/design re-export prompt',
      'brand-setup: Step 4c-ii Step C — same 3 MB size check before copy with story-specific re-export prompt',
      'plugin-update: Step 3c upload sub-flow — step 0 size check (3 MB) added before zip/upload; blocks upload and surfaces re-export prompt if limit exceeded; Case 3 reference updated to Steps 0–5',
    ],
  },
];
