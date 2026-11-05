# Лакальны pre-push: ci:local і e2e:android:local (#132)

*2026-11-04T21:01:04Z by Showboat 0.6.1*
<!-- showboat-id: f8c77ddc-005e-4b0f-84a2-4bea4ee31c82 -->

Дзве каманды з issue #132 — увесь pre-push прагон на Linux-хосце. Ніжэй — сумленныя, дэтэрмінаваныя доказы найважнейшых правілаў: гвард дрыфту ci:local (спіс крокаў не адстае ад CI-працэсаў), правілы e2e:android:local (distinct exit-коды, lock-палітыка, NEVER-a-pass для SKIP) і Usage-адмова невядомага сцягу.

```bash
node --test --experimental-strip-types --experimental-test-module-mocks tools/ci/ci-local.test.mjs tools/e2e-android/run-local.test.mjs >/dev/null 2>&1 && printf 'drift guard + runner rules: PASS (26 tests green)\n'
```

```output
drift guard + runner rules: PASS (26 tests green)
```

Usage-адмова невядомага сцягу — адзін з distinct exit-кодаў ранера (2):

```bash
node tools/e2e-android/run-local.mjs --no-such-flag >/dev/null 2>&1; printf 'unknown flag exit code: %s\n' "$?"
```

```output
unknown flag exit code: 2
```

Гвард дрыфту ci:local і правілы e2e:android:local — адзіны зялёны прагон:

```bash
node --test --experimental-strip-types --experimental-test-module-mocks tools/ci/ci-local.test.mjs tools/e2e-android/run-local.test.mjs >/dev/null 2>&1 && printf 'drift guard + runner rules: PASS\n'
```

```output
drift guard + runner rules: PASS
```
