---
name: "trailing-slash-link-guard"
description: "Enforces trailing slashes on structural links and canonical URLs. Invoke when editing routes, hrefs, sitemap entries, JSON-LD URLs, or rel=canonical tags."
---

# Trailing Slash Link Guard

Use this skill whenever URL-related code is added or changed.

## Goal

Keep one canonical URL format across the site:

- Directory-like routes must end with `/`
- `rel="canonical"` URLs must end with `/`
- Structured data URLs must end with `/`
- Internal navigation links to directory-like pages must end with `/`
- Sitemap URLs must end with `/`

## Apply These Rules

1. Treat paths like `/products`, `/blog`, `/contact`, `/products/lumi` as directory-like URLs.
2. Convert those paths to `/products/`, `/blog/`, `/contact/`, `/products/lumi/`.
3. Do not add `/` to file assets such as `.js`, `.css`, `.xml`, `.png`, `.jpg`, `.webp`, `.pdf`.
4. Preserve query strings and hashes:
   - `/products?page=2` -> `/products/?page=2`
   - `/products#specs` -> `/products/#specs`
5. When a framework helper already exists for URL normalization, reuse it instead of duplicating logic.
6. When a non-slashed route is publicly accessible, add a `301` redirect to the slashed version.

## Must Check

- `href` values in layout, nav, footer, CTA, breadcrumbs
- `rel="canonical"` values
- Open Graph and Twitter URL fields
- JSON-LD fields such as `url`, `item`, `@id`
- Sitemap URL generation
- Redirect rules and middleware rewrites

## Review Checklist

- Only one public URL version exists for each directory-like page
- Internal links point to the slashed version
- Canonical points to the slashed version
- Structured data points to the slashed version
- Sitemap outputs the slashed version
- Redirects use `301` from non-slashed to slashed URLs

## Example

Bad:

```html
<link rel="canonical" href="https://example.com/products" />
<a href="/products">Products</a>
```

Good:

```html
<link rel="canonical" href="https://example.com/products/" />
<a href="/products/">Products</a>
```

## Preferred Workflow

1. Search for URL builders and normalization helpers first.
2. Update shared helpers before touching scattered page code.
3. Fix route redirects or middleware if both slashed and non-slashed URLs resolve.
4. Re-scan for remaining non-slashed canonical or structured URLs.
5. Validate sitemap, diagnostics, and any relevant build output.
