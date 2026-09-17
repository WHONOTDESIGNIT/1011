// 生成 site-urls.txt —— 全站无结尾斜杠 URL 清单（每日搜索引擎提交用）
// 用法：在 astro/ 目录执行 `node scripts/generate-site-urls.mjs`
// 与 sitemap.xml.ts 同一路径来源：52 静态核心路径 × 22 语言 + 各语言博客文章。
// 方案B规范：所有 URL 一律无结尾斜杠（如 /ro/about 而非 /ro/about/）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ASTRO_ROOT, '..');

const LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];

// 目录名（readdir 用，大小写敏感）↔ URL path 前缀（小写，Netlify Linux 友好）
const URL_PATH_BY_DIR = { 'pt-BR': 'pt-br', 'pt-PT': 'pt-pt' };
const urlPrefix = (locale) => (locale === 'en' ? '' : `/${URL_PATH_BY_DIR[locale] || locale}`);

// 与 src/pages/sitemap.xml.ts 的 staticPaths 保持一致
const STATIC_PATHS = [
  '',
  '/about',
  '/about/brand-story',
  '/about/company-profile',
  '/about/manufacturing-capabilities',
  '/about/quality-control',
  '/services',
  '/services/oem-odm',
  '/services/product-design',
  '/services/production-assembly',
  '/services/packaging-logistics',
  '/services/no-moq',
  '/services/logo-printing',
  '/services/box-custom',
  '/services/user-manual-guide-custom',
  '/services/dropshipping',
  '/services/private-label',
  '/services/build-a-new-ipl',
  '/services/find-a-technology-partner',
  '/services/maintain-or-fix-ipl-project',
  '/products',
  '/products/venus',
  '/products/lumi',
  '/products/lumi-2',
  '/products/hestia',
  '/products/alpha',
  '/products/hebe',
  '/products/emerald',
  '/products/themis',
  '/products/eirene',
  '/products/euno',
  '/products/wooden',
  '/products/helix',
  '/components',
  '/components/lamp-cartridges',
  '/components/optical-filters',
  '/components/cooling-system',
  '/components/power-supply',
  '/clients',
  '/clients/costco-canada-ipl',
  '/clients/happyskinco-ipl',
  '/clients/ku2-ipl',
  '/clients/roseskin-ipl',
  '/catalogue',
  '/careers',
  '/ipl-hair-removal-is-safe',
  '/ipl-for-brands',
  '/faq',
  '/contact',
  '/meet-the-team',
  '/marketplace',
  '/privacy-policy',
  '/return-policy',
  '/blog',
];

function extractSlug(frontmatter) {
  const m = frontmatter.match(/^slug\s*:\s*["']?([^"'\n]+)["']?/m);
  return m ? m[1].trim() : null;
}

// 分类名（frontmatter 用【单数】category:，值取自 BLOG_CATEGORIES 枚举，如 "Industry Insights"）
function extractCategory(frontmatter) {
  const m = frontmatter.match(/^category\s*:\s*["']?([^"'\n]+)["']?/m);
  return m ? m[1].trim() : null;
}

/** 分类名 → URL 段，规则与 src/lib/blog-categories.ts 的 toCategorySlug 完全一致 */
function toCategorySlug(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectPosts() {
  const posts = []; // { locale, slug, category }
  const dirs = [
    path.join(ASTRO_ROOT, 'src/content/blog'),
    path.join(REPO_ROOT, 'src/content/blog'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const locale of LOCALES) {
      const ldir = path.join(dir, locale);
      if (!fs.existsSync(ldir)) continue;
      for (const f of fs.readdirSync(ldir)) {
        if (!f.endsWith('.mdx')) continue;
        const content = fs.readFileSync(path.join(ldir, f), 'utf8');
        const slug = extractSlug(content) || f.replace(/\.mdx$/, '');
        posts.push({ locale, slug, category: extractCategory(content) });
      }
    }
  }
  // 同一语言下按 slug 去重
  const seen = new Set();
  return posts.filter((p) => {
    const key = `${p.locale}:${p.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const posts = collectPosts();
const base = 'https://iplmanufacturer.com';
const lines = [];

for (const locale of LOCALES) {
  const prefix = urlPrefix(locale);
  for (const p of STATIC_PATHS) {
    lines.push(`${base}${prefix}${p}`);
  }
  for (const { slug } of posts.filter((x) => x.locale === locale)) {
    lines.push(`${base}${prefix}/blog/${slug}`);
  }
}

// === 第三段：博客分类聚合页（/blog/category/<slug>）===
// 背景：分类聚合页有内容、可索引、在 sitemap 里（20 分类 × 22 语种 = 440 条），
// 但此前不在本清单中 → 拿不到 IndexNow 主动提交。2026-09-17 补齐。
//
// 收录规则（与页面实际渲染一致，实测依据：de/blog/category/press.html 里确实列着英文那篇文章）：
//   某语种在某分类下有【自己的】文章  → 收录
//   或者【英文】在该分类下有文章      → 也会因 i18n fallback 在该语种页面里出现 → 收录
//   两者皆无 → 不收录（该语种该分类页为空，不主动提交）
const catsOwn = new Map(); // locale -> Set<categoryLabel>
for (const { locale, category } of posts) {
  if (!category) continue;
  if (!catsOwn.has(locale)) catsOwn.set(locale, new Set());
  catsOwn.get(locale).add(category);
}
const enCats = catsOwn.get('en') ?? new Set();
let categoryUrls = 0;
for (const locale of LOCALES) {
  const effective = new Set([...(catsOwn.get(locale) ?? []), ...enCats]);
  for (const cat of effective) {
    lines.push(`${base}${urlPrefix(locale)}/blog/category/${toCategorySlug(cat)}`);
    categoryUrls++;
  }
}

// 去重（同名 URL 只留一条；守卫会检查重复）
const unique = [...new Set(lines)];

const out = path.join(REPO_ROOT, 'site-urls.txt');
fs.writeFileSync(out, unique.join('\n') + '\n');

// 自检：禁止任何带结尾斜杠的 URL（根路径除外）
const bad = unique.filter((u) => u !== base && /\/$/.test(u));
if (bad.length) {
  console.error(`❌ 发现 ${bad.length} 条带结尾斜杠的 URL：`);
  bad.slice(0, 10).forEach((u) => console.error('  ' + u));
  process.exit(1);
}
const removed = lines.length - unique.length;
console.log(`✅ site-urls.txt 已生成：${unique.length} 条 URL（${LOCALES.length} 语言），全部无结尾斜杠`);
console.log(`   静态核心路径 ${STATIC_PATHS.length} × ${LOCALES.length} = ${STATIC_PATHS.length * LOCALES.length}`);
console.log(`   博客文章 URL ${posts.length}`);
console.log(`   分类聚合页 URL ${categoryUrls}（${enCats.size} 个分类；去重移除 ${removed} 条）`);
console.log(`   博客文章总数：${posts.length}（en ${posts.filter((p) => p.locale === 'en').length} 篇，含根目录英文旧文）`);
