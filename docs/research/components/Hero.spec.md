# Hero Section — Component Spec

> Adapted from Develo Design (www.develodesign.co.uk) for iShine IPL Manufacturing

## Source Reference
- Develo class: `.hero-section` → `.hero-wrapper` → `.hero-content-card`
- Animation: `fadeIn` 0.8s ease-out forwards (on `.hero-content-card`)
- Background: Full-viewport background with overlay (Develo uses video; iShine uses image via `<picture>`)

## Structure
```
.hero-section (relative, min-height: 660px / 100vh)
  .hero-wrapper (relative, flex, max-width: 1280px, mx-auto)
    .hero-bg-media (absolute inset-0)
      <picture> with responsive sources (AVIF/WebP)
      .hero-overlay (absolute inset-0, gradient overlay)
    .hero-content-card (relative z-10, max-width: 730px, animation: fadeIn)
      .hero-badge (small uppercase label)
      h1.hero-heading (main headline — Syne 62px)
      p.hero-description (subtitle — Manrope 18px)
      .hero-actions (flex, gap, CTAs)
        a.hero-btn-primary (pill, #563cfa bg)
        a.hero-btn-secondary (pill, outline)
```

## Design Tokens

### Typography
| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| .hero-badge | Manrope | 14px | 600 | 20px | 0.08px |
| .hero-heading | Syne | 62px (desktop) / 40px (mobile) | 400 | 68px | -0.61px |
| .hero-description | Manrope | 18px | 400 | 28px | 0 |
| .hero-btn | Manrope | 16px | 500 | 24px | 0 |

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| --color-neutral-black | #020303 | Heading text, outline CTA border/text |
| --color-neutral-white | #ffffff | Badge text, primary CTA text |
| --color-brand-primary-blue | #563cfa | Primary CTA background |
| --color-neutral-grey-500 | #6b7380 | Description text |
| rgba(255,255,255,0.9) | — | Content card background (light overlay) |

### Spacing
- `.hero-section`: padding `24px 100px` (desktop) / `24px 20px` (mobile)
- `.hero-content-card`: margin-top `148px` (desktop) / `80px` (mobile)
- `.hero-actions`: gap `12px`

### Animation
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.hero-content-card { animation: fadeIn 0.8s ease-out forwards; }
```

### Responsive
- **≥1024px (desktop)**: Hero padding 100px sides, heading 62px, content card left-aligned
- **768-1023px (tablet)**: Padding 40px sides, heading 48px, reduced margin-top
- **<768px (mobile)**: Padding 20px sides, heading 32px, badge hidden, description hidden, CTAs stacked

## States
- **Default**: Background image visible with overlay, content visible with fadeIn animation on load
- **Mobile**: Simplified layout with only heading and CTA, full-width image

## Content (iShine)
- Badge: "iShine Technology"
- Heading: "Premium IPL Hair Removal Device Manufacturer"
- Description: "Custom design and production for major chains, global retailers, and beauty brands. From idea to market, we help you build certified, premium, retail-ready IPL products."
- Primary CTA: "Get a Free Sample" → /contact
- Secondary CTA: "Explore Products" → /products
