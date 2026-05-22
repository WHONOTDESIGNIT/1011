# Breadcrumb Navigation Audit

## Scope

This document summarizes the breadcrumb navigation implementation across the project, including:

- The shared breadcrumb component behavior
- Where breadcrumbs are used
- The current data patterns
- Inconsistencies and risks found during review

## Core Implementation

### Shared UI Component

The main shared breadcrumb component is:

- `astro/src/components/Breadcrumb.astro`

It accepts:

```ts
interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
  locale?: string;
}
```

### Behavior

The shared breadcrumb component provides:

- Desktop breadcrumb links
- Mobile dropdown behavior for breadcrumb items that have sub-navigation
- Overlay + slide-down navigation panel on mobile
- Click-outside and `Escape` handling

### Sub-navigation Dependency

The breadcrumb component depends on:

- `getSubNavigation()` from `astro/src/lib/navigation-data.ts`

This means breadcrumb items with `href` may expose deeper navigation on mobile if sub-navigation data exists for that path.

## Primary Navigation Interaction

The main top-level navigation implementation is:

- `astro/src/layouts/BaseLayout.astro`

The shared sub-navigation data source is:

- `astro/src/lib/navigation-data.ts`

### Relationship to Breadcrumbs

There are two parallel navigation systems in the project:

- the global primary navigation in the header
- the contextual breadcrumb navigation inside inner pages

They are not rendered by the same component, but they reflect the same section model:

- `home`
- `products`
- `components`
- `catalogue`
- `services`
- `about`
- `contact`
- `clients`
- `blog`
- `faq`

This is important because:

- the breadcrumb component uses `getSubNavigation()` for mobile sub-navigation exposure
- the header dropdown model also expresses the same parent-child page relationships

## Current Navigation Structure (as of latest update)

The header navigation is defined in `BaseLayout.astro` and matches the `breadcrumb.md` specification.

### First-Level Navigation Items

| # | Item | Type | href | Dropdown |
|---|------|------|------|----------|
| 1 | **Home** | Link | `/` | — |
| 2 | **IPL Products** | Link | `/products` | — (no dropdown, no chevron) |
| 3 | **IPL Components** | Link | `/components` | — (no dropdown, no chevron) |
| 4 | **Catalogue** | Dropdown | `#` | productLinks (11 items) |
| 5 | **Service & Support** | Dropdown | `#` | servicesLinks (5 items) |
| 6 | **About** | Dropdown | `#` | aboutDropdownLinks (8 items) |
| 7 | **Contact** | Link | `/contact` | — (no dropdown, no chevron) |

### Dropdown Details

#### Catalogue Dropdown (`productLinks`)

Contains all IPL product sub-items (previously under IPL Products):

1. IPL Products (overview) → `/products`
2. Sapphire Ice Feeling → `/products/sapphire`
3. Hestia → `/products/hestia`
4. Alpha → `/products/alpha`
5. Emerald → `/products/emerald`
6. Euno → `/products/euno`
7. Themis → `/products/themis`
8. Metis → `/products/metis`
9. Hebe → `/products/hebe`
10. Eirene → `/products/eirene`
11. Golden Luxury → `/products/wooden`

#### Service & Support Dropdown (`servicesLinks`)

1. Service & Support (overview) → `/services`
2. OEM/ODM Services → `/services/oem-odm`
3. Product Design → `/services/product-design`
4. Production & Assembly → `/services/production-assembly`
5. Packaging & Logistics → `/services/packaging-logistics`

#### About Dropdown (`aboutDropdownLinks`)

1. About (overview) → `/about`
2. Brand Story → `/about/brand-story`
3. Company Profile → `/about/company-profile`
4. Manufacturing Capabilities → `/about/manufacturing-capabilities`
5. Quality Control → `/about/quality-control`
6. Clients → `/clients`
7. Blog → `/blog`
8. FAQ → `/faq`

### Interaction Behavior (Desktop)

- **Dropdown trigger**: JavaScript-driven `mouseenter`/`mouseleave`
- **Hover zone**: The entire container (trigger text + dropdown panel area)
- **Open**: `mouseenter` on container → panel fades in with scale-up animation
- **Close**: `mouseleave` from container after an 80ms debounce delay
- **Chevron**: Rotates 180° when dropdown is open
- **Color**: Trigger text turns `text-sky-600` (theme blue) on hover/open
- **Panel animation**: `opacity` + `scale` transition, 200ms duration

### Interaction Behavior (Mobile)

- Mobile uses a native responsive layout (nav wraps)
- No mobile hamburger menu currently implemented

## SEO Implementation

Breadcrumb structured data is generated through:

- `src/lib/seo/structured-data.ts`

Function:

```ts
getBreadcrumbSchema(items, locale)
```

This function is widely used across pages to output `BreadcrumbList` JSON-LD for SEO.

## Homepage

The homepage file is:

- `astro/src/pages/[locale]/index.astro`

The homepage does **not** render a visible breadcrumb component.

## Page-Level Breadcrumb Trails

The following breadcrumb trails reflect the current page hierarchy.

### Homepage

No breadcrumb rendered (root page).

### Products Index

```
Home → IPL Products
```

- `/products`

### Product Detail

```
Home → IPL Products → {product name}
```

- `/products/sapphire`
- `/products/hestia`
- `/products/alpha`
- `/products/emerald`
- `/products/euno`
- `/products/themis`
- `/products/metis`
- `/products/hebe`
- `/products/eirene`
- `/products/wooden`

### Components Index

```
Home → IPL Components
```

- `/components`

### Component Detail

```
Home → IPL Components → {component name}
```

- `/components/lamp-cartridges`
- `/components/optical-filters`
- `/components/cooling-system`
- `/components/power-supply`

### Services Index

```
Home → Service & Support
```

- `/services`

### Service Detail

```
Home → Service & Support → {service name}
```

- `/services/oem-odm`
- `/services/product-design`
- `/services/production-assembly`
- `/services/packaging-logistics`

### About Pages

```
Home → About → {subsection}
```

- `/about/brand-story`
- `/about/company-profile`
- `/about/manufacturing-capabilities`
- `/about/quality-control`

### Clients Index

```
Home → About → Clients
```

- `/clients`

### Client Detail

```
Home → About → Clients → {client name}
```

- `/clients/roseskin-ipl`
- `/clients/costco-canada-ipl`
- `/clients/ku2-ipl`
- `/clients/happyskinco-ipl`

### Blog

```
Home → About → Blog
```

- `/blog`

### Blog Article

```
Home → About → Blog → {article title}
```

- `/blog/*`

### FAQ

```
Home → About → FAQ
```

- `/faq`

### Contact

```
Home → Contact
```

- `/contact`

### Media

```
Home → Media
```

- `/media`

## Data Source

### Header Navigation

Data is hardcoded in `BaseLayout.astro` as inline arrays:

- `productLinks` — 11 items (products overview + 10 product pages)
- `componentsLinks` — 5 items (components overview + 4 component pages)
- `servicesLinks` — 5 items (services overview + 4 service pages)
- `aboutDropdownLinks` — 8 items (about overview + 4 about subsections + clients + blog + faq)

### Breadcrumb Sub-Navigation

Provided by `getSubNavigation(locale, path)` in `astro/src/lib/navigation-data.ts`.

Section map:

| Route | Sub-navigation Items |
|-------|---------------------|
| `/products` | All product pages (Sapphire, Hestia, Alpha, etc.) |
| `/components` | Components overview + Lamp Cartridges, Optical Filters, Cooling System, Power Supply |
| `/services` | Services overview + OEM/ODM, Product Design, Production Assembly, Packaging & Logistics |
| `/about` | About overview + Brand Story, Company Profile, Manufacturing Capabilities, Quality Control |
| `/clients` | Clients overview + Costco Canada, RoseSkinCo, KU-2 Cosmetic, HappySkinCo |
| `/blog` | Blog index |
| others | Empty (no sub-navigation) |

## Current Strengths

- Navigation structure matches the `breadcrumb.md` specification
- Dropdown hover zone covers both trigger and panel for forgiving UX
- Theme blue (`text-sky-600`) hover state provides clear visual feedback
- Chevron rotation gives affordance for expandable items
- All pages have breadcrumb UI with locale-aware links

## Known Inconsistencies

### 1. Footer Navigation Not Synced

The footer section structure in `BaseLayout.astro` does not fully mirror the header navigation:

- Footer still lists IPL products as a section with sub-links
- Footer lists IPL Components Catalogue as a section (label not updated to "IPL Components")
- Footer does not have a Catalogue section
- The footer reflects an older navigation model

### 2. Header Data vs Breadcrumb Data

- Header nav data is hardcoded in `BaseLayout.astro`
- Breadcrumb sub-navigation comes from `astro/src/lib/navigation-data.ts`
- These two sources may drift over time

### 3. Blog in About

- Blog is listed under About in the header dropdown
- Breadcrumb trails show `Home → About → Blog`
- This may not be intuitive for all users

## Suggested Cleanup Priorities

### P0

- Sync footer navigation to match the new header structure (add Catalogue section, update labels)

### P1

- Centralize navigation data into a single source of truth (e.g., `lib/navigation-data.ts`)
- Ensure dropdown labels and breadcrumb labels use the same translation keys
- Add FAQ route support in `getSubNavigation()` for breadcrumb mobile panel

### P2

- Standardize all breadcrumb labels through translation files
- Ensure current page item is non-clickable everywhere
- Remove `href: "#"` from terminal breadcrumb items

## Quick Reference

### Shared Component

- `astro/src/components/Breadcrumb.astro`

### Header Layout

- `astro/src/layouts/BaseLayout.astro`

### SEO Schema Generator

- `src/lib/seo/structured-data.ts`

### Navigation Data

- `astro/src/lib/navigation-data.ts`
- `lib/navigation-data.ts`

## Conclusion

The project has a consistent navigation structure that aligns with the `breadcrumb.md` specification. The main areas for future improvement are footer synchronization and data centralization.
