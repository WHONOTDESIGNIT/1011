// 核查 40 个 cs 分片翻译状态：每个分片统计与 en 完全相同的叶子比例 + 捷克语字符数
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPLIT = path.join(__dirname, 'split');

function leafCount(obj) {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) n += leafCount(v);
    else n++;
  }
  return n;
}
function identicalLeaves(a, b) {
  let n = 0;
  for (const [k, v] of Object.entries(a)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      n += identicalLeaves(v, b?.[k]);
    } else if (b && typeof b[k] === 'string' && b[k] === v) n++;
  }
  return n;
}
function czCharCount(obj) {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) n += czCharCount(v);
    else if (typeof v === 'string') {
      const m = v.match(/[čřžšěáíýů]/gi);
      if (m) n += m.length;
    }
  }
  return n;
}

let totalLeaves = 0, totalIdentical = 0, totalCz = 0;
const rows = [];
for (let i = 1; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const cs = JSON.parse(fs.readFileSync(path.join(SPLIT, `extract_cs_part${num}.json`), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(SPLIT, `extract_en_part${num}.json`), 'utf8'));
  const leaves = leafCount(cs);
  const identical = identicalLeaves(cs, en);
  const cz = czCharCount(cs);
  totalLeaves += leaves; totalIdentical += identical; totalCz += cz;
  const status = identical === leaves ? '❌ 全英文' : cz > 0 ? '✅ 已翻译' : `⚠️ 部分(${leaves - identical} 不同)`;
  rows.push({ num, leaves, identical, cz, status });
}

console.log('分片 | 叶子 | 与en相同 | 捷克字符 | 状态');
for (const r of rows) {
  console.log(`${r.num} | ${r.leaves} | ${r.identical} | ${r.cz} | ${r.status}`);
}
console.log(`\n总计: ${totalLeaves} 叶子, ${totalIdentical} 与 en 相同(${((totalIdentical / totalLeaves) * 100).toFixed(1)}%), 捷克字符 ${totalCz}`);
