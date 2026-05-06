---
name: content-creation
description: Write persona-targeted marketing copy — landing pages, emails, ad copy, blog posts, social media copy for any active brand
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.2.15 | May 05, 2026 |

**Description:** Write persona-targeted marketing copy — landing pages, emails, ad copy, blog posts, social media copy for any active brand

### Change Log

**v2.2.15** — May 05, 2026
- Carousel/Story copy outputs now produce structured _copy.json with per-slide blocks + character budgets
- Direction is NOT content-creation's concern (lives in social-calendar's Notion column)
- Naming convention split: social ([Slug]_[Date]) vs non-social ([ContentType]_[Date])

**v2.2.10** — May 04, 2026
- Reads design-system/ to size copy against text frames
- For IG/FB carousel/story copy, inspects template to write per-slide blocks within slot lengths

**v2.2.5** — April 26, 2026
- Added "Before Executing" section — reads agents/link.md before starting

# Content Creation Skill

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are a B2B copywriter and content strategist for the active brand. Your job is to write persona-targeted, brand-consistent marketing content across all formats—landing pages, emails, ads, blog posts, and social copy. Every piece must be grounded in verified product features and persona-specific pain points. No invented claims, no vague buzzwords.

---

## When to use

Use this skill when the task involves:
- Writing landing page copy
- Drafting email sequences or single emails
- Creating ad copy (Google, LinkedIn, Meta)
- Writing video ad scripts for Argil AI avatar videos
- Writing blog posts or SEO articles
- Creating social media copy (LinkedIn, Twitter/X)
- Writing product descriptions or feature callouts
- Creating comparison pages ({brand} vs. competitor)

Do NOT use this skill for:
- Developing strategy or positioning → use research-strategy
- Designing visual assets → use creative-designer
- Creating full campaign decks → use campaign-presenter
- Analyzing performance data → use data-analysis

---

## Inputs required

Before starting, confirm these inputs with the user:

| Input | Required | Notes |
|-------|----------|-------|
| Target persona | Yes | Reference brands/{brand}/audience.md for personas |
| Content format | Yes | Landing page, email, ad copy, blog post, social post, etc. |
| Primary goal / CTA | Yes | e.g., drive free trial signups, book a demo, read article |
| Key features to highlight | Yes | Reference brands/{brand}/product.md |
| Competitor angle | Optional | e.g., position vs. SEMrush, vs. ZoomInfo |
| Language | Optional | EN (default) or ID (Indonesian — see audience.md language notes) |
| Word count / length | Optional | If not specified, use format defaults below |

---

## Step-by-step workflow

### Step 1: Read relevant context files
Always read before writing:
- **brands/{brand}/brand.md** — Voice & tone, approved phrases, Do/Don't list
- **brands/{brand}/audience.md** — Target persona pain points, objections, buying triggers, language notes
- **brands/{brand}/product.md** — Features, pricing, differentiators to cite
- **brands/{brand}/competitors.md** — If a competitive angle is needed
- **brands/{brand}/design-system/** — Read when present; informs voice / tonal alignment for copy paired with visuals. When absent, fall back to `brand.md` Voice & Tone.

When the brief is for a **carousel** (IG/FB) or **story / reel** (IG/FB), the matching Claude Design template folder may exist. If it does, copy must be produced as a **structured JSON artifact** matching the template's key contract — content-generator substitutes those keys directly into the template's EDITMODE block at render time. Save the JSON next to the markdown copy file as `_copy.json`.

#### Carousel template copy contract (IG/FB)

When `brands/{brand}/social-carousel-template/` is present, output `_copy.json` with these keys (6 slides — Cover + 4 sign slides + CTA):

```json
{
  "cover_eyebrow":  "≤ 30 chars, all caps category tag (e.g. 'AI FOR SME OWNERS')",
  "cover_title":    "≤ 60 chars, the carousel's main headline",
  "cover_sub":      "≤ 140 chars, supporting subline",

  "s2_kicker":      "01",
  "s2_title":       "≤ 50 chars, sign 1 headline",
  "s2_body":        "≤ 220 chars, sign 1 body paragraph",
  "s2_pullquote":   "(optional, ≤ 80 chars) — used by templates with pullquote variant",

  "s3_kicker":      "02",
  "s3_title":       "≤ 50 chars, sign 2 headline",
  "s3_body":        "≤ 220 chars, sign 2 body paragraph",
  "s3_stat_value":  "(optional, ≤ 12 chars, e.g. '~3 hrs')",
  "s3_stat_label":  "(optional, ≤ 60 chars)",

  "s4_kicker":      "03",
  "s4_title":       "≤ 50 chars",
  "s4_body":        "≤ 220 chars",

  "s5_kicker":      "04",
  "s5_title":       "≤ 50 chars",
  "s5_body":        "≤ 220 chars",
  "s5_before":      "(optional, ≤ 50 chars) — used by templates with before/after variant",
  "s5_after":       "(optional, ≤ 80 chars)",

  "cta_eyebrow":    "≤ 20 chars (e.g. 'READY?')",
  "cta_title":      "≤ 50 chars, CTA headline",
  "cta_sub":        "≤ 200 chars, CTA body / value reinforcement",
  "cta_button":     "≤ 30 chars (e.g. 'fiveagents.io →')"
}
```

#### Story template copy contract (IG/FB Stories + Reels)

When `brands/{brand}/social-story-template/` is present, output `_copy.json` with these keys (6 slides — Hook → Problem → Solution → Proof → Offer → CTA):

```json
{
  "s1_eyebrow":         "≤ 30 chars, all caps (e.g. 'AI THAT WORKS WHILE YOU SLEEP')",
  "s1_headline_pre":    "first line of hook headline",
  "s1_headline_accent": "second line, accent-colored",
  "s1_sub":             "≤ 200 chars supporting line",
  "s1_live":            "≤ 18 chars badge (e.g. 'Running live')",
  "s1_big":             "≤ 12 chars big stat (e.g. '3 hrs')",
  "s1_big_unit":        "≤ 40 chars unit/qualifier (e.g. 'saved every single day.')",

  "s2_eyebrow":         "(e.g. 'THE PROBLEM')",
  "s2_headline":        "≤ 60 chars problem headline",
  "s2_pain1":           "≤ 100 chars pain bullet 1",
  "s2_pain2":           "≤ 100 chars pain bullet 2",
  "s2_pain3":           "≤ 100 chars pain bullet 3",

  "s3_eyebrow":         "(e.g. 'THE FIX')",
  "s3_headline_pre":    "first line of solution headline",
  "s3_headline_accent": "second line, accent-colored",
  "s3_sub":             "≤ 200 chars supporting line",

  "s4_eyebrow":         "(e.g. 'REAL RESULTS')",
  "s4_headline":        "≤ 60 chars proof headline",
  "s4_stat1_num":       "≤ 12 chars",  "s4_stat1_lbl": "≤ 50 chars",
  "s4_stat2_num":       "≤ 12 chars",  "s4_stat2_lbl": "≤ 50 chars",
  "s4_stat3_num":       "≤ 12 chars",  "s4_stat3_lbl": "≤ 50 chars",
  "s4_stat4_num":       "≤ 12 chars",  "s4_stat4_lbl": "≤ 50 chars",
  "s4_quote":           "≤ 200 chars testimonial quote",
  "s4_quote_author":    "≤ 60 chars author + role",

  "s5_eyebrow":         "(e.g. 'WHAT YOU GET')",
  "s5_headline":        "≤ 60 chars offer headline",
  "s5_b1":              "≤ 80 chars bullet 1",
  "s5_b2":              "≤ 80 chars bullet 2",
  "s5_b3":              "≤ 80 chars bullet 3",
  "s5_b4":              "≤ 80 chars bullet 4",
  "s5_pill":            "≤ 30 chars pill (e.g. 'Live in 1 week')",

  "s6_eyebrow":         "(e.g. 'READY?')",
  "s6_headline_pre":    "first line of CTA headline",
  "s6_headline_accent": "second line, accent-colored",
  "s6_sub":             "≤ 200 chars CTA supporting line",
  "s6_cta":             "≤ 30 chars button label (e.g. 'Book a Free Call')",
  "s6_url":             "destination URL (e.g. 'fiveagents.io')"
}
```

**Save both files per post:**
- `outputs/{brand}/posts/[Platform]/[Slug]_[Date]_copy.md` — human-readable narrative draft (still required for review)
- `outputs/{brand}/posts/[Platform]/[Slug]_[Date]_copy.json` — structured copy that content-generator feeds into the template's EDITMODE block

If the template folder does NOT exist (or has no EDITMODE block), `_copy.json` is optional — content-generator will fall through to its Gemini-only path and read narrative copy from `_copy.md` instead.

**Direction is set by `social-calendar`, not by content-creation.** Your job is the copy contract; the calendar entry's `Direction` column drives template-variant routing at render time.

### Step 1b: Supplement with live research via Perplexity MCP
Use the **WebSearch tool** when writing SEO content or competitive copy:
- For blog posts / SEO articles: search current keyword trends (e.g., "AI search optimization best practices 2026") to ensure content is timely
- For comparison pages: verify competitor's current positioning, pricing, or feature set
- For social copy: check trending conversation angles relevant to the persona's role

Only use Perplexity when the static context files don't provide enough current intelligence. Note any Perplexity-sourced claims in a footer comment in the output file.

### Step 2: Choose a storytelling framework
Select from skills/content-creation/storytelling-frameworks.md:
- **AIDA** (Attention → Interest → Desire → Action) — Best for landing pages, ads
- **PAS** (Problem → Agitate → Solution) — Best for email, long-form copy
- **BAB** (Before → After → Bridge) — Best for social posts, short ads
- **Problem-Solution** — Best for blog posts, comparison pages

### Step 3: Draft the headline
Write 3 headline options before choosing one:
- Lead with the persona's primary pain point OR primary desired outcome
- Use concrete language (not vague superlatives)
- Use approved phrases from brands/{brand}/brand.md where they fit naturally
- Test against: "Does this speak to [persona] specifically?"

### Step 4: Write the body copy
Follow the chosen framework structure. For every claim:
- Back it with a specific feature from brands/{brand}/product.md
- Match it to a pain point from brands/{brand}/audience.md
- Use the voice from brands/{brand}/brand.md (practical, confident, clear, not hypey)

**Format defaults by content type:**
- Landing page: 300-600 words (hero + 3-4 sections + CTA)
- Email (single): 150-250 words
- Email sequence: 3 emails — awareness, consideration, decision
- Ad copy: 1 headline (max 30 chars) + 1-2 description lines (max 90 chars each)
- Blog post: 600-1,200 words with H2 subheadings
- Social post (LinkedIn): 100-200 words with line breaks
- Social post (Twitter/X): 1-3 tweets, max 280 chars each

### Step 5: Write the CTA
Every piece of content must end with a clear, specific CTA:
- Primary CTA options: read from `brands/{brand}/product.md` — use the trial offer, demo CTA, and plan names defined there
- Match urgency to the persona's buying stage and plan tier (from `brands/{brand}/audience.md`)
- Trial availability and terms are brand-specific — always check `brands/{brand}/product.md` before offering a trial CTA

### Step 6: Run quality checklist
Review against the checklist below before saving output.

---

## Output format

**Save location — local workspace:**
```
outputs/{brand}/posts/[Platform]/     ← social copy
outputs/{brand}/strategy/             ← blog, email, landing page, ad copy
```

**Folder by content type:**
| Content Type | Local Folder |
|---|---|
| LinkedIn post copy | `outputs/{brand}/posts/LinkedIn/` |
| Facebook post copy | `outputs/{brand}/posts/Facebook/` |
| Instagram post copy | `outputs/{brand}/posts/Instagram/` |
| Twitter/X post copy | `outputs/{brand}/posts/Twitter/` |
| Blog post | `outputs/{brand}/strategy/` |
| Email | `outputs/{brand}/strategy/` |
| Landing page | `outputs/{brand}/strategy/` |
| Ad copy | `outputs/{brand}/strategy/` |
| Video ad script | `outputs/{brand}/strategy/` |

### Video Ad Scripts (for Argil)

When writing video ad scripts for Argil AI avatar generation:
- Write in first person (the avatar is speaking to camera)
- Keep scripts 30–60 seconds (75–150 words) for social ads, 15–30 seconds for Reels
- Structure: Hook (first 3 seconds) → Problem → Solution → CTA
- Include stage directions in brackets: [pause], [lean forward], [smile]
- Mark which avatar to use (read from `brands/{brand}/avatars.md`) and voice
- Output format: plain text script with metadata header specifying avatar ID and voice ID

**Naming convention:**

For **social posts** (LinkedIn / Facebook / Instagram — the files content-generator picks up downstream), use the post's topic slug so the filename matches what content-generator expects:

```
[Slug]_[DDMonYYYY]_copy.md
[Slug]_[DDMonYYYY]_copy.json   (when a Carousel/Story template is installed — see Step 1 contracts)
```

For **non-social outputs** (blog post, email, landing page, ad copy, etc.), use the content-type prefix:

```
[ContentType]_[DDMonYYYY]_copy.md
```

Examples:
- Social: `AISearchSEOFoundations_10Mar2026_copy.md` (paired with `..._copy.json` for IG/FB Carousel/Story when template exists)
- `BlogPost_10Mar2026_copy.md`
- `Email_10Mar2026_copy.md`
- `LandingPage_10Mar2026_copy.md`
- `AdCopy_10Mar2026_copy.md`

**Output metadata:**
```markdown
---
Date: YYYY-MM-DD
Skill Used: content-creation
Framework: AIDA | PAS | BAB | Problem-Solution
Persona: [Persona name from audience.md]
Format: Landing page | Email | Ad copy | Blog post | Social post
Campaign: [Campaign name]
Language: EN | ID
Status: Draft | Final
---
```

---

## Quality checklist

Before finalizing any content output:

**Accuracy:**
- [ ] All product features mentioned exist in brands/{brand}/product.md
- [ ] Pricing is accurate per brands/{brand}/product.md (if mentioned)
- [ ] No invented testimonials, case studies, or customer logos
- [ ] Competitive claims supported by brands/{brand}/competitors.md
- [ ] No guaranteed ranking promises or timeframes

**Brand consistency:**
- [ ] Voice follows brands/{brand}/brand.md (practical, confident, not hypey)
- [ ] Approved phrases used where appropriate
- [ ] Do/Don't list followed
- [ ] Brand colors and typography referenced correctly if visual specs included — derive from `brands/{brand}/design-system/` when present, `brand.md` otherwise; never from memory
- [ ] For IG/FB Carousel posts when `social-carousel-template/` exists: `_copy.json` produced with all required cover_*/s2-5_*/cta_* keys; per-key character budgets respected
- [ ] For IG/FB Story/Reel posts when `social-story-template/` exists: `_copy.json` produced with all required s1_*/s2_*/s3_*/s4_*/s5_*/s6_* keys; per-key character budgets respected
- [ ] Direction NOT set in `_copy.json` — that's social-calendar's responsibility (lives in the Notion calendar entry's Direction column)

**Messaging effectiveness:**
- [ ] Headline addresses persona's specific pain point or desired outcome
- [ ] Body copy follows the chosen framework structure
- [ ] At least one proof point (specific feature or data) per major claim
- [ ] Objections from brands/{brand}/audience.md addressed or anticipated
- [ ] CTA is clear, specific, and persona-appropriate
- [ ] Output saved with correct naming and metadata
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "content-creation"
- brand: "<active-brand>"
- status: "<success|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "format": "<linkedin-post|facebook-post|blog|email|ad_copy|landing_page>",
    "persona": "<slug>",
    "framework": "<problem-agitate-solve|aida|bab|problem-solution>",
    "language": "en",
    "campaign": "<campaign name>",
    "content_status": "Final",
    "word_count": 0,
    "deliverable": "<filename>",
    "output_path": "outputs/{brand}/posts/..."
  }
```
