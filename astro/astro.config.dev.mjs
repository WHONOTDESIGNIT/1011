// Dev-only Astro config: avoids the @netlify/vite-plugin dev middleware that
// intercepts Astro's virtual module requests (?astro&type=style/script) and
// returns raw source files, which breaks every inline <script> in dev.
// Production build still uses astro.config.mjs (with the Netlify adapter).
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
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
