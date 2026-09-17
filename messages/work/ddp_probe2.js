const fs = require('fs');
const dir = 'D:/1011-main/1011-main/1011-main/messages';
const probes = {
  ar: ['مدة الشحن', 'مدة النقل', 'في الوقت المحدد', 'وقت التسليم', 'شركة شحن', 'الشحن السريع', 'موعد التسليم'],
  el: ['πάροχος', 'πάροχοι', 'εταιρείες', 'χρόνος παράδοσης', 'έγκαιρ', 'μεταφοράς', 'Τιμές', 'αποστολής'],
  de: ['Transportzeit', 'Laufzeit', 'Zielmarkt', 'Bestimmungsort', 'Versanddienstleister', 'Dienstleister', 'Versandtarife', 'Zielland'],
  fa: ['زمان ترانزیت', 'مدت حمل', 'به موقع', 'شرکت حمل', 'پوشش', 'نرخ ارسال', 'مقصد'],
  fr: ['délai de transport', "délai d'acheminement", 'Destinataire', 'transporteurs', 'service non DDP', 'transit'],
  cs: ['přepravce', 'Přepravní doba', 'Doba přepravy', 'včasných', 'dodávek', 'Cílový trh', 'Destinace'],
  es: ['plazo de tránsito', 'Tiempo de tránsito', 'transportista', 'entregas puntuales', 'tasa de puntualidad', 'mercados', 'destino'],
};
for (const [loc, terms] of Object.entries(probes)) {
  const raw = fs.readFileSync(`${dir}/${loc}.json`, 'utf8');
  console.log(loc, '::', terms.map(t => `${t}=${raw.split(t).length - 1}`).join('  '));
}
const els = fs.readFileSync(`${dir}/el.json`, 'utf8');
console.log('el question marks -> U+037E:', els.split('\u037E').length - 1, 'ascii;:', els.split(';').length - 1, 'ascii?:', els.split('?').length - 1);
const frs = fs.readFileSync(`${dir}/fr.json`, 'utf8');
console.log('fr before ?: NNBSP', frs.split('\u202F?').length - 1, 'plain', frs.split(' ?').length - 1);
console.log('fr before !: NNBSP', frs.split('\u202F!').length - 1, 'plain', frs.split(' !').length - 1);
console.log('fr before :: NNBSP', frs.split('\u202F:').length - 1, 'plain', frs.split(' :').length - 1);
