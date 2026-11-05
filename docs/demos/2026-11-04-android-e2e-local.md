# #124 — лакальны Android E2E: палітыка ронера і NOT-VERIFIED

*2026-11-04T22:30:00Z by Showboat 0.6.1*
<!-- showboat-id: 626c73c3-a670-48cb-8fab-385dc1d0308a -->

Палітыка ронера `npm run e2e:android:local` (issue #124): scope-пропуск, макет толькі на D:, блакіроўка па правілах `checkout-lock.mjs`, NOT-VERIFIED без прахода. Гэтыя блокі дэтэрміністычныя і ідуць з кораня рэпазітара; поўны прагон з эмулятарам — у справаздацы задачы.

Юніт-тэсты правілаў: кожнае правіла падае пры адкате (revert-эксперымент з нулявым парогам jscpd).

```bash
node --test tools/ci/android-e2e-local.test.mjs 2>&1 | grep '^ℹ' | grep -v duration
```

```output
ℹ tests 18
ℹ suites 9
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

NOT-VERIFIED на карані не на D:: каманда ніколі не рэпартуе праход, выходзіць з асобным кодам 86 і называе ўсе прычыны разам. Справаджэнне scope першае — гэта крок 1 кантракту issue #124, таму docs-only змены выходзяць са «skipped» яшчэ да праверкі макета.

```bash
KUDY_ANDROID_ROOT='Q:\no-such-root' npm run e2e:android:local; echo "exit=$?"
```

```output

> kudy@0.1.0 e2e:android:local
> node tools/ci/android-e2e-local.mjs

android-e2e scope: run=true (6 changed file(s))
Android E2E: NOT-VERIFIED (root Q:\no-such-root must be an absolute path on drive D:)
Android E2E: NOT-VERIFIED (java path Q:\no-such-root\java is not on drive D:)
Android E2E: NOT-VERIFIED (sdk path Q:\no-such-root\sdk is not on drive D:)
Android E2E: NOT-VERIFIED (checkout path Q:\no-such-root\checkout is not on drive D:)
Android E2E: NOT-VERIFIED (buildRoot path Q:\no-such-root\build is not on drive D:)
Android E2E: NOT-VERIFIED (avdHome path Q:\no-such-root\avd is not on drive D:)
Android E2E: NOT-VERIFIED (userHome path Q:\no-such-root\user-home is not on drive D:)
Android E2E: NOT-VERIFIED (tmp path Q:\no-such-root\tmp is not on drive D:)
Android E2E: NOT-VERIFIED (logs path Q:\no-such-root\logs is not on drive D:)
Android E2E: NOT-VERIFIED (visual path Q:\no-such-root\visual is not on drive D:)
Android E2E: NOT-VERIFIED (npmCache path Q:\no-such-root\npm-cache is not on drive D:)
Android E2E: NOT-VERIFIED (lockFile path Q:\no-such-root\runner.lock is not on drive D:)
exit=86
```
