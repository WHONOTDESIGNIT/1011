/**
 * sitemap lastmod：为每个 URL 推导「内容最后变更」的真实时间
 *
 * 依据 Bing Webmaster 官方口径（2025-07-31 博文
 * https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search）：
 *   · lastmod 是 Bing 决定「重抓优先」还是「跳过」的关键信号；
 *   · 必须用标准 ISO 8601 且**带时间**；
 *   · changefreq / priority 被 Bing 忽略，写了没用；
 *   · **绝不可用 sitemap 生成时间冒充内容更新时间**（那会被判为不可信信号）。
 *
 * 因此本模块的取值口径是：
 *   · 主信号 = **git 最后提交时间**（语义上最接近「内容真正进入仓库/发生变更的时刻」）；
 *   · 兜底   = 文件 mtime（仅当该文件尚未提交进 git，例如本地新写还没 commit）；
 *   · 动态页 = 模板文件与该语种 messages/{locale}.json 取**较晚者**
 *              （组件页/客户页的正文文案其实来自 messages，只取模板会漏报翻译更新）；
 *   · 分类聚合页 = **返回 null，省略 lastmod**
 *              （它们由 posts.map() 动态渲染，没有独立的“内容文件”，任何时间都是编的）。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
// 本文件位于 astro/scripts/lib/ —— 需上溯两级才是 astro/，三级到仓库根。
const ASTRO = resolve(__dirname, '..', '..');
const REPO = resolve(ASTRO, '..');

/** URL 路径段使用小写（pt-br），而目录名保留大小写（pt-BR）——必须映射，否则 git 查不到路径。 */
const DIR_CASE = { 'pt-br': 'pt-BR', 'pt-pt': 'pt-PT' };
const dirCase = (loc) => DIR_CASE[loc] ?? loc;

const LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el',
  'pt-br', 'pt-pt', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];
const LOCSET = new Set(LOCALES);

/** 动态页：URL 前缀 → 模板文件（真值来自模板 + 该语种 messages） */
const DYNAMIC = [
  { re: /^\/products\/[^/]+$/, tpl: 'astro/src/pages/products/[slug].astro' },
  { re: /^\/components\/[^/]+$/, tpl: 'astro/src/pages/components/[slug].astro' },
  { re: /^\/clients\/[^/]+$/, tpl: 'astro/src/pages/clients/[slug].astro' },
];

/**
 * 一次 git log 扫全仓，建立 文件 → 最后提交时间。
 * 实测 3 万行历史约 0.8 秒，构建期开销可忽略。
 * git 不可用（如无 git 的构建容器）时返回 null，调用方据此整体退化为「不输出 lastmod」。
 */
export function loadGitTimes(repo = REPO) {
  let out;
  try {
    out = execFileSync('git', ['-C', repo, 'log', '--name-only', '--pretty=format:C|%cI'],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
  const map = new Map();
  let cur = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('C|')) { cur = line.slice(2).trim(); continue; }
    const p = line.trim();
    if (!p || !cur) continue;
    const rel = p.replace(/\\/g, '/');
    if (!map.has(rel)) map.set(rel, cur);   // git log 由新到旧，首次出现即最新
  }
  return map.size ? map : null;
}

/**
 * 博客 URL → 源文件索引。
 *
 * ⚠ 关键：**slug 与文件名并不相同**。例如 URL `/blog/45-best-ipl-hair-removal-device`
 * 对应文件 `45-best-ipl-hair-removal-device.mdx`，而其 frontmatter 是
 * `slug: "best-ipl-hair-removal-device"`。构建产物目录名用的是**文件名**，
 * 所以索引必须以文件名为键，否则会大面积漏配。
 * 两种键都登记，URL 段命中任一即可（文件名为准，frontmatter slug 兜底）。
 */
function buildBlogIndex() {
  const idx = new Map();
  for (const loc of LOCALES) {
    const dir = join(ASTRO, 'src', 'content', 'blog', dirCase(loc));
    if (!existsSync(dir)) continue;
    for (const fn of readdirSync(dir)) {
      if (!/\.mdx?$/.test(fn)) continue;
      const rel = `astro/src/content/blog/${dirCase(loc)}/${fn}`;
      const fileStem = fn.replace(/\.mdx?$/, '');
      idx.set(`${loc}\u0000${fileStem}`, rel);          // 键=文件名（构建产物目录名即此）
      try {
        const head = readFileSync(join(dir, fn), 'utf8').slice(0, 4000);
        const m = head.match(/^slug:\s*["']?([^"'\r\n]+)/m);
        if (m && m[1].trim() && m[1].trim() !== fileStem) {
          // 兜底键：不覆盖文件名键（同语种内若冲突，以文件名为准）
          if (!idx.has(`${loc}\u0000${m[1].trim()}`)) idx.set(`${loc}\u0000${m[1].trim()}`, rel);
        }
      } catch { /* 读不到就用文件名 */ }
    }
  }
  return idx;
}

/** 静态页：/about → src/pages/about/index.astro；/about/brand-story → .../brand-story/index.astro */
function staticSource(urlPath) {
  const rel = urlPath.replace(/^\//, '').replace(/\/$/, '');
  if (!rel) return 'astro/src/pages/index.astro';
  const asDir = `astro/src/pages/${rel}/index.astro`;
  if (existsSync(join(REPO, asDir))) return asDir;
  const asFile = `astro/src/pages/${rel}.astro`;
  if (existsSync(join(REPO, asFile))) return asFile;
  return null;
}
export function createLastmodResolver() {
  const git = loadGitTimes();
  const blog = buildBlogIndex();
  const mtime = (rel) => {
    try { return statSync(join(REPO, rel)).mtime.toISOString(); } catch { return null; }
  };

  /**
   * mtime 可信度判定。
   *
   * CI 上的一次全新 checkout 会把**所有文件**的 mtime 设成同一个时刻。若此时还用它兜底，
   * 就会产出「3,278 条 lastmod 全都一样」——正是 Bing 明确警告要避免的假信号，
   * 危害大于干脆不输出。故此处先探测：抽样若干源文件，若 mtime 高度集中即判定不可信。
   */
  function mtimeTrustworthy() {
    const sample = [];
    const push = (p) => { try { sample.push(statSync(p).mtimeMs); } catch { /* 忽略 */ } };
    for (const rel of ['astro/src/pages/index.astro', 'astro/src/pages/about/index.astro',
      'astro/src/pages/products/[slug].astro', 'astro/package.json', 'netlify.toml']) {
      push(join(REPO, rel));
    }
    for (const loc of ['en', 'de', 'ja']) {
      const dir = join(ASTRO, 'src', 'content', 'blog', loc);
      if (!existsSync(dir)) continue;
      for (const fn of readdirSync(dir).slice(0, 8)) push(join(dir, fn));
    }
    if (sample.length < 5) return true;
    const span = (Math.max(...sample) - Math.min(...sample)) / 1000;
    // 真实工作区的 mtime 跨度通常是数天到数月；全新克隆会在数秒内
    return span > 300;
  }

  const trustMtime = mtimeTrustworthy();
  /**
   * git 时间**优先**，mtime 仅在（文件未进 git 且 mtime 可信）时兜底。
   *
   * 不取「较晚者」：mtime 会被无关操作污染（批量 touch、rebase/检出重写工作区），
   * 且污染方向通常是"变新"——取较晚会选中假的更新时间。git 提交时间才语义对应
   * 「内容真正发生变更」。
   */
  const gitOrMtime = (rel) => {
    const g = git?.get(rel);
    if (g) return g;
    return trustMtime ? mtime(rel) : null;
  };
  const later = (a, b) => (!a ? b : !b ? a : (a > b ? a : b));

  // staticSource 含 existsSync 探测，逐 URL 调用会重复数百次同一路径 → 缓存
  const staticCache = new Map();
  const staticSourceCached = (p) => {
    if (!staticCache.has(p)) staticCache.set(p, staticSource(p));
    return staticCache.get(p);
  };

  /**
   * @param {string} lang  sitemap 语言组（与 dist 目录名一致，如 'pt-br'）
   * @param {string} urlPath 站内路径（如 '/blog/x'、'/about'；不含 locale 前缀）
   * @returns {string|null} ISO 8601（带时区），或 null 表示省略 lastmod
   */
  function lastmodFor(lang, urlPath) {
    const p = urlPath.replace(/\/+$/, '') || '/';

    // 分类聚合页：无独立内容文件 → 省略（编造时间比缺失更糟）
    if (/^\/blog\/category\/[^/]+$/.test(p)) return null;

    // 语言首页：既可能是 '/'（调用方已剥前缀），也可能是 '/de'（未剥）——
    // 该语种首页正文来自 messages/{locale}.json，不是 en 的 index.astro。
    if (lang !== 'en' && (p === '/' || p === `/${lang}`)) {
      return gitOrMtime(`astro/messages/${dirCase(lang)}.json`);
    }
    if (p === '/') return gitOrMtime('astro/src/pages/index.astro');

    // 博客文章
    const m = p.match(/^\/blog\/(.+)$/);
    if (m) {
      const rel = blog.get(`${lang}\u0000${m[1]}`);
      return rel ? gitOrMtime(rel) : null;
    }

    // 动态页：模板 + 该语种 messages 取较晚
    for (const { re, tpl } of DYNAMIC) {
      if (re.test(p)) {
        const msg = `astro/messages/${dirCase(lang)}.json`;
        return later(gitOrMtime(tpl), gitOrMtime(msg));
      }
    }

    // 静态页
    const rel = staticSourceCached(p);
    return rel ? gitOrMtime(rel) : null;
  }

  return {
    lastmodFor,
    hasGit: !!git,
    mtimeTrusted: trustMtime,
    stats: { gitFiles: git?.size ?? 0, blogFiles: blog.size },
  };
}

export { LOCALES, LOCSET };
