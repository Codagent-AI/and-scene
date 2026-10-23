---
name: presentation
description: Creates or modifies browser presentations that evolve as one diagrammatic scene through named steps, using a reusable scene kit. Use when the user asks for a presentation, talk, or explainer built as a browser app, or asks to add or change steps of an existing one.
---

# Presentation

Build a browser presentation as **one evolving scene**: stable entities (boxes, labels, arrows,
frames) appear, move, connect, and re-label across ordered steps. Do not build a deck of
independent slides.

Paths in this file are relative to this `SKILL.md`'s directory (`templates/...`). Resolve them from
the skill's own location, never from the user's current working directory.

## Anchors

A presentation app has three anchors. Detection is by contract, not byte equality. Cosmetic
differences (file naming, formatting, extra dependencies) do not count as missing.

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: a presentation-agnostic engine at `src/presentation-kit/` that provides the
   `Step`/`Scene` contract, the stage that mounts the active step and runs entity morphs, present
   and browse navigation, the chrome (captions, table of contents), and the fixed-canvas fit.
3. **Presentation index**: `src/presentations/index.ts` (a registry that maps each slug to its own
   route) and `src/main.tsx` with the router.

## Procedure

### 1. Gather

- Ask one question at a time. Cover the topic, the visual style, and each step's content and its
  visual description. Ask only for details that are missing.
- Do not assume details the user can still provide.
- The user may build with partial detail. Do not block on a completeness gate. Offer to iterate
  after the first build.
- If the prompt already contains the topic, style, and every step, skip the questions and build.
- An ASCII mockup is optional. Draw one only for a key or complex step, to confirm the layout. Do
  not draw one for every step.

### 2. Resolve the target and scaffold what is missing

1. Detect the three anchors. If all three are present, skip scaffolding and go to step 3.
2. Resolve the target directory:
   - An existing presentation app (anchors present) is used as it is.
   - A monorepo is detected when any of these holds: `workspaces` in `package.json`, a
     `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout. Scaffold a self-contained app in
     `presentations/`. Do not add files to the monorepo root.
   - An empty directory or a standalone project scaffolds at the repository root.
3. If the project is non-empty and lacks the scene kit or the presentation index, **state the
   target directory and wait for the user to confirm before writing anything**. This includes
   dependency installation and target-directory creation.
4. Scaffold only the missing anchors. Copy from `templates/bootstrap/`. Never overwrite a file that
   already exists, and never touch unrelated files. A partial scaffold adds only the missing
   infrastructure and its dependencies.
5. Install the full dependency set. Do not assume any of it is present:
   - Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
   - Build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
     `@types/node`.
   - Lint: the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`,
     `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`).
   - Render check: `playwright`, then `npx playwright install chromium`.
6. Keep the styling neutral. Do not add Tailwind or another styling framework unless the host
   already uses one or the user explicitly asks for it. The scaffold ships no colors, fonts,
   spacing, cards, buttons, borders, shadows, or theme tokens.

### 3. Create or modify

**Create**

- Copy `templates/presentation/` to `src/presentations/<slug>/` and replace the placeholders
  (`__PRESENTATION_SLUG__`, `__PRESENTATION_TITLE__`) with the slug and title.
- Write `entities.ts` first: stable entity ids, one rectangle (or arrow endpoints) per id on the
  880 by 380 canvas, and the presentation's own `LAYOUT_NAMESPACE`.
- Write `beats.ts`: one era, title (one line), and caption (one paragraph) per step, plus the
  entities each step introduces. Entities persist by stable id. A later step may move a persisting
  entity (it morphs in place), and may let an entity leave (it exits). Do not impose one rule on
  every presentation; choose the layout that the topic's narrative needs.
- Entry is decided by the scene, not stored per step: an entity enters when it was not on screen in
  the previous step, whichever way the viewer moved. Pass `entering` to the newcomer's primitive; keep
  the same key and element for continuing entities, so they are never remounted.
- Compose the scene from kit primitives: `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`, `Appear`, and `SceneLayer`. For a diagram these do not fit, raw Motion elements
  with stable `layoutId`s are allowed, with literal coordinates.
- Group adjacent steps that show the same scene (the same `groupKey` and `Scene`), so that scene
  updates in place. Steps that change scene use a different group or no group, and the scene cross-
  fades between them.
- Register the presentation with one new line in `src/presentations/index.ts`. Keep every other
  entry and folder exactly as they are.

**Modify**

- If the target is not named or is ambiguous, list the existing presentation slugs and ask which
  one to change. Change nothing before the user answers.
- With the target identified, ask only about the requested changes (steps, entities, or style). Edit
  that presentation's files and, if needed, its registry line. Do not walk the full create flow
  again, and do not touch other presentations.

**Styling**

- Presentation visuals live in the presentation's own `presentation.css`, or in host CSS. Plain CSS
  is the default unless the host or user chooses another system.
- Target the kit's stable hooks: `[data-presentation-box]`, `[data-presentation-label]`,
  `[data-presentation-arrow]`, `[data-presentation-progress][data-presentation-active="true"]`,
  `[data-presentation-toc-entry][aria-current="step"]`, and `[data-presentation-attribution]`.
- Make the active progress dot and active table-of-contents entry visibly distinct. Make the
  attribution link legible and deliberately styled.
- Do not add colors, fonts, or theme tokens to `src/presentation-kit/`. The kit must stay unstyled.

### 4. Self-verify before reporting success

Do not report success until all of these pass. Fix any failure and run the check again.

1. `npm run build` passes with no type errors.
2. The first step renders with no runtime or console errors. For completion, run the full
   `npm run verify`. It builds, serves a production preview on `127.0.0.1`, and steps through every
   step in Chromium. Where a project has no verify script, a single-route render check is the
   minimum.
3. Visual composition, using the project-local helper first:
   - `npm run inspect -- <slug>` writes `inspection/<slug>/step-NN.png`, one settled screenshot per
     step, and prints advisory warnings.
   - Review the first step, the last step, and the densest step. The densest step is the one with
     the most entities in its payload.
   - For a responsive-sensitive presentation, also run `npm run inspect -- <slug> --narrow`
     (writes `inspection/<slug>-narrow/`) and review the first, densest, and last steps.
   - Check that important content fits the canvas, that intentional overlaps are readable, and
     that no content collides with captions, progress indicators, table of contents, or navigation.
4. Review every warning. Each names its step and elements.
   - Fix accidental collisions by moving the entity in `entities.ts`, which keeps its rectangle
     the same in every step.
   - Fix an indistinct active progress dot or table-of-contents entry in `presentation.css`.
   - Fix an unpolished attribution in `presentation.css`.
   - Mark only a genuinely intentional, readable overlap: add `data-presentation-allow-overlap` to
     the subtree that holds it. Do not add the marker to hide a real collision.
   - Never hide content or delete a check just to silence a warning.
   - Re-run `npm run inspect` and confirm the warnings are gone or intentional.
5. Warnings are advisory. They do not change the exit code of `npm run inspect`. The verify gate
   (`npm run verify`) is the pass/fail check.

Report completion with the final results of build, verify, and inspect, the route to open, and any
advisory warnings you chose to keep, with the reason.

## Quality bar

Every generated presentation must:

- build with no type errors (`npm run build`);
- render its first step with no runtime or console errors;
- show a caption for each step and let the viewer move to the next and previous step;
- pass the visual composition review in step 4;
- conform to the scene model: stable entity ids, persisting entities that morph or exit, and steps
  grouped only where they show the same scene.

## Keyboard and touch

The kit handles these; do not reimplement them. Keys: Right, Space, PageDown go forward; Left and
PageUp go back; `P` toggles present and browse modes. Horizontal swipes go forward and back. Keys
do not act when focus is on a button, link, input, or other control. Clicking a previous or next
control moves focus to that control. Click an empty part of the page to return focus to the body before using arrow keys.
