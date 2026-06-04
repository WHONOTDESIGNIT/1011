# Image Handling Standard

Image handling rules for this Astro + Netlify project.

## Prerequisites

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify({
    imageCDN: true,  // enabled by default
  }),
  image: {
    // No need to configure domains — external images use plain <img>
  },
});
```

## Rules

### Rule 1: External remote images → use plain `<img>` tag

Astro's `<Image />` component does not work reliably with external URLs. For images hosted on external domains (Imgur, Postimg, Unsplash, Pexels, etc.), use a plain `<img>` tag:

```astro
<!-- Hero section (full-width background) -->
<img
  src="https://i.imgur.com/fhOe2Nd.jpeg"
  alt=""
  loading="eager"
  class="absolute inset-0 h-full w-full object-cover"
/>

<!-- Who We Are section (content image) -->
<img
  src="https://i.postimg.cc/kBLjyHHT.jpg"
  alt=""
  loading="lazy"
  class="absolute inset-0 h-full w-full object-cover"
/>
```

### Rule 2: Blob images → migrate to `public/images/`

For images hosted on Netlify Blobs (`...netlify/functions/get-image?key=...`):

Download them and save to `public/images/`, then use as local images:

```
public/images/
├── hero/            # hero section images
├── products/        # product photos
├── blogs/           # blog post images
├── clients/         # client logos
├── about/           # about page images
└── services/        # service illustrations
```

### Rule 3: Local images in `public/` → use `<Image />`

```astro
---
import { Image } from 'astro:assets';
---

<Image
  src="/images/hero/home-about-ishine.webp"
  alt="About iShine"
  width={800}
  height={1000}
  loading="lazy"
/>
```

### Rule 4: SVGs and Lucide icons → keep plain

SVGs and icon components don't need image optimization:

```astro
<!-- SVG logo -->
<img src="/images/logos/costco-logo.svg" alt="Costco" width="120" height="40" />

<!-- Lucide icon (preferred for UI icons) -->
<Award size={22} strokeWidth={1.5} />
```
