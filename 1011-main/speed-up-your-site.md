Audit this site for performance issues and fix them.

Priority areas: {{PRIORITY_AREAS}}

If no priority areas are specified, focus on images and caching — these have the biggest impact. Apply the following optimizations:

Images — Netlify Image CDN: Rewrite image src attributes to use Netlify’s built-in Image CDN:
/.netlify/images?url=<path>&w=<width>&fm=avif&q=80
. Add srcset with widths 400, 800, 1200 for responsive loading. Add loading="lazy" to below-the-fold images and fetchpriority="high" to the hero/LCP image. Add explicit width and height attributes to prevent layout shift. If any images use external URLs, add those domains to netlify.toml:

[images]
remote_images = ["https://example\\.com/.*"]
Caching — Netlify CDN headers: Add a [[headers]] section in netlify.toml. For static assets (images, fonts, CSS, JS with hashed filenames), set Cache-Control = "public, max-age=31536000, immutable". For HTML pages, set Netlify-CDN-Cache-Control = "public, max-age=0, stale-while-revalidate=86400" so the CDN serves stale content while revalidating. Netlify-CDN-Cache-Control is stripped before reaching the browser — it only controls the CDN layer.

Fonts: Add <link rel="preconnect"> for external font providers. Add font-display: swap to @font-face rules to prevent invisible text during loading.

JavaScript: Add defer to non-critical scripts. Move third-party scripts to the end of <body>.

Preloading: Add <link rel="preload"> for the hero image and primary font files.

Start with shared layouts and templates where changes affect every page, then check individual pages.

2. 添加 CDN 缓存头
在 project/astro/public/_headers 文件中添加：

/en/*
  Netlify-CDN-Cache-Control: public, max-age=0, stale-while-revalidate=86400
  Cache-Control: public, max-age=0, must-revalidate

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

3. 字体优化
在 BaseLayout.astro 的 <head> 中：

<!-- preconnect 外部字体 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- preload 主要字体文件 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />

CSS 中添加：

@font-face {
  font-display: swap; /* 防止字体加载时文字不可见 */
}



4. React 组件按需加载
你的项目用了 React 组件，把非首屏组件改为延迟加载：

<!-- 首屏以下的组件 -->
<ReactComponent client:visible />

<!-- 非关键组件 -->
<ReactComponent client:idle />



