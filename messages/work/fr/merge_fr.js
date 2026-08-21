// 合并 40 个 extract_fr_partXX.json → messages/fr.json，并校验与 en.json 键路径完全一致
// 附：法语标点规范化——将 ? ! : ; 前的普通空格统一为窄不换行空格 (\u202F)
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'fr.json');
const SPLIT_DIR = path.join(__dirname, 'split');
const PARTS = 40;

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

// 深合并：b 合并进 a（同键对象递归，叶子覆盖）
function deepMerge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!a[k] || typeof a[k] !== 'object' || Array.isArray(a[k])) a[k] = {};
      deepMerge(a[k], v);
    } else {
      a[k] = v;
    }
  }
  return a;
}

// 法语标点规范化：' ?' / ' !' / ' :' / ' ;' → ' ?' (\u202F)。仅处理「空格+标点」，URL/时间冒号等无空格的不受影响
function normalizePunct(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      normalizePunct(v);
    } else if (typeof v === 'string') {
      obj[k] = v.replace(/ (\?|!|:|;)/g, '\u202F$1');
    }
  }
}

const merged = {};
for (let i = 1; i <= PARTS; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(SPLIT_DIR, `extract_fr_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  const block = JSON.parse(fs.readFileSync(file, 'utf8'));
  deepMerge(merged, block);
  console.log(`merged part${num}`);
}

// 统一全站法语标点风格（窄空格），消除新旧分块差异
normalizePunct(merged);

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`已写入 ${OUT}，顶层键: ${Object.keys(merged).join(',')}`);

// 校验：键路径与叶子数与 en.json 完全一致
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
const frPaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const frArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !frPaths.includes(x));
const extra = frPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !frArrays.includes(x));
const extraArr = frArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, fr 叶子: ${frPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, fr 数组键: ${frArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);
if (missingArr.length) console.log('missing 数组示例:', missingArr.slice(0, 10));

// 残留 [TODO] 占位符统计（允许保留）
function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v === '[TODO]') out.push(k);
  }
  return out;
}
const todos = collectTodo(merged, []);
console.log(`[TODO] 占位符叶子: ${todos.length}${todos.length ? ' → ' + todos.slice(0, 8).join(',') + (todos.length > 8 ? '…' : '') : ''}`);

// 与 en 比较：值仍为纯英文句子的残留（简单启发式：含 'the ' / ' your ' / ' our ' 且长度>12）
let engLeaves = 0;
for (const p of frPaths) {
  const parts = p.split('.');
  let cur = merged;
  for (const part of parts) cur = cur[part];
  if (typeof cur === 'string' && /\b(the|your|our|with|for|from|this|that|what|why|how|are|were|will)\b/.test(cur) && cur.length > 12) {
    engLeaves++;
    console.log('可疑英文残留:', p, '=', cur.slice(0, 80));
  }
}
console.log(`可疑英文残留叶子: ${engLeaves}`);

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0;
console.log(ok ? '\n✅ 校验通过：键路径与数组结构完全一致' : '\n❌ 校验失败，请检查上述差异');
process.exit(ok ? 0 : 1);
