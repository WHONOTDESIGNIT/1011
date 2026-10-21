# 1011 · project instructions for agents

Owner: WHONOTDESIGNIT. Remote: https://github.com/WHONOTDESIGNIT/1011

## Where things are

- **Repo root = this checkout.** Use relative paths (`astro/`, `ops/seo/`, `messages/`).
  Never hardcode a drive letter: this repo is cloned on more than one machine, and
  `clean_check.py` (the pre-commit hook) rejects commits that do.
- The site is `astro/` and **only** `astro/` — `netlify.toml` has `base = "astro/"`.
- Live locale files: `messages/*.json`. Nothing else under `messages/` is live.
- Ops scripts + credentials: `ops/seo/` (read by the Windows scheduled tasks; don't move).

## Decisions already made (do not re-litigate)

- **2026-10-21 — repo root un-nested.** It used to live three directories deep under a
  triple `1011-main` path; it is now a single checkout at a plain path
  (`<repos>/1011` on the owner's machine). The old nested tree is kept frozen as a
  fallback until the new root has shipped a deploy; nothing new goes there.
- **2026-10-21 — rejected: flattening `astro/` to the repo root.**
  It would mean changing `base`, 22 `../../../messages` imports, ~34 script paths and a
  1,300 MB rebuild, to save one directory level.
- **2026-10-21 — `site-urls.txt` is a build artifact, not a tracked file.**
  `astro/scripts/generate-site-urls.mjs` rewrites it every build; `ops/seo` reads it from
  disk. A fresh clone must build once before the scheduled tasks run.
- **2026-10-21 — IndexNow failures are classified, not all-red.**
  4xx except 429 fails the build (our config is wrong); 429/5xx/network warn and pass.
- **2026-10-21 — moving the checkout is a local operation.**
  Netlify builds from the git repo and the repo-relative `netlify.toml`; the local path is
  irrelevant. What does break is anything with a hardcoded path: the scheduled tasks and
  `DSH_REPO_ROOT` in `ops/seo/.env`. See `ops/seo/MOVE-CHECKLIST.md`.
- **2026-10-21 — machine state lives next to the checkout, never in it.**
  `..\_machine\` (a sibling of the repo root, dated files) holds the scheduled-task XML
  exports, the machine-path note and build logs. Rejected: putting them in repo docs —
  `clean_check.py` rule R1 blocks absolute paths, and that is the intended behaviour.
  This folder is deliberately outside git and outside any archive: it is machine state, not
  project history.
- **2026-10-21 — one topic per branch and commit.**
  `chore/drop-strays` was meant to be deletions only, but carried the relocation docs
  (`d8f07676`). Not worth rewriting, but the next relocation-metadata change gets its own
  `chore/repo-relocation` branch instead of riding on an unrelated one.

## Retiring the old tree

No dependency on any deploy: Netlify never sees the local path. The old checkout may be
retired once it holds nothing unique — both commands must be empty:

```powershell
git -C <old-tree> log --oneline --not origin/main   # empty = no unpushed work
git -C <old-tree> status --porcelain                # empty = nothing uncommitted
```

The freeze markers sit *outside* the repo (one level and two levels above it), so they do
not dirty that tree. Retire into a bundle + delete, don't leave the copy around: a second
tree with real history is exactly the disease this cleanup removed.

## Rules for changes

- Branch → push → the owner merges. Don't push to `main` directly.
- Never create files at the repo root; scratch work goes outside the repo.
- Build must be green: `cd astro; npm run build` → `✅ all checks passed`, 3,433 pages.
- Guard failures: read `ops/RUNBOOK.md` first, never edit the guard to pass.
- One-time per clone: `git config core.hooksPath ops/seo/git-hooks`.
- Machine-specific values (paths, credentials) belong in untracked files, not in commits.
