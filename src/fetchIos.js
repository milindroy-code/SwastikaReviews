const store = require('app-store-scraper');
const { mergeReviews } = require('./store');

const MAX_PAGES = 10; // Apple's RSS review feed caps out around page 10

/** Fetch newest reviews for an App Store app across all available RSS pages. */
async function fetchIosReviews(appCfg, appName) {
  const { appId, country = 'us' } = appCfg;
  let all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    let res;
    try {
      res = await store.reviews({ id: appId, country, page, sort: store.sort.RECENT });
    } catch (e) {
      // Apple returns an error once pages run out; that's expected, just stop.
      break;
    }
    if (!res || res.length === 0) break;
    all = all.concat(res);
  }

  const normalized = all.map((r) => ({
    id: r.id,
    platform: 'ios',
    appName,
    rating: r.score,
    title: r.title || null,
    text: r.text || '',
    date: r.updated,
    version: r.version || null,
    userName: r.userName || null,
    thumbsUp: 0,
    url: r.url || null,
  }));

  const { total, added } = mergeReviews('ios', appId, normalized);
  console.log(`  [ios:${appId}] fetched ${normalized.length}, +${added} new, ${total} total stored`);
  return { total, added };
}

module.exports = { fetchIosReviews };
