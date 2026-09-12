const gplay = require('google-play-scraper').default;
const { mergeReviews } = require('./store');

const MAX_PAGES = 12; // ~12 * ~150 = up to ~1800 reviews per run, newest first

/** Fetch newest reviews for a Play Store app, paginating until exhausted or MAX_PAGES. */
async function fetchPlayReviews(appCfg, appName) {
  const { appId, country = 'us', lang = 'en' } = appCfg;
  let all = [];
  let token;
  for (let page = 0; page < MAX_PAGES; page++) {
    const opts = { appId, country, lang, sort: gplay.sort.NEWEST, num: 150 };
    if (token) opts.nextPaginationToken = token;
    let res;
    try {
      res = await gplay.reviews(opts);
    } catch (e) {
      console.error(`  [play:${appId}] page ${page} error: ${e.message}`);
      break;
    }
    all = all.concat(res.data);
    token = res.nextPaginationToken;
    if (!token || res.data.length === 0) break;
  }

  const normalized = all.map((r) => ({
    id: r.id,
    platform: 'play',
    appName,
    rating: r.score,
    title: r.title || null,
    text: r.text || '',
    date: r.date,
    version: r.version || null,
    userName: r.userName || null,
    thumbsUp: r.thumbsUp || 0,
    url: r.url || null,
  }));

  const { total, added } = mergeReviews('play', appId, normalized);
  console.log(`  [play:${appId}] fetched ${normalized.length}, +${added} new, ${total} total stored`);
  return { total, added };
}

module.exports = { fetchPlayReviews };
