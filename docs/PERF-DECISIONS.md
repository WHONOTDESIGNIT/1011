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
## Layout investigation: closed

Five hypotheses were tested against production with the same harness (4x CPU throttle,
cache disabled, Playwright + CDP `Performance.getMetrics`). All were rejected.

| Hypothesis | Test | Result |
|---|---|---|
| trust-bar ticker drives layout | count layouts with/without the display toggle | 24ms of layout per 10s (1.6% of the total) |
| CSS rule count is the bottleneck | trace `UpdateLayoutTree` | 137 events, 229ms total, max 64ms |
| `proxy.js` (Simple Analytics) causes the 206ms layout | abort the request, 2+2 runs | layout 537 -> 515ms, script 531 -> 529ms: noise |
| web font swap causes reflow | abort all `.woff2` | layout got **worse**: 542 -> 669ms |
| a single section is a hotspot | hide D1 (246 nodes) vs D2 (264) | INVALID — see below |

### The one result that held

Hiding all 13 sections below the hero, 5 interleaved pairs:

```
baseline          714, 470, 447, 527, 587  median 527ms
sections hidden   376, 304, 442, 393, 365  median 376ms
```

**-151ms (-29%), no overlap** (max of the hidden arm 442 < min of the baseline 447). That
establishes an aggregate contribution of the below-fold sections. It does **not**
establish the cost of any individual section.

### The D1/D2 experiment is invalid, not negative

The 15-run interleaved bisect produced a baseline that drifted 164ms across five rounds
(652 -> 488) while the apparent effect was 58ms. Paired deltas flipped sign (A-C went
from +192 to -251). With 5 rounds and 3 positions the drift cannot be balanced. Recorded
as INVALID: no evidence for D1, none against D2.

### content-visibility: auto — rejected

All 13 below-fold sections, mobile only, 5 pairs alternating:

```
baseline            median 745ms  MAD  33ms
content-visibility  median 720ms  MAD 113ms    -25ms (-3%)
```

The 3% is inside the noise and the variance tripled (953ms and 846ms in two runs, worse
than any baseline run). `RecalcStyleDuration` rose from 187-280ms to 222-314ms. CLS
unchanged at 0.0015 in every run.

### Constraints going forward

- The hero width formula, layout switch and fade behaviour stay frozen. They cost the most
  rounds to stabilise and CLS is 0.0012.
- Do not remove content or navigation to shrink the DOM.
- Do not split or refactor CSS without new profiling evidence.
- Reopening this line requires a reproducible effect larger than ~15% with a measurement
  design that controls baseline drift (paired A per round, or randomised order over 8+
  rounds).

### Where the remaining cost is

Main-thread work on mobile production is roughly `Layout 1045ms`, `Other 1120ms`,
`Rendering 957ms`, `Script 954ms` in a real-throttling trace. Layout has no identified
hotspot. The next line of work is JavaScript: `ScriptDuration` 500-550ms and TBT
swinging between 478 and 846ms across runs, before and after the Clarity deferral.
## Ongoing performance regression policy

The layout investigation is closed. The hero width formula, the layout switch and the
fade behaviour stay frozen; CLS is 0.0012 and that took the most rounds to reach.

For future homepage changes:

1. Any new large section, card grid or nested Grid/Flex structure gets a mobile
   performance regression check before merge.
2. Use the frozen configuration: Lighthouse 13.6, Chrome headless, `--throttling-method=devtools`,
   viewport 412x823, cache disabled, 5 runs, median.
3. Investigate when median `LayoutDuration` rises more than 15% against the recorded
   baseline (745ms full page, 376ms with the 13 sections hidden).
4. Require a reproducible effect and a drift-controlled design before approving any
   structural refactor. Five rounds of three conditions is not enough: the D1/D2 run
   drifted 164ms against a 58ms effect.
5. Do not remove content or navigation to improve a score.
6. Reopen the layout line only when new evidence identifies a measurable opportunity.

The 15% is a trigger for reopening the investigation, not a per-section budget.

### What this closed investigation cost and bought

Roughly 70 runs produced no code change. It did produce a short list of directions that
are now known to be dead ends on this page - ticker, CSS rule count, Simple Analytics,
web fonts, content-visibility - and a rule for what evidence would justify reopening.
## Clarity deferral: tested on production, rejected, reverted

Clarity's script was injected while the page was still parsing. It was moved to
`load` + `requestIdleCallback`, with the stub kept in place so the consent bridge's
`clarity('consentv2')` still queued.

Baseline before the change, 5 runs, devtools throttling, cache disabled, same 25-minute
window: Script Evaluation median 723ms (MAD 30), TBT 381ms (MAD 53), LCP 2663ms,
CLS 0.0028.

After the change, 5 runs the same way:

```
Script  723 -> 801 ms   (MAD 30 -> 133)
TBT     381 -> 459 ms
LCP    2663 -> 2744 ms
CLS    0.0028 -> 0.0028
```

Acceptance had been fixed at Script < 673ms. It failed.

### Why it failed, from bootup-time attribution

`clarity.js` itself did not get cheaper: 133ms median before, 134ms after. The extra cost
landed on GA4, which went from 288ms to 326ms median, and GA4's long tasks grew from
about 180ms to 250-330ms.

Both scripts now enter the same idle window after `load` and contend for the main thread.
Deferring Clarity did not remove work; it moved work into a busier window. That is the
general lesson: an analytics script's cost is not only its own execution time but when it
runs relative to everything else.

Reverted in `a666c012`, restoring parse-time injection so the 723ms baseline holds.

### Verified while the change was live

Clarity collection works end to end: `clarity.ms/tag/yymyby2wbc` 200, `clarity.js` 200,
`j.clarity.ms/collect` 204, `window.clarity` replaced the stub, queue drained.

GA4 could not be confirmed from headless: `google-analytics.com/g/collect` reported
`net::ERR_ABORTED` on every load. This is a known headless artifact when the context
closes, but it is not proof either way and needs a real-browser check before GA4 data is
trusted.

### Status

| item | state |
|---|---|
| layout, CSS, script ownership investigations | closed |
| Clarity deferral | rejected by experiment, reverted |
| Clarity collection | verified |
| GA4 collection | unverified, needs a real browser |
| revert deployment and 5-run regression | pending owner |
## Blog listing payload: citableSummary removed

`/blog` inlined every post as JSON (`#blog-posts-data`) for the client-side search and
render. The client reads title, excerpt, category, author, date, href and image; it
searches title + category + excerpt + author. `citableSummary` is never read on that page.

At roughly 594 characters per post it was 47.4 KB of a 118 KB blob, i.e. 40% of the blob
and 20% of the whole page. It is now stripped at serialisation time, in
`src/pages/blog/index.astro`. The source data is untouched: the field still exists in the
content collection and is still used by the article pages and by llms.txt.

Measured on the build:

```
raw HTML    238.0 -> 188.8 KB      (production, after deploy)
payload     118.0 ->  68.7 KB
brotli q11   58.0 ->  34.8 KB      (-23.2 KB, -40%)
```

104 posts, every card link, the category filters and the search behave the same; verified
on /blog, /de/blog, /ja/blog and /ar/blog after deploy.

### What the numbers do not say

The pre-change baseline was 3 runs, one of them a network outlier (LCP 5279), and the
post-change set is 5 runs. Do not read the median difference as the effect of this change:

```
before   LCP 5279, 2813, 3387   median 3387
after    LCP 3047, 2870, 2498, 2487, 2497   median 2498 (MAD 10)
```

Against the before median that is 889ms; against the best before run it is 315ms. The
defensible statement is: the payload is 40% smaller, which is deterministic, and LCP is
now stable at 2498ms with a MAD of 10ms. A causal estimate would need a 5-run before
baseline taken in the same window, which this did not have.

### Open signal, not explained

TBT moved from 145ms to 345ms and Script Evaluation from 421ms to 572ms across the same
comparison. The before side is 3 runs and the after TBT has a MAD of 106ms, so this is not
attributable either way. It is logged as a signal to investigate rather than a regression,
and the next work on this template should start with per-script attribution, not with more
payload trimming.

## Product detail: archived as not established

The product template was the next target after the blog listing. Six hypotheses were tested
and none survived:

| hypothesis | test | result |
|---|---|---|
| hidden panels are the cost | DOM audit of every `display:none` / `aria-hidden` / closed `details` | 335 of 1,739 nodes (19%), and 170 of those are the shared mobile menu |
| redundant wrapper divs | counted single-child same-tag wrapper chains inside `main` | 2 |
| image strategy | audited `loading`, dimensions, in-viewport | 1 eager hero image, 5 lazy thumbnails, 4 lazy off-screen; already correct |
| the 129-row rate table | classified the tables | two shipping methods (DDP 33 markets, standard air 94), not "main vs rest"; 21 markets appear in both |
| JavaScript is heavier | CPU profile, 4x throttle, 9s window, product vs home | product is *lighter*: program 1534 vs 1785ms, clarity 160 vs 164, Simple Analytics 61 vs 66, page scripts 35 vs 15 |
| layout/parse is heavier | same profile | product's `program` bucket is 251ms smaller than the home page's |

The tables are still 645 of `main`'s 1,115 nodes and 35.7 KB, which is real, but folding
them was rejected on correctness grounds before it was rejected on performance grounds: the
94-row table is non-DDP freight, it overlaps the DDP table rather than supplementing it, and
21 of its destinations are core markets (Brazil, India, Saudi Arabia, UAE, South Korea).

### The desktop measurement that settles it

Same page, same DOM, 5 runs, `--preset=desktop`, devtools throttling:

```
score 82 (MAD 2)   FCP 1672   LCP 1978   TBT 0 (MAD 0)   Script 127   Layout 282
```

A page whose mobile TBT reads 843ms produces **zero** blocking time on desktop. Whatever the
843ms is, it is not a fixed cost of this page's code or DOM; it only appears when the CPU is
throttled to a mobile profile.

### Status: not established, not fixed

- extra CPU cost on mobile: **not found**
- DOM delta: **present** (689 nodes), **not reflected** in main-thread time
- the TBT gap (843 mobile vs 336 home): **unexplained**
- viable optimisation: **none identified**

**Reopening condition:** an actual Lighthouse trace of the mobile run, or a reproducible
hotspot from a profiler run aligned to the TBT window.

### Method note: the profile window is not the TBT window

The CPU profile covers a fixed 9 seconds; TBT counts long tasks between FCP and TTI. So the
correct statement is "the profile does not show additional work", not "the page has no
additional work". Keeping that distinction is what stopped this line from producing a
speculative change.

### Principle

Do not infer extra cost from a metric difference. Find the work or the hotspot that explains
the difference first. Changing code is not progress.

## Page-type level conclusion: the mobile TBT gap is a throttle effect

Four templates measured with the same protocol (devtools throttling, 4x CPU, cache
disabled, 5 runs each, medians):

| template | mobile TBT | desktop TBT | mobile Layout | desktop Layout |
|---|---|---|---|---|
| home | 336 | - | - | - |
| product detail | 843 | **0** (MAD 0) | 1296 | 282 |
| about | 189 | **0** (MAD 0) | 1068 | 216 |
| service detail | 331 | **0** (MAD 0) | 1158 | 214 |

Desktop TBT is zero in 15 of 15 runs across three templates. Mobile TBT ranges 189-843ms
and rises with DOM size, but content volume and page complexity rise with it too, so that
correlation is not a causal claim.

### Conclusion

Under this site's stack and this test configuration, the measured content templates show a
consistent device difference:

- mobile (4x CPU throttle): TBT 189-843ms
- desktop: TBT 0ms in 5 of 5 runs on every template
- mobile Layout is 4-5x desktop Layout

**Decision: stop per-template TBT investigation. Stop optimising for lab TBT.**

No template-specific hotspot has been found that explains the difference. The gap tracks
the CPU throttling condition; the specific cause - HTML parsing, style calculation, layout,
task packaging, or something else - has not been verified from a raw trace.

### What this conclusion does not say

- It does not say mobile has no performance problem. If real-user INP p75 is poor, there is
  a problem regardless of what these lab numbers show.
- It does not generalise to untested templates or to real devices.
- It does not claim causality between DOM size and TBT.

**Reopening conditions:** CrUX or RUM shows a real interaction or loading problem; a new
template departs from this pattern; or a reproducible, locatable execution hotspot appears.

### Where the decision authority moves

From lab TBT to real-user data. The next step is an inventory of what user data already
exists (CrUX, Search Console, GA4, server logs) before adding any new instrumentation.
## CrUX data inventory: blocked by network, not absent

Status: **not measured**. The execution environment cannot reach Google APIs, so this run
proves nothing about whether the site has CrUX data.

This environment has partial outbound access. Reachable and verified: `iplmanufacturer.com`,
`ssh.github.com:443`, `www.corewebvitals.com` (200 in 0.85s). Not reachable: `www.googleapis.com`
and `pagespeed.web.dev` (both time out at the connection level, HTTP 000, with or without
`--ssl-no-revoke`).

So this is domain-selective filtering, not a dead machine. Two side notes worth recording so
nobody re-investigates them:

- An early control request to `www.corewebvitals.com` failed with
  `CRYPT_E_REVOCATION_OFFLINE`. That is Windows certificate-revocation checking on this host,
  not a problem with any site's certificate; `--ssl-no-revoke` returned 200 immediately. Do
  not file it as a site HTTPS fault.
- `www.corewebvitals.com` being reachable does **not** mean it can serve this site's CrUX
  data. Its availability is not a substitute for a PSI or CrUX query.

### Why this is recorded as a fourth state

Four outcomes were possible: URL-level data, origin-level only, explicitly no data, or not
measured. "The query failed" is the fourth one. Recording it as "no data" would licence a
decision - commissioning self-hosted RUM - on the strength of a network error rather than a
measurement. Observability limits must not become architecture decisions.

### Next step

Check the four URLs by hand in the PageSpeed Insights web UI, which needs no key and no
change to this machine:

```
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fiplmanufacturer.com%2F
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fiplmanufacturer.com%2Fproducts%2Fvenus
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fiplmanufacturer.com%2Fabout
https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fiplmanufacturer.com%2Fservices%2Foem-odm
```

Record URL-level and origin-level separately, and phone and desktop separately, with p75 for
LCP, INP and CLS. Good thresholds are LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.

### Decision constraints until that runs

- Do not record this network failure as "no CrUX data".
- Do not commission RUM on the strength of a failed query.
- Do not change code or infrastructure for this.
- CrUX has no real-user TBT. Lab TBT and field INP stay separate.
### Phase close

The laboratory performance work is closed at this point. Everything measured, decided and
rejected is recorded above; nothing is left half-investigated.

| item | state |
|---|---|
| home mobile / desktop | done, archived |
| blog listing payload | shipped, -40% brotli |
| blog listing TBT signal | logged, unexplained |
| product detail | frozen, no hotspot found |
| page-type level conclusion | recorded; desktop TBT 0 in 15/15 runs |
| shipping copy corrections | shipped in 3 commits |
| CrUX field data | **not measured**, domain-blocked |
| self-hosted RUM | **not commissioned** |

Restart conditions, unchanged: a working data channel for field metrics, a real-user
performance complaint, a new template departing from the measured pattern, or a reproducible
and locatable execution hotspot.

The thing worth keeping from this phase is not a number. It is the order of operations: find
the cost before changing the code, and do not convert an observation limit into an
architecture decision.