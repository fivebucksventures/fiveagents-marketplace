#!/usr/bin/env python3
"""
GA4 Data API helper — pulls conversion and funnel data for fivebucks.ai

Usage:
  python3 ga4_pull.py --date yesterday
  python3 ga4_pull.py --date 2026-03-11
  python3 ga4_pull.py --start 2026-03-05 --end 2026-03-11
  python3 ga4_pull.py --date yesterday --json   # machine-readable output
"""

import os
import json
import argparse
from datetime import date, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Metric, Dimension, FilterExpression,
    Filter, FilterExpressionList
)
from google.oauth2 import service_account

# ── Config ────────────────────────────────────────────────────────────────────
# Brand resolved at startup — override via --brand or DEFAULT_BRAND env var
_DEFAULT_BRAND = os.environ.get("DEFAULT_BRAND", "fivebucks")
# Property ID resolved after argparse (see main())
SA_KEY_FILE = os.environ.get("GOOGLE_ANALYTICS_SA_KEY_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "ga4-sa-key.json"))

# Pages excluded from landing page breakdowns (not conversion-relevant)
EXCLUDED_LANDING_PAGES = [
    "/privacy",     # Email outbound footer links — not a real landing page
    "/terms",       # Legal pages — same reason
]

# Full funnel events in sequence
# form_start and form_submit are split by page for granular drop-off visibility
FUNNEL_EVENTS = [
    "start_free_trial_click",       # CTA click — trial path entry
    "signup_form_start",            # form_start on /auth/signup (virtual — computed)
    "signup_form_submit",           # form_submit on /auth/signup (virtual — computed)
    "profile_form_start",           # form_start on /auth/signup/profile (virtual — computed)
    "profile_form_submit",          # form_submit on /auth/signup/profile (virtual — computed)
    "Trial_Activated",              # Trial successfully activated
    "schedule_call_click",          # Booked a call (sales path, parallel)
    "Paid_Basic_Monthly",
    "Paid_Basic_Annual",
    "Paid_Pro_Monthly",
    "Paid_Pro_Annual",
    "Paid_Enterprise_Monthly",
    "Paid_Enterprise_Annual",
]

PAID_EVENTS = [e for e in FUNNEL_EVENTS if e.startswith("Paid_")]
CONVERSION_EVENTS = FUNNEL_EVENTS  # keep alias for backwards compat

# ── Auth ──────────────────────────────────────────────────────────────────────
def get_client():
    credentials = service_account.Credentials.from_service_account_file(
        SA_KEY_FILE,
        scopes=["https://www.googleapis.com/auth/analytics.readonly"]
    )
    return BetaAnalyticsDataClient(credentials=credentials)

# ── Queries ───────────────────────────────────────────────────────────────────
def pull_overview(client, start_date, end_date):
    """Sessions, new users, total events."""
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[
            Metric(name="sessions"),
            Metric(name="newUsers"),
            Metric(name="totalUsers"),
            Metric(name="screenPageViews"),
            Metric(name="bounceRate"),
            Metric(name="averageSessionDuration"),
        ],
    )
    response = client.run_report(request)
    if not response.rows:
        return {}
    row = response.rows[0]
    return {
        "sessions": int(row.metric_values[0].value),
        "new_users": int(row.metric_values[1].value),
        "total_users": int(row.metric_values[2].value),
        "pageviews": int(row.metric_values[3].value),
        "bounce_rate": round(float(row.metric_values[4].value) * 100, 1),
        "avg_session_duration_sec": round(float(row.metric_values[5].value), 1),
    }

def pull_page_event(client, start_date, end_date, event_name, page_path):
    """Pull count for a specific event on a specific page."""
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="eventCount")],
        dimensions=[Dimension(name="eventName"), Dimension(name="pagePath")],
        dimension_filter=FilterExpression(
            and_group=FilterExpressionList(
                expressions=[
                    FilterExpression(filter=Filter(
                        field_name="eventName",
                        string_filter=Filter.StringFilter(value=event_name)
                    )),
                    FilterExpression(filter=Filter(
                        field_name="pagePath",
                        string_filter=Filter.StringFilter(value=page_path)
                    )),
                ]
            )
        )
    )
    response = client.run_report(request)
    return sum(int(row.metric_values[0].value) for row in response.rows)


def pull_conversions(client, start_date, end_date):
    """Event counts for all conversion events.
    form_start/form_submit split by page:
      signup_form_start/submit  → /auth/signup
      profile_form_start/submit → /auth/signup/profile
    """
    result = {event: 0 for event in CONVERSION_EVENTS}

    # Split form events by page
    result["signup_form_start"]   = pull_page_event(client, start_date, end_date, "form_start",  "/auth/signup")
    result["signup_form_submit"]  = pull_page_event(client, start_date, end_date, "form_submit", "/auth/signup")
    result["profile_form_start"]  = pull_page_event(client, start_date, end_date, "form_start",  "/auth/signup/profile")
    result["profile_form_submit"] = pull_page_event(client, start_date, end_date, "form_submit", "/auth/signup/profile")

    # All other events (no page filter)
    other_events = [e for e in CONVERSION_EVENTS if e not in
                    ["signup_form_start", "signup_form_submit", "profile_form_start", "profile_form_submit"]]
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="eventCount")],
        dimensions=[Dimension(name="eventName")],
        dimension_filter=FilterExpression(
            or_group=FilterExpressionList(
                expressions=[
                    FilterExpression(filter=Filter(
                        field_name="eventName",
                        string_filter=Filter.StringFilter(value=event)
                    ))
                    for event in other_events
                ]
            )
        )
    )
    response = client.run_report(request)
    for row in response.rows:
        event_name = row.dimension_values[0].value
        count = int(row.metric_values[0].value)
        if event_name in result:
            result[event_name] = count

    return result

def pull_traffic_sources(client, start_date, end_date):
    """Sessions by channel group (paid, organic, direct, etc.)."""
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="sessions"), Metric(name="newUsers")],
        dimensions=[Dimension(name="sessionDefaultChannelGroup")],
    )
    response = client.run_report(request)
    result = {}
    for row in response.rows:
        channel = row.dimension_values[0].value
        sessions = int(row.metric_values[0].value)
        new_users = int(row.metric_values[1].value)
        result[channel] = {"sessions": sessions, "new_users": new_users}
    return result


def pull_bot_sessions(client, start_date, end_date):
    """Estimate bot/ghost sessions — Unassigned channel with 0 new users and 0 pageviews.
    These are excluded from clean_sessions_total in the brief output."""
    request = RunReportRequest(
        property=f"properties/{GA4_PROPERTY_ID}",
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        metrics=[Metric(name="sessions"), Metric(name="newUsers"), Metric(name="screenPageViews")],
        dimensions=[Dimension(name="sessionDefaultChannelGroup"), Dimension(name="landingPage")],
    )
    response = client.run_report(request)
    bot_sessions = 0
    for row in response.rows:
        channel = row.dimension_values[0].value
        landing_page = row.dimension_values[1].value
        sessions = int(row.metric_values[0].value)
        new_users = int(row.metric_values[1].value)
        pageviews = int(row.metric_values[2].value)
        # Bot signal: Unassigned channel + empty landing page + 0 new users + 0 pageviews
        if channel == "Unassigned" and landing_page == "" and new_users == 0 and pageviews == 0:
            bot_sessions += sessions
    return bot_sessions

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Pull GA4 data")
    parser.add_argument("--brand", default=_DEFAULT_BRAND, choices=["fivebucks", "fiveagents"])
    parser.add_argument("--date", help="Single date (YYYY-MM-DD or 'yesterday')")
    parser.add_argument("--start", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", help="End date (YYYY-MM-DD)")
    parser.add_argument("--json", action="store_true", dest="as_json", help="Output as JSON")
    args = parser.parse_args()

    global GA4_PROPERTY_ID
    GA4_PROPERTY_ID = os.environ[f"{args.brand.upper()}_GA4_PROPERTY"]

    # Resolve dates
    # Note: data before 2026-03-08 affected by tracking bug — use Mar 8 as earliest reliable date
    CLEAN_DATA_START = "2026-03-08"

    if args.date:
        if args.date == "yesterday":
            d = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            d = args.date
        start_date, end_date = d, d
    elif args.start and args.end:
        start_date, end_date = args.start, args.end
    else:
        d = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        start_date, end_date = d, d

    # Warn if pulling data before clean start
    if start_date < CLEAN_DATA_START:
        print(f"⚠️  Warning: start_date {start_date} is before {CLEAN_DATA_START} (tracking bug fix date). Data may be unreliable.")

    client = get_client()

    overview = pull_overview(client, start_date, end_date)
    conversions = pull_conversions(client, start_date, end_date)
    traffic = pull_traffic_sources(client, start_date, end_date)
    bot_sessions = pull_bot_sessions(client, start_date, end_date)

    total_paid = sum(conversions.get(e, 0) for e in PAID_EVENTS)
    raw_sessions = overview.get("sessions", 0)
    clean_sessions = max(0, raw_sessions - bot_sessions)

    result = {
        "date_range": {"start": start_date, "end": end_date},
        "overview": overview,
        "conversions": conversions,
        "paid_conversions_total": total_paid,
        "traffic_sources": traffic,
        "bot_sessions_excluded": bot_sessions,
        "clean_sessions_total": clean_sessions,
    }

    if args.as_json:
        print(json.dumps(result, indent=2))
        return

    # Human-readable output
    print(f"\n📊 GA4 Report — {start_date}" + (f" to {end_date}" if end_date != start_date else ""))
    print(f"\n── Overview ──")
    print(f"  Sessions:          {overview.get('sessions', 0):,}")
    print(f"  New Users:         {overview.get('new_users', 0):,}")
    print(f"  Total Users:       {overview.get('total_users', 0):,}")
    print(f"  Pageviews:         {overview.get('pageviews', 0):,}")
    print(f"  Bounce Rate:       {overview.get('bounce_rate', 0)}%")
    print(f"  Avg Session:       {overview.get('avg_session_duration_sec', 0)}s")

    print(f"\n── Conversions ──")
    for event, count in conversions.items():
        flag = " ✅" if count > 0 else ""
        print(f"  {event:<35} {count:>4}{flag}")
    print(f"  {'TOTAL PAID':.<35} {total_paid:>4}")

    print(f"\n── Traffic Sources ──")
    for channel, data in sorted(traffic.items(), key=lambda x: -x[1]["sessions"]):
        print(f"  {channel:<30} {data['sessions']:>4} sessions  {data['new_users']:>4} new users")

    print()

if __name__ == "__main__":
    main()
