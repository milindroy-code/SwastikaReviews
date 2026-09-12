// Optional LLM narrative layer. Skipped entirely unless ANTHROPIC_API_KEY is set,
// so the pipeline works fully offline on stats/keywords alone.
const MODEL = 'claude-sonnet-5';

function isEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function sampleReviews(reviews, n) {
  // Prefer recent + a mix of ratings so the model sees the full spread, not
  // just whichever star rating happens to be most common.
  const byRating = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const r of reviews) {
    const b = Math.round(r.rating);
    if (byRating[b]) byRating[b].push(r);
  }
  const perBucket = Math.ceil(n / 5);
  const picked = [];
  for (const b of [1, 2, 3, 4, 5]) {
    picked.push(...byRating[b].slice(0, perBucket));
  }
  return picked.slice(0, n);
}

async function summarizeApp(appName, reviews) {
  if (!isEnabled()) return null;
  if (!reviews.length) return null;

  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic();

  const sample = sampleReviews(reviews, 120).map((r) => ({
    platform: r.platform,
    rating: r.rating,
    date: r.date,
    text: (r.text || '').slice(0, 500),
  }));

  const prompt = `You are analyzing app store reviews for "${appName}". Below is a JSON array of a sample of reviews (rating, platform, date, text). Produce a concise JSON object with this exact shape:
{
  "summary": "2-3 sentence narrative overview of how users currently feel about the app",
  "topComplaints": ["short phrase", ...] (max 6, most impactful first),
  "topPraise": ["short phrase", ...] (max 6),
  "featureRequests": ["short phrase", ...] (max 6, empty array if none evident),
  "notableBugs": ["short phrase", ...] (max 6, empty array if none evident),
  "suggestedActions": ["short, concrete action for the product team", ...] (max 5)
}
Only return the JSON object, no other text.

Reviews:
${JSON.stringify(sample)}`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.error(`  [llm:${appName}] failed to parse response:`, e.message);
    return null;
  }
}

module.exports = { isEnabled, summarizeApp };
