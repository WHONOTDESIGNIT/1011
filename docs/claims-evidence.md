# Claims evidence ledger

Every first-party conformance claim on the site must have a row here. A claim that
cannot point at a row gets deleted, not softened (see `AGENTS.md`).

This file is the **sanitised** record: what was checked, against what class of
document, when, and by whom. File names, page numbers and certificate scans live
outside the repo in the machine-state folder, because they carry customer and
applicant detail that has no business in a public repository.

Scanning rules use this ledger as their allowlist: a sentence asserting "we
comply with / hold / are certified for X" is acceptable when it maps to a row,
and is a finding when it does not.

| ID | Claim (short) | Evidence class | Status | Checked |
|---|---|---|---|---|
| C-001 | Per-platform IEC 62471 photobiological reports, issued by a CNAS-accredited laboratory, applicant Shenzhen iShine Technology Company Limited | Five CNAS IEC 62471 reports, one per model code: SKN001, SKN002, SKN005, SKN006, RoseSkinCo Lumi. Applicant page present in each | verified | 2026-10-21 |
| C-002 | FDA 510(k) K222537 covers SKN001, SKN002, SKN005, SKN006 and RoseSkinCo Lumi | Third-party MDSAP audit report states the 510(k), MDL and ARTG numbers were achieved for exactly those models | verified | 2026-10-21 |
| C-003 | EN 60335-1 + EN 60335-2-23 low-voltage safety file for the CE/UKCA platforms | CE LVD reports and certificates, UKCA safety reports, EU declarations of conformity, PSE and CU files for SKN002 LUMI, SKN003 Pro (Helix), SKN004 Themis, SKN010 Venus, SKN011 Lumi2 | verified | 2026-10-21 |
| C-004 | EN IEC 55014-1 / 55014-2 EMC assessments | CE and UKCA EMC reports for SKN003 Pro and SKN011 only | verified, **scope-limited** | 2026-10-21 |
| C-005 | EMC for the FDA-cleared platforms (SKN001 / SKN002 batch) | IEC 60601-1-2 (CISPR 11) test report from an accredited laboratory, medical electrical equipment | verified | 2026-10-21 |
| C-006 | What the CNAS photobiological reports actually cite | All five reports read end to end: they cite IEC 62471:2006 and nothing else. No 60335, no 60601, no 55014 anywhere in any of them | verified — **do not attribute 2-23 to these reports** | 2026-10-21 |
| C-007 | ISO 13485 and MDSAP company certification | **Held until 2026-04-03; not held now.** The certificates were not renewed. The site therefore states the past tense (`llms.txt`) and carries no current-tense claim: the blog posts, English and all 21 translations, no longer contain the certification sentence or the certification table row | held, not current — one wording everywhere | 2026-10-21 |

## Two families, not one

The site sells devices that travel two different regulatory routes, and the EMC
standard differs between them:

- **FDA route** (SKN001, SKN002, SKN005, SKN006, RoseSkinCo Lumi): 510(k) K222537,
  per-platform IEC 62471 reports, EMC to **IEC 60601-1-2**.
- **CE / UKCA route** (SKN002 Lumi, SKN003 Pro / Helix, SKN004 Themis, SKN010
  Venus, SKN011 Lumi2): low-voltage safety to **EN 60335-1 + EN 60335-2-23**,
  EMC to **EN IEC 55014-1 / 55014-2**.

A sentence that says the photobiological reports sit "alongside the 55014 EMC
assessments and the 60335-2-23 safety file for the same units" merges the two
families and is therefore wrong for the FDA-cleared platforms. Write the routes
as two sentences, or say "the CE and UKCA platforms" explicitly.

## Open items

- The two sentence-level fixes these rows demanded are done on
  `content/cluster-b-ready`: "every IPL platform we build" is now "the five
  platforms inside our FDA clearance", the FDA and CE routes are written as two
  sentences, and the FAQ no longer claims the photobiological reports cite
  60335-2-23 (C-006).
- The IEC 60335-2-113 references in six older posts are procurement advice
  ("ask the factory for the 2-113 report"), not first-party claims. Whether that
  advice is correct for this device class is a content-accuracy question, tracked
  separately. Until it is decided, 189 occurrences remain in the 21 translations
  and are listed as known drift in `astro/scripts/claims-parity.json`.
