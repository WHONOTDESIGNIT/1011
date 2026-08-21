// 分析 40 块 extract_en_partXX.json 的 [TODO] 骨架比例，标记可直接复制的块
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, 'split');

function countLeaves(o) {
  let n = 0, todo = 0, en = 0;
  const walk = (obj) => {
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v);
      else {
        n++;
        if (typeof v === 'string') {
          if (v.startsWith('[TODO]')) todo++;
          else if (/\b(the|your|our|with|for|from|this|that|what|why|how|are|were|will|is|we|and|but|not|can|should|would)\b/.test(v) && v.length > 10) en++;
        }
      }
    }
  };
  walk(o);
  return { n, todo, en };
}

for (let i = 1; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const file = path.join(DIR, `extract_en_part${num}.json`);
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { n, todo, en } = countLeaves(j);
  const todoPct = Math.round((todo / n) * 100);
  const flag = todoPct >= 90 ? '→ 骨架块(直接复制)' : todoPct >= 30 ? '→ 半骨架' : '';
  console.log(`part${num}: 叶子=${n} [TODO]=${todo}(${todoPct}%) 含英文样=${en} ${flag}`);
}
