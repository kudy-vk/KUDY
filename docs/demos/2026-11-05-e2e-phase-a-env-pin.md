# E2E фаза A застаецца без catalog origin пры наяўнасці .env хоста

*2026-11-05T23:31:59Z by Showboat 0.6.1*
<!-- showboat-id: 58022fce-9920-4d1d-a509-e0be3931b78f -->

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
ℹ pass 15
ℹ fail 0
```
