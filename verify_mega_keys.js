const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
let out = '';
// services mega 8 链接是否有 title+desc
const servicesLinks = ['oemOdm', 'productDesign', 'productionAssembly', 'packagingLogistics', 'logoPrinting', 'boxCustom', 'dropshipping', 'noMoq'];
out += '=== mega.services 结构 ===\n';
out += 'heading=' + get(en, 'homepage.mega.services.heading') + '\n';
for (const k of servicesLinks) {
  const v = get(en, 'homepage.mega.services.' + k);
  out += k + ' = ' + JSON.stringify(v) + '\n';
}
// about card
out += '=== mega.about.card ===\n';
out += 'heading=' + get(en, 'homepage.mega.about.card.heading') + '\n';
out += 'desc=' + get(en, 'homepage.mega.about.card.desc') + '\n';
out += 'cta=' + get(en, 'homepage.mega.about.card.cta') + '\n';
// audit card
out += '=== mega.audit ===\n';
out += 'title=' + get(en, 'homepage.mega.audit.title') + '\n';
out += 'desc=' + get(en, 'homepage.mega.audit.desc') + '\n';
out += 'cta=' + get(en, 'homepage.mega.audit.cta') + '\n';
// nav keys
out += '=== nav ===\n';
out += 'ourWork=' + get(en, 'homepage.nav.ourWork') + '\n';
out += 'getInTouch=' + get(en, 'homepage.nav.getInTouch') + '\n';
out += 'menuLabel=' + get(en, 'homepage.nav.menuLabel') + '\n';
out += 'iplComponentsCatalogue(nav.)=' + get(en, 'nav.iplComponentsCatalogue') + '\n';
out += '=== mobile ===\n';
out += 'iplCatalogue=' + get(en, 'homepage.mobile.iplCatalogue') + '\n';
out += 'allProducts=' + get(en, 'homepage.mobile.allProducts') + '\n';
out += 'viewAllServices.title=' + get(en, 'homepage.mobile.viewAllServices.title') + '\n';
out += 'viewAllServices.desc=' + get(en, 'homepage.mobile.viewAllServices.desc') + '\n';
out += 'consultDesc=' + get(en, 'homepage.mobile.consultDesc') + '\n';
fs.writeFileSync('verify_mega_keys.txt', out);
console.log('written');
