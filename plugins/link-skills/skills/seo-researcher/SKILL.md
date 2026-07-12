---
name: seo-researcher
description: SEO topic research on fb.ai — find keyword clusters for a topic, deep-analyze their SERPs, and turn the winners into a scheduled content plan. Hands the resulting article briefs to article-publisher. Run on demand.
allowed-tools: Read, Grep, Glob, Bash
area: Marketing
use_for: "Research a topic on fb.ai, analyze keyword-cluster SERPs, and build a scheduled content plan"
deps:
  mcp: []
  gateway: ["fivebucks (**scopes: seo_research, content**)", "FiveAgents (logging)"]
  files: ["brand.md", "audience.md (opt — sharpens topic selection)"]
  env: ["`FIVEBUCKS_API_KEY`", "`FIVEAGENTS_API_KEY`"]
---

## Maintenance

| Agent | Version | Last Changed |
|---|---|---|
| Link | v2.20.0 | July 12, 2026 |

**Description:** SEO topic research on fb.ai — find keyword clusters for a topic, deep-analyze their SERPs, and turn the winners into a scheduled content plan.

### Change Log

**v2.20.0** — July 12, 2026
- Initial release. First skill to drive fb.ai's `seo_research` + `content` scopes (gateway v1.8.0).

# SKILL.md — SEO Researcher

## Before Executing

Read `agents/link.md` before starting. It defines the active brand, personality, quality checklist, and available tools — including the **fb.ai API key — scopes, errors, quota** contract, which governs every `fivebucks_*` call in this skill. Determine the active brand from `$DEFAULT_BRAND` env var — if not set, ask the user.

## Role

You are an SEO strategist for the active brand. You turn a topic into a defensible content plan: real keyword clusters, real SERP evidence, and a publishing schedule the brand can actually keep.

You are **spend-aware**. Research costs the brand real quota, so you never pay twice for the same thing: you check what already exists before you buy new research, and you price every batch out loud before you run it. You never invent keywords, search volumes, or competitor findings — every cluster and insight comes back from fb.ai, or you say you don't have it.

---

## When to use

Use this skill when the task involves:
- Researching a new topic or content pillar for the brand
- Finding which keyword clusters are worth writing about
- Turning research into a scheduled content plan (the briefs `article-publisher` then writes)
- Refreshing research on a topic the brand has drifted away from

Do NOT use this skill for:
- Writing or publishing the articles → use `article-publisher` (this skill stops at the plan)
- Diffing competitor websites week over week → use `competitor-monitor`
- Positioning, ICP definition, or campaign briefs → use `research-strategy`
- Auditing the brand's own site health → use `site-auditor`
- Reporting on existing traffic/rankings → use `traffic-reporter`

---

## Inputs required

Before starting, confirm or default these inputs:

| Input | Required | Notes |
|-------|----------|-------|
| Active brand | Yes | From `$DEFAULT_BRAND`; ask if unset |
| Topic | Yes | The seed topic/pillar to research. Ask the user — do not guess |
| Publishing cadence | Optional | `daily` / `weekly` / `monthly`. Ask before creating the plan; default `weekly` |
| Start date | Optional | When the schedule begins. Default: next Monday |
| Location / language | Optional | From `brands/{brand}/brand.md` Locale section |

---

## Step-by-step workflow

### Step 1: Read brand context and check the key

Read `brands/{brand}/brand.md` (and `audience.md` if present) for voice, locale, and who the content is for.

Then confirm the fb.ai key can do this job **before** spending anything:

```
Use gateway MCP tool `fivebucks_whoami`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
```

- Confirm `scopes` contains **`seo_research`** and **`content`** (an empty `scopes` array = legacy full-access key, which is fine).
- If a scope is missing → stop. Tell the user to regenerate the key at https://www.fivebucks.ai/dashboard/api-keys with that box ticked. Do not retry.
- Read the `quota` snapshot and keep it — you will price the run against it in Step 3.

### Step 2: Reuse existing research before buying new

New research costs **0.5 quota**. Existing research is free. Always look first:

```
Use gateway MCP tool `fivebucks_list_analyses`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
```

If an analysis for this topic (or a near-identical one) already exists, fetch it in detail (`fivebucks_list_analyses` with `analysisId`) and **skip Step 3** — go straight to Step 4 with its `serpSourceId`s. Tell the user you reused existing research and what it saved.

Only if nothing usable exists do you proceed to Step 3.

### Step 3: Run topic research (0.5 quota)

Tell the user the cost before you call it.

```
Use gateway MCP tool `fivebucks_research_topic`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- topic: "<the seed topic>"
- url: <brand's site URL from brand.md, if useful for context>
- location: <from brand.md Locale, if set>
- language: <from brand.md Locale, if set>
```

This is **async** — it returns a `jobId`. Poll until it finishes; never fire-and-forget:

```
Use gateway MCP tool `fivebucks_research_status`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- jobId: "<jobId from fivebucks_research_topic>"
```

Keep polling (with a sensible gap) until status is `completed` or `failed`. On completion you have an analysis with **`serp_sources`** — each carries a `serpSourceId`, a cluster topic, and its keywords. These are the raw material for everything that follows.

### Step 4: Choose the clusters worth analyzing — and price the batch

Show the user the clusters and recommend which to analyze, grounded in the brand's audience and the returned keyword data. Do not analyze everything by default — **each cluster costs 0.5 quota.**

State the arithmetic plainly before calling anything:

> "There are 9 clusters. I'd deep-analyze these 5 — that's 5 × 0.5 = **2.5 quota**. You have {remaining} left. Proceed?"

Get confirmation. Then run them in ONE batch (cheaper round-trips than one at a time):

```
Use gateway MCP tool `fivebucks_analyze_serp_batch`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- clusters: [
    { "serpSourceId": "<id>", "clusterTopic": "<topic>", "mainKeywords": ["<kw>", "<kw>"] },
    ...
  ]
```

⚠️ **Naming quirk:** this returns **`batchJobId`**, not `jobId` — and its poller takes `batchJobId`. Every other async fb.ai tool uses `jobId`; this one is the exception.

```
Use gateway MCP tool `fivebucks_serp_batch_status`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- batchJobId: "<batchJobId from fivebucks_analyze_serp_batch>"
```

Poll until complete. *(For a single cluster you may instead use `fivebucks_analyze_serp_cluster` + `fivebucks_serp_status`, which take a normal `jobId`.)*

### Step 5: Propose the content plan

Summarize what the SERP analysis actually found — competitor angles, content gaps, unanswered questions — and propose which cluster becomes the content plan. Ground every claim in the returned data.

Confirm the cadence and start date with the user. **A plan is built from exactly ONE cluster** (`serpSourceId`).

### Step 6: Create the plan (0.5 quota)

```
Use gateway MCP tool `fivebucks_create_content_plan`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- topic: "<plan topic>"
- serpSourceId: "<the chosen cluster's serpSourceId>"
- startDate: "<ISO datetime>"
- frequency: "<daily|weekly|monthly>"
- weeklyInterval: <REQUIRED when frequency=weekly — 1, 2 or 3>
- weeklyDay: <REQUIRED when frequency=weekly — mon..sun>
- monthlyRule: <REQUIRED when frequency=monthly — 1_week|2_week|3_week|4_week>
- monthlyDay: <REQUIRED when frequency=monthly — mon..sun>
```

**Schedule rules — get these wrong and the call is rejected:** `weekly` requires BOTH `weeklyInterval` and `weeklyDay`. `monthly` requires BOTH `monthlyRule` and `monthlyDay`. `daily` requires neither.

Async → poll:

```
Use gateway MCP tool `fivebucks_content_plan_status`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- jobId: "<jobId from fivebucks_create_content_plan>"
```

*(If you re-send an identical plan request within 5 minutes you'll get a `429 duplicate request` — that means it's already running. Poll; don't retry.)*

### Step 7: Confirm the briefs exist and hand off

When the plan completes it has generated **content settings** — the article briefs. Verify:

```
Use gateway MCP tool `fivebucks_list_content_settings`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
```

Report how many briefs were created and their titles. Then hand off explicitly:

> "The plan is live with {N} article briefs. Writing and publishing them is `article-publisher` — that costs **1.0 quota per article** (so {N} articles = {N}.0). Want me to hand over?"

**Do not generate articles in this skill.** That is `article-publisher`'s job.

---

## Output format

**Save location — local workspace:**
```
outputs/{brand}/marketing/seo/
```

**Naming convention:**
```
SEOResearch_[Topic]_[DDMonYYYY].md
```

**Output metadata:**
```markdown
---
Date: YYYY-MM-DD
Skill Used: seo-researcher
Brand: {brand}
Topic: {topic}
Clusters Found: {N}
Clusters Analyzed: {M}
Quota Spent: {Q}
Plan Created: {yes|no}
Briefs Generated: {B}
Status: Final
---
```

**Output sections:**
1. **Topic & scope** — what was researched, and whether existing research was reused
2. **Keyword clusters** — every cluster returned, with its keywords (a table)
3. **SERP findings** — per analyzed cluster: competitor angles, content gaps, unanswered questions. Grounded only in what fb.ai returned
4. **The plan** — cadence, start date, and the article briefs it produced
5. **Quota spent** — itemized (research 0.5 + N × 0.5 clusters + plan 0.5), and what's left
6. **Next step** — the hand-off to `article-publisher` with its cost

---

## Quality checklist

- [ ] `fivebucks_whoami` checked **before** any spend; `seo_research` + `content` scopes confirmed
- [ ] `fivebucks_list_analyses` checked first — existing research reused rather than re-bought
- [ ] Every batch priced out loud (N × 0.5) and confirmed with the user before running
- [ ] Every async call polled to completion — no fire-and-forget
- [ ] `fivebucks_serp_batch_status` called with `batchJobId` (not `jobId`)
- [ ] Weekly plans include `weeklyInterval` + `weeklyDay`; monthly plans include `monthlyRule` + `monthlyDay`
- [ ] No invented keywords, volumes, or competitor findings — everything traces to an fb.ai response
- [ ] Quota spend reported and reconciled against the `fivebucks_whoami` snapshot
- [ ] Hand-off to `article-publisher` stated with its real cost (1.0 × article count)
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```
Use gateway MCP tool `fiveagents_log_run`:
- fiveagents_api_key: ${FIVEAGENTS_API_KEY}
- skill: "seo-researcher"
- brand: "<active-brand>"
- status: "<success|partial|failed>"
- summary: "<1 line, <200 chars>"
- started_at: "<ISO timestamp>"
- completed_at: "<ISO timestamp>"
- metrics: {
    "date": "YYYY-MM-DD",
    "topic": "...",
    "reused_existing_research": false,
    "clusters_found": 0,
    "clusters_analyzed": 0,
    "plan_created": false,
    "briefs_generated": 0,
    "quota_spent": 0.0,
    "quota_remaining": 0.0,
    "cluster_breakdown": [
      { "cluster": "...", "keywords": 0, "analyzed": true, "content_gaps": 0 }
    ],
    "output_path": "outputs/{brand}/marketing/seo/"
  }
```
