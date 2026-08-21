// 批量补 fr：12 处 locale 推导链 + 22 处 var LANGS 数组（模式逐字一致）
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/1011-main/1011-main/1011-main/astro/src';

const localeFiles = [
  'pages/develo-contact.astro',
  'pages/index.backup.astro',
  'pages/index.astro',
  'pages/meet-the-team.astro',
  'pages/services/build-a-new-ipl.astro',
  'pages/services/private-label.astro',
  'pages/services/find-a-technology-partner.astro',
  'pages/services/maintain-or-fix-ipl-project.astro',
  'components/StickyContact.astro',
  'components/SiteHeader.astro',
  'components/SiteFooter.astro',
  'components/LanguageSwitcher.astro',
];

const langsFiles = [
  'layouts/BaseLayout.astro',
  'pages/develo-careers.astro',
  'pages/develo-blog-detail.astro',
  'pages/develo-blog.astro',
  'pages/develo-about.astro',
  'pages/develo-service-uiux.astro',
  'pages/develo-about-testimonials.astro',
  'pages/develo-contact.astro',
  'pages/develo-service-tech-partner.astro',
  'pages/develo-privacy.astro',
  'pages/develo-testimonials.astro',
  'pages/develo-clone.astro',
  'pages/develo-sitemap.astro',
  'pages/develo-services.astro',
  'pages/develo-work.astro',
  'pages/marketplace.astro',
  'pages/index.astro',
  'pages/meet-the-team.astro',
  'pages/services/build-a-new-ipl.astro',
  'pages/services/private-label.astro',
  'pages/services/find-a-technology-partner.astro',
  'pages/services/maintain-or-fix-ipl-project.astro',
];

// 1) locale 推导：'es' ? 'es' : 'en' 前插入 fr 分支
const LOCALE_OLD = "startsWith('/es') ? 'es' : 'en'";
const LOCALE_NEW = "startsWith('/es') ? 'es' : Astro.url.pathname.startsWith('/fr') ? 'fr' : 'en'";

// 2) LANGS 数组
const LANGS_OLD = "var LANGS = ['tr', 'ar', 'es'];";
const LANGS_NEW = "var LANGS = ['tr', 'ar', 'es', 'fr'];";

let ok = true;

for (const rel of localeFiles) {
  const fp = path.join(ROOT, rel);
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes(LOCALE_OLD)) { console.log(`✗ ${rel}: 未找到推导串`); ok = false; continue; }
  const n = s.split(LOCALE_OLD).length - 1;
  s = s.split(LOCALE_OLD).join(LOCALE_NEW);
  fs.writeFileSync(fp, s);
  console.log(`✓ ${rel}: locale 推导补 fr (${n} 处)`);
}

for (const rel of langsFiles) {
  const fp = path.join(ROOT, rel);
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes(LANGS_OLD)) { console.log(`✗ ${rel}: 未找到 LANGS`); ok = false; continue; }
  const n = s.split(LANGS_OLD).length - 1;
  s = s.split(LANGS_OLD).join(LANGS_NEW);
  fs.writeFileSync(fp, s);
  console.log(`✓ ${rel}: LANGS 补 fr (${n} 处)`);
}

// 兜底：全 src 目录扫描是否还有遗漏的旧模式
const { execSync } = require('child_process');
try {
  const r = execSync(`findstr /s /n /c:"startsWith('/es') ? 'es' : 'en'" /c:"['tr', 'ar', 'es']" "${ROOT}\\*.astro"`, { encoding: 'utf8' });
  console.log('\n⚠️ 仍有遗漏:\n' + r);
  ok = false;
} catch (e) {
  console.log('\n✅ 全目录扫描：无遗漏的旧 locale 推导 / LANGS 数组');
}
process.exit(ok ? 0 : 1);
