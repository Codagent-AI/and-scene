# Tasks: feature-42-d2165a71

One self-contained task. Read `proposal.md`, `design.md`, `test-plan.md`, and
`specs/repository-quality-gates/spec.md` in this directory for the full rationale.

- [x] Declare the opt-in `task-compliance` review in `.validator/config.yml` and verify that it runs only when explicitly enabled

## Task: opt-in task-compliance review

### Goal

Agent Runner's implement-task step runs
`agent-validator run --enable-review task-compliance --context-file <task_file>`. and-scene's
`.validator/config.yml` doesn't declare `task-compliance`, so the flag silently does nothing. Declare
the built-in review, disabled by default, so that the flag runs it and ordinary runs are unchanged.

### Change

Edit `.validator/config.yml` only. Append this exact block as the last item of the `.` entry point's
`reviews` list, directly after the existing `      - skill-quality` line. Use spaces only: six spaces
before `-` and ten before the nested keys, matching the existing `code-quality` block.

```yaml
      - task-compliance:
          builtin: task-compliance
          enabled: false # Opt-in: activate with `agent-validator run --enable-review task-compliance --context-file <task>`
```

The resulting `reviews` list must be:

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

Constraints:

- Add the block exactly once. A second inline definition makes every validator run fail with "defined
  inline in more than one entry point". If you script the edit, make it idempotent or check the result.
- Change nothing else in the file. Keep the `cli` section (codex, `gpt-6-sol`, low thinking), the
  checks, `code-quality`, `skill-quality`, and all commented defaults as they are. Don't set
  `base_branch`.
- Don't add a `.validator/reviews/task-compliance.md` prompt; the built-in supplies it.
- Don't change any other file in the repository. Out of scope:
  - the presentation kit, templates, scripts, and skill;
  - the `eval/fixture-sonnet-validator` branch;
  - `Codagent-AI/agent-evals`.
- Don't run the and-scene eval, and don't merge the PR. Paul runs the eval with
  `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a` and decides the merge himself.

### Verification

Run these from the repository root after the edit:

1. `agent-validator validate` must report that all config files are valid.
2. `agent-validator list` must show `task-compliance` under Review Gates, and the `.` entry point's
   Reviews must be `code-quality, skill-quality, task-compliance`. Checks must still be
   `build, lint, typecheck, security-deps`.
3. `git diff origin/main -- .validator/config.yml` must show exactly the three added lines and no
   other changes.
4. `git show b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a:.validator/config.yml` (run
   `git fetch origin eval/fixture-sonnet-validator` first if the commit is missing). Its
   `task-compliance` block must match the added lines byte for byte. If the commit can't be fetched,
   say so; don't skip silently.
5. `npm test`, `npm run lint`, and `npm run build` must pass. They guard against regressions; this
   change doesn't affect them.
6. **INT-001, required, at most one live run.** Run once, with a detected change under `.`:
   `agent-validator run --enable-review task-compliance --context-file openspec/changes/feature-42-d2165a71/tasks.md`
   It uses the configured codex/gpt-6-sol reviewer. If the implement-task workflow's own validator
   run already passed `--enable-review task-compliance --context-file` for this task file, reuse its
   logs instead of running again. In `validator_logs/`, confirm three things:
   - a `task-compliance` review job executed (it was not skipped or absent);
   - its prompt or log contains this task file's contents as context;
   - `code-quality` and `skill-quality` also ran, and no other review ran.

   Review findings are not failures of this check; it is about execution, not verdict. Address
   in-scope findings as usual. If the codex reviewer is unavailable, report the "Explicit enablement
   runs the review" scenario as **unverified on `main`**. Don't switch reviewers, and don't treat
   steps 1–4 or the fixture eval as equivalent evidence.

Don't commit `validator_logs/` (it is gitignored) or any scratch edits.

### Done when

- `.validator/config.yml` differs from `origin/main` only by the three-line `task-compliance` block in
  the position shown above.
- Verification steps 1–5 pass.
- Step 6 shows an executed `task-compliance` review with the task file injected as context, alongside
  the unchanged default reviews, or its unavailability is reported explicitly as unverified on `main`.
- No other repository file changed outside `openspec/changes/feature-42-d2165a71/`.

### Handoff for the PR description

The PR description must state the following:
- **Do not merge until the eval has run.** Paul will run the and-scene eval with
  `--fixture-ref b83deca4d3a8be7f70c97e6eabc25b79b6edeb2a` and then decide the merge.
- The INT-001 result: task-compliance executed on `main`'s codex configuration with the task context,
  or it is unverified, with the reason.
- The accepted reviewer drift: `main` uses codex/gpt-6-sol, while the eval fixture uses
  claude/sonnet-5.5.
