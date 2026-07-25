# USP Accordion Section — Component Spec

> Adapted from Develo Design (www.develodesign.co.uk) for iShine IPL Manufacturing

## Source Reference
- Section ID: `#what-we-do-section`
- Develo class: `.usp-accordion-bleed` → `.accordion-header` / `.accordion-content`
- Heading: "Designing & developing eCommerce stores that scale" (Syne 38px)
- Interaction: Click-driven accordion, first item open by default

## Structure
```
section#usp-accordion-section (max-width: 1280px, mx-auto, px-6)
  .usp-header
    .usp-overline (small uppercase label — Manrope 14px, #563cfa)
    h2.usp-heading (Syne 38px-48px, #020303)
    p.usp-description (Manrope 18px, #4b5563)
  .usp-accordion
    .accordion-item (border-bottom: 0.67px solid #020303)
      .accordion-header (Manrope 16px, #020303, padding: 16px 0, cursor: pointer)
        span.accordion-number (optional, for numbering)
        span.accordion-label
        .accordion-icon (plus/minus or chevron)
      .accordion-content (max-height: 0 → auto via JS, overflow: hidden)
        p (Manrope 16px, #4b5563, line-height: 1.6)
```

## Design Tokens

### Typography
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| .usp-overline | Manrope | 14px | 600 | #563cfa |
| .usp-heading | Syne | 38px (desktop) / 28px (mobile) | 400 | #020303 |
| .usp-description | Manrope | 18px | 400 | #4b5563 |
| .accordion-header | Manrope | 16px | 400 | #020303 |
| .accordion-header.active | Manrope | 16px | 500 | #563cfa |
| .accordion-content | Manrope | 16px | 400 | #4b5563 |

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| --color-neutral-black | #020303 | Heading, accordion border |
| --color-brand-primary-blue | #563cfa | Overline, active state |
| --color-neutral-grey-600 | #4b5563 | Description, content text |

### Spacing
- Section padding: `80px 24px` (desktop) / `48px 20px` (mobile)
- Accordion header padding: `16px 0`
- Accordion content padding: `0 0 24px 0`
- Gap between items: `0px` (border-bottom separates)

### Animation
```css
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, opacity 0.3s ease;
  opacity: 0;
}
.accordion-content.active {
  max-height: 500px;
  opacity: 1;
}
.accordion-icon {
  transition: transform 0.3s ease;
}
.accordion-icon.active {
  transform: rotate(45deg);
}
```

### States
- **Default first item open**: First `.accordion-item` has `.active` on both header and content
- **Closed**: Content hidden via `max-height: 0; opacity: 0`
- **Open**: Content expanded via `max-height: 500px; opacity: 1`
- **Hover**: Header text color → #563cfa

### Responsive
- **≥1024px (desktop)**: Two-column: left heading + right accordion (1fr 1fr), gap 60px
- **<1024px**: Single column, heading on top, accordion below

## Content (iShine)
- Overline: "What We Do"
- Heading: "Full-service IPL manufacturing for global beauty brands"
- Description: "From concept to delivery, we partner with you at every stage of product development."
- Items:
  1. "OEM & ODM Manufacturing" — "Custom IPL device manufacturing tailored to your brand specifications. We handle everything from component sourcing to final assembly, with flexible MOQ options for startups and enterprise clients alike."
  2. "Product Design & Engineering" — "Expert industrial design and mechanical engineering for IPL devices. Our team creates 3D models, rapid prototypes, and production-ready designs that balance aesthetics, ergonomics, and performance."
  3. "Compliance & Certification" — "Navigate global regulatory requirements with confidence. We provide full documentation support for FDA 510(k), CE marking, ISO 13485, and MDSAP certification pathways."
  4. "Packaging & Logistics" — "End-to-end packaging design and global logistics management. From retail-ready packaging to FBA-compliant shipping, we ensure your products arrive on time and on budget."
