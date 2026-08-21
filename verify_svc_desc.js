const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const tr = JSON.parse(fs.readFileSync('messages/tr.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), o);
let out = '';
// 检查 homepage.mega.services 下各链接是否有 title/desc 子键
const services = get(en, 'homepage.mega.services') || {};
out += 'mega.services keys: ' + Object.keys(services).join(', ') + '\n';
for (const k of Object.keys(services)) {
  const v = services[k];
  if (v && typeof v === 'object') out += '  ' + k + ' = ' + JSON.stringify(v) + '\n';
}
// mega.card1
out += '\ncard1 = ' + JSON.stringify(get(en, 'homepage.mega.card1')) + '\n';
// tr 是否一致
const ts = get(tr, 'homepage.mega.services') || {};
out += '\ntr mega.services keys: ' + Object.keys(ts).join(', ') + '\n';
fs.writeFileSync('verify_svc_desc.txt', out);
console.log('written');
