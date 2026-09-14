/**
 * rehype-locale-links
 * ---------------------------------------------------------------------------
 * 目的：本地化文章页的正文内链目前全部指向英文（`/blog/<slug>`、`/products` 等），
 * 21 语种 × 61 篇共 2,972 处，把本地化集群的站内权重与读者单向送回英文。
 * 本插件在渲染层给「该语种确实存在的目标」补上语种前缀，英文页面一律不动。
 *
 * 设计要点
 *  1. 只改渲染结果，不动 1,281 个内容文件：新文章/新语种自动生效，零翻译回归。
 *  2. 目标在该语种**不存在**时不加前缀（例如尚未翻译的 adapter 篇）：
 *     保持指向英文原页，而不是造一个 200 但内容是英文的伪本地化地址。
 *  3. 若该语种用了自己的 slug（如 ru 的 40-pravda-ob-energii-ipl），按 translationKey
 *     映射到本语种 slug，避免多一跳 301。
 *  4. 认不出语种就什么都不做（fail-safe）：宁可不改，也不改错。
 *  5. 幂等：已是 `/<locale>/...` 的链接不再处理，重复执行结果一致。
 *  6. 只处理站内绝对路径；外链、协议相对、锚点、mailto/tel、带扩展名的文件一律跳过。
 *
 * 前置事实（已实测，非假设）
 *  · @astrojs/mdx 会继承 astro.config 的 markdown.rehypePlugins（extendMarkdownConfig 默认 true）
 *    —— node_modules/@astrojs/mdx/dist/index.js L51-55、L79。
 *  · MDX 编译时 vfile 带 path=<.mdx 绝对路径>
 *    —— node_modules/@astrojs/mdx/dist/vite-plugin-mdx.js L30-35；@mdx-js/mdx 探针复验通过。
 */

import fs from 'node:fs';
import path from 'node:path';

/** 自带的最小 hast 遍历：只找 <a>，不引入任何新依赖
 *  （unist-util-visit 只是 Astro 的传递依赖，未写入 package.json，不依赖 npm 提升） */
function eachAnchor(node, cb) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'element' && node.tagName === 'a') cb(node);
  const kids = node.children;
  if (Array.isArray(kids)) for (const k of kids) eachAnchor(k, cb);
}

/** 与 src/lib/blog.ts 的三层映射保持一致：内容目录名 ↔ URL path（小写） */
export const SUPPORTED_LOCALES = ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el',
  'pt-BR', 'pt-PT', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs', 'vi', 'de', 'it'];
const DIR_TO_URL_PATH = { 'pt-BR': 'pt-br', 'pt-PT': 'pt-pt' };
const URL_PATHS = SUPPORTED_LOCALES.map((d) => DIR_TO_URL_PATH[d] ?? d);

const LOCALE_FROM_PATH = new RegExp(
  '(?:^|/)(' + SUPPORTED_LOCALES.map((l) => l.replace(/-/g, '\\-')).join('|') + ')(?=/)'
);

/** 站点级路径：仅当该路径在所有 22 个 URL 前缀下都真实存在才写入本表。
 *  2026-09-12 线上实测 22 × 18 全部 200（脚本 _check_site_path_matrix.cjs，
 *  结果 _site_path_matrix.json）。/blog 及其子路径由下面的 blog 分支单独处理。 */
export const DEFAULT_SITE_PATHS = new Set([
  '/products', '/components', '/contact', '/services', '/catalogue', '/clients',
  '/about', '/faq', '/careers', '/meet-the-team', '/privacy-policy', '/return-policy',
  '/ipl-hair-removal-is-safe', '/marketplace', '/ipl-for-brands',
]);

const SLUG_RE = /^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m;
const TK_RE = /^translationKey:\s*["']?([^"'\r\n]+?)["']?\s*$/m;

/**
 * 读 src/content/blog/<locale>/*.mdx 的 frontmatter：
 *   enSlugToKey  : 英文 slug → translationKey
 *   perLocale    : 语种 → { slugs:Set, keyToSlug:Map }
 */
export function buildIndex(contentRoot) {
  const enSlugToKey = new Map();
  const perLocale = new Map();
  for (const dir of SUPPORTED_LOCALES) {
    const slugs = new Set();
    const keyToSlug = new Map();
    const abs = path.join(contentRoot, dir);
    if (fs.existsSync(abs)) {
      for (const f of fs.readdirSync(abs)) {
        if (!/\.mdx?$/.test(f)) continue;
        const txt = fs.readFileSync(path.join(abs, f), 'utf8');
        const sm = SLUG_RE.exec(txt);
        if (!sm) continue;
        const slug = sm[1].trim();
        slugs.add(slug);
        const tm = TK_RE.exec(txt);
        if (tm) {
          const key = tm[1].trim();
          keyToSlug.set(key, slug);
          if (dir === 'en') enSlugToKey.set(slug, key);
        }
      }
    }
    perLocale.set(dir, { slugs, keyToSlug });
  }
  return { enSlugToKey, perLocale };
}

/**
 * 纯函数：给定 href 与当前语种，返回改写后的 href 或 null（表示不改）。
 * 便于离线对全部真实链接做穷尽测试。
 */
export function rewriteHref(href, locale, ctx) {
  if (typeof href !== 'string' || href.length === 0) return null;
  if (href[0] !== '/') return null;              // 外链 / 相对路径 / mailto: / tel:
  if (href.startsWith('//')) return null;        // 协议相对

  const m = /^([^?#]*)([?#].*)?$/.exec(href);
  const bare = m[1] || '';
  const suffix = m[2] || '';
  if (bare === '' || bare === '/') return null;  // 纯锚点 / 首页

  const segs = bare.split('/').filter(Boolean);
  if (segs.length === 0) return null;
  const first = segs[0];

  if (SUPPORTED_LOCALES.includes(first) || URL_PATHS.includes(first)) return null; // 已带前缀
  if (/\.[a-z0-9]{2,6}$/i.test(segs[segs.length - 1])) return null;                // /x.pdf /logo.png
  if (locale === 'en') return null;                                                // 英文页不动

  const lp = DIR_TO_URL_PATH[locale] ?? locale;

  if (first === 'blog') {
    if (segs.length === 1) return `/${lp}/blog${suffix}`;
    if (segs.length === 2) {
      const slug = segs[1];
      const loc = ctx.index.perLocale.get(locale);
      if (loc.slugs.has(slug)) return `/${lp}/blog/${slug}${suffix}`;
      // 该语种用了自己的 slug？按 translationKey 映射（ru 有两篇如此）
      const key = ctx.index.enSlugToKey.get(slug);
      const own = key ? loc.keyToSlug.get(key) : undefined;
      if (own) return `/${lp}/blog/${own}${suffix}`;
      return null;   // 该语种没有这篇：保持指向英文原页
    }
    return `/${lp}/${segs.join('/')}${suffix}`;   // /blog/category/<x>（0 处现存，防空转仍保留）
  }

  if (ctx.sitePaths.has('/' + first)) return `/${lp}/${segs.join('/')}${suffix}`;
  return null;                                   // 不在白名单：保守不动
}

export default function rehypeLocaleLinks(options = {}) {
  const contentRoot = options.contentRoot ?? path.resolve(process.cwd(), 'src/content/blog');
  const sitePaths = new Set(options.sitePaths ?? DEFAULT_SITE_PATHS); // 接受 Set 或数组
  const verbose = options.verbose ?? false;
  let index = null;
  const ctxOf = () => {
    if (!index) index = buildIndex(contentRoot);
    return { index, sitePaths };
  };

  return (tree, file) => {
    const raw = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
    const hit = LOCALE_FROM_PATH.exec(raw);
    const locale = hit ? hit[1] : 'en';
    if (locale === 'en') return;                 // 认不出语种 → 一律不动

    const ctx = ctxOf();
    let changed = 0;
    eachAnchor(tree, (node) => {
      const next = rewriteHref(node.properties?.href, locale, ctx);
      if (next) {
        node.properties.href = next;
        changed += 1;
      }
    });
    if (verbose && changed) {
      console.log(`[locale-links] ${locale}: ${changed} link(s) localized in ${path.basename(raw)}`);
    }
  };
}
