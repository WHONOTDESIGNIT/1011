# Claims — risk register

Guard v0.1 is closed. It verifies one thing: cross-locale standard-number consistency.
Its green tick must never be read as "the facts were checked". This file keeps what is still
open visible so closing the guard does not make the remaining work disappear.

## Three layers, three different guarantees

| layer | question | owner | status |
|---|---|---|---|
| 1 · Consistency | do the locales agree on a standard number? | Engineering | **Guard v0.1 — closed** |
| 2 · Evidence | is the fact itself backed by valid evidence? | Claims Owner | not built |
| 3 · Authorisation | may this wording be published, in this market, on this page? | Compliance | not built |

A pass at layer 1 implies nothing about layers 2 and 3.

## Open risks

| # | risk | owner | closed when |
|---|---|---|---|
| R1 | a green parity check is read as fact verification | Project Owner | CI status and docs say "parity", never "verified"; product certification claims have a separate approval path |
| R2 | regression tests never run automatically | Engineering | `test:claims` runs in GitHub Actions and gates merges that touch the guards |
| R3 | an allowlist entry outlives its reason | Engineering | a stale entry fails the build instead of printing a note |
| R4 | a wrong standard number on an **English** page is invisible | Claims Owner | a fact registry supplies the baseline; the parity rule cannot |
| R5 | high-risk claims are published without an independent approver | Compliance | a named Approver signs, and Author ≠ Approver for high-risk claims |

## Naming rule

The CI check is **`Claims parity checks`**. It must not be named, described, or reported as
`Claims verified`. Anyone summarising build status for a customer, an auditor, or a
regulator uses the first phrase.

## Maintenance backlog (do not reopen Guard v0.1 for these)

- **P0** — `test:claims` in GitHub Actions on changes to `astro/scripts/check-claims-*.mjs`,
  `test-claims-guards.mjs`, or `claims-parity.json`. (R2)
- **P1** — stale allowlist entry fails the build. (R3)
- **P2** — English-side fact checking, blocked on the registry. Do not approximate it with a
  hardcoded number table. (R4)

## Why this file exists

The failure mode after a project closes is not a bug. It is a sentence in a meeting:
"we have claims checks now." This register is the counterweight, and it is only worth
anything if it is read at the start of the next claims conversation.
