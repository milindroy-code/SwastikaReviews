const fs = require('fs');
const path = require('path');
const ownConfig = require('../config.json');
const competitorsConfig = require('../competitors.json');
const { loadRaw } = require('./store');
const { analyzeReviews } = require('./analyze');

const OUT_DIR = path.join(__dirname, '..', 'data', 'out');
const OUT_FILE = path.join(OUT_DIR, 'competitor-data.json');

function buildEntry(appCfg, role) {
  const platforms = [];
  let combined = [];

  if (appCfg.play) {
    const reviews = Object.values(loadRaw('play', appCfg.play.appId));
    platforms.push(analyzeReviews(reviews, { platform: 'play' }));
    combined = combined.concat(reviews);
  }
  if (appCfg.ios) {
    const reviews = Object.values(loadRaw('ios', appCfg.ios.appId));
    platforms.push(analyzeReviews(reviews, { platform: 'ios' }));
    combined = combined.concat(reviews);
  }

  return {
    name: appCfg.name,
    role,
    play: appCfg.play || null,
    ios: appCfg.ios || null,
    platforms,
    combined: analyzeReviews(combined, { platform: 'combined' }),
  };
}

function build() {
  const ownAppCfg = ownConfig.apps[0];
  if (!ownAppCfg) throw new Error('config.json has no apps configured — nothing to compare competitors against.');

  const apps = [buildEntry(ownAppCfg, 'own')];
  for (const c of competitorsConfig.competitors) {
    apps.push(buildEntry(c, 'competitor'));
  }

  const data = {
    generatedAt: new Date().toISOString(),
    apps,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nWrote ${OUT_FILE}`);
  return data;
}

if (require.main === module) {
  try {
    build();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

module.exports = { build, OUT_FILE };
