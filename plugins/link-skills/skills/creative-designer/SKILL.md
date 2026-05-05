---
name: creative-designer
description: Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation with Nano Banana Pro, text overlays and branding for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

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

### Brand system — `brands/{brand}/design-system/` is the source of truth

The Claude Design system installed in `brand-setup` Step 4b is the authoritative visual reference for every output. **Read it before applying any colors, typography, layout, or component styles.**

1. **First** read `brands/{brand}/design-system/` — list its files, then read the entry HTML/CSS (typically `index.html`, `styles.css`, or `tokens.json`). Extract:
   - Color tokens (CSS variables, palette HEX codes)
   - Typography (font-family, weight scale, size scale)
   - Component styles (buttons, cards, headers, badges)
   - Spacing scale (gaps, padding, border-radius)
2. **Then** read `brands/{brand}/brand.md` for voice/tone, approved phrases, and Do/Don't rules.

If `brands/{brand}/design-system/` does not exist, ask the user to run `/link-skills:brand-setup` Step 4b before continuing — the design system is mandatory.

Never hardcode colors or fonts from memory. Always derive them from the design system. If the design system and `brand.md` disagree on colors/fonts, the design system wins and `brand.md` should be updated to match.

### Optional templates — Carousel and Story

Two optional Claude Design templates may exist:

| Template | Path | Used for | Fallback if missing |
|----------|------|----------|---------------------|
| Carousel (4:5) | `brands/{brand}/social-carousel-template/` | Instagram + Facebook carousel posts | Generate each slide with Gemini + Pillow text overlay using design-system colors/fonts |
| Story (9:16) | `brands/{brand}/social-story-template/` | Instagram + Facebook stories and reels (static) | Generate with Gemini + Pillow text overlay using design-system colors/fonts |

Detect availability with a folder existence check before each render. If the template folder exists, use it (see "Render via template" below). If absent, fall back to the standard image-generation pipeline — never block on a missing optional template.

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
- **brands/{brand}/design-system/** — Claude Design visual system (READ FIRST — authoritative for colors, fonts, components, spacing)
- **brands/{brand}/brand.md** — Voice, tone, approved phrases, Do/Don't rules
- **skills/creative-designer/style-guide.md** — Generic fallback rules (use only when design-system is absent or silent on a topic)
- Confirm the headline and key message (from content-creation or user input)
- For carousel asset type → check `brands/{brand}/social-carousel-template/`
- For story / reel (static) asset type → check `brands/{brand}/social-story-template/`

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

### Step 4a: Carousel and Story — render via template if available

Before falling through to Gemini image generation, branch on asset type:

**Decision tree:**

```
asset_type == "carousel" AND platform in {instagram, facebook}
  → if brands/{brand}/social-carousel-template/ exists:
      → render via template (instructions below)
    else:
      → fall through to Step 4b (Gemini per-slide)

asset_type in {"story", "reel"} AND platform in {instagram, facebook}
  → if brands/{brand}/social-story-template/ exists:
      → render via template (instructions below)
    else:
      → fall through to Step 4b (Gemini)

all other cases (LinkedIn posts, banners, ads, mockups, etc.)
  → fall through to Step 4b (Gemini)
```

**Render via template:**

**Gemini is still required.** The template defines layout, fonts, colors, text frames, and logo placement — Gemini fills the visual slot inside that frame with a fresh photograph/illustration per post. Do not skip Gemini.

1. **Inspect the template folder** — list its files and read the entry HTML (typically `index.html`). Identify:
   - Per-slide structure (separate files like `slide-1.html` or sections within `index.html`)
   - Text placeholder elements (often marked with `data-slot="headline"`, `data-slot="body"`, or class names like `.slot-headline`). If no explicit slots, use the placeholder copy that's already in the template as text-replace anchors.
   - Image placeholder elements (typically `<img data-slot="visual">` or sections with `data-slot="image"`). Some templates use CSS `background-image` instead.

2. **Generate any required visuals** — for image slots, use `gemini_generate_image` with the design-system aesthetic in the prompt and the template's slot dimensions. Save each visual to `outputs/{brand}/posts/[Platform]/_tmp/`.

3. **Substitute content** — copy the template folder to a working directory under `tmp/` (do not modify the source template). For each slide:
   - Replace text placeholders with the post's headline/body/CTA from content-creation output
   - Replace image placeholders with the local file paths from step 2
   - For carousel: produce one HTML per slide

4. **Render to PNG via Playwright MCP:**
```
For each rendered slide HTML:
- browser_navigate to the local file URL (file:///<absolute-path>/slide.html)
- Set viewport to template canvas dimensions:
    Carousel (4:5): 1080 × 1350
    Story (9:16): 1080 × 1920
- browser_take_screenshot → save to outputs/{brand}/posts/[Platform]/[Slug]_slide-{N}_final.png
```

If Playwright MCP is unavailable, fall back to Step 4b (Gemini + Pillow) and log a note that the template was skipped due to a tooling gap.

5. **Skip Pillow text overlay and logo overlay** — the template already includes both. Do not double-stamp.

6. **Cleanup** — delete the working copy under `tmp/` after final PNGs are saved.

After rendering via template, **skip Steps 4b–4e** for that asset and continue to **Step 4f / Zernio upload** (Step 4 — Upload below).

If `brands/{brand}/design-system/` exists but no template applies (e.g. LinkedIn post), pass the design system's color tokens and font names into the Gemini prompt in Step 4b for stylistic alignment. Still apply Pillow text+logo overlays as usual.

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
- [ ] `brands/{brand}/design-system/` was read before generating any visual
- [ ] Colors, fonts, and component styles match the design system (not hardcoded)
- [ ] Primary brand color used for CTAs and key headings
- [ ] Accent color used sparingly — not dominant
- [ ] Background color used for section/card backgrounds per design system
- [ ] No off-brand colors used
- [ ] Typography follows the font stack and size scale from the design system
- [ ] For carousels (IG/FB): if `social-carousel-template/` exists, it was used; otherwise documented fallback to Gemini
- [ ] For stories/reels (IG/FB): if `social-story-template/` exists, it was used; otherwise documented fallback to Gemini

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
