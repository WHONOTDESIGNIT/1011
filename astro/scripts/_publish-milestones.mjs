// 一次性脚本：把 blog-0903 的 22 份 ishine-technology-milestones 源稿转为可构建的 MDX。
// 归一化 frontmatter（date→pubDate、category→枚举值、补 description/translationKey/heroImage），
// 并把 Related Reading 里的死链 /blog/ipl-compliance-iec-standards 改指 /blog/ipl-validation-services。
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');

const SRC_DIR = 'blog-0903';
const BLOG_DIR = 'src/content/blog';
const SLUG = 'ishine-technology-milestones';
const HERO = `/images/blog/blog-${SLUG}.webp`;
const HERO_ABS = join('public', HERO.replace(/^\//, ''));
const DEAD = '/blog/ipl-compliance-iec-standards';
const NEW_TARGET = '/blog/ipl-validation-services';

/** 源文件后缀 → locale 目录名 */
const LOCALES = {
  '': 'en',
  ar: 'ar',
  cs: 'cs',
  de: 'de',
  el: 'el',
  es: 'es',
  fa: 'fa',
  fr: 'fr',
  he: 'he',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  nl: 'nl',
  pl: 'pl',
  'pt-BR': 'pt-BR',
  'pt-PT': 'pt-PT',
  ro: 'ro',
  ru: 'ru',
  th: 'th',
  tr: 'tr',
  vi: 'vi',
};

/** 各语种 meta description（依据文章自身事实撰写） */
const DESCRIPTIONS = {
 en: 'Shenzhen iShine Technology, an IPL device manufacturer since July 2021: five platforms in five years, the engineering behind each, and the FDA 510(k) record.',
 ar: 'شركة شنتشن iShine Technology، مُصنّع أجهزة IPL منذ يوليو 2021: خمس منصات في خمس سنوات، والهندسة خلف كل منها، وسجل FDA 510(k).',
 cs: 'Shenzhen iShine Technology, výrobce IPL přístrojů od července 2021: pět platforem za pět let, technika za každou z nich a záznam FDA 510(k).',
 de: 'Shenzhen iShine Technology, IPL-Gerätehersteller seit Juli 2021: fünf Plattformen in fünf Jahren, die Technik dahinter und der Nachweis zu FDA 510(k).',
 el: 'Η Shenzhen iShine Technology, κατασκευαστής συσκευών IPL από τον Ιούλιο του 2021: πέντε πλατφόρμες σε πέντε χρόνια, η τεχνολογία πίσω από την καθεμία και το αρχείο FDA 510(k).',
 es: 'Shenzhen iShine Technology, fabricante de dispositivos IPL desde julio de 2021: cinco plataformas en cinco años, la ingeniería detrás de cada una y el historial de FDA 510(k).',
 fa: 'شرکت شنژن iShine Technology، تولیدکننده دستگاه‌های IPL از ژوئیه ۲۰۲۱: پنج پلتفرم در پنج سال، مهندسی پشت هر یک، و سابقه FDA 510(k).',
 fr: "Shenzhen iShine Technology, fabricant d'appareils IPL depuis juillet 2021 : cinq plateformes en cinq ans, l'ingénierie derrière chacune et le dossier FDA 510(k).",
 he: 'Shenzhen iShine Technology, יצרנית מכשירי IPL מאז יולי 2021: חמש פלטפורמות בחמש שנים, ההנדסה שמאחורי כל אחת מהן, ותיעוד FDA 510(k).',
 id: 'Shenzhen iShine Technology, produsen perangkat IPL sejak Juli 2021: lima platform dalam lima tahun, rekayasa di balik masing-masing, serta rekam FDA 510(k).',
 it: "Shenzhen iShine Technology, produttore di dispositivi IPL dal luglio 2021: cinque piattaforme in cinque anni, l'ingegneria dietro ciascuna e il record FDA 510(k).",
 ja: '2021年7月創業のIPL機器メーカー、深センiShine Technology。5年で5つのプラットフォーム、それぞれの技術、そしてFDA 510(k)の記録。',
 ko: '2021년 7월 설립된 IPL 기기 제조사 선전 iShine Technology. 5년간 5개 플랫폼, 각 플랫폼의 기술, 그리고 FDA 510(k) 기록.',
 nl: 'Shenzhen iShine Technology, fabrikant van IPL-apparaten sinds juli 2021: vijf platformen in vijf jaar, de techniek erachter en het dossier voor FDA 510(k).',
 pl: 'Shenzhen iShine Technology, producent urządzeń IPL od lipca 2021: pięć platform w pięć lat, technologia każdej z nich oraz rejestr FDA 510(k).',
 'pt-BR': 'Shenzhen iShine Technology, fabricante de dispositivos IPL desde julho de 2021: cinco plataformas em cinco anos, a engenharia por trás de cada uma e o histórico de FDA 510(k).',
 'pt-PT': 'Shenzhen iShine Technology, fabricante de dispositivos IPL desde julho de 2021: cinco plataformas em cinco anos, a engenharia por trás de cada uma e o registo de FDA 510(k).',
 ro: 'Shenzhen iShine Technology, producător de dispozitive IPL din iulie 2021: cinci platforme în cinci ani, ingineria din spatele fiecăreia și istoricul FDA 510(k).',
 ru: 'Shenzhen iShine Technology, производитель IPL-устройств с июля 2021 года: пять платформ за пять лет, инженерия каждой из них и подтверждённые FDA 510(k).',
 th: 'Shenzhen iShine Technology ผู้ผลิตอุปกรณ์ IPL ตั้งแต่กรกฎาคม 2021: ห้าแพลตฟอร์มในห้าปี วิศวกรรมเบื้องหลังแต่ละรุ่น และบันทึก FDA 510(k)',
 tr: "Temmuz 2021'den beri IPL cihazı üreten Shenzhen iShine Technology: beş yılda beş platform, her birinin arkasındaki mühendislik ve FDA 510(k) kaydı.",
 vi: 'Shenzhen iShine Technology, nhà sản xuất thiết bị IPL từ tháng 7 năm 2021: năm nền tảng trong năm năm, kỹ thuật đằng sau mỗi nền tảng và hồ sơ FDA 510(k).',
};

/** 用目标文章自己的标题前缀作为锚文本，保证各语种措辞自然 */
function anchorFor(locale) {
  const f = join(BLOG_DIR, locale, '44-ipl-validation-services.mdx');
  const src = readFileSync(f, 'utf8');
  const title = (src.match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
  return title.split(/[:：]/)[0].trim();
}

function toYamlString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

const heroReady = existsSync(HERO_ABS) || process.argv.includes('--force-hero');
if (!heroReady) console.log(`NOTE  hero image not found yet: ${HERO_ABS} (heroImage will be omitted)`);

let written = 0;
const report = [];

for (const [suffix, locale] of Object.entries(LOCALES)) {
  const srcFile = join(SRC_DIR, suffix ? `${SLUG}.${suffix}.md` : `${SLUG}.md`);
  if (!existsSync(srcFile)) {
    report.push(`MISSING SOURCE  ${srcFile}`);
    continue;
  }

  const raw = readFileSync(srcFile, 'utf8').replace(/\r\n/g, '\n');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fm) {
    report.push(`NO FRONTMATTER  ${srcFile}`);
    continue;
  }

  const get = (key) => {
    const m = fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return m ? m[1] : '';
  };

  const title = get('title');
  const author = get('author');
  const pubDate = get('date').replace(/^["']|["']$/g, '');
  const slug = get('slug').replace(/^["']|["']$/g, '');
  const primaryKeyword = get('primary_keyword');
  const url = get('url');
  const secondaryBlock = (fm[1].match(/^secondary_keywords:\n(?:[ \t]+-.*\n?)*/m) || [''])[0].trimEnd();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) report.push(`BAD DATE  ${srcFile}  (${pubDate})`);
  if (slug !== SLUG) report.push(`SLUG MISMATCH  ${srcFile}  (${slug})`);

  const head = [
    '---',
    `title: ${title}`,
    `description: ${toYamlString(DESCRIPTIONS[locale] ?? '')}`,
    `pubDate: "${pubDate}"`,
    `author: ${author}`,
    'category: "Technology"',
    ...(heroReady ? [`heroImage: "${HERO}"`] : []),
    `slug: ${toYamlString(slug)}`,
    `translationKey: ${toYamlString(SLUG)}`,
    `primary_keyword: ${primaryKeyword}`,
    ...(secondaryBlock ? [secondaryBlock] : []),
    `url: ${url}`,
    '---',
    '',
  ].join('\n');

  let body = raw.slice(fm[0].length);

  const deadHits = body.split(`](${DEAD})`).length - 1;
  if (deadHits !== 1) report.push(`DEADLINK COUNT  ${srcFile}  (${deadHits})`);
  if (deadHits > 0) {
    const anchor = anchorFor(locale);
    body = body.replace(new RegExp(`\\[[^\\]]*\\]\\(${DEAD.replace(/\//g, '\\/')}\\)`, 'g'), `[${anchor}](${NEW_TARGET})`);
    report.push(`RE-LINK  ${locale.padEnd(6)} -> ${anchor}`);
  }

  const outFile = join(BLOG_DIR, locale, `${SLUG}.mdx`);
  if (!DRY) writeFileSync(outFile, head + body, 'utf8');
  written++;
  if (DRY && (locale === 'en' || locale === 'ja')) {
    report.push(`\n----- ${locale} preview -----\n${head}${body.slice(0, 400)}`);
  }
}

console.log(report.join('\n'));
console.log(`\n${DRY ? 'DRY RUN' : 'WRITTEN'}  locales: ${written}  heroImage: ${heroReady ? 'included' : 'omitted'}`);
console.log(`blog dirs scanned: ${readdirSync(BLOG_DIR).length}`);

if (process.argv.includes('--verify')) {
  const REQUIRED = [
    'description:',
    'pubDate: "2026-09-02"',
    'author:',
    'category: "Technology"',
    'heroImage: "/images/blog/blog-ishine-technology-milestones.webp"',
    'slug: "ishine-technology-milestones"',
    'translationKey: "ishine-technology-milestones"',
    'primary_keyword:',
    'url:',
  ];
  const problems = [];
  const links = new Map();
  let ok = 0;
  for (const locale of readdirSync(BLOG_DIR)) {
    const f = join(BLOG_DIR, locale, `${SLUG}.mdx`);
    if (!existsSync(f)) {
      problems.push(`MISSING ${locale}`);
      continue;
    }
    const s = readFileSync(f, 'utf8');
    for (const need of REQUIRED) if (!s.includes(need)) problems.push(`${locale} lacks ${need}`);
    if (s.includes(DEAD)) problems.push(`${locale} still contains ${DEAD}`);
    if (/\]\(\/(ar|cs|de|el|es|fa|fr|he|id|it|ja|ko|nl|pl|pt-BR|pt-PT|ro|ru|th|tr|vi|en)\//.test(s)) {
      problems.push(`${locale} has a locale-prefixed link`);
    }
    for (const m of s.matchAll(/\]\((\/[^)\s]*)\)/g)) links.set(m[1], (links.get(m[1]) || 0) + 1);
    ok++;
  }
  console.log(`\n=== VERIFY ===\nfiles checked: ${ok}\nproblems: ${problems.length ? problems.join(' | ') : 'none'}`);
  for (const [k, v] of [...links].sort()) console.log(`  ${k}  x${v}`);
}
