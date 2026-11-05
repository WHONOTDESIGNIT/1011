# Project B1 — commercial search landing audit, and the observation window

**Status: audit accepted, observation open. No page changes made.**

## 1. GSC baseline, measured 2026-11-04

Export source: GSC Performance, 90 days (2026-08-02 → 2026-11-01), official CSV export,
read at page level and query level.

```
clicks 331   impressions 28,100   CTR 1.2%   average position 19.0   queries 1,023
last 28 days: clicks 174   impressions 12,000   CTR 1.5%   position 14.2
```

Commercial pages by impressions:

| page | impressions | clicks | CTR | avg position |
|---|---|---|---|---|
| `/` | 1,240 | 42 | 3.39% | **9.95** |
| `/products` | 1,111 | 7 | 0.63% | 27.17 |
| `/products/lumi-2` | 207 | 4 | 1.93% | 12.04 |
| `/services/build-a-new-ipl` | 142 | 1 | 0.70% | 9.58 |
| `/services/private-label` | 113 | 1 | 0.88% | 12.74 |
| `/products/lumi` | 110 | 0 | 0% | 12.47 |
| `/services/find-a-technology-partner` | 103 | 0 | 0% | 33.99 |

The home page alone is 12.7% of all clicks and the only page that is simultaneously high
impressions, high clicks and already on page one.

## 2. Why the home page is the commercial entry point

```html
<title>iShine - Professional IPL Hair Removal Device Manufacturer</title>
<meta description="iShine is an OEM and ODM IPL hair removal device manufacturer providing
  custom design, compliant production, and global delivery for beauty brands.">
```

Title and description already match the commercial intent. `ipl hair removal manufacturer`
(67 impressions, average position 13.2) is the strongest commercial query in the export and
this is the page built to receive it. **The copy does not need keyword reinforcement.**

The mismatch is at the H1:

| layer | content | carries "manufacturer"? |
|---|---|---|
| title | Professional IPL Hair Removal Device Manufacturer | yes |
| description | OEM and ODM ... manufacturer | yes |
| **H1** | Powering the World Leading IPL Device Brands | **no** |

Same shape on `/services/oem-odm`: title says "IPL Manufacturer for OEM and ODM Programs",
H1 says "Your Vision, Our Expertise".

## 3. Correction: `/products` low CTR is not a title failure

An earlier note in this project said `/products` was "losing 1,111 impressions". That reading
was wrong. Its average position is **27.17 — page three**. A 0.63% CTR at that position is
unremarkable, and its impressions almost certainly come from broad informational queries
(`ipl`, `ipl脱毛`) rather than purchasing intent.

**Do not optimise `/products` for CTR on this evidence.** Recorded here so the wrong version
does not keep circulating.

Related: commercial-intent queries total roughly 695 impressions across 90 days, about 2.5% of
all impressions. `ipl oem`, `ipl odm`, `custom ipl hair removal device` and
`ipl handset manufacturer` do not appear at all. There is no proven B2B search channel to
expand yet, which is why no new B2B pages are being built.

## 4. GA4 conversion state at the start of the window

| item | state |
|---|---|
| GA4 property | `a360467089p495562422` / `iplmanufacturer` (verified) |
| data stream | `11439247292`, `https://www.iplmanufacturer.com` (verified) |
| measurement ID | `G-94BDNGHHJH`, matches site code (verified) |
| `whatsapp_click` / `email_click` | code sends them; capture confirmed at the network layer; **GA4 ingestion pending**, up to 24h |
| `generate_lead` | **was dead since 2026-10-21** — the listener matched `form[data-netlify]` and the contact form renders `action='/__forms/'`. Fixed in `daaf9f88`, deployed, selector confirmed live |
| Search Console linked to GA4 | **not linked** |
| Key Events configured | **no** (cannot mark events that have not appeared yet) |

Two consequences for reading this window:

1. **Absence of events before 2026-11-04 is not evidence of zero conversions.** The form
   event did not exist in working form until that day.
2. **Two synthetic events were sent during verification** (`whatsapp_click` once,
   `email_click` once, roughly 08:45–08:50 UTC on 2026-11-04). They are test data and must be
   excluded from any conversion rate.

## 5. Observation window

Opens 2026-11-04, first reading 2026-12-02 (28 days), second 2027-02-02 (90 days).

| metric | what it tells us |
|---|---|
| home page impressions | whether the entry point is stable |
| home page clicks | whether position converts into visits |
| organic sessions on `/` | what actually arrives |
| `whatsapp_click` | contact intent |
| `email_click` | contact intent |
| `generate_lead` | an actual inquiry submission |

**Baselines are small: 42 clicks in 90 days on the home page.** No inference about causality
should be drawn at this sample size, and a 28-day window may end with "not enough data"
rather than a conclusion.

## 6. Decision rules at the end of the window

| what the window shows | decision |
|---|---|
| a real inquiry attributed near the home page | keep the entry point, study how to raise conversion |
| contact clicks, no form submissions | examine the WhatsApp and email paths |
| organic visits, no contact behaviour | examine page content and CTA placement |
| not enough data | extend the window, do not manufacture a conclusion |

## Frozen for the duration

- home page title, description and H1
- product template restructure
- three new B2B landing pages (no demand evidence)
- consumer-facing blog content (kept as is; it is the proven search asset)

## Known gaps that are not part of this window

- Search Console is not yet linked to GA4, so query → landing page cannot be viewed inside
  GA4 yet. Both products are readable separately today.
- `/services/oem-odm` has no in-page form; the only actions are WhatsApp and email. Candidate
  for a separate evaluation, not for this window.
