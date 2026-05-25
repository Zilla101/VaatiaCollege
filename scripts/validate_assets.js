const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const htmlDir = path.join(repoRoot, 'html');

function findHtmlFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.html'));
}

function extractPaths(html) {
  const results = new Set();
  const attrRegex = /(src|href)\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = attrRegex.exec(html)) !== null) {
    const val = m[2].trim();
    if (!val) continue;
    if (val.startsWith('http:') || val.startsWith('https:') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('#')) continue;
    results.add(val);
  }
  return Array.from(results);
}

const htmlFiles = findHtmlFiles(htmlDir);
let missing = [];

for (const file of htmlFiles) {
  const full = path.join(htmlDir, file);
  const content = fs.readFileSync(full, 'utf8');
  const refs = extractPaths(content);
  for (const ref of refs) {
    // normalize
    const candidate = path.join(repoRoot, ref.replace(/\//g, path.sep));
    if (!fs.existsSync(candidate)) {
      missing.push({ page: `html/${file}`, asset: ref, looked: candidate });
    }
  }
}

if (missing.length === 0) {
  console.log('OK: No missing local asset references found in html/*.html');
  process.exit(0);
} else {
  console.log('Missing assets found:');
  for (const m of missing) {
    console.log(`- Page: ${m.page} → ${m.asset}`);
  }
  process.exit(2);
}
