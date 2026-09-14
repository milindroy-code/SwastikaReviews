// Copies the two dashboards + their data files into site/, which is what
// gets deployed to Vercel (project root directory is set to "site").
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_DIR = path.join(ROOT, 'site');

const files = [
  ['dashboard.html', 'dashboard.html'],
  ['battlecard.html', 'battlecard.html'],
  [path.join('data', 'out', 'dashboard-data.json'), 'data.json'],
  [path.join('data', 'out', 'competitor-data.json'), 'competitor-data.json'],
];

fs.mkdirSync(SITE_DIR, { recursive: true });
for (const [src, dest] of files) {
  fs.copyFileSync(path.join(ROOT, src), path.join(SITE_DIR, dest));
  console.log(`  copied ${src} -> site/${dest}`);
}
console.log('site/ updated. Deploy with: cd site && vercel --prod --yes');
