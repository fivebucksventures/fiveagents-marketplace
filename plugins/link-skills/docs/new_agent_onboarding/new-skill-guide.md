# Adding a New Agent Skill

## Steps

### 1. Define the dashboard config

Add an entry to `src/lib/dashboard/default-configs.ts`:

```typescript
'your-skill-id': {
  sections: [
    // KPI cards — displayed as summary cards on the dashboard
    {
      name: 'Section Title',
      type: 'kpi',
      fields: [
        { key: 'metrics.dot.path', label: 'Display Label', format: 'currency_sgd', comparison: 'dod' },
        { key: 'another.path', label: 'Another KPI', format: 'number' },
      ],
    },
    // Tables — rendered from arrays in the metrics JSONB
    {
      name: 'Table Title',
      type: 'table',
      source: 'metrics.dot.path.to.array',
      columns: [
        { key: 'column_key', label: 'Column Label', format: 'number' },
        { key: 'text_column', label: 'Name' },
      ],
    },
    // Flags — color-coded action items (urgent=red, optimize=yellow, monitoring=green)
    { name: 'Flags', type: 'flags', source: 'flags' },
    // Lists — bulleted string arrays
    { name: 'Recommendations', type: 'list', source: 'recommendations' },
    // Text — single text block
    { name: 'Top Recommendation', type: 'text', source: 'top_recommendation' },
  ],
}
```

**Available formats:** `currency_sgd`, `number`, `percent`, `date`, `boolean`

**Available comparison periods:** `dod` (day-over-day), `wow` (week-over-week), `mom` (month-over-month) — only set on KPI fields where comparison makes sense (e.g. spend, clicks, conversions). Don't set on text fields or one-off metrics.

**Available section types:** `kpi`, `table`, `flags`, `list`, `text`

### 2. Build the agent in Link

Create the skill in the Link repo. The agent must write `agent_runs.metrics` JSONB with keys matching the dot-paths defined in step 1.

Example: if the config has `{ key: 'google_ads.totals.spend', label: 'Spend' }`, the agent must write:
```json
{
  "google_ads": {
    "totals": {
      "spend": 120.69
    }
  }
}
```

See `docs/new_agent_onboarding/metrics-spec.md` for the full JSONB contract and per-skill schemas.

### 3. Assign the agent to a client

In the admin dashboard (`/dashboard/admin/clients/[id]`):
1. Click "Assign Agent"
2. Select the skill, set the brand, name, and schedule
3. The config from step 1 is automatically applied via `getDefaultConfig(skill)`

### 4. Agent runs → dashboard

Once the agent runs and writes to `agent_runs`:
- Client goes to `/dashboard` → adds the agent dashboard → sees KPIs, tables, flags etc.
- Run detail at `/dashboard/runs/[id]` shows the full report

## Key files

| File | Purpose |
|------|---------|
| `src/lib/dashboard/default-configs.ts` | Dashboard templates per skill — **edit this for new skills** |
| `docs/new_agent_onboarding/metrics-spec.md` | JSONB contract between Link agents and the dashboard |
| `src/app/api/admin/agents/route.ts` | API that creates agents with the default config |
| `src/components/dashboard/custom/metricsToWidgets.ts` | Fallback: auto-generates widgets from raw JSONB if no config exists |

## Tips

- Start with KPIs + one table + flags. Add more sections after seeing real data.
- The `source` field for tables/lists/text is a dot-path to the array/string in the metrics JSONB.
- The `key` field for KPI fields is a dot-path to the scalar value.
- If the agent has no config defined, `metricsToWidgets()` auto-detects the JSONB shape — useful for prototyping, but the result won't have custom labels or proper formatting.
- Column `format` determines how values display and whether comparison deltas show in tables.
