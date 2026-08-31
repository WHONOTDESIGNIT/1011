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
  '/ipl-hair-removal-is-safe',
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

function collectPosts() {
  const posts = []; // { locale, slug }
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
        posts.push({ locale, slug });
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

const out = path.join(REPO_ROOT, 'site-urls.txt');
fs.writeFileSync(out, lines.join('\n') + '\n');

// 自检：禁止任何带结尾斜杠的 URL（根路径除外）
const bad = lines.filter((u) => u !== base && /\/$/.test(u));
if (bad.length) {
  console.error(`❌ 发现 ${bad.length} 条带结尾斜杠的 URL：`);
  bad.slice(0, 10).forEach((u) => console.error('  ' + u));
  process.exit(1);
}
console.log(`✅ site-urls.txt 已生成：${lines.length} 条 URL（${LOCALES.length} 语言），全部无结尾斜杠`);
console.log(`   博客文章总数：${posts.length}（en ${posts.filter((p) => p.locale === 'en').length} 篇，含根目录 36 篇英文旧文）`);
