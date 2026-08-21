// 验证 SiteHeader.astro 改写所需全部 homepage.* 键在 en/tr/ar 三语中存在
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'messages');
const en = JSON.parse(fs.readFileSync(path.join(base, 'en.json'), 'utf8'));
const tr = JSON.parse(fs.readFileSync(path.join(base, 'tr.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(base, 'ar.json'), 'utf8'));

function getValue(obj, key) {
  return key.split('.').reduce((cur, part) => (cur && typeof cur === 'object' ? cur[part] : undefined), obj);
}

const keys = [
  'homepage.trustBar.shipping', 'homepage.trustBar.privateLabel', 'homepage.trustBar.chatgpt',
  'homepage.logo.alt',
  'homepage.nav.products', 'homepage.nav.services', 'homepage.nav.ourWork', 'homepage.nav.getInTouch', 'homepage.nav.menuLabel',
  'homepage.mega.lumi2.name', 'homepage.mega.lumi2.tagline',
  'homepage.mega.lumi.name', 'homepage.mega.lumi.tagline',
  'homepage.mega.venus.name', 'homepage.mega.venus.tagline',
  'homepage.mega.themis.name', 'homepage.mega.themis.tagline',
  'homepage.mega.emerald.name', 'homepage.mega.emerald.tagline',
  'homepage.mega.eirene.name', 'homepage.mega.eirene.tagline',
  'homepage.mega.golden.name', 'homepage.mega.golden.tagline',
  'homepage.mega.hebe.name', 'homepage.mega.hebe.tagline',
  'homepage.mega.components.heading', 'homepage.mega.components.lamp', 'homepage.mega.components.filter', 'homepage.mega.components.cooling', 'homepage.mega.components.power',
  'homepage.mega.card1.heading', 'homepage.mega.card1.desc', 'homepage.mega.card1.cta',
  'homepage.mega.services.technology.title', 'homepage.mega.services.technology.desc',
  'homepage.mega.services.privateLabel.title', 'homepage.mega.services.privateLabel.desc',
  'homepage.mega.services.build.title', 'homepage.mega.services.build.desc',
  'homepage.mega.services.maintain.title', 'homepage.mega.services.maintain.desc',
  'homepage.mega.services.heading',
  'homepage.mega.services.oemOdm', 'homepage.mega.services.productDesign', 'homepage.mega.services.productionAssembly',
  'homepage.mega.services.packagingLogistics', 'homepage.mega.services.logoPrinting', 'homepage.mega.services.boxCustom',
  'homepage.mega.services.dropshipping', 'homepage.mega.services.noMoq',
  'homepage.mega.about.navTitle',
  'homepage.mega.about.title', 'homepage.mega.about.desc',
  'homepage.mega.about.brandStory.title', 'homepage.mega.about.brandStory.desc',
  'homepage.mega.about.companyProfile.title', 'homepage.mega.about.companyProfile.desc',
  'homepage.mega.about.manufacturing.title', 'homepage.mega.about.manufacturing.desc',
  'homepage.mega.about.quality.title', 'homepage.mega.about.quality.desc',
  'homepage.mega.about.team.title', 'homepage.mega.about.team.desc',
  'homepage.mega.about.clients.title', 'homepage.mega.about.clients.desc',
  'homepage.mega.about.card.heading', 'homepage.mega.about.card.desc', 'homepage.mega.about.card.cta',
  'homepage.mega.resources.navTitle',
  'homepage.mega.resources.blog.title', 'homepage.mega.resources.blog.desc',
  'homepage.mega.resources.faq.title', 'homepage.mega.resources.faq.desc',
  'homepage.mega.resources.audit.title', 'homepage.mega.resources.audit.desc',
  'homepage.mega.resources.consult.title', 'homepage.mega.resources.consult.desc',
  'homepage.mega.resources.iplSafety.title', 'homepage.mega.resources.iplSafety.desc',
  'homepage.mega.audit.title', 'homepage.mega.audit.desc', 'homepage.mega.audit.cta',
  'homepage.mobile.iplCatalogue', 'homepage.mobile.allProducts',
  'homepage.mobile.viewAllServices.title', 'homepage.mobile.viewAllServices.desc',
  'homepage.mobile.consultDesc',
  'nav.iplComponentsCatalogue'
];

let missing = 0;
for (const k of keys) {
  const ev = getValue(en, k);
  const tv = getValue(tr, k);
  const av = getValue(ar, k);
  const ok = ev !== undefined && tv !== undefined && av !== undefined;
  if (!ok) {
    missing++;
    console.log(`MISSING ${k}: en=${typeof ev === 'string' ? 'OK' : ev === undefined ? 'missing' : 'nonstring'} tr=${typeof tv === 'string' ? 'OK' : tv === undefined ? 'missing' : 'nonstring'} ar=${typeof av === 'string' ? 'OK' : av === undefined ? 'missing' : 'nonstring'}`);
  }
}
console.log(`\n总计 ${keys.length} 键，缺失 ${missing} 个`);
