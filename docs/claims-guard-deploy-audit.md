# Claims Guard — deployment audit

Measured on the live Netlify site `iplmanufacturer` (`b00ddee2-1afa-4c53-8b6e-5558280297fd`)
on 2026-11-04, while landing PR-1 through PR-4.

## What the guards are, and what they are not

Three checkers, all wired into `npm run build`, which is the command Netlify runs:

| guard | step | reads | compares |
|---|---|---|---|
| `check-claims-parity.mjs` | 5 | `src/content/blog/<locale>/*.mdx` | locale post vs its English post |
| `check-claims-messages.mjs` | 6 | `messages/<locale>.json` | locale value vs the same English key |
| `check-claims-dist.mjs` | 17 | `dist/**/*.html` | locale page vs its English page |

All three implement the same rule: a standard number present in a locale but absent from the
English baseline is drift. Exceptions live in one file, `scripts/claims-parity.json`.

**They check relative consistency, not factual correctness.** The English page is the
baseline, so a wrong number that originates in English passes all three. That is not a bug to
be patched with more regexes; it needs an approved fact registry, which does not exist yet.

## Deploy evidence

```
07:24:55  ready    7732eb01   deploy_time 156s   build ran, published
07:36:14  error    09c8544b   no times           build ran, FAILED at the guard
07:37:24  error    ac90ca01   no times           never built - skipped
07:39:09  error    3c0abf10   no times           never built - skipped
07:43:59  error    0b455d7e   no times           never built - skipped
07:46:09  ready    46014ea2   deploy_time 178s   build ran, published
08:16:24  ready    fbc6c174   deploy_time 166s   build ran, published
```

### The one real guard interception

`09c8544b` deliberately appended `ISO 13485 IEC 62471` to a German message value. Netlify ran
the build and stopped at step 6:

```
扫描 21 个语种，比对 169 个含标准编号的键        (168 normally, 169 with the injection)
❌ 2 处未登记的漂移:
  messages:servicesPage.oemOdm.meta.description → 13485  (1 个语种: de)
  messages:servicesPage.oemOdm.meta.description → 62471  (1 个语种: de)
Failed during stage 'building site': Build script returned non-zero exit code: 2
```

`astro build` never started. Production kept serving `7732eb01` throughout, and
`https://iplmanufacturer.com/de/services/oem-odm` stayed 200 without the injected string.

### Why three other deploys show `error`

`netlify.toml` carries:

```toml
ignore = "bash -c '... git -C \"$root\" diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- astro netlify.toml'"
```

Exit 0 means **skip the build**. `CACHED_COMMIT_REF` is the last commit that actually built,
not the previous commit. So:

- `ac90ca01` reverted the injection, which made its tree identical to `7732eb01` → no diff →
  skipped. Cancelling a bad change does not rebuild anything.
- `3c0abf10` and `0b455d7e` were empty commits → no diff → skipped.

### The audit trap

**The API reports a skipped build and a failed build identically: `state=error`, empty
`build_time`, empty `deploy_time`, empty `error_message`.** Only the UI label or the build log
distinguishes "Deploy canceled" from "Failed during stage 'building site'".

I misread three skips as a broken deploy channel and started speculating about build-minute
quotas. The `ignore` rule was in `netlify.toml` the whole time; reading it would have settled
the question in one step. **When a Netlify deploy looks failed, read `[build].ignore` before
reading the logs.**

### What protects production

A failed or skipped build does not move the `published_deploy` pointer. The pointer only
advances on `ready`. Verified: after the failed `09c8544b`, the published deploy was still
`7732eb01`, and it advanced to `46014ea2` and then `fbc6c174` only after those builds
completed.

## Open items

1. No positive test that a wrong number on an **English** page is caught. It cannot be caught
   by the current rule. PR-4 asserts this as a known blind spot rather than hiding it.
2. No stale-allowlist enforcement. The checkers print a note when an entry no longer matches,
   but nothing fails the build. A shipped exception could outlive its reason.
3. `test:claims` (11 cases) is not run in CI. It is not in `npm run build` on purpose — it
   tests the guards, not the site — but nothing else runs it either.
4. Deploy logs are not readable by the current CLI token (`404` on `logs --source deploy`,
   `401` on `/accounts`), so build output can only be inspected in the UI.
