---
name: presentation
description: Create, modify, scaffold, and verify evolving-scene presentations in React apps. Use when asked to make a presentation, slide-like visual story, diagram talk, or update an existing presentation.
---

# Presentation skill

Follow **gather → resolve and scaffold → create or modify → verify**. Supporting
details and examples are in [the workflow reference](references/workflow.md),
[the scene authoring guide](references/authoring.md), and the templates alongside
this skill. Resolve every template path from this `SKILL.md`'s directory, never
from the caller's working directory. The [worked sample](../../src/presentations/how-to-make-a-presentation/)
shows the complete nine-step structure.

## Gather

Skip questions already answered. Otherwise ask one question at a time for the
topic, visual style, and each step's content and visual description. Do not
invent details the user can still provide. The user may say to build with the
available details; accept that and iterate without a completeness gate. An
ASCII sketch is optional for a key or complex layout, not every step.

## Resolve and scaffold

Inspect the target and check the three anchors in
[the workflow reference](references/workflow.md): Vite/React/TypeScript build,
scene kit contract, and presentation registry/router. Reuse present anchors and
scaffold only missing ones. If all are present, work in that app.

For an empty or standalone project, target its root. Treat a project as a
monorepo when it has `workspaces` in root `package.json`,
`pnpm-workspace.yaml`, or a root `packages/` or `apps/` directory; target a
self-contained `presentations/` app and do not mutate monorepo root. In any
non-empty project missing the kit or presentation index, state the exact target
and wait for confirmation before writing. Install the full dependency set from
the bootstrap manifest; do not assume dependencies already exist. Keep the
scaffold style-neutral. Bootstrap includes a minimal registered starter talk:
replace it for a new requested talk, or retain it only if requested.

Copy bootstrap files from `templates/bootstrap/` relative to this skill. For an
existing app, merge only missing anchors and dependencies; preserve unrelated
files, existing presentations, and working host configuration.

## Create or modify

For a new talk, create `<presentations-dir>/<slug>/` with `entities.ts`,
`steps/`, `Talk.tsx`, and local plain CSS, then add one explicit registry entry.
Use `templates/presentation/` as a starting structure and the worked sample for
conventions. Never change existing talks while creating another.

For a modification, if the target is ambiguous, list the existing talks and ask
which one. Once selected, ask only about the requested changes and edit that
talk in place; do not repeat the create interview.

## Verify before reporting success

Run `npm run build`, `npm run verify`, and
`npm run inspect -- <slug>`. Fix failures and rerun. Review all inspection
warnings: fix accidental collisions, make active ToC/progress state distinct,
and style attribution legibly in presentation-owned CSS. Mark only readable,
intentional overlaps with `data-presentation-allow-overlap`. Inspect settled
screenshots of the first, last, and dense/key steps; inspect a narrow viewport
when responsive-sensitive. Prefer the project-local inspection helper; any
temporary Playwright helper belongs under the project root.

Report success only after a clean build, first-step render without runtime or
console errors, captions and next/previous navigation for every step, coherent
visual composition, and evolving-scene continuity: stable entity IDs, persisting
entities morph in place, new entities enter after continuing motion settles,
departing entities exit, and adjacent states share a scene group where they
continue. Styling belongs to the presentation or host. Accumulate-only
composition is specific to the worked sample, not a generated-talk rule.
