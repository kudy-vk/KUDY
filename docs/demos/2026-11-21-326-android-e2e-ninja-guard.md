# #326: ранер Android E2E — NOT-VERIFIED пры старым ninja (SDK 58, MAX_PATH)

Задача [#326](https://github.com/kudy-vk/KUDY/issues/326). Зборка SDK 58 (RN 0.88) стварае аб'ектныя шляхі codegen даўжынёй за 260 знакаў; ninja 1.10.2 з Android SDK не мае маніфеста доўгіх шляхоў і падае з «Filename longer than 260 characters» — працэс збіраўся 7 хвілін і паміраў. Ранер цяпер дае NOT-VERIFIED з прычынай да зборкі. Поўны цягнік smoke+walk+discovery прайшоў на звычайным HEAD з гэтай зменай.

Дэма: юніт-тэсты шлюза + жывы выклік шлюза на рэальным хосце.

## Тэсты шлюза

```bash
set -o pipefail
node --test --experimental-strip-types --experimental-test-module-mocks --test-reporter=spec --test-timeout=60000 tools/ci/android-e2e-local.test.mjs 2>&1 | sed -E 's/ \([0-9.]+ms\)//g' | grep -E '^  ✔ ' | grep -i ninja
```

```output
  ✔ includes the SDK ninja long-path reason (#326; revert: drop the notVerifiedReasons call → this test fails)
  ✔ names an SDK ninja older than 1.11 (revert: the swap in docs/development_setup.md is undone → reason is gone, the build fails cryptically)
  ✔ passes with ninja >= 1.11, with no cmake dir, and never fires on POSIX
  ✔ stays silent while any SDK ninja satisfies the minimum (mixed cmake installs)
  ✔ parses one- and two-component ninja versions
```

## Жывы выклік шлюза на рэальным хосце

```bash
node --input-type=module -e "import { sdkNinjaLongPathReason } from './tools/ci/android-e2e-local.mjs'; const r = sdkNinjaLongPathReason('D:/KUDY-Android/sdk'); console.log('guard on the real host SDK:', r === null ? 'clean (ninja >= 1.11 present)' : r);"
```

```output
guard on the real host SDK: clean (ninja >= 1.11 present)
```
