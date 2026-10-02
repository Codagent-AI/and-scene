# Decisions — feature-42-d2165a71

## propose — direction-level stop (decision-bearing)

**Decision:** Stop before writing `proposal.md`. Scoping the change to this repository's `main`
`.validator/config.yml` would not make `task-compliance` run in the and-scene eval. The eval is the
issue's stated merge gate ("Do not merge until the eval has been run").

**Evidence:**
- `agent-evals/evals/agent-runner/and-scene/run.sh` pins `FIXTURE_REF=2262a9f118887593654dc8fa1bed2a565a11301c`.
  That commit is on and-scene branch `eval/fixture-sonnet-validator`, not `main`.
- `agent-evals/AGENTS.md`: "The Validator configuration an eval reviews with is the and-scene fixture's
  `.validator/config.yml`, at the pinned fixture commit … commit the new config to `Codagent-AI/and-scene`,
  then update the fixture commit everywhere it is pinned: `FIXTURE_REF` in `run.sh`, `controller.mjs`,
  the suite `README.md`, `fixture-snapshot/snapshot.json`, and `test/and-scene.test.mjs`."
- The fixture config has already drifted from `main`. The fixture uses the claude/sonnet-5.5 reviewer,
  `all-reviewers`, and `base_branch: origin/eval/create-and-scene-spec-only`. `main` uses codex/gpt-6-sol
  and `code-quality`.
- `main`'s HEAD has the implemented reference. It is not a planning-only fixture, so the eval can't be
  pointed at this PR's head with `--fixture-ref` (it would fail `fixture-planning-contract`).

**Alternatives considered:**
1. Add the entry to `main` only and open the PR. This was rejected as the sole scope. It helps real
   and-scene factory runs, but the eval would keep running the old fixture, so the eval gate couldn't
   test this change. That contradicts the issue's purpose.
2. Add the entry to the fixture branch `eval/fixture-sonnet-validator`. This was rejected as the
   autonomous path. The factory feature PR targets `main`, and the new fixture SHA also has to be
   re-pinned in Codagent-AI/agent-evals, which is outside this repository.
3. Do both (`main` PR plus a new fixture commit and an agent-evals re-pin). This is probably what the
   issue intends, but it needs a cross-repository change and a decision on how the eval gate is run.
   That is a direction-level stop under the define rules.

## reconcile (attempt 2) — stop resolved by issue comment (decision-bearing)

**Revision:** The `propose` direction-level stop above is superseded. Paul's comment on issue #42
(2026-10-02T15:23:54Z) answers each open question. Definition resumes at `propose` with this scope:

1. **Scope is `main` only.** The fixture half of "both" is already done.
   `eval/fixture-sonnet-validator` has the `task-compliance` entry at
   `b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a` (parent `2262a9f1`). This change adds the same opt-in
   entry to `main`'s `.validator/config.yml` and does not touch the fixture branch.
2. **No agent-evals change.** Re-pinning `FIXTURE_REF` and touching Codagent-AI/agent-evals is out of
   scope for this ticket. This removes the "change outside the target repository" stop condition.
3. **Eval gate is external to this change.** Paul will run the eval separately with
   `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a` after reviewing the PR. The factory opens
   the PR and does not merge it. "Run the eval" is not an implementation task here. The PR description
   must say that merge waits for that eval.

**Entry to add (matches agent-runner's reference form):** under `entry_points[path: .].reviews`,
`- task-compliance: {builtin: task-compliance, enabled: false}`. Existing `code-quality` and
`skill-quality` reviews and the codex/gpt-6-sol CLI settings stay unchanged. The fixture's
claude/sonnet-5.5 and `all-reviewers` drift is not reconciled into `main`.

**Alternatives considered:**
- Keep the stop. Rejected because every stop question now has an explicit answer from the issue author.
- Also update the fixture branch or re-pin agent-evals. Rejected because the comment says both are
  done or out of scope.
- Align `main`'s reviewer config with the fixture's. Rejected because the issue doesn't ask for it,
  and it would change real and-scene runs beyond the opt-in entry.

## propose — verdict go (decision-bearing)

**Decision:** Go. Wrote `proposal.md`, scoped to one opt-in line in `main`'s `.validator/config.yml`:
`- task-compliance: {builtin: task-compliance, enabled: false}` under the `.` entry point's reviews.
I checked feasibility with the installed agent-validator using a temporary, reverted edit:
`validate` passes and `list` shows the gate.

**Alternatives considered:**
- No-go or do nothing. Rejected: Agent Runner's `--enable-review task-compliance` would stay a silent
  no-op in every and-scene run.
- Enable task-compliance by default. Rejected: the issue asks for the opt-in form that matches
  agent-runner, and enabling it would add a review to every ordinary validator run.
- Write a custom `.validator/reviews/task-compliance.md` prompt. Rejected: the built-in is the
  reference form in the sibling repositories.

## propose — capability naming (not decision-bearing)

**Decision:** Add the new capability `repository-quality-gates` to hold the requirement. The define
workflow requires specs (`require_specs: "true"`), and no existing spec covers the validator config.
**Alternatives considered:** Modify `presentation-verification`. Rejected because that spec covers the
presentation build and render gate, not the repository's Agent Validator reviews.

## propose — reviewer drift accepted (not decision-bearing)

**Decision:** Keep `main`'s codex/gpt-6-sol reviewer. The task-compliance review uses it on `main`,
while the eval fixture uses claude/sonnet-5.5.
**Alternatives considered:** Make `main` match the fixture's reviewer configuration. Rejected as out of
scope; the issue doesn't ask for it, and it would change every and-scene review.

## proposal-review — no findings (not decision-bearing)

**Decision:** Leave `proposal.md` unchanged. `proposal-review-findings.json` is an empty array, so
there is nothing to apply, reject, or escalate as direction-level.
**Alternatives considered:** None.

## specs — repository-quality-gates requirements (decision-bearing)

**Decision:** Wrote `specs/repository-quality-gates/spec.md` with two requirements:
1. **Opt-in task-compliance review.** The review is declared on `.`, backed by the built-in, and off by
   default. It runs only when the run passes `--enable-review task-compliance`, the flag Agent Runner
   uses together with `--context-file`.
2. **Existing validator gates unchanged.** The checks, `code-quality`, `skill-quality`, and the reviewer
   CLI preference stay the same. An enabled run adds only `task-compliance`.

The scenarios describe observable validator behavior (`list`, `validate`, and `run` with or without
the flag) instead of YAML structure. The config is a public contract only through what the validator
does with it. `openspec validate --type change feature-42-d2165a71 --strict` passes.

**Alternatives considered:**
- Specify the exact YAML line. Rejected: the spec skill says to avoid scenarios about configuration
  structure, and the proposal and design already record the exact form.
- Add a scenario requiring task-compliance to run in the eval. Rejected: the eval uses the fixture
  branch's config, and running it is out of scope (Paul runs it separately).
- Require the review to use a specific reviewer model. Rejected: the reviewer is inherited from the
  existing CLI preference, and reviewer drift from the fixture is accepted in the proposal.
