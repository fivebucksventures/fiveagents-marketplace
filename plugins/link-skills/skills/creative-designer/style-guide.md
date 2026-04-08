# Style Guide

## Colors

### Primary palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary Purple | `#6b21a8` | 107, 33, 168 | CTAs, primary buttons, key headings, active states, borders on hero sections |
| Secondary Pink | `#ec4899` | 236, 72, 153 | Accent highlights, hover states, badges, secondary buttons, gradient endpoints |
| Background Gray | `#f3f3f3` | 243, 243, 243 | Section backgrounds, card fills, alternating row backgrounds |
| White | `#ffffff` | 255, 255, 255 | Page background, card surfaces, text on dark backgrounds |
| Dark Text | `#1a1a1a` | 26, 26, 26 | Body copy, headings on light backgrounds |
| Muted Text | `#6b7280` | 107, 114, 128 | Subheadings, captions, labels, placeholder text |

### Accent palette (use sparingly — icons and status badges only)

| Name | Hex | Usage |
|------|-----|-------|
| Indigo | `#4f46e5` | Feature icons, informational badges |
| Blue | `#2563eb` | Link color (inline text links only) |
| Amber | `#d97706` | Warning indicators, "Medium" difficulty badges |
| Emerald | `#059669` | Success states, "Easy" difficulty badges, positive metrics |
| Red | `#dc2626` | Error states, "Hard" difficulty badges, negative metrics |

### Gradient (for hero backgrounds and CTA sections)

```css
background: linear-gradient(135deg, #6b21a8 0%, #ec4899 100%);
```

Use this gradient sparingly — hero sections and CTA banners only. Never for body copy backgrounds.

---

## Typography

### Font stack
```css
font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
```

Inter is the preferred typeface. If unavailable, fall back to Segoe UI.

### Type scale

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| H1 (hero headline) | 42-48px | 700 Bold | 1.15 | `#1a1a1a` or `#ffffff` on dark |
| H2 (section headline) | 28-32px | 700 Bold | 1.2 | `#1a1a1a` |
| H3 (card/subsection) | 20-22px | 600 Semibold | 1.3 | `#1a1a1a` |
| H4 (label/caption heading) | 16-18px | 600 Semibold | 1.4 | `#1a1a1a` |
| Body (standard) | 16px | 400 Regular | 1.65 | `#1a1a1a` |
| Body (small) | 14px | 400 Regular | 1.6 | `#6b7280` |
| Caption / Label | 12px | 500 Medium | 1.4 | `#6b7280` |
| Button text | 15-16px | 600 Semibold | 1 | `#ffffff` |

### Typography rules
- **Never** use more than 2 font sizes on a single card or component
- **Never** set body copy below 14px
- **Uppercase** is reserved for short labels and badges only (max 3 words)
- **Italic** is for emphasis within body copy only — not headings

---

## Layout rules

### Page structure
- Max content width: **1200px**, centered with `margin: 0 auto`
- Page horizontal padding: **24px** (mobile), **48px** (tablet), **0** (desktop at max-width container)

### Section spacing
- Between sections: **80px** vertical gap (desktop), **48px** (mobile)
- Section internal padding: **64px** top/bottom (desktop), **40px** (mobile)
- Hero section: **120px** top padding (desktop), **80px** (mobile)

### Card components
- Padding: **24-32px** all sides
- Border radius: **12px**
- Border: `1px solid #e5e7eb` (light gray)
- Box shadow: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- Background: `#ffffff` (default) or `#f3f3f3` (subtle variant)

### Buttons

**Primary button (purple):**
```css
background: #6b21a8;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-size: 15px;
font-weight: 600;
border: none;
cursor: pointer;
transition: background 0.15s ease;
```
Hover: `background: #7c3aed`

**Secondary button (outline):**
```css
background: transparent;
color: #6b21a8;
border: 2px solid #6b21a8;
padding: 10px 22px;
border-radius: 8px;
font-size: 15px;
font-weight: 600;
cursor: pointer;
```
Hover: `background: #f5f3ff`

**CTA button (pink accent — for high-contrast hero CTAs):**
```css
background: #ec4899;
color: #ffffff;
padding: 14px 28px;
border-radius: 8px;
font-size: 16px;
font-weight: 700;
border: none;
```
Hover: `background: #db2777`

### Grid and spacing
- Column gap: **24-32px**
- Use CSS Grid for 2-4 column feature grids
- Feature card grid: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- Always use **flexbox** for horizontal alignment and **grid** for 2D layouts

---

## Social image philosophy

**Visual = emotion. Text = punchline.**

The image must work without the text. A viewer scrolling at speed should *feel* something from the image alone — recognition, curiosity, frustration, desire. The text overlay or caption then delivers the punchline that converts that feeling into a click.

**Never** use an image that only makes sense after reading the text. **Never** use text to explain what the image already shows. **Never** default to text-on-background when the brief calls for a real visual scene.

### 5 proven image patterns for fivebucks.ai

| Pattern | What the visual shows | Text punchline |
|---------|----------------------|----------------|
| **Pain Moment** | Frustrated person, multiple screens, overwhelm | "You don't need more tools. You need one that does it all." |
| **Before/After** | Split: chaos left, clean dashboard right | "From this → to this. One platform." |
| **Bold Stat** | One huge number, almost nothing else | "Your next customer is already in here." |
| **Social Proof** | Real person quote + result metric | Let the quote speak |
| **Aha Insight** | Chart/trend showing AI search taking over | "Is your business invisible to AI?" |

**When to use each:**
- Pain Moment → awareness, cold audience, top of funnel
- Before/After → consideration, retargeting, mid-funnel
- Bold Stat → trust-building, LinkedIn B2B decision makers
- Social Proof → bottom of funnel, conversion
- Aha Insight → thought leadership, LinkedIn, SEO/marketing personas

### Social platform image specs

| Platform | Dimensions | Orientation | Text density | Best patterns |
|---|---|---|---|---|
| LinkedIn | 1200×628px | Landscape | Medium — headline + brand mark | Bold Stat, Aha Insight, Pain Moment |
| Facebook | 1200×628px | Landscape | Medium — benefit + proof | Pain Moment, Before/After |
| Instagram (standard) | 1080×1080px | Square | Low — 3–5 words max | Bold Stat, Pain Moment |
| Instagram (boosted) | 1080×1350px | Portrait | Low — 3–5 words max | Same, more feed height |

---

## Do/Don't visuals

### Do ✅
- **Do** use the purple/pink gradient as a hero background with white text
- **Do** use white cards on gray section backgrounds for contrast
- **Do** use emerald green (`#059669`) for positive metrics and checkmarks
- **Do** leave generous white space between sections — cramped layouts look low quality
- **Do** use icon badges with accent colors (indigo, amber, emerald) for feature categories
- **Do** use subtle card shadows to create depth without heaviness
- **Do** place the primary purple CTA button above the fold in every hero section
- **Do** use real scenes and people for social images — cinematic, photorealistic, editorial style
- **Do** let the visual carry the emotion; use text only as a punchline

### Don't ❌
- **Don't** use the pink as a background color for large sections — it's an accent only
- **Don't** use gradient backgrounds for cards or body sections — only hero and CTA banners
- **Don't** mix more than 3 accent colors on a single page
- **Don't** use black (`#000000`) — use dark text `#1a1a1a` instead
- **Don't** set text smaller than 14px in any user-facing content
- **Don't** use drop shadows heavier than `0 4px 12px rgba(0,0,0,0.1)` — it looks dated
- **Don't** center-align body copy — only headlines and short subheadlines
- **Don't** generate text-only social images with Nano Banana — use HTML/CSS for those
- **Don't** use Nano Banana for Reel video content — use Argil (tagged Reels) or Ken Burns background video (other Reels)
- **Don't** use text on the image to explain what the image is showing

---

## Asset naming conventions

**Format:**
```
YYYY-MM-DD_[asset-type]_[persona-slug]_[campaign-slug].[ext]
```

**Asset type slugs:**
| Asset | Slug |
|-------|------|
| Landing page (HTML) | `landing-page` |
| Email template | `email-template` |
| LinkedIn banner | `linkedin-banner` |
| LinkedIn post image | `linkedin-post` |
| Twitter/X card | `twitter-card` |
| Google display ad | `display-ad-[size]` (e.g., `display-ad-300x250`) |
| One-pager document | `one-pager` |
| Design spec (markdown) | `design-spec` |

**Persona slugs:**
| Persona | Slug |
|---------|------|
| Content Marketing Manager (Sarah) | `content-mgr` |
| SEO Professional (Marcus) | `seo-pro` |
| Sales Rep (Jason) | `sales-rep` |
| Agency Owner (Priya) | `agency-owner` |
| Solopreneur (David) | `solopreneur` |
| Growth Marketer (Amanda) | `growth-mktr` |
| All personas / generic | `general` |

**Examples:**
```
2026-03-10_landing-page_seo-pro_ai-search-campaign.html
2026-03-10_email-template_agency-owner_tool-consolidation.html
2026-03-10_linkedin-banner_general_q2-launch.png
2026-03-10_design-spec_solopreneur_basic-plan-page.md
```
