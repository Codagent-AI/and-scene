## Context

and-scene's Agent Validator configuration lives in `.validator/config.yml`. It has one entry point
(`path: .`) with four checks (`build`, `lint`, `typecheck`, `security-deps`) and two reviews: an
inline `code-quality` built-in and `skill-quality`, which references `.validator/reviews/skill-quality.md`.
Reviews run through the `codex` CLI adapter (`gpt-6-sol`, low thinking).

Agent Runner's implement-task step calls
`agent-validator run --enable-review task-compliance --context-file <task_file>`. The installed
agent-validator only activates a review through `--enable-review` if the config declares it; unknown
names are ignored. and-scene doesn't declare `task-compliance` today, so the review never runs.

Two references use the same entry, written identically:

- `Codagent-AI/agent-runner` `.validator/config.yml`, and
- the and-scene eval fixture at `b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`
  (branch `eval/fixture-sonnet-validator`), which Paul committed for this ticket.

Both use:

```yaml
      - task-compliance:
          builtin: task-compliance
          enabled: false # Opt-in: activate with `agent-validator run --enable-review task-compliance --context-file <task>`
```

The built-in `task-compliance` review is `one_shot: true` by default (agent-validator #142). It
dispatches on the first validator iteration only. Reruns keep its earlier findings and don't re-review.

No CI workflow in this repository runs the validator (there is no `.github/`). The scaffold template
under `skills/presentation/templates/bootstrap/` doesn't ship a `.validator/` directory, so the kit
and template parity rules don't apply.

## Goals / Non-Goals

**Goals:**
- `--enable-review task-compliance` runs the built-in task-compliance review on and-scene's `main`.
- Default validator runs behave exactly as before.
- The `main` entry is byte-identical to the fixture's and agent-runner's, so the configs are easy to
  compare and the eval tests the same declaration that ships.

**Non-Goals:**
- Changing the reviewer CLI, the other reviews, checks, or `base_branch` to match the fixture.
- Changing the fixture branch or agent-evals pins, or running the eval.
- Adding a custom task-compliance prompt or changing the built-in's `one_shot` default.

## Approach

Append the three-line block above as the last item of `entry_points[0].reviews` in
`.validator/config.yml`, directly after `- skill-quality`. Indentation matches the existing
`code-quality` block: six spaces before `-`, ten before keys. Change nothing else in the file.

Resulting `reviews` list:

```yaml
    reviews:
      - code-quality:
          builtin: code-quality
          num_reviews: 1
      - skill-quality
      - task-compliance:
          builtin: task-compliance
          enabled: false # Opt-in: activate with `agent-validator run --enable-review task-compliance --context-file <task>`
```

Run-time data flow is unchanged except for the enabled path:

```
agent-validator run [--enable-review task-compliance --context-file T]
  └─ entry point "." (changed files detected)
       ├─ checks: build, lint, typecheck, security-deps        (unchanged)
       ├─ reviews: code-quality, skill-quality                 (unchanged, enabled)
       └─ review: task-compliance  → only when enabled by flag; prompt gets T via {{CONTEXT}}
```

**Failure behavior:**
- If the entry is malformed or defined twice inline, `agent-validator validate` and every run fail
  fast with a config error. The verification step catches this.
- If `--context-file` is omitted while the review is enabled, the built-in's handling applies. That is
  agent-validator behavior, not something and-scene defines.

## Decisions

1. **Block form with the opt-in comment, not the one-line flow mapping from the issue.** The issue's
   one-liner was labeled "for reference." Both concrete references (agent-runner and the eval
   fixture) use the multi-line block with the comment. The two forms parse identically. The block
   matches the file's existing `code-quality` style and keeps `main` byte-identical to the fixture for
   this entry. The comment tells readers how to opt in.
2. **Place it last in `reviews`.** This matches the fixture's placement. Order has no behavioral
   effect, but matching placement keeps diffs between `main` and the fixture minimal.
3. **Inline built-in, no prompt file.** `builtin: task-compliance` uses agent-validator's maintained
   prompt. A local copy would drift from it.
4. **Keep the existing reviewer.** On `main`, task-compliance runs through codex/gpt-6-sol. In the eval
   fixture it runs through claude/sonnet-5.5. The proposal accepts this drift.

## Risks / Trade-offs

- **More cost and possible new findings in factory implement runs.** Each implement task now gets one
  extra review call. It runs once per task because of `one_shot`. It may surface compliance violations
  that used to pass silently. That is the intended effect.
- **The eval doesn't test `main`'s reviewer.** The eval uses the fixture config (claude/sonnet-5.5), so
  an eval result says nothing about how task-compliance behaves under codex on `main`. This is
  accepted and out of scope.
- **Silent no-op could come back.** If someone later renames or removes the entry, the flag goes back
  to doing nothing. The spec's `list` scenario and the verification below cover this change only. No
  repository test guards it, and adding a validator-config test harness would be disproportionate for
  a one-line config entry.

## Verification

Run from the repository root after the edit:

1. `agent-validator validate` → reports all config files valid.
2. `agent-validator list` → `task-compliance` appears under Review Gates and in the `.` entry point's
   Reviews, alongside `code-quality` and `skill-quality`. Checks are unchanged.
3. `git diff origin/main -- .validator/config.yml` → exactly the three added lines, nothing else.
4. `git show b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a:.validator/config.yml` → its task-compliance block
   matches the added lines byte for byte, if the commit is fetchable.
5. The repository's standard gates (`npm test`, `npm run lint`, `npm run build`) still pass. Nothing
   they cover changes, so they act only as a regression guard.
6. **Required, run once:** a live branch-local
   `agent-validator run --enable-review task-compliance --context-file openspec/changes/feature-42-d2165a71/tasks.md`
   with a detected change under `.` (the committed config change against `origin/main` is enough).
   It uses the configured codex/gpt-6-sol reviewer. Inspect the run's `validator_logs/` output and
   confirm three things: a `task-compliance` review job ran; its prompt or log shows the task file's
   contents injected as context; and `code-quality` and `skill-quality` also ran (spec: "Enabled run
   adds only task-compliance"). This is test-plan obligation INT-001.

Steps 1 and 2 confirm only that the config is valid and the gate is discovered. They don't show that
`--enable-review` actually runs the review on `main` with task context, and neither does the eval,
which uses the fixture's claude/sonnet-5.5 config. Step 6 is the only evidence of the spec's
"Explicit enablement runs the review" scenario for `main`'s configuration, so it is required before
the PR is declared ready. It costs about one round of reviewer calls. If the codex reviewer is
unavailable, record that scenario as **unverified on `main`** in the PR description. Don't treat
steps 1 and 2 or the fixture eval as equivalent evidence, and don't switch reviewers. The spec's
"Ordinary runs skip the review" scenario rests on agent-validator's documented `enabled: false`
default. Any ordinary validator run the factory makes on this branch (one without the flag) shows it
by the absence of a `task-compliance` job. The and-scene eval Paul runs against the fixture remains
the end-to-end check of the Agent Runner journey.

## Migration Plan

No migration is needed. The change applies when it merges to `main`. Factory runs pick it up from their
checkout of `main`. To roll back, revert the three lines; the flag then goes back to doing nothing. Per
the issue, the PR stays unmerged until Paul has run the eval with
`--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a`.

## Open Questions

None.
