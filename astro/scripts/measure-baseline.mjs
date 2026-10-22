#!/usr/bin/env node
/**
 * measure-baseline.mjs — 从真实构建产物里"测量"出 baseline.json 应有的数字。
 *
 * 为什么存在：合并译文会让 21 个 fallback shim 变成真实页面，htmlTotal 不变而
 * site-urls.txt +21，"页面 - 清单"的差值随之下降。基线不改，构建就红（这是设计，
 * 不是故障）。以前改基线靠人算，算错过两次；这里只从产物里读。
 *
 * 用法（在 astro/ 下）：
 *   npm run baseline:measure        # 构建之后跑，红构建也适用：dist 已经是新的
 *   npm run baseline:measure -- ../other-copy/   # 量另一份 checkout（相对路径）
 *
 * 只读，不改任何文件；输出分两块：人读的实测报告 + 可直接粘进 baseline.json 的片段。
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { countBlogPagesPerLocale } from './lib/url-count.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(process.argv[2] ?? path.join(__dirname, '../..'));
const DIST = path.join(REPO, 'astro/dist');
const URLS = path.join(REPO, 'site-urls.txt');
const BREAKDOWN = path.join(REPO, 'site-urls.breakdown.json');
const BASELINE = path.join(REPO, 'astro/scripts/baseline.json');

const LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];

function walkHtml(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

if (!existsSync(DIST)) {
  console.error(`❌ 找不到 ${DIST}：先跑一次 \`npm run build\`（红了也可以，dist 已经是新的）`);
  process.exit(2);
}

const htmlFiles = walkHtml(DIST);
if (htmlFiles.length === 0) {
  console.error('❌ dist 里没有任何 .html：构建没跑完，或被清空了。');
  console.error('   先 `npm run build`（红构建同样适用），再运行本脚本。');
  process.exit(2);
}

const urlCount = readFileSync(URLS, 'utf8').split('\n').filter((l) => l.trim()).length;
let breakdown = null;
try {
  breakdown = JSON.parse(readFileSync(BREAKDOWN, 'utf8'));
} catch {
  /* 旧版本构建没有这个文件 */
}

// 输入有效性：dist 与清单必须来自同一次构建。
// 危险的不是"dist 为空"，而是"dist 新、清单旧"——它的输出长得完全像有效数据。
function newestMtime(dir) {
  let newest = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? newestMtime(p) : statSync(p).mtimeMs);
  }
  return newest;
}
const contentDir = path.join(REPO, 'astro/src/content/blog');
const contentNewest = existsSync(contentDir) ? newestMtime(contentDir) : 0;
const breakdownMtime = existsSync(BREAKDOWN) ? statSync(BREAKDOWN).mtimeMs : 0;

const problems = [];
if (!breakdown) problems.push('缺 site-urls.breakdown.json：无法确认清单是哪次生成的');
else if (breakdown.total !== urlCount) problems.push(`清单 ${urlCount} 条与分解 ${breakdown.total} 条不一致：生成清单那一步没跑完`);
if (breakdownMtime && contentNewest > breakdownMtime) {
  problems.push(`内容文件比清单新 ${Math.round((contentNewest - breakdownMtime) / 60000)} 分钟：清单是旧的，dist 是新的，属混合态`);
}
if (problems.length) {
  console.error('❌ 测量作废——dist 与清单不同源：');
  for (const p of problems) console.error('   · ' + p);
  console.error('\n   有效性以构建日志的这一行为准：');
  console.error('     ✅ site-urls.txt 已生成：N 条 URL');
  console.error('   如果构建在那行之前就红了，清单还是上一轮的，本工具的读数一律不能用。');
  process.exit(2);
}

const htmlTotal = htmlFiles.length;
const nonIndexablePages = htmlTotal - urlCount;
const blogPerLocale = countBlogPagesPerLocale(DIST, LOCALES);

let sitemapCanonicalMismatch = null;
try {
  sitemapCanonicalMismatch = JSON.parse(readFileSync(BASELINE, 'utf8')).sitemapCanonicalMismatch ?? null;
} catch {
  /* 基线缺失时跳过 */
}

console.log('=== 实测（来自当前 dist、site-urls.txt 与 breakdown）===');
console.log(`htmlTotal                : ${htmlTotal}`);
console.log(`site-urls.txt            : ${urlCount} 条`);
console.log(`nonIndexablePages        : ${nonIndexablePages}`);
if (breakdown) {
  console.log(`分解                     : 静态 ${breakdown.staticPaths}×${breakdown.locales} + 博客 ${breakdown.blogPosts} + 分类 ${breakdown.categoryUrls} = ${breakdown.total}`);
}
const uniform = [...new Set(Object.values(blogPerLocale))];
console.log(`blogPerLocale            : ${uniform.length === 1 ? uniform[0] + '（22 语种一致）' : '各语种不等 → ' + JSON.stringify(blogPerLocale)}`);
if (sitemapCanonicalMismatch !== null) {
  console.log(`sitemapCanonicalMismatch : ${sitemapCanonicalMismatch}（基线现值；shim 数变化时它要一起改）`);
}

console.log('\n=== 可直接粘进 astro/scripts/baseline.json 的片段 ===');
console.log(JSON.stringify({ htmlTotal, blogPerLocale, nonIndexablePages }, null, 2));

console.log(`
=== 抄录步骤 ===
1) 用上面的片段替换 baseline.json 里的 htmlTotal / blogPerLocale / nonIndexablePages
2) 若 sitemap 守卫报 canonical 不匹配，把新的 shim 数写进 sitemapCanonicalMismatch
3) updateReason 里的数字从此处复制，不要手算
4) 再跑一次 npm run build，绿了才算数
`);
