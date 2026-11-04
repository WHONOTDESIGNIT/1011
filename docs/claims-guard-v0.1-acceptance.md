# Project A — Guard v0.1 Acceptance

**Status: ACCEPTED** (2026-11-04)
**Scope: cross-locale standard-number parity protection.**

## Delivered

| # | Item | Commit |
|---|---|---|
| 1 | Blog MDX parity guard (pre-existing, kept as is) | — |
| 2 | Locale messages parity guard, 21 locales / 756 keys | `58fd2eac` |
| 3 | Built-site dist scanner, 759 localized pages | `46014ea2` |
| 4 | Unified allowlist shared by all three checkers | `58fd2eac` |
| 5 | Build integration: steps 5, 6 before `astro build`; step 17 after `flatten-html` | `7732eb01`, `46014ea2` |
| 6 | Eleven regression fixtures | `fbc6c174` |
| 7 | Deployment lifecycle audit, six deploys | `88c5f627` |

## Verified

- Local positive builds pass; negative builds fail with the offending key and locale named.
- Guard regression tests: 11/11.
- Netlify real builds reached `ready` for PR-3 (`46014ea2`, 178s) and PR-4 (`fbc6c174`, 166s).
- A deliberately invalid claim blocked the Netlify build before `astro build` started, and
  production kept serving the previous deploy throughout.
- Skip-versus-failure behaviour documented, including that `state=error` covers both.

## Known limitations

1. **English baseline errors are not detected.** The rule is locale-vs-English, so a wrong
   standard number that originates in English passes all three checkers. Structural, not a
   bug to patch with more regex.
2. **Allowlist expiry is not enforced.** Stale entries print a note; nothing fails.
3. **`test:claims` is not run in CI.** It is deliberately outside `npm run build` (it tests
   the guards, not the site) but nothing else runs it either.

## Boundary

Guard v0.1 verifies cross-locale standard-number consistency. It does **not** certify factual
accuracy, evidence validity, regulatory authorisation, or product-claim compliance.

Acceptance of Guard v0.1 is not completion of Claims Governance.

## Next actions

1. **P0** — run `test:claims` in GitHub Actions on changes to the guards or their fixtures.
2. **P1** — make a stale allowlist entry fail the build.
3. **P2** — English-side fact checking, blocked on a real fact registry. Do not fake it with
   a hardcoded number table.
4. Claims Registry is a separate project: three registries, state machine, evidence
   lifecycle, approvals. Do not mix its acceptance with this one.

## Deployment note

A docs-only commit deploys as `state=error` because `netlify.toml`'s `[build].ignore`
compares `$CACHED_COMMIT_REF..$COMMIT_REF -- astro netlify.toml` and finds no site change.
That is a skip, not a failure. Read `[build].ignore` before reading the logs.
