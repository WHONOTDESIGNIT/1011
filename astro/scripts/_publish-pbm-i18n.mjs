// 一次性脚本：把 _pbm_i18n/ 的 8 份 PBM 译稿转为可构建 MDX 并写入 src/content/blog/<locale>/。
// 源稿格式 =「frontmatter（无 faqs/url）+ 正文 + 正文中部 FAQ 段（## 标题 + **问题** 粗体问答）」。
// 处理：category Photobiomodulation → Science、补 url、正文 FAQ 段抽成 frontmatter faqs 并从正文删除。
// 用法：node scripts/_publish-pbm-i18n.mjs [--dry] [--verify]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const VERIFY = process.argv.includes('--verify');

const SRC_DIR = 'D:\\001-IPL资料库-说明书-证书\\MD-PRODUCTS-INFOS\\_pbm_i18n';
const BLOG_DIR = 'src/content/blog';
const SLUG = 'pulsed-vs-continuous-wave-pbm-parameters';
const TRANSLATION_KEY = SLUG;
const CATEGORY = 'Science';
const CATEGORY_FROM = 'Photobiomodulation';
const URL = `https://iplmanufacturer.com/blog/${SLUG}`;
const LOCALES = ['ar', 'es', 'fa', 'fr', 'he', 'ro', 'ru', 'tr'];

const yamlStr = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function splitFrontmatter(src) {
  const lines = src.split(/\r?\n/);
  if (lines[0].trim() !== '---') throw new Error('缺少 frontmatter 起始 ---');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('缺少 frontmatter 结束 ---');
  return { head: lines.slice(1, end), body: lines.slice(end + 1) };
}

function parseBody(body) {
  while (body.length && body[0].trim() === '') body.shift();

  // FAQ 段：某个 ## 标题的下一非空行是纯粗体行（**问题**）
  let faqStart = -1;
  let faqEnd = body.length;
  for (let i = 0; i < body.length; i++) {
    if (!/^##\s+/.test(body[i])) continue;
    let j = i + 1;
    while (j < body.length && body[j].trim() === '') j++;
    if (j < body.length && /^\*\*.+\*\*$/.test(body[j].trim())) {
      faqStart = i;
      break;
    }
  }

  const faqs = [];
  if (faqStart >= 0) {
    for (let k = faqStart + 1; k < body.length; k++) {
      if (/^##\s+/.test(body[k])) {
        faqEnd = k;
        break;
      }
    }
    let cur = null;
    for (const raw of body.slice(faqStart + 1, faqEnd)) {
      const t = raw.trim();
      const m = t.match(/^\*\*(.+)\*\*$/);
      if (m) {
        if (cur) faqs.push(cur);
        cur = { question: m[1].trim(), parts: [] };
      } else if (cur && t) {
        cur.parts.push(t);
      }
    }
    if (cur) faqs.push(cur);
    faqs.forEach((f) => {
      f.answer = f.parts.join(' ').replace(/\s+/g, ' ').trim();
      delete f.parts;
    });
  }

  const cleanBody = faqStart >= 0 ? [...body.slice(0, faqStart), ...body.slice(faqEnd)] : body;
  return { faqs, body: cleanBody };
}

function buildMdx(head, faqs, body) {
  const out = [];
  let sawUrl = false;
  for (const line of head) {
    if (/^category:\s*/.test(line)) {
      out.push(`category: ${yamlStr(CATEGORY)}`);
      continue;
    }
    if (/^url:\s*/.test(line)) continue;
    out.push(line);
    if (/^readTime:\s*/.test(line)) {
      out.push(`url: ${URL}`);
      sawUrl = true;
    }
  }
  if (!sawUrl) out.push(`url: ${URL}`);
  if (faqs.length) {
    out.push('faqs:');
    for (const f of faqs) {
      out.push(`  - question: ${yamlStr(f.question)}`);
      out.push(`    answer: ${yamlStr(f.answer)}`);
    }
  }
  const bodyText = body.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
  return `---\n${out.join('\n')}\n---\n\n${bodyText}\n`;
}

// ---------------------------------------------------------------- verify

const LOCALE_PREFIX_RE =
  /\]\((\/(?:ar|cs|de|el|es|fa|fr|he|id|it|ja|ko|nl|pl|pt-BR|pt-PT|ro|ru|th|tr|vi)\/)/;

function verifyAll() {
  const problems = [];
  const links = new Map();
  let checked = 0;
  for (const loc of LOCALES) {
    const f = join(BLOG_DIR, loc, `${SLUG}.mdx`);
    if (!existsSync(f)) {
      problems.push(`${loc}: 文件缺失`);
      continue;
    }
    checked++;
    const src = readFileSync(f, 'utf8');
    for (const r of [
      `slug: "${SLUG}"`,
      `translationKey: "${TRANSLATION_KEY}"`,
      `category: "${CATEGORY}"`,
      `url: ${URL}`,
      'pubDate: "2026-09-12"',
      'faqs:',
    ]) {
      if (!src.includes(r)) problems.push(`${loc}: 缺少 ${r}`);
    }
    const faqCount = (src.match(/^  - question:/gm) || []).length;
    if (faqCount !== 4) problems.push(`${loc}: faqs 条目 ${faqCount} 条（应为 4）`);
    const body = src.split(/^---$/m).slice(2).join('---');
    const frontmatter = src.split(/^---$/m)[1] || '';
    // 仅查 frontmatter：正文 References 里合法出现 "Photobiomodulation ..." 论文标题
    if (frontmatter.includes(CATEGORY_FROM)) problems.push(`${loc}: frontmatter 仍含旧 category`);
    if (/^#\s+\S/m.test(body)) problems.push(`${loc}: 正文残留 H1`);
    if (/^##\s+.*\n\s*\*\*.+\*\*\s*$/m.test(body)) problems.push(`${loc}: 正文仍残留 FAQ 粗体问答`);
    if (/Editor's notes/i.test(body)) problems.push(`${loc}: 残留 Editor's notes`);
    for (const m of src.matchAll(/\]\((\/[^)\s]*)\)/g)) {
      links.set(m[1], (links.get(m[1]) || 0) + 1);
    }
    const bad = src.match(LOCALE_PREFIX_RE);
    if (bad) problems.push(`${loc}: 内链含 locale 前缀 ${bad[1]}`);
  }
  console.log(`files checked: ${checked}/${LOCALES.length}`);
  console.log(`problems: ${problems.length ? '' : 'none'}`);
  problems.forEach((p) => console.log(`  ! ${p}`));
  console.log(`internal links (${links.size}):`);
  [...links].sort().forEach(([k, v]) => console.log(`  ${k} x${v}`));
  return problems.length;
}

// ---------------------------------------------------------------- coverage

const ALL_LOCALES = [
  'en', 'ar', 'cs', 'de', 'el', 'es', 'fa', 'fr', 'he', 'id', 'it',
  'ja', 'ko', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'th', 'tr', 'vi',
];

// 取正文中「应被翻译的散文行」：排除 frontmatter、标题、表格、列表、引用块，
// 并整体排除最后一节（References，按惯例保留英文论文标题）。
function proseLines(src) {
  const body = src.split(/^---$/m).slice(2).join('---');
  const lines = body.split(/\r?\n/).map((s) => s.trim());
  let headIdxs = [];
  lines.forEach((l, i) => {
    if (/^##\s+/.test(l)) headIdxs.push(i);
  });
  const cut = headIdxs.length ? headIdxs[headIdxs.length - 1] : lines.length;
  const out = [];
  for (let i = 0; i < cut; i++) {
    const l = lines[i];
    if (l.length < 40) continue;
    if (/^[-*|>#]/.test(l) || /^\d+\./.test(l)) continue;
    out.push(l);
  }
  return out;
}

const EN_STOPWORDS =
  /\b(the|and|with|that|this|which|from|because|between|should|would|could|than)\b/gi;

function coverage() {
  const enFile = join(BLOG_DIR, 'en', `${SLUG}.mdx`);
  const enProse = new Set(proseLines(readFileSync(enFile, 'utf8')));
  console.log(`en prose lines (baseline): ${enProse.size}\n`);
  console.log('locale  file  prose  identical-to-en  english-suspect  nonascii%');
  const missing = [];
  for (const loc of ALL_LOCALES) {
    const f = join(BLOG_DIR, loc, `${SLUG}.mdx`);
    if (!existsSync(f)) {
      missing.push(loc);
      console.log(`${loc.padEnd(7)} -      -      -                -                (英文回退)`);
      continue;
    }
    const src = readFileSync(f, 'utf8');
    const prose = proseLines(src);
    const identical = prose.filter((l) => enProse.has(l)).length;
    const suspect = prose.filter((l) => (l.match(EN_STOPWORDS) || []).length >= 4).length;
    const chars = prose.join('');
    const nonAscii = (chars.match(/[^\x00-\x7F]/g) || []).length;
    const pct = chars.length ? ((nonAscii / chars.length) * 100).toFixed(1) : '0.0';
    console.log(
      `${loc.padEnd(7)} yes    ${String(prose.length).padEnd(6)} ${String(identical).padEnd(16)} ${String(suspect).padEnd(16)} ${pct}`,
    );
  }
  console.log(`\n已翻译: ${ALL_LOCALES.length - missing.length - 0}/${ALL_LOCALES.length}（含 en）`);
  console.log(`仍为英文回退 (${missing.length}): ${missing.join(', ') || 'none'}`);
  return 0;
}

// ---------------------------------------------------------------- main

if (process.argv.includes('--coverage')) {
  process.exit(coverage());
}

if (VERIFY) {
  process.exit(verifyAll() ? 1 : 0);
}

let written = 0;
for (const loc of LOCALES) {
  const srcFile = join(SRC_DIR, `${loc}.mdx`);
  if (!existsSync(srcFile)) {
    console.log(`MISSING  ${srcFile}`);
    continue;
  }
  let head, body, parsed;
  try {
    ({ head, body } = splitFrontmatter(readFileSync(srcFile, 'utf8')));
    parsed = parseBody(body);
  } catch (e) {
    console.log(`ERROR    ${loc}.mdx: ${e.message}`);
    continue;
  }
  if (DRY) {
    console.log(`--- ${loc}`);
    console.log(`    faqs: ${parsed.faqs.length}  body: ${parsed.body.length} 行`);
    if (parsed.faqs[0]) console.log(`    q1  : ${parsed.faqs[0].question}`);
    continue;
  }
  const outFile = join(BLOG_DIR, loc, `${SLUG}.mdx`);
  if (!existsSync(join(BLOG_DIR, loc))) {
    console.log(`NODIR    ${join(BLOG_DIR, loc)}`);
    continue;
  }
  writeFileSync(outFile, buildMdx(head, parsed.faqs, parsed.body), 'utf8');
  console.log(`WRITTEN  ${outFile}`);
  written++;
}
if (!DRY) console.log(`\nlocales: ${LOCALES.length}  written: ${written}`);
