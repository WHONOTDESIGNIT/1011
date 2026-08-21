// 逐轮质量校验：对比指定分片的 en 源与 pl 目标（叶子路径 + 数组结构 + TODO 对齐）
// 用法: node verify_part.cjs 09 40
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'split');

function collectLeaves(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) collectLeaves(v, p, out);
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

const nums = process.argv.slice(2);
let allOk = true;
for (const num of nums) {
  const enFile = path.join(DIR, `extract_en_part${num}.json`);
  const plFile = path.join(DIR, `extract_pl_part${num}.json`);
  if (!fs.existsSync(plFile)) { console.log(`part${num}: ❌ 缺少目标文件`); allOk = false; continue; }
  let en, pl;
  try {
    en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    pl = JSON.parse(fs.readFileSync(plFile, 'utf8'));
  } catch (e) { console.log(`part${num}: ❌ JSON 解析失败: ${e.message}`); allOk = false; continue; }
  const enL = collectLeaves(en, '', []).sort();
  const plL = collectLeaves(pl, '', []).sort();
  const enA = collectArrays(en, '', []).sort();
  const plA = collectArrays(pl, '', []).sort();
  const missing = enL.filter((x) => !plL.includes(x));
  const extra = plL.filter((x) => !enL.includes(x));
  const missingArr = enA.filter((x) => !plA.includes(x));
  const extraArr = plA.filter((x) => !enA.includes(x));
  // 统计仍为英文原文（保留值）的数量，仅供抽查
  let englishLeaves = 0;
  const retained = [];
  (function walk(o, enObj, prefix) {
    for (const [k, v] of Object.entries(o)) {
      const p = prefix ? `${prefix}.${k}` : k;
      const ev = enObj && typeof enObj === 'object' ? enObj[k] : undefined;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, ev, p);
      else if (typeof v === 'string' && typeof ev === 'string' && v === ev && !v.startsWith('[TODO]') && v.trim() !== '') {
        englishLeaves++;
        if (retained.length < 10) retained.push(p);
      }
    }
  })(pl, en, '');
  const ok = missing.length === 0 && extra.length === 0 && missingArr.length === 0 && extraArr.length === 0;
  console.log(`part${num}: 叶子 ${enL.length}/${plL.length} 数组 ${enA.length}/${plA.length} ${ok ? '✅' : '❌'}`);
  if (missing.length) console.log('  missing:', missing.slice(0, 8));
  if (extra.length) console.log('  extra:', extra.slice(0, 8));
  if (missingArr.length || extraArr.length) console.log('  数组差异:', missingArr.slice(0, 4), extraArr.slice(0, 4));
  if (englishLeaves > 0) console.log(`  ⚠️ 疑似未翻译叶子 ${englishLeaves} 个，示例: ${retained.join(', ')}`);
  if (!ok) allOk = false;
}
process.exit(allOk ? 0 : 1);
