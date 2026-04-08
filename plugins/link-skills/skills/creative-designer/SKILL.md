---
name: creative-designer
description: Visual design and asset creation — social media graphics, HTML/CSS mockups, image generation with Nano Banana Pro, text overlays and branding for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

# Creative Designer Skill

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

### Brand system — always read from `brands/{brand}/brand.md`
Before applying any colors, typography, or CTA styles, read `brands/{brand}/brand.md` for:
- **Primary and accent colors** — hex values and usage roles
- **Typography** — font family, weights, and size scale
- **Voice and aesthetic** — tone of the visual design (e.g. clean B2B SaaS vs. specialist dark theme)
- **Do/Don't rules** — any explicit visual restrictions

Never hardcode colors or fonts from memory. Always derive them from the active brand's context file.

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
- **brands/{brand}/brand.md** — Visual guidelines, brand colors, design approach
- **skills/creative-designer/style-guide.md** — Detailed style rules
- Confirm the headline and key message (from content-creation or user input)

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

### Step 4b: Generate images via Gemini API

**Core principle: Visual = emotion. Text = punchline.**
The image must stop the scroll and evoke a feeling *before* the viewer reads a single word. Text overlays sharpen the message — they never explain what the image already shows.

Use **Gemini image generation** via curl for assets that need real imagery — scenes, people, environments, data visualizations. Do NOT use Gemini for pure typographic/text-only graphics (use HTML/CSS for those instead).

```bash
# Generate image via Gemini API
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "<your image prompt>"}]}],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }')

# Extract base64 image and save to file
python3 -c "
import json, base64, sys
data = json.loads('''${RESPONSE}''')
for part in data['candidates'][0]['content']['parts']:
    if 'inlineData' in part:
        img = base64.b64decode(part['inlineData']['data'])
        with open('<output.png>', 'wb') as f: f.write(img)
        print('OK: Image saved')
        sys.exit(0)
print('ERROR: No image in response')
sys.exit(1)
"
```

If a 429 RESOURCE_EXHAUSTED error occurs, wait 60 seconds and retry once. Rate limit: ~10 requests per minute.

**IMPORTANT — Never use Nano Banana / `continue_editing` for text overlays.** Nano Banana does not render brand fonts correctly and produces unprofessional typography. All text and logo compositing must be done with the Python scripts below.

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

**Nano Banana prompt guidelines:**
- Lead with the **scene/feeling**, not the brand: "Frustrated professional at desk..." not "[brand] ad..."
- Specify **cinematic, photorealistic, editorial photography style** for people/scenes
- Specify **abstract, data visualization, geometric** for non-people visuals
- Include **lighting/mood**: "dimly lit, blue screen glow, night" or "bright, clean, modern office"
- **No text, no logos, no brand name in the image** — text and logo are composited after using Python scripts
- Always end prompt with: **"No text in the image. No logos. No watermarks."**
- Do NOT use `continue_editing` for text — use `add_text_overlay.py` instead

**Example prompts by pattern:**

*Pain Moment:*
> "Photorealistic editorial photo: frustrated young professional at cluttered desk, multiple monitors showing different SaaS dashboards, hands on head in stress, dimly lit room with blue screen glow, sticky notes everywhere, cinematic shallow depth of field, dramatic moody lighting. No text in the image. No logos. No watermarks."

*Aha Insight:*
> "Abstract data visualization: upward trending graph splitting into two paths — traditional Google search and AI chat interfaces (represented as glowing nodes), dark navy background, purple and pink gradient lines, clean minimal style. No text in the image. No logos. No watermarks."

*Bold Stat:*
> "Dramatic close-up of a glowing purple number '275M' floating in dark space, abstract particle field background in purple and pink tones, cinematic lighting, square format. No text other than the number. No logos. No watermarks."

**Rate limit rule — ALWAYS follow this sequence when generating multiple images:**
1. Generate image 1 → apply text overlay → apply logo → save to `outputs/` → upload to Late
2. Wait ~15 seconds before next generation (API allows 10 IPM; 15s is a safe buffer)
3. Generate image 2 → apply text overlay → apply logo → save → upload to Late
4. Repeat

Never generate multiple images in parallel or back-to-back. One at a time with a short pause. If a 429 RESOURCE_EXHAUSTED error occurs, wait 60 seconds and retry once.

**After every Nano Banana generation, run BOTH scripts in order:**

**Step 1 — Text overlay (brand font, gradient scrim, drop shadow):**

Use `media-server` MCP tool `add_text_overlay`:
- `input_path`: path to raw image
- `output_path`: path for image with text
- `headline`: max 6-8 words, title case or all caps
- `subline`: brand tagline or CTA teaser
- `target_w`, `target_h`: canvas dimensions (see table below)
- `text_align`: left/center/right (from day-of-week rotation)
- `text_position`: bottom (always)
- `brand`: active brand name

| Format | target_w | target_h |
|--------|----------|----------|
| LinkedIn Post | 1200 | 628 |
| Facebook Post | 1200 | 630 |
| Instagram Post (square) | 1080 | 1080 |
| Instagram Post (portrait) | 1080 | 1350 |
| Instagram / Facebook Reel | 1080 | 1920 |
| Instagram / Facebook Story | 1080 | 1920 |

**Day-of-week layout rotation** (text_align: left/center/right — text_position: bottom/top):
| Day | text_align | text_position | logo_position |
|-----|------------|---------------|---------------|
| Mon | left | bottom | top-right |
| Tue | center | bottom | top-left |
| Wed | right | bottom | top-right |
| Thu | left | bottom | top-left |
| Fri | center | bottom | top-right |
| Sat | right | bottom | top-left |

- Font: Brand-specific fonts stored in `brands/{brand}/fonts/`
- Script resizes via scale-to-fill + center-crop to hit exact target canvas

**Step 2 — Logo overlay (brand mark):**

Use `media-server` MCP tool `add_logo`:
- `input_path`: path to image with text
- `output_path`: path for final image
- `position`: from day-of-week rotation (top-right/top-left)
- `scale`: 0.18 (18% of image width)
- `brand`: active brand name
- Logo: `brands/{brand}/logo.png` — brand mark with RGBA transparent background
- Size: **18%** of image width (0.18) — reduced for cleaner look
- Logo PNG transparent padding is auto-cropped so top and right gaps are visually equal (both = 3% of image width)
- This is the standard final step for ALL social images

**Step 3 — Upload to Late API (for social posts):**
```
POST https://getlate.dev/api/v1/media/presign
Authorization: Bearer $LATE_API_KEY
{ "filename": "SocialPost_11Mar2026.png", "contentType": "image/png" }
```
Response gives `uploadUrl` (PUT the file to this) and `publicUrl` (use in `/v1/posts` media array).

**Standard asset sizes and Late API destinations:**
| Format | Canvas | Script args | Late `platforms` |
|--------|--------|-------------|-----------------|
| LinkedIn Post | 1200×628 | `1200 628` | `linkedin` |
| Facebook Post | 1200×630 | `1200 630` | `facebook` |
| Instagram Post (square) | 1080×1080 | `1080 1080` | `instagram` |
| Instagram Post (portrait) | 1080×1350 | `1080 1350` | `instagram` |
| Reels / Story (9:16) | 1080×1920 | `1080 1920` | `instagram` |

**Always save Reels/Story to `outputs/{brand}/posts/Instagram/` — naming: append `_Story`.**
e.g. `SocialPost_PainMoment_Story_11Mar2026.png`

Place generated images into the asset HTML using `<img>` tags or reference them in the design spec.

### Step 5: Run quality checklist

---

### Step 5: Generate AI avatar videos via Argil API

Use **Argil API** to generate talking-head video ads. Only for Reels tagged `(Argil)` by social-calendar (1 per brand per week). Best for high-conversion Reel content on FB/IG.

**API workflow:**

**Set `aspectRatio` based on the target format:**

| Format | aspectRatio |
|---|---|
| Reel (FB/IG) | `"9:16"` (portrait) |
| Landscape (if ever needed) | `"16:9"` |

```bash
# 1. Create the video (with aspectRatio matching the post format)
curl -s -X POST "https://api.argil.ai/v1/videos" \
  -H "x-api-key: $ARGIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ad Video - [description]",
    "aspectRatio": "9:16",
    "moments": [{
      "avatarId": "AVATAR_ID",
      "voiceId": "VOICE_ID",
      "transcript": "Your script here..."
    }]
  }'

# 2. Render the video (use the video ID from step 1)
curl -s -X POST "https://api.argil.ai/v1/videos/{video_id}/render" \
  -H "x-api-key: $ARGIL_API_KEY"

# 3. Poll for completion
curl -s "https://api.argil.ai/v1/videos/{video_id}" \
  -H "x-api-key: $ARGIL_API_KEY"
# Repeat until status = "DONE", then use videoUrl field
```

**Avatar selection — rotate for variety, prefer Asian characters for SEA markets:**

Use `GET /avatars` and `GET /voices` to discover all available options. Prefer Asian/SEA avatars for Singapore, Indonesia, and Malaysia audiences. Rotate across videos — don't always use the same avatar.

| Actor | Use For | Example Scenes |
|---|---|---|
Read avatar preferences from `brands/{brand}/avatars.md`. This file defines which avatars to use, the founder avatar + voice clone ID, and market preferences. Use `GET /avatars` and `GET /voices` to discover all available options. Example avatar table below:

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

**Voice:** Use the founder's voice clone (ID from `brands/{brand}/avatars.md`) for the founder avatar only. For stock avatars, pick a matching English voice from `GET /voices`.

**Rotation rules:**
- Don't use the same avatar for consecutive posts on the same platform
- Match avatar gender/style to the target persona when possible
- Use the founder avatar only for authority/founder-credibility content
- Rotate across available avatars for variety

**When to use Argil:**
- **1 Reel per brand per week** — the highest-conversion Reel tagged `(Argil)` by the social-calendar skill
- Meta Ads TOFU video content (pain-point or authority ads for FB/IG)

**When NOT to use Argil:**
- Non-tagged Reels (use Ken Burns background video instead)
- Stories (use pre-stored backgrounds + text overlay)
- LinkedIn posts (use static images)
- Any post not explicitly tagged `(Argil)` in the calendar

### Step 5b: Generate Reel video from pre-stored background (Ken Burns + text overlay)

For Reels NOT tagged `(Argil)`. No external API — instant, free.

**Pipeline:** Pick background from `brands/{brand}/backgrounds/` → scale + Ken Burns zoom (ffmpeg) → text + logo overlay → silent .mp4

1. Pick background image matching the post topic (filenames are descriptive)
2. Scale to 1296x2304 (1.2x headroom) with PIL
3. ffmpeg `zoompan` with `setsar=1:1` → 1080x1920
4. Overlay logo (static) + text (animated fade per scene) via `drawtext`
5. Auto-detect brightness: dark bg → white text + shadow, light bg → brand text, no scrim

```bash
ffmpeg -y -loop 1 -i "tmp/bg_large.png" -i "tmp/logo_cropped.png" \
  -filter_complex "[0:v]zoompan=z='1+0.012*in/270':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=270:s=1080x1920:fps=30,setsar=1:1,format=rgba[bg0];[1:v]format=rgba[logo];[bg0][logo]overlay=50:50:format=auto[bg];[bg]DRAWTEXT_FILTERS" \
  -t 9 -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -an -movflags +faststart output.mp4
```

**When to use Ken Burns video:**
- All FB/IG Reels not tagged `(Argil)`

**When NOT to use:**
- Talking-head content (use Argil)
- Stories (use Nano Banana static)
- LinkedIn (use Nano Banana static)

**Script must come from content-creation skill first.** The creative-designer skill only handles the generation and rendering step.

---

## Output format

**Save location — local workspace:**
```
outputs/{brand}/posts/[Platform]/     ← social images
outputs/{brand}/strategy/             ← design specs / HTML mockups
```

**Folder by asset type:**
| Asset Type | Local Folder | Upload to Late? |
|---|---|---|
| LinkedIn graphic | `outputs/{brand}/posts/LinkedIn/` | Yes — upload via presign, use `publicUrl` in post |
| Facebook graphic | `outputs/{brand}/posts/Facebook/` | Yes |
| Instagram graphic | `outputs/{brand}/posts/Instagram/` | Yes (required for Instagram) |
| Twitter/X card | `outputs/{brand}/posts/Twitter/` | Yes |
| Banner / display ad | `outputs/{brand}/strategy/` | No — local only |
| HTML/CSS mockup | `outputs/{brand}/strategy/` | No — local only |

**Naming convention:**
```
[AssetType]_[DDMonYYYY].png           ← Nano Banana generated images
[AssetType]_[DDMonYYYY]_spec.md       ← Design spec / HTML mockup
```

Examples:
- `SocialPost_10Mar2026.png` (Nano Banana output)
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
- [ ] Primary brand color (from `brands/{brand}/brand.md`) used for CTAs and key headings
- [ ] Accent color used sparingly — not dominant
- [ ] Background color used for section/card backgrounds per brand spec
- [ ] No off-brand colors used
- [ ] Typography follows the font stack and size scale from `brands/{brand}/brand.md`

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

```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "creative-designer",
    "brand": "<active-brand>",
    "status": "<success|failed>",
    "summary": "<1 line, <200 chars>",
    "started_at": "<ISO timestamp>",
    "completed_at": "<ISO timestamp>",
    "metrics": {
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
  }'
```
