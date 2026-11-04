# Local Android E2E before every push

This file is the single source of truth for Codex, Claude Code, Cursor, Zcode and any other harness.

CI runs only the fast checks. The hosted `android-e2e` workflow starts only by hand (`workflow_dispatch`). On the private repository's 2-core runner it took up to 90 minutes and never passed (owner decision 2026-11-04). The Android E2E suites therefore run on a local emulator before each push to a pull-request branch.

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

## 2. Run the suites

Use `npm run e2e:android:local` once it exists (issue #124: SDK, emulator and builds on drive D:).

Until then, on a host with a JDK 17, an Android SDK and the AVD `kudy-ci`:

1. Build the debug APK with the documented procedure in `docs/development_setup.md` («Лакальная debug-зборка Android на Windows»; on Linux, `npx expo prebuild --platform android --no-install` and `./gradlew assembleDebug` in `android/`).
2. Boot the emulator with the same flags as `.github/workflows/android-e2e.yml` and the visual baselines in `docs/design-qa/baselines/`. Other flags can produce false `visual:check` diffs. Wait until `adb shell getprop sys.boot_completed` prints `1`.

```sh
emulator -avd kudy-ci -no-window -no-audio -no-snapshot -gpu swiftshader_indirect -memory 2048
```

3. Run each suite and check that each one exits 0 and prints no `SKIP e2e:android` line:

```sh
npm run e2e:android -- --suite smoke
npm run e2e:android -- --suite walk
npm run e2e:android -- --suite discovery
```

4. For a change to the interface, also run `npm run visual:check -- --out <dir>`. It is a non-gating report for design-QA (`docs/agent-rules/design-qa.md`).

Run only one Android E2E run at a time per host: other agent sessions share the machine, and every run uses the same Metro port (8083) and origin port (8792). If `adb devices` already lists an emulator you did not start, or either port is busy, wait for that run to finish. Do not start a second emulator. Never kill an emulator, Metro or origin server you did not start.

## 3. Act on the result

- Pass: push, and keep the line `Android E2E: passed on <sha> (smoke, walk, discovery)` in the PR body's Verification section.
- Failure: run the failing suite again on `origin/main`, with an APK rebuilt from `origin/main` (step 1 of section 2, or `--apk <main build>`). The runner installs whatever APK is in the checkout, and that file survives `git checkout`. Record the APK SHA-256 that the runner prints for both runs.
  - If it passes on `main`, your change broke it. Fix it before you push.
  - If it fails on `main` too, the failure is not yours. Push, write `Android E2E: failed (<suite>) on <sha>; also fails on main <main-sha>` in the PR body, and link an issue for the failure (open one if none exists). Name the artifacts path (`tools/e2e-android/artifacts/`).
- No SDK, no emulator, a `SKIP e2e:android` line, or an emulator that does not boot: this is not a pass. Push, and write `Android E2E: NOT-VERIFIED (<reason>)` in the PR body. Reviewers and Judge treat it as an open check, not a green one.
- `run=false`: write `Android E2E: not needed (scope run=false on <sha>)`.

Starting the hosted workflow by hand (`gh workflow run android-e2e.yml --ref <branch>`) is a last resort for an owner request. It does not replace the local run.
