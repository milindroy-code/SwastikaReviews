const config = require('../config.json');
const { fetchPlayReviews } = require('./fetchPlay');
const { fetchIosReviews } = require('./fetchIos');

async function fetchAll() {
  for (const app of config.apps) {
    console.log(`\nFetching reviews for ${app.name}...`);
    if (app.play) await fetchPlayReviews(app.play, app.name);
    if (app.ios) await fetchIosReviews(app.ios, app.name);
  }
}

if (require.main === module) {
  fetchAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { fetchAll };
