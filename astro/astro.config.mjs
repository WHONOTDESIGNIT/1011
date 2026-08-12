import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  // i18n：默认语言 en（无 URL 前缀），土耳其语与阿拉伯语为第二/第三语言
  // fallback tr/ar → en：未翻译页面在 /tr/、/ar/ URL 下直接渲染英文内容（rewrite，不跳转、无 noindex）
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr', 'ar', 'es', 'fr', 'ru', 'he', 'pt-PT', 'nl'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: {
      tr: 'en',
      ar: 'en',
      es: 'en',
      fr: 'en',
      ru: 'en',
      he: 'en',
      'pt-PT': 'en',
      nl: 'en',
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
