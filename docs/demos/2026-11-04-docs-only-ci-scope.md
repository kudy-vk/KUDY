# Docs-only змены не ганяюць кодавыя CI checks

*2026-11-04T22:54:53Z by Showboat 0.6.1*
<!-- showboat-id: 3f2c1e4a-7b5d-4e8a-9c6f-1a2b3c4d5e6f -->

Змена #134: агульны deny-by-default скрыпт вырашае, ці з'яўляецца набор змен дакументальным. Кожны зменены файл павінен адпавядаць allowlist (`docs/` акрамя `docs/design-qa/`, `*.md`, `.cursor/`, issue-шаблоны, `LICENSE`); незнаёмы шлях або збой git — значыць «не docs-only», і ўсё ідзе.

```bash
node tools/ci/docs-only-scope.mjs 0c2085a5dfe0312ade56d23f6b05bf7026d89a07 53bf61e00531c9a0d88fca283e44dd1c4df2453d
```

```output
docs-only scope: docs-only=true (2 changed file(s))
```

Змена #133 (`AGENTS.md` + `docs/human-actions.md`) — дакументальная: кодавыя gates у CI могуць быць пропушчаны.

```bash
node tools/ci/docs-only-scope.mjs 6dfc81b6d6cb261a7524b602a9feee59df55f178 0c2085a5dfe0312ade56d23f6b05bf7026d89a07
```

```output
docs-only scope: docs-only=false (10 changed file(s))
```

Змена #125 змяніла `.github/workflows/` — гэта код, checks ідуць.

```bash
node tools/ci/check-required-checks.mjs
```

```output
guard-required-checks: OK — required-checks runs npm ci + npm test + web build + server:typecheck + arch:check + windows portable subset + docs-only scope gates
```

Гард падае пры рэверце wiring-у: выдаленне `if: needs.scope.outputs.docs_only != 'true'` з любога з трох workflow-файлаў дае `docs-only scope wiring incomplete`, а ўмова на jobs `tests`/`gitleaks` — «tests and gitleaks must run on every change set».
