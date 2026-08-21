const fs = require('fs');
const path = require('path');
const text = fs.readFileSync(path.join(__dirname, '..', 'tr.json'), 'utf8');
const lines = text.split('\n');
// 打印几种典型行及其 trim 后结果与 charCode
const samples = [lines[0], lines[612], lines[613], lines[618], lines[619], lines[625], lines[626]];
for (const s of samples) {
  const trimmed = s.trim();
  console.log(JSON.stringify(s.slice(0, 60)), '=> trim:', JSON.stringify(trimmed.slice(0, 30)), '| endsWithCR:', s.endsWith('\r'));
}
console.log('total lines:', lines.length);
