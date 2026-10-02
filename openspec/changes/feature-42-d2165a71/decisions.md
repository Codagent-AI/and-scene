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
