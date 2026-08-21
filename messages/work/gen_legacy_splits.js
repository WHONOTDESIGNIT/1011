/* 生成 legacy 翻译分片（非 extract 命名空间、非 [TODO] 占位符的真实内容），供 subagent 翻译成土耳其语 */
const fs = require('fs');
const base = 'd:/1011-main/1011-main/1011-main/messages/';
const en = JSON.parse(fs.readFileSync(base + 'en.json', 'utf8'));

const EXTRACT_TOPS = ['aboutPages', 'auxPages', 'clientPage', 'develoContent', 'develoCore', 'develoSocial', 'teamPage', 'productDetail'];

const isPlaceholder = (v) => typeof v === 'string' && (v.startsWith('[TODO]') || v === '[TODO]');

// 递归裁剪：去掉叶子值非 [TODO] 的节点保留，[TODO] 叶子丢弃
function prune(node) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const out = {};
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const sub = prune(v);
        if (sub && Object.keys(sub).length) out[k] = sub;
      } else if (!isPlaceholder(v)) {
        out[k] = v;
      }
    }
    return Object.keys(out).length ? out : null;
  }
  return null;
}

// 分片规划
const groups = {
  tr_legacy_nav: ['common', 'nav', 'footer', 'languageSwitcher'],
  tr_legacy_home: ['home', 'homepage'],
  tr_legacy_blog: ['blog', 'contact'],
  tr_legacy_products: ['products', 'productsPage', 'componentsPage', 'componentsCooling', 'componentsFilter', 'componentsLamp', 'componentsPower'],
  tr_legacy_services: ['servicesPage', 'aboutPage'],
};

const leafCount = (o) => {
  let n = 0;
  const walk = (x) => { for (const k of Object.keys(x)) { const v = x[k]; if (v && typeof v === 'object' && !Array.isArray(v)) walk(v); else n++; } };
  walk(o);
  return n;
};

let total = 0;
for (const [name, tops] of Object.entries(groups)) {
  const out = {};
  for (const t of tops) {
    if (en[t] === undefined) continue;
    const p = prune(en[t]);
    if (p) out[t] = p;
  }
  const n = leafCount(out);
  total += n;
  fs.writeFileSync(base + `work/extract_en_${name}.json`, JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync(base + `work/extract_tr_${name}.json`, JSON.stringify(out, null, 2), 'utf8');
  console.log(`${name}: ${n} leaves`);
}
console.log('legacy total:', total);

// 占位符顶层（无需翻译，直接复制进 tr）
const PLACEHOLDER_TOPS = ['core', 'process', 'advantages', 'hero', 'why', 'trusted', 'cta', 'keyFeatures', 'list', 'controls', 'title', 'description', 'subtitle', 'form', 'info', 'ctaExplore', 'header', 'intro', 'diagram', 'overview', 'quality', 'customization', 'qualityBlocks', 'specs', 'types', 'applications', 'highlight', 'features', 'compliance', 'visuals', 'tech', 'breadcrumb'];
const placeholderOut = {};
let phCount = 0;
for (const t of PLACEHOLDER_TOPS) {
  if (en[t] !== undefined) { placeholderOut[t] = en[t]; phCount += leafCount(en[t]); }
}
fs.writeFileSync(base + 'work/extract_en_placeholder_todo.json', JSON.stringify(placeholderOut, null, 2), 'utf8');
console.log('placeholder keys (copied as-is):', phCount);
