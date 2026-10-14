#!/usr/bin/env node
/**
 * 内容 ↔ sitemap 双向核对（只读）
 *
 * 目的：确认「内容目录里有的文章」与「实际进 sitemap 的 URL」一一对齐，
 * 避免出现两类静默缺口：
 *   1. 内容存在但没进 sitemap（例如新加的语种被 canonical 归并排除、路由未生成）
 *   2. sitemap 里有但内容不存在（幽灵 URL）
 *
 * 背景：本项目 i18n 采用 fallback rewrite —— 未翻译的语种会生成页面但 canonical
 * 指回英文，generate-sitemap.mjs 会把这类 URL 排除；一旦语种覆盖不全，
 * sitemap 守卫（SITEMAP_MAX_CANONICAL_MISMATCH）就会让构建失败。
 * 本脚本是那条守卫的**前向补充**：在构建成功之后，逐一核对内容与产物的对应关系。
 *
 * 用法：
 *   node scripts/check-content-sitemap-parity.mjs            # 检查（有问题 exit 1）
 *   node scripts/check-content-sitemap-parity.mjs --verbose  # 同时列出各类别统计
 *   node scripts/check-content-sitemap-parity.mjs --locale de
 *
 * 依赖：astro/dist/sitemap-*.xml 已由 generate-sitemap.mjs 产出（即 astro build 之后）。
 * 只读：不写任何文件。
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ASTRO = resolve(__dirname, '..');
const REPO = resolve(ASTRO, '..');
const BLOG = join(ASTRO, 'src', 'content', 'blog');
const DIST = join(ASTRO, 'dist');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const ONLY = (() => { const i = args.indexOf('--locale'); return i >= 0 ? args[i + 1] : null; })();

const SITE = 'https://iplmanufacturer.com';

/** 从 frontmatter 取 slug；没有 slug 字段时回退到文件名 */
function slugOf(file) {
  const txt = readFileSync(file, 'utf8');
  const m = txt.match(/^slug:\s*["']?([^"'\r\n]+)/m);
  if (m) return m[1].trim();
  return file.split(/[\\/]/).pop().replace(/\.mdx?$/, '');
}

/** sitemap 文件名：与语种目录名一致（如 sitemap-pt-BR.xml，保留大小写） */
function sitemapName(locale) {
  return `sitemap-${locale}.xml`;
}

/** URL 路径段：小写（如 /pt-br/、/pt-pt/） */
function urlSegment(locale) {
  return locale.toLowerCase();
}

if (!existsSync(DIST)) {
  console.error(`✗ 找不到 ${DIST}。请先跑 astro build + flatten-html + generate-sitemap。`);
  process.exit(1);
}

let locales = readdirSync(BLOG).filter((d) => statSync(join(BLOG, d)).isDirectory()).sort();
if (ONLY) locales = locales.filter((l) => l === ONLY);
if (!locales.length) {
  console.error(`✗ 内容目录下没找到语种${ONLY ? `（--locale ${ONLY}）` : ''}。`);
  process.exit(1);
}

const problems = [];
const stats = [];

for (const loc of locales) {
  const dir = join(BLOG, loc);

  // ---- 内容侧 ----
  const contentSlugs = new Set(
    readdirSync(dir)
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => slugOf(join(dir, f)))
  );

  // ---- 产物侧 ----
  const smPath = join(DIST, sitemapName(loc));
  if (!existsSync(smPath)) {
    problems.push(`${loc}: 缺少 ${sitemapName(loc)}（该语种可能未生成 sitemap）`);
    continue;
  }
  const xml = readFileSync(smPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  // 该语种的博客 URL 前缀：en 无前缀，其余为 /<locale>/blog/
  // （本地化 sitemap 用的是带语种前缀的绝对 URL）
  const urlPath = loc === 'en' ? '' : `/${urlSegment(loc)}`;
  const blogPrefix = `${SITE}${urlPath}/blog/`;

  const blogLocs = locs.filter((u) => u.startsWith(blogPrefix));
  // 文章 URL 形如 <prefix><slug>；分类聚合页形如 <prefix><category>（单段短词）。
  // 判据：能对上内容侧已知 slug 的算文章，其余算分类聚合页。
  const sitemapSlugs = new Set();
  const catUrls = [];
  for (const u of blogLocs) {
    const slug = u.slice(blogPrefix.length);
    if (!slug.includes('/') && contentSlugs.has(slug)) sitemapSlugs.add(slug);
    else catUrls.push(u);
  }

  const missing = [...contentSlugs].filter((s) => !sitemapSlugs.has(s)); // 有内容没进 sitemap
  const ghost = [...sitemapSlugs].filter((s) => !contentSlugs.has(s));   // 进了 sitemap 没内容

  if (missing.length) problems.push(`${loc}: ${missing.length} 篇文章有内容但未进 sitemap → ${missing.slice(0, 5).join(', ')}`);
  if (ghost.length) problems.push(`${loc}: ${ghost.length} 条 sitemap 文章 URL 无对应内容 → ${ghost.slice(0, 5).join(', ')}`);

  stats.push({ loc, content: contentSlugs.size, blogLocs: blogLocs.length, postsInSitemap: sitemapSlugs.size, catPages: catUrls.length, allLocs: locs.length });
}

if (VERBOSE) {
  console.log('locale   内容文章   博客URL   其中文章   分类页   该语种URL总数');
  for (const s of stats) {
    console.log(`  ${s.loc.padEnd(7)} ${String(s.content).padStart(8)} ${String(s.blogLocs).padStart(9)} ${String(s.postsInSitemap).padStart(10)} ${String(s.catPages).padStart(8)} ${String(s.allLocs).padStart(14)}`);
  }
  const t = stats.reduce((a, s) => a + s.allLocs, 0);
  console.log(`  合计 URL（各语种 sitemap 之和）: ${t}`);
}

if (problems.length) {
  console.log('');
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log(`\n✗ 内容 ↔ sitemap 双向核对未通过：${problems.length} 处`);
  process.exit(1);
}

const totContent = stats.reduce((a, s) => a + s.content, 0);
console.log(`[content-sitemap-parity] ✓ ${stats.length} 个语种，${totContent} 篇文章内容与 sitemap 完全对齐（无缺口、无幽灵 URL）。`);
