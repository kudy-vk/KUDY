# Android verification for pull requests

This file is the single source of truth for Codex, Claude Code, Cursor, Zcode and any other harness.

Run the normal fast CI checks. On the Linux dev host, run `npm run ci:local` before pushing.
The hosted `android-e2e` workflow starts only on `workflow_dispatch`.

On docs-only changes (`tools/ci/docs-only-scope.mjs`), CI skips the code gates while
`tests`, `gitleaks` and `guard-required-checks` still run.

## 1. Choose Android checks from the PR diff

The owner decision of 2026-11-26 makes Android smoke a pre-merge requirement for high-risk PRs.
The author records the Android impact and reason in the PR's Verification section and updates
the decision after relevant changes to the diff. A reviewer can require smoke and name the
scenario at risk.

### No Android impact

Use the normal CI checks. Examples include prose, unattached design mockups and web-only code
with no change to shared code, dependencies or data consumed by Android. If Android impact
cannot be ruled out, use the standard Android checks at minimum.

### Standard Android risk

Build the APK from the PR commit using the [local Android build instructions](../development_setup.md).
Include an ABI supported by the phone. Pair a test phone through Android Wireless Debugging and
confirm its serial with `adb devices`. Install the APK on that serial:

```sh
adb -s <phone-serial> install -r <apk-path>
```

Launch KUDY and exercise the changed scenario. For a dev-client build, use Metro from the
same commit as the APK. Record the commit SHA, device model, Android version, scenario and result
in the PR. If the build or phone check cannot be completed, record `Android device: NOT-VERIFIED (<reason>)`.

### High Android risk

Use the device checks above and run Android smoke before merge when the diff materially changes
startup or bootstrapping, native dependency integration or permissions, shared navigation or
persistence, or when a reviewer identifies a comparable regression risk. Cite the code path
and the behavior at risk. Build a dev-client APK at the PR head and use an emulator you control.
Run the existing suite command from the same checkout:

```sh
npm run e2e:android -- --suite smoke --serial <emulator-serial> --apk <apk-path>
```

Run `walk` or `discovery` with the same command only if the change needs coverage from that suite.
Record the suites and commit SHA in the PR's Verification section. A nonzero exit, a
`SKIP e2e:android` line, or missing device or emulator evidence leaves the required check open.
Resolve a regression before merge. If a suite fails, compare that suite against a fresh
`origin/main` build. For a failure on both revisions, record both SHAs, both APK SHA-256 values,
the logs and the tracking issue. Keep the failure visible for the merge decision.

## 2. Run the full local suite when requested

Use `npm run e2e:android:local` when the full suite is needed. The runner's
`tools/ci/android-e2e-scope.mjs` check skips documentation-only diffs within that command.

- `npm run e2e:android:local` runs its own scope check. On `run=false` it prints that and exits 0. On `run=true` it builds the debug APK for the exact HEAD, boots the AVD `kudy-ci` (pixel_5, android-35 emulator image; the build still uses platforms/build-tools 36) with CI's flags except guest RAM (see the Setup bullet in `docs/development_setup.md`) and KVM, runs the suites `smoke`, `walk` and `discovery`, then the non-gating `visual:check`, and prints one summary line: `Android E2E: passed on <sha>`, `Android E2E: failed (<suite>) on <sha>` or `Android E2E: NOT-VERIFIED (<reason>)`. A `SKIP e2e:android` line is never a pass — it becomes `NOT-VERIFIED`.
- Exit codes: 0 — passed (or not needed); 1 — a failed suite; 2 — usage; 3 — NOT-VERIFIED; 4 — the host is locked by another run.
- One run at a time per host (the runner enforces it): a host lock in `$KUDY_ANDROID_ROOT` (default `~/KUDY-Android`) with the checkout-lock policy — a stale lock is reported, never taken over. The runner boots its own emulator and never reuses or kills one it did not start: a coexisting foreign emulator (another session's) is left alone and the suites are pinned to the runner's own serial. Real conflicts still refuse the run: a busy Metro or origin port (8083/8792) is a named refusal, never a kill.
- Setup (JDK 17, SDK system image, AVD, KVM, Chromium): the Linux section of `docs/development_setup.md`. The local boot deviates from CI's flags in one evidence-based way — guest RAM 4096 instead of 2048, the value every android-35 evidence run used (the previous android-36 image ANR'd SystemUI under app load at any RAM and is dropped — see the section in `docs/development_setup.md`). RAM does not change rendered pixels, so `visual:check` baseline parity is unaffected.
- One command, two host runners: `e2e:android:local` is `tools/ci/android-e2e-local.mjs` — on Windows it runs #124's Windows path (drive D: layout, exit codes 0/1/64/75/86), on Linux it delegates to `tools/e2e-android/run-local.mjs` with the exit codes above.
