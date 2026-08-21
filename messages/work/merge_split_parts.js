// 将 messages/work/split/extract_tr_{name}_part{i}.json 合并回 messages/work/extract_tr_{name}.json
const fs = require('fs');
const path = require('path');

const names = ['auxPages', 'develoContent', 'clientPage', 'develoCore', 'tr_legacy_services'];
const SPLIT = path.join(__dirname, 'split');

function deepAssign(target, source) {
  for (const k in source) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepAssign(target[k], source[k]);
    } else {
      target[k] = source[k];
    }
  }
}

for (const name of names) {
  // 收集该名称的所有 tr part 文件（按 part 编号排序）
  const files = fs.readdirSync(SPLIT)
    .filter((f) => f.startsWith(`extract_tr_${name}_part`) && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.match(/part(\d+)/)[1], 10);
      const nb = parseInt(b.match(/part(\d+)/)[1], 10);
      return na - nb;
    });
  const merged = {};
  for (const f of files) {
    const part = JSON.parse(fs.readFileSync(path.join(SPLIT, f), 'utf8'));
    deepAssign(merged, part);
  }
  // 顶层命名空间
  const rootName = Object.keys(merged)[0];
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, `extract_en_${name}.json`), 'utf8'));
  const enRoot = Object.keys(en)[0];
  fs.writeFileSync(
    path.join(__dirname, `extract_tr_${name}.json`),
    JSON.stringify(merged, null, 2) + '\n',
    'utf8'
  );
  // 校验：叶子数一致 + 已翻译数
  function leafCount(o) {
    return Object.values(o).reduce((n, v) => n + (v && typeof v === 'object' ? leafCount(v) : 1), 0);
  }
  function leaves(obj, prefix, out) {
    for (const k in obj) {
      const v = obj[k];
      const p = prefix + (prefix ? '.' : '') + k;
      if (v && typeof v === 'object') leaves(v, p, out);
      else out.push({ p, v });
    }
  }
  const enLeaves = [];
  leaves(en[enRoot], '', enLeaves);
  const trLeaves = [];
  leaves(merged[rootName], '', trLeaves);
  const trMap = new Map(trLeaves.map((l) => [l.p, l.v]));
  let same = 0;
  for (const l of enLeaves) {
    if (trMap.has(l.p) && trMap.get(l.p) === l.v) same++;
  }
  console.log(
    `${name}: en=${enLeaves.length} tr=${leafCount(merged)} en残留=${same} 已翻译=${enLeaves.length - same}`
  );
}
console.log('合并完成');
