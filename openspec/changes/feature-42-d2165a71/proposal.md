## Why

Agent Runner's implement-task step runs
`agent-validator run --enable-review task-compliance --context-file <task_file>` to check each
implemented task against its task file. and-scene's `.validator/config.yml` doesn't declare a
`task-compliance` review, so the flag silently does nothing. Task-compliance review has never run in
real and-scene factory runs or in the and-scene eval. As a result, an implementation can pass
validation while missing its task's requirements, and nothing reports that the review was skipped.

The same opt-in entry was added to agent-validator and agent-evals. agent-runner uses the reference
form `- task-compliance: {builtin: task-compliance, enabled: false}`. and-scene is the remaining
consumer without it. The eval fixture branch (`eval/fixture-sonnet-validator`) already has the entry
at `b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`, so `main` is the last place it is missing.

**Verdict: go.** The change is one declarative line. It matches the form already used in the sibling
repositories and affects only runs that explicitly opt in. Paul has confirmed the scope in the issue
comment. Building nothing would leave Agent Runner's compliance gate off for every and-scene run.

## What Changes

- Declare the built-in `task-compliance` review under the root (`.`) entry point's `reviews` in
  `.validator/config.yml` on `main`, disabled by default (`enabled: false`).
- An ordinary `agent-validator run` still runs only `code-quality` and `skill-quality`.
  `--enable-review task-compliance` (as Agent Runner passes it) now runs the review instead of
  silently doing nothing.
- No other validator settings change. Checks, the existing reviews, the codex/gpt-6-sol CLI adapter,
  and the commented defaults stay as they are.

No breaking changes.

## Capabilities

### New Capabilities
- `repository-quality-gates`: the repository's Agent Validator configuration declares an opt-in
  task-compliance review that is off by default and runs only when explicitly enabled.

### Modified Capabilities
None. The existing specs cover presentation behavior, the presentation skill, and presentation
verification. None of them covers the repository's validator configuration.

## Technical Approach

Add one inline review entry to the existing `entry_points[path: .].reviews` list, using agent-runner's
flow-mapping form: `- task-compliance: {builtin: task-compliance, enabled: false}`. The validator
provides the built-in, so no `.validator/reviews/*.md` prompt file is needed. Inline definition is
valid because `.` is the only entry point; the validator rejects a review defined inline in more than
one entry point.

Feasibility was checked against the installed `agent-validator` with a temporary copy of the edit,
which was then reverted. `agent-validator validate` reports the config as valid, and
`agent-validator list` shows `task-compliance` as a review gate on `.`, next to `code-quality` and
`skill-quality`.

Main risk: the review runs through the repository's default reviewer (codex/gpt-6-sol). The fixture
branch uses claude/sonnet-5.5, so the review can behave differently in real runs and in the eval. This
is accepted: the issue asks only for the declaration, and reconciling reviewer drift is out of scope.

## Out of Scope

- The eval fixture branch `eval/fixture-sonnet-validator`. Paul already added the entry there at
  `b83deca4`.
- Codagent-AI/agent-evals, including re-pinning `FIXTURE_REF` and related pins. Paul said this ticket
  doesn't touch it.
- Running the and-scene eval. Paul will run it separately with
  `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a` after reviewing the PR. The factory opens
  the PR but does not merge it, and the PR description must say the merge waits for that eval.
- Aligning `main`'s reviewer, review set, or `base_branch` with the fixture's configuration.
- Enabling task-compliance by default or adding a custom task-compliance prompt.
- The presentation kit, templates, scripts, and skill. The bootstrap template does not ship a
  `.validator/config.yml`, so there is no template copy to keep aligned.

## Impact

- **Code:** `.validator/config.yml` only (one added line).
- **Workflows:** Agent Runner implement-task runs in and-scene now actually perform task-compliance
  review. That adds one review call per task and may surface compliance findings that were previously
  never produced.
- **Users:** none. Presentation output, the scene kit, and the distributed skill are unaffected.
- **Dependencies:** relies on the `task-compliance` built-in that the installed agent-validator
  already provides. No new packages.
