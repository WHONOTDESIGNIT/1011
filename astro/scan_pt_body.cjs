// 深度扫描 dist/pt-PT/**/*.html 正文中的英文功能词残留（导航/页脚已由 verify_pt.cjs 覆盖）
// 注意：葡语合法词 "for"（动词 ser 虚拟式，如 "se for"）与 "do"（de+o 缩合）已从 STOP 集合排除
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'pt-PT');
const STOP = new Set(['the', 'and', 'with', 'your', 'from', 'this', 'that', 'what', 'why', 'how', 'are', 'were', 'will', 'our', 'you', 'of', 'to', 'at', 'by', 'we', 'not', 'but', 'when', 'which', 'who', 'about', 'into', 'through', 'during', 'before', 'after', 'under', 'also', 'very', 'more', 'most', 'have', 'has', 'had', 'does', 'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must', 'only', 'just', 'then', 'than', 'there', 'here', 'all', 'any', 'some', 'they', 'them', 'their', 'its', 'need', 'want', 'make', 'made', 'use', 'used', 'using', 'new', 'now', 'out', 'get', 'go', 'good', 'best', 'free', 'buy', 'sale', 'learn', 'read']);
// 葡语合法同形词（大写的英文词仍会被报告，此处仅排除常见葡语词）
const PT_OK = new Set(['for', 'do', 'no', 'na', 'os', 'as', 'em', 'de', 'que', 'se', 'ao', 'à', 'da']);

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
    .replace(/\bnew\s+(york|zealand)\b/gi, ' $1 ')
    .replace(/\s+/g, ' ');
}

const SKIP_PREFIX = ['develo-', 'index.backup'];

let fail = 0;
let total = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const parts = rel.split(path.sep);
  if (parts[0] === 'blog' && parts.length > 1) continue;
  if (parts.some((p) => p.startsWith('develo-') || p.startsWith('index.backup'))) continue;
  total++;
  const html = fs.readFileSync(file, 'utf8');
  const text = textOf(html);
  const words = text.toLowerCase().split(/([^a-zà-ÿ]+)/).filter((w) => w.length >= 2 && /^[a-zà-ÿ]+$/.test(w));
  const hits = new Map();
  for (const w of words) {
    if (PT_OK.has(w)) continue;
    if (STOP.has(w)) hits.set(w, (hits.get(w) || 0) + 1);
  }
  if (hits.size) {
    console.log(`--- ${rel}`);
    console.log(`  EN 功能词: ${[...hits.entries()].map(([w, n]) => `${w}(${n})`).join(' ')}`);
    fail++;
  }
}
console.log(`扫描页面数: ${total}`);
console.log(fail ? `\n${fail} 个页面存在英文功能词残留` : '\n全部 pt-PT 页面正文无英文功能词残留 OK');
process.exit(fail ? 1 : 0);
