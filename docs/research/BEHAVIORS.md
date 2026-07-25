# Interaction Behaviors — www.develodesign.co.uk

> Documented from live site extraction via Chrome MCP

## Global Behaviors

### Smooth Scroll
- No smooth scroll library detected (no Lenis, no Locomotive Scroll)
- `scroll-behavior: auto` on `<html>` (default browser snap scroll)
- `body { overflow: hidden auto }` — standard vertical scroll with horizontal hidden

### Animations
- `@keyframes fadeIn` used on `.hero-content-card` — 0.8s ease-out forwards
- Applied on page load (not scroll-triggered based on current extraction)
- IntersectionObserver API is available on the page

### Transitions
- **Global transition default:** `0.2s` on interactive elements
- **Nav links:** `color 0.2s, text-decoration-color 0.2s`
- **CTA links:** `color 0.2s, text-decoration-color 0.2s`
- **Buttons:** `0.2s`
- **Mobile nav arrows:** `all` transition

### Nav Hover States
- Only checked default state — hover states would change color and text-decoration-color

## Navigation Behaviors

### Desktop Navigation
- 5 top-level links: Services, Work, About, Resources
- "Get in touch" is a CTA button (`btn-base btn-primary-dark with-icon`)
- Logo is a link

### Mobile Navigation
- `menu-toggle` button opens/hides mobile nav
- `submenu-toggle` buttons for expanding sub-menus per nav item
- `mobile-nav-link` styling for mobile links
- `mobile-nav-arrow` for expand/collapse arrows

## Section-Specific Behaviors

### 1. Hero Section
- **Page Load Animation:** `.hero-content-card` fades in over 0.8s
- **Background Video:** Has a "Pause video" button (uid=1_23)
- **CTAs:** "What we do" scrolls to `#what-we-do-section`, "Book a call" goes to `/contact`

### 2. USP Accordion Section
- **Interaction Model:** Click-driven
- **Structure:** Multiple accordion items
- **Items:**
  1. "Maintain or Fix My Site" — default `.active` state
  2. "Find a Technology Partner"
  3. "Optimise My Store"
  4. "Build a New Site"
- **State Classes:**
  - `.accordion-header.active` + `.accordion-content.active` = expanded
  - Clicking a header toggles the `.active` class
- **Content areas:** Each accordion panel has detailed text about the service

### 3. Clients Section
- **Behavior:** Static display of client logos
- **Theme:** Dark background (`theme-dark`)
- No interactive elements detected

### 4. Stats Section
- **Behavior:** Static display of metric/result cards
- Likely stat counting animation on scroll (not verified — worth checking on live)

### 5. Expertise Section
- **Behavior:** Dark theme section with platform/technology logos
- Static display

### 6. Work/Portfolio Section
- **Behavior:** Card grid showing client projects
- **Hover effects:** Expected on cards (hover changes shadow/transform — verify with hover sweep)
- Each card likely links to a case study page

### 7. Testimonial Carousel
- **Behavior:** Carousel/slider
- **Class:** `testimonial-carousel-section carousel-mode`
- **Interaction Model:** Likely auto-rotating (time-driven) with manual click navigation
- Verify: Need to check for navigation dots, arrows, or auto-rotation timer

### 8. Header Scroll Behavior
- Not confirmed via extraction — need to verify:
  - Does header shrink on scroll?
  - Does header gain background/shadow on scroll?
  - Does header remain fixed?

## Hover State Targets (to verify with hover sweep)
- Nav links (`nav-link`)
- CTA button
- Accordion headers
- Work/portfolio cards
- Footer links

## Responsive Breakpoints (to verify)
- **Desktop ↔ Tablet:** ~1024px
- **Tablet ↔ Mobile:** ~768px
- Mobile layout: Hamburger menu replaces horizontal nav

## Verification Needed
- [ ] Header behavior on scroll (does it shrink / change background?)
- [ ] Testimonial carousel interaction (auto-play, click arrows/dots)
- [ ] Accordion open/close animation details
- [ ] Hover states on all interactive elements
- [ ] Mobile hamburger menu animation
- [ ] Stat count-up animation on scroll
- [ ] Card hover effects in work/portfolio section
