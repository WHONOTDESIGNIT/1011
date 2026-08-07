# Hero Section Specification

## Overview
- **Target file:** `src/pages/develo-clone.astro`
- **Screenshot:** `docs/design-references/original-hero.png`
- **Interaction model:** static with fadeIn animation on content card

## DOM Structure
```
<section.hero>
  <div.hero-wrapper>
    <div.hero-content-card>
      <div.hero-content>
        <div.small-title-wrapper>
          <h1.small-title>UK Magento Agency: Adobe | Hyvä</h1>
          <span>UK Magento Agency: Adobe | Hyvä</span>
        </div>
        <h2>Building High-Performing eCommerce for Ambitious Brands</h2>
        <div.hero-actions>
          <a.btn-primary>What we do</a>
          <a.btn-secondary>Book a call</a>
        </div>
      </div>
    </div>
    <div.video-container>
      <video autoplay loop muted playsinline poster="...">...</video>
    </div>
  </div>
</section>
```

## Computed Styles

### Section: `.hero`
- width: 100%
- min-height: auto
- padding: 24px 100px
- position: relative
- background: transparent

### Wrapper: `.hero-wrapper`
- max-width: 1280px, margin: 0 auto
- display: flex; flex-direction: column; gap: 32px; align-items: center

### Content Card: `.hero-content-card`
- width: 730px; max-width: 730px
- margin-top: 148px
- display: flex; flex-direction: row; align-items: flex-start

### Small Title Wrapper
- display: flex; gap: 12px; padding: 3px 12px

### Small Title H1
- fontFamily: Manrope; fontSize: 32px; fontWeight: 700; color: #000
- lineHeight: normal; margin: 0

### Small Title Inner Span
- fontFamily: Syne; fontSize: 21px; fontWeight: 400
- lineHeight: 27px; letterSpacing: -0.21px; color: #020303

### Main Heading H2
- fontFamily: Syne; fontSize: 62px; fontWeight: 400
- lineHeight: 68px; letterSpacing: -0.61px; color: #020303
- margin: 0

### Button Container: `.hero-actions`
- display: flex; gap: 12px

### btn-primary
- bg: #563cfa; color: #fff; padding: 12px 20px
- borderRadius: 100px; fontSize: 16px; lineHeight: 16px; gap: 6px
- hover: bg #374151, gap 16px

### btn-secondary
- bg: transparent; color: #020303; padding: 11px 20px
- borderRadius: 100px; border: 1px solid #020303
- hover: border #1f2937, bg rgba(2,3,3,.1)

### Video Container
- width: 1280px; height: auto; margin: -200px 0 0

## Responsive
- **max-width:1400px:** padding 16px 24px, heading 55px/61px, content-card margin 120px 0 0, video margin -160px 0 0, wrapper width 100%
- **max-width:1023px:** padding 16px 24px, min-height 560px, heading 40px/48px, small-title 24px, content-card margin 80px 0 0, max-width 100%, video margin -80px 0 0
- **max-width:767px:** padding 0 12px, min-height 694px, heading 38px/44px, content-card margin 160px 0 0, wrapper gap 24px
