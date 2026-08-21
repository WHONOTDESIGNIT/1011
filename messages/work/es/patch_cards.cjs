// 为 productDetail.index.cards 补 6 个缺失 tagline 键（en/tr/ar 用英文原值，es 用西语）
const fs = require('fs');
const path = require('path');

const MSGS = path.join(__dirname, '..', '..');
const enValues = {
  lumi: "RoseSkinCo's Top Selling",
  'lumi-2': 'Smart Skin Sensor + Chills Skin to 10℃',
  hestia: 'Smart App-Connected Hair Removal',
  euno: 'Compact & Portable Design',
  themis: 'Ice Feeling Professional Treatment',
  helix: 'Ice Cooling + 9 Intensity Levels',
};
const esValues = {
  lumi: 'El más vendido de RoseSkinCo',
  'lumi-2': 'Sensor de piel inteligente y piel fría a 10 °C',
  hestia: 'Depilación conectada mediante app inteligente',
  euno: 'Diseño compacto y portátil',
  themis: 'Tratamiento profesional con sensación de frío',
  helix: 'Refrigeración con sensación de frío + 9 niveles de intensidad',
};

for (const lang of ['en', 'tr', 'ar', 'es']) {
  const file = path.join(MSGS, `${lang}.json`);
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  const vals = lang === 'es' ? esValues : enValues;
  for (const [slug, tagline] of Object.entries(vals)) {
    m.productDetail.index.cards[slug] = { tagline };
  }
  fs.writeFileSync(file, JSON.stringify(m, null, 2));
  console.log(`${lang}.json updated, cards keys:`, Object.keys(m.productDetail.index.cards).join(','));
}
