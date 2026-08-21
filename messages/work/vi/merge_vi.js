// 合并 40 个 extract_vi_partXX.json → messages/vi.json，并校验与 en.json 键路径完全一致
// 归一化：英文源为 [TODO] 的遗留键（站点未使用）保持与 en.json 完全一致（与既有语言包约定一致）
const fs = require('fs');
const path = require('path');

const EN = path.join(__dirname, '..', '..', 'en.json');
const OUT = path.join(__dirname, '..', '..', 'vi.json');
const SPLIT_DIR = path.join(__dirname, 'split');
const PARTS = 40;

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

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

const merged = {};
for (let i = 1; i <= PARTS; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(SPLIT_DIR, `extract_vi_part${num}.json`);
  if (!fs.existsSync(file)) {
    console.error(`缺少分片: ${file}`);
    process.exit(1);
  }
  deepMerge(merged, JSON.parse(fs.readFileSync(file, 'utf8')));
  console.log(`merged part${num}`);
}

function normalizeTodo(obj, enObj) {
  for (const [k, v] of Object.entries(obj)) {
    const ev = enObj && typeof enObj === 'object' ? enObj[k] : undefined;
    if (typeof ev === 'string' && ev.startsWith('[TODO]')) {
      obj[k] = ev;
    } else if (v && typeof v === 'object' && !Array.isArray(v) && ev && typeof ev === 'object' && !Array.isArray(ev)) {
      normalizeTodo(v, ev);
    }
  }
}
normalizeTodo(merged, en);

// 应用补译补丁：messages/work/vi/vi_fix.json（扁平 key.path -> 值，覆盖残留英文）
const FIX = path.join(__dirname, 'vi_fix.json');
if (fs.existsSync(FIX)) {
  const flat = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  for (const [p, val] of Object.entries(flat)) {
    const keys = p.split('.');
    let cur = merged;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = val;
  }
  console.log('applied fix: ' + FIX + ' (' + Object.keys(flat).length + ' keys)');
}

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
console.log(`已写入 ${OUT}，顶层键: ${Object.keys(merged).join(',')}`);

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
const viPaths = collectPaths(merged, '', []).sort();
const enArrays = collectArrays(en, '', []).sort();
const viArrays = collectArrays(merged, '', []).sort();

const missing = enPaths.filter((x) => !viPaths.includes(x));
const extra = viPaths.filter((x) => !enPaths.includes(x));
const missingArr = enArrays.filter((x) => !viArrays.includes(x));
const extraArr = viArrays.filter((x) => !enArrays.includes(x));

console.log(`en 叶子: ${enPaths.length}, vi 叶子: ${viPaths.length}`);
console.log(`missing 叶子: ${missing.length}, extra 叶子: ${extra.length}`);
if (missing.length) console.log('missing 示例:', missing.slice(0, 10));
if (extra.length) console.log('extra 示例:', extra.slice(0, 10));
console.log(`en 数组键: ${enArrays.length}, vi 数组键: ${viArrays.length}`);
console.log(`missing 数组: ${missingArr.length}, extra 数组: ${extraArr.length}`);

function collectTodo(obj, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) collectTodo(v, out);
    else if (typeof v === 'string' && v.startsWith('[TODO]')) out.push(k);
  }
  return out;
}
const todos = collectTodo(merged, []);
const enTodo = collectTodo(en, []);
console.log(`[TODO] 占位符叶子: vi=${todos.length} (en=${enTodo.length})`);

// 检查是否残留未翻译的英文长文本（阈值：英文单词占比高的叶子，过滤品牌名/URL/单位等）
function countEnglishWords(s) {
  const m = s.match(/[A-Za-z]{2,}/g);
  return m ? m.length : 0;
}
function scanEnglish(obj, enObj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const ev = enObj && typeof enObj === 'object' ? enObj[k] : undefined;
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (ev && typeof ev === 'object' && !Array.isArray(ev)) scanEnglish(v, ev, p, out);
    } else if (typeof v === 'string' && typeof ev === 'string' && v !== ev) {
      const w = countEnglishWords(v);
      // 越南语文案中英文单词数应远低于原文；若几乎全英文且非品牌/代码/URL，视为漏译
      if (w >= 4) {
        const ratio = w / Math.max(1, countEnglishWords(ev));
        if (ratio >= 0.8) out.push(`${p} :: ${v.slice(0, 90)}`);
      }
    }
  }
  return out;
}
const englishResiduals = scanEnglish(merged, en, '', []);
console.log(`疑似残留英文: ${englishResiduals.length}`);
englishResiduals.slice(0, 20).forEach((x) => console.log('  ' + x));

const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0 && todos.length === enTodo.length;
console.log(ok ? '\n✅ 校验通过：键路径与数组结构完全一致，TODO 数与 en 对齐' : '\n❌ 校验失败，请检查上述差异');
process.exit(ok ? 0 : 1);
