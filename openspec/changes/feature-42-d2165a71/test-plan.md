## Coverage Strategy

Specifications remain the source of unit-test requirements. This plan records only additional
integration and end-to-end obligations, the acceptance testing envelope, and exceptional human-only
obligations.

The change adds one three-line review entry to `.validator/config.yml` and touches no application,
kit, template, or script code. The one real boundary is how agent-validator turns the config into the
gates it runs. The validator's own CLI (`validate`, `list`, `run --enable-review`) exercises that
boundary directly. The repository has no validator-config test harness, and the design rejects adding
one (a YAML dependency or a fragile text assertion to guard one entry). So no committed automated
test is added. Instead, one required, uncommitted live integration check (INT-001) runs during
implementation verification. With `design.md` → Verification and the exploratory acceptance pass, it
provides the evidence. The existing `npm test`, `npm run lint`,
`npm run build`, and `npm run verify` suites remain the regression guard for the unchanged
presentation code.

## Integration Tests

### INT-001: Explicit enablement runs task-compliance on main's configuration
- Covers: `repository-quality-gates` → Opt-in task-compliance review → "Explicit enablement runs the
  review"; Existing validator gates unchanged → "Enabled run adds only task-compliance".
- Boundary: the `.validator/config.yml` on this branch, read by the installed `agent-validator`
  runtime and run through the configured codex/gpt-6-sol reviewer.
- Setup: the change branch with the config edit committed, so that a change under `.` is detected
  against `origin/main`. Use `openspec/changes/feature-42-d2165a71/tasks.md` as the task file.
- Action: once, run
  `agent-validator run --enable-review task-compliance --context-file openspec/changes/feature-42-d2165a71/tasks.md`.
- Assertions: the run's `validator_logs/` output shows a `task-compliance` review job that executed,
  not one skipped or absent. Its prompt or log contains the task file's contents as context. The
  `code-quality` and `skill-quality` reviews also ran. No review gate other than these three ran.
  Review findings don't count as failures of this check; the check is about execution, not verdict.
- Execution: a manual command in the implementation task's verification step (`design.md` →
  Verification step 6). It is not committed and not in CI. It is required before the PR is declared
  ready. If codex is unavailable, the scenario is reported as unverified on `main` in the PR
  description. `validate`, `list`, and the fixture eval are not substitute evidence.

A committed integration test that parses `.validator/config.yml` is still not warranted. It would only
repeat what `agent-validator validate` and `list` report, using a parser the repository doesn't
otherwise depend on. agent-validator's own suite covers the general semantics of `enabled: false` and
`--enable-review`.

## End-to-End Tests

None. The end-to-end journey is an Agent Runner implement-task run calling
`agent-validator run --enable-review task-compliance --context-file <task>`. It crosses into Agent
Runner and the and-scene eval harness, both outside this repository. HT-001, the eval Paul runs,
covers that journey only for the fixture's claude/sonnet-5.5 config. INT-001 is the evidence for
`main`'s codex configuration.

## Acceptance Testing Envelope

- Environments and sandboxes: the factory clone of `Codagent-AI/and-scene` on the change branch,
  with the installed `agent-validator` CLI on `PATH`, Node/npm for the repository suites, and
  `chrome-devtools-axi` (not needed for this change). Temporary local branches or worktrees are
  allowed for comparing with `origin/main` or with the fixture commit
  `b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`. Fetch that commit read-only if it isn't present.
- Credentials and secrets: the codex CLI credentials already on the host for the configured reviewer
  (codex/gpt-6-sol). No other credentials are needed or available to this pass.
- Authorized effects:
  - Run `agent-validator validate`, `list`, `detect`, `status`, and `run` locally. Reviews run through
    codex and are metered.
  - Make exactly one live `agent-validator run --enable-review task-compliance --context-file <task file>`
    for INT-001, which is required. Optionally, make one ordinary `agent-validator run` without the
    flag for comparison. Each costs about one round of reviewer calls. If INT-001 already ran during
    implementation, the acceptance pass reuses its logs and doesn't repeat the run.
  - Cleanup: revert any scratch edits so that only the intended `.validator/config.yml` change
    remains. `validator_logs/` is gitignored and may stay, but must not be committed.
- Off limits:
  - Do not push to or modify `eval/fixture-sonnet-validator` or any other non-change branch.
  - Do not touch `Codagent-AI/agent-evals` or re-pin `FIXTURE_REF`.
  - Do not run the and-scene eval (that is reserved for Paul, see HT-001).
  - Do not merge the PR.
  - Do not change the CLI adapter, other reviews, checks, or `base_branch` in `.validator/config.yml`.
  - Do not run `agent-validator skip` or `clean` in a way that changes the shared validator baseline
    the factory relies on.
- Permitted substitutes: None. If the codex reviewer is unavailable, report the "Explicit enablement
  runs the review" scenario as **unverified on `main`**. `validate` and `list` output, the fixture
  byte comparison, and the fixture eval are not equivalent evidence. Don't switch to a different
  reviewer CLI.
- Known risk areas:
  - Indentation or duplicate-inline-definition errors make every validator run fail. An earlier
    feasibility probe hit the duplicate-definition error after a scripted edit ran twice.
  - Whether the entry matches the fixture's block byte for byte.
  - Whether default runs still execute only `code-quality` and `skill-quality` reviews.
  - Accepted limitation: on `main`, task-compliance runs through codex/gpt-6-sol, while the eval
    fixture uses claude/sonnet-5.5.
  - The built-in is `one_shot`, so reruns keep its first findings instead of re-reviewing. That is
    expected, not a defect.

## Human-Only Testing

### HT-001: and-scene eval against the task-compliance fixture, then the merge decision
- Reason: The issue says not to merge until the eval has run. Paul reserved the eval run and the merge
  decision for himself in the issue comment. The eval harness lives in `Codagent-AI/agent-evals`,
  outside this repository and outside this change's authorized effects.
- Prerequisites: The PR is open and unmerged. The implementation verification passed
  (`agent-validator validate`, `list`, the diff limited to three lines, and the byte match with the
  fixture block). INT-001 passed, or the PR description reports it as unverified on `main`. The exploratory acceptance pass reported no blocking findings. The PR description
  states that merging waits for the eval.
- Instructions: Run the and-scene eval with
  `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`. Confirm in the run's validator logs that a
  `task-compliance` review ran during implement-task steps. Then merge the PR or leave it open.
- Required decision or observation: whether task-compliance ran in the eval, whether its findings or
  cost are acceptable, and the resulting merge or no-merge decision.

## Coverage Map

| Requirement or journey | INT | E2E | HT |
| --- | --- | --- | --- |
| Opt-in task-compliance review — explicit enablement on main's configuration | INT-001 | — | — |
| Existing validator gates unchanged — enabled run adds only task-compliance | INT-001 | — | — |
| Opt-in task-compliance review — explicit enablement in an Agent Runner implement-task run (fixture eval) | — | — | HT-001 |
