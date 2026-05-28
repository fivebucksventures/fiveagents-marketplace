# Hook Library

Proven hook archetypes and opening-line patterns for **static B2B social posts** (LinkedIn / Facebook / Instagram). Adapted from short-form viral patterns and recast for the first line of a post, a carousel cover, or a single-image headline — the scroll-stopping moment before the reader commits.

Use alongside `storytelling-frameworks.md` (which shapes the *body*). The hook is the first 1–2 lines; the framework carries the rest.

**Rules that apply to every hook:**
- Lead with the reader's pain, desire, or a concrete claim — never with throat-clearing.
- Be specific. A number, a named tool, a role, or a result beats a vague abstraction.
- One idea per hook. If it needs a comma-spliced second clause to make sense, cut it.
- Voice and claims come from `brands/{brand}/brand.md` + `product.md` — **never invent** stats, features, or outcomes.
- Match the hook to the post's persona (`audience.md`) — the pain must be *their* pain.

---

## The 8 hook archetypes (B2B static)

Each maps to a content-mix type (see `social-calendar`) and a typical Direction.

### 1. Proof / Result (was "Someone Built X")
Show an outcome; let the result be the star.
- "We cut [task] from [X hours] to [Y minutes]. Here's the workflow."
- "[Persona] went from [before state] to [after state] in [timeframe]."
**Mix:** Social Proof / Results · **Direction:** Stat Hero (B) / Editorial Stat.

### 2. Breaking / Launch (was "X Just Dropped Y")
Timely news the audience wants to be first on.
- "[Thing] just changed for [role]. What it means for you:"
- "New: [capability]. Here's why it matters this week."
**Mix:** Product Spotlight / Direct CTA · **Direction:** Hero Visual (A) / Spotlight Dark.

### 3. Free / Secret Reveal
A resource, tactic, or insight that feels like insider knowledge.
- "Most [personas] pay for [thing]. Here's how to get the same result for free."
- "The [tactic] nobody in [industry] talks about:"
**Mix:** Educational / How-to · **Direction:** Listicle Teaser (C).

### 4. Contrarian Correction (was "You're Doing X Wrong")
Challenge a default belief the audience holds.
- "Stop [common practice]. It's quietly costing you [cost]."
- "Everyone says [conventional wisdom]. After [evidence], I disagree."
**Mix:** Engagement / Opinion · **Direction:** Hook Headline (A) / Sticker-editorial.

### 5. Comparison / Battle
Two approaches, tools, or eras — pick a side.
- "[Approach A] vs [Approach B] for [goal] — here's what actually won."
- "We tried [X] for a quarter, then switched to [Y]. The difference:"
**Mix:** Educational / Product Spotlight · **Direction:** editorial-mixed.

### 6. New Capability (was "X Can Now Do Y")
Reframe something familiar around a non-obvious ability.
- "You can now [surprising thing] with [tool/process]. Few people do."
- "Turns out [familiar thing] also solves [different problem]."
**Mix:** Educational / How-to · **Direction:** type-allnumbers.

### 7. Industry Shift (was "This Changes Everything")
A trend with stakes the reader feels personally.
- "[Industry] is shifting. The [personas] who adapt now will own [outcome]."
- "In 12 months, [practice] will be table stakes. Most teams aren't ready."
**Mix:** Engagement / Opinion · **Direction:** Spotlight Dark (A).

### 8. Relatable Behind-the-Scenes (was "Entertaining Automation")
Personality + process; the human angle on how the work gets done.
- "I ran [process] manually for a month so you don't have to. What I learned:"
- "Here's the unglamorous system behind [impressive result]."
**Mix:** Social Proof / Engagement · **Direction:** Cream Press (C) / editorial-mixed.

---

## Opening-line patterns by format

**LinkedIn post (first line — only ~210 chars show before "see more"):**
- Pattern interrupt: "Unpopular opinion: [claim]."
- Stat lead: "[Number] [unit] of [thing] is wasted on [activity]. Here's the fix."
- Story open: "Last [time period], a [persona] told me [problem]. So we [action]."

**Carousel cover (≤6 words, must earn the swipe):**
- "[N] [things] that [outcome]"
- "Stop [practice]. Start [practice]."
- "The [role]'s guide to [goal]"

**IG / FB single-image headline (paired with the visual):**
- Benefit-forward: "[Outcome] without [pain]."
- Quote/proof: pull a single sharp line from a customer or the founder (from `brand.md` approved phrases).

---

## Openers to never use

- "Today I want to share…" / "Let me tell you about…" (delay, passive)
- "In this post we'll cover…" (corporate table-of-contents)
- "Hey everyone, happy [day]!" (filler)
- "[Broad topic] is changing the world…" (generic, no specificity)
- Any opener that explains what the post is *about* instead of *being* the hook.

---

## How this connects to the rest of the pipeline

- **`social-calendar`** picks a hook archetype per post and writes it into the **Content Angle** field, so production knows the intended scroll-stopper.
- **`content-performance-analyst`** tags each published post's hook archetype (a dimension in `${BRAND}_PERFORMANCE_DB`) and reports which archetypes win — feeding the next calendar's mix back through `social-calendar` Step 1b.
- When the Performance Brief shows an archetype underperforming for the brand, deprioritize it here; when one overperforms, lean in.
