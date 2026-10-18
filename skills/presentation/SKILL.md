---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram (stable entities that appear, move, connect and re-label across named steps). Use when asked to make, build, create, edit or change a presentation, talk, deck or slides from a topic. Bootstraps the Vite + React + TypeScript app and scene kit when the project lacks them.
---

# Presentation

A presentation is **one scene moving through named steps**, not a deck of unrelated slides. Entities
keep a stable identity (`layoutId`), so the same box, arrow or label morphs from one step to the next;
only genuinely new things appear and only genuinely finished things leave.

Everything in this skill is relative to **this file's directory** (`<skill>/`). Resolve
`<skill>/templates/bootstrap/` and `<skill>/templates/presentation/` from where this `SKILL.md` lives,
never from the user's current working directory.

## Vocabulary

- **Presentation**: the generated artifact. ("Talk" is only an informal synonym; the entry component
  file is called `Talk.tsx` for historical reasons and means nothing more.)
- **Step**: one named state of the scene: `id`, `era` (section label), `title` (one-liner shown when
  presenting), `caption` (paragraph shown when browsing), and the diagram state.
- **Scene kit**: `src/presentation-kit/`, the reusable engine. It has **no styling**; each
  presentation owns its look.

## Procedure

Follow the steps in order. The same infrastructure check (step 2) applies whether you create or modify.

### 1. Gather (create only)

Ask the user questions **one at a time**, never as a batch, to learn:

1. the **topic**,
2. the **visual style** (mood, palette, typography, density),
3. for each step, its **content** and a **visual description** of what is on screen.

Rules:

- Do not assume details the user can still provide; ask for what is missing.
- If the prompt already contains the topic, the style and every step, build without further questions.
- The user decides how deep to go. If they choose to build with partial detail, build from what you
  have and invite iteration. There is no completeness gate.
- When a step's layout is key or complex, you may draw an ASCII mockup and ask the user to confirm it.
  Do this at your discretion, not for every step.

### 2. Ensure the infrastructure, then resolve the target

A project can host presentations when it has three **contract anchors**. Detect them by what they do,
not by exact file names, formatting or extra dependencies; cosmetic differences never justify
re-scaffolding.

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the engine with the `Step`/`Scene` step contract, a stage that mounts the active step
   and runs entity morphs, present/browse navigation, chrome (captions, table of contents) and the
   fixed fit-scaled canvas (the shape of `<skill>/templates/bootstrap/src/presentation-kit/`).
3. **Presentation index**: a registry mapping each presentation to its own route, so several coexist.

Decide what to do from what is present:

- **All three present** (including when you are already inside a presentation app): skip scaffolding.
- **None present** (an empty directory, or a non-empty project that has none of the anchors): full
  scaffold of all three anchors and their dependencies before creating the presentation. In a
  non-empty project, confirm the target first (below).
- **Some present**: scaffold only the missing anchors and their dependencies. Do not rewrite,
  reformat or "refresh" anchors that already exist.

Resolve the **target location** before writing anything:

| Situation | Target |
|---|---|
| Empty directory or standalone (non-monorepo) project | the project root |
| Monorepo: `workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory | a self-contained app under `presentations/`; do not mutate the monorepo root |
| Already inside an app that has the anchors | that app |

**Confirm first in a non-empty project.** If the project is not empty and anything must be scaffolded
(including only the build setup), state the resolved target and what you will add, and proceed only
after the user confirms. An empty directory or a fully anchored project needs no confirmation.

Scaffold from `<skill>/templates/bootstrap/`: copy only the missing parts, rename `gitignore` to
`.gitignore`, then install dependencies (`npm install`; never assume any are present). The full set is
`react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`,
`@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright` (render
verification; run `npx playwright install chromium` if no browser is available).

The scaffold is **styling-framework-neutral** and ships **zero presentation styling**: no Tailwind,
theme tokens, default colours, fonts, cards or buttons. Add a styling system only if the host already
uses one or the user explicitly asks for it. The bootstrap includes `scripts/verify.mjs`,
`scripts/inspect-presentation.mjs` and a registered starter presentation you can delete once your own
is registered (remove its folder, its registry entry and its `verify.config.json` entry).

### 3a. Create a presentation

Make it a self-contained folder reachable at its own route:

1. Copy `<skill>/templates/presentation/` into `src/presentations/<slug>/`, dropping the `.tmpl`
   suffix and replacing `__SLUG__`, `__TITLE__` and `__CLASS__` (a CSS class for scoping).
2. Fill `entities.ts` (the presentation's `layoutId` namespace: one stable id per entity),
   `steps/narration.ts` (id, era, title, caption per step) and `steps/Scene.tsx` (compose the kit's
   `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, inside a `SceneLayer`; give each
   primitive `enter` only in the step that introduces it). Use raw `motion` elements with a stable `layoutId` when a primitive is the wrong
   shape or the diagram is coordinate-heavy.
3. Register it with **one** new entry in `src/presentations/index.ts` (see
   `registry-entry.txt.tmpl`). Do not reorder or edit existing entries; existing presentations must
   stay intact and reachable.
4. Write the look in the presentation's own `talk.css` (plain CSS unless the host uses a framework or
   the user asked for one). Never add styling to `src/presentation-kit/`.

Scene rules that make morphs clean:

- Steps that are successive states of one diagram share a `groupKey` and the same `Scene`: the scene
  instance persists and only `payload` changes. A step with a different group or `Scene` cross-fades.
- Pass `enter` to a primitive only in the step that introduces its entity. Continuing entities get no
  `enter` (and no wrapper), so they morph through their `layoutId` and never fade in again. Do not wrap
  an entity in `Appear` in some steps and not others: adding or removing a wrapper remounts it.
- Compose in the fixed 880 × 380 design canvas. Intentional overlaps are fine, but keep them readable
  and mark every element involved (or the subtree containing all of them) with
  `data-presentation-allow-overlap` only when the overlap is deliberate; a collision between a marked
  element and an unmarked one is still reported.
- Style the active progress/ToC state (`[data-presentation-active]`) so it is visibly distinct, and
  style the attribution link (`[data-presentation-attribution]`) so it is legible and intentional.

### 3b. Modify a presentation

1. Identify the target. If the user did not name one, or the name is ambiguous, **list the existing
   presentations** (from `src/presentations/index.ts`) and ask which to modify **before changing
   anything**.
2. Ask only about the requested change (steps, entities or style). Do not re-run the create interview.
3. Edit that presentation in place. Touch other presentations only if the registry must change.

### 4. Self-verify before reporting done

Run, from the app root, and fix every failure yourself; do not report success while any check fails:

1. `npm run build`: no type or build errors.
2. A render check of the **presentation you created or changed**: `npm run verify` builds, then opens
   every registered route in Chromium on `127.0.0.1` and steps through all of its steps, failing on
   any console error, uncaught error or step that does not advance. At minimum the target's first step
   must render with no console errors. (A different presentation passing does not count for the target.)
3. A visual composition check with the project-local helper (prefer it over ad hoc scripts; if you
   must write a temporary Playwright script, put it under the project root so browser tooling resolves
   from local dependencies):

   ```bash
   npm run inspect -- <slug>                       # desktop, screenshots in artifacts/inspection/<slug>/
   npm run inspect -- <slug> --viewport 390x844    # narrow, for responsive-sensitive presentations
   ```

   The helper waits for transitions to settle before every screenshot. Look at the **first step, the
   last step and every dense or key step**: important content fits the canvas, intentional overlaps are
   readable, and nothing collides with the caption, progress dots, table of contents or controls.

Review every advisory warning the helper prints. Warnings are not failures, but you must act on them:
open the referenced step, fix accidental text/chrome collisions, make the active progress/ToC state
visibly distinct, and style the attribution (size, colour) through its hook. Mark a subtree
`data-presentation-allow-overlap` only for a genuinely intentional, readable overlap. Rerun the
affected checks after each fix. Report the final results and any warning you left, and why.

## Quality bar

A finished presentation builds with no type errors, renders its first step with no runtime or console
errors, shows a caption per step, supports next/previous navigation, passes the visual composition
check, and follows the evolving-scene model (one scene, stable entities, named steps).
