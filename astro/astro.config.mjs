import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  // 构建内存优化：Netlify 上 9 语言 × 51 核心页 + 博客并发构建易触发 V8 OOM，
  // 限制单线程构建（build.concurrency=1），与 NODE_OPTIONS=--max-old-space-size=8192 配合避免内存竞争
  build: {
    concurrency: 1,
  },
  // i18n：默认语言 en（无 URL 前缀），土耳其语与阿拉伯语为第二/第三语言
  // fallback tr/ar → en：未翻译页面在 /tr/、/ar/ URL 下直接渲染英文内容（rewrite，不跳转、无 noindex）
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'ro', 'ar', 'es', 'fr', 'ru', 'he', 'fa', 'el', 'pt-BR', 'nl', 'id', 'th', 'pl', 'ja', 'ko'],
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
