# E2E фаза A застаецца без catalog origin пры наяўнасці .env хоста

*2026-11-05T00:30:25Z by Showboat 0.6.1*
<!-- showboat-id: cafe7b7a-08b1-4b95-a2a7-697dd7c5d2b5 -->

Runner Android E2E павінен сам вырашаць, які catalog origin трапляе ў bundle: фаза A smoke-сьюіту задакументавана як «no catalog origin». Expo CLI далучае .env праекта для кожнага EXPO_PUBLIC_ ключа, якога няма ў process.env, таму .env аператара (gitignored) пратэкаў у фазу A і тры unavailable-кейсы атрымлівалі не тыя станы. startMetro цяпер пінуе пусты EXPO_PUBLIC_CATALOG_ORIGIN да spread-у кліенцкага env — пазначэнне кананічнае: app чытае '' як «не сканфігуравана» (catalogOriginFrom).

```bash
grep -c "EXPO_PUBLIC_CATALOG_ORIGIN: ''" tools/e2e-android/run-e2e.mjs
```

```output
1
```

Guard-тэст wiring (configuration-as-code): зняцце піну зачырвенее яго — праверана часовым адкочваннем перад push.

```bash
node --test --experimental-strip-types tools/e2e-android/wiring.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'
```

```output
ℹ pass 13
ℹ fail 0
```
