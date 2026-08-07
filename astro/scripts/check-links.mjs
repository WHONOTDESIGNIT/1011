// 临时死链检查脚本：扫描 dist 产物中所有页面的 href/src，对照站点文件结构
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');

// 1. 构建 URL → 文件映射（含静态资源）
const urlToFile = new Map(); // key: '/foo' -> 'dist/foo/index.html'
const fileToUrl = new Map();
const staticAssets = new Set(); // key: '/images/x.png'
function walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base);
    else if (entry.name.endsWith('.html')) {
      const rel = path.relative(base, full).replaceAll('\\', '/');
      let url;
      if (rel === 'index.html') url = '/';
      else if (rel.endsWith('/index.html')) url = '/' + rel.slice(0, -'/index.html'.length);
      else url = '/' + rel.slice(0, -'.html'.length);
      urlToFile.set(url, full);
      fileToUrl.set(full, url);
    } else {
      // 静态资源（图片、js、css、pdf、xls 等）
      const rel = path.relative(base, full).replaceAll('\\', '/');
      staticAssets.add('/' + rel);
    }
  }
}
walk(dist, dist);

// 2. 扫描所有 HTML 中 href/src/srcset
const linkPattern = /(?:href|src)\s*=\s*"([^"]+)"/g;
const srcsetPattern = /srcset\s*=\s*"([^"]+)"/g;
const urlPattern = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;

const deadLinks = new Map(); // target -> [{from, raw, type}]
const checked = new Map();

function checkUrl(target, fromFile, raw, type) {
  if (!target || target.startsWith('#') || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('data:') || target.startsWith('blob:')) return;
  if (target.startsWith('/.netlify/')) return; // Netlify 专属端点（仅托管环境）
  if (target.includes('coresg-normal.trae.ai')) return; // 外部生成图
  const clean = (target.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/');
  // 解码 URL 编码（如 %20），与磁盘实际文件名比对
  let decoded = clean;
  try { decoded = decodeURIComponent(clean); } catch { /* 保留原始值 */ }
  if (decoded.endsWith('.html')) { const c = decoded.slice(0, -5); checked.set(c, true); if (!urlToFile.has(c) && !staticAssets.has(c)) push(clean, fromFile, raw, type); return; }
  checked.set(decoded, true);
  if (!urlToFile.has(decoded) && !staticAssets.has(decoded)) push(clean, fromFile, raw, type);
}
function push(target, fromFile, raw, type) {
  if (!deadLinks.has(target)) deadLinks.set(target, []);
  deadLinks.get(target).push({ from: path.relative(dist, fromFile).replaceAll('\\', '/'), raw, type });
}

const htmlFiles = [...urlToFile.values()];
for (const file of htmlFiles) {
  // 剥离 <script>/<style> 块：内联 JS 字符串中的伪属性（如 '"+escapeHtml(x)+"'）不是真实链接
  const html = fs.readFileSync(file, 'utf8')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  let m;
  while ((m = linkPattern.exec(html))) checkUrl(m[1], file, m[1], 'href/src');
  while ((m = srcsetPattern.exec(html))) {
    for (const part of m[1].split(',')) {
      const p = part.trim().split(/\s+/)[0];
      checkUrl(p, file, p, 'srcset');
    }
  }
  while ((m = urlPattern.exec(html))) checkUrl(m[1], file, m[1], 'css-url');
}

// 3. 输出
const lines = [];
lines.push(`=== 页面总数: ${urlToFile.size} | 静态资源总数: ${staticAssets.size} ===`);
lines.push('=== 死链列表 ===');
if (deadLinks.size === 0) lines.push('(无死链)');
for (const [target, sources] of [...deadLinks.entries()].sort()) {
  lines.push(`\n[死链] ${target}`);
  for (const s of sources.slice(0, 8)) lines.push(`   <- ${s.type} ${s.from} (${s.raw})`);
  if (sources.length > 8) lines.push(`   ... 共 ${sources.length} 处`);
}
// 按来源页面统计
const bySource = new Map();
for (const [target, sources] of deadLinks) {
  for (const s of sources) {
    if (!bySource.has(s.from)) bySource.set(s.from, new Set());
    bySource.get(s.from).add(target);
  }
}
lines.push('\n=== 按来源页面统计（死链目标数）===');
for (const [src, targets] of [...bySource.entries()].sort((a, b) => b[1].size - a[1].size)) {
  lines.push(`${String(targets.size).padStart(4)}  ${src}`);
}
const report = lines.join('\n');
console.log(report);
fs.writeFileSync(path.resolve('scripts/check-links-report.txt'), report, 'utf8');
