const fs = require('fs');
const dir = 'D:/1011-main/1011-main/1011-main/messages';
const probes = {
  es: ['días hábiles', 'días laborables', 'coste', 'costo', 'aranceles', 'aduana', 'puntualidad', 'tránsito', 'transporte', 'No.'],
  fa: ['روز کاری', 'خیر', 'نه.', 'گمرک', 'عوارض', 'ترانزیت', 'حمل'],
  cs: ['pracovních dnů', 'pracovních dní', 'celní', 'dopravce', 'přeprav', 'clo', 'Ne.'],
  ar: ['أيام عمل', 'الرسوم الجمركية', 'مدة العبور', 'الناقل', 'لا.', 'الوجهة'],
  el: ['εργάσιμες', 'τελωνειακ', 'μεταφορέα', 'δασμ', 'Όχι', 'Προορισμός'],
  de: ['Werktage', 'Zollbehörde', 'Frachtführer', 'Einfuhrabgaben', 'Pünktlichkeit', 'Nein.'],
  fr: ['jours ouvrés', 'jours ouvrables', 'douan', 'transporteur', 'ponctualité', 'Non.'],
};
for (const [loc, terms] of Object.entries(probes)) {
  const raw = fs.readFileSync(`${dir}/${loc}.json`, 'utf8');
  const out = terms.map(t => {
    const n = raw.split(t).length - 1;
    return `${t}=${n}`;
  });
  console.log(loc, '::', out.join('  '));
}
// check spacer chars used before ? and : in fr / before ? in es
const fr = fs.readFileSync(`${dir}/fr.json`, 'utf8');
console.log('fr: NBSP before ? =', fr.split('\u00A0?').length - 1, ' NNBSP before ? =', fr.split('\u202F?').length - 1, ' space before ? =', fr.split(' ?').length - 1);
const es = fs.readFileSync(`${dir}/es.json`, 'utf8');
console.log('es: inverted question marks =', es.split('¿').length - 1);
const el = fs.readFileSync(`${dir}/el.json`, 'utf8');
console.log('el: greek-questionmark(U+037E) =', el.split('\u037E').length - 1, ' ascii ; =', el.split(';').length - 1, ' ascii ? =', el.split('?').length - 1);
