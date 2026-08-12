// 深度扫描 dist/es/**/*.html 正文中的英文功能词残留（导航/页脚已由 verify_es.cjs 覆盖）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'es');
const STOP = new Set(['the', 'and', 'with', 'your', 'for', 'from', 'this', 'that', 'what', 'why', 'how', 'are', 'were', 'will', 'our', 'you', 'of', 'to', 'at', 'by', 'we', 'not', 'but', 'when', 'which', 'who', 'about', 'into', 'through', 'during', 'before', 'after', 'under', 'also', 'very', 'more', 'most', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must', 'only', 'just', 'then', 'than', 'there', 'here', 'all', 'any', 'some', 'they', 'them', 'their', 'its', 'need', 'want', 'make', 'made', 'use', 'used', 'using', 'new', 'now', 'out', 'get', 'go', 'good', 'best', 'free', 'buy', 'sale', 'learn', 'read']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\bnew\s+(york|zealand)\b/gi, ' $1 ') // 专有名词误报消解
    .replace(/\s+/g, ' ');
}

// 已知不可翻译页面（不属于 iShine 主站界面）：
// - develo-* 系列：Develo Design 模板演示页，自含 head/样式、硬编码英文、不走 i18n，主站导航不链接（任务A对 tr/ar 已按同策略接受）
// - index.backup：旧首页备份页，站内无任何链接
const SKIP_PREFIX = ['develo-', 'index.backup'];

let fail = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const parts = rel.split(path.sep);
  // blog 文章正文（mdx 内容）不在本次翻译范围，跳过内容页
  if (parts[0] === 'blog' && parts.length > 1) continue;
  if (parts.length && (parts[parts.length - 1].startsWith('develo-') || parts.includes('index.backup'))) continue;
  const html = fs.readFileSync(file, 'utf8');
   const text = textOf(html);
   const words = text.toLowerCase().split(/([^a-zà-ÿ]+)/).filter((w) => w.length >= 2 && /^[a-zà-ÿ]+$/.test(w));
   const hits = new Map();
   for (const w of words) if (STOP.has(w)) hits.set(w, (hits.get(w) || 0) + 1);
   if (hits.size) {
     console.log(`--- ${rel}`);
     console.log(`  EN 功能词: ${[...hits.entries()].map(([w, n]) => `${w}(${n})`).join(' ')}`);
     fail++;
   }
}
console.log(fail ? `\n${fail} 个页面存在英文功能词残留` : '\n全部 es 页面正文无英文功能词残留 OK');
