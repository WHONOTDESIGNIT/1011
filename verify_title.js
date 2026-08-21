const fs = require('fs');
const tr = JSON.parse(fs.readFileSync('messages/tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
let out = '';
out += 'tr servicesPage.index.meta.title = ' + get(tr, 'servicesPage.index.meta.title') + '\n';
out += 'en servicesPage.index.meta.title = ' + get(en, 'servicesPage.index.meta.title') + '\n';
out += 'tr nav.products = ' + get(tr, 'nav.products') + '\n';
out += 'tr nav.services = ' + get(tr, 'nav.services') + '\n';
out += 'tr footer col1 检查: ' + JSON.stringify(get(tr, 'footer') ? Object.keys(tr.footer) : 'no footer') + '\n';
out += 'en footer col1 检查: ' + JSON.stringify(get(en, 'footer') ? Object.keys(en.footer) : 'no footer') + '\n';
// footer 里的产品链接文本
const ftr = tr.footer || {};
for (const k of Object.keys(ftr)) {
  const v = ftr[k];
  if (typeof v === 'string') out += 'footer.' + k + ' = ' + v + '\n';
}
fs.writeFileSync('verify_title.txt', out);
console.log('written');
