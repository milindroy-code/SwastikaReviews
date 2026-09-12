const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { loadRaw } = require('./store');
const { analyzeReviews } = require('./analyze');
const llm = require('./llmSummarize');

const OUT_DIR = path.join(__dirname, '..', 'data', 'out');
const OUT_FILE = path.join(OUT_DIR, 'dashboard-data.json');

async function buildAppEntry(appCfg) {
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

  const combinedAnalysis = analyzeReviews(combined, { platform: 'combined' });

  let narrative = null;
  if (llm.isEnabled()) {
    console.log(`  [llm] summarizing ${appCfg.name}...`);
    try {
      narrative = await llm.summarizeApp(appCfg.name, combined);
    } catch (e) {
      console.error(`  [llm] failed for ${appCfg.name}:`, e.message);
    }
  }

  return {
    name: appCfg.name,
    play: appCfg.play || null,
    ios: appCfg.ios || null,
    platforms,
    combined: combinedAnalysis,
    narrative,
  };
}

async function build() {
  const apps = [];
  for (const appCfg of config.apps) {
    apps.push(await buildAppEntry(appCfg));
  }

  const data = {
    generatedAt: new Date().toISOString(),
    llmEnabled: llm.isEnabled(),
    apps,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nWrote ${OUT_FILE}`);
  return data;
}

if (require.main === module) {
  build().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { build, OUT_FILE };
