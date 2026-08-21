// 临时核查：41 篇英文博客 frontmatter 完整性（根目录 35 旧 + astro 内 6 新）
const fs = require('fs');
const path = require('path');
const dirs = ['src/content/blog/en', 'astro/src/content/blog/en'];
const KEYS = ['title', 'excerpt', 'date', 'author', 'category', 'image', 'slug', 'readTime', 'canonicalSlug'];
const rows = [];
let total = 0;
for (const d of dirs) {
  if (!fs.existsSync(d)) { console.log('MISSING DIR:', d); continue; }
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.mdx'))) {
    total++;
    const t = fs.readFileSync(path.join(d, f), 'utf8');
    const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) { rows.push({ file: d + '/' + f, noFm: true }); continue; }
    const fm = m[1];
    const get = (k) => {
      const r = fm.match(new RegExp('^' + k + ':(.*)$', 'm'));
      return r ? r[1].trim().replace(/^["']|["']$/g, '') : null;
    };
    const missing = KEYS.filter((k) => get(k) === null);
    rows.push({ file: d + '/' + f, missing, date: get('date'), slug: get('slug'), canonical: get('canonicalSlug') });
  }
}
console.log('total mdx =', total);
for (const r of rows) {
  if (r.noFm) { console.log('NO_FRONTMATTER:', r.file); continue; }
  console.log([r.file, 'missing=' + (r.missing.length ? r.missing.join(',') : 'none'), 'date=' + (r.date || '-'), 'canonical=' + (r.canonical || '-')].join(' | '));
}
const slugs = rows.filter((r) => !r.noFm).map((r) => r.slug).filter(Boolean);
const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
console.log('dup slugs:', dup.length ? [...new Set(dup)].join(',') : 'none');
