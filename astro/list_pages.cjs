// 列出 dist 中所有已启用语言的页面链接（每语言 51 核心页 + 博客 + develo）
const fs = require('fs');
const path = require('path');
const LANGS = ['en', 'tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-BR', 'nl'];

function walk(dir, base, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else if (e.name === 'index.html') {
      let rel = path.relative(base, p).split(path.sep).join('/').replace(/\/index\.html$/, '');
      out.push(rel === '' ? '/' : '/' + rel);
    }
  }
  return out;
}

const result = {};
for (const l of LANGS) {
  const base = l === 'en' ? path.join(__dirname, 'dist') : path.join(__dirname, 'dist', l);
  if (!fs.existsSync(base)) { result[l] = null; continue; }
  const all = walk(base, base, []);
  const core = all.filter((x) => !x.startsWith('/blog/') && !x.startsWith('/develo-') && x !== '/index.backup');
  const blogs = all.filter((x) => x.startsWith('/blog/'));
  const develo = all.filter((x) => x.startsWith('/develo-') || x === '/index.backup');
  result[l] = { core: core.sort(), blogs: blogs.sort(), develo: develo.sort() };
}

for (const l of LANGS) {
  const r = result[l];
  if (!r) { console.log(`=== ${l}: (无 dist 目录)`); continue; }
  console.log(`\n=== ${l}（核心 ${r.core.length} 页 + 博客 ${r.blogs.length} 篇 + develo/备份 ${r.develo.length}）===`);
  console.log('[核心页面]');
  for (const u of r.core) console.log('  ' + (l === 'en' ? u : `/${l}${u === '/' ? '' : u}`));
  console.log('[博客]');
  for (const u of r.blogs) console.log('  ' + (l === 'en' ? u : `/${l}${u}`));
  console.log('[develo/备份]');
  for (const u of r.develo) console.log('  ' + (l === 'en' ? u : `/${l}${u}`));
}
