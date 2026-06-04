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