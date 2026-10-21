// 站点计数的**唯一实现**。守卫（verify-baseline）与本地测量工具都从这里取，
// 不再各自复制一份逻辑——"两处相同逻辑"就是漂移的温床：
// 2026-10-21 本地工具用递归遍历数出 100，守卫只数直接子级得 77，差 23 正是分类页。

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

/** 某语种的博客目录：en 在 dist/blog，其余在 dist/<locale>/blog */
export function blogDirFor(distDir, locale) {
  return locale === 'en' ? path.join(distDir, 'blog') : path.join(distDir, locale.toLowerCase(), 'blog');
}

/**
 * 每语种的博客页数。
 * 口径：只数 `dist/<locale>/blog` 下的**直接子级** `.html`。
 * `/blog/category/*`（分类聚合页）不算；fallback shim 算（它确实产出一个页面）。
 */
export function countBlogPagesPerLocale(distDir, locales) {
  const map = {};
  for (const loc of locales) {
    const dir = blogDirFor(distDir, loc);
    map[loc] = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.html')).length : 0;
  }
  return map;
}

/** 递归数出目录下所有 .html（页面总数口径） */
export function countHtmlFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...countHtmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
