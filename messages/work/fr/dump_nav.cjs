// 提取 fr.json 中导航/页脚等关键标签，供 verify_fr.cjs 引用
const fs = require('fs');
const fr = JSON.parse(fs.readFileSync('D:/1011-main/1011-main/1011-main/messages/fr.json', 'utf8'));
const nav = fr.nav || {};
const footer = fr.footer || {};
const out = {
  navLabels: Object.entries(nav).filter(([k, v]) => typeof v === 'string').map(([k, v]) => v),
  footerLabels: Object.entries(footer).filter(([k, v]) => typeof v === 'string' && v.length < 40).map(([k, v]) => v),
  heroTitle: fr.hero && fr.hero.title,
  heroSubtitle: fr.hero && fr.hero.subtitle,
  langSwitcher: fr.languageSwitcher || {},
};
fs.writeFileSync('D:/1011-main/1011-main/1011-main/messages/work/fr/nav_labels.json', JSON.stringify(out, null, 2));
console.log('navLabels:', out.navLabels.join(' | '));
console.log('---');
console.log('hero.title:', out.heroTitle);
console.log('hero.subtitle:', out.heroSubtitle);
