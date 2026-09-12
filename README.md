# Playstore Review Agent

Pulls Google Play and App Store reviews for your app(s), turns them into
ratings/sentiment/keyword/anomaly insights, and feeds a published dashboard.

**Live dashboard:** https://claude.ai/code/artifact/5a00898a-0f6d-4dc3-8a4b-c1683a1c04ad

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
npm run fetch      # pull new reviews for every app in config.json
npm run analyze    # (re)build data/out/dashboard-data.json from what's stored
npm run all        # fetch + analyze in one step
```

## Refreshing the dashboard

```
npm run all
```

then republish `dashboard.html` (same file, same artifact URL) with the
updated `data/out/dashboard-data.json` as the `data.json` companion file.

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
