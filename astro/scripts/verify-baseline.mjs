// 构建产物监控基线：页面数 / 产物体积 / SEO 完整性 / _redirects 结构
//
// 首跑（scripts/baseline.json 不存在时）：测量当前 dist 并写入基线快照，exit 0。
// 后续构建：与基线对比，超出容差输出警告（warn，exit 0）或失败（fail，exit 1）。
//
// 指标与容差（2026-08-31 与用户确认）：
//   htmlTotal       HTML 总数 ±10            —— 允许少量新增/删除文章
//   htmlPerLocale   每语言博客页 ±2          —— 允许单语言小幅调整
//   astroAssetSize  _astro 总量 +15% warn / +30% fail
//   maxCssChunk     最大 CSS chunk +10% warn / +20% fail
//   maxJsChunk      最大 JS chunk  +10% warn / +20% fail
//   sitemapUppercase /pt-BR /pt-PT 大写 URL 必须为 0（严格）
//   redirectsIntact pt 通配/旧大写 301/404 兜底规则完整（严格）
//   hreflangComplete 每语言首页含 21 语言 + x-default hreflang，且无大写 pt href（严格）
//
// baseline.json 提交进仓库，保证 CI 每次与同一份基线对比，不随本地重跑漂移。
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const BASELINE_PATH = path.join(__dirname, 'baseline.json');

// 构建启用的 22 个 locale（Astro currentLocale 内部 code；目录名 = code.toLowerCase()）
const BUILD_LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];

// hreflang 契约 = SeoHead.astro 实际输出的 21 语言 + x-default
// 注意：ro 暂缺（历史遗留，见 SeoHead.astro 的 pageHreflangs 列表），补齐后需同步更新此契约
const HREFLANG_CONTRACT = ['en', 'tr', 'ar', 'es-ES', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'pt-PT', 'nl', 'pl', 'ja', 'ko', 'id', 'th', 'cs', 'vi', 'de', 'it'];

const TOL = {
  htmlTotalDelta: 10,
  htmlPerLocaleDelta: 2,
  assetWarnPct: 0.15,
  assetFailPct: 0.30,
  chunkWarnPct: 0.10,
  chunkFailPct: 0.20,
};

// ── 测量 ────────────────────────────────────────────────
function walkFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, ext));
    else if (!ext || entry.name.endsWith(ext)) out.push({ name: entry.name, size: statSync(full).size });
  }
  return out;
}

function blogDirFor(locale) {
  return locale === 'en' ? path.join(DIST, 'blog') : path.join(DIST, locale.toLowerCase(), 'blog');
}

function countBlogPerLocale() {
  const map = {};
  for (const loc of BUILD_LOCALES) {
    const dir = blogDirFor(loc);
    map[loc] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')).length : 0;
  }
  return map;
}

function measure() {
  const htmlFiles = walkFiles(DIST, '.html');
  const astroFiles = walkFiles(path.join(DIST, '_astro'));
  const css = astroFiles.filter((f) => f.name.endsWith('.css'));
  const js = astroFiles.filter((f) => f.name.endsWith('.js'));

  // sitemap：大写 pt URL 必须为 0
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  let sitemapUppercase = -1; // -1 = 缺失
  if (existsSync(sitemapPath)) {
    const s = readFileSync(sitemapPath, 'utf8');
    sitemapUppercase = (s.match(/\/pt-BR|\/pt-PT/g) || []).length;
  }

  // _redirects：pt 规则 + 404 兜底
  const redirectsPath = path.join(DIST, '_redirects');
  const redirectsRequired = [
    '/pt-br/:splat /pt-br/:splat.html 200',
    '/pt-pt/:splat /pt-pt/:splat.html 200',
    '/pt-BR/:splat /pt-br/:splat 301!',
    '/pt-PT/:splat /pt-pt/:splat 301!',
  ];
  let redirects = { ok: false, reason: '_redirects 缺失' };
  if (existsSync(redirectsPath)) {
    const lines = readFileSync(redirectsPath, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'));
    const missing = redirectsRequired.filter((r) => !lines.includes(r));
    const catchAllOk = lines[lines.length - 1] === '/* /404.html 404';
    const reason = [
      missing.length ? `缺失规则: ${missing.join(', ')}` : '',
      catchAllOk ? '' : `404 兜底缺失或不在末尾（末行: ${lines[lines.length - 1] ?? '(空)'}）`,
    ].filter(Boolean).join('; ');
    redirects = { ok: missing.length === 0 && catchAllOk, reason: reason || 'ok' };
  }

  // hreflang：每语言首页含 21 语言 + x-default，且 href 无大写 pt
  let hreflang = { ok: true, issues: [], checked: 0 };
  for (const loc of BUILD_LOCALES) {
    const home = loc === 'en' ? path.join(DIST, 'index.html') : path.join(DIST, `${loc.toLowerCase()}.html`);
    if (!existsSync(home)) {
      hreflang.issues.push(`${loc}: 首页缺失 ${path.basename(home)}`);
      continue;
    }
    const html = readFileSync(home, 'utf8');
    hreflang.checked++;
    const hrefs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"[^>]*href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
    const langs = new Set(hrefs.map((h) => h.lang));
    const missing = HREFLANG_CONTRACT.filter((l) => !langs.has(l));
    if (!langs.has('x-default')) missing.push('x-default');
    if (missing.length) hreflang.issues.push(`${loc}: 缺少 hreflang ${missing.join(', ')}`);
    const upper = hrefs.find((h) => /\/pt-BR\/|\/pt-PT\//.test(h.href));
    if (upper) hreflang.issues.push(`${loc}: 存在大写 pt href ${upper.href}`);
  }
  hreflang.ok = hreflang.issues.length === 0;

  return {
    htmlTotal: htmlFiles.length,
    htmlPerLocale: countBlogPerLocale(),
    astroAssetSize: astroFiles.reduce((s, f) => s + f.size, 0),
    maxCssChunk: css.length ? Math.max(...css.map((f) => f.size)) : 0,
    maxJsChunk: js.length ? Math.max(...js.map((f) => f.size)) : 0,
    sitemapUppercase,
    redirectsIntact: redirects.ok,
    redirectsReason: redirects.reason,
    hreflangComplete: hreflang.ok,
    hreflangIssues: hreflang.issues,
    hreflangChecked: hreflang.checked,
  };
}

// ── 输出与判定 ────────────────────────────────────────────
const results = [];
const ok = (msg) => results.push({ level: 'ok', msg });
const warn = (msg) => results.push({ level: 'warn', msg });
const fail = (msg) => results.push({ level: 'fail', msg });
const fmtKB = (b) => `${(b / 1024).toFixed(1)} KB`;

function compare() {
  const cur = measure();
  const base = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));

  // 页面总数
  const htmlDelta = Math.abs(cur.htmlTotal - base.htmlTotal);
  if (htmlDelta > TOL.htmlTotalDelta) fail(`htmlTotal: 基线 ${base.htmlTotal}±${TOL.htmlTotalDelta}，当前 ${cur.htmlTotal}`);
  else ok(`htmlTotal: ${cur.htmlTotal}（基线 ${base.htmlTotal}，±${TOL.htmlTotalDelta}）`);

  // 每语言博客页
  const perLocaleFails = [];
  for (const loc of BUILD_LOCALES) {
    const b = base.htmlPerLocale?.[loc];
    if (b === undefined) { perLocaleFails.push(`基线缺语言 ${loc}`); continue; }
    const c = cur.htmlPerLocale[loc] ?? 0;
    if (Math.abs(c - b) > TOL.htmlPerLocaleDelta) perLocaleFails.push(`expected ${b}, got ${c} for ${loc}`);
  }
  if (perLocaleFails.length) fail(`htmlPerLocale: ${perLocaleFails.join('; ')}`);
  else ok(`htmlPerLocale: ${BUILD_LOCALES.length} 语言博客页全部在 ±${TOL.htmlPerLocaleDelta} 内`);

  // 产物体积
  for (const [name, curVal, baseVal, warnPct, failPct] of [
    ['astroAssetSize', cur.astroAssetSize, base.astroAssetSize, TOL.assetWarnPct, TOL.assetFailPct],
    ['maxCssChunk', cur.maxCssChunk, base.maxCssChunk, TOL.chunkWarnPct, TOL.chunkFailPct],
    ['maxJsChunk', cur.maxJsChunk, base.maxJsChunk, TOL.chunkWarnPct, TOL.chunkFailPct],
  ]) {
    if (curVal <= baseVal) { ok(`${name}: ${fmtKB(curVal)}（基线 ${fmtKB(baseVal)}）`); continue; }
    const pct = (curVal - baseVal) / baseVal;
    if (pct > failPct) fail(`${name}: 增长 +${(pct * 100).toFixed(1)}%（基线 ${fmtKB(baseVal)} → ${fmtKB(curVal)}，>+${(failPct * 100).toFixed(0)}% fail）`);
    else if (pct > warnPct) warn(`${name}: 增长 +${(pct * 100).toFixed(1)}%（>+${(warnPct * 100).toFixed(0)}% warn / +${(failPct * 100).toFixed(0)}% fail）`);
    else ok(`${name}: ${fmtKB(curVal)}（+${(pct * 100).toFixed(1)}%）`);
  }

  // 严格项
  if (cur.sitemapUppercase === -1) fail('sitemap.xml 缺失');
  else if (cur.sitemapUppercase === 0) ok('sitemap: 无大写 /pt-BR /pt-PT URL');
  else fail(`sitemap: 检测到 ${cur.sitemapUppercase} 处大写 pt URL`);

  if (cur.redirectsIntact) ok('_redirects: pt 通配 / 旧大写 301 / 404 兜底完整');
  else fail(`_redirects: ${cur.redirectsReason}`);

  if (cur.hreflangComplete) ok(`hreflang: ${cur.hreflangChecked} 页首页 × ${HREFLANG_CONTRACT.length}+x-default 齐全，无大写 pt href`);
  else fail(`hreflang: ${cur.hreflangIssues.join('；')}`);
}

// ── 主流程 ────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.error(`❌ dist 不存在（${DIST}），请先执行 npm run build`);
  process.exit(1);
}

if (!existsSync(BASELINE_PATH)) {
  const snapshot = measure();
  snapshot.createdAt = new Date().toISOString();
  writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 2));
  console.log('✅ baseline.json written（首跑快照，已提交进仓库）');
  console.log(`   页面 ${snapshot.htmlTotal}，_astro ${fmtKB(snapshot.astroAssetSize)}，hreflang 校验 ${snapshot.hreflangChecked} 页`);
  process.exit(0);
}

compare();

const hasFail = results.some((r) => r.level === 'fail');
const hasWarn = results.some((r) => r.level === 'warn');
console.log('\n—— 构建基线校验 ——');
for (const r of results) {
  const icon = r.level === 'fail' ? '❌' : r.level === 'warn' ? '⚠️' : '✅';
  console.log(`${icon} ${r.msg}`);
}
console.log(hasFail ? '\n❌ 基线校验失败（构建中断）' : hasWarn ? '\n⚠️ 基线校验通过（有警告，请人工确认）' : '\n✅ all checks passed');
process.exit(hasFail ? 1 : 0);
