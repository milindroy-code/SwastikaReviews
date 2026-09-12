const competitorsConfig = require('../competitors.json');
const { fetchPlayReviews } = require('./fetchPlay');
const { fetchIosReviews } = require('./fetchIos');

async function fetchCompetitors() {
  for (const app of competitorsConfig.competitors) {
    console.log(`\nFetching reviews for ${app.name} (competitor)...`);
    if (app.play) await fetchPlayReviews(app.play, app.name);
    if (app.ios) await fetchIosReviews(app.ios, app.name);
  }
}

if (require.main === module) {
  fetchCompetitors().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { fetchCompetitors };
