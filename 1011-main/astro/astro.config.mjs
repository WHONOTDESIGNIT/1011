import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
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
    },
  },
});
