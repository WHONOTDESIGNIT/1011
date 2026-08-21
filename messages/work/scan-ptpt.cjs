const fs = require('fs');
const j = JSON.parse(fs.readFileSync('d:/1011-main/1011-main/1011-main/messages/pt-BR.json', 'utf8'));
const words = ['arrefecimento','ecrã','controlo','contacto','equipa','retalho','utilizador','encomenda','aspeto','percentagem','deteção','concebido','utilização','portefólio','planeamento','connosco','morada','telemóvel','acção','direcção','receção','facto','fiabilidade','logótipo','intertravamentos','conetividade','eletrónico','expetativa','perspetiva'];
let hits = 0;
const walk = (o, path) => {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (typeof v === 'string') {
      const low = v.toLowerCase();
      for (const w of words) {
        if (low.includes(w)) {
          hits++;
          console.log(w.padEnd(16), (path + '.' + k).padEnd(60), v.slice(0, 70));
        }
      }
    } else if (v && typeof v === 'object') {
      walk(v, path + '.' + k);
    }
  }
};
walk(j, '');
console.log('---');
console.log('pt-PT 残留词命中总数:', hits);
