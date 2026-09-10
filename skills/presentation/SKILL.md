---
name: presentation
description: Creates or modifies browser-based presentations built as evolving diagrammatic scenes. Triggers when users ask to create a presentation, build a slide deck, modify presentation steps, or design an animated visual narrative.
---

# And Scene presentation skill

Use this procedure to create or modify a presentation. Keep the reusable scene
kit style-neutral; the presentation or host owns every visual decision.

## Out of Scope

This skill does not create static PowerPoint, Keynote, or PDF decks; edit
unrelated scene-kit internals; introduce a design system into the style-neutral
kit; or build non-presentation web applications. Redirect those requests to an
appropriate export, application-development, or scene-kit-maintenance workflow.

## 1. Gather, one question at a time

Determine whether the request creates a presentation or modifies one. For a new
presentation, ask only the next missing question, in this order:

1. What is the topic and desired route slug?
2. What visual direction should it have (mood, palette, typography, and any
   constraints)?
3. What is the next story beat? Capture its era, one-line presenter title,
   browse caption, and what appears, persists, moves, or disappears in the
   diagram.

Continue the third question until the user says the outline is complete. Do not
invent details a user can still provide. Explicitly offer the choice to build
from the details gathered so far; partial detail is valid. When a layout is
important and difficult to describe, use a small ASCII mockup for that step only
and get confirmation before implementation.

For a modification, inspect `src/presentations/index.ts` (or the target app's
equivalent) first. If the target is absent or ambiguous, list the registered
presentations and ask which one to change. Once identified, ask only about the
requested step, entity, or style changes; do not restart the new-presentation
interview.

## 2. Resolve the app target and anchors

Find the directory containing this `SKILL.md`; resolve all template paths from
that directory, never from the caller's current working directory. Check these
contract anchors rather than comparing filenames or formatting:

- a Vite + React + TypeScript build with `npm run build`;
- a scene kit with the `Step`/`Scene` contract, active scene host, present/browse
  navigation and chrome, and fixed-canvas fit scaling;
- a presentation registry mapping routes to independently loadable presentations.

Detect a monorepo from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or
an `apps/` or `packages/` layout. Target an empty or standalone project at its
root. For a monorepo, target `<repo>/presentations/` as a self-contained app.
For a non-empty project without all anchors, state the resolved target and wait
for confirmation before writing. Do not overwrite an anchor that already meets
the contract: scaffold only missing parts.

For a full scaffold, copy `templates/bootstrap/` to the target. Install the
declared dependencies (including React, Vite, TypeScript, Motion, Lucide,
eslint, and Playwright). The template intentionally has no Tailwind or other
styling framework. Do not add one unless the host already uses it or it is
requested. Its `src/presentation-kit/` snapshot is style-neutral: never put a
palette, typography, spacing scale, borders, shadows, cards, buttons, or theme
tokens there.

## 3. Create or modify a self-contained presentation

For a new presentation, use `templates/presentation/` and
`templates/step.tsx` as starting points. Create:

```text
src/presentations/<slug>/
  entities.ts
  Talk.tsx
  presentation.css
  steps/
```

Give every `Step` a stable `id`, `era`, `title`, caption, Scene, and payload.
Use stable, presentation-namespaced `layoutId`s for entities that persist.
Adjacent evolving beats should share `groupKey` and the same Scene so they update
in place. Put layout coordinates and all colors, typography, borders, spacing,
card/button treatments, shadows, active navigation styles, and attribution
polish in `presentation.css` or host CSS — not in the kit. Ensure each step has
a caption and next/previous navigation remains available through the kit.

Add one explicit registration to the index, using the existing registration
format. Preserve every other folder and registry entry. For a modification,
edit only the chosen presentation plus a necessary registry or verification
artifact; keep unrelated presentations reachable.

## 4. Verify and repair before reporting done

Run from the generated app root:

```bash
npm run build
npm run verify
npm run inspect -- <slug>
```

If a project has no full verifier yet, run its build and a local Playwright
first-step render check. Keep temporary helpers under the project root. Prefer
the scaffolded `scripts/inspect-presentation.mjs`: it captures settled browser
screenshots and reports advisory overlap, active-chrome, and attribution issues.
Review the first, last, and dense/key steps; inspect a narrow viewport whenever
the composition is responsive-sensitive. Fix build errors, browser/console
errors, accidental chrome collisions, indistinct active states, and unpolished
attribution, then rerun the failed check. Mark `data-presentation-allow-overlap`
only for a deliberate, readable composition.

Report completion only after the build, first-step render, and visual review are
clean. Use this exact report format:

```text
Route: /<slug>
Changed files: <comma-separated paths>
Validation: npm run build — PASS; npm run verify — PASS
Visual inspection: <steps and viewports inspected>
Remaining warnings: None
```

List every command with its PASS or FAIL status. Replace `None` only with
accurate advisory warnings that remain after review.
