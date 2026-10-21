---
name: presentation
description: Creates or modifies a browser presentation modeled as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps). Use when asked to make, build, edit, or extend a presentation, talk, or slide-style explainer from a topic.
---

# Presentation

Build a browser presentation as **one scene that evolves through named steps**, not a deck of
unrelated slides. Entities keep a stable identity from step to step and animate in place.
"Presentation" is the canonical term; "talk" is an informal synonym (the entry component is
still called `Talk.tsx`).

Paths below are relative to **this file's directory** (`<skill>`), which holds
`scripts/scaffold.mjs` and `templates/`. Always resolve templates from there, never from the
current working directory.

## 1. Gather requirements

Ask the user clarifying questions **one at a time**, in this order, and wait for each answer:

1. the topic,
2. the visual style (palette, typography, mood),
3. the content and visual description of each step (what appears, moves, connects, or changes).

Do not assume details the user can still supply. Skip a question only when the prompt already
answers it. If the prompt already contains the topic, the style, and every step, build
without further questions.

The user decides how much to specify. When they explicitly choose to build with partial
detail, build from what you captured and offer to iterate; there is no completeness gate. Do
not treat an unanswered question as consent to proceed.

For a key or complex step you MAY draw an ASCII mockup to confirm the layout. It is optional
and not needed for every step.

## 2. Resolve the target and scaffold what is missing

Run `node <skill>/scripts/scaffold.mjs detect <project root>`. It reports the target
directory, why it was chosen, which of the three **contract anchors** exist there, and whether
confirmation is needed:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the presentation-agnostic engine (`Step`/`Scene` contract, stage host,
   present/browse navigation, chrome, fit-scaled canvas).
3. **Presentation index**: the registry mapping each presentation to its own route.

Detection is by contract, not by byte-identical files, so renamed files or extra dependencies
do not trigger re-scaffolding.

Target rules:

- Empty or standalone (non-monorepo) project: the app lives at the repository root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` directory): scaffold a self-contained app in `presentations/`. Never modify the
  monorepo root, and never count the root's build as satisfying the app's anchors.
- An existing presentation app (kit or index already present, at the root or in
  `presentations/`) is reused as the target.

Then:

- All three anchors present: skip scaffolding and go to step 3.
- In a **non-empty project where any anchor is missing** (including only the build setup),
  state the target directory and the reason, and proceed **only after the user confirms**.
  An empty directory needs no confirmation.
- Otherwise run `node <skill>/scripts/scaffold.mjs apply <target> --install`. It copies only
  the files of missing anchors, never overwrites an existing file, merges the missing
  dependencies into `package.json`, then runs `npm install` and installs Playwright's
  Chromium. Never assume dependencies are already installed. If it lists skipped files (for
  example an existing `src/main.tsx`), wire them to the router yourself.

The scaffold is styling-framework-neutral: no Tailwind, theme, colors, fonts, or card/button
styles. Add a styling framework only if the host project already uses one or the user asks.

## 3. Create or modify

### Create

Run `node <skill>/scripts/scaffold.mjs new <target> <slug> "<Title>"`. It writes
`src/presentations/<slug>/` (`entities.ts`, `Scene.tsx`, `steps.ts`, `Talk.tsx`, `talk.css`)
and appends one line to `src/presentations/index.ts`, leaving every other presentation
untouched. Then replace the placeholder content:

- `entities.ts`: this presentation's `layoutId` namespace, introduction step and geometry.
- `Scene.tsx` / `steps.ts`: steps sharing a `groupKey` and `Scene` keep one mounted scene and
  only the payload changes. Keep continuing entities mounted with the same id so they morph
  in place; wrap only newcomers in `Appear` (it enters after layout settles) and wrap
  conditionally rendered entities in `AnimatePresence` so departing ones animate out.
- Each step needs a stable `id`, an `era` label, a one-line `title`, and a paragraph `caption`.
- The canvas is 880 x 380; place entities with literal coordinates (`at`) or presentation CSS.
  Preserve intentional overlaps and stacks rather than spreading entities apart.

**Styling belongs to the presentation.** Put the look in `talk.css` (plain CSS by default) or
the host app, targeting the kit's `data-presentation-*` hooks. Never add colors, fonts,
borders, shadows, or theme tokens to `src/presentation-kit/`. In `talk.css`, make the active
progress dot and table-of-contents entry (`[data-presentation-active]`) visibly distinct and
style the attribution (`[data-presentation-attribution]`) so it is legible.

### Modify

If the target presentation is unspecified or ambiguous, **list the existing presentations
and ask which one before changing anything**. Once identified, ask only about the requested
changes (steps, entities, or style) and edit that presentation (plus its registry line if
needed). Do not re-run the full create flow.

## 4. Self-verify before reporting done

Do not report success until all of these pass; when one fails, fix it and re-check.

1. `npm run build` completes with no type errors.
2. The presentation renders its first step with no runtime or console errors. Run
   `npm run verify` (full build plus every step of the registered route) before completion;
   a quicker build plus single-route check is fine while iterating.
3. Visual composition: run `npm run inspect -- <slug>`, the project-local screenshot helper
   (screenshots land in `.presentation-inspect/<slug>/`, taken after animations settle). If it
   is unavailable, write any temporary Playwright helper under the project root so it
   resolves local dependencies, never outside the tree. Inspect the first step, the last
   step, and every dense or key step, plus a narrow viewport (`--viewport 480x800`) when the
   presentation is responsive-sensitive. Important content must fit the canvas, intentional
   overlaps must stay readable, and nothing may collide with the caption, progress dots,
   table of contents, or navigation controls.
4. Review each advisory warning the helper prints. Fix accidental overlaps, indistinct
   current-step chrome, and unpolished attribution. Mark a genuinely intentional, readable
   overlap by putting `data-presentation-allow-overlap` on the smallest subtree containing
   both elements, and only there. Re-run the helper afterwards.

## Quality bar

Every presentation builds without type errors, renders its first step without runtime errors,
shows a caption for every step, supports next/previous navigation, conforms to the
evolving-scene model (stable entities morph, newcomers enter after others settle), and passes
the visual composition check above.

## Kit hooks

Stable hooks for presentation CSS: `data-presentation-root`, `-mode`, `-header`, `-marker`,
`-era`, `-step-number`, `-brand-slot`, `-stage`, `-canvas`, `-node` (box, label, arrow, chip,
frame, emphasis), `-id`, `-footer`, `-title`, `-caption`, `-controls`, `-prev`, `-next`,
`-progress`, `-progress-item`, `-toc`, `-toc-entry`, `-attribution`, and `-active` on the
current progress item or table-of-contents entry (which also carries `aria-current`). The
root exposes `data-step-count` and zero-based `data-step-index`. Keys: Right/Space/PageDown
next, Left/PageUp back, `P` toggles present and browse; navigation clamps at both ends.
Props on `<Presentation>`: `attribution` (`false` removes it, `{ content }` replaces it),
`brand` (host top-left brand, empty by default), `canvas` (override the 880 x 380 design size).
