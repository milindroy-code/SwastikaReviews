const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'data', 'raw');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rawFilePath(platform, appId) {
  const safe = String(appId).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(RAW_DIR, `${platform}-${safe}.json`);
}

function loadRaw(platform, appId) {
  const file = rawFilePath(platform, appId);
  if (!fs.existsSync(file)) return {};
  try {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    const map = {};
    for (const r of arr) map[r.id] = r;
    return map;
  } catch (e) {
    console.error(`Failed to parse ${file}, starting fresh:`, e.message);
    return {};
  }
}

function saveRaw(platform, appId, map) {
  ensureDir(RAW_DIR);
  const file = rawFilePath(platform, appId);
  const arr = Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
  return arr.length;
}

/** Merge freshly fetched reviews into the existing store on disk. Returns { total, added }. */
function mergeReviews(platform, appId, freshReviews) {
  const existing = loadRaw(platform, appId);
  const before = Object.keys(existing).length;
  for (const r of freshReviews) {
    existing[r.id] = r;
  }
  const total = saveRaw(platform, appId, existing);
  return { total, added: total - before };
}

module.exports = { loadRaw, saveRaw, mergeReviews, rawFilePath, ensureDir, RAW_DIR };
