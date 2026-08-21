// 汇总所有语言页面链接，写入 pages_summary.txt（核心页面只列一次，因为各语言完全对齐）
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

const lines = [];
// 1) en 核心页面（其他语言前缀相同）
const enBase = path.join(__dirname, 'dist');
const enAll = walk(enBase, enBase, []);
const core = enAll.filter((x) => !x.startsWith('/blog/') && !x.startsWith('/develo-') && x !== '/index.backup').sort();
const blogs = enAll.filter((x) => x.startsWith('/blog/')).sort();
const develo = enAll.filter((x) => x.startsWith('/develo-') || x === '/index.backup').sort();

lines.push('【核心页面】en 根目录（其余语言前缀相同：/tr /ar /es /fr /ru /he /pt-BR /nl）');
for (const u of core) lines.push('  ' + u);
lines.push('');
lines.push('【核心页面】带语言前缀示例');
for (const l of LANGS.slice(1)) {
  lines.push(`  ${l}: 同 /${l} 前缀，如 /${l}${core[0] === '/' ? '' : core[0]}`);
}
lines.push('');
lines.push('【博客文章】en 根目录（各语言前缀相同；非 en/tr/ar 语言走 fallback→en）');
for (const u of blogs) lines.push('  ' + u);
lines.push('');
lines.push('【develo 系列 / 备份】（开发用，不推送）');
for (const u of develo) lines.push('  ' + u);
lines.push('');
for (const l of LANGS) {
  const base = l === 'en' ? enBase : path.join(__dirname, 'dist', l);
  if (!fs.existsSync(base)) continue;
  const all = walk(base, base, []);
  lines.push(`=== ${l}: 总 ${all.length} 页（核心 ${all.filter((x) => !x.startsWith('/blog/') && !x.startsWith('/develo-') && x !== '/index.backup').length} + 博客 ${all.filter((x) => x.startsWith('/blog/')).length} + develo ${all.filter((x) => x.startsWith('/develo-') || x === '/index.backup').length}）`);
}
fs.writeFileSync(path.join(__dirname, 'pages_summary.txt'), lines.join('\n'));
console.log('done');
