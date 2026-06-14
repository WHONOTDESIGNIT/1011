import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  trailingSlash: 'always',
  adapter: netlify({
    imageCDN: true,
  }),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja', 'es', 'fr', 'de', 'he', 'ru', 'tr', 'ar', 'ko', 'pt', 'it', 'nl', 'th', 'fa', 'pl', 'el', 'ro', 'id', 'hi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  image: {
    // External images use plain <img>, so no domains needed
  },
  integrations: [react({ include: ['**/react/*.tsx'] }), tailwind(), mdx()],
  vite: {
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});
