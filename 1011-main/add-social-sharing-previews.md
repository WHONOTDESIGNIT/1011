Using your project's framework, add Open Graph and Twitter Card meta tags to every page on this site so links display a title and description when shared on social media, Slack, iMessage, and other platforms.

Site name: {{SITE_NAME}}
Site description: {{SITE_DESCRIPTION}}

Implement the following:

1. Add these meta tags to the HTML `<head>` of every page using a shared layout or component:
   - `og:title` — use the page title, falling back to the site name
   - `og:description` — use a page-level description, falling back to the site description
   - `og:url` — the canonical URL for each page
   - `og:type` — "website" for the homepage, "article" for blog posts
   - `twitter:card` — "summary" (not "summary_large_image" since there's no image yet)
   - `twitter:title`, `twitter:description`
2. Add a canonical URL `<link>` tag if one doesn't already exist.
3. Make sure there are no duplicate meta tags.
4. Do NOT add `og:image` or `twitter:image` tags yet — these require an actual image file. Instead, add a code comment explaining where to place a share image (recommended: `/public/og-image.png`, 1200x630px), which meta tags to add when it's ready, and that `twitter:card` should change to "summary_large_image" once an image exists. Tip: use Netlify Image CDN to serve the OG image at exact dimensions: `/.netlify/images?url=/og-image.png&w=1200&h=630&fit=cover&fm=png`.

Links shared without an image will still show the title and description on most platforms — just without a visual preview.