---
name: creative-designer
description: Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation with Nano Banana Pro, text overlays and branding for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.3.1 | May 06, 2026 |

**Description:** Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation, text overlays and branding for any active brand

### Change Log

**v2.3.1** — May 06, 2026
- Step 4a bullet 2 — `template_list` verbose response now includes `entry_html` field
- Step 4a bullet 6 — `template_render` call updated: `version_hash` optional pinning field added; `slots` accepts PNG or JPEG with per-slot and total size limits documented
- Quality checklist — `template_list` checklist item updated to include `entry_html`

**v2.3.0** — May 06, 2026
- Step 4a template-path — gateway renders the template server-side via template_render MCP; Playwright removed
- Step 4b intro text corrected — removed stale "render the modified HTML in Playwright" reference

**v2.2.15** — May 05, 2026
- Step 4a switched to template-path; delegates canonical implementation to content-generator/SKILL.md
- design-system/ mandate softened to optional with brand.md fallback
- Step 4b Gemini + Pillow fallback unchanged (incl. Step 3b visual verification)

**v2.2.14** — May 05, 2026
- text_align fixed to "center"; gradient scrim dynamically sized to text block
- Step 3b — mandatory visual verification before Zernio upload

**v2.2.10** — May 04, 2026
- design-system/ is source of truth for visuals (replaces brand.md as primary reference)
- Step 4a — branches Carousel/Story to template-render via Playwright when templates installed

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

**v2.2.2** — April 10, 2026
- gemini_generate_image result auto-saved to temp file; Python decodes to PNG on disk
- Replaced image_add_text_overlay and image_add_logo gateway tools with Python Pillow

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

### Optional Claude Design templates — Carousel and Story

Two optional Claude Design templates may exist:

| Template | Path | Used for | Fallback if missing |
|----------|------|----------|---------------------|
| Carousel template (4:5) | `brands/{brand}/social-carousel-template/` | IG + FB carousel posts (6 slides: Cover + 4 signs + CTA) | Generate the full background fresh with Gemini + Pillow text overlay using design-system / brand.md colors |
| Story template (9:16) | `brands/{brand}/social-story-template/` | IG + FB Stories + Reels (6 slides: Hook → Problem → Solution → Proof → Offer → CTA, three direction styles A/B/C) | Same Gemini + Pillow fallback |

Each folder is a self-contained React + Babel app (entry HTML + JSX + CSS + assets) with an `EDITMODE-BEGIN`/`EDITMODE-END` JSON block in the entry HTML that exposes the editable copy keys. At runtime: the gateway renders the template server-side (Vercel + Playwright on the gateway) and PUTs slide PNGs directly to presigned Zernio URLs — no local Playwright required. See "Render via template" in Step 4a. If the folder is missing or the EDITMODE block can't be located, fall through to Step 4b's Gemini-only pipeline — never block.

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

---

## Step-by-step workflow

### Step 1: Read brand and content context
- **brands/{brand}/design-system/** — Claude Design visual system (read first when present — authoritative for colors, fonts, components, spacing). When absent, skip and use brand.md fallback.
- **brands/{brand}/brand.md** — Voice, tone, approved phrases, Do/Don't rules; also canonical colors and Google Font name (used as fallback when design-system/ is absent)
- **skills/creative-designer/style-guide.md** — Generic fallback rules (use only when both design-system/ and brand.md are silent on a topic)
- Confirm the headline and key message (from content-creation or user input)
- For carousel asset type → check `brands/{brand}/social-carousel-template/` for an entry HTML containing an `EDITMODE-BEGIN` block
- For story / reel (static) asset type → check `brands/{brand}/social-story-template/` for an entry HTML containing an `EDITMODE-BEGIN` block

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

### Step 4a: Carousel and Story — render via Claude Design template if available

Before falling through to Gemini-only image generation (Step 4b — the universal fallback), branch on asset type:

**Decision tree:**

```
asset_type == "carousel" AND platform in {instagram, facebook}
  → if brands/{brand}/social-carousel-template/ has an entry HTML with EDITMODE-BEGIN block:
      → render via template (instructions below)
    else:
      → fall through to Step 4b (Gemini full background per slide + Pillow text + Pillow logo)

asset_type in {"story", "reel"} AND platform in {instagram, facebook}
  → if brands/{brand}/social-story-template/ has an entry HTML with EDITMODE-BEGIN block:
      → render via template (instructions below)
    else:
      → fall through to Step 4b (Gemini full background + Pillow text + Pillow logo)

all other cases (LinkedIn posts, banners, ads, mockups, etc.)
  → fall through to Step 4b (Gemini + Pillow text + Pillow logo)
```

**Render via template — gateway template_render. No local Playwright, no Pillow on this path.**

The template is a Claude Design React + Babel app installed via brand-setup Step 4c and uploaded to the gateway. The gateway renders it server-side (Vercel + Playwright) and PUTs slide PNGs directly to presigned Zernio URLs. **For the canonical implementation see `content-generator/SKILL.md` Step 4c-template** — both skills follow the same procedure:

1. Confirm the template folder has an entry HTML with `EDITMODE-BEGIN`/`EDITMODE-END`. If absent, fall through to Step 4b.
2. Call `template_list(verbose=true)` to get `edit_keys`, `image_slots`, and `entry_html` (root HTML filename) from the gateway.
3. Generate Gemini visual(s) — one per `image_slots` entry, kept in memory as base64. Do not upload anywhere.
4. Presign one Zernio upload slot per output slide via `late_presign_upload` (run immediately before the render call).
5. Build `edits` payload from the post copy dict; apply Direction (`_direction` for story, `coverVariant`/`bodyVariant` for carousel — leave template defaults if Direction blank).
6. Call `template_render` with `edits`, `slots` (base64 PNG or JPEG visuals — each slot ≤ 4 MB, total ≤ 32 MB), `upload_targets` (presigned Zernio slots), and optionally `version_hash` (pin to a specific version for reproducibility; omit for latest). Gateway renders and PUTs slide PNGs; returns `images[n].public_url`.
7. On success: use `public_url` values for upload. Skip Steps 4d and 4e (Pillow overlays — template render includes all chrome).
8. On failure (5xx/504): fall through to Step 4b (Gemini + Pillow fallback).

After the template-path completes, continue to upload (Step 4f) — do NOT re-run Step 4b's Gemini path; the template-path has already produced final assets.

**The Gemini + Pillow fallback in Step 4b remains the universal path** for: LinkedIn posts, banners, ads, mockups, any post where the matching template folder is missing or has no EDITMODE block, and any failure on the template-path. That fallback path applies Pillow text overlay (Step 4d) AND Pillow logo overlay (Step 4e) — both required since the Gemini-generated background has no copy and no logo. The day-of-week `text_align` and `logo_position` rotations apply only on this Step 4b path.

---

### Step 4b: Generate images via Gemini API

**Core principle: Visual = emotion. Text = punchline.**
The image must stop the scroll and evoke a feeling *before* the viewer reads a single word. Text overlays sharpen the message — they never explain what the image already shows.

Use **Gemini image generation** for assets that need real imagery — scenes, people, environments, data visualizations. Do NOT use Gemini for pure typographic/text-only graphics (use HTML/CSS for those instead).

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
- **No text, no logos, no brand name in the image** — text and logo are composited after using gateway tools
- Always end prompt with: **"No text in the image. No logos. No watermarks."**
- Do NOT use `continue_editing` for text — use Python Pillow (Step 2) instead

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
from PIL import Image, ImageDraw, ImageFont
import textwrap

def add_text_overlay(input_path, output_path, headline, subline, target_w, target_h, text_position='bottom'):
    img = Image.open(input_path).convert('RGBA')
    # Scale and center-crop to exact canvas
    r = img.width / img.height; tr = target_w / target_h
    if r > tr: nw = int(img.width * target_h / img.height); nh = target_h
    else: nw = target_w; nh = int(img.height * target_w / img.width)
    img = img.resize((nw, nh), Image.LANCZOS)
    img = img.crop(((nw-target_w)//2, (nh-target_h)//2, (nw-target_w)//2+target_w, (nh-target_h)//2+target_h))

    pad = int(target_w * 0.06)
    hs = max(36, int(target_w * 0.048))
    ss2 = max(22, int(target_w * 0.026))
    try:
        fh = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', hs)
        fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', ss2)
    except:
        fh = fs = ImageFont.load_default()

    # Word-wrap both lines to fit within canvas width minus padding
    max_chars = max(10, int((target_w - 2 * pad) / (hs * 0.55)))
    h_lines = textwrap.wrap(headline, width=max_chars)
    s_lines = textwrap.wrap(subline, width=max_chars + 10)

    # Measure total text block height
    line_gap = int(hs * 0.3)
    block_h = len(h_lines) * (hs + line_gap) + int(hs * 0.5) + len(s_lines) * (ss2 + line_gap)

    # Position scrim and text block
    scrim_h = block_h + pad * 2
    scrim = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scrim)

    if text_position == 'bottom':
        scrim_top = target_h - scrim_h
        text_y = scrim_top + pad
        # Gradient: transparent at top, dark at bottom
        for y in range(scrim_top, target_h):
            alpha = int(200 * (y - scrim_top) / (target_h - scrim_top))
            ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))
    else:  # top
        scrim_top = 0
        text_y = pad
        # Gradient: dark at top, transparent at bottom
        for y in range(0, scrim_h):
            alpha = int(200 * (1 - y / scrim_h))
            ds.line([(0, y), (target_w, y)], fill=(0, 0, 0, alpha))

    img = Image.alpha_composite(img, scrim)
    draw = ImageDraw.Draw(img)

    # Draw headline lines (white, centered)
    for line in h_lines:
        bbox = draw.textbbox((0, 0), line, font=fh)
        lw = bbox[2] - bbox[0]
        x = (target_w - lw) // 2
        draw.text((x, text_y), line, font=fh, fill=(255, 255, 255, 255))
        text_y += hs + line_gap

    text_y += int(hs * 0.3)  # gap between headline and subline

    # Draw subline lines (pink, centered)
    for line in s_lines:
        bbox = draw.textbbox((0, 0), line, font=fs)
        lw = bbox[2] - bbox[0]
        x = (target_w - lw) // 2
        draw.text((x, text_y), line, font=fs, fill=(236, 72, 153, 255))
        text_y += ss2 + line_gap

    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

Font: DejaVuSans-Bold for headline (white), DejaVuSans for subline (pink `#ec4899`).
Text is always **centered horizontally** and word-wrapped to stay within canvas bounds.
`text_position` controls whether the scrim + text block appears at top or bottom.

| Format | target_w | target_h |
|--------|----------|----------|
| LinkedIn Post | 1200 | 628 |
| Facebook Post | 1200 | 630 |
| Instagram Post (square) | 1080 | 1080 |
| Instagram Post (portrait) | 1080 | 1350 |
| Instagram / Facebook Reel | 1080 | 1920 |
| Instagram / Facebook Story | 1080 | 1920 |

**Day-of-week layout rotation** (text always centered — text_position alternates top/bottom):
| Day | text_align | text_position | logo_position |
|-----|------------|---------------|---------------|
| Mon | center | bottom | top-right |
| Tue | center | top | top-left |
| Wed | center | bottom | top-right |
| Thu | center | top | top-left |
| Fri | center | bottom | top-right |
| Sat | center | top | top-left |

**Step 3 — Logo overlay (brand mark) — USE PILLOW:**

```python
from PIL import Image

def add_logo(image_path, output_path, logo_path, position='top-right', scale=0.18):
    img = Image.open(image_path).convert('RGBA')
    logo = Image.open(logo_path).convert('RGBA')
    w, h = img.size
    logo_w = int(w * scale)
    logo_h = int(logo.height * logo_w / logo.width)
    logo = logo.resize((logo_w, logo_h), Image.LANCZOS)
    margin = int(w * 0.03)
    positions = {
        'top-right':    (w - logo_w - margin, margin),
        'top-left':     (margin, margin),
        'bottom-right': (w - logo_w - margin, h - logo_h - margin),
        'bottom-left':  (margin, h - logo_h - margin),
    }
    x, y = positions[position]
    img.paste(logo, (x, y), logo)
    img.convert('RGB').save(output_path, 'PNG', optimize=True)
```

Logo path: `brands/{brand}/logo.png`. Scale: 0.18. Position: from day-of-week rotation.
This is the standard final step for ALL social images.

**Step 3b — Visual verification (MANDATORY before uploading to Zernio):**

Read the final image and visually inspect it. Check all of the following:

**Text overlay:**
- [ ] Headline is fully visible — no characters clipped at the left, right, or bottom edge
- [ ] Subline is fully visible — not cut off
- [ ] Text has sufficient contrast against the background (gradient scrim is dark enough)
- [ ] Text does not overlap the logo

**Logo:**
- [ ] Logo is fully visible — not clipped by any edge
- [ ] Logo has sufficient contrast/visibility against the background behind it
- [ ] Logo visual margin from the top edge and right (or left) edge looks approximately equal — the logo should not appear to "float" lower or higher than its corner margin

**Overall composition:**
- [ ] Text and logo do not overlap each other
- [ ] The image looks intentional and on-brand — not accidental or broken

**If any check fails, fix before uploading:**

| Issue | Fix |
|---|---|
| Text clipped at left/right edge | Increase `pad` to `int(target_w * 0.08)` and re-render |
| Text clipped at top/bottom edge | Reduce `hs` by 10% and re-render |
| Subline cut off | Reduce `ss2` by 10% and re-render |
| Low text contrast | Increase scrim opacity — change `200` to `230` in the gradient alpha and re-render |
| Text overlaps logo | If `text_position == 'bottom'` and logo is `bottom-*`: switch logo to `top-*` position. If text is `top` and logo is `top-*`: switch logo to `bottom-*`. Re-render. |
| Logo clipped at edge | Reduce `scale` by 0.02 and re-render |
| Logo visually offset (top margin ≠ side margin) | Crop transparent padding: `logo = logo.crop(logo.getbbox())` before resizing, then re-render |
| Logo too small to read | Increase `scale` to 0.22 and re-render |
| Logo too large / dominates image | Reduce `scale` to 0.14 and re-render |
| Logo blends into background (low contrast) | Add a subtle white semi-transparent circle/rect behind the logo: `bg = Image.new('RGBA', (logo_w + pad, logo_h + pad), (255,255,255,160))`, paste at `(x - pad//2, y - pad//2)` before pasting logo |
| Logo placed over busy image area | Switch to the opposite corner (e.g. `top-right` → `top-left`) where the background is calmer, then re-render |

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

### Step 5: Run quality checklist

---

### Step 6: Generate AI avatar videos via Argil API

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

Use `argil_list_avatars` and `argil_list_voices` gateway tools to discover all available options. Prefer Asian/SEA avatars for Singapore, Indonesia, and Malaysia audiences. Rotate across videos — don't always use the same avatar.

| Actor | Use For | Example Scenes |
|---|---|---|
Read avatar preferences from `brands/{brand}/avatars.md`. This file defines which avatars to use, the founder avatar + voice clone ID, and market preferences. Use `argil_list_avatars` and `argil_list_voices` gateway tools to discover all available options. Example avatar table below:

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
- [ ] For IG/FB Carousel: if `social-carousel-template/` has entry HTML with EDITMODE block, template-path used (template_list → Gemini base64 → presign slots → template_render → publicUrls); else Gemini-only fallback (Step 4b) documented
- [ ] For IG/FB Story/Reel (static): if `social-story-template/` has entry HTML with EDITMODE block, template-path used; else Gemini-only fallback (Step 4b) documented
- [ ] Template-path: `template_list(verbose=true)` called to get `edit_keys`, `image_slots`, and `entry_html`; Gemini visuals held in memory as base64 (not uploaded)
- [ ] Template-path: `edits` payload matches the template's key contract; Direction applied (`_direction` for story, `coverVariant`/`bodyVariant` for carousel)
- [ ] Template-path: Pillow text overlay AND Pillow logo overlay BOTH skipped — gateway render includes all chrome
- [ ] Gemini-only fallback path (Step 4b): Pillow text overlay (Step 4d) AND Pillow logo overlay (Step 4e) BOTH applied — Gemini background has no copy and no logo
- [ ] Day-of-week `text_align` and `logo_position` rotations applied only on the Gemini-only fallback path; not used on template-path

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
