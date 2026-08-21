const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const tr = JSON.parse(fs.readFileSync('messages/tr.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
// 需要新增的 8 个 services desc 键（SiteHeader 右列）
const needDesc = ['oemOdm', 'productDesign', 'productionAssembly', 'packagingLogistics', 'logoPrinting', 'boxCustom', 'dropshipping', 'noMoq'];
let out = '=== 新增 desc 键检查 ===\n';
for (const k of needDesc) {
  const p = 'homepage.mega.services.' + k + 'Desc';
  out += p + ': en=' + (get(en, p) !== undefined) + ' tr=' + (get(tr, p) !== undefined) + ' ar=' + (get(ar, p) !== undefined) + '\n';
}
// SiteHeader 需要但可能缺失的其他键
const otherKeys = [
  'homepage.logo.alt', 'homepage.nav.products', 'homepage.nav.services', 'homepage.nav.ourWork',
  'homepage.nav.getInTouch', 'homepage.nav.menuLabel',
  'homepage.mega.lumi2.name', 'homepage.mega.lumi2.tagline', 'homepage.mega.lumi.name', 'homepage.mega.lumi.tagline',
  'homepage.mega.venus.name', 'homepage.mega.venus.tagline', 'homepage.mega.themis.name', 'homepage.mega.themis.tagline',
  'homepage.mega.emerald.name', 'homepage.mega.emerald.tagline', 'homepage.mega.eirene.name', 'homepage.mega.eirene.tagline',
  'homepage.mega.golden.name', 'homepage.mega.golden.tagline', 'homepage.mega.hebe.name', 'homepage.mega.hebe.tagline',
  'homepage.mega.components.heading', 'homepage.mega.components.lamp', 'homepage.mega.components.filter',
  'homepage.mega.components.cooling', 'homepage.mega.components.power',
  'homepage.mega.card1.heading', 'homepage.mega.card1.desc', 'homepage.mega.card1.cta',
  'homepage.mega.services.heading', 'homepage.mega.services.technology.title', 'homepage.mega.services.technology.desc',
  'homepage.mega.services.privateLabel.title', 'homepage.mega.services.privateLabel.desc',
  'homepage.mega.services.build.title', 'homepage.mega.services.build.desc',
  'homepage.mega.services.maintain.title', 'homepage.mega.services.maintain.desc',
  'homepage.mega.about.navTitle', 'homepage.mega.about.title', 'homepage.mega.about.desc',
  'homepage.mega.about.brandStory.title', 'homepage.mega.about.brandStory.desc',
  'homepage.mega.about.companyProfile.title', 'homepage.mega.about.companyProfile.desc',
  'homepage.mega.about.manufacturing.title', 'homepage.mega.about.manufacturing.desc',
  'homepage.mega.about.quality.title', 'homepage.mega.about.quality.desc',
  'homepage.mega.about.team.title', 'homepage.mega.about.team.desc',
  'homepage.mega.about.clients.title', 'homepage.mega.about.clients.desc',
  'homepage.mega.about.card.heading', 'homepage.mega.about.card.desc', 'homepage.mega.about.card.cta',
  'homepage.mega.resources.navTitle', 'homepage.mega.resources.blog.title', 'homepage.mega.resources.blog.desc',
  'homepage.mega.resources.faq.title', 'homepage.mega.resources.faq.desc',
  'homepage.mega.resources.audit.title', 'homepage.mega.resources.audit.desc',
  'homepage.mega.resources.consult.title', 'homepage.mega.resources.consult.desc',
  'homepage.mega.resources.iplSafety.title', 'homepage.mega.resources.iplSafety.desc',
  'homepage.mega.audit.title', 'homepage.mega.audit.desc', 'homepage.mega.audit.cta',
  'homepage.mobile.iplCatalogue', 'homepage.mobile.allProducts',
  'homepage.mobile.viewAllServices.title', 'homepage.mobile.viewAllServices.desc', 'homepage.mobile.consultDesc',
];
out += '\n=== 其他键缺失检查 ===\n';
let missing = 0;
for (const p of otherKeys) {
  if (get(en, p) === undefined || get(tr, p) === undefined || get(ar, p) === undefined) {
    out += 'MISSING ' + p + ': en=' + (get(en, p) !== undefined) + ' tr=' + (get(tr, p) !== undefined) + ' ar=' + (get(ar, p) !== undefined) + '\n';
    missing++;
  }
}
out += '缺失总数: ' + missing + '\n';
fs.writeFileSync('verify_siteheader_keys.txt', out);
console.log('written');
