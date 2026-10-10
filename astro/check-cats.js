
const fs = require('fs');
const path = require('path');

const locales = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];
const catsOwn = new Map();

locales.forEach(l => {
  const dir = path.join('src/content/blog', l);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
    const s = new Set();
    files.forEach(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const m = content.match(/^category\s*:\s*["']?([^"'\n]+)["']?/m);
      if (m) s.add(m[1].trim());
    });
    catsOwn.set(l, s);
  }
});

const enCats = catsOwn.get('en') || new Set();
console.log('EN Category count:', enCats.size);

locales.forEach(l => {
  const localeCats = catsOwn.get(l) || new Set();
  const effective = new Set([...localeCats, ...enCats]);
  console.log(`${l}: ${effective.size} categories`);
});
