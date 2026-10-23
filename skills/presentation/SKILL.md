---
name: presentation
description: Create or modify a browser presentation modeled as one evolving diagrammatic scene, backed by the reusable scene kit, and self-verify it with build, render, and visual checks.
---

# Presentation skill

This skill creates a presentation from a topic. A presentation is one scene that moves through
named steps. Entities persist and morph between steps; they are never redrawn as separate slides.

Paths in this file are relative to this skill's directory (`skills/presentation/`). Resolve
`scripts/scaffold.mjs` and `templates/` from there, not from the user's working directory.

## 1. Gather

- Ask one question at a time. Cover the topic, the visual style, and, for each step, its content
  and its visual description. Do not assume a detail the user can still provide.
- The user controls depth. If the user chooses to build with partial detail, build from what was
  captured and iterate later. Do not block on a completeness gate.
- If the prompt already gives the topic, style, and every step's content and visual description,
  skip the questions and proceed to build.
- ASCII mockups are optional. Draw one only for a key or complex step, to confirm its layout before
  building. Do not draw a mockup for every step.

## 2. Resolve the target and scaffold if needed

Run this before any create or modify, and again before any write to a new project:

1. Run `node <skill-dir>/scripts/scaffold.mjs target <project-dir>`. It reports the target directory,
   whether this is a monorepo, and whether confirmation is required.
2. Detection is by contract anchor, not by byte-identical files. The three anchors are:
   - **Build setup:** a Vite + React + TypeScript app with a `package.json` and a Vite config.
   - **Scene kit:** `src/presentation-kit/` with the `Step`/`Scene` contract, stage, navigation,
     chrome, and fit scaling.
   - **Presentation index:** `src/presentations/index.ts`, the registry that maps each presentation
     to its own route.
   Cosmetic differences (file naming, formatting, extra dependencies) do not make an anchor missing.
3. Target resolution:
   - An empty or standalone (non-monorepo) project scaffolds at the root.
   - A monorepo (`workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/`
     directory) scaffolds a self-contained app under `presentations/`, not at the monorepo root.
   - A project where all three anchors are already present is used as-is. Scaffolding is skipped
     and the skill goes straight to create or modify.
   - A project with only some anchors gets only the missing ones, and existing files are preserved.
4. If the response says `confirmationRequired: true`, first state the resolved target path and wait
   for the user to confirm it. Do not write anything before that confirmation.
5. Run `node <skill-dir>/scripts/scaffold.mjs scaffold <project-dir>`. It copies only the files that
   are missing from `templates/bootstrap/` and never overwrites an existing file. Then install the
   dependencies in the target. Run `npm ci` if a lock file was copied, otherwise `npm install`. Then
   install any package listed in `missingDependencies` from the result.
6. Styling: the scaffold ships no styling framework and no visual defaults. Add Tailwind or another
   framework only when the host already uses it or the user explicitly asks for it.

## 3. Generate or modify

Create a new presentation:

- Write one folder, `src/presentations/<slug>/`, containing `entities.ts` (stable layoutId
  namespace), `steps/*.tsx` (one `Step` object per step, composing kit primitives), and `Talk.tsx`
  (`<Presentation steps={STEPS} title=… initialMode="browse" />`). Start from `templates/presentation/`.
- Register the presentation by appending one entry to `src/presentations/index.ts`. Its slug must
  be unique. Give the presentation its own route, `/<slug>`.
- Do not modify any other presentation folder or registry entry while creating a presentation.
- Put the visual look in the presentation's own CSS (`talk.css`). Use plain CSS unless the host
  already uses another styling system or the user explicitly requests one. Never add styling to the
  scene kit.
- Give each step a stable id, an era label, a one-line title, a caption, and its diagram payload.
  Only entities that are new in a step are wrapped in `Appear`. Continuing entities keep their
  `layoutId` and are not wrapped.

Modify an existing presentation:

- If the target is not named, or is ambiguous, list the existing presentations and ask which one to
  change before any edit.
- Once the target is identified, ask only about the requested change: steps, entities, or style.
  Edit that presentation, reuse the existing infrastructure, and do not repeat the full create flow.
  Do not change other presentations.

## 4. Self-verify before reporting done

Do not report completion until every check below passes. If a check fails, fix the cause and run the
check again. Never report success while a check is failing.

1. **Build:** `npm run build` must exit 0 with no type errors.
2. **First-step render:** render the presentation's first step in a browser with console and
   runtime error monitoring. It must produce no errors.
3. **Full verification:** `npm run verify` must print `verify: PASS`. It builds the app, checks the
   registry and sample, and renders every step.
4. **Visual composition:** run the project-local screenshot helper, `npm run inspect -- <slug>`.
   It writes one settled screenshot per step under `.inspection/<slug>/`. Review the first, last,
   and dense or key steps. For a responsive-sensitive presentation, also review them at a narrow
   viewport, for example `--viewport 390x844`. If the project has no helper, use a temporary
   Playwright script under the project root so it resolves local dependencies. Never place it
   outside the project.
5. **Warnings:** the helper's warnings are advisory. For each warned step, fix an accidental collision
   or an indistinct active state, and polish the attribution. Mark an overlap as allowed only when it
   is intentional and readable, by adding `data-presentation-allow-overlap` to the subtree that holds
   both elements. Run the helper again and report the remaining advisory status.
6. Confirm that important content fits the fixed canvas, that intentional overlaps stay readable, and
   that no content collides with the caption, progress indicator, table of contents, or navigation.

When you report completion, state which checks passed, which warnings remain, and the target path.

## Templates

- `templates/bootstrap/`: the complete build setup, scene kit, and presentation index, including
  the reference sample. Copied only by `scripts/scaffold.mjs`.
- `templates/presentation/`: the folder skeleton for a new presentation.
