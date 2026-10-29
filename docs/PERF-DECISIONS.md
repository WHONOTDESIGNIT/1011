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
early.
