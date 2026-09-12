# Playstore Review Agent

Pulls Google Play and App Store reviews for your app(s), turns them into
ratings/sentiment/keyword/anomaly insights, and feeds two published dashboards.

**Review Desk (own-app monitoring):** https://claude.ai/code/artifact/5a00898a-0f6d-4dc3-8a4b-c1683a1c04ad
**Battlecard (competitive tracker):** https://claude.ai/code/artifact/847f2468-97e6-4363-88ba-cfb5cf24c36d

## How it works

1. **Fetch** (`src/fetchPlay.js`, `src/fetchIos.js`) — pulls reviews from each
   store's public review feed. No developer account or API key needed:
   - Google Play: the same paginated review endpoint the Play Store website
     itself uses (via the `google-play-scraper` package).
   - App Store: Apple's public customer-reviews RSS/JSON feed (via
     `app-store-scraper`), capped at Apple's ~500 most recent reviews per app.
   - Every run merges into `data/raw/<platform>-<appId>.json`, deduped by
     review id, so history accumulates across runs instead of resetting.

2. **Analyze** (`src/analyze.js`) — offline, no external calls:
   - Rating distribution, weekly rating/volume/sentiment trend
   - Sentiment buckets (rating-based: 1–2★ negative, 3★ neutral, 4–5★ positive)
     plus a lexicon-based text sentiment score (`sentiment` package)
   - Top keywords overall, and separately from praise (4–5★) vs complaint
     (1–2★) reviews
   - Anomaly flags: weeks with a negative-review spike or a rating dip,
     relative to the app's own trailing mean/stddev
   - Issue categorization (`src/categorize.js`): every review is tagged into
     exactly one of **Trading**, **Investment**, **eKYC**, **Activation**,
     **Acquisition**, **Support**, or **Other** by phrase-matching its text.
     Trading (order execution, F&O, intraday, margin, brokerage/charges) and
     Investment (mutual funds, SIPs, IPOs, long-term/goal-based investing)
     are kept as separate categories on purpose — they are different
     concepts and are never merged into one bucket, in either dashboard.

3. **Optional LLM narrative** (`src/llmSummarize.js`) — skipped entirely
   unless `ANTHROPIC_API_KEY` is set. When enabled, sends a rating-balanced
   sample of reviews to Claude and adds a narrative summary, top
   complaints/praise, feature requests, notable bugs, and suggested actions
   per app. The dashboard shows this section automatically once present.

4. **Dashboard data** (`src/buildDashboardData.js`) — writes
   `data/out/dashboard-data.json`, which `dashboard.html` (the published
   Artifact) reads.

## Commands

```
npm run fetch                # pull new reviews for every app in config.json
npm run analyze              # (re)build data/out/dashboard-data.json from what's stored
npm run all                  # fetch + analyze in one step

npm run fetch:competitors    # pull new reviews for every app in competitors.json
npm run analyze:competitors  # (re)build data/out/competitor-data.json (Swastika + competitors)
npm run all:competitors      # fetch + analyze competitors in one step
```

## Refreshing the dashboards

Review Desk:
```
npm run all
```
then republish `dashboard.html` (same file, same artifact URL) with the
updated `data/out/dashboard-data.json` as the `data.json` companion file.

Battlecard:
```
npm run all:competitors
```
then republish `battlecard.html` (same file, same artifact URL) with the
updated `data/out/competitor-data.json` as the `competitor-data.json`
companion file. The feature-parity backlog itself is live (stored in the
artifact's own database) and does not need a republish to update — only
the scoreboard/keyword/quote data does.

Only Review Desk's refresh is on the daily automated schedule right now
(see "Automated refresh" below) — Battlecard's competitor data is
manual/on-request since it's a heavier pull (6 extra apps) on a slower-
moving comparison. Ask to have it scheduled too if you want it automatic.

## Configuring apps

Edit `config.json`:

```json
{
  "apps": [
    {
      "name": "Display name",
      "play": { "appId": "com.example.app", "country": "in", "lang": "en" },
      "ios": { "appId": 123456789, "country": "in" }
    }
  ]
}
```

Either `play` or `ios` can be omitted if you only track one store. Add more
entries to track multiple apps — the dashboard already supports an app
switcher, it just stays hidden while there's only one.

## Configuring competitors

Edit `competitors.json` (same shape as `config.json`, under a `competitors`
key). `src/buildCompetitorData.js` always compares against `config.json`'s
first app as "own" and everything in `competitors.json` as "competitor":

```json
{
  "competitors": [
    {
      "name": "Display name",
      "play": { "appId": "com.example.competitor", "country": "in", "lang": "en" },
      "ios": { "appId": 987654321, "country": "in" }
    }
  ]
}
```

## Automated refresh

A scheduled cloud routine (**Swastika Review Agent — Daily Refresh**,
https://claude.ai/code/routines/trig_01Bht7nSU1rUCqUkBqeaXvoB) runs
`npm run all` and republishes Review Desk every day at 7:00 AM IST against
the `milindroy-code/SwastikaReviews` GitHub repo, then commits the refreshed
`data/` back. Battlecard/competitor data is not on this schedule yet.

## Battlecard's feature-parity backlog

Battlecard declares the `db` runtime capability, so the backlog board is a
live, shared document store owned by that artifact — anyone who opens the
page can add, upvote, re-status, or remove an entry, and it persists for
everyone without a republish. Two things follow from that:
- **Because it declares `db`, the artifact is organization-internal** — it
  can't be shared publicly outside your claude.ai organization.
- Entries live in a `backlog` collection on the artifact itself, not in this
  repo — there's nothing to back up here, and deleting the artifact deletes
  the backlog with it.

## Turning on LLM narrative summaries

```
setx ANTHROPIC_API_KEY "sk-ant-..."      # persists for new shells (Windows)
```
or set it for the current shell only, then run `npm run all`.

## Limitations

- App Store reviews are capped at Apple's own feed limit (~500 most recent
  per app, per country).
- Google Play reviews are capped per run at ~1,800 newest (12 pages); re-run
  periodically to keep building history rather than expecting full backlog
  in one go.
- Keyword extraction and sentiment are lightweight/lexicon-based by design —
  good for trend-spotting, not a substitute for reading flagged reviews.
