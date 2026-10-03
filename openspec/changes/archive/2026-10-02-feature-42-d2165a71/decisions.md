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

## design — entry form and placement (not decision-bearing)

**Decision:** Write the entry as the three-line block with the opt-in comment, used byte for byte in
both agent-runner's `.validator/config.yml` and the eval fixture at `b83deca4`. Place it last in
`reviews`, after `skill-quality`, as the fixture does. The issue's one-line flow mapping was labeled
"for reference" and parses to the same mapping.
**Alternatives considered:** The one-line flow mapping. Rejected: it differs from both concrete
references and from the file's existing block style, and it would make `main` and the fixture differ
for this entry. Other positions in `reviews` were rejected for the same reason.

## design — revision to proposal.md (not decision-bearing)

**Decision:** Correct `proposal.md` (Why, Verdict, Technical Approach, and Impact). It described the
entry as a one-line flow mapping that agent-runner uses. agent-runner actually uses the block form.
The proposal now gives the block form, and `design.md` has the exact text. Scope and behavior are
unchanged, and the specs need no change.
**Alternatives considered:** Leave the proposal as written. Rejected: an implementer could follow its
inaccurate description of the entry's form instead of the design.

## design — verification approach (not decision-bearing)

**Decision:** Verify with `agent-validator validate`, `agent-validator list`, a diff limited to the
three added lines, a byte comparison with the fixture's block, and the standard `npm test`, `lint`,
and `build` as a regression guard. A live `--enable-review` run is optional because it makes a paid
reviewer call. The eval Paul runs is the end-to-end check.
**Alternatives considered:** Add a repository unit test that parses `.validator/config.yml` and
asserts the entry. Rejected as disproportionate: it would add a YAML dependency or a fragile text
assertion to a presentation project to guard one config line.

## test-plan — no committed INT or E2E tests (decision-bearing)

**Decision:** Add no `INT-*` or `E2E-*` obligations. The only boundary, config to validator runtime, is
proven by the validator's own `validate` and `list` output. These checks run in implementation
verification and the acceptance pass. The full Agent Runner journey crosses into other repositories
and is covered by Paul's eval.
**Alternatives considered:**
- An integration test that parses `.validator/config.yml`. Rejected: it duplicates the validator's
  output and adds a YAML dependency (the design rejected this too).
- A CI step that runs `agent-validator validate`. Rejected: the repository has no CI workflows, and
  adding CI is out of scope.

## test-plan — acceptance envelope (decision-bearing)

**Decision:** Authorize local validator commands, including at most one live
`--enable-review task-compliance` run and one ordinary comparison run through the configured codex
reviewer. These are metered reviewer calls of the same kind the factory already makes. Off limits:
the fixture branch, agent-evals, running the eval, merging, other config changes, and changing the
validator baseline. If codex is unavailable, skip the live run and report it; don't switch reviewers.
**Alternatives considered:**
- Forbid live review runs. Rejected: one run is the only direct evidence for the "explicit enablement"
  scenario in this repository, and its cost is small.
- Allow unlimited runs. Rejected because more runs add cost without adding evidence.

## test-plan — HT-001 eval and merge decision (decision-bearing)

**Decision:** Record the and-scene eval with `--fixture-ref b83deca4…` and the merge decision as
HT-001. The issue makes the eval a merge gate, and Paul's comment reserves running it and deciding the
merge for himself. Its harness is outside this repository.
**Alternatives considered:** Record no human-only testing (`None.`). Rejected: that would drop the
issue's explicit "do not merge until the eval has been run" gate.

## approach-review — AR-001 applied (decision-bearing)

**Finding:** `validate` and `list` show only that the config is valid and the gate is discovered.
The live `--enable-review task-compliance --context-file` run was optional. The fixture eval (HT-001)
uses claude/sonnet-5.5, not `main`'s codex/gpt-6-sol, so nothing proved the "Explicit enablement runs
the review" scenario for `main`.
**Disposition:** Applied.
- `design.md` Verification adds step 6: one required branch-local live run with
  `--context-file openspec/changes/feature-42-d2165a71/tasks.md` through the configured codex
  reviewer. It inspects `validator_logs/` for an executed `task-compliance` job, the injected task
  context, and the unchanged default reviews.
- `test-plan.md` records this as INT-001: an uncommitted, manual, required check. The envelope now
  authorizes exactly one such run, which acceptance reuses. Permitted substitutes are now `None`: if
  codex is unavailable, the scenario is reported as **unverified on `main`**.
- E2E wording, the HT-001 prerequisites, and the coverage map were updated to match.

The one-run cost limit and the reviewer-unchanged rule from the earlier test-plan decision still hold.
**Alternatives considered:**
- Keep the live run optional. Rejected: no other evidence covers `main`'s execution path.
- Add a committed or CI test. Rejected: it would make paid reviewer calls in automation, and the
  repository has no CI.

## write-tasks — single self-contained task (not decision-bearing)

**Decision:** Write `tasks.md` with exactly one checkbox task. The workflow's `checkpoint.sh`
requires exactly one `- [ ]` line, and `tasks.md` is the implement-task `task_file`. The task body
includes the exact YAML block and its placement, the constraints (add it once, change nothing else,
don't merge or run the eval), verification steps 1–6, Done-when criteria, and the PR-description
handoff. Steps 1–5 come from `design.md` → Verification; step 6 is the required INT-001 live run.
Step 6 may reuse the implement-task workflow's own `--enable-review task-compliance --context-file`
validator run if its logs show the job executed, which avoids a second paid run within the one-run
limit.
**Alternatives considered:**
- Separate per-task files under `tasks/`. Rejected: the workflow requires one task, and `tasks.md`
  itself is the context file.
- Leave the PR-description requirements out of the task. Rejected: the issue's do-not-merge gate and
  the INT-001 outcome must reach the PR, and the task file is the only artifact passed to the
  implementer.
