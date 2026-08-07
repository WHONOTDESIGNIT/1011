# Trust Bar Specification

## Overview
- **Target file:** `src/pages/develo-clone.astro` (inline CSS in `<style>`)
- **Screenshot:** `docs/design-references/original-trustbar.png`
- **Interaction model:** time-driven (auto-cycle every 3s, hard cut)

## DOM Structure
```
.trust-bar (container, fixed)
  .trust-bar-inner (relative position wrapper)
    .trust-slide (one visible at a time)
      img.trust-icon (logo/badge, variable size)
      .trust-text (text label)
```

## Computed Styles (exact from original at 2560px viewport)

### Container: `.trust-bar`
- display: flex; flex-direction: row
- justify-content: center; align-items: center
- height: 60px
- width: 100%
- position: fixed; top: 0; z-index: 100
- background: transparent

### Slide wrapper: `.trust-slide`
- display: flex; flex-direction: row
- justify-content: center; align-items: center
- gap: 8px
- padding: 12px 24px

### Text: `.trust-text`
- fontFamily: Manrope, sans-serif
- fontSize: 16px
- fontWeight: 400
- lineHeight: 25px
- color: #020303

### Icon: `.trust-icon`
- Display varies per slide:
  - Google logo: 24×24px (natural: 48×48, rendered at width=24)
  - Magento logo: 86×22px (natural: 160×41, rendered at width=86)
  - Adobe Commerce logo: 86×22px (natural: 160×41, rendered at width=86)
  - Hyvä badge: 41×30px (natural: 82×60, rendered at width=41)
  - UK-Based (no icon, text only)

## States and Behaviors

### Auto-cycle
- **Trigger:** setInterval every 3000ms
- **Transition:** hard cut (display:none / display:flex)
- **Order:** 4.9 on Google → Certified Developers → Adobe Solution Specialists → Gold Hyvä Partner → Meet In Person UK-Based Team → (loop)

## Content (verbatim)

| # | Text | Icon | Icon Src |
|---|------|------|----------|
| 1 | "4.9 on Google" | Google logo (24×24) | `.../5e7960fcf3874d79b0044b83cbbeb159?format=webp&width=48` |
| 2 | "Certified Developers" | Magento logo (86×22) | `.../07d334c8905d4daab48e0b7b46b628e8?format=webp&width=160` |
| 3 | "Adobe Solution Specialists" | Adobe Commerce logo (86×22) | `.../799c4d68367946589998009159cdf3e5?format=webp&width=160` |
| 4 | "Gold Hyvä Partner" | Hyvä badge (41×30) | `.../56a29cca00e345fc85111a634d82ac1b?format=webp&width=82` |
| 5 | "Meet In Person UK-Based Team" | (none) | N/A |

## Responsive
- Same height (60px) at all breakpoints
- Slides same padding/gap at all breakpoints
