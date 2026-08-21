// 复制 40 个 extract_en_partXX.json 为 extract_id_partXX.json（初始骨架，翻译前的英文副本）
const fs = require('fs');
const path = require('path');
const SPLIT_DIR = path.join(__dirname, 'split');

for (let i = 1; i <= 40; i++) {
  const num = String(i).padStart(2, '0');
  const enFile = path.join(SPLIT_DIR, `extract_en_part${num}.json`);
  const idFile = path.join(SPLIT_DIR, `extract_id_part${num}.json`);
  if (fs.existsSync(idFile)) { console.log(`part${num} 已存在，跳过`); continue; }
  fs.copyFileSync(enFile, idFile);
  console.log(`created part${num}`);
}
console.log('骨架生成完成');
