# messages/

**The only files here that matter are the `*.json` at this level** — 22 locale files,
one per language, the live i18n source for the site.

Everything else in this directory is history or tooling:

- `*.bak` — pre-edit snapshots (batch A/B translations). Nothing reads them; they are
  the only record of the wording before those passes.
- `check_pt_it.js` — a one-off checker, not part of the build.

Moved here from the repo root on 2026-10-21 so the app is self-contained. Two things
followed the path: the imports in `astro/src/lib/i18n.ts`, and the pre-commit R5
allowlist key in `ops/seo/clean_check.py` (`astro/messages/`).
