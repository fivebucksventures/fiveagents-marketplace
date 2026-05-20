---
name: creative-designer
description: Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation, text overlays and branding for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.7.0 | May 20, 2026 |

**Description:** Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation, text overlays and branding for any active brand

### Change Log

**v2.7.0** — May 20, 2026
- **Template-path migrated to fb.ai (`fivebucks_*`).** Step 4a now detects templates via `fivebucks_list_templates` (by `type`) and renders via `fivebucks_create_post` → `fivebucks_render_post` → re-host on Zernio — replacing the dead `template_list`/`template_render` + presign-slots flow. All four types supported (meta-carousel / meta-story / linkedin-post / meta-post). Canonical implementation lives in `content-generator/SKILL.md` Step 4c-template. The Gemini + Pillow fallback (Step 4b) is unchanged.

**v2.5.4** — May 16, 2026
- Change log history trimmed — housekeeping pass to keep file-level history compact. No functional change.

**v2.5.3** — May 12, 2026
- Step 4b Image prompt guidelines — new bullet enforces injecting the brand palette into the Gemini prompt using HEX tokens from Step 1 (design-system/ first when present, brand.md Colors fallback). Phrasing rules included (ambient-mood style, not literal swatches). Same Visual consistency rule as `agents/link.md` — never hardcode brand colors from memory.
- Step 4b Image prompt guidelines — clarifying callout added below the bullets: explains why the Pillow path uses `DejaVuSans-Bold` regardless of brand (universal rasterizer) and why colors are the lever for on-brand output here (adaptive sampling on the Gemini background).
- Why this matters: Step 1 already read design-system, but the Gemini prompt-construction guide didn't tell the model to use it. Closes the loop so design-system actually influences final image output.

**v2.5.2** — May 12, 2026
- `add_text_overlay` — feed `side_inset` increased from `pad // 2` to `pad + pad // 2` (~9% of canvas width, ~96–108 px). Restores breathing room on left/right edges and survives Instagram's profile-grid 4:5 recrop (~34 px side trim). Top/bottom/scrim_fade unchanged at `pad // 2`. **Reason:** v2.5.0's "uniform `pad // 2` on all four sides" regressed the IG profile-grid crop hardening that v2.4.8 introduced — symptom was headlines hugging the canvas edge on square feed posts (worse on IG than LinkedIn because LinkedIn doesn't aggressively recrop). Mirror of content-generator v2.5.2.
- `add_logo` — **unchanged.** Feed branch still uses uniform `pad // 2` on all four sides; logo padding is correct as-is. Text and logo feed insets now diverge on sides by design.
- Layout rules + Step 3b checklist + fix table — rewritten to reflect text/logo divergence on feed sides. Removed claims that "text and logo both" use the same feed inset. Any future "simplification" that re-aligns text feed sides with logo feed sides will reintroduce the bug — see this entry.

**v2.5.1** — May 10, 2026
- Step 4b (Gemini image generation) — defensive full-frame guard added for Story/Reel prompts: if the `image_brief` / prompt does not already contain `"fills the ENTIRE frame"`, wrap it in the Story composition template before calling `gemini_generate_image`. Prevents the bottom-void bug on any image generated via creative-designer directly (not routed through content-generator).

**v2.5.0** — May 08, 2026
- `add_text_overlay` — new `text_position` parameter (`'bottom'` default or `'top'`). Text and scrim anchor per position; gradient direction flips so the dark end is always on the same end as the text. Asserts are position-aware.
- `add_text_overlay` — refactored to **named per-canvas insets**: `top_inset`, `bottom_inset`, `side_inset`, `scrim_fade`. Single rule — 9:16 = Meta safe zones only (14% top, 13% bottom, 13% sides, `scrim_fade = 0`); feed = uniform `pad // 2` for all four. Eliminates legacy `safe_bottom_px` / `safe_side_px` / `scrim_h` naming.
- `add_logo` — restored `bottom-right` / `bottom-left` positions to enable bottom-anchored logo. Per-canvas insets follow the same rule (9:16 Meta = 14%/13%/13%; feed = uniform `pad // 2`).
- Day-of-week rotation table — `text_position` now alternates: Mon/Wed/Fri = bottom text + top-right logo; Tue/Thu/Sat = top text + bottom-left logo. **Tue/Thu/Sat posts will look different from prior versions.**
- Layout rules + Step 4a/4b narratives + Step 3b checklist + fix table — rewritten to reflect named insets, top/bottom text, rotated logo placements.
- Bug fix: empty `Step 5: Run quality checklist` heading deleted; Argil section renumbered Step 6 → Step 5.
- Bug fix: avatar table in the Argil section had a duplicated empty header above the populated rows; merged.
- Bug fix: broken cross-references — `(Step 4f)` (line 273) and `(Step 4d)` / `(Step 4e)` (lines 275, 815) pointed to step IDs that exist in content-generator but not creative-designer; rewritten to refer to the actual sections inside creative-designer.
- Bug fix: rotation-rule sentences referenced only `text_align` and `logo_position`; added `text_position` to match the new rotation.

**v2.4.8** — May 08, 2026
- `add_text_overlay` — bottom inset tuned to push text closer to the canvas edge:
  - **9:16:** `0.18` → `0.13` (now matches Meta's published safe zone — 250 px on 1920 canvas — instead of the previous conservative 346 px). Text bottom moves down by 96 px.
  - **Feed:** `pad` → `pad // 2` (~32–36 px instead of ~65–72 px). Text bottom moves down by 32–36 px on every feed canvas. Side inset stays at `pad` (still survives IG profile-grid 3:4 cropping ~34 px side trim).
- Layout rules section + Step 2 narrative + Step 3b checklist + fix table — wording and numeric references updated to match the new values; rationale cites Meta's "central 1080×1420" rule.

# Creative Designer Skill

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are a visual art director for the active brand. Your job is to design on-brand marketing assets using HTML/CSS, produce detailed design specifications, and create visual mockups for web, email, and social contexts. All designs must follow the active brand's system (colors, typography, aesthetic — from `brands/{brand}/brand.md`) and serve a specific persona and campaign goal.

---

## When to use

Use this skill when the task involves:
- Designing HTML/CSS landing pages or sections
- Creating email template layouts
- Producing visual ad mockups (static)
- Generating AI avatar video ads via Argil API
- Designing social media graphics (LinkedIn banners, Twitter cards)
- Building comparison tables or feature highlight layouts
- Generating design specifications for a developer to implement
- Creating branded document templates (reports, one-pagers)

Do NOT use this skill for:
- Writing copy to go inside the design → use content-creation first
- Building full campaign strategy → use research-strategy first
- Creating presentation slide decks → use campaign-presenter
- Analyzing campaign performance → use data-analysis

---

## Inputs required

Before starting, confirm these inputs with the user:

| Input | Required | Notes |
|-------|----------|-------|
| Asset type | Yes | Landing page, email, ad, social graphic, one-pager, etc. |
| Target persona | Yes | Reference brands/{brand}/audience.md |
| Campaign / purpose | Yes | What this asset is for |
| Key message / headline | Yes | Get from content-creation or user |
| Dimensions / format | Optional | Defaults listed in design constraints below |
| Output type | Optional | HTML/CSS code, design spec, or visual mockup description |

---

## Design constraints

### Brand system — `brands/{brand}/design-system/` is the source of truth WHEN PRESENT

The Claude Design system optionally installed in `brand-setup` Step 4b is the authoritative visual reference when present. **Read it before applying colors, typography, layout, or component styles.** When absent, fall back to `brand.md` colors and Google Fonts identified during brand-setup Step 4 — never block.

1. **First** read `brands/{brand}/design-system/` if it exists — list its files, then read the entry HTML/CSS (typically `index.html`, `styles.css`, or `tokens.json`). Extract:
   - Color tokens (CSS variables, palette HEX codes)
   - Typography (font-family, weight scale, size scale)
   - Component styles (buttons, cards, headers, badges)
   - Spacing scale (gaps, padding, border-radius)
2. **Then** read `brands/{brand}/brand.md` for voice/tone, approved phrases, Do/Don't rules — and (when design-system/ is missing) for canonical colors and the Google Font name.

If `brands/{brand}/design-system/` does not exist, **continue** — derive colors and fonts from `brand.md` and proceed. You may suggest the user run `/link-skills:brand-setup` Step 4b for tighter brand consistency, but it is not a hard block.

Never hardcode colors or fonts from memory. Always derive them from `design-system/` (preferred) or `brand.md` (fallback). If the design system and `brand.md` disagree on colors/fonts, the design system wins and `brand.md` should be updated to match.

### Optional fb.ai social templates

Up to four optional Claude Design templates may exist for a brand, hosted on **fb.ai** (installed via brand-setup Step 4c, discovered via the gateway `fivebucks_list_templates` tool — needs `FIVEBUCKS_API_KEY`):

| Template `type` | Used for | Fallback if missing |
|---|---|---|
| `meta-carousel` (4:5) | IG + FB carousel posts (Cover + 4 value slides + CTA) | Gemini + Pillow text/logo overlay using design-system / brand.md colors |
| `meta-story` (9:16) | IG + FB Stories + Reels (Hook→…→CTA, directions A/B/C) | Same Gemini + Pillow fallback |
| `linkedin-post` (4:5) | LinkedIn single-image feed posts (directions A/B/C) | Same Gemini + Pillow fallback |
| `meta-post` (4:5) | IG + FB single-image feed posts (directions A/B/C) | Same Gemini + Pillow fallback |

fb.ai renders each template server-side and returns signed PNG URLs — no local Playwright, no local template files. See "Render via template" in Step 4a. If no matching template exists (or `FIVEBUCKS_API_KEY` is unset), fall through to Step 4b's Gemini-only pipeline — never block.

### Standard asset dimensions (platform-fixed — same across all brands)
| Asset | Dimensions | Notes |
|-------|-----------|-------|
| Landing page hero | Full width × 600-800px height | |
| Email header | 600px wide × 200px height | |
| LinkedIn banner | 1584px × 396px | |
| LinkedIn post image | 1200px × 628px | Landscape — highest CTR for B2B feed |
| Facebook post image | 1200px × 630px | Landscape for link posts |
| Facebook Story | 1080px × 1920px | 9:16 vertical — same as Instagram Story |
| Facebook Reel | 1080px × 1920px | 9:16 vertical |
| Instagram post (square) | 1080px × 1080px | Standard feed |
| Instagram post (portrait) | 1080px × 1350px | More feed real estate, better reach |
| Instagram Story | 1080px × 1920px | 9:16 vertical |
| Instagram Reel | 1080px × 1920px | 9:16 vertical |
| Twitter/X card | 1200px × 628px | |
| Google display ad (leaderboard) | 728px × 90px | |
| Google display ad (rectangle) | 300px × 250px | |

### Layout rules (same across all brands)
- Max content width: 1200px centered
- Section padding: 64px vertical (desktop), 40px (mobile)
- Card padding: 24-32px
- Border radius: 8-12px for cards, 6px for buttons
- Use subtle box shadows: `0 1px 3px rgba(0,0,0,0.1)`
- White space is a feature — never overcrowd sections
- **Inset rule — Story/Reel = Meta safe zones only; Feed text = asymmetric (larger sides); Feed logo = uniform `pad // 2`:**
  - **9:16 Story/Reel** (text and logo both): top = `int(h * 0.14)` (~269 px on 1920) — Stories profile header; bottom = `int(h * 0.13)` (~250 px) — Reels UI stack; sides = `int(w * 0.13)` (~140 px) — Reels right-rail. Scrim fade = 0 (no `pad` anywhere in 9:16 geometry).
  - **Feed posts (IG, FB, LinkedIn, X) — TEXT:** top = bottom = scrim_fade = `pad // 2` (~32–36 px); sides = `pad + pad // 2` (~96–108 px). Sides are intentionally larger — Instagram's profile-grid view recrops square feed posts to 4:5 portrait, trimming ~34 px per side; the extra side inset guarantees text survives the crop with visible breathing room. **Do not "simplify" to uniform `pad // 2`** — that regressed v2.4.8 hardening (see v2.5.2 changelog).
  - **Feed posts (IG, FB, LinkedIn, X) — LOGO:** top = bottom = sides = `pad // 2` (~32–36 px). Logo is small relative to canvas, so the IG profile-grid crop doesn't impact it; uniform pad-derived inset reads as intentional corner placement. Text and logo diverge on sides by design.
- **Text and logo always on opposite vertical ends** — never on the same row. Mon/Wed/Fri = bottom text + top-right logo; Tue/Thu/Sat = top text + bottom-left logo. Day-of-week rotation lives in content-generator Step 4b.
- **Gradient scrim direction depends on `text_position`:** bottom-anchored text → scrim runs `scrim_top → target_h` (alpha 0→230). Top-anchored text → scrim runs `0 → text_bottom + scrim_fade` (alpha 230→0). The dark zone is always on the same end as the text.

---

## Step-by-step workflow

### Step 1: Read brand and content context
- **brands/{brand}/design-system/** — Claude Design visual system (read first when present — authoritative for colors, fonts, components, spacing). When absent, skip and use brand.md fallback.
- **brands/{brand}/brand.md** — Voice, tone, approved phrases, Do/Don't rules; also canonical colors and Google Font name (used as fallback when design-system/ is absent)
- **skills/creative-designer/style-guide.md** — Generic fallback rules (use only when both design-system/ and brand.md are silent on a topic)
- Confirm the headline and key message (from content-creation or user input)
- Call `fivebucks_list_templates` once (cache for the run) and note which template `type`s exist on fb.ai: `meta-carousel`, `meta-story`, `linkedin-post`, `meta-post`. (Skip if `FIVEBUCKS_API_KEY` is unset → image-path only.)

### Step 2: Define the layout structure
Sketch the component hierarchy before writing code:
- What sections does this asset need? (hero, features, social proof, CTA, footer)
- What is the visual hierarchy? (What should the eye land on first?)
- What components are needed? (cards, comparison table, icon grid, testimonial block, etc.)

### Step 3: Apply brand system
- Assign brand colors to each component role (primary, secondary, background, text)
- Apply typography scale consistently
- Ensure white space and padding follow layout rules

### Step 4: Build the asset
For HTML/CSS output:
- Write semantic HTML5 with inline or embedded CSS
- Ensure responsive layout (mobile-first where relevant)
- Use flexbox or grid for layout
- Do not rely on external CSS libraries unless the user specifies Tailwind CSS

For design spec output:
- Describe each section with: dimensions, colors (hex), font sizes, spacing, and component type
- Include copy placeholders clearly marked

### Step 4a: Render via fb.ai template if available

Before falling through to Gemini-only image generation (Step 4b — the universal fallback), branch on asset type. "A `<type>` template exists" = it appeared in the cached `fivebucks_list_templates` result (Step 1).

**Decision tree:**

```
asset_type == "carousel" AND platform in {instagram, facebook} AND a meta-carousel template exists → render via template
asset_type in {"story","reel"} AND platform in {instagram, facebook} AND a meta-story template exists → render via template
asset_type == "post" AND platform in {instagram, facebook} AND a meta-post template exists → render via template
asset_type == "post" AND platform == linkedin AND a linkedin-post template exists → render via template
all other cases (banners, ads, mockups, no matching template) → fall through to Step 4b (Gemini + Pillow text + Pillow logo)
```

**Render via fb.ai (`fivebucks_*`). No local Playwright, no Pillow on this path.** The template lives on fb.ai (installed via brand-setup Step 4c). **For the canonical implementation see `content-generator/SKILL.md` Step 4c-template** — both skills follow the same procedure:

1. `fivebucks_list_templates` (cached) → pick the template whose `type` matches; read its `manifest` (fields + image slots + slides). If none, fall through to Step 4b.
2. Build `overrides` from the post copy (manifest field keys; skip `bound:false`, `select` values from `options`). Set direction: `_direction` (A/B/C) for meta-story; un-prefixed `direction` (A/B/C) for linkedin-post / meta-post; `coverVariant` / `bodyVariant` for meta-carousel if present.
3. (Optional) assign photos via the fb.ai media library (`fivebucks_presign_media_upload` → `requests.put` → `fivebucks_confirm_media_upload` → `"media:{fileId}"`); otherwise leave image slots empty (template renders its placeholder).
4. `fivebucks_create_post(template_id, name, overrides)` → `fivebucks_render_post(post_id)` → 1-hour signed PNG URLs.
5. Re-host each PNG on Zernio (`late_presign_upload` + `requests.put`) and use those URLs for the post. Skip Steps 4d/4e (Pillow overlays — fb.ai render includes all chrome).
6. On quota / 5xx error: fall through to Step 4b (Gemini + Pillow fallback).

After the template-path completes, continue to the upload step further down in this section — do NOT re-run Step 4b's Gemini path; the template-path has already produced final assets.

**The Gemini + Pillow fallback in Step 4b remains the universal path** for: banners, ads, mockups, any post with no matching fb.ai template (or when `FIVEBUCKS_API_KEY` is unset), and any failure (quota / 5xx) on the template-path. That fallback path applies the Pillow text overlay AND Pillow logo overlay (both inside Step 4b) — both required since the Gemini-generated background has no copy and no logo. The day-of-week `text_align`, `text_position`, and `logo_position` rotations apply only on this Step 4b path.

---

### Step 4b: Generate images via Gemini API

**Core principle: Visual = emotion. Text = punchline.**
The image must stop the scroll and evoke a feeling *before* the viewer reads a single word. Text overlays sharpen the message — they never explain what the image already shows.

Use **Gemini image generation** for assets that need real imagery — scenes, people, environments, data visualizations. Do NOT use Gemini for pure typographic/text-only graphics (use HTML/CSS for those instead).

**Story/Reel full-frame guard — apply BEFORE building the Gemini prompt:**

For Story and Reel assets (9:16, 1080×1920), the generated image must fill the entire canvas — no flat-colour void in the lower half. If the image prompt/brief does not already contain `"fills the ENTIRE frame"`, wrap it now:

```python
STORY_FULLFRAME_TEMPLATE = (
    "Photorealistic, full-bleed vertical portrait image for a 9:16 social media Story. "
    "{SCENE_DESCRIPTION}. The scene fills the ENTIRE frame from top to bottom — no empty areas, "
    "no plain backgrounds, no flat colour zones anywhere in the image. Rich environmental detail "
    "in the upper, middle, AND lower thirds of the frame. Cinematic lighting, editorial quality. "
    "Shot as if for a magazine cover in portrait orientation. "
    "Do not include any text, logos, or UI elements."
)

# Use canvas ratio as the primary signal — works whether asset_type is set or not.
# 9:16 = 1.778; IG portrait 4:5 = 1.25 (feed treatment, no wrap needed).
_asset_label = (asset_type or "").lower() if 'asset_type' in dir() else ""
is_story_reel = _asset_label in ("story", "reel") or (target_h / target_w) >= 1.7
if is_story_reel and "fills the ENTIRE frame" not in image_prompt:
    image_prompt = STORY_FULLFRAME_TEMPLATE.format(SCENE_DESCRIPTION=image_prompt)
```

Use `image_prompt` (the potentially-wrapped version) as the `prompt` argument to `gemini_generate_image`.

```
Use gateway MCP tool `gemini_generate_image`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- prompt: "<your image prompt>"
- aspect_ratio: match target canvas (e.g. "1:1" for IG square, "9:16" for Story/Reel, "191:100" for LinkedIn)
- model: "gemini-3.1-flash-image-preview"

Tool returns JSON text: { "image_base64": "...", "mime_type": "...", "description": "..." }
Result is auto-saved to a temp file. Use Python to locate and decode it:

```python
import glob, json, base64, os
result_file = max(glob.glob('/sessions/*/mnt/.claude/projects/*/tool-results/mcp-*gemini_generate_image*.txt'), key=os.path.getmtime)
with open(result_file) as f:
    parsed = json.loads(json.load(f)[0]['text'])
with open('outputs/{brand}/posts/{Platform}/tmp_image.png', 'wb') as f:
    f.write(base64.b64decode(parsed['image_base64']))
```

If user has selected a folder, save directly to `outputs/{brand}/posts/{Platform}/` — not a temp path.
```

If the tool returns a rate limit error, wait 60 seconds and retry once.

**IMPORTANT — Never use Nano Banana / `continue_editing` for text overlays.**

Use **Python Pillow** for all text overlay and logo compositing (see Steps 2 and 3 below). Do NOT use `image_add_text_overlay` or `image_add_logo` gateway MCP tools — they require passing large base64 strings through context, which exceeds Cowork limits.

**5 proven image patterns (adapt messaging to active brand):**

| Pattern | Visual | Text punchline |
|---------|--------|----------------|
| **Pain Moment** | Frustrated person, multiple screens, overwhelm | "You don't need more tools. You need one that does it all." |
| **Before/After** | Split: chaos left, clean dashboard right | "From this → to this. One platform." |
| **Bold Stat** | One huge number, almost nothing else | "Your next customer is already in here." |
| **Social Proof** | Real person quote + result metric overlay | Let the quote speak |
| **Aha Insight** | Chart or trend showing AI search taking over | "Is your business invisible to AI?" |

**When to use each pattern:**
- Pain Moment → awareness campaigns, cold audience, top of funnel
- Before/After → consideration, retargeting, mid-funnel
- Bold Stat → trust-building, LinkedIn, B2B decision makers
- Social Proof → bottom of funnel, conversion campaigns
- Aha Insight → thought leadership, LinkedIn, SEO/marketing personas

**Platform visual strategy:**
| Platform | Best pattern | Text density on image | Why |
|---|---|---|---|
| LinkedIn | Bold Stat, Aha Insight, Pain Moment | Medium — headline + brand mark | B2B audience reads; credibility-first |
| Facebook | Pain Moment, Before/After | Medium — benefit + proof element | Thumb-stop visual; emotion-led |
| Instagram | Bold Stat, Pain Moment | Low — 3–5 words max | Visual-first feed; text kills reach |

**Image prompt guidelines:**
- Lead with the **scene/feeling**, not the brand: "Frustrated professional at desk..." not "[brand] ad..."
- Specify **cinematic, photorealistic, editorial photography style** for people/scenes
- Specify **abstract, data visualization, geometric** for non-people visuals
- Include **lighting/mood**: "dimly lit, blue screen glow, night" or "bright, clean, modern office"
- **Inject the brand palette into the prompt** using the colors extracted at Step 1 — `design-system/` HEX tokens when present, `brand.md` Colors section when fallback. Phrase as ambient mood: "warm tones around #ec4899 / muted slate around #0f172a" or "rich teal accents (#0d9488) on a near-black background (#0a0a0a)". This is how Gemini matches the brand without ever putting the literal HEX swatches into the image. Never hardcode brand colors from memory — same Visual consistency rule as `agents/link.md`.
- **No text, no logos, no brand name in the image** — text and logo are composited after using gateway tools
- Always end prompt with: **"No text in the image. No logos. No watermarks."**
- Do NOT use `continue_editing` for text — use Python Pillow (Step 2) instead

> **About fonts on the Pillow path:** the text overlay uses `DejaVuSans-Bold` as a stable cross-platform rasterizer regardless of brand. The design-system font names are for Canva, HTML mockups, and any path that can actually load arbitrary fonts. The Pillow path matches the brand via *colors* (adaptive sampling on the Gemini background) — getting the brand palette into the Gemini prompt is what makes the final composite feel on-brand.

**Example prompts by pattern:**

*Pain Moment:*
> "Photorealistic editorial photo: frustrated young professional at cluttered desk, multiple monitors showing different SaaS dashboards, hands on head in stress, dimly lit room with blue screen glow, sticky notes everywhere, cinematic shallow depth of field, dramatic moody lighting. No text in the image. No logos. No watermarks."

*Aha Insight:*
> "Abstract data visualization: upward trending graph splitting into two paths — traditional Google search and AI chat interfaces (represented as glowing nodes), dark navy background, purple and pink gradient lines, clean minimal style. No text in the image. No logos. No watermarks."

*Bold Stat:*
> "Dramatic close-up of a glowing purple number '275M' floating in dark space, abstract particle field background in purple and pink tones, cinematic lighting, square format. No text other than the number. No logos. No watermarks."

**Rate limit rule — ALWAYS follow this sequence when generating multiple images:**
1. Generate image 1 → apply text overlay → apply logo → save to `outputs/` → upload to Zernio
2. Wait ~15 seconds before next generation (API allows 10 IPM; 15s is a safe buffer)
3. Generate image 2 → apply text overlay → apply logo → save → upload to Zernio
4. Repeat

Never generate multiple images in parallel or back-to-back. One at a time with a short pause. If a 429 RESOURCE_EXHAUSTED error occurs, wait 60 seconds and retry once.

**Full pipeline — run ALL steps in order for every image:**

**Step 1 — Generate image:**
```
gemini_generate_image → result auto-saved to temp file → Python decodes to PNG on disk
```
See instructions above for the Python decode snippet. Save the PNG to `outputs/{brand}/posts/{Platform}/` immediately.

**Step 2 — Text overlay (gradient scrim + headline + subline) — USE PILLOW:**

```python
from PIL import Image, ImageDraw, ImageFont, ImageStat

def add_text_overlay(input_path, output_path, headline, subline, target_w, target_h,
                     text_align='center', text_position='bottom'):
    img = Image.open(input_path).convert('RGBA')
    # Scale and center-crop to exact canvas
    r = img.width / img.height; tr = target_w / target_h
    if r > tr: nw = int(img.width * target_h / img.height); nh = target_h
    else: nw = target_w; nh = int(img.height * target_w / img.width)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw-target_w)//2, (nh-target_h)//2, (nw-target_w)//2+target_w, (nh-target_h)//2+target_h))

    pad = int(target_w * 0.06)
    # Per-canvas insets — Story/Reel uses Meta safe zones only; Feed uses pad-derived only.
    # is_story_reel: True only for 9:16 (ratio ≥ 1.78). IG portrait 4:5 = 1.25 → feed treatment.
    # target_h > target_w is NOT sufficient: IG portrait (1080×1350) would wrongly get 9:16 safe zones.
    is_story_reel = (target_h / target_w) >= 1.7
    if is_story_reel:
        # Meta-spec safe zones (matches "central 1080x1420 of 1080x1920" rule)
        top_inset    = int(target_h * 0.14)   # Stories profile header clearance
        bottom_inset = int(target_h * 0.13)   # Reels UI stack clearance
        side_inset   = int(target_w * 0.13)   # Reels right-rail clearance
        scrim_fade   = 0                       # no extra pad transition past text edge
    else:
        # Feed — asymmetric: top/bottom/scrim_fade = pad // 2; sides = pad + pad // 2.
        # Sides need extra room: IG profile-grid view recrops square feed posts to 4:5,
        # trimming ~34 px per side. pad // 2 (~32 px) gets entirely consumed by that crop.
        # Logo (add_logo) stays at uniform pad // 2 — text and logo diverge on sides by design.
        # Do NOT "simplify" sides back to pad // 2 — that regressed v2.4.8 hardening (see v2.5.2).
        top_inset    = pad // 2
        bottom_inset = pad // 2
        side_inset   = pad + pad // 2          # ~9% of width; survives IG profile-grid crop
        scrim_fade   = pad // 2               # gradient transition past the text edge

    hs = max(36, int(target_w * 0.048))
    ss2 = max(22, int(target_w * 0.026))
    try:
        fh = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', hs)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', ss2)
    except:
        fh = fs = ImageFont.load_default()

    # Pixel-width-aware wrapping — no character-count heuristic.
    # Uses a throwaway draw context for measurement; avail_w is exact canvas space.
    _tmp = Image.new('RGBA', (target_w, target_h))
    draw_tmp = ImageDraw.Draw(_tmp)
    avail_w = target_w - 2 * side_inset

    def wrap_to_fit(text, font, max_w, draw):
        """Wrap text word-by-word so no rendered line exceeds max_w pixels."""
        words = text.split()
        lines = []
        current = ""
        for word in words:
            test = (current + " " + word).strip()
            if draw.textbbox((0, 0), test, font=font)[2] <= max_w:
                current = test
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines or [text]

    h_lines = wrap_to_fit(headline, fh, avail_w, draw_tmp)
    s_lines = wrap_to_fit(subline,  fs, avail_w, draw_tmp)

    # Measure total text block height
    line_gap = int(hs * 0.3)
    block_h = len(h_lines) * (hs + line_gap) + int(hs * 0.5) + len(s_lines) * (ss2 + line_gap)

    # Anchor text + scrim based on text_position. Scrim runs from the canvas edge (on text side)
    # past the text by `scrim_fade`, so the gradient fades into the un-darkened image.
    if text_position == 'bottom':
        text_bottom  = target_h - bottom_inset
        text_y       = text_bottom - block_h
        scrim_top    = text_y - scrim_fade
        scrim_bottom = target_h
    else:  # 'top'
        text_y       = top_inset
        text_bottom  = text_y + block_h
        scrim_top    = 0
        scrim_bottom = text_bottom + scrim_fade

    # Geometric invariants — crash loudly on regression instead of shipping a silently-wrong image.
    assert text_y >= 0, \
        f"text overflows canvas top — block_h={block_h} too large for available space; reduce headline/subline length or font size"
    assert text_bottom <= target_h, \
        f"text overflows canvas bottom — block_h={block_h} too large for available space; reduce headline/subline length or font size"
    if text_position == 'bottom':
        assert text_y + block_h == target_h - bottom_inset, \
            f"text bottom must equal target_h - bottom_inset (got {text_y + block_h}, expected {target_h - bottom_inset})"
        assert scrim_top + scrim_fade == text_y, \
            f"scrim must have exactly `scrim_fade` above text (scrim_top={scrim_top}, text_y={text_y}, scrim_fade={scrim_fade})"
        assert scrim_bottom == target_h, \
            f"gradient must run to canvas bottom for bottom-anchored text (scrim_bottom={scrim_bottom}, target_h={target_h})"
    else:  # 'top'
        assert text_y == top_inset, \
            f"text top must equal top_inset (got text_y={text_y}, expected {top_inset})"
        assert scrim_top == 0, \
            f"gradient must start at canvas top for top-anchored text (scrim_top={scrim_top})"
        assert scrim_bottom - scrim_fade == text_bottom, \
            f"scrim must have exactly `scrim_fade` below text (scrim_bottom={scrim_bottom}, text_bottom={text_bottom}, scrim_fade={scrim_fade})"

    # Sample the underlying image in the actual text zone BEFORE the scrim is applied.
    sample = img.convert('RGB').crop((
        side_inset, max(0, text_y),
        target_w - side_inset, min(target_h, text_bottom)
    ))
    bg_brightness = ImageStat.Stat(sample.convert('L')).mean[0]
    # The heavier scrim (max alpha 230/255) darkens this zone to ~40% of the original brightness on average.
    # Choose text colors based on the estimated post-scrim brightness.
    if bg_brightness * 0.40 < 85:   # dark result → light text
        headline_color = (255, 255, 255, 255)   # white
        subline_color  = (236, 72, 153, 255)    # pink #ec4899
    else:                            # light result → dark text
        headline_color = (15, 15, 15, 255)      # near-black
        subline_color  = (185, 28, 96, 255)     # dark pink #be185d

    # Gradient direction depends on which end the text is on:
    #   text at bottom → alpha 0 at scrim_top, 230 at scrim_bottom (dark zone is bottom)
    #   text at top    → alpha 230 at scrim_top, 0 at scrim_bottom (dark zone is top)
    scrim = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scrim)
    span = max(1, scrim_bottom - scrim_top)
    for y in range(scrim_top, scrim_bottom):
        if text_position == 'bottom':
            alpha = int(230 * (y - scrim_top) / span)
        else:  # top
            alpha = int(230 * (scrim_bottom - y) / span)
        ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)

    def get_x(lw):
        if text_align == 'left':  return side_inset
        if text_align == 'right': return target_w - lw - side_inset
        return (target_w - lw) // 2  # center

    # Draw headline lines
    for line in h_lines:
        bbox = draw.textbbox((0, 0), line, font=fh)
        lw = bbox[2] - bbox[0]
        draw.text((get_x(lw), text_y), line, font=fh, fill=headline_color)
        text_y += hs + line_gap

    text_y += int(hs * 0.3)  # gap between headline and subline

    # Draw subline lines
    for line in s_lines:
        bbox = draw.textbbox((0, 0), line, font=fs)
        lw = bbox[2] - bbox[0]
        draw.text((get_x(lw), text_y), line, font=fs, fill=subline_color)
        text_y += ss2 + line_gap

    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

Font: DejaVuSans-Bold for headline, DejaVuSans for subline.
Text colors are chosen adaptively by sampling the image brightness in the text zone before the scrim is applied:
- **Dark background** (estimated post-scrim brightness < 85): white headline `#ffffff` + pink subline `#ec4899`
- **Light background** (estimated post-scrim brightness ≥ 85): near-black headline `#0f0f0f` + dark-pink subline `#be185d`

`text_align` (left/center/right) and `text_position` (top/bottom) both come from the day-of-week rotation. On 9:16 canvases Meta safe zones (14% top / 13% bottom / 13% sides) position the text and the gradient meets the text edge with no transition padding. On feed canvases the inset is **asymmetric**: top + bottom + scrim_fade are `pad // 2` (~3% of width, ~32–36 px), but sides are `pad + pad // 2` (~9% of width, ~96–108 px) so the text survives Instagram's profile-grid 4:5 recrop (~34 px side trim). `pad // 2` of gradient fade extends past the text edge into the un-darkened image. The dark end of the scrim always sits on the same end as the text — bottom-anchored text → gradient hits `target_h`; top-anchored text → gradient starts at y=0.

| Format | target_w | target_h |
|--------|----------|----------|
| LinkedIn Post | 1200 | 628 |
| Facebook Post | 1200 | 630 |
| Instagram Post (square) | 1080 | 1080 |
| Instagram Post (portrait) | 1080 | 1350 |
| Instagram / Facebook Reel | 1080 | 1920 |
| Instagram / Facebook Story | 1080 | 1920 |

**Day-of-week layout rotation** (text and logo always on opposite vertical ends):
| Day | text_align | text_position | logo_position |
|-----|------------|---------------|---------------|
| Mon | left | bottom | top-right |
| Tue | center | top | bottom-left |
| Wed | right | bottom | top-right |
| Thu | left | top | bottom-left |
| Fri | center | bottom | top-right |
| Sat | right | top | bottom-left |

**Step 3 — Logo overlay (brand mark) — USE PILLOW:**

```python
from PIL import Image

def add_logo(image_path, output_path, logo_path, position='top-right', scale=0.18):
    img = Image.open(image_path).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')
    logo = logo.crop(logo.getbbox())                # strip transparent padding BEFORE dimension calc
    cropped_w, cropped_h = logo.size                # capture for aspect-ratio assertion
    assert cropped_w > 0 and cropped_h > 0, \
        f"cropped logo has zero dimension ({cropped_w}x{cropped_h}); check logo file integrity"
    w, h = img.size
    logo_w = int(w * scale)
    logo_h = int(logo.height * logo_w / logo.width)  # aspect ratio preserved from cropped logo
    # Geometric invariant — fail loudly if anyone reorders the crop/resize and distorts the mark.
    assert abs((logo_w / logo_h) - (cropped_w / cropped_h)) / (cropped_w / cropped_h) < 0.01, \
        f"logo resize distorts aspect ratio — logo.crop(getbbox()) must run BEFORE logo_w/logo_h " \
        f"(cropped {cropped_w}/{cropped_h}={cropped_w/cropped_h:.3f}, resize {logo_w}/{logo_h}={logo_w/logo_h:.3f})"
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    # Per-canvas logo insets — Story/Reel uses Meta safe zones; Feed uses uniform pad // 2.
    # Logo can sit at top OR bottom (selected by `position`); insets defined for both ends.
    pad = int(w * 0.06)                 # matches definition in add_text_overlay
    is_story_reel = (h / w) >= 1.7
    if is_story_reel:
        top_inset    = int(h * 0.14)   # Stories profile header clearance
        bottom_inset = int(h * 0.13)   # Reels UI stack clearance
        side_inset   = int(w * 0.13)   # Reels right-rail clearance
    else:
        top_inset    = pad // 2
        bottom_inset = pad // 2
        side_inset   = pad // 2
    top_y    = top_inset
    bottom_y = h - logo_h - bottom_inset
    positions = {
        'top-right':    (w - logo_w - side_inset, top_y),
        'top-left':     (side_inset, top_y),
        'bottom-right': (w - logo_w - side_inset, bottom_y),
        'bottom-left':  (side_inset, bottom_y),
    }
    x, y = positions[position]
    img.paste(logo, (x, y), logo)
    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

Logo path: `brands/{brand}/logo.png`. Scale: 0.18. `position` from day-of-week rotation — `"top-right"` (Mon/Wed/Fri, paired with bottom text) or `"bottom-left"` (Tue/Thu/Sat, paired with top text). Logo and text always occupy opposite vertical ends; never both top, never both bottom.
This is the standard final step for ALL social images.

**Step 3b — Visual verification (MANDATORY before uploading to Zernio):**

Read the final image and visually inspect it. Check every item below. Determine canvas type first: **9:16** = 1080×1920 (Story/Reel); **Feed** = all other formats.

**Text — position and inset (9:16 = Meta safe zones; feed = asymmetric pad-derived — larger sides):**
- [ ] Text block is at the **top OR bottom** matching `text_position` from the day-of-week rotation — never both ends, never mid-canvas
- [ ] Text alignment matches the day-of-week rotation: left (Mon/Thu), center (Tue/Fri), right (Wed/Sat)
- [ ] **9:16 (text at bottom — Mon/Wed/Fri):** bottom of text block is ~250 px (13%) from canvas bottom — clears Reels UI stack
- [ ] **9:16 (text at top — Tue/Thu/Sat):** top of text block is ~269 px (14%) from canvas top — clears Stories profile header
- [ ] **9:16:** text stays within ~140 px (13%) side margins — clears Reels right-rail
- [ ] **Feed:** text has `pad // 2` (~32–36 px) inset on top + bottom, and `pad + pad // 2` (~96–108 px) inset on sides — sides intentionally larger to survive IG profile-grid 4:5 recrop (~34 px side trim)
- [ ] **Gradient scrim reaches the canvas edge on the text side** — bottom-anchored text → scrim hits `target_h`; top-anchored text → scrim starts at y=0

**Text — legibility and color:**
- [ ] Headline is fully visible — no characters clipped at left, right, or bottom
- [ ] Subline is fully visible — not cut off
- [ ] Text color scheme is correct for the background: **dark zone** → white headline + pink `#ec4899` subline; **light zone** → near-black headline + dark-pink `#be185d` subline
- [ ] Scrim gradient provides enough contrast — text is clearly readable against the background

**Logo — position (always opposite end from text):**
- [ ] Logo position matches the day-of-week rotation: top-right (Mon/Wed/Fri, paired with bottom text); bottom-left (Tue/Thu/Sat, paired with top text)
- [ ] Logo and text occupy **separate vertical ends** — never both top, never both bottom
- [ ] **9:16:** logo top = `int(h * 0.14)` (~269 px), logo bottom = `h - logo_h - int(h * 0.13)` (~250 px from bottom), logo sides = `int(w * 0.13)` (~140 px) — Meta safe zones
- [ ] **Feed:** logo top + bottom + side = `pad // 2` (~32–36 px) — uniform pad-derived margin
- [ ] Logo is fully visible — not clipped by any edge
- [ ] Logo has sufficient contrast against the background behind it
- [ ] Logo corner margin looks visually balanced — top/bottom gap ≈ side gap

**Overall composition:**
- [ ] Text and logo occupy opposite vertical ends per the day-of-week rotation — they do not overlap and are visually separated
- [ ] The image looks intentional and on-brand — not accidental or broken

**If any check fails, fix before uploading:**

| Issue | Fix |
|---|---|
| **Text at wrong end of canvas** | Pass `text_position='top'` or `'bottom'` per the day-of-week rotation; re-render |
| **Text too close to bottom edge (9:16)** | Verify `bottom_inset = int(target_h * 0.13)` (Meta-spec — Reels UI stack); re-render |
| **Text too close to top edge (9:16)** | Verify `top_inset = int(target_h * 0.14)` (Meta-spec — Stories profile header); re-render |
| **Text too close to sides (9:16)** | Verify `side_inset = int(target_w * 0.13)` (Meta-spec — Reels right-rail); re-render |
| **Gradient has visible gap at canvas edge** | Bottom text → `scrim_bottom == target_h`; top text → `scrim_top == 0`. Gradient must reach the canvas edge on the text side; re-render |
| **Feed text top/bottom not at `pad // 2`** | Confirm feed branch sets `top_inset = bottom_inset = scrim_fade = pad // 2`; re-render |
| **Feed text sides too tight / clipped in IG profile grid** | Confirm feed branch sets `side_inset = pad + pad // 2` (~96–108 px). Do NOT "simplify" to `pad // 2` — that gets consumed by IG's profile-grid 4:5 recrop (~34 px side trim). See v2.5.2 changelog. Re-render. |
| Wrong text alignment for the day | Check day-of-week and pass correct `text_align` (`'left'`/`'center'`/`'right'`) to `add_text_overlay`; re-render |
| Wrong text color scheme | Adjust the brightness multiplier in `add_text_overlay` (change `0.40` up/down to shift the threshold); re-render |
| Subline illegible against busy or light bg | Increase scrim max-alpha — change `230` to `245` in the gradient loop; re-render |
| Headline clipped at sides | Increase `side_inset` by 20 px and re-render |
| Headline clipped at top/bottom of canvas (block too tall for canvas) | Reduce `hs` by 10% and re-render — happens when `block_h > target_h - top_inset - bottom_inset` (the available space between insets), pushing `text_y` negative or `text_bottom` past `target_h` |
| Subline cut off | Reduce `ss2` by 10% and re-render |
| Low text contrast (scrim too light) | Increase scrim opacity — change `230` to `245` in the gradient alpha and re-render |
| Text overlaps logo | Text and logo must occupy opposite vertical ends per the day-of-week rotation. If overlapping despite correct positions (very long text on short canvas), reduce `hs` by 10% to shorten the text block. Re-render. |
| Logo at wrong end | Correct `position` per day-of-week rotation: `top-right` for Mon/Wed/Fri (paired with bottom text); `bottom-left` for Tue/Thu/Sat (paired with top text); re-render |
| Logo and text on same row | Verify the rotation mapping: `text_position` and `logo_position` must always be on opposite vertical ends; re-render |
| Logo positioned wrong | Verify the `is_story_reel` branch in `add_logo`: 9:16 → `top_inset = int(h * 0.14)`, `bottom_inset = int(h * 0.13)`, `side_inset = int(w * 0.13)` (Meta); feed → all three = `pad // 2`; re-render |
| Logo clipped at edge | Reduce `scale` by 0.02 and re-render |
| Logo visually offset (unequal margins) | `add_logo` already crops transparent padding via `logo.crop(logo.getbbox())` before computing dimensions — verify the crop line is present at the top of the function; re-render |
| Logo aspect ratio looks distorted | Confirm `logo.crop(logo.getbbox())` runs BEFORE `logo_w`/`logo_h` are computed (cropping after the resize-target calc distorts aspect); re-render |
| Logo too small to read | Increase `scale` to 0.22 and re-render |
| Logo too large / dominates image | Reduce `scale` to 0.14 and re-render |
| Logo blends into background | Add white semi-transparent backing: `bg = Image.new('RGBA', (logo_w + pad, logo_h + pad), (255,255,255,160))`, paste at `(x - pad//2, y - pad//2)` before pasting logo |
| Logo over busy image area | Switch to opposite corner (e.g. `top-right` → `top-left`) where background is calmer; re-render |

Re-render until all checks pass. Only then proceed to upload.

**Step 4 — Upload to Zernio (for social posts):**
```
1. Use gateway MCP tool `late_presign_upload`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - filename: "SocialPost_11Mar2026.png"
   - content_type: "image/png"
   → Returns uploadUrl + publicUrl

2. Use Python requests to upload the file directly to S3 (do NOT use `late_upload_media` MCP — it requires passing large base64 through context):
```python
import requests
with open('path/to/final_image.png', 'rb') as f:
    requests.put(uploadUrl, data=f, headers={'Content-Type': 'image/png'})
```

3. Use gateway MCP tool `late_create_post`:
   - media_items: [{ url: publicUrl from step 1 }]
```
Use `publicUrl` from step 1 in `late_create_post` media array.

**Standard asset sizes and Zernio platform destinations:**
| Format | Canvas | Zernio `platforms` |
|--------|--------|-----------------|
| LinkedIn Post | 1200×628 | `linkedin` |
| Facebook Post | 1200×630 | `facebook` |
| Instagram Post (square) | 1080×1080 | `instagram` |
| Instagram Post (portrait) | 1080×1350 | `instagram` |
| Reels / Story (9:16) | 1080×1920 | `instagram` |

**Always save Reels/Story to `outputs/{brand}/posts/Instagram/` — naming: append `_Story`.**
e.g. `SocialPost_PainMoment_Story_11Mar2026.png`

Place generated images into the asset HTML using `<img>` tags or reference them in the design spec.

---

### Step 5: Generate AI avatar videos via Argil API

Use **Argil API** to generate talking-head video ads. Only for Reels tagged `(Argil)` by social-calendar (1 per brand per week). Best for high-conversion Reel content on FB/IG.

**API workflow:**

**Set `aspectRatio` based on the target format:**

| Format | aspectRatio |
|---|---|
| Reel (FB/IG) | `"9:16"` (portrait) |
| Landscape (if ever needed) | `"16:9"` |

```
1. Use gateway MCP tool `argil_create_video`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - name: "Ad Video - [description]"
   - aspect_ratio: "9:16"
   - moments: [{ avatarId: "AVATAR_ID", voiceId: "VOICE_ID", transcript: "Your script here..." }]

2. Use gateway MCP tool `argil_render_video`:
   - fiveagents_api_key: ${FIVEAGENTS_API_KEY}
   - video_id: <from step 1>

3. Poll with `argil_get_video` (fiveagents_api_key + video_id) until status=DONE, then use videoUrl.
```

**Avatar selection — rotate for variety, prefer Asian characters for SEA markets:**

Read avatar preferences from `brands/{brand}/avatars.md`. This file defines which avatars to use, the founder avatar + voice clone ID, and market preferences. Use `argil_list_avatars` and `argil_list_voices` gateway tools to discover all available options. Prefer Asian/SEA avatars for Singapore, Indonesia, and Malaysia audiences. Rotate across videos — don't always use the same avatar.

Example avatar table below:

| Actor | Use For | Example Scenes |
|---|---|---|
| **Founder** (custom) | Authority/founder content | Formal, Recording Studio |
| **Arjun** | B2B professional, ops/sales content | Living Room Couch |
| **Kabir** | Tech/startup content | Beach Sunset, Film Set |
| **Rahul** | Professional services, consulting | Living Room, Gym |
| **Ananya** (F) | Marketing/content marketing personas | Default, Cafe |
| **Budi** | Indonesian market content | Default, Balcony |
| **Hassan** | SEA business content | Library, Restaurant, Living Room |
| **Koki** | Tech/product content | Indoors, Recording Studio |
| **Amira** (F) | CS/support personas | Cafe, Street |
| **Anjali** (F) | Enterprise/corporate content | Elevator |

**Voice:** Use the founder's voice clone (ID from `brands/{brand}/avatars.md`) for the founder avatar only. For stock avatars, pick a matching English voice from `argil_list_voices` gateway tool.

**Rotation rules:**
- Don't use the same avatar for consecutive posts on the same platform
- Match avatar gender/style to the target persona when possible
- Use the founder avatar only for authority/founder-credibility content
- Rotate across available avatars for variety

**When to use Argil:**
- **1 Reel per brand per week** — the highest-conversion Reel tagged `(Argil)` by the social-calendar skill
- Meta Ads TOFU video content (pain-point or authority ads for FB/IG)

**When NOT to use Argil:**
- Stories (use static images with text/logo overlay)
- LinkedIn posts (use static images)
- Any post not explicitly tagged `(Argil)` in the calendar

**For non-Argil Reels:** Use static image (1080x1920) with text + logo overlay, published as Story format.

---

## Output format

**Save location — local workspace:**
```
outputs/{brand}/posts/[Platform]/     ← social images
outputs/{brand}/strategy/             ← design specs / HTML mockups
```

**Folder by asset type:**
| Asset Type | Local Folder | Upload to Zernio? |
|---|---|---|
| LinkedIn graphic | `outputs/{brand}/posts/LinkedIn/` | Yes — upload via presign, use `publicUrl` in post |
| Facebook graphic | `outputs/{brand}/posts/Facebook/` | Yes |
| Instagram graphic | `outputs/{brand}/posts/Instagram/` | Yes (required for Instagram) |
| Twitter/X card | `outputs/{brand}/posts/Twitter/` | Yes |
| Banner / display ad | `outputs/{brand}/strategy/` | No — local only |
| HTML/CSS mockup | `outputs/{brand}/strategy/` | No — local only |

**Naming convention:**
```
[AssetType]_[DDMonYYYY].png           ← generated images
[AssetType]_[DDMonYYYY]_spec.md       ← Design spec / HTML mockup
```

Examples:
- `SocialPost_10Mar2026.png`
- `HeroImage_10Mar2026.png`
- `AdCreative_10Mar2026.png`
- `LandingPage_10Mar2026_spec.md`

**Output metadata (for spec files):**
```markdown
---
Date: YYYY-MM-DD
Skill Used: creative-designer
Asset Type: [landing-page | email | ad | social-graphic | one-pager]
Persona: [Persona name]
Campaign: [Campaign name]
Dimensions: [e.g., 1200px × 628px]
Output Format: HTML/CSS | Design Spec
Status: Draft | Final
---
```

---

## Quality checklist

Before finalizing any design output:

**Brand compliance:**
- [ ] `brands/{brand}/design-system/` was read when present; brand.md fallback used when absent — no hard block on missing design-system
- [ ] Colors, fonts, and component styles match design-system (when present) or brand.md (when fallback) — never hardcoded
- [ ] Primary brand color used for CTAs and key headings
- [ ] Accent color used sparingly — not dominant
- [ ] No off-brand colors used
- [ ] Typography follows the design-system font stack OR brand.md Google Fonts (whichever applied)
- [ ] For IG/FB/LinkedIn template formats: if a matching fb.ai template `type` exists (`fivebucks_list_templates`), template-path used (`fivebucks_create_post` → `fivebucks_render_post` → re-host on Zernio); else Gemini-only fallback (Step 4b) documented
- [ ] Template-path: `fivebucks_list_templates` called once and cached; `overrides` built from manifest field keys; direction set per type (`_direction` for meta-story; `direction` for single-image)
- [ ] Template-path: `edits` payload matches the template's key contract; Direction applied (`_direction` for story, `coverVariant`/`bodyVariant` for carousel)
- [ ] Template-path: Pillow text overlay AND Pillow logo overlay BOTH skipped — gateway render includes all chrome
- [ ] Gemini-only fallback path (Step 4b): Story/Reel full-frame guard applied — `image_prompt` passed to Gemini contains `"fills the ENTIRE frame"` for every 9:16 asset
- [ ] Gemini-only fallback path (Step 4b): Pillow text overlay AND Pillow logo overlay (both inside Step 4b) BOTH applied — Gemini background has no copy and no logo
- [ ] Day-of-week `text_align`, `text_position`, and `logo_position` rotations applied only on the Gemini-only fallback path; not used on template-path

**Layout quality:**
- [ ] Visual hierarchy is clear (headline → subheadline → body → CTA)
- [ ] Adequate white space between sections
- [ ] CTA button is prominent and uses correct brand style
- [ ] Content width respects max 1200px

**Content accuracy:**
- [ ] Copy inside the design matches approved content (no placeholder text in finals)
- [ ] No invented features, pricing, or claims
- [ ] CTA matches the campaign goal

**Technical (for HTML/CSS output):**
- [ ] HTML is valid and semantic
- [ ] No broken links or missing assets
- [ ] Responsive behavior considered for key breakpoints
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "creative-designer"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "assets": [
      {
        "type": "social-image",
        "platform": "Facebook",
        "dimensions": "1200x630",
        "tool": "gemini",
        "avatar": false,
        "file": "<filename>",
        "late_uploaded": true
      }
    ],
      "late_uploads": 0
  }
```
