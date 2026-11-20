# Гард бяспекі fail-closed на не-аб'ект packages (#343)

*2026-11-19T22:27:11Z by Showboat 0.6.1*
<!-- showboat-id: 4bdf3495-2073-4e83-abf8-3a344feb5ba6 -->

Змена #343: у `assertPackageSafe` умова перад цыклам цяпер патрабуе просты аб'ект (не радок/масіў) акрамя непустасці — lockfile з `packages: "junk"` раней заставаўся зелёным, прабягаючы пусты цыкл па радковых індэксных ключах. Трэці негатыўны тэст замацоўвае паводзіну fail-closed: пры рэверце ўмовы ён чырвоны (праверана рэвертам у сесіі, што рыхтавала змену).

```bash
node --test tools/ci/security-overrides-guard.test.mjs 2>&1 | grep -E '^(ok|not ok|# (tests|pass|fail))'
```

```output
ok 1 - root overrides pin the advisory-fixed versions
ok 2 - root lockfile has no vulnerable version of any remediated package, at any nesting level
ok 3 - web lockfile has no vulnerable version of any remediated package, at any nesting level
ok 4 - negative: a root lockfile copy with the packages map dropped fails closed (\#341)
ok 5 - negative: a web lockfile copy with an empty packages map fails closed (\#341)
ok 6 - negative: a root lockfile copy with a non-object packages value fails closed (\#343)
# tests 6
# pass 6
# fail 0
```
