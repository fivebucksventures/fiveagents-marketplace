---
name: background-generator
description: Generate 20 background images per brand for Reel video production. Run manually or schedule externally.
allowed-tools: Read, Grep, Glob, Bash
---

# SKILL.md — Background Generator

## Role

You generate 20 pre-stored background images per brand for use in Ken Burns Reel videos and static image posts. These backgrounds are used by the content-generator skill. Run manually when the library needs refreshing.

---

## When to use

- When the user asks to refresh or add backgrounds
- When the library feels repetitive (content-generator reusing same images)
- After adding a new brand

Do NOT use for:
- Generating post-specific images → content-generator handles that
- Generating video → content-generator or creative-designer

---

## Step 1 — Read upcoming social calendar briefs

Read the next 2 weeks of social calendar entries for the brand to get fresh `ImageBrief` values.

Use **Notion MCP** to query the calendar:

1. Use `mcp__notion__API-query-data-source` with the brand's Notion DB ID (from env var `${BRAND}_NOTION_DB`) to find the latest `SocialCalendar_` pages (sort by name descending, page_size 5).

2. For each page whose date range covers the next 2 weeks, use `mcp__notion__API-get-block-children` to get the page blocks, find the table block, then get its children (table rows).

3. Parse each row — column order: `Date, Platform, Format, Topic, Persona, ContentAngle, CTA, Hashtags, ImageBrief, Status`. Filter for rows with Status = `"Planned"` and dates within the next 14 days.

Extract all unique `ImageBrief` values (column index 8). These are the prompts.

---

## Step 2 — Build prompt list (20 per brand)

Take up to 20 unique ImageBriefs from Step 1. If fewer than 20, create variations of existing briefs by changing:
- Lighting (morning light, golden hour, dim ambient, bright studio)
- Setting (office, cafe, co-working, home office, outdoor)
- Composition (top-down flat lay, close-up, wide angle, aerial)

**Prompt rules:**
- Use the `ImageBrief` exactly as written in the calendar
- NEVER use the word "portrait" — Nano Banana generates actual portrait photos
- Every prompt must end with: "No text. No logos. No watermarks."

---

## Step 3 — Generate images

```bash
mkdir -p brands/{brand}/backgrounds
```

Generate via **Gemini API** curl:

```bash
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "{ImageBrief}"}]}],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }')

# Extract base64 image and save
python3 -c "
import json, base64, sys
data = json.loads('''${RESPONSE}''')
for part in data['candidates'][0]['content']['parts']:
    if 'inlineData' in part:
        img = base64.b64decode(part['inlineData']['data'])
        with open('brands/{brand}/backgrounds/{descriptive_filename}.png', 'wb') as f: f.write(img)
        print('OK: Image saved')
        sys.exit(0)
print('ERROR: No image in response')
sys.exit(1)
"

sleep 6  # Rate limit: ~10 requests per minute
```

**Filename convention:** Use a descriptive slug based on the Topic or ImageBrief content. Examples:
- `finance_dashboard_laptop.png`
- `singapore_skyline_timelapse.png`
- `abstract_purple_silk.png`
- `cafe_laptop_notepad.png`

Filenames must be descriptive enough that the content-generator can pick the right background based on the post's Topic.

**Rate limit:** 3 seconds between Nano Banana calls.

---

## Step 4 — Verify

```bash
echo "{brand}: $(ls brands/{brand}/backgrounds/*.png | wc -l) images"
```

Must have at least 20 NEW images generated. Skip filenames that already exist — the library grows each month. If any failed, retry.

---

## Step 5 — Notify via Slack

DM the user via Slack MCP (`channel_id: "$SLACK_NOTIFY_USER"`):

```
🖼️ [{brand}] Monthly backgrounds refreshed

New images: 20
Total library: [count] images
Location: brands/{brand}/backgrounds/
```

---

## Quality Checklist

- [ ] 20 images per brand generated
- [ ] Filenames are descriptive (content-generator can pick by Topic)
- [ ] No "portrait" in any prompt
- [ ] All prompts end with "No text. No logos. No watermarks."
- [ ] 3-second delay between Nano Banana calls
- [ ] Existing images NOT deleted (library grows)
- [ ] Slack notification sent
- [ ] Agent run logged to dashboard

---

## Final Step — Log to Dashboard

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract.

```bash
curl -s -X POST "https://www.fiveagents.io/api/agent-runs" \
  -H "Authorization: Bearer ${FIVEAGENTS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "background-generator",
    "brand": "<active-brand>",
    "status": "<success|failed>",
    "summary": "<1 line, <200 chars>",
    "started_at": "<ISO timestamp>",
    "completed_at": "<ISO timestamp>",
    "metrics": {
      "date": "YYYY-MM-DD",
      "images_generated": 0,
      "total_library": 0
    }
  }'
```
