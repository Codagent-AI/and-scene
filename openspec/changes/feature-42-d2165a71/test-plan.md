## Coverage Strategy

Specifications remain the source of unit-test requirements. This plan records only additional
integration and end-to-end obligations, the acceptance testing envelope, and exceptional human-only
obligations.

The change adds one three-line review entry to `.validator/config.yml` and touches no application,
kit, template, or script code. The one real boundary is how agent-validator turns the config into the
gates it runs. The validator's own CLI (`validate`, `list`, `run --enable-review`) exercises that
boundary directly. The repository has no validator-config test harness, and the design rejects adding
one (a YAML dependency or a fragile text assertion to guard one entry). So no committed automated
test is added. The implementation task's verification steps (`design.md` → Verification) and the
exploratory acceptance pass provide the evidence. The existing `npm test`, `npm run lint`,
`npm run build`, and `npm run verify` suites remain the regression guard for the unchanged
presentation code.

## Integration Tests

None. A committed integration test would only repeat what `agent-validator validate` and
`agent-validator list` report about the real config, using a parser the repository doesn't
otherwise depend on. agent-validator's own test suite covers the semantics of `enabled: false` and
`--enable-review`, so this repository doesn't retest them.

## End-to-End Tests

None. The end-to-end journey is an Agent Runner implement-task run calling
`agent-validator run --enable-review task-compliance --context-file <task>`. It crosses into Agent
Runner and the and-scene eval harness, both outside this repository. That journey is covered by
HT-001, the eval Paul runs against the fixture.

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
  - Make at most one live `agent-validator run --enable-review task-compliance --context-file <task file>`
    against a small uncommitted or branch-local change, and at most one ordinary `agent-validator run`
    without the flag for comparison. Each costs about one or two reviewer calls.
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
- Permitted substitutes: if the codex reviewer is unavailable, skip the live `--enable-review` run.
  Use `agent-validator validate` and `list`, plus a byte comparison with the fixture's block, as
  evidence, and report the live run as not performed. Don't switch to a different reviewer CLI.
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
  fixture block). The exploratory acceptance pass reported no blocking findings. The PR description
  states that merging waits for the eval.
- Instructions: Run the and-scene eval with
  `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`. Confirm in the run's validator logs that a
  `task-compliance` review ran during implement-task steps. Then merge the PR or leave it open.
- Required decision or observation: whether task-compliance ran in the eval, whether its findings or
  cost are acceptable, and the resulting merge or no-merge decision.

## Coverage Map

| Requirement or journey | INT | E2E | HT |
| --- | --- | --- | --- |
| Opt-in task-compliance review — explicit enablement in an Agent Runner implement-task run | — | — | HT-001 |
