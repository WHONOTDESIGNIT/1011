// 追踪 extract_it_part10.json 的 servicesPage.index.wwd.items.1.cta
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'it', 'split', 'extract_it_part10.json');
const pathParts = ['servicesPage', 'index', 'wwd', 'items', '1', 'cta'];
const want = pathParts.slice(0, -1).join('.');

const text = fs.readFileSync(file, 'utf8');
const lines = text.split('\n');
const stack = [];
let arrCounter = 0;
const pathSeq = () => stack.map((s) => s.key).join('.');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const t = line.trim();
  if (t === '}' || t === '},' || t === ']' || t === '],') {
    const popped = stack.pop();
    if (popped && popped.type === 'arr') arrCounter = 0;
    continue;
  }
  if (t === '{' && stack.length && stack[stack.length - 1].type === 'arr') {
    const arrKey = stack[stack.length - 1].key;
    stack.push({ type: 'elem', key: `${arrKey}.${arrCounter}`, indent: 0 });
    arrCounter++;
    continue;
  }
  const objMatch = t.match(/^"([^"]+)"\s*:\s*\{\s*$/);
  const arrMatch = t.match(/^"([^"]+)"\s*:\s*\[\s*$/);
  if (objMatch) {
    stack.push({ type: 'obj', key: objMatch[1], indent: 0 });
    continue;
  }
  if (arrMatch) {
    stack.push({ type: 'arr', key: arrMatch[1], indent: 0 });
    arrCounter = 0;
    continue;
  }
  const cur = pathSeq();
  if (cur === want && t.startsWith('"cta"')) {
    console.log('FOUND at line', i + 1, '=>', JSON.stringify(t));
  }
  if (cur.includes('wwd') && t.startsWith('"cta"')) {
    console.log('  near-wwd line', i + 1, 'cur=', cur, '=>', JSON.stringify(t));
  }
}
console.log('done. want=', want);
