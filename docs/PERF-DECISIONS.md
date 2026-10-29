# Performance decisions that lack a Lighthouse number

Some constraints in this repo cannot be demonstrated with Lighthouse or any other
Chromium-based tool, because either the branch never runs in Chromium or the number
that appears is an artifact of the simulated throttling model. This file records those
constraints and, more importantly, what the evidence actually is.

The project has been led astray four times by lab numbers that production did not
reproduce. Anything below marked "no lab number" was verified another way on purpose.

## Hero video autoplay guard

`auto()` in `astro/src/components/HeroVideo.astro` treats a missing
`navigator.connection` as a slow network (`c7fbd764`). Safari and Firefox do not
implement the Network Information API, so `navigator.connection || {}` yielded an
empty object, every check on it evaluated false, and both engines fell through to
`play()`: every iPhone downloaded and played the 494 KB hero video unconditionally,
after `load`.

**Why there is no Lighthouse number.** The guarded branch cannot be entered in
Chromium, where `navigator.connection` exists. No Chromium-based tool — Lighthouse,
PageSpeed Insights, Playwright — can observe the difference.

**The evidence is executable.** `astro/scripts/check-hero-video-autoplay.mjs` extracts
the shipped inline script from the built page and runs it in a `vm` with a fake DOM. It
asserts two things, and the second matters as much as the first:

- `navigator.connection` absent → `play()` is never called;
- `navigator.connection` present → `play()` is called.

It fires the 6 s fallback timer immediately, so the fallback path is covered by the
same assertion. It runs in the build chain after `flatten-html`, so any future edit to
`auto()` re-runs it.

**Production benefit** is that sessions without the Network Information API stop
downloading 494 KB for a decorative video. That population can only be measured with
real devices or RUM, not from this repo.

## CSS is not merged into a single file, and that is settled

The site ships 496 KB of CSS in 14 files. The homepage links 4 of them, 125 KB,
25 % of the total. `vite.build.cssCodeSplit: false` was tried and rejected by
`verify-baseline` before it could ship:

```
❌ maxCssChunk: 增长 +692.8%（基线 57.3 KB → 454.0 KB，>+20% fail）
```

One request instead of four, but every page would download 496 KB instead of 125 KB.
The guard is right and this is not an open question. What remains possible is critical
CSS inlining or per-page extraction — both structural, neither a config toggle.

## Why these numbers are not from Lighthouse's simulated throttling

Same production page, same build:

| model | FCP | LCP |
|---|---|---|
| Lighthouse simulated throttling | 4523 | 5372 |
| Playwright, real CDP throttling | 2440–3860 | 2756–3860 |

The 2.5 s difference is the model, not the page. The same split produced a
deterministic 0.4485 CLS and a 0.1184 desktop shift that production does not have
(production desktop CLS: 0.0101, three runs, identical).

**Rule:** a large gap computed from Lighthouse's simulated throttling is a hypothesis,
not a finding. Verify it with a production observer or real throttling before opening
work on it.

## LCP on the homepage is a race between three elements

Under real throttling the LCP candidate varies run to run: `h2.hero-title-main`
(162,240 px²), the single `h1` "Powering the World Leading IPL Device Brands"
(129,870 px²), and the video poster (123,462 px²). All three are in the same document;
there is no A/B test. Whichever paints inside the observation window wins, and in one
run the H2 was not registered at all because it had not painted yet.

Consequence: a single run's "the LCP element is X" does not generalise, and any p75
target is measured against a moving element until the hero is guaranteed to paint
early. **Resolved** by the fade change below: the race is gone and the element is now
determined per page.

## Hero card fade: opacity -> transform only

`.hero-content-card` faded in with `opacity: 0 -> 1` over 0.8 s. An opacity fade keeps
an element out of largest-contentful-paint candidacy until it finishes, so the hero
headline was painted early but only credited as LCP when the animation ended.

Production trace before the change (`--save-assets`):

```
TTFB 743 ms · CSS all in by ~1290 ms · fonts ready 1833 ms · FCP 1455 · LCP 2660
element render delay 1108 ms, LCP element h2.hero-title-main
```

The 827 ms between font readiness and LCP matched the animation duration. After the
change (transform only, opacity constant 1):

```
FCP 1790 · LCP 1790 · gap 0
```

Three further production runs: gaps 0, 0, 0. Locally, three runs per arm under real
CDP throttling: gap 300/332/232 ms before, 0/0/0 after, and the first candidate is the
headline instead of the video poster.

**What this fixes beyond the milliseconds:** before, the LCP candidate raced between
`h2.hero-title-main`, the single `h1`, and the video poster depending on which painted
inside the window. Afterwards the element is determined, not sampled.

### How to read LCP from now on

1. **gap = LCP - FCP**. Gap 0 means the element side is clean.
2. **Which element**. Informational: on the homepage it is the hero `h2`; on the five
   service pages the video poster is larger, so the poster is the LCP and is credited
   at FCP. Both are gap 0.

A report of "LCP got worse" is an element regression only if gap > 0 or the element
changed to something that paints late. Otherwise it is FCP/network variance, which is
expected: absolute LCP follows FCP, and FCP has been observed between 1.8 s and 3.5 s
on the same build.

**The success criterion for this work is gap = 0, not a fixed second count.**
## REJECTED: inlining the homepage critical CSS and deferring the rest

Goal: first paint should not wait for 125 KB of render-blocking CSS when only ~19 KB is
needed before it. Extracted from the built CSS (media contexts preserved):

```
Tailwind preflight (*, html)          4.4 KB   must stay inline
first-screen defaults (header/hero)  14.1 KB
hover/focus                           0.5 KB
mega-nav expanded state               6.4 KB   dropped
                                      ------
inline set                           19.0 KB
```

A post-build script inlined the 19.0 KB and rewrote the four stylesheet links to
`media="print" onload="this.media='all'"` with `<noscript>` fallbacks. Local build,
real CDP throttling:

```
              FCP     LCP     CLS
before       2872    2872    0.0012
after         680    1632    1.1278
```

FCP dropped 2.2 s and LCP improved 1.2 s, but CLS went from 0.0012 to 1.128. The cause
is visible in the shift entries: `div.nav-dropdown-wrapper` resized repeatedly as the
deferred sheets arrived (226 -> 298 -> 322 -> 366 px), so the header reflowed several
times after first paint.

Verdict per the criterion fixed before the change (FCP up, but FOUC/shift -> revert):
reverted. Build restored, no inline style, four blocking links.

Why the inline set was incomplete: the extractor keeps a rule only when every class in
its selector appears in the homepage DOM. Rules for header states whose child classes
are added later, or that hang off a state class, were dropped, and the deferred sheets
then changed geometry the inline set had already painted.

If this is retried: the inline set has to cover the header's *measured* geometry, not
just the selectors present in the static DOM, and the acceptance criterion should be
CLS unchanged (0.0012), not FCP.