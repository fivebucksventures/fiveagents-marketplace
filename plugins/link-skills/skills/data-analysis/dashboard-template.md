# Dashboard Template

## KPIs list

### Traffic KPIs

| KPI | Description | Source |
|-----|-------------|--------|
| Total Traffic | Total visits per month to tracked URLs | fivebucks.ai Monitor & Improve |
| Traffic Change % | % change vs. prior period (week/month) | fivebucks.ai Monitor & Improve |
| Tracked URLs | Number of URLs being monitored | fivebucks.ai Monitor & Improve |
| SERP Position 1-3 | Count of keywords ranking positions 1-3 | fivebucks.ai SERP Tracking |
| SERP Position 4-10 | Count of keywords ranking positions 4-10 | fivebucks.ai SERP Tracking |
| SERP Position 11-20 | Count of keywords ranking positions 11-20 | fivebucks.ai SERP Tracking |
| Ranking Movements | Count of keywords that moved up or down | fivebucks.ai SERP Tracking |
| AI Citations | Number of ChatGPT/Claude/Perplexity mentions | fivebucks.ai Search Tracking |
| AI Citation Frequency | Average citation frequency per tracked URL | fivebucks.ai Search Tracking |
| Site Diagnostic Score | SEO score (0-100) for the primary domain | fivebucks.ai Site Diagnostics |
| Content Published | Number of articles published in period | fivebucks.ai Publish Content |

### Lead Generation KPIs

| KPI | Description | Source |
|-----|-------------|--------|
| Leads Captured | Leads collected via lead capture widget | fivebucks.ai Traffic to Leads |
| Leads Found | Contacts imported from 275M+ database | fivebucks.ai Find Leads |
| Leads Enriched | Contacts with AI-completed missing data | fivebucks.ai Enrich Contact Details |
| Enrichment Rate | % of imported leads successfully enriched | fivebucks.ai Enrich Contact Details |
| Total Leads in CRM | Total lead count across all lists/segments | fivebucks.ai Organize & Target |
| Emails Sent | Total emails sent in outreach campaigns | fivebucks.ai Automate Outreach |
| Open Rate | Emails opened / emails sent × 100 | fivebucks.ai Automate Outreach |
| Click Rate | Links clicked / emails sent × 100 | fivebucks.ai Automate Outreach |
| Reply Rate | Replies received / emails sent × 100 | fivebucks.ai Automate Outreach |
| Campaign Count | Number of active email campaigns | fivebucks.ai Automate Outreach |

### Funnel KPIs

| KPI | Formula | Target benchmark |
|-----|---------|-----------------|
| Traffic → Lead Conversion Rate | Widget captures / total visits × 100 | 1-3% (industry average) |
| Lead → Email Engagement Rate | Emails opened / leads contacted × 100 | 25-35% (B2B average) |
| Email → Reply Rate | Replies / emails sent × 100 | 5-10% (cold email) |
| Lead → Pipeline Rate | Replies that become meetings / leads contacted | Track and set own baseline |

---

## Definitions

**Traffic:**
- **Visit**: A single session from a unique user to a tracked URL within the reporting period
- **Traffic change %**: (Current period traffic − Prior period traffic) / Prior period traffic × 100
- **SERP position**: Google search ranking position for a tracked keyword on the date of the most recent refresh

**AI Search:**
- **AI Citation**: An appearance of a tracked URL or brand name in a ChatGPT, Claude, or Perplexity response
- **Citation frequency**: Number of times cited / number of queries tracked

**Lead Generation:**
- **Lead captured**: A form submission via the fivebucks.ai lead capture widget
- **Lead found**: A contact imported from the 275M+ database via Find Leads
- **Lead enriched**: A lead with at least email address + company completed via AI enrichment
- **Enrichment rate**: Leads successfully enriched / leads submitted for enrichment × 100

**Email Campaign:**
- **Open rate**: Unique opens / delivered emails × 100 (note: iOS privacy changes affect tracking accuracy)
- **Click rate**: Unique link clicks / delivered emails × 100
- **Reply rate**: Replies received / delivered emails × 100
- **Delivered**: Emails sent minus bounces

---

## Reporting cadence

### Weekly reporting (campaign-active periods)
Track and review:
- Email campaign: sent, open rate, click rate, reply rate vs. prior week
- Leads captured (widget) vs. prior week
- SERP movements for top 10 tracked keywords
- AI citations (if significant changes)

**Format:** KPI scorecard table + 2-3 key insights + 1-2 immediate actions

### Monthly reporting (standard cadence)
Track and review:
- All traffic KPIs with month-over-month comparison
- Full SERP position distribution (1-3, 4-10, 11-20)
- AI citation count and frequency trends
- Lead generation funnel: captured → enriched → contacted → replied
- Email campaign performance across all active campaigns
- Content published count and performance by URL

**Format:** Full report with KPI scorecard + insights + recommendations + data gaps

### Quarterly reporting (strategic review)
Track and review:
- All monthly KPIs with quarter-over-quarter and year-over-year comparison
- Top performing content by traffic and AI citations
- Lead funnel conversion rates vs. benchmarks
- Plan usage: credits consumed vs. allocated (is the plan tier appropriate?)
- Strategic recommendations for next quarter

**Format:** Full analysis with executive summary + detailed KPI breakdown + recommendations

---

## Attribution notes

**Traffic attribution:**
- fivebucks.ai tracks traffic for URLs you add to the Traffic Monitor feature
- Traffic data reflects visits to those specific URLs — not total site traffic
- For total site traffic, use Google Analytics or Google Search Console alongside fivebucks.ai data

**Lead attribution:**
- Widget-captured leads are attributed to the page where the widget triggered
- Database leads (Find Leads) are attributed to the campaign they are added to
- Email replies are attributed to the campaign sequence that sent the email

**AI Search attribution:**
- AI citations are tracked based on the queries and URLs you set up in the AI Search Tracking feature
- Not all AI mentions are captured — coverage depends on the queries monitored
- Use AI citation data as a directional signal, not an exact count

**Multi-touch attribution:**
- fivebucks.ai does not provide full multi-touch attribution across traffic and lead workflows by default
- For unified attribution, export data and combine in a spreadsheet or BI tool
- Note in reports when a metric is partial or estimated

---

## Example dashboard layout

Use this layout structure for monthly reports saved to `outputs/dashboards/`:

```markdown
# [Campaign or Domain] Performance Report — [Month Year]

**Period:** [Start date] to [End date]
**Prepared:** [Date]

---

## Summary

[2-3 sentence overview of the period. Was it positive or challenging overall?
What was the single most important finding?]

---

## Traffic Scorecard

| KPI | Prior Period | Current Period | Change | vs. Target |
|-----|-------------|----------------|--------|------------|
| Total Traffic | 1,820 | 2,140 | +18% | ✅ Target: 2,000 |
| SERP Positions 1-3 | 3 | 5 | +2 | ✅ Target: 5 |
| SERP Positions 4-10 | 8 | 7 | -1 | ⚠️ |
| AI Citations | 12 | 19 | +58% | ✅ |
| Content Published | 3 | 5 | +2 | ✅ Target: 4 |

---

## Lead Generation Scorecard

| KPI | Prior Period | Current Period | Change | vs. Target |
|-----|-------------|----------------|--------|------------|
| Leads Captured | 28 | 41 | +46% | ✅ Target: 30 |
| Leads Found | 150 | 200 | +33% | ✅ |
| Enrichment Rate | 74% | 81% | +7pp | ✅ Target: 75% |
| Emails Sent | 200 | 310 | +55% | ✅ |
| Open Rate | 28% | 31% | +3pp | ✅ Target: 25% |
| Reply Rate | 6% | 8% | +2pp | ✅ Target: 5% |

---

## Key Insights

1. **[Insight label]:** [Observation] → [Implication] → [Recommendation]
2. **[Insight label]:** [Observation] → [Implication] → [Recommendation]
3. **[Insight label]:** [Observation] → [Implication] → [Recommendation]

---

## Recommendations

| Priority | Action | Rationale |
|----------|--------|-----------|
| High | [Specific action] | [Why — grounded in data above] |
| High | [Specific action] | [Why] |
| Medium | [Specific action] | [Why] |

---

## Data Gaps

- [Any metric that couldn't be tracked or was incomplete — and how to fix it next period]
```
