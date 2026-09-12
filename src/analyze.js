const Sentiment = require('sentiment');
const STOPWORDS = require('./stopwords');

const sentiment = new Sentiment();

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

function topKeywords(reviews, { n = 25, bigrams = true } = {}) {
  const counts = new Map();
  for (const r of reviews) {
    const tokens = tokenize(`${r.title || ''} ${r.text || ''}`);
    const seenInReview = new Set();
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
      seenInReview.add(t);
    }
    if (bigrams) {
      for (let i = 0; i < tokens.length - 1; i++) {
        const bg = `${tokens[i]} ${tokens[i + 1]}`;
        counts.set(bg, (counts.get(bg) || 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }));
}

/** Monday-based ISO week start, as YYYY-MM-DD. */
function weekStart(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function ratingBucket(rating) {
  if (rating <= 2) return 'negative';
  if (rating === 3) return 'neutral';
  return 'positive';
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function std(arr, avg) {
  if (arr.length < 2) return 0;
  return Math.sqrt(mean(arr.map((x) => (x - avg) ** 2)));
}

function analyzeReviews(reviews, meta) {
  const total = reviews.length;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  const sentimentBuckets = { positive: 0, neutral: 0, negative: 0 };
  const byWeek = new Map();
  let textSentimentSum = 0;

  for (const r of reviews) {
    const rating = Math.round(r.rating) || 0;
    if (distribution[rating] !== undefined) distribution[rating]++;
    ratingSum += r.rating || 0;

    const bucket = ratingBucket(r.rating);
    sentimentBuckets[bucket]++;

    const s = sentiment.analyze(r.text || '');
    textSentimentSum += s.comparative || 0;

    const wk = weekStart(r.date);
    if (wk) {
      if (!byWeek.has(wk)) {
        byWeek.set(wk, { period: wk, count: 0, ratingSum: 0, negative: 0, neutral: 0, positive: 0 });
      }
      const w = byWeek.get(wk);
      w.count++;
      w.ratingSum += r.rating || 0;
      w[bucket]++;
    }
  }

  const avgRating = total ? ratingSum / total : 0;
  const avgTextSentiment = total ? textSentimentSum / total : 0;

  const weeks = [...byWeek.values()]
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((w) => ({
      period: w.period,
      count: w.count,
      avgRating: w.count ? Number((w.ratingSum / w.count).toFixed(2)) : 0,
      positive: w.positive,
      neutral: w.neutral,
      negative: w.negative,
    }));

  // Flag anomalous weeks: negative-review spikes and rating dips, based on
  // simple mean+stddev over the trailing history (needs a few weeks of data).
  const flags = [];
  if (weeks.length >= 4) {
    const negCounts = weeks.map((w) => w.negative);
    const negMean = mean(negCounts);
    const negStd = std(negCounts, negMean);
    const ratingAvgs = weeks.map((w) => w.avgRating).filter((x) => x > 0);
    const ratingMean = mean(ratingAvgs);

    for (const w of weeks) {
      if (negStd > 0 && w.negative >= 3 && w.negative > negMean + 1.5 * negStd) {
        flags.push({
          period: w.period,
          type: 'negative_spike',
          detail: `${w.negative} negative reviews (avg ${negMean.toFixed(1)}/week)`,
        });
      }
      if (w.count >= 3 && w.avgRating > 0 && w.avgRating < ratingMean - 0.6) {
        flags.push({
          period: w.period,
          type: 'rating_dip',
          detail: `avg rating ${w.avgRating} vs overall ${ratingMean.toFixed(2)}`,
        });
      }
    }
  }

  const negativeReviews = reviews.filter((r) => r.rating <= 2);
  const positiveReviews = reviews.filter((r) => r.rating >= 4);

  return {
    ...meta,
    totalReviews: total,
    avgRating: Number(avgRating.toFixed(2)),
    avgTextSentiment: Number(avgTextSentiment.toFixed(3)),
    ratingDistribution: distribution,
    sentimentBuckets,
    weeklyTrend: weeks,
    flags,
    topKeywords: topKeywords(reviews),
    topComplaintKeywords: topKeywords(negativeReviews, { n: 20 }),
    topPraiseKeywords: topKeywords(positiveReviews, { n: 20 }),
    recentReviews: reviews
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 300),
  };
}

module.exports = { analyzeReviews, tokenize, topKeywords, weekStart, ratingBucket };
