const fs = require('fs');
const p = 'd:/1011-main/1011-main/1011-main/docs/I18N_DEV_GUIDE.md';
let s = fs.readFileSync(p, 'utf8');
s = s.split('pt-PT').join('pt-BR');
fs.writeFileSync(p, s, 'utf8');
console.log('doc pt-PT → pt-BR replaced');
