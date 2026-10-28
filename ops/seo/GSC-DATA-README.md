# GSC data extract — provenance, limits, and what it can decide

Everything below describes the two CSVs produced on 2026-10-28. If a future report
quotes a number from these files, it must be able to cite the window and the method
in this document, or the number is not usable.

## 1. Window

| field | value |
|---|---|
| Range preset | `3 个月` (last 3 months) in the GSC Performance UI |
| Dates covered | **2026-07-26 → 2026-10-25** (92 daily rows in the chart export) |
| Data freshness | UI showed `上次更新日期：2.5小时前` at extraction |
| Extraction time | 2026-10-28, ~15:55 (Asia/Shanghai) |
| Lag note | GSC finalises with a 2–3 day lag; the last two days before extraction are absent by design |

The window is what the preset produced, not a hand-picked 90 days. It is 92 days.

## 2. Property and extraction method

- Property: URL-prefix property `https://iplmanufacturer.com/`.
- Method: **browser automation of the Performance report UI** (Playwright + `msedge`,
  persistent context on the directory in `DSH_BROWSER_PROFILE`, `--profile-directory=Default`),
  i.e. the same signed-in profile `gsc_request_indexing.mjs` uses. No OAuth, no service
  account, no Search Analytics API.
- Artefact: `https___iplmanufacturer.com_-Performance-on-Search-2026-10-28.zip`
  (33,695 bytes), saved under `_gsc_exports\` in the browser's download folder.
- The zip contains **all tabs**: `图表.csv`, `查询数.csv`, `网页.csv`, `国家_地区.csv`,
  `设备.csv`, `搜索结果呈现.csv`, `过滤器.csv`. Only `网页.csv` was used.
- This was a **one-off manual run**. It is not wired into `tasks.json` and will not run
  again by itself. Every number here is a snapshot, not a feed.

## 3. Derived files and how each column was produced

| file | location | content |
|---|---|---|
| `gsc-pages-90d.csv` | `<data dir>` (`DSH_DATA_DIR`) | 1,000 rows, one per exported page URL, plus `locale`, `bucket`, `is_variant_url` |
| `gsc-locales-90d.csv` | `<data dir>` | 22 locales, aggregated locally from the pages file |

Provenance per metric:

| column | source |
|---|---|
| `clicks`, `impressions`, `ctr`, `avg_position` | **direct** from GSC `网页.csv`, per URL |
| `locale` | **local derivation**, first path segment (see §4) |
| `pages_with_data` | **local count** of exported rows per locale |
| `pages_published` | **local count** from `site-urls.txt` (build artefact, 3,960 URLs) |
| `share_clicks_pct`, `share_impr_pct` | **local arithmetic** against the pages-file sums, not against the property totals (see §5) |
| `avg_position` at locale level | **local**, impression-weighted mean of the per-page averages — an approximation, not a GSC figure |

## 4. Locale mapping rule

A row's locale is the **first path segment, lowercased**, if it is one of
`tr ro ar es fr ru he fa el pt-br pt-pt nl id th pl ja ko cs vi de it`.
Everything else is **`en`** (the property serves English unprefixed, so `en` is the
remainder bucket by construction, not a filter).

Normalisation applied before classification: collapse `//`, strip the trailing slash,
lowercase the first segment for matching only. This matters — the raw export contains
`/pt-PT/products/lumi-2` (uppercase, 2 clicks) and 94 trailing-slash URLs; without
case-folding those rows would have been silently counted as English. **That error was
made and corrected during this extraction**; the numbers in this document are post-fix.

Rows that are not pages (assets, `.xml`, `.txt`, `/__forms`) would go to bucket `?`.
The bucket is **empty**: all 1,000 rows are canonical `https://iplmanufacturer.com/…`
URLs.

## 5. The row cap, and the reconciliation that does not close

- GSC's CSV export is capped at **1,000 rows**. The pages table said
  `第 1-10 行，共 1000 行` — the cap bound exactly.
- The site publishes **3,960** URLs. The export contains **995 distinct page values**
  (5 duplicates, e.g. `pt-PT` and `pt-br` twice) — so ~2,965 published URLs never
  appear. The tail of the file is `0 clicks / 1 impression`, which suggests the missing
  rows carry impressions below 1 and effectively no clicks; that is an inference, not a
  measurement.
- Reconciliation against the property totals for the same window:

| figure | clicks | impressions |
|---|---|---|
| chart series (`图表.csv`, 92 days) — the property total | **279** | **24,626** |
| sum of the 1,000 page rows | **282** | **25,795** |
| delta | **+3 (+1.1%)** | **+1,169 (+4.7%)** |

**The delta is not explained.** Candidates, none verified: (a) the chart's day
boundaries and the table's URL-range boundaries are computed separately and can
straddle a day; (b) the export was generated ~2.5 h after the summary card was
rendered, so the two figures are not from the same snapshot; (c) URL-form duplication —
94 of the 1,000 rows are trailing-slash or double-slash variants carrying 1,129
impressions, and GSC may attribute the same serve to both forms. Do not paper over this
by rescaling. To close it properly, re-extract via the Search Analytics API with explicit
`startDate`/`endDate` and `dimension=page`.

## 6. What this data can support

- Ordering the 22 locales by impressions and by clicks, at the "which three locales do
  anything at all" resolution.
- Finding individual pages that earn clicks (171 of 1,000 rows have ≥1 click).
- Spotting CTR anomalies against position (e.g. `fa` at 11.0% CTR / position 6.2 vs
  `ar` at 0.52% / position 26.4).
- Comparing languages *within* the same template (the same slug in 22 locales).

## 7. What it cannot support

- **A per-locale keep/merge/remove decision on 90 days.** Totals: 282 clicks / 25,795
  impressions for the whole property. Excluding English: 174 clicks across 21 locales =
  **8.3 clicks per locale per quarter, median 8** (range 1–19). At that count, one lucky
  branded query moves a locale across any threshold. Any locale verdict drawn from this file is a coin
  flip dressed as analysis.
- Causal claims of any kind. There is no control, no stable baseline, and the window
  overlaps at least one live content/translation batch.
- Query-level conclusions: the queries tab was exported but is subject to GSC's
  anonymisation of rare queries, and it was not used here.
- "Zero impressions" conclusions about a specific URL: absence from the 1,000 rows is
  not proof the URL was never served — but see §5, the cap appears to have truncated
  only the sub-1-impression tail.
- Anything about Bing, or about pages that were never indexed by Google at all
  (impressions require at least one serve).

## 8. Reproduce

```
# one-off, not scheduled
node <path>\gsc-perf-export.mjs      # downloads the zip via the signed-in profile
# then: unzip, read 网页.csv, aggregate by first path segment (locale), write the two CSVs
```

The aggregation script is not committed (it was a throwaway). If this extract is to be
repeated, promote it to `ops/seo/` with a `tasks.json` entry, or replace the whole path
with a service account + Search Analytics API and drop the 1,000-row cap.

## 9. Index diagnosis — `gsc-index-diagnosis.csv`

Built on 2026-10-28 from four sources, joined **left from the sitemap** so that a missing
performance row stays missing rather than becoming a zero:

| input | date | role |
|---|---|---|
| `site-urls.txt` (3,960 URLs, from today's build) | 2026-10-28 | the denominator |
| `gsc-pages-90d.csv` | window 2026-07-26 → 2026-10-25 | clicks / impressions / position |
| `_gsc_results.jsonl` (859 records, latest per URL wins) | 2026-10-15 → 2026-10-27 | per-URL URL-Inspection verdict |
| Coverage workbook `3278全量清单` (3,278 URLs) | export 2026-10-15, merged 2026-10-28 07:25 | uncrawled / pending / reason-list verdicts |

Result over the 3,960 sitemap URLs:

| index_status | count | share |
|---|---|---|
| `indexed` (URL Inspection said so) | **758** | 19.1% |
| `not_indexed` (inspection or GSC reason list) | **122** | 3.1% |
| `unknown` (no individual verdict) | **3,080** | 77.8% |

The 3,080 unknowns are not one bucket: **1,635** are queued in the workbook as
`待检查`, **763** appear in the coverage export with a crawl date but no verdict, and
**682** are absent from the workbook entirely because they were published after the
2026-10-15 extract.

**The 21 contradiction.** Of the 122 `not_indexed` verdicts, **21 carry impressions** in
the performance export (up to 173). A URL cannot have impressions without being served,
so those verdicts are stale snapshots (mostly 2026-10-15/16) that later became indexed.
The inspection log is a point-in-time record, not a current state; anything older than a
couple of weeks is evidence of what happened, not of what is true.

**Throughput — resolved, and it is a scheduling bug.** `gsc_daily.ps1` runs twice a day,
07:25 and 18:15 Beijing. Every 07:25 run in the log dies instantly with
`fatal=QUOTA_EXCEEDED` (0 URLs done: 2026-10-27, 2026-10-28), while the 18:15 run of
2026-10-27 completed **99** inspections in 6.5 minutes (3 workers, ~4 s/URL) before the
quota died. That is consistent with one thing: the inspection quota resets at Pacific
midnight ≈ **15:00–16:00 Beijing**, the 18:15 run spends the fresh allowance, and the
07:25 run 15 hours later meets the same allowance already empty. The cap is ~100/day and
the morning trigger cannot ever use it.

Consequence: 2,422 URLs are still queued in the workbook, so **~24 days** at 100/day —
i.e. the 3,080 unknowns can be cleared inside November, if the morning trigger stops
firing into an empty quota. Delete the 07:25 trigger (or move it after 16:00) before
concluding anything about index coverage.


**Join rules that matter.** `in_perf_export = no` means *no record in this export*, never
"zero impressions" — the export is capped at 1,000 rows. `coverage_reason` is empty only
when a verdict says indexed. `impressions_90d` is blank, not 0, for unmatched URLs.

