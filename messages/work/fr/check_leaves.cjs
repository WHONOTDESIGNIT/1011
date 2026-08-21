// 核验 fr.json 中 3 个可疑叶子与 en.json 源是否一致
const fs = require('fs');
const en = JSON.parse(fs.readFileSync('D:/1011-main/1011-main/1011-main/messages/en.json', 'utf8'));
const fr = JSON.parse(fs.readFileSync('D:/1011-main/1011-main/1011-main/messages/fr.json', 'utf8'));
const get = (o, p) => p.split('.').reduce((c, k) => (c ? c[k] : undefined), o);
for (const p of ['why.title', 'why.description', 'clientPage.catalogue.citableSummaryBody']) {
  console.log(`en ${p} =`, JSON.stringify(get(en, p)));
  console.log(`fr ${p} =`, JSON.stringify(get(fr, p)));
  console.log('---');
}
