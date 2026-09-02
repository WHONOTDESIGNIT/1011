// generate-sitemap.mjs — 按语言拆分的 sitemap 生成器（post-build）
//
// 背景（2026-09-02，依据 Google Search Central 官方文档）：
//   - 多语言站点推荐为每种语言维护独立 URL，并用 hreflang 标注全部语言版本；
//   - 当站点规模增长、URL 数接近/超过单文件 50,000 条或 50MB 上限时必须拆分，
//     并通过 sitemap 索引文件统一管理；按语言拆分比按序号分段更利于定位索引问题。
//   本脚本在 flatten-html.mjs 之后运行：直接枚举 dist 实际 HTML 产物分组到各语言，
//   hreflang alternates 从每页 <head> 的 <link rel="alternate"> 逐字提取，
//   保证 sitemap 与页面 head 声明 100% 一致（消除 Google hreflang 冲突/自引用缺失风险），
//   且 <loc> 与构建产物一一对应，杜绝 404 URL 或遗漏。
//
// 产物：
//   dist/sitemap.xml                 —— sitemap 索引（sitemapindex，22 个语言子文件）
//   dist/sitemap-en.xml … sitemap-it.xml —— 每语言子 sitemap（sitemap-<urlPath>.xml）
//
// 依赖：dist/ 已由 astro build + scripts/flatten-html.mjs 产出最终 HTML。
// 用法：node scripts/generate-sitemap.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');

// 21 个非 en 语言的 URL path（与 astro.config i18n locales.path 小写一致）
const LANG_URL_PATHS = ['tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-br', 'pt-pt', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];

// 不应收录的顶层平铺页面（非 SEO 目标页）
const SKIP_ROOT_FILES = new Set(['404', 'admin', 'upload']);

function resolveBaseUrl() {
  return (process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? process.env.SITE_URL ?? 'https://iplmanufacturer.com').replace(/\/$/, '');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// 从页面 head 提取同内容各语言版本（与 SeoHead 输出逐字一致，跳过 x-default）
function extractHreflangs(html) {
  const out = [];
  const re = /<link rel="alternate" hreflang="([^"]+)"[^>]*href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1] === 'x-default') continue;
    out.push({ lang: m[1], href: m[2] });
  }
  return out;
}

function walkHtml(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['_astro', '.netlify', 'images', 'fonts', 'videos', '__forms'].includes(entry.name)) continue;
      out.push(...walkHtml(full));
    } else if (entry.name.endsWith('.html')) {
      out.push({ full, rel: path.relative(DIST, full).replace(/\\/g, '/') });
    }
  }
  return out;
}

function main() {
  if (!existsSync(DIST)) {
    console.error(`❌ dist 不存在（${DIST}），请先执行 astro build + flatten-html.mjs`);
    process.exit(1);
  }
  const base = resolveBaseUrl();
  const files = walkHtml(DIST);

  // 1) 文件 → { 语言组, URL }
  const groups = {}; // lang -> [{ url, alternates }]
  const add = (lang, url, html) => {
    if (!groups[lang]) groups[lang] = [];
    groups[lang].push({ url, alternates: extractHreflangs(html) });
  };

  let skipped = 0;
  const allUrls = new Set();
  for (const f of files) {
    const parts = f.rel.split('/');
    const stem = parts[parts.length - 1].replace(/\.html$/, '');
    const dirs = parts.slice(0, -1);
    if (stem === '404') { skipped++; continue; }
    const html = readFileSync(f.full, 'utf8');

    let lang;
    let url;
    if (dirs.length === 0) {
      // 顶层平铺产物
      if (stem === 'index') { lang = 'en'; url = '/'; }
      else if (LANG_URL_PATHS.includes(stem)) { lang = stem; url = `/${stem}`; }
      else if (SKIP_ROOT_FILES.has(stem)) { skipped++; continue; }
      else { lang = 'en'; url = `/${stem}`; }
    } else {
      const d0 = dirs[0];
      const tailPath = dirs.slice(1);
      if (LANG_URL_PATHS.includes(d0)) {
        // 语言目录（如 tr/about.html、tr/blog/x.html、de/about/brand-story.html）
        lang = d0;
        url = `/${d0}/${tailPath.length ? tailPath.join('/') + '/' + stem : stem}`;
      } else {
        // en 根下的子目录（blog/x.html、about/brand-story.html）
        lang = 'en';
        url = `/${[...dirs, stem].join('/')}`;
      }
    }
    if (allUrls.has(url)) {
      console.error(`❌ 重复 URL 产物: ${url}（${f.rel}）`);
      process.exit(1);
    }
    allUrls.add(url);
    add(lang, url, html);
  }

  // 2) 组内按 URL 排序并渲染子文件
  const order = ['en', ...LANG_URL_PATHS];
  let locTotal = 0;
  const xmlEscapeAttrs = escapeXml;
  for (const lang of order) {
    const entries = (groups[lang] || [])
      .sort((a, b) => a.url.localeCompare(b.url))
      .map((e) => {
        // 根路径（'/'）输出 base 本身，不带尾斜杠（全站无结尾斜杠规范）
        const loc = e.url === '/' ? base : `${base}${e.url}`;
        const links = e.alternates
          .map((h) => `    <xhtml:link rel="alternate" hreflang="${xmlEscapeAttrs(h.lang)}" href="${xmlEscapeAttrs(h.href)}"/>`)
          .join('\n');
        return `  <url>\n    <loc>${xmlEscapeAttrs(loc)}</loc>\n${links}\n  </url>`;
      });
    locTotal += entries.length;
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
      entries.join('\n') +
      '\n</urlset>\n';
    const outName = `sitemap-${lang}.xml`;
    writeFileSync(path.join(DIST, outName), xml);
    console.log(`  ${outName}: ${entries.length} 条 URL`);
  }

  // 3) sitemap 索引（统一入口，robots.txt / llms.txt / IndexNow 均指向此处）
  const indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    order.map((lang) => `  <sitemap><loc>${xmlEscapeAttrs(`${base}/sitemap-${lang}.xml`)}</loc></sitemap>`).join('\n') +
    '\n</sitemapindex>\n';
  writeFileSync(path.join(DIST, 'sitemap.xml'), indexXml);

  // 4) 校验：loc 覆盖 = 全部非 skip HTML 产物；无大写 pt URL
  const htmlCount = files.length - skipped;
  const upper = files.filter((f) => /\/pt-[A-Z]/.test(f.rel.replace(/\\/g, '/'))).length;
  if (locTotal !== htmlCount) {
    console.error(`❌ sitemap loc 总数 ${locTotal} ≠ HTML 产物 ${htmlCount}（跳过 ${skipped}）`);
    process.exit(1);
  }
  if (upper) {
    console.error(`❌ 存在大写 pt 目录产物 ${upper} 个`);
    process.exit(1);
  }
  console.log(`✅ sitemap 生成完成：${order.length} 个语言文件 + 索引，共 ${locTotal} 条 URL（HTML 产物 ${htmlCount}，跳过 ${skipped}）`);
  console.log(`   索引入口：${base}/sitemap.xml`);
}

try {
  main();
} catch (err) {
  console.error('❌ generate-sitemap 失败：', err.message);
  process.exit(1);
}
