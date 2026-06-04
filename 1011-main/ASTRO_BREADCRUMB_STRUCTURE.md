# Astro Breadcrumb Navigation Structure

## Hierarchy

Source: `breadcrumb.md`

```
Home (root)
├── IPL Products (first-level)
│   └── IPL Components Catalogue (sub-item)
├── Catalogue (first-level)
├── Service & Support (first-level)
├── About (first-level)
│   ├── Clients (sub-item)
│   └── FAQ (sub-item)
└── Contact (first-level)
```

---

## Overview

The breadcrumb system in the Astro project consists of three layers:

1. **Data layer** — `lib/breadcrumbs.ts` (build breadcrumb items array)
2. **Navigation layer** — `lib/navigation-data.ts` (sub-navigation / Explore data)
3. **Presentation layer** — `components/Breadcrumb.astro` (UI rendering)

All breadcrumb labels are locale-aware via `t(locale, 'key')` from `lib/i18n.ts`.

---

## Data Architecture

### BreadcrumbItem

```ts
type BreadcrumbItem = {
  label: string;    // display text (localized)
  href?: string;    // omit for current page item
};
```

### buildBreadcrumbs()

```ts
buildBreadcrumbs(locale: string, items: BreadcrumbInput[]): BreadcrumbItem[]
```

Accepts an array of `{ label, path? }` and returns `{ label, href? }`.
If `path` is provided, it's converted to a locale-prefixed URL via `getLocalizedPath()`.
If `path` is omitted (current page), `href` is undefined and the item is rendered as plain text.

### getLocalizedPath()

```ts
getLocalizedPath(locale: string, path = '/'): string
```

- `/` → `/{locale}`
- `/products` → `/{locale}/products`
- `/blog/some-article` → `/{locale}/blog/some-article`

---

## Component: Breadcrumb.astro

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | required | The breadcrumb trail |
| `variant` | `'light' \| 'dark'` | `'light'` | Color variant |
| `locale` | `string` | `'en'` | Current locale |
| `class` | `string` | `''` | Additional CSS classes |

### Rendering

#### Desktop (`md:` and above)

```
Home  /  About  /  Brand Story
^text ^/  ^text   ^/  ^bold
```

- Pure inline text layout — no pill/shape backgrounds
- Ancestors: `text-slate-500` (light) / `text-white/60` (dark)
- Current page: `font-semibold text-slate-900` (light) / `font-semibold text-white/95` (dark)
- Separator: `/` in `text-slate-300` / `text-white/30`
- `overflow-x-auto whitespace-nowrap` supports long paths without wrapping

#### Mobile (below `md:`)

A trigger button showing the current page label + dropdown chevron.
On tap, opens a centered overlay panel with:

1. **Breadcrumb** — full trail with ancestor links and current page highlighted
2. **Explore** — sub-navigation links for the current section (if any)

Overlay interactions:

- `Escape` key closes
- Clicking the backdrop closes
- Clicking **Close** button closes
- Body scroll is locked while open

### Variants

Two UI variants controlled by the `variant` prop:

| Token | Light | Dark |
|-------|-------|------|
| ancestor text | `text-slate-500` | `text-white/60` |
| ancestor hover | `hover:text-slate-800` | `hover:text-white/90` |
| current text | `font-semibold text-slate-900` | `font-semibold text-white/95` |
| separator | `text-slate-300` | `text-white/30` |
| mobile button | `border-slate-200 bg-white` | `border-white/10 bg-white/5` |
| overlay panel | `border-slate-200 bg-white` | `border-white/10 bg-slate-950` |
| subnav link | `text-slate-600 hover:bg-slate-50` | `text-white/80 hover:bg-white/10` |

---

## Sub-Navigation (Explore)

### Data source

`lib/navigation-data.ts` → `getSubNavigation(locale, href)`

Returns an array of `NavigationLink[]` for the current section.
Used in the mobile overlay **Explore** section to let users navigate sibling/child pages.

### Section map

| Route | Explore items |
|-------|---------------|
| `/products` | All product pages (Sapphire, Hestia, Alpha, Emerald, Euno, Themis, Metis, Hebe, Eirene, Wooden) |
| `/components` | Components overview + Lamp Cartridges, Optical Filters, Cooling System, Power Supply |
| `/services` | Services overview + OEM/ODM, Product Design, Production Assembly, Packaging & Logistics |
| `/about` | About overview + Brand Story, Company Profile, Manufacturing Capabilities, Quality Control |
| `/clients` | Clients overview + Costco Canada, RoseSkinCo, KU-2 Cosmetic, HappySkinCo |
| `/blog` | Blog index |
| others | Empty (no explore sub-navigation) |

---

## Page-Level Breadcrumb Trails

The breadcrumb trails below reflect the target hierarchy from `breadcrumb.md`.

### Homepage

No breadcrumb rendered (root page).

### IPL Products

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/products` | `Home / IPL Products` |
| `/{locale}/products/{slug}` | `Home / IPL Products / {product name}` |

### IPL Components Catalogue

Components reside under IPL Products in the hierarchy.

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/components` | `Home / IPL Products / IPL Components Catalogue` |
| `/{locale}/components/{slug}` | `Home / IPL Products / IPL Components Catalogue / {component name}` |

### Catalogue

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/catalogue` (future) | `Home / Catalogue` |

### Service & Support

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/services` | `Home / Service & Support` |

### About

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/about` | `Home / About` |
| `/{locale}/about/brand-story` | `Home / About / Brand Story` |
| `/{locale}/about/company-profile` | `Home / About / Company Profile` |
| `/{locale}/about/manufacturing-capabilities` | `Home / About / Manufacturing Capabilities` |
| `/{locale}/about/quality-control` | `Home / About / Quality Control` |

### Clients (under About)

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/clients` | `Home / About / Clients` |
| `/{locale}/clients/{slug}` | `Home / About / Clients / {client name}` |

### FAQ (under About)

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/faq` | `Home / About / FAQ` |

### Contact

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/contact` | `Home / Contact` |

### Media

Media is not explicitly placed in `breadcrumb.md`. Current placement:

| Page | Breadcrumb trail |
|------|-----------------|
| `/{locale}/media` | `Home / Media` |

---

## Usage Summary

All pages that render breadcrumbs use the same shared `<Breadcrumb>` Astro component.

```
pages/[locale]/
├── blog/                          # under About (implied)
├── products/                      # under IPL Products
├── clients/                       # under About
├── components/                    # under IPL Products > IPL Components Catalogue
├── about/                         # first-level
├── services/                      # under Service & Support
├── contact/                       # first-level
├── faq/                           # under About
└── media/                         # standalone (not in breadcrumb.md)
```

---

## Convention Rules

1. **Ancestor items always include `href`**
2. **Current page item never includes `href`**
3. **Reusable labels come from translation keys** (`t(locale, 'nav.products')`, `t(locale, 'common.home')`, etc.)
4. **Only dynamic entity names are hardcoded** (article title, product name, client name)
5. **All pages use the same `<Breadcrumb>` component** — no split UI systems
6. **SEO JSON-LD is generated alongside the UI** in most pages (blog index, blog detail)

---

## File Locations

| File | Purpose |
|------|---------|
| `src/components/Breadcrumb.astro` | Shared UI component |
| `src/lib/breadcrumbs.ts` | `BreadcrumbItem` type, `buildBreadcrumbs()`, `getLocalizedPath()` |
| `src/lib/navigation-data.ts` | `getSubNavigation()` — Explore section data |
| `src/lib/i18n.ts` | `t()` localization function |
| `messages/en.json` | Translation strings (`common.home`, `nav.*`) |
| `breadcrumb.md` | Source hierarchy definition |
