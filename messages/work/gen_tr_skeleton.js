const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';
const names = ['aboutPages', 'auxPages', 'clientPage', 'develoContent', 'develoCore', 'develoSocial', 'teamPage', 'productDetail'];
for (const n of names) {
  const enX = JSON.parse(fs.readFileSync(base + 'work/extract_en_' + n + '.json', 'utf8'));
  fs.writeFileSync(base + 'work/extract_tr_' + n + '.json', JSON.stringify(enX, null, 2), 'utf8');
  console.log('skeleton created:', n);
}
const tr = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));
const flatten = (o, p = '') => Object.entries(o).reduce((a, [k, v]) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return a.concat(flatten(v, p + k + '.'));
  return a.concat([{ k: p + k, v }]);
}, []);
const enF = flatten(en);
const trF = flatten(tr);
const trMap = new Map(trF.map((x) => [x.k, x.v]));
const needTr = enF.filter((x) => trMap.get(x.k) === x.v && x.v !== '[TODO]' && !String(x.v).startsWith('[TODO]'));
console.log('tr keys still identical to en (need translation):', needTr.length);
const byTop = {};
needTr.forEach((x) => {
  const t = x.k.split('.')[0];
  byTop[t] = (byTop[t] || 0) + 1;
});
console.log(JSON.stringify(byTop, null, 1));
