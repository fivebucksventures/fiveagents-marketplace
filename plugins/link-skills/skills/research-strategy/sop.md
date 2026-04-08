# Research & Strategy SOP

## Research sources

**Primary sources (always use these — they are verified):**

| Source | What it's good for | File location |
|--------|-------------------|---------------|
| brands/{brand}/brand.md | Brand voice, positioning, approved phrases, visual guidelines | Internal |
| context/product.md | Features, pricing, differentiators, use cases | Internal |
| context/audience.md | Personas, pain points, objections, buying triggers, EN/ID language | Internal |
| context/competitors.md | Competitor pros/cons, positioning angles, comparison tables, messaging gaps | Internal |
| reference/fivebucks_summary.md | Full platform feature summary with detailed use cases | Internal |

**Secondary sources (use when user provides additional context):**
- User-provided market data, campaign briefs, or performance reports
- Industry reports or statistics shared by the user in the conversation
- Competitor screenshots or pricing pages shared by the user

**Never invent from:**
- Outside knowledge not grounded in the context files
- Assumed features not listed in context/product.md
- Hypothetical customer stories, testimonials, or case studies
- Pricing not listed in context/product.md

---

## How to validate claims

Before including any claim in a strategy output, run it through this validation checklist:

**Product claims:**
- [ ] Is this feature listed by name in context/product.md?
- [ ] Is the capability described accurately (not exaggerated)?
- [ ] Is the pricing correct per context/product.md?
- [ ] Does the feature exist on the plan tier being referenced?

**Competitive claims:**
- [ ] Is this competitor listed in context/competitors.md?
- [ ] Is the limitation described there supported by the pros/cons or comparison table?
- [ ] Is the claim specific (e.g., "no AI Search features") rather than vague?

**Audience claims:**
- [ ] Is this pain point listed in context/audience.md for this persona?
- [ ] Is the buying trigger referenced there?
- [ ] Does the persona-to-plan mapping match context/audience.md?

**Claims that are NEVER acceptable:**
- Guaranteed ranking results or timeframes (exception: the 90-day managed service guarantee — cite exactly as stated in context/product.md)
- Invented social proof (customer logos, testimonials, case studies)
- Feature capabilities not listed in context/product.md
- Pricing not in context/product.md
- Competitor weaknesses not supported by context/competitors.md

---

## How to summarize insights

Use this format for any insight produced from research or analysis:

**Insight format:**
```
[Observation]: [What the data or context shows]
[Implication]: [What this means for the campaign or persona]
[Recommendation]: [What to do about it]
```

**Example:**
```
Observation: No major competitor (SEMrush, Ahrefs, Jasper, Apollo) tracks AI Search
  citations alongside SERP rankings — this gap is confirmed in context/competitors.md
  messaging gap #1.

Implication: fivebucks.ai has a genuine first-mover advantage in the AI Search category
  that SEO professionals (Marcus) will find compelling, especially given their concern
  about AI disrupting traditional SEO (audience.md pain point #2).

Recommendation: Lead the Marcus persona campaign with AI Search tracking as the
  primary differentiator, using the message: "Track your Google rankings and ChatGPT
  citations in one dashboard."
```

**Insight quality rules:**
- One insight per observation — don't stack multiple claims into one bullet
- Be specific — cite the source (context file + section) that supports the observation
- Separate observation from interpretation — don't conflate what you see with what it means
- Keep insights actionable — if it doesn't lead to a recommendation, cut it

---

## How to produce recommendations

**Recommendation format:**
```
Priority: High | Medium | Low
Recommendation: [Specific action in imperative form]
Rationale: [Why — grounded in a specific context file insight]
Owner: [Who should execute — e.g., content team, design team, user]
```

**Example:**
```
Priority: High
Recommendation: Build a comparison landing page: "fivebucks.ai vs. SEMrush"
  targeting the Marcus (SEO Professional) persona.
Rationale: SEMrush is Marcus's current primary tool (audience.md), and
  fivebucks.ai has a clear differentiation on AI Search tracking and execution
  vs. analysis-only (competitors.md messaging gap #1 and #3).
  Comparison pages convert well for users actively evaluating alternatives.
Owner: Content team — use content-creation skill with Problem-Solution framework.
```

**Recommendation rules:**
- Maximum 5 recommendations per strategy brief — prioritize ruthlessly
- High priority = highest impact, lowest effort or most time-sensitive
- Every recommendation must be tied to a specific insight (not a general best practice)
- Include the skill or workflow that should execute the recommendation
- Recommendations should be specific enough that someone else could act on them without asking questions

**Prioritization guide:**

| Priority | Criteria |
|----------|---------|
| High | Directly addresses the persona's #1 pain point OR targets a clear competitive gap; near-term execution |
| Medium | Supports the campaign goal but has dependencies or requires more resource; strengthens existing messaging |
| Low | Nice-to-have, longer-term, or requires data we don't yet have |
