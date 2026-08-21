// 在 12 个 .astro 文件的 locale 推断链中，于 /nl/ 判断之前插入 /ro/ 判断（与既有语言加入模式一致）
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..', 'astro', 'src');
const files = [
  'components/StickyContact.astro',
  'components/SiteHeader.astro',
  'components/LanguageSwitcher.astro',
  'components/SiteFooter.astro',
  'pages/develo-contact.astro',
  'pages/index.backup.astro',
  'pages/index.astro',
  'pages/meet-the-team.astro',
  'pages/services/build-a-new-ipl.astro',
  'pages/services/find-a-technology-partner.astro',
  'pages/services/maintain-or-fix-ipl-project.astro',
  'pages/services/private-label.astro',
];
const OLD = "Astro.url.pathname.startsWith('/nl') ? 'nl' : 'en'";
const NEW = "Astro.url.pathname.startsWith('/ro') ? 'ro' : Astro.url.pathname.startsWith('/nl') ? 'nl' : 'en'";
let changed = 0;
for (const rel of files) {
  const f = path.join(ROOT, rel);
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes(OLD)) {
    console.log(`[跳过] 未找到模式: ${rel}`);
    continue;
  }
  const out = s.split(OLD).join(NEW);
  fs.writeFileSync(f, out, 'utf8');
  changed++;
  console.log(`[已更新] ${rel}`);
}
console.log(`\n共更新 ${changed} 个文件`);
