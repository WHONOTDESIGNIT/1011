const fs = require('fs');
const path = require('path');

function trace(file, pathParts) {
  const text = fs.readFileSync(file, 'utf8');
  console.log('hasCR:', text.includes('\r'), '| file:', path.basename(file));
  const lines = text.split('\n');
  const stack = [];
  let arrCounter = 0;
  const pathSeq = () => stack.map((s) => (s.type === 'elem' ? String(s.idx) : s.key)).join('.');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (t === '}' || t === '},' || t === '],') {
      const popped = stack.pop();
      if (popped && popped.type === 'arr') arrCounter = 0;
      continue;
    }
    if (t === '{' && stack.length && stack[stack.length - 1].type === 'arr') {
      stack.push({ type: 'elem', idx: arrCounter++, key: String(arrCounter - 1) });
      continue;
    }
    const objMatch = t.match(/^"([^"]+)"\s*:\s*\{\s*$/);
    const arrMatch = t.match(/^"([^"]+)"\s*:\s*\[\s*$/);
    if (objMatch) {
      stack.push({ type: 'obj', key: objMatch[1] });
      continue;
    }
    if (arrMatch) {
      stack.push({ type: 'arr', key: arrMatch[1] });
      arrCounter = 0;
      continue;
    }
    const cur = pathSeq();
    const want = pathParts.slice(0, -1).join('.');
    if (cur === want && t.startsWith('"cta"')) {
      console.log('  FOUND at line', i + 1, ':', JSON.stringify(t));
    }
    if (i < 3) console.log('  line', i + 1, 'stack=', JSON.stringify(cur), 'raw=', JSON.stringify(t.slice(0, 40)));
  }
  console.log('  done. final stack:', JSON.stringify(stack.map((s) => s.key)));
}

trace(path.join(__dirname, '..', 'tr.json'), ['homepage', 'whatWeDo', 'item1', 'cta']);
trace(path.join(__dirname, '..', 'work', 'it', 'split', 'extract_it_part04.json'), ['homepage', 'whatWeDo', 'item1', 'cta']);
