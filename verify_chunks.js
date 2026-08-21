const fs = require('fs');
const path = require('path');
const d = 'astro/dist/_astro/';
let out = '';
// 查找包含 messages 数据的 chunk
const files = fs.readdirSync(d).filter((f) => f.endsWith('.js'));
for (const f of files) {
  const c = fs.readFileSync(path.join(d, f), 'utf8');
  if (c.length < 500000) continue; // 只查大 chunk
  const checks = ['IPL Ürünleri', 'Hizmetler', 'Hakkımızda', 'Profesyonel IPL Cihazları', 'nav', 'homepage', 'servicesPage'];
  const found = checks.filter((t) => c.includes(t));
  if (found.length) out += f + ' (' + c.length + '): ' + found.join(',') + '\n';
}
// 也检查是否有 en.json 数据包含 "Products"
for (const f of files) {
  const c = fs.readFileSync(path.join(d, f), 'utf8');
  if (c.includes('nav.products') && c.length < 500000) { out += 'small chunk with nav.products: ' + f + '\n'; }
}
fs.writeFileSync('verify_chunks.txt', out);
console.log('written');
