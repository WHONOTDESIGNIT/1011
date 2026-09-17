/**
 * Read-back verification for servicesPage.ddpShipping in 7 locale files.
 * Independently re-reads each file from disk and asserts:
 *  - 14 key names, exactly matching en.json (no extra, no missing)
 *  - every value is a non-empty string
 *  - no English residue (identical-to-English values flagged for review)
 *  - no placeholders, no forbidden terms (ISO 13485 / MDSAP / TGA)
 *  - no country names introduced
 *  - file integrity: LF-only, no BOM, valid JSON, servicesPage still present, +16 lines
 */
const fs = require('fs');
const DIR = 'D:/1011-main/1011-main/1011-main/messages';
const LOCALES = ['ar', 'cs', 'de', 'el', 'es', 'fa', 'fr'];
const EN_KEYS = Object.keys(JSON.parse(fs.readFileSync(`${DIR}/en.json`, 'utf8')).servicesPage.ddpShipping);

const FORBIDDEN = ['ISO 13485', 'MDSAP', 'TGA', 'ISO13485'];
const COUNTRIES = ['Germany', 'China', 'United States', 'USA', 'France', 'Spain', 'Greece', 'Czech', 'Iran',
  'Deutschland', 'Frankreich', 'Spanien', 'China', 'USA', 'Frankreich',
  'Allemagne', 'Chine', 'États-Unis', 'Espagne', 'Grèce', 'Tchéquie', 'Iran',
  'ألمانيا', 'الصين', 'الولايات المتحدة', 'فرنسا', 'إسبانيا', 'اليونان', 'إيران', 'أمريكي', 'أمريكية',
  'آلمان', 'چین', 'آمریکا', 'فرانسه', 'اسپانیا', 'یونان', 'ایران'];
const LATIN_ONLY_EXPECTED = { ar: false, fa: false, el: false, cs: true, de: true, es: true, fr: true };

const en = JSON.parse(fs.readFileSync(`${DIR}/en.json`, 'utf8')).servicesPage.ddpShipping;
const enLines = fs.readFileSync(`${DIR}/en.json`, 'utf8').split('\n').length;

let allPass = true;
const summary = [];

for (const loc of LOCALES) {
  const p = `${DIR}/${loc}.json`;
  const raw = fs.readFileSync(p, 'utf8');
  const errs = [], notes = [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { errs.push(`invalid JSON: ${e.message}`); }
  const block = parsed && parsed.servicesPage && parsed.servicesPage.ddpShipping;

  if (!parsed || !parsed.servicesPage) errs.push('servicesPage missing');
  if (!block) errs.push('ddpShipping missing');

  if (block) {
    const keys = Object.keys(block);
    if (keys.length !== 14) errs.push(`key count = ${keys.length} (expected 14)`);
    const missing = EN_KEYS.filter(k => !(k in block));
    const extra = keys.filter(k => !EN_KEYS.includes(k));
    if (missing.length) errs.push(`missing keys: ${missing.join(', ')}`);
    if (extra.length) errs.push(`extra keys: ${extra.join(', ')}`);
    if (JSON.stringify(keys) !== JSON.stringify(EN_KEYS)) notes.push('key order differs from en.json (order not required)');

    for (const k of EN_KEYS) {
      const v = block[k];
      if (typeof v !== 'string') { errs.push(`${k}: not a string`); continue; }
      if (!v.trim()) errs.push(`${k}: empty`);
      if (v !== v.trim()) errs.push(`${k}: stray leading/trailing whitespace`);
      if (/\{[^}]*\}/.test(v)) errs.push(`${k}: contains a {...} placeholder`);
      for (const f of FORBIDDEN) if (v.includes(f)) errs.push(`${k}: forbidden term "${f}"`);
      for (const c of COUNTRIES) if (v.includes(c)) errs.push(`${k}: country name "${c}" introduced`);
      if (v === en[k]) notes.push(`${k}: identical to English ("${v}") — verify it is a real word in this language`);
      if (!LATIN_ONLY_EXPECTED[loc] && /^[\x00-\x7F]*$/.test(v)) errs.push(`${k}: pure ASCII — likely untranslated`);
    }
    if (!LATIN_ONLY_EXPECTED[loc]) {
      const nonLatin = EN_KEYS.filter(k => /[^\x00-\x7F]/.test(block[k])).length;
      if (nonLatin < 14) notes.push(`only ${nonLatin}/14 values use non-Latin script`);
    }
  }

  // structural / style integrity
  const crlf = (raw.match(/\r\n/g) || []).length;
  const bareLf = (raw.match(/(?<!\r)\n/g) || []).length;
  if (crlf) errs.push(`file contains ${crlf} CRLF sequences (should be LF-only)`);
  if (raw.charCodeAt(0) === 0xFEFF) errs.push('file has a BOM');
  const lineDelta = raw.split('\n').length - enLines;
  if (lineDelta !== 16) notes.push(`line count differs from en.json by ${lineDelta} (16 expected if structures match)`);
  const idx = raw.indexOf('"ddpShipping"');
  const lineStart = raw.lastIndexOf('\n', idx - 1) + 1;
  const indent = raw.slice(lineStart, idx).length;
  if (indent !== 4) errs.push(`ddpShipping key indentation = ${indent}, expected 4`);
  const nlAfterKey = raw.indexOf('\n', idx);
  const child = raw.slice(nlAfterKey + 1).match(/^( +)"heading":/);
  if (!child) errs.push('child block does not start with a "heading" key');
  else if (child[1].length !== 6) errs.push(`child key indentation = ${child[1].length}, expected 6`);

  const status = errs.length ? 'FAIL' : 'PASS';
  if (errs.length) allPass = false;
  summary.push({ loc, status, size: raw.length, errs, notes });
}

for (const s of summary) {
  console.log(`\n=== ${s.loc}.json : ${s.status} (${s.size} bytes) ===`);
  for (const e of s.errs) console.log('  ERR  ' + e);
  for (const n of s.notes) console.log('  note ' + n);
}
console.log('\n--- key presence matrix (14 keys x 7 locales) ---');
const rows = LOCALES.map(loc => {
  const b = JSON.parse(fs.readFileSync(`${DIR}/${loc}.json`, 'utf8')).servicesPage.ddpShipping;
  const present = EN_KEYS.filter(k => typeof b[k] === 'string' && b[k].trim()).length;
  return `${loc}: ${present}/14  ${present === 14 ? 'OK' : 'MISSING'}`;
});
console.log(rows.join('\n'));
console.log(`\nOVERALL: ${allPass ? 'ALL PASS' : 'FAILURES PRESENT'} (${LOCALES.length} locales)`);
