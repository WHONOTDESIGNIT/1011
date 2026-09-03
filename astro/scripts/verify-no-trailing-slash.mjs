// 方案B 全量校验脚本：构建产物 URL 格式 100% 无结尾斜杠
// 用法：在 astro/ 目录执行 `node scripts/verify-no-trailing-slash.mjs`（需先完成 npm run build）
// 检查项：
//   1. dist 文件结构 —— 页面产物为 about.html 而非 about/index.html（trailingSlash: 'never'）
//   2. sitemap.xml —— 所有 <loc> 无结尾斜杠（根路径除外）
//   3. 所有 HTML 的 <link rel="canonical"> —— 无结尾斜杠
//   4. 所有 HTML 站内链接 href —— 无结尾斜杠
//   5. _redirects 已复制到 dist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error('  ❌ ' + msg);
};

console.log('===== 方案B 构建产物校验：全站无结尾斜杠 =====');

// 1. 文件结构检查
console.log('\n[1/5] dist 文件结构（期望 .html 产物，非 index.html 目录）');
const checks = [
  'about.html',
  'services.html',
  'products.html',
  'faq.html',
  'contact.html',
  'blog.html',
  'tr.html',
  'tr/about.html',
  'ro/about.html',
  'about/brand-story.html',
];
let badStructure = false;
for (const rel of checks) {
  const full = path.join(DIST, rel);
  if (!fs.existsSync(full)) {
    fail(`缺少页面产物 ${rel}`);
    badStructure = true;
  }
}
// 反向检查：不应再出现 about/index.html（旧格式）
for (const rel of ['about/index.html', 'tr/about/index.html']) {
  if (fs.existsSync(path.join(DIST, rel))) {
    fail(`仍存在旧格式 index.html 目录产物 ${rel}`);
    badStructure = true;
  }
}
if (!badStructure) console.log('  ✅ 页面产物均为 .html 格式，无 index.html 目录');

// 2. sitemap.xml（索引）+ sitemap-*.xml（按语言拆分的子文件）
console.log('\n[2/5] sitemap（索引 + 22 语言子文件）');
const sitemapNames = fs.readdirSync(DIST).filter((f) => f.startsWith('sitemap') && f.endsWith('.xml')).sort();
let sitemapLocTotal = 0;
let sitemapBad = 0;
for (const name of sitemapNames) {
  const xml = fs.readFileSync(path.join(DIST, name), 'utf8');
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  sitemapLocTotal += locs.length;
  const bad = locs.filter((u) => u !== 'https://iplmanufacturer.com' && /\/$/.test(u));
  if (bad.length) {
    sitemapBad += bad.length;
    bad.slice(0, 5).forEach((u) => fail(`${name} 带尾斜杠: ${u}`));
  }
}
console.log(`  sitemap 文件 ${sitemapNames.length} 个（索引 + ${sitemapNames.length - 1} 语言），URL 总数: ${sitemapLocTotal}`);
if (sitemapBad === 0) console.log('  ✅ 所有 <loc> 无结尾斜杠（根路径除外）');

// 3/4. 遍历所有 HTML
console.log('\n[3/5] canonical 标签 / [4/5] 站内链接');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.netlify') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}
const htmlFiles = walk(DIST);
let canonBad = 0;
let linkBad = 0;
const linkBadSamples = new Set();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  // canonical
  for (const m of html.matchAll(/<link rel="canonical" href="([^"]*)"/g)) {
    const url = m[1];
    if (url !== 'https://iplmanufacturer.com' && url.endsWith('/')) {
      canonBad++;
      if (canonBad <= 10) fail(`canonical 带尾斜杠 ${path.relative(DIST, file)}: ${url}`);
    }
  }
  // 站内链接：href="/..."（排除 /、#、http、mailto、tel、_astro、.netlify）
  for (const m of html.matchAll(/\bhref="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href === '/' || href.startsWith('/_astro/') || href.startsWith('/.netlify')) continue;
    if (href.endsWith('/')) {
      linkBad++;
      if (linkBadSamples.size < 10) linkBadSamples.add(`${path.relative(DIST, file)} -> ${href}`);
    }
  }
}
console.log(`  已检查 HTML 文件数: ${htmlFiles.length}`);
console.log(`  canonical 总数检查: ${canonBad === 0 ? '✅ 无尾斜杠' : `❌ ${canonBad} 处违规`}`);
if (linkBad === 0) console.log('  ✅ 全部站内链接无结尾斜杠');
else {
  linkBadSamples.forEach((s) => fail('站内链接带尾斜杠: ' + s));
  fail(`共 ${linkBad} 处站内链接带尾斜杠`);
}

// 5. _redirects
console.log('\n[5/5] _redirects 部署文件');
const rd = path.join(DIST, '_redirects');
if (!fs.existsSync(rd)) fail('dist/_redirects 不存在');
else {
  const content = fs.readFileSync(rd, 'utf8');
  const rules = content.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  const aboutRules = rules.filter((r) => r.includes('/about'));
  console.log(`  ✅ _redirects 已部署，规则 ${rules.length} 条（about 规则 ${aboutRules.length} 条）`);
}

console.log('\n===== 校验结论：' + (errors === 0 ? '✅ 全部通过，100% 无结尾斜杠' : `❌ ${errors} 处问题`) + ' =====');
process.exit(errors === 0 ? 0 : 1);
