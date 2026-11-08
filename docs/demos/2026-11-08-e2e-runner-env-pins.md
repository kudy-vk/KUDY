# Ранэр E2E пінуе ўсе runner-controlled EXPO_PUBLIC_ ключы супраць .env хоста

*2026-11-08T14:49:55Z by Showboat 0.6.1*
<!-- showboat-id: b91e1844-0f2c-41f4-9bb2-16c0fb182c9b -->

Пін з #135 (issue #162, знаходка voka [key: partial-env-pin] на PR #161) пакрываў толькі `EXPO_PUBLIC_CATALOG_ORIGIN`: Expo CLI працягваў далучаць .env хоста для астатніх runner-controlled ключоў — `EXPO_PUBLIC_DEMO_MODE` (дэма-кантэнт у сюітах), `EXPO_PUBLIC_E2E_FEEDBACK` (feedback-UI па-за discovery) і `EXPO_PUBLIC_FEEDBACK_FUNCTIONS_URL` (старонні feedback-URL). startMetro цяпер пінуе ўсе чатыры да spread-у кліенцкага env, а каментар сцвярджае толькі запіненыя ключы. Блокі ідуць з кораня рэпазітара.

```bash
grep -oE "EXPO_PUBLIC_[A-Z0-9_]+: ''" tools/e2e-android/run-e2e.mjs
```

```output
EXPO_PUBLIC_CATALOG_ORIGIN: ''
EXPO_PUBLIC_DEMO_MODE: ''
EXPO_PUBLIC_E2E_FEEDBACK: ''
EXPO_PUBLIC_FEEDBACK_FUNCTIONS_URL: ''
```

Guard-тэст wiring (configuration-as-code): зняцце пінаў зачырваніць яго — праверана часовым адкочваннем фікса перад push.

```bash
node --test --experimental-strip-types tools/e2e-android/wiring.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```

```output
ℹ pass 15
ℹ fail 0
```
