# Agent instructions

For a design-QA review, read `docs/agent-rules/design-qa.md` and run it on request and before closing any task that changes the interface. Design-QA is not run in CI and needs no model API key. Record unavailable device or baseline evidence as NOT-VERIFIED.

Before completing any implementation task, read and follow `docs/agent-rules/showboat.md`. It defines the mandatory, measurable conditions for creating a Showboat proof of work.

Before implementing any fix or feature, read and follow `docs/agent-rules/implementation-rules.md`. It lists the recurring defect patterns from the 2026-09-15 architecture review and the fix campaign (reverted-fix guards, contract restatement drift, platform assumptions, generated mirrors, runner wiring, stale docs, executor collisions) with the mandatory pre-push check for each.

When reviewing a diff, a PR, a branch before merge, or code you or another agent just wrote, read and follow `docs/agent-rules/code-review.md`. It defines review scope, the pre-checks to run before reading, the KUDY checklist, and the severity-graded output format.

When you claim, execute, block or hand back a task tracked as a GitHub issue in this repository, read and follow `docs/agent-rules/issue-workflow.md`. It defines the status-label protocol shared with the dispatcher, the claim and handback comments, and the PR contract that closes the issue on merge.

Search before adding helpers. On a jscpd fail, refactor or reuse; do not paste a second variant.

Local pre-push on the Linux host: `npm run ci:local` (the fast CI checks in workflow order, including `arch:check` and the jscpd gate `npx --yes jscpd@5.1.2 --config .jscpd.json --no-tips .`), then `npm run e2e:android:local` when `tools/ci/android-e2e-scope.mjs` says run=true (docs/agent-rules/android-e2e-local.md).

Before every push to a pull-request branch, read and follow `docs/agent-rules/android-e2e-local.md`. CI runs only the fast checks; when the change touches project code, the Android E2E suites run on a local emulator, and documentation-only or design-mockup changes skip them.

## Publish task breakdowns to GitHub Issues

After splitting an approved specification into tasks, create or update the corresponding GitHub Issues in this repository as part of the same work. Local task files alone do not complete the task breakdown. This rule authorizes issue creation and synchronization without another confirmation.

- Inspect existing issues first. Match stable task IDs, reuse existing issues and epics, and preserve unrelated content and execution state.
- Include the outcome, scope, testable acceptance criteria, proof requirements and specification/task-file references. Follow `.github/ISSUE_TEMPLATE/agent-ready.md` and the project's ticket-writing rules.
- Link tasks to their epic with `Epic: #NN` and dependencies with `Blocked-by: #NN`. If a prerequisite has no issue, create its tracking issue with the actual scope and dependencies; do not silently omit the blocker or invent an issue number.
- Keep tasks in backlog unless execution is explicitly authorized and prerequisites are verified. Board visibility is not permission to add `agent:ready`, start workers or change dispatcher settings.
- Verify that referenced documents are available in the runner checkout. If they are only local, state that publication is a prerequisite; do not present broken GitHub links as available documentation or queue the task.
- Record issue URLs beside the local task index, read back the created/updated issues, and verify their visibility in the dispatcher's backlog. Report any unavailable board verification explicitly.
- If publishing is blocked by permissions, usage limits or a service failure, preserve the completed drafts and created issue numbers, report the exact remaining tasks, and resume without duplicates when the blocker clears. Do not bypass an approval rejection or claim that unpublished tasks are in GitHub.

## Record human follow-up actions after a task

When a task ends with something a human must do themselves (merge or close a PR, a GitHub UI step, a settings change, a command on their machine, a paid service, and so on), do not leave it only in the chat summary. Add a one-line entry to the top of `docs/human-actions.md`: it starts with `Табе зрабіць:` and states what to do in the imperative, with the PR link (or the issue/commit link when there is no PR). No heading, no bold titles; one entry per task, newest first. Entries are human-facing documentation, so write them in Belarusian per `docs/agent-rules/documentation-language.md`. When the human confirms an action is done, remove its entry.

Every session's final report ends by answering one explicit question: are there human follow-up actions, yes or no — say "none" when there are none. Judgment work counts the same as mechanical steps: reviewing a design or rendered output, approving or rejecting an approach, taking a product or scope decision, owner-only choices. Anything only the owner can judge or decide is named in that report and, when it must not be lost, recorded in `docs/human-actions.md` as above.
