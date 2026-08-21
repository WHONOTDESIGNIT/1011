const fs = require('fs');
const a = fs.readFileSync('messages/tr.json', 'utf8').split('\n');
const b = fs.readFileSync('messages/tr.json.bak-20260818-172833', 'utf8').split('\n');
console.log('CUR lines:', a.length, 'BAK lines:', b.length);
const diffs = [];
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) diffs.push(i + 1);
}
console.log('total diff lines:', diffs.length);
console.log('FIRST 12:', diffs.slice(0, 12).join(','));
for (const i of diffs.slice(0, 12)) {
  console.log('L' + i, 'CUR:', JSON.stringify((a[i - 1] || '').trim().slice(0, 90)), '| BAK:', JSON.stringify((b[i - 1] || '').trim().slice(0, 90)));
}
