# Спасылка зваротнай сувязі на старонцы прыватнасці

*2026-11-03T23:45:02Z by Showboat 0.6.1*
<!-- showboat-id: 8b5f2fd0-f84b-4650-b671-3020b7ec8ab8 -->

Старонка прыватнасці вэба вядзе карыстальніка па зваротную сувязь у GitHub Issues асноўнага рэпазіторыя kudy-vk/KUDY, а не ў чарнавы рэпазіторый пераносу.

```bash
grep -o "supportIssuesUrl: '[^']*'" web/lib/app-links.ts
```

```output
supportIssuesUrl: 'https://github.com/kudy-vk/KUDY/issues'
```

```bash
node --test --experimental-strip-types web/privacy-page.test.ts 2>&1 | grep -E '^ℹ (pass|fail)'
```

```output
ℹ pass 5
ℹ fail 0
```
