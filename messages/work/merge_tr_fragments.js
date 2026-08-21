/* 将 13 个 extract_tr 分片合并回 messages/tr.json（分片土耳其语覆盖 tr.json 中的英文/占位内容）
   注意：不能使用 merge_extract.js 的 deepMerge(tr, en) 逻辑（en 会覆盖 tr 土耳其语）。 */
const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';

// 分片 => 对应 tr.json 顶层命名空间
const FRAGMENTS = [
  ['aboutPages', 'aboutPages'],
  ['auxPages', 'auxPages'],
  ['clientPage', 'clientPage'],
  ['develoContent', 'develoContent'],
  ['develoCore', 'develoCore'],
  ['develoSocial', 'develoSocial'],
  ['teamPage', 'teamPage'],
  ['productDetail', 'productDetail'],
  ['tr_legacy_nav', 'common'],
  ['tr_legacy_home', 'home'],
  ['tr_legacy_blog', 'blog'],
  ['tr_legacy_products', 'products'],
  ['tr_legacy_services', 'servicesPage'],
];

// deepMerge：source 叶子覆盖 target（source 优先）
function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) target[k] = {};
      deepMerge(target[k], sv);
    } else {
      target[k] = sv;
    }
  }
  return target;
}

const leaves = (o, p = '') => Object.entries(o).reduce((a, [k, v]) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) return a.concat(leaves(v, p + k + '.'));
  return a.concat([p + k]);
}, []);

const tr = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));

for (const [fragName, topKey] of FRAGMENTS) {
  const frag = JSON.parse(fs.readFileSync(base + `work/extract_tr_${fragName}.json`, 'utf8'));
  const fragTop = Object.keys(frag)[0];
  // 结构校验：分片顶层必须与目标命名空间一致
  if (fragTop !== topKey) {
    throw new Error(`[${fragName}] 分片顶层 "${fragTop}" 与目标 "${topKey}" 不一致`);
  }
  const before = leaves(tr).length;
  deepMerge(tr, frag);
  const after = leaves(tr).length;
  console.log(`[${fragName}] 合并到 ${topKey}: ${leaves(frag).length} leaves (tr 叶子 ${before} → ${after})`);
}

fs.writeFileSync(base + 'tr.json', JSON.stringify(tr, null, 2), 'utf8');

// 复验
const t2 = JSON.parse(fs.readFileSync(base + 'tr.json', 'utf8'));
const tL = leaves(t2);
console.log('FINAL tr leaves:', tL.length);
// 抽样验证土耳其语
const samples = ['common.nav.home', 'home.hero.title1', 'servicesPage.hero.title1'];
for (const s of samples) {
  const v = s.split('.').reduce((a, k) => a?.[k], t2);
  console.log(`sample ${s} =`, JSON.stringify(v));
}
