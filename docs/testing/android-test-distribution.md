# Раздача Android QA-зборак на тэлефоны (EAS Internal Distribution)

Runbook задачи [PHONE-01 #322](https://github.com/kudy-vk/KUDY/issues/322)
эпіка [#95](https://github.com/kudy-vk/KUDY/issues/95) і спекі
[2026-11-17-phone-builds-eas](../superpowers/specs/2026-11-17-phone-builds-eas/spec.md).
Мэта: тэстар атрымлівае standalone-APK на Android-тэлефон **без кампутара,
USB і Metro** — спасылка з QR старонкі зборкі, усталяванне, запуск.

## Рэкорд рашэння канала (#95 AC1)

| Пытанне | Рашэнне |
|---|---|
| Канал | **Expo EAS Internal Distribution** (Android APK) |
| Дата рашэння | 2026-11-17, уласнік vokhandcrafts, у сесіі агенту (квіз: Firebase адкінуты — адзін сэрвіс з Expo-стэкам праекта) |
| Уладальнік акаўнта | vokhandcrafts (асобны акаўнт expo.dev, а не крама; Play Console і Apple Developer — гэта #15 і па-за скоупам) |
| Профіль зборкі | `sandbox` з eas.json: `distribution: internal`, `buildType: apk`, `autoIncrement: true`, пакет `by.kudy.app.sandbox` |
| Keystore | EAS managed credentials: першая зборка стварае ключ сама; свой ключ не імпартуецца |
| Ліміты тарыфу | Free: 15 Android + 15 iOS зборак/месяц; чарга low-priority (пік — да 90+ хв чакання); таймаўт зборкі 45 хв. OTA: публікацыі не ліміцаваныя, 1K MAU, 100 GiB трафіку. Праверана 2026-11-17 на expo.dev/pricing — пры першай зборцы згадзіць лічбы з актуальнай старонкай |
| Retention | Білды ў хмары Expo захоўваюцца ў гісторыі праекта без аўта-выдалення (у адрозненне ад Firebase App Distribution, дзе 150 дзён); pinned-копіі, калі запатрэбуюцца, — асобнае рашэнне PHONE-02 (#95 AC4) |
| Адклінанне доступу | Access token адклікаецца ў expo.dev → Account settings → Access tokens; доступ да праекта — ролямі ў expo.dev |
| Ананімны доступ | Па змоўчанні ўсякі з URL мае даўнлоад білда; тое самае дакументавана ў доках Expo. Абавязковы крок першай налады (ніжэй) — выключыць «Unauthenticated access to internal builds» у наладах праекта |

## Аднаразовая налада (крокі ўласніка)

1. Ствары акаўнт на [expo.dev](https://expo.dev) (SignUp, без платнага плана).
2. У expo.dev → Account settings → **Access Tokens** зрабі новы токен.
3. Задай яго як GitHub secret і нікуды болей не перадавай (ні ў чат, ні ў
   issue, ні ў лагі):
   ```sh
   gh secret set EXPO_TOKEN --repo kudy-vk/KUDY   # токен з шаблону ўводзіцца інтэрактыўна
   ```
   Далей eas-cli на гэтым хосце лагінцца тым жа токенам:
   ```sh
   eas login --token "$EXPO_TOKEN"   # альбо: eas login (інтэрактыўна)
   ```
4. На expo.dev у наладах праекта выключы **Unauthenticated access to
   internal builds** (кладка Project settings) — гэта выканае «рэальны login»
   патрабаванне #95 AC3: без уваходу ў дазволены акаўнт старонка білда не
   аддае APK.

Пасля крокаў 1–4 агент працягвае задачу: `eas whoami` павінен паказаць
акаўнт уласніка.

## Зборка і спасылка (шлях PHONE-01, разавы)

```sh
eas whoami                                          # праверка аўтэнтыфікацыі
eas build --profile sandbox --platform android      # хмарная зборка, --no-wait аддае кантроль адразу
```

Вынік: старонка зборкі на expo.dev з **даўнлоадам APK** і **QR-кодам**.
Першая зборка таксама запытае выбар keystore (адказаць «Expo managed») і
ініцыялізуе versionCode на Expo-серверах (`cli.appVersionSource: remote`).

## Усталяванне на тэлефоне (крокі тэстара)

1. Сканіруй QR старонкі зборкі камерай тэлефона (альбо адкрый спасылку на
   тэлефоне), увайдзі ў дазволены Expo-акаўнт.
2. Спампуй APK і ўсталюй (Android запытае дазвол на ўстаноўку з гэтай крыніцы).
3. Запускай **KUDY Sandbox** — яна жыве поруч з іншымі апкамі, `by.kudy.app.sandbox`
   не перазапісвае будучую `by.kudy.app`.
4. Выдаленне QA-апкі — стандартнае выдаленне праз лаўнчар.

## Верыфікацыя APK (#95 AC2)

Правяраецца выключна існым інструментам працэдуры
[android-qa-apk-verification.md](android-qa-apk-verification.md):
`tools/android-build/qa-apk-verify-cli.mjs` з `--package by.kudy.app.sandbox`
і рэальнымі шляхамі/SHA хмарнай зборкі. Сінтаксіс выкліку, правераныя поля
(package/applicationId, versionCode, versionName, подпіс v2/v3, SHA-256) і
забароненыя пакеты — там, не дублююцца тут. Метаданы без вярованага
`aapt2`/`apksigner` не з'яўляюцца доказам.

## Сбой і гісторыя

- Зборка ўпала: лаг і статус — на старонцы білда; аўтаматычны трыгер на мерж,
  каментар у PR і каталог гісторыі версій з адкатам — задача
  [PHONE-02 #323](https://github.com/kudy-vk/KUDY/issues/323).
  Збой не апублікаваны тэстарам — гэта чырвоны білд у хмары, не «готы APK».
- OTA без перазборкі (EAS Update, канал sandbox) — задача
  [PHONE-03 #324](https://github.com/kudy-vk/KUDY/issues/324).
