import { defineConfig } from 'astro/config';

// i18n 最小原型配置：
// - defaultLocale: en（无 URL 前缀，与主站现有 /en/* 301 重定向兼容）
// - locales: en + tr（土耳其语作为第二语言）
// - prefixDefaultLocale: false → 英文页为 /about，土耳其语页为 /tr/about
// - fallback: tr → en → /tr/xxx 未翻译时回落英文内容
export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'tr'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      tr: 'en',
    },
  },
});
