const { fetchAll } = require('./fetchAll');
const { build } = require('./buildDashboardData');

async function runAll() {
  await fetchAll();
  console.log('\nAnalyzing and building dashboard data...');
  await build();
}

if (require.main === module) {
  runAll().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runAll };
