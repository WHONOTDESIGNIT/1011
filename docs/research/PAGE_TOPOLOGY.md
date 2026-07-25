# Page Topology — www.develodesign.co.uk

## Overview
- **URL:** https://www.develodesign.co.uk/
- **Title:** "Magento Agency for High Performance eCommerce | Develo | Birmingham"
- **Tech:** Built with a design system using CSS custom properties (Figma-generated variables)
- **Fonts:** Syne (display/headings) + Manrope (body) — both from Google Fonts

## Page Layout
- Full-width sections stacked vertically
- Fixed header (navigation bar) at top
- Hero section has a background video
- Dark theme sections alternate with light theme
- Footer at bottom with CTA

## Section Map (top to bottom)

### 1. Header / Navigation
- **Type:** Fixed at top
- **Elements:** Logo, nav links (Services, Work, About, Resources), "Get in touch" CTA button
- **Behavior:** Mobile hamburger menu (`menu-toggle`), submenu toggles for mobile nav
- **Transition:** 0.2s on hover states
- **Classes:** `nav-link`, `cta-link`, `btn-base btn-primary-dark with-icon`

### 2. Hero Section
- **Type:** Full viewport hero
- **Class:** `hero-section`
- **Heading (h1):** "UK Magento Agency: Adobe | Hyvä"
- **Heading (h2):** "Building High-Performing eCommerce for Ambitious Brands"
- **CTAs:** "What we do" (link), "Book a call" (link)
- **Animation:** `fadeIn` 0.8s ease-out forwards on `.hero-content-card`
- **Video:** Background video with Pause button
- **Classes:** `hero-wrapper`, `hero-content-card`, `hero-video`

### 3. USP Accordion Section — "What we do"
- **Type:** Accordion / expandable content
- **Heading (h2):** "Designing & developing eCommerce stores that scale"
- **Sub-heading:** "What we do"
- **Items:** Accordion with `accordion-header` + `accordion-content`
  - "Maintain or Fix My Site" — default active
  - "Find a Technology Partner"
  - "Optimise My Store"
  - "Build a New Site"
- **Class:** `usp-accordion-bleed`
- **Interaction Model:** Click-driven (accordion toggle)

### 4. Clients Section — "Clients we work with"
- **Type:** Dark theme logo grid/marquee
- **Class:** `our-clients-section theme-dark`
- **Heading:** "Clients we work with"
- **Sub-text:** "From premium retailers to fast growing independents."
- **Interaction Model:** Static (logos display)

### 5. Stats / Results Section — "Real results for leading brands"
- **Type:** Stat cards
- **Class:** `stat-cards-section`
- **Heading:** "Real results for leading brands"
- **Content:** Metric cards showing real results
- **Interaction Model:** Static

### 6. Expertise / Logos Section — "Our expertise"
- **Type:** Dark theme with tech platform logos
- **Class:** `hero-content-logos bg-black text-white variation-content`
- **Heading:** "Our expertise"
- **Sub-heading:** "Specialists in Magento, Adobe Commerce & Hyvä development"
- **Interaction Model:** Static

### 7. Work / Portfolio Section — "Explore our client stories"
- **Type:** Card grid / portfolio
- **Class:** `our-work-section`
- **Heading:** "Our work"
- **Sub-heading:** "Explore our client stories"
- **Content:** Case study / project cards
- **Interaction Model:** Static (with hover effects)

### 8. Testimonial Carousel Section
- **Type:** Carousel / slider
- **Class:** `testimonial-carousel-section carousel-mode`
- **Heading:** None (text quote displayed)
- **Content:** Client testimonial text
- **Interaction Model:** Time-driven or click-driven carousel

### 9. Footer
- **Type:** Full-width footer with CTA
- **Class:** `footer`
- **Heading:** "Ready to start your project?"
- **Sub-text:** "We'd love to help you make it fast, scalable, and beautiful."
- **CTA:** "Get in touch" link
- **Additional:** Navigation links, social links, legal info

## Design Tokens Summary

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-primary-blue` | `#563cfa` | Primary brand, CTA buttons, links |
| `--color-neutral-black` | `#020303` | Body text, dark backgrounds |
| `--color-neutral-white` | `#ffffff` | White backgrounds |
| `--color-neutral-grey-100` | `#f3f4f6` | Light grey sections |
| `--color-brand-blue-400` | `#4a62d3` | Secondary blue |
| `--color-brand-cream-50` | `#f8f2e8` | Cream/off-white sections |

### Typography
| Family | Usage | Weights |
|--------|-------|---------|
| **Syne** | Display (D1-D3), Headings (H1-H4+) | 400, 500, 600, 700 |
| **Manrope** | Body, small, captions | Variable (used as sans-serif) |

### Spacing
- Design system uses standard spacing units (likely 4px or 8px base)
- Sections have generous vertical padding

## Responsive Behavior
- **Desktop (1440px):** Multi-column layout, horizontal nav, large hero
- **Mobile (390px):** Single column, hamburger menu, stacked sections
- **Tablet:** Test at 768px for breakpoint specifics

## Interaction Model Summary
| Section | Model | Details |
|---------|-------|---------|
| Navigation | Click-driven + Hover | Dropdown menus, hover effects (0.2s transition) |
| Hero | Static (with video) | Background video with play/pause button |
| USP Accordion | Click-driven | Accordion with expand/collapse |
| Clients | Static | Logo display |
| Stats | Static | Card metrics |
| Expertise | Static | Tech logo display |
| Work/Portfolio | Static (with hover) | Card grid |
| Testimonials | Likely time-driven | Carousel with auto-rotation |
| Footer | Static | Links, CTA |
