# Local Android E2E before every push

This file is the single source of truth for Codex, Claude Code, Cursor, Zcode and any other harness.

CI runs only the fast checks. The hosted `android-e2e` workflow starts only by hand (`workflow_dispatch`). On the private repository's 2-core runner it took up to 90 minutes and never passed (owner decision 2026-11-04). The Android E2E suites therefore run on a local emulator before each push to a pull-request branch.

On a docs-only change set (`tools/ci/docs-only-scope.mjs`, deny by default) CI additionally skips the pure code gates — `windows-portable`, `lint`, `server-typecheck`, `engine-regressions`, `web-build`, `jscpd` and `web-e2e` — while `tests`, `gitleaks` and `guard-required-checks` always run (issue #134, owner decision 2026-11-04).

## 1. Decide whether the push needs it

Run this before every `git push` to a PR branch, and before `gh pr create`:

```sh
git fetch origin main
node tools/ci/android-e2e-scope.mjs "$(git merge-base origin/main HEAD)" "$(git rev-parse HEAD)"
```

In PowerShell: `node tools/ci/android-e2e-scope.mjs (git merge-base origin/main HEAD) (git rev-parse HEAD)`.

- `run=false`: the PR changes only documentation, design mockups under `docs/` (not their integration into the app), `*.md` files or other allowlisted paths. Skip the suites.
- `run=true`: the PR changes project code. Run the suites (section 2).

The allowlist in `tools/ci/android-e2e-scope.mjs` is the only definition of "not project code". Deny by default: an unlisted path, an unknown change set or a git failure means `run=true`. Do not decide by eye. If a path is wrongly classified, change the allowlist and its test in `tools/ci/e2e-workflows.test.mjs` in a separate PR.

A previous local pass still holds when `node tools/ci/android-e2e-scope.mjs <passed-sha> <HEAD>` prints `run=false`: since that pass, only allowlisted files changed. Name both SHAs in the report.

## 2. Run the pre-push checks

On the Linux dev host the two commands are the whole pre-push run:

```sh
npm run ci:local
npm run e2e:android:local
```

- `npm run ci:local` runs the fast CI checks in the workflow order (tests, lint, server-typecheck, engine-regressions, web-build, gitleaks, web-e2e, jscpd, guard-required-checks) and stops at the first failure. The Windows-only `windows-portable` job is listed as skipped. The drift guard `tools/ci/ci-local.test.mjs` fails when a fast workflow step's command is missing, so the local list cannot drift from CI.
- `npm run e2e:android:local` runs the scope check of section 1 itself. On `run=false` it prints that and exits 0. On `run=true` it builds the debug APK for the exact HEAD, boots the AVD `kudy-ci` (pixel_5, android-35 emulator image; the build still uses platforms/build-tools 36) with CI's flags except guest RAM (see the Setup bullet in `docs/development_setup.md`) and KVM, runs the suites `smoke`, `walk` and `discovery`, then the non-gating `visual:check`, and prints one summary line: `Android E2E: passed on <sha>`, `Android E2E: failed (<suite>) on <sha>` or `Android E2E: NOT-VERIFIED (<reason>)`. A `SKIP e2e:android` line is never a pass — it becomes `NOT-VERIFIED`.
- Exit codes: 0 — passed (or not needed); 1 — a failed suite; 2 — usage; 3 — NOT-VERIFIED; 4 — the host is locked by another run.
- One run at a time per host (the runner enforces it): a host lock in `$KUDY_ANDROID_ROOT` (default `~/KUDY-Android`) with the checkout-lock policy — a stale lock is reported, never taken over. The runner boots its own emulator and never reuses or kills one it did not start: a coexisting foreign emulator (another session's) is left alone and the suites are pinned to the runner's own serial. Real conflicts still refuse the run: a busy Metro or origin port (8083/8792) is a named refusal, never a kill.
- Setup (JDK 17, SDK system image, AVD, KVM, Chromium): the Linux section of `docs/development_setup.md`. The local boot deviates from CI's flags in one evidence-based way — guest RAM 4096 instead of 2048, the value every android-35 evidence run used (the previous android-36 image ANR'd SystemUI under app load at any RAM and is dropped — see the section in `docs/development_setup.md`). RAM does not change rendered pixels, so `visual:check` baseline parity is unaffected.
- One command, two host runners: `e2e:android:local` is `tools/ci/android-e2e-local.mjs` — on Windows it runs #124's Windows path (drive D: layout, exit codes 0/1/64/75/86), on Linux it delegates to `tools/e2e-android/run-local.mjs` with the exit codes above.

## 3. Act on the result

- Pass: push, and keep the line `Android E2E: passed on <sha> (smoke, walk, discovery)` in the PR body's Verification section.
- Failure: run the failing suite again on `origin/main`, with an APK rebuilt from `origin/main`. The runner installs whatever APK is in the checkout, and that file survives `git checkout`. Record the APK SHA-256 that the runner prints for both runs.
  - If it passes on `main`, your change broke it. Fix it before you push.
  - If it fails on `main` too, the failure is not yours. Push, write `Android E2E: failed (<suite>) on <sha>; also fails on main <main-sha>` in the PR body, and link an issue for the failure (open one if none exists). Name the artifacts path (`tools/e2e-android/artifacts/`).
- No SDK, no emulator, a `SKIP e2e:android` line, or an emulator that does not boot: this is not a pass. Push, and write `Android E2E: NOT-VERIFIED (<reason>)` in the PR body. Reviewers and Judge treat it as an open check, not a green one.
- `run=false`: write `Android E2E: not needed (scope run=false on <sha>)`.

Starting the hosted workflow by hand (`gh workflow run android-e2e.yml --ref <branch>`) is a last resort for an owner request. It does not replace the local run.
