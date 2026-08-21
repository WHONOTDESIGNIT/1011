const fs = require('fs');
const path = require('path');

const ROOT = 'd:/1011-main/1011-main/1011-main';
const pages = [
  `${ROOT}/astro/src/pages/about/index.astro`,
  `${ROOT}/astro/src/pages/about/brand-story/index.astro`,
  `${ROOT}/astro/src/pages/about/company-profile/index.astro`,
  `${ROOT}/astro/src/pages/about/manufacturing-capabilities/index.astro`,
  `${ROOT}/astro/src/pages/about/quality-control/index.astro`,
  `${ROOT}/astro/src/pages/contact/index.astro`,
  `${ROOT}/astro/src/pages/ipl-hair-removal-is-safe/index.astro`,
];

const en = JSON.parse(fs.readFileSync(`${ROOT}/messages/work/extract_en_aboutPages.json`, 'utf8'));
const ar = JSON.parse(fs.readFileSync(`${ROOT}/messages/work/extract_ar_aboutPages.json`, 'utf8'));
const enMain = JSON.parse(fs.readFileSync(`${ROOT}/messages/en.json`, 'utf8'));

// key tree comparison
function flatKeys(o, p = '') {
  return Object.keys(o).flatMap((k) =>
    o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])
      ? flatKeys(o[k], p + k + '.')
      : Array.isArray(o[k]) ? [p + k + '[]'] : [p + k]
  );
}
const ke = flatKeys(en.aboutPages).sort();
const ka = flatKeys(ar.aboutPages).sort();
console.log('en leaf count:', ke.length, '| ar leaf count:', ka.length);
console.log('trees identical:', JSON.stringify(ke) === JSON.stringify(ka));
if (JSON.stringify(ke) !== JSON.stringify(ka)) {
  console.log('only en:', ke.filter((x) => !ka.includes(x)));
  console.log('only ar:', ka.filter((x) => !ke.includes(x)));
}

// resolve a dotted path incl. arrays
function getVal(obj, key) {
  return key.split('.').reduce((c, part) => (c == null ? undefined : c[part]), obj);
}

const allUsed = new Set();
for (const file of pages) {
  const src = fs.readFileSync(file, 'utf8');
  // direct t(locale, '...') calls
  for (const m of src.matchAll(/t\(\s*locale\s*,\s*'([^']+)'\s*\)/g)) allUsed.add(m[1]);
  // key refs in frontmatter data ('aboutPages.xxx')
  for (const m of src.matchAll(/'aboutPages\.[^']+'/g)) allUsed.add(m[0].slice(1, -1));
  // common keys referenced
  for (const m of src.matchAll(/'common\.(citableSummary|exploreProducts|home)'/g)) allUsed.add(m[0].slice(1, -1));
  // existing nav/contact keys referenced (must exist in en.json, not in extract)
  for (const m of src.matchAll(/'nav\.[^']+'/g)) allUsed.add(m[0].slice(1, -1));
  for (const m of src.matchAll(/'contact\.[^']+'/g)) allUsed.add(m[0].slice(1, -1));
}

let missing = 0;
for (const key of [...allUsed].sort()) {
  if (key.startsWith('aboutPages.')) {
    if (getVal(en.aboutPages, key.slice('aboutPages.'.length)) === undefined) {
      console.log('MISSING in extract_en aboutPages:', key);
      missing++;
    }
  } else if (key.startsWith('common.') || key.startsWith('nav.') || key.startsWith('contact.')) {
    if (getVal(enMain, key) === undefined) {
      console.log('MISSING in en.json:', key);
      missing++;
    }
  }
}
console.log('used keys total:', allUsed.size, '| missing:', missing);

// leftover-English heuristic scan on template text nodes
const leftovers = [];
for (const file of pages) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    const stripped = line.replace(/^\s*\/\/.*/, '').replace(/^\s*\*.*/, '');
    const noJS = stripped
      .replace(/\{[^}]*\}/g, '{}')          // remove {} expressions
      .replace(/<[^>]+>/g, '<>')            // remove tags
      .replace(/&[a-zA-Z#0-9]+;/g, '&;');   // entities
    const text = noJS.replace(/[<>{}]/g, ' ').trim();
    // ignore frontmatter (before ---) and pure JS/attribute lines
    const isAttrOnly = /^[a-zA-Z-]+=/.test(text);
    const isStyleOrJs = /^(const|let|var|import|export|function|if|return|className|class=|style=|src=|href=|alt=)/.test(text);
    if (text.length > 3 && /^[A-Za-z0-9 ,.'’“”&()\-–—+%$/:;!?]+$/.test(text) && !isAttrOnly && !isStyleOrJs && text.split(' ').length >= 4) {
      leftovers.push(`${path.basename(path.dirname(file))}/${path.basename(file)}:${i + 1}: ${text.slice(0, 90)}`);
    }
  });
}
console.log('possible leftover English lines:');
leftovers.forEach((l) => console.log('  ' + l));
