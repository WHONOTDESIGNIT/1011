import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  // 全站 URL 规范（方案B · Panasonic 风格）：统一无结尾斜杠。
  // 注意：不使用 build.format: 'file' —— Astro 5.18.1 的 i18n fallback 语言首页
  // （/tr、/ro 等 16 个）在 file 格式下无法生成（已知 bug：fallback rewrite 空 body，
  // 仅 Astro 6.2+ 修复，5.x 无补丁）。改为 directory 构建 + scripts/flatten-html.mjs
  // 构建后转换（foo/index.html → foo.html），效果与 file 产物一致：
  // Netlify 对 .html 文件原生将 /about/ 301 → /about（官方 Support Guide）。
  // trailingSlash: 'never' 声明 URL 永不带尾斜杠，配合内链/canonical/sitemap。
  trailingSlash: 'never',
  // 构建内存优化：Netlify 上 9 语言 × 51 核心页 + 博客并发构建易触发 V8 OOM，
  // 限制单线程构建（build.concurrency=1），与 NODE_OPTIONS=--max-old-space-size=8192 配合避免内存竞争
  build: {
    concurrency: 1,
  },
  // i18n：默认语言 en（无 URL 前缀），土耳其语与阿拉伯语为第二/第三语言
  // fallback tr/ar → en：未翻译页面在 /tr/、/ar/ URL 下直接渲染英文内容（rewrite，不跳转、无 noindex）
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'nl', 'id', 'th', 'pl', 'ja', 'ko', 'cs'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: {
      tr: 'en',
      ro: 'en',
      ar: 'en',
      es: 'en',
      fr: 'en',
      ru: 'en',
      he: 'en',
      fa: 'en',
      el: 'en',
      'pt-BR': 'en',
      nl: 'en',
      id: 'en',
      th: 'en',
      pl: 'en',
      ja: 'en',
      ko: 'en',
      cs: 'en',
    },
  },
  adapter: netlify({
    imageCDN: true,
  }),
  image: {
    // External images use plain <img>, so no domains needed
  },
  integrations: [react({ include: ['**/react/*.tsx'] }), tailwind(), mdx()],
  vite: {
    server: {
      fs: {
        allow: ['..'],
      },
      watch: {
        usePolling: true,
        interval: 500,
      },
    },
  },
});
