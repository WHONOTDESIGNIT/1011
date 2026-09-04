// audit-titles — 全站 <title> 审计（SEO 整改配套，2026-09-04）
//
// 运行位置：astro/ 目录（即 package.json 所在处），与 npm run build 一致。
//
// 两种模式：
//   1) 默认：扫描 dist/**/*.html 中真实的 <title> 输出（需先构建），按长度/品牌分组。
//      这是“事实”模式——SeoHead 改造生效后的最终结果。
//   2) --preview：不构建，直接读 messages/en.json（EN 主页面路由表）+ MDX frontmatter
//      （22 语言博客）预测规范化后的标题，输出待人工确认的候选清单（只读，绝不落库）。
//
// 本脚本只读不改写任何文件；所有“生成/富化”文案都需人工逐条确认后才可写库。
// 阈值常量必须与 src/lib/seo-title.ts 保持一致（见其顶部注释）。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const BRAND_SUFFIX = '| iShine';
const TITLE_MIN = 50;
const TITLE_MAX = 60;
const BRAND_RE = /ishine/i;

function norm(title) {
  if (!title) return '';
  return String(title).replace(/\s+/g, ' ').trim();
}

// 与 src/lib/seo-title.ts#buildFinalTitle 语义一致（node 无法 import TS，故镜像实现）
function buildFinalTitle(title) {
  const cleaned = norm(title);
  if (!cleaned) return '';
  if (BRAND_RE.test(cleaned)) return cleaned;
  const candidate = `${cleaned} ${BRAND_SUFFIX}`;
  return candidate.length <= TITLE_MAX ? candidate : cleaned;
}

function classify(title, { excludePath } = {}) {
  const t = norm(title);
  const len = t.length;
  if (!t) return { tag: 'EMPTY', len };
  if (excludePath) return { tag: 'EXCLUDED_INTERNAL', len };
  if (BRAND_RE.test(t)) return { tag: len < TITLE_MIN ? 'BRANDED_SHORT' : 'OK_WITH_BRAND', len };
  // 无品牌仅会出现在：超长被规则放行 或 内部页关闭补尾 两种情形
  return { tag: len > TITLE_MAX ? 'OVER_LENGTH_NO_BRAND' : 'NO_BRAND', len };
}

const getValue = (obj, key) => {
  if (!key) return undefined;
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
};

// ============ --preview：预测候选清单 ============

// EN 静态主页面 → title 来源表（硬编码标题标注 fixed）
const STATIC_ROUTES = [
  { route: '/', key: 'home.page.title' },
  { route: '/about', key: 'aboutPages.overview.title' },
  { route: '/about/company-profile', key: 'nav.companyProfile' },
  { route: '/about/brand-story', key: 'nav.brandStory' },
  { route: '/about/manufacturing-capabilities', key: 'nav.manufacturing' },
  { route: '/about/quality-control', key: 'nav.quality' },
  { route: '/ipl-hair-removal-is-safe', key: 'aboutPages.iplSafety.title' },
  { route: '/blog', key: 'blog.meta.title' },
  { route: '/clients', key: 'clientPage.meta.title' },
  { route: '/contact', key: 'contact.title' },
  { route: '/faq', key: 'auxPages.faq.pageTitle' },
  { route: '/marketplace', key: 'auxPages.marketplace.pageTitle' },
  { route: '/meet-the-team', key: 'teamPage.meta.title' },
  { route: '/privacy-policy', key: 'auxPages.privacy.pageTitle' },
  { route: '/catalogue', key: 'clientPage.catalogue.metaTitle' },
  { route: '/components', key: 'componentsPage.header.title' },
  { route: '/products', formula: true, key: 'productDetail.index.page.title' },
  { route: '/services', key: 'servicesPage.index.meta.title' },
  { route: '/return-policy', fixed: 'Return Policy – iShine Technology Ltd.' },
  { route: '/404', fixed: '404 · Page Not Found' },
  { route: '/upload', fixed: 'Upload Image', internal: true },
  { route: '/admin', fixed: 'Admin', internal: true },
];

function previewMode() {
  const en = JSON.parse(readFileSync(join(process.cwd(), '..', 'messages', 'en.json'), 'utf8'));

  const rows = STATIC_ROUTES.map((r) => {
    const raw = r.fixed ?? (r.formula ? `${getValue(en, r.key)} | iShine` : getValue(en, r.key));
    const current = norm(raw);
    const final = r.internal ? current : buildFinalTitle(current);
    const len = final.length;
    const status =
      r.internal ? '内部页(关闭补尾)'
      : !current ? '缺 title'
      : current === final ? '跳过(已含品牌或超长)'
      : len >= TITLE_MIN && len <= TITLE_MAX ? '补尾 ✓ 50-60'
      : len < TITLE_MIN ? '补尾 ✓ 但 <50，建议富化'
      : '不补(超长)';
    return { ...r, current, final, len, status };
  });

  // 博客 MDX（22 语言）
  const blogRoot = join(process.cwd(), 'src', 'content', 'blog');
  const blog = [];
  for (const locale of readdirSync(blogRoot)) {
    const dir = join(blogRoot, locale);
    if (!statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue;
      const src = readFileSync(join(dir, file), 'utf8');
      const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const m = fm[1].match(/^title:\s*(.+)$/m);
      if (!m) continue;
      const raw = m[1].trim().replace(/^["']|["']$/g, '');
      const final = buildFinalTitle(raw);
      blog.push({ locale, file, title: norm(raw), final, len: final.length, isBranded: BRAND_RE.test(norm(raw)), appended: final !== norm(raw) });
    }
  }

  const blogAppended = blog.filter((b) => b.appended);
  const blogInRange = blogAppended.filter((b) => b.len >= TITLE_MIN && b.len <= TITLE_MAX);
  const blogShort = blogAppended.filter((b) => b.len < TITLE_MIN);
  const blogBranded = blog.filter((b) => b.isBranded);
  const blogOver = blog.filter((b) => !b.isBranded && !b.appended && b.len > TITLE_MAX);
  const blogEmpty = blog.filter((b) => b.len === 0);

  const line = '='.repeat(78);
  const out = [];
  out.push(line);
  out.push('Title 审计 · PREVIEW 模式（预测，未落库 · 待人工确认）');
  out.push(`规则: 缺品牌补 "${BRAND_SUFFIX}"；已含品牌跳过；拼接 ≤${TITLE_MAX} 才补；目标区间 ${TITLE_MIN}–${TITLE_MAX}`);
  out.push(line);

  out.push('');
  out.push(`【EN 静态主页面 · ${rows.length} 条】`);
  out.push(''.padEnd(8) + '路由'.padEnd(30) + '长度'.padEnd(5) + '状态');
  for (const r of rows) {
    const preview = r.current === r.final ? '' : `  →  "${r.final}"`;
    out.push(`${r.route.padEnd(30)}${String(r.len).padEnd(5)}${r.status}${preview}`);
    if (r.current && r.current !== r.final) out.push(''.padEnd(30) + `${''.padEnd(5)}当前: "${r.current}"`);
  }

  out.push('');
  out.push(`【博客 MDX · 22 语言共 ${blog.length} 篇】`);
  out.push(`  补尾生效（追加 "| iShine"）: ${blogAppended.length} 篇`);
  out.push(`    ├ 补后落 50–60 区间: ${blogInRange.length} 篇`);
  out.push(`    ├ 补后 <50（建议富化，需逐条确认）: ${blogShort.length} 篇`);
  out.push(`  已含品牌跳过: ${blogBranded.length} 篇`);
  out.push(`  无品牌且超长(>${TITLE_MAX})不补: ${blogOver.length} 篇  ← 建议人工压缩`);
  if (blogEmpty.length) out.push(`  empty/missing title: ${blogEmpty.length} 篇`);

  const show = (list, n) =>
    list
      .slice()
      .sort((a, b) => b.len - a.len || a.locale.localeCompare(b.locale))
      .slice(0, n)
      .map((b) => `    [${b.locale}] ${b.file}  (${b.len}) → "${b.final}"`);

  if (blogShort.length) {
    out.push('');
    out.push(`  补后 <50 示例（前 12，富化文案需逐条人工确认后写入）：`);
    out.push(...show(blogShort, 12));
  }
  if (blogOver.length) {
    out.push('');
    out.push(`  超长不补示例（前 12，建议压缩）：`);
    out.push(...show(blogOver, 12));
  }

  out.push('');
  out.push('说明: 上述仅为“自动补尾”的确定性结果。任何“富化/压缩改写”类生成必须先经你逐条确认；本脚本只读，不写库。');
  return out.join('\n');
}

// ============ 默认：扫描 dist 真实输出 ============

function distMode() {
  const distRoot = join(process.cwd(), 'dist');
  if (!statSync(distRoot).isDirectory()) {
    return '未找到 dist/ 目录，请先执行 astro build（或 npm run build）后再审计。\n提示: 可先运行 `node scripts/audit-titles.mjs --preview` 获取预测清单。';
  }
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (name.endsWith('.html')) files.push(p);
    }
  };
  walk(distRoot);

  const groups = { EXCLUDED_INTERNAL: 0, EMPTY: 0, OK_WITH_BRAND: 0, BRANDED_SHORT: 0, OVER_LENGTH_NO_BRAND: 0, NO_BRAND: 0 };
  const details = { OVER_LENGTH_NO_BRAND: [], BRANDED_SHORT: [], NO_BRAND: [] };
  let inRangeWithBrand = 0;

  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m) { groups.EMPTY++; continue; }
    const title = m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const rel = '/' + relative(distRoot, file).replace(/\\/g, '/');
    const excluded = /\/admin\/?$/i.test(rel) || /\/upload\/?$/i.test(rel) || /404/.test(rel);
    const c = classify(title, { excludePath: excluded });
    groups[c.tag]++;
    if (c.tag === 'OK_WITH_BRAND' && title.length >= TITLE_MIN && title.length <= TITLE_MAX) inRangeWithBrand++;
    if (details[c.tag]) details[c.tag].push({ rel, title, len: c.len });
  }

  const line = '='.repeat(78);
  const out = [];
  out.push(line);
  out.push('Title 审计 · dist 实测模式（SeoHead 改造后的真实 <title>）');
  out.push(line);
  out.push(`HTML 页面总数: ${files.length}`);
  out.push(`  已含品牌 · 落 50–60 区间: ${inRangeWithBrand}`);
  out.push(`  已含品牌 · 完整(不限长): ${groups.OK_WITH_BRAND + groups.BRANDED_SHORT}（其中 <50: ${groups.BRANDED_SHORT}）`);
  out.push(`  无品牌 · 超长未补: ${groups.OVER_LENGTH_NO_BRAND}`);
  out.push(`  无品牌(异常): ${groups.NO_BRAND}`);
  out.push(`  内部/404 已排除: ${groups.EXCLUDED_INTERNAL}`);
  out.push(`  <title> 缺失: ${groups.EMPTY}`);

  const show = (list, n) =>
    list
      .sort((a, b) => a.len - b.len)
      .slice(0, n)
      .map((x) => `    ${x.len}  ${x.rel}  —  "${x.title}"`);

  if (groups.OVER_LENGTH_NO_BRAND) {
    out.push('');
    out.push(`无品牌超长页面（需人工压缩，前 15，按长度升序）：`);
    out.push(...show(details.OVER_LENGTH_NO_BRAND, 15));
  }
  if (groups.BRANDED_SHORT) {
    out.push('');
    out.push(`已含品牌但仍 <50（建议富化，前 15）：`);
    out.push(...show(details.BRANDED_SHORT, 15));
  }
  return out.join('\n');
}

const isPreview = process.argv.includes('--preview');
console.log(isPreview ? previewMode() : distMode());
