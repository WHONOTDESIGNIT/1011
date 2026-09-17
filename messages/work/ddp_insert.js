/**
 * Insert servicesPage.ddpShipping (14 keys) into 7 locale files.
 * - key names copied verbatim from en.json
 * - respects existing 2-space indent / LF EOL / no BOM
 * - validates JSON + verifies no other byte of the file changed
 * Run: node ddp_insert.js
 */
const fs = require('fs');
const path = require('path');

const DIR = 'D:/1011-main/1011-main/1011-main/messages';
const LOCALES = ['ar', 'cs', 'de', 'el', 'es', 'fa', 'fr'];
const NNBSP = '\u202F'; // French narrow no-break space (before ? : ! in this repo)

// English reference: key order + placeholder audit
const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8'));
const EN = en.servicesPage.ddpShipping;
const EN_KEYS = Object.keys(EN);
if (EN_KEYS.length !== 14) throw new Error(`expected 14 en keys, got ${EN_KEYS.length}`);
for (const [k, v] of Object.entries(EN)) {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`en key ${k} empty`);
  if (/\{[^}]*\}/.test(v)) throw new Error(`en key ${k} contains a placeholder: ${v}`);
}
console.log('en.json ddpShipping keys =', EN_KEYS.length, '| placeholders = none');

const T = {
  ar: {
    heading: 'أسعار الشحن DDP',
    intro: 'شحن DDP (شامل الرسوم والضرائب) للوحدة الواحدة إلى الأسواق أدناه. السعر المعروض هو الإجمالي لكل وحدة ويشمل الرسوم الجمركية والضرائب، لذا لا يدفع المستلم أي مبلغ عند التسليم.',
    colMarket: 'الوجهة',
    colRate: 'سعر DDP (دولار أمريكي)',
    colDays: 'مدة العبور',
    colOnTime: 'نسبة التسليم في الوقت المحدد',
    daysUnit: 'أيام عمل',
    unsupportedHeading: 'أسواق لا تتوفر فيها خدمة DDP',
    unsupportedNote: 'لا يغطي أي ناقل DDP هذه الأسواق حتى الآن.',
    note: 'الأسعار لكل وحدة وتُحدَّث دوريًا. اطلبوا منا عرض سعر محدثًا لكميتكم.',
    faqSpeedQuestion: 'هل يمكن أن يكون الشحن DDP أسرع؟',
    faqSpeedAnswer: 'لا. هذه أسرع خدمة DDP متاحة لنا. هناك شركات شحن أسرع، لكن المستلم عندئذٍ يتحمل رسوم الاستيراد والضرائب، ويُحدد السعر الدقيق من قبل سلطة الجمارك المحلية أو الحكومة.',
    faqCostQuestion: 'هل يمكن أن يكون الشحن DDP أرخص؟',
    faqCostAnswer: 'لا. هذه أرخص خدمة DDP يمكننا تقديمها. لا تتوفر الخيارات الأرخص إلا كخدمات غير DDP، يتحمل فيها المستلم تكلفة الرسوم والضرائب.',
  },
  cs: {
    heading: 'Sazby přepravy DDP',
    intro: 'Přeprava DDP (cla a daně v ceně) po jednotlivých kusech do níže uvedených trhů. Uvedená sazba je celková cena za kus a zahrnuje cla a daně, takže příjemce při dodání nic neplatí.',
    colMarket: 'Destinace',
    colRate: 'Sazba DDP (USD)',
    colDays: 'Doba přepravy',
    colOnTime: 'Podíl včasných dodávek',
    daysUnit: 'pracovních dnů',
    unsupportedHeading: 'Trhy bez služby DDP',
    unsupportedNote: 'Tyto trhy zatím nepokrývá žádný přepravce DDP.',
    note: 'Sazby platí za kus a jsou pravidelně aktualizovány. Požádejte nás o aktuální nabídku pro váš objem.',
    faqSpeedQuestion: 'Může být přeprava DDP rychlejší?',
    faqSpeedAnswer: 'Ne. Toto je nejrychlejší služba DDP, kterou máme k dispozici. Jiní přepravci jsou rychlejší, ale příjemce pak musí zaplatit dovozní cla a daně a přesnou sazbu stanovuje místní celní úřad nebo vláda.',
    faqCostQuestion: 'Může být přeprava DDP levnější?',
    faqCostAnswer: 'Ne. Toto je nejlevnější služba DDP, kterou můžeme nabídnout. Levnější možnosti existují pouze jako služby bez DDP, u nichž náklady na clo a daně nese příjemce.',
  },
  de: {
    heading: 'DDP-Versandtarife',
    intro: 'DDP-Versand (verzollt und versteuert) pro Einzelstück in die unten aufgeführten Märkte. Der angegebene Tarif ist der Gesamtpreis pro Stück und enthält Zölle und Steuern – der Empfänger zahlt bei der Lieferung nichts.',
    colMarket: 'Zielmarkt',
    colRate: 'DDP-Tarif (USD)',
    colDays: 'Transportzeit',
    colOnTime: 'Pünktlichkeitsrate',
    daysUnit: 'Werktage',
    unsupportedHeading: 'Märkte ohne DDP-Service',
    unsupportedNote: 'Für diese Märkte gibt es noch keinen DDP-Versanddienstleister.',
    note: 'Die Tarife gelten pro Stück und werden regelmäßig aktualisiert. Fragen Sie uns nach einem aktuellen Angebot für Ihre Menge.',
    faqSpeedQuestion: 'Kann der DDP-Versand schneller sein?',
    faqSpeedAnswer: 'Nein. Das ist der schnellste DDP-Service, der uns zur Verfügung steht. Andere Dienstleister sind schneller, doch dann muss der Empfänger Einfuhrabgaben und Steuern zahlen, und die genaue Höhe legt die örtliche Zollbehörde oder Regierung fest.',
    faqCostQuestion: 'Kann der DDP-Versand günstiger sein?',
    faqCostAnswer: 'Nein. Das ist der günstigste DDP-Service, den wir anbieten können. Günstigere Optionen gibt es nur als Nicht-DDP-Services, bei denen der Empfänger die Kosten für Zoll und Steuern trägt.',
  },
  el: {
    heading: 'Τιμές αποστολής DDP',
    intro: 'Αποστολή DDP (με δασμούς και φόρους) ανά τεμάχιο προς τις παρακάτω αγορές. Η τιμή που εμφανίζεται είναι το σύνολο ανά τεμάχιο και περιλαμβάνει δασμούς και φόρους, ώστε ο παραλήπτης να μην πληρώνει τίποτα κατά την παράδοση.',
    colMarket: 'Προορισμός',
    colRate: 'Τιμή DDP (USD)',
    colDays: 'Χρόνος μεταφοράς',
    colOnTime: 'Ποσοστό έγκαιρων παραδόσεων',
    daysUnit: 'εργάσιμες ημέρες',
    unsupportedHeading: 'Αγορές χωρίς υπηρεσία DDP',
    unsupportedNote: 'Κανένας πάροχος υπηρεσιών DDP δεν καλύπτει ακόμη αυτές τις αγορές.',
    note: 'Οι τιμές ισχύουν ανά τεμάχιο και ενημερώνονται περιοδικά. Ζητήστε μας τρέχουσα προσφορά για τον όγκο σας.',
    faqSpeedQuestion: 'Μπορεί η αποστολή DDP να είναι ταχύτερη;',
    faqSpeedAnswer: 'Όχι. Αυτή είναι η ταχύτερη υπηρεσία DDP που έχουμε διαθέσιμη. Άλλοι πάροχοι είναι ταχύτεροι, αλλά τότε ο παραλήπτης πρέπει να πληρώσει δασμούς και φόρους εισαγωγής και το ακριβές ποσό καθορίζεται από την τοπική τελωνειακή αρχή ή την κυβέρνηση.',
    faqCostQuestion: 'Μπορεί η αποστολή DDP να είναι φθηνότερη;',
    faqCostAnswer: 'Όχι. Αυτή είναι η φθηνότερη υπηρεσία DDP που μπορούμε να προσφέρουμε. Φθηνότερες επιλογές υπάρχουν μόνο ως υπηρεσίες χωρίς DDP, όπου ο παραλήπτης επιβαρύνεται με το κόστος δασμών και φόρων.',
  },
  es: {
    heading: 'Tarifas de envío DDP',
    intro: 'Envío DDP (con derechos e impuestos incluidos) por unidad a los mercados indicados abajo. La tarifa mostrada es el total por unidad e incluye aranceles e impuestos, así que el destinatario no paga nada en la entrega.',
    colMarket: 'Destino',
    colRate: 'Tarifa DDP (USD)',
    colDays: 'Tiempo de tránsito',
    colOnTime: 'Tasa de puntualidad',
    daysUnit: 'días laborables',
    unsupportedHeading: 'Mercados sin servicio DDP',
    unsupportedNote: 'Ningún transportista DDP cubre estos mercados todavía.',
    note: 'Las tarifas son por unidad y se actualizan periódicamente. Pídanos una cotización actual para su volumen.',
    faqSpeedQuestion: '¿El envío DDP puede ser más rápido?',
    faqSpeedAnswer: 'No. Este es el servicio DDP más rápido del que disponemos. Otros transportistas son más rápidos, pero entonces el destinatario debe pagar los aranceles e impuestos de importación, y la tarifa exacta la fija la autoridad aduanera local o el gobierno.',
    faqCostQuestion: '¿El envío DDP puede ser más barato?',
    faqCostAnswer: 'No. Este es el servicio DDP más económico que podemos ofrecer. Las opciones más baratas solo existen como servicios no DDP, en los que el destinatario asume el coste de derechos e impuestos.',
  },
  fa: {
    heading: 'نرخ‌های ارسال DDP',
    intro: 'ارسال DDP (با احتساب عوارض و مالیات) برای هر واحد به بازارهای زیر. نرخ نشان‌داده‌شده مجموع هزینه هر واحد است و عوارض و مالیات را در بر می‌گیرد، بنابراین گیرنده در زمان تحویل هزینه‌ای پرداخت نمی‌کند.',
    colMarket: 'مقصد',
    colRate: 'نرخ DDP (دلار آمریکا)',
    colDays: 'زمان ترانزیت',
    colOnTime: 'نرخ تحویل به‌موقع',
    daysUnit: 'روز کاری',
    unsupportedHeading: 'بازارهای بدون سرویس DDP',
    unsupportedNote: 'هنوز هیچ شرکت حمل‌ونقل DDP این بازارها را پوشش نمی‌دهد.',
    note: 'نرخ‌ها برای هر واحد است و به‌طور دوره‌ای به‌روزرسانی می‌شود. برای دریافت قیمت به‌روز بر اساس حجم سفارش خود با ما تماس بگیرید.',
    faqSpeedQuestion: 'آیا ارسال DDP می‌تواند سریع‌تر باشد؟',
    faqSpeedAnswer: 'خیر. این سریع‌ترین سرویس DDP است که در اختیار ما قرار دارد. شرکت‌های حمل دیگر سریع‌تر هستند، اما در آن صورت گیرنده باید عوارض و مالیات واردات را بپردازد و نرخ دقیق آن توسط گمرک محلی یا دولت تعیین می‌شود.',
    faqCostQuestion: 'آیا ارسال DDP می‌تواند ارزان‌تر باشد؟',
    faqCostAnswer: 'خیر. این ارزان‌ترین سرویس DDP است که می‌توانیم ارائه دهیم. گزینه‌های ارزان‌تر فقط به‌صورت سرویس‌های غیر DDP وجود دارند که در آن‌ها هزینه عوارض و مالیات بر عهده گیرنده است.',
  },
  fr: {
    heading: "Tarifs d'expédition DDP",
    intro: `Expédition DDP (droits et taxes inclus) à l'unité vers les marchés ci-dessous. Le tarif indiqué correspond au total par unité, droits et taxes compris${NNBSP}: le destinataire ne paie rien à la livraison.`,
    colMarket: 'Destination',
    colRate: 'Tarif DDP (USD)',
    colDays: 'Délai de transport',
    colOnTime: 'Taux de ponctualité',
    daysUnit: 'jours ouvrés',
    unsupportedHeading: 'Marchés sans service DDP',
    unsupportedNote: 'Aucun transporteur DDP ne dessert encore ces marchés.',
    note: 'Les tarifs sont par unité et mis à jour périodiquement. Demandez-nous un devis à jour pour votre volume.',
    faqSpeedQuestion: `L'expédition DDP peut-elle être plus rapide${NNBSP}?`,
    faqSpeedAnswer: `Non. C'est le service DDP le plus rapide dont nous disposons. D'autres transporteurs sont plus rapides, mais le destinataire doit alors payer les droits d'importation et les taxes, et le montant exact est fixé par l'administration douanière locale ou le gouvernement.`,
    faqCostQuestion: `L'expédition DDP peut-elle être moins chère${NNBSP}?`,
    faqCostAnswer: "Non. C'est le service DDP le moins cher que nous puissions proposer. Les options moins chères n'existent qu'en services non DDP, où le destinataire supporte le coût des droits et des taxes.",
  },
};

// ---- helpers -------------------------------------------------------------
function findServicesPage(raw, file) {
  const needle = '"servicesPage"';
  const first = raw.indexOf(needle);
  if (first < 0) throw new Error(`${file}: servicesPage not found`);
  if (raw.indexOf(needle, first + 1) !== -1) throw new Error(`${file}: servicesPage appears more than once`);
  const brace = raw.indexOf('{', first);
  if (brace < 0) throw new Error(`${file}: no '{' after servicesPage`);
  // brace matching, skipping string literals
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = brace; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error(`${file}: unbalanced braces for servicesPage`);
  const lineStart = raw.lastIndexOf('\n', first - 1) + 1;
  const indent = first - lineStart;           // 2 in every file checked
  return { brace, end, indent };
}

const norm = (s) => s.replace(/\u202F/g, ' ');
let ok = 0;

for (const loc of LOCALES) {
  const file = path.join(DIR, `${loc}.json`);
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) throw new Error(`${loc}.json has a BOM`);
  if (raw.includes('\r')) throw new Error(`${loc}.json contains CR — unexpected EOL style`);
  if (raw.includes('"ddpShipping"')) throw new Error(`${loc}.json already has ddpShipping`);

  const before = JSON.parse(raw);
  if (!before.servicesPage) throw new Error(`${loc}.json has no servicesPage object`);

  const { brace, indent } = findServicesPage(raw, `${loc}.json`);
  const keyIndent = ' '.repeat(indent + 2);
  const valIndent = ' '.repeat(indent + 4);

  // first non-space char after '{' must be a quote (non-empty object)
  const after = raw.slice(brace + 1).match(/^(\s*)"/);
  if (!after) throw new Error(`${loc}.json: servicesPage has no existing keys`);

  const tr = T[loc];
  const trKeys = Object.keys(tr);
  if (trKeys.length !== EN_KEYS.length) throw new Error(`${loc}: ${trKeys.length} keys, expected 14`);
  for (const k of EN_KEYS) {
    if (!(k in tr)) throw new Error(`${loc}: missing key ${k}`);
    if (typeof tr[k] !== 'string' || !tr[k].trim()) throw new Error(`${loc}: empty value for ${k}`);
  }
  for (const k of trKeys) if (!EN_KEYS.includes(k)) throw new Error(`${loc}: extra key ${k}`);

  const lines = [`${keyIndent}"ddpShipping": {`];
  EN_KEYS.forEach((k, i) => {
    const comma = i === EN_KEYS.length - 1 ? '' : ',';
    lines.push(`${valIndent}${JSON.stringify(k)}: ${JSON.stringify(tr[k])}${comma}`);
  });
  lines.push(`${keyIndent}}`);

  const insert = '\n' + lines.join('\n') + ',';
  const out = raw.slice(0, brace + 1) + insert + raw.slice(brace + 1);

  // ---- validate ---------------------------------------------------------
  let parsed;
  try { parsed = JSON.parse(out); } catch (e) { throw new Error(`${loc}.json: result is invalid JSON — ${e.message}`); }
  const now = parsed.servicesPage.ddpShipping;
  if (!now || Object.keys(now).length !== 14) throw new Error(`${loc}: inserted object wrong size`);
  for (const k of EN_KEYS) {
    if (now[k] !== tr[k]) throw new Error(`${loc}: value mismatch for ${k}`);
  }
  // every other part of the file must be untouched
  const beforeRest = JSON.stringify({ ...before, servicesPage: { ...before.servicesPage, ddpShipping: undefined } });
  const afterRest = JSON.stringify({ ...parsed, servicesPage: { ...parsed.servicesPage, ddpShipping: undefined } });
  if (beforeRest !== afterRest) throw new Error(`${loc}: unrelated content changed`);
  // text-level proof: removing exactly our inserted slice restores the original bytes
  const roundTrip = out.slice(0, brace + 1) + out.slice(brace + 1 + insert.length);
  if (roundTrip !== raw) throw new Error(`${loc}: byte round-trip failed`);

  fs.writeFileSync(file, out, 'utf8');
  ok++;
  console.log(`patched ${loc}.json  (+${insert.split('\n').length - 1} lines, indent=${indent}, 14/14 keys, JSON valid, rest byte-identical)`);
}
console.log(`\nDONE: ${ok}/${LOCALES.length} locale files patched.`);
