// ro.json 翻译覆盖率与质量校验：
// 1) 键路径/数组结构 与 en.json 完全一致（100% 覆盖）
// 2) [TODO] 残留数量应与 en.json 相同（遗留未用键约定）
// 3) 英文句子残留扫描（排除品牌/缩写/借词白名单）
// 4) 变音符完整性统计
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'messages');
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'en.json'), 'utf8'));
const ro = JSON.parse(fs.readFileSync(path.join(ROOT, 'ro.json'), 'utf8'));

function collectPaths(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) collectPaths(v, p, out);
    else out.push(p);
  }
  return out;
}
function collectArrays(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out.push(p);
    if (v && typeof v === 'object') collectArrays(v, p, out);
  }
  return out;
}

const enPaths = collectPaths(en, '', []).sort();
const roPaths = collectPaths(ro, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const roArrays = collectArrays(ro, '', []).sort();

const missing = enPaths.filter((x) => !roPaths.includes(x));
const extra = roPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !roArrays.includes(x));
const extraArr = roArrays.filter((x) => !enArrays.includes(x));

// [TODO] 统计（与 en 对齐的遗留键）
function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const enTodo = collectTodo(en, []);
const roTodo = collectTodo(ro, []);

// 英文残留：ro 值保持英文但 en 值非英文的叶子
// 白名单：品牌/缩写/专有名词（子串级精确匹配，仅在叶子为整串英文时判定）
const ALLOWED = new Set([
  'iShine', 'IPL', 'OEM', 'ODM', 'FDA', 'CE', 'ISO', 'MOQ', 'UV', 'LED', 'RFQ', 'SKU', '3D', 'APP', 'UI/UX',
  'Lumi', 'Venus', 'Hestia', 'Alpha', 'Emerald', 'Euno', 'Themis', 'Hebe', 'Helix', 'Eirene', 'Golden Luxury',
  'FAQ', 'ECOM', 'SEO', 'CMS', 'Magento', 'Hyva', 'Develo', 'PayPal', 'Stripe', 'WhatsApp', 'Skype', 'PDF',
  'Yes', 'No', 'Support', 'Corded', 'Standard', 'FWHM', 'TEC', 'MDSAP', 'B2B', 'DTC', 'Peltier', 'Shenzhen',
]);
const enWordPattern = /\b(the|your|our|with|for|from|this|that|what|why|how|are|were|will|and|can|not|you)\b/i;
const engLeaves = [];
for (const p of roPaths) {
  const parts = p.split('.');
  let cur = ro;
  for (const part of parts) cur = cur[part];
  if (typeof cur !== 'string') continue;
  if (cur.startsWith('[TODO]')) continue; // 遗留 [TODO] 键（与 en 一致）不参与英文残留判定
  const s = cur.trim();
  // 判定为英文：包含常见英文功能词 且 不含罗马尼亚语特征词（ă/â/ș/ț/î 或 î 前缀）
  if (s.length > 12 && enWordPattern.test(s) && !/[ăâșțîĂÂȘȚÎ]/.test(s)) {
    // 整串均为白名单品牌/缩写（去除数字/符号后）→ 允许
    const cleaned = s.replace(/[0-9.,%°²³°C\s+\-–—/&()\[\]→×™®©·:|"''!?]/g, '');
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every((tk) => ALLOWED.has(tk))) continue;
    engLeaves.push({ p, v: s.slice(0, 90) });
  }
}

// 变音符统计
let diacritics = 0;
let totalChars = 0;
for (const p of roPaths) {
  const parts = p.split('.');
  let cur = ro;
  for (const part of parts) cur = cur[part];
  if (typeof cur !== 'string') continue;
  totalChars += cur.length;
  diacritics += (cur.match(/[ăâîșțĂÂÎȘȚ]/g) || []).length;
}

const enTodoSet = new Set(enTodo);
const todoMismatch = roTodo.filter((k) => !enTodoSet.has(k));

console.log('═══ 覆盖率校验 ═══');
console.log(`en 叶子: ${enPaths.length}, ro 叶子: ${roPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
console.log(`en 数组: ${enArrays.length}, ro 数组: ${roArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);
console.log(`翻译覆盖率: ${((roPaths.length - missing.length) / enPaths.length * 100).toFixed(2)}%`);
console.log(`[TODO] 残留: ro=${roTodo.length} (en=${enTodo.length}), 不一致=${todoMismatch.length}`);
console.log(`英文残留候选: ${engLeaves.length}`);
engLeaves.slice(0, 15).forEach((e) => console.log(`  ${e.p} = ${e.v}`));
console.log(`变音符字符数: ${diacritics} / 总字符 ${totalChars}`);

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0 && todoMismatch.length === 0 && engLeaves.length === 0;
console.log(ok ? '\n✅ 覆盖率达到 100%，无遗漏/多余键，无英文残留' : '\n❌ 存在待处理项');
process.exit(ok ? 0 : 1);
