# Header/Navigation Component Specification

## Overview
- **Target file:** `src/components/Header.astro`
- **Reference:** `www.develodesign.co.uk` — navbar styles and behavior
- **Content:** iShine's existing nav items, structure, and branding
- **Interaction model:** Click-driven (dropdown menus) + Hover effects

## Develo Reference Styles (exact computed values)

### Navbar Container
- `position: fixed` (iShine will use `sticky` for compatibility with existing layout)
- `top: 66px` (Develo has a trust-bar above; iShine will start at top=0)
- `z-index: 110`
- `height: 70px`
- `background-color: rgba(0, 0, 0, 0)` (transparent)
- `border-bottom: none`
- `box-shadow: none`

### Navbar Inner Container
- `display: flex`
- `align-items: center`
- `padding: 0 24px 0 40px`
- `gap: 40px`

### Logo Area
- `display: flex`
- `gap: 16px`
- iShine will keep its existing logo content (IS mark + "iShine IPL Manufacturing" text)

### Nav Links
- `font-family: Manrope, sans-serif`
- `font-size: 16px`
- `font-weight: 400`
- `color: #020303` (develo black)
- `padding: 16px`
- `transition: 0.2s`
- Hover: `color: #563cfa` (develo primary)

### CTA / "Get in Touch" Link
- `font-family: Manrope, sans-serif`
- `font-size: 16px`
- `font-weight: 400`
- `color: #563cfa`
- `background-color: transparent`
- `transition: color 0.2s, text-decoration-color 0.2s`

### Mobile Menu Toggle (below ~1024px)
- `display: none` on desktop
- `padding: 12px`
- Shows hamburger icon with `menu-toggle` class

## iShine Nav Items (content — unchanged)
1. Products (with dropdown: IPL Devices, Lumi 2, Venus, Lumi, Themis, Emerald, Alpha, Eirene, Golden)
2. Services (with dropdown: OEM/ODM, Logo Printing, Box Custom, Packaging, Product Design, Production Assembly, Dropshipping, User Manual)
3. About (Company Profile, Brand Story, Manufacturing Capabilities, Quality Control)
4. Resources (Blog, FAQ, Catalogue)
5. Contact

## Responsive Behavior
- **Desktop (≥1024px):** Horizontal nav with inline dropdowns on hover
- **Mobile (<1024px):** Hamburger menu toggle, full-screen overlay, accordion dropdowns

## States and Behaviors
### Nav link hover
- **Before:** `color: #020303`
- **After:** `color: #563cfa`
- **Transition:** `0.2s`

### Dropdown (desktop)
- **Trigger:** Hover on parent nav item
- **Appearance:** Panel fades in + scales up
- **Timing:** Show immediately, hide with 80ms delay
- **Panel:** Border, shadow, rounded, arrow indicator

### Mobile menu
- **Trigger:** Click hamburger button
- **Appearance:** Full-screen overlay slide-in
- **Close:** X button, backdrop click, Escape key
- **Dropdown:** Accordion expand/collapse within mobile panel
