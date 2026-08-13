// 深度扫描 dist/nl/**/*.html 正文中的英文功能词残留（导航/页脚已由 verify_nl.cjs 覆盖）
// 注意：荷兰语合法同形词已从 STOP 集合排除：
//   we   = 我们（主语代词，如 "we leveren"）
//   want = 因为（连词，如 "want wij bieden"）
//   over = 关于/超过（介词，如 "over ons"）
//   of   = 或（连词，如 "A of B"）
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'dist', 'nl');
const STOP = new Set(['the', 'and', 'with', 'your', 'from', 'this', 'that', 'what', 'why', 'how', 'are', 'were', 'will', 'our', 'you', 'of', 'to', 'at', 'by', 'we', 'not', 'but', 'when', 'which', 'who', 'about', 'into', 'through', 'during', 'before', 'after', 'under', 'also', 'very', 'more', 'most', 'have', 'has', 'had', 'does', 'did', 'can', 'could', 'would', 'should', 'may', 'might', 'must', 'only', 'just', 'then', 'than', 'there', 'here', 'all', 'any', 'some', 'they', 'them', 'their', 'its', 'need', 'want', 'make', 'made', 'use', 'used', 'using', 'new', 'now', 'out', 'get', 'go', 'good', 'best', 'free', 'buy', 'sale', 'learn', 'read']);
// 荷兰语合法同形词（大写的英文词仍会被报告，此处仅排除常见荷兰语词）
const NL_OK = new Set(['we', 'want', 'over', 'of', 'en', 'van', 'met', 'in', 'op', 'de', 'het', 'een', 'voor', 'aan', 'bij', 'na', 'uit', 'ook', 'maar', 'om', 'als', 'dan', 'door', 'onder', 'niet', 'wel', 'ze', 'je', 'geen', 'nog', 'al', 'tot', 'best', 'had']);

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
    // 荷兰语商业文本中的英语借词组合（合法，非残留；无 \b 以覆盖荷兰语连写，如 end-to-enddiensten）
    .replace(/end-to-end/gi, ' e2e ')
    .replace(/time-to-market/gi, ' t2m ')
    .replace(/direct-to-consumer/gi, ' d2c ')
    .replace(/state-of-the-art/gi, ' soa ')
    .replace(/after-sales/gi, ' aftersales ')
    .replace(/look-and-feel/gi, ' lookfeel ')
    .replace(/do-not-track/gi, ' dnt ')
    .replace(/lay-out/gi, ' layout ')
    .replace(/\bnew\s+(york|zealand)\b/gi, ' $1 ')
    .replace(/\s+/g, ' ');
}

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
    if (NL_OK.has(w)) continue;
    if (STOP.has(w)) hits.set(w, (hits.get(w) || 0) + 1);
  }
  if (hits.size) {
    console.log(`--- ${rel}`);
    console.log(`  EN 功能词: ${[...hits.entries()].map(([w, n]) => `${w}(${n})`).join(' ')}`);
    fail++;
  }
}
console.log(`扫描页面数: ${total}`);
console.log(fail ? `\n${fail} 个页面存在英文功能词残留` : '\n全部 nl 页面正文无英文功能词残留 OK');
process.exit(fail ? 1 : 0);
