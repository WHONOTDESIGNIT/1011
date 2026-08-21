// 按叶子路径深拆：每块 ≤ 120 叶子，输出 messages/work/split/extract_en_{name}_part{i}.json
// 每块为 { name: { 嵌套子集 } }，仅含该块叶子路径
const fs = require('fs');
const path = require('path');

const names = ['auxPages', 'develoContent', 'clientPage', 'develoCore', 'tr_legacy_services'];
const OUT = path.join(__dirname, 'split');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// 清空旧 split 文件
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

function collectLeaves(obj, prefix, out) {
  for (const k in obj) {
    const v = obj[k];
    const p = prefix + (prefix ? '.' : '') + k;
    if (v && typeof v === 'object') collectLeaves(v, p, out);
    else out.push({ p, v });
  }
}

function buildNested(rootName, leaves) {
  const root = { [rootName]: {} };
  for (const { p, v } of leaves) {
    const segs = p.split('.');
    let node = root[rootName];
    for (let i = 0; i < segs.length - 1; i++) {
      const s = segs[i];
      if (!(s in node)) node[s] = {};
      node = node[s];
    }
    node[segs[segs.length - 1]] = v;
  }
  return root;
}

let totalParts = 0;
for (const name of names) {
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, `extract_en_${name}.json`), 'utf8'));
  const rootName = Object.keys(en)[0]; // 顶层命名空间
  const leaves = [];
  collectLeaves(en[rootName], '', leaves);
  const TARGET = 120;
  const chunks = [];
  for (let i = 0; i < leaves.length; i += TARGET) chunks.push(leaves.slice(i, i + TARGET));
  chunks.forEach((chunk, idx) => {
    const partObj = buildNested(rootName, chunk);
    fs.writeFileSync(
      path.join(OUT, `extract_en_${name}_part${idx + 1}.json`),
      JSON.stringify(partObj, null, 2),
      'utf8'
    );
    totalParts++;
    console.log(`${name}_part${idx + 1}: ${chunk.length} leaves`);
  });
  console.log(`${name}: 共拆 ${chunks.length} 块, 总 ${leaves.length} leaves`);
}
console.log(`全部完成，共 ${totalParts} 个小单元`);
