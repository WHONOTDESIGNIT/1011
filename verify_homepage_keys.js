const fs = require('fs');
const tr = JSON.parse(fs.readFileSync('messages/tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
let out = '';
// SiteHeader 需要用到的 homepage 键（对照首页内联 header）
const keys = [
  'homepage.trustBar.shipping', 'homepage.trustBar.privateLabel', 'homepage.trustBar.chatgpt',
  'homepage.logo.alt', 'homepage.nav.products', 'homepage.nav.services', 'homepage.nav.about',
  'homepage.nav.resources', 'homepage.nav.work', 'homepage.nav.cta',
  'homepage.mega.components.heading', 'homepage.mega.components.lamp', 'homepage.mega.components.filter',
  'homepage.mega.components.cooling', 'homepage.mega.components.power',
  'homepage.mega.card.heading', 'homepage.mega.card.desc', 'homepage.mega.card.cta',
];
for (const k of keys) {
  out += k + ' => tr=' + JSON.stringify(get(tr, k)) + ' | en=' + JSON.stringify(get(en, k)) + '\n';
}
fs.writeFileSync('verify_homepage_keys.txt', out);
console.log('written');
