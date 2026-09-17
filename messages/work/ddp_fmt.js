const fs = require('fs');
const DIR = 'D:/1011-main/1011-main/1011-main/messages';
const EN = Object.keys(JSON.parse(fs.readFileSync(`${DIR}/en.json`, 'utf8')).servicesPage.ddpShipping);
for (const loc of ['ar', 'cs', 'de', 'el', 'es', 'fa', 'fr']) {
  const raw = fs.readFileSync(`${DIR}/${loc}.json`, 'utf8');
  const b = JSON.parse(raw).servicesPage.ddpShipping;
  const joined = EN.map(k => b[k]).join('\n');
  const flags = [];
  flags.push(`trailingWS=${EN.filter(k => /\s$/.test(b[k])).length}`);
  flags.push(`asciiQ=${(joined.match(/\?/g) || []).length}`);
  flags.push(`semiQ=${(joined.match(/;/g) || []).length}`);
  flags.push(`invQ=${(joined.match(/¿/g) || []).length}`);
  flags.push(`nnbsp=${(joined.match(/\u202F/g) || []).length}`);
  flags.push(`zwnj=${(joined.match(/\u200C/g) || []).length}`);
  flags.push(`endsWithNewline=${raw.endsWith('\n')}`);
  flags.push(`bytes=${raw.length}`);
  console.log(loc.padEnd(3), flags.join('  '));
}
// dump every locale's block for eyeball review
for (const loc of ['ar', 'cs', 'de', 'el', 'es', 'fa', 'fr']) {
  const raw = fs.readFileSync(`${DIR}/${loc}.json`, 'utf8');
  const i = raw.indexOf('"ddpShipping"');
  const s = raw.lastIndexOf('\n', i - 1) + 1;
  const e = raw.indexOf('\n    },', i) + 1;
  console.log(`\n---------- ${loc}.json ----------`);
  console.log(raw.slice(s, e));
}
