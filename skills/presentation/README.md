# presentation skill

Maintainer notes for `skills/presentation/`. `SKILL.md` is the agent procedure; this file
covers what is not for the agent.

## Layout

- `SKILL.md`: the procedure an agent follows.
- `scripts/scaffold.mjs`: the deterministic helper (`plan`, `scaffold`, `add`). It resolves
  templates from its own location.
- `templates/bootstrap/`: a snapshot of the app, scene kit, router, empty registry, and
  verify/inspect scripts. It is copied into a fresh project.
- `templates/presentation/`: starter files for one presentation, with `{{SLUG}}` and `{{TITLE}}`
  placeholders that `add` fills in.

## Sync rule

The repository is the source of truth for the scene kit and the two scripts. The bootstrap
snapshot must stay aligned with it:

- `src/presentation-kit/` (all non-test files) must be byte-identical to
  `templates/bootstrap/src/presentation-kit/`.
- `scripts/inspect-presentation.mjs` and `scripts/inspect-presentation.d.mts` must be
  byte-identical to their bootstrap copies.
- `scripts/verify.mjs` must match its bootstrap copy everywhere except the `REFERENCE_SAMPLE`
  block. The bootstrap copy sets that block to `null` because a fresh project has no sample.

`tests/unit/skill/template-parity.test.ts` fails on any drift. When you change the kit or a
script, copy the change into the bootstrap in the same commit. Also keep
`templates/bootstrap/package.json` and `package-lock.json` in step with the root dependency set
the skill guarantees, and regenerate the lock with `npm install --package-lock-only` inside
`templates/bootstrap/`.

`tests/integration/bootstrap-materialize.test.ts` (INT-001) materializes the bootstrap in a temp
directory outside the repository and runs its build, lint, and verify, so it catches drift that
the byte comparison cannot see.

## Adding a template file

Add it under `templates/bootstrap/` and map it to an anchor group in `ANCHOR_FILES` in
`scripts/scaffold.mjs`. Files are copied only when absent, so an existing project is never
overwritten.
