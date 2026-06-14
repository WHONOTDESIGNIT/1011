---
name: "blog-layout-playbook"
description: "Builds and updates blog post/list layouts in this Astro site. Invoke when editing article templates, blog archive pages, MDX presentation, CTA blocks, or blog typography."
---

# Blog Layout Playbook

Use this skill when working on blog page layout, article template structure, blog archive presentation, or MDX content styling in this workspace.

## Purpose

This skill distills the current blog layout system used in the Astro site and keeps future blog layout changes aligned with the existing visual language, spacing rhythm, content hierarchy, and SEO structure.

## Current Source Of Truth

Treat these files as the primary references before making changes:

- `astro/src/pages/blog/[slug].astro`
- `astro/src/pages/blog/index.astro`
- `astro/src/pages/[locale]/blog/[slug].astro`
- `astro/src/pages/[locale]/blog/index.astro`
- `astro/src/layouts/BaseLayout.astro`

## Core Layout Pattern

For a blog detail page, preserve this order unless there is a strong reason to change it:

1. `BaseLayout` with `type="article"` and canonical URL
2. Breadcrumb navigation
3. Category label
4. Strong H1 headline
5. Short excerpt / dek
6. Author and publish date row
7. Citable summary block
8. Optional hero image
9. Main article body in a narrower reading column
10. Mid-to-late page CTA block
11. Related articles section

For a blog archive page, preserve this order:

1. Hero / intro section
2. Citable summary block
3. Archive intro copy
4. Search and category filters
5. Featured article area
6. Regular article grid
7. Empty state
8. Load more interaction

## Visual System

Follow the current site language:

- Rounded corners are generous, usually `rounded-2xl` or larger
- Cards use light borders plus soft shadows
- Blog archive hero uses dark gradient backgrounds
- Reading areas use clean white or very light slate backgrounds
- Primary text is dark slate; secondary text is lighter slate
- CTA blocks use high contrast, usually dark background with white text

Do not introduce a different blog-only design language unless explicitly requested.

## Reading Width Rules

Use two widths:

- Outer article shell: around `max-w-5xl`
- Main prose column: around `max-w-3xl`

This keeps metadata and supporting modules visually rich while preserving comfortable reading width for long-form content.

## Typography Rules

For article body styling, keep the current `.blog-content` behavior:

- Paragraph text is slightly larger than default body text
- H1/H2/H3/H4 have clear margin rhythm and tighter tracking
- Paragraphs use generous line-height
- Lists are compact but readable
- Blockquotes are simple and restrained
- Tables must remain horizontally scrollable
- Inline code uses soft background chips
- Code blocks use dark background and rounded corners
- Images and figures get rounded treatment and breathing room

If moving styles into a shared file later, preserve the same visual output.

## Component Behavior

### Breadcrumb

- Keep breadcrumbs above the article title
- Use the dark variant when placed on dark surfaces

### Metadata Row

- Prefer author avatar if available
- Fall back to an initial badge if no avatar exists
- Keep author label, author name, and date cleanly separated

### Citable Summary

- Include a short scannable summary block near the top
- Use explicit heading structure
- Write it like a reference-ready explainer, not marketing fluff

### Hero Image

- Show it only when post metadata includes an image
- Keep aspect ratio consistent and crop cleanly

### CTA Block

- Place after the article body
- Keep one primary CTA and one secondary CTA
- Center align content
- Use concise, action-driven text

### Related Articles

- Show only when related posts exist
- Use consistent card layout with image, category, title, excerpt, and CTA
- Keep cards visually lighter than the main CTA block

## Archive Interaction Rules

When editing the archive page:

- Search, filters, featured post, grid, and empty state must stay in sync
- Keep the initial visible count pattern for pagination-like expansion
- Preserve server-rendered content source plus client-side filtering
- Prefer simple inline scripts if matching current architecture
- Avoid adding heavy client frameworks unless clearly needed

## SEO And Structured Data

For blog detail pages, preserve:

- Canonical URL
- Breadcrumb JSON-LD
- WebPage JSON-LD
- Article JSON-LD

For blog archive pages, preserve:

- Canonical URL
- Breadcrumb JSON-LD
- WebPage JSON-LD

Always keep URLs normalized to the project's trailing-slash standard.

## Internationalization Rules

When touching blog layout in localized pages:

- Keep structure identical between default and localized routes
- Route all UI strings through translation keys where practical
- Do not hardcode a new locale-specific layout unless explicitly requested
- If one locale file is updated, check whether the corresponding `[locale]` blog page should match

## Editing Checklist

Before finishing a blog layout task, verify:

- Heading hierarchy is logical
- Main body width remains readable
- CTA appears after content, not before it
- Related posts still render correctly
- Empty and filtered archive states still work
- Structured data remains valid
- Canonical and internal links use normalized URLs
- Visual rhythm matches the rest of the site

## Preferred Implementation Strategy

1. Read the current blog detail and archive pages first
2. Reuse the existing card and section patterns
3. Keep layout concerns separate from content concerns
4. Move duplicated blog-specific style only when reuse is clear
5. Avoid unnecessary abstraction if only one article template exists

## When To Refactor

Refactor into shared blog components only if at least one of these is true:

- The detail layout is edited in both default and localized routes
- The same CTA or related card markup is duplicated in multiple places
- The `.blog-content` style block needs to be reused beyond one page
- Archive and article modules are drifting apart visually

## Anti-Patterns

Avoid these unless explicitly requested:

- Ultra-narrow reading columns that hurt table and image display
- Full-width paragraphs with no reading restraint
- Heavy animation inside article pages
- Multiple competing CTA sections
- Bright marketing banners above the article title
- Inconsistent heading sizes between archive and detail pages
- Introducing a new markdown renderer style unrelated to existing output

## Output Expectation

When using this skill, produce blog layout changes that feel like a natural continuation of the current Astro implementation: editorial, readable, conversion-aware, SEO-safe, and visually aligned with the site's existing product-marketing style.
