const fs = require('fs');
const path = require('path');
const T = {
  ar: 'ابحث عن شريك تقني',
  cs: 'Najděte technologického partnera',
  de: 'Finden Sie einen Technologiepartner',
  el: 'Βρείτε έναν τεχνολογικό συνεργάτη',
  es: 'Encuentra un socio tecnológico',
  fa: 'یک شریک فناوری پیدا کنید',
  fr: 'Trouvez un partenaire technologique',
  he: 'מצאו שותף טכנולוגי',
  id: 'Temukan mitra teknologi',
  ja: 'テクノロジーパートナーを見つける',
  ko: '기술 파트너 찾기',
  nl: 'Vind een technologiepartner',
  pl: 'Znajdź partnera technologicznego',
  'pt-BR': 'Encontre um parceiro tecnológico',
  'pt-PT': 'Encontre um parceiro tecnológico',
  ro: 'Găsește un partener tehnologic',
  ru: 'Найдите технологического партнёра',
  th: 'ค้นหาพันธมิตรด้านเทคโนโลยี',
  tr: 'Bir teknoloji ortağı bulun',
  vi: 'Tìm đối tác công nghệ',
};
const TARGETS = [
  ['homepage', 'whatWeDo', 'item1', 'cta'],
  ['develoCore', 'clone', 'wwd', 'item1', 'cta'],
  ['servicesPage', 'index', 'wwd', 'items', '1', 'cta'],
];
const get = (o, p) => p.reduce((a, k) => a && a[k], o);
let bad = 0;
for (const l of Object.keys(T)) {
  const o = JSON.parse(fs.readFileSync(path.join('messages', l + '.json'), 'utf8'));
  const vals = TARGETS.map((t) => get(o, t));
  const ok = vals.every((v) => v === T[l]);
  if (!ok) {
    bad++;
    console.log('BAD', l, JSON.stringify(vals));
  }
}
// it 分片
const it = JSON.parse(fs.readFileSync('messages/work/it/split/extract_it_part10.json', 'utf8'));
const itChecks = [
  ['extract_it_part04.json', ['homepage', 'whatWeDo', 'item1', 'cta']],
  ['extract_it_part10.json', ['servicesPage', 'index', 'wwd', 'items', '1', 'cta']],
  ['extract_it_part27.json', ['develoCore', 'clone', 'wwd', 'item1', 'cta']],
];
for (const [f, t] of itChecks) {
  const o = JSON.parse(fs.readFileSync(path.join('messages/work/it/split', f), 'utf8'));
  const v = get(o, t);
  if (v !== 'Trova un partner tecnologico') {
    bad++;
    console.log('BAD it', f, JSON.stringify(v));
  }
}
// 确认 it part10 items.0/2/3 未被动
const rest = [it.servicesPage.index.wwd.items[0].cta, it.servicesPage.index.wwd.items[2].cta, it.servicesPage.index.wwd.items[3].cta];
console.log('it part10 items0/2/3 cta:', rest.join(' | '));
console.log(bad === 0 ? 'ALL 23 FILES OK' : 'FAILURES: ' + bad);
