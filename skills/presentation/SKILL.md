---
name: presentation
description: >-
  Creates or modifies evolving-scene browser presentations with React, Vite, and animated steps.
  Use when asked to make a presentation, create slides, build a talk or deck, add a step, change
  a presentation, or work on a scene kit, presentation registry, or step morphing.
---

# Presentation skill

## Out of Scope

- Do not export to PPTX, PowerPoint, Keynote, or PDF. Use a document or slide authoring skill for those formats.
- Do not adapt the scene kit to non-React or non-Vite hosts; explain the supported stack and offer a standalone app instead.
- Do not add a styling framework unless the host already uses it or the user requests it.
- Do not write unrelated presentation copy or make changes outside the selected presentation and required registry entry.

Use this procedure to create a new presentation or make a scoped change to an
existing one. A presentation is one scene evolving through steps, not a set of
unrelated slide layouts.

## 1. Gather what the user wants

Determine whether the request is to create or modify.

For a new presentation, identify whether the request supplies each of these:
topic, visual direction, and per-step content and visual intent. Ask one
question per turn about a missing item. If the user says to proceed with partial
details, build from the supplied details only and keep any necessary choices
small and easy to revise; do not block on completeness. For a step with at least
three overlapping entity groups or a flow direction that cannot be inferred from
the description, show one small ASCII layout sketch and ask whether it matches.

For a modification, identify the target presentation first. If the request does
not name one unambiguously, list registered presentations and ask which one to
change. Once selected, ask only about the requested edit; do not restart the
creation interview.

If the original request already gives the topic, style, and step descriptions,
proceed without redundant questions.

## 2. Resolve the app and scaffold missing anchors

Resolve template paths from the directory containing this `SKILL.md`, never
from the caller's working directory. Discover the target before copying files:

1. **Build setup:** inspect `package.json` for a `build` script and Vite,
   React, and TypeScript dependencies; inspect `vite.config.*` and the app entry.
   Confirm `npm run build` works when this app is the selected target.
2. **Scene kit:** inspect kit exports for `Step` and `Scene` types, a host that
   mounts the active step and supports morphing, present/browse navigation,
   chrome, and fit-scale canvas behavior.
3. **Presentation index:** inspect the exported registry for explicit slugs and
   route loaders. A cosmetic naming difference is acceptable when the contract
   exists.

If all three anchors exist, reuse them. If one or more are missing, copy only
the missing anchor files and preserve existing app files and presentations. The
bootstrap is a reference implementation; it is not permission to overwrite
existing work. Ensure dependencies listed in
[`references/dependencies.md`](references/dependencies.md), even when the
infrastructure anchors already exist. Install with the selected package manager
and update its lockfile.

Use this missing-anchor map. All paths are relative to this `SKILL.md`:

| Missing item | Template source | Destination |
| --- | --- | --- |
| Vite/React/TypeScript build setup | [`templates/bootstrap/package.json`](templates/bootstrap/package.json), [`templates/bootstrap/vite.config.ts`](templates/bootstrap/vite.config.ts), and bootstrap root config files | selected app root |
| Scene kit | [`templates/bootstrap/src/presentation-kit/`](templates/bootstrap/src/presentation-kit/) | `src/presentation-kit/` |
| Presentation index/router | [`templates/bootstrap/src/presentations/index.ts`](templates/bootstrap/src/presentations/index.ts) and [`templates/bootstrap/src/main.tsx`](templates/bootstrap/src/main.tsx) | corresponding app paths |
| Local verification/inspection scripts | [`templates/bootstrap/scripts/`](templates/bootstrap/scripts/) | `scripts/` |
| New presentation structure | [`templates/presentation/`](templates/presentation/) | `src/presentations/<slug>/` |
| One scene step | [`templates/step/step.tsx`](templates/step/step.tsx) | `src/presentations/<slug>/steps/step-NN.tsx` |

Resolve the target before copying or writing:

- Empty directory or standalone app: scaffold at the repository root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or `apps/` / `packages/`
  layout): make a self-contained app in `presentations/`.
- Already inside an app with all three anchors: use that app and scaffold only
  any missing anchors.

If a non-empty project is missing any required anchor, state the target path and
the files to be added, then wait for confirmation before writing there. This
confirmation is required for writes into an existing, unscaffolded project.

## 3. Create or modify in scope

Create each presentation in its own `src/presentations/<slug>/` folder, then add
one explicit registry entry. The output layout is:

```text
src/presentations/<slug>/
  Talk.tsx
  entities.ts
  steps.ts
  steps/step-01.tsx
  steps/step-02.tsx
  style.css
```

Copy `templates/presentation/*` to `src/presentations/<slug>/`. Create its
`steps/` directory, then copy `templates/step/step.tsx` to
`src/presentations/<slug>/steps/step-NN.tsx` for each step. Update `steps.ts`
imports for the actual step count. Replace every `REPLACE_*` placeholder
(including `REPLACE_SLUG`, `REPLACE_TITLE`, `REPLACE_SECTION`,
`REPLACE_STEP_TITLE`, and `REPLACE_CAPTION`) with the presentation's values,
then search the new folder for `REPLACE_` and resolve any leftovers. Never
replace or disturb existing presentations. When modifying,
confine edits to the selected presentation and requested change, plus a
necessary registry adjustment.

Add a registry entry following the existing registry's exact type and syntax;
for example:

```ts
{ slug: 'cache-lifecycle', title: 'A Cache Lifecycle', load: () => import('./cache-lifecycle/Talk') }
```

Use the presentation template as a starting shape and the step template for
each scene. Compose generic primitives from the scene kit; keep stable entity
IDs consistent as entities move between steps. Give every step a distinct title,
era, caption, and concise diagram description. The fixed scene canvas is
880 × 380 by default; arrange scene layers within that canvas rather than relying
on page reflow.

The kit owns behavior, geometry, and stable data hooks. It must not own colors,
fonts, spacing systems, borders, shadows, card or button treatments, or theme
tokens. Put the designed appearance in the presentation's plain CSS by default.
Honor an existing host styling system when present or one explicitly requested.
Make active navigation visibly distinct and attribution legible in presentation
or host CSS.

## 4. Verify and inspect before reporting success

Use this ordered feedback loop for the new or modified route:

1. Run `npm run build` and fix type or build errors.
2. Run `npm run verify` when the project provides it. Otherwise use the local
   browser verification script, or the project's browser tooling, to render the
   route's first step and check for runtime and console errors.
3. Run `npm run inspect -- <slug>` when the project provides the screenshot
   helper. It is the default visual inspection tool.
4. Read its warnings and view settled screenshots of the first, last, and every
   dense or visually important step. Inspect a narrow viewport when the layout
   is responsive-sensitive. A clean inspection has no accidental overlap,
   indistinct active navigation, or missing/unpolished attribution. Keep only
   intentional overlaps that remain readable, and mark those explicitly.
5. Fix each failure or unresolved visual issue and repeat the relevant commands
   and inspection until clean. Do not report success while an issue remains.

If there is no local inspector, use the project's browser tooling to capture
settled screenshots; put any temporary helper under the project root.

## 5. Completion report

Use this fixed report format:

```text
Route: /<slug>
Files changed: <presentation files and registry entry>
Commands run: <build, verify/render, inspect commands and results>
Steps/viewports inspected: <step titles or indices; desktop/narrow sizes>
Warnings: <none, or each unresolved advisory with its step and reason>
```
