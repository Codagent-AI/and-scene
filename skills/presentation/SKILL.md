---
name: presentation
description: Creates or modifies a browser presentation modeled as one evolving diagram (stable entities that move, connect, and re-label across named steps). Use when the user wants a presentation, talk, or explainer built from a topic, or wants to change one made with this skill. Bootstraps the build setup, scene kit, and presentation index when they are missing, then builds and visually checks the result.
---

# Presentation

A presentation is **one scene moving through named steps**, not a stack of slides. Entities keep a stable
identity across steps and morph in place; new ones enter after the existing ones settle; departing ones exit.

"Presentation" is the canonical term. Treat "talk" as a synonym.

## Files this skill owns

Resolve every path below **relative to the directory that contains this `SKILL.md`**, never relative to the
user's working directory.

- `templates/bootstrap/`: a complete Vite + React + TypeScript app with the scene kit, an empty presentation
  index, routing, a landing page, the verification script, and the screenshot helper. It includes
  `package-lock.json`.
- `templates/presentation/`: starter files for one presentation (`Talk.tsx`, `entities.ts`,
  `steps/`, `styles.css`) with `{{SLUG}}` and `{{TITLE}}` placeholders.

## Procedure

Do the steps in order. Never report success before step 5 passes.

### 1. Decide: create or modify

If the user wants to change an existing presentation, follow **Modify** below instead of gathering from scratch.

### 2. Gather (create)

Ask for what is missing, **one question at a time**, and wait for each answer:

1. the topic,
2. the visual style,
3. for each step: its content (title, caption) and what the diagram shows.

Do not invent details the user can still give. The user decides how much to specify:

- If the prompt already contains the topic, style, and every step, skip the questions and build.
- If the user says to build with what they have ("just build it", "go with that"), proceed with the partial
  detail and iterate afterwards. Do not block on completeness.
- For a key or complex step you may draw an ASCII mockup and ask the user to confirm the layout. Do it only
  where it helps; not for every step.

### 3. Resolve the target and scaffold what is missing

Check the three **contract anchors** by what they do, not by file names or exact contents. Cosmetic differences
(naming, formatting, extra dependencies) never trigger re-scaffolding.

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: the engine with the `Step`/`Scene` contract, a stage that mounts the active step and runs
   entity morphs, present/browse navigation, chrome (captions, table of contents) and the fit-scaled canvas.
3. **Presentation index**: a registry that maps each presentation to its own route.

Resolve where they belong:

- The project already has the anchors (you are inside a presentation app): use it and scaffold only the
  anchors that are missing. If all three are present, skip scaffolding.
- Empty directory or standalone (non-monorepo) project: scaffold at the project root.
- Monorepo, signalled by `workspaces` in `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  directory: scaffold a self-contained app in `presentations/`, and leave the monorepo root alone.

Whenever the project is **not empty** and you will write scaffold files (a partial scaffold, or a monorepo),
**state the target directory and what you will add, and wait for the user to confirm** before writing anything.
An empty directory needs no confirmation.

Scaffold by copying from `templates/bootstrap/`, adding only what is missing and never overwriting an anchor
that exists. Then install dependencies; never assume they are present:

- runtime: `react`, `react-dom`, `motion`, `lucide-react`
- build and dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node`, the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `globals`) and `playwright` (render check; install Chromium with
  `npx playwright install chromium` if needed)

Use `npm ci` where the bootstrap lock file was copied whole, otherwise `npm install`. The scaffold is
styling-framework neutral. Add Tailwind or another framework only when the host project already uses it or the
user explicitly asks.

### 4. Create the presentation

1. Copy `templates/presentation/` into `src/presentations/<slug>/` of the app (use `<target>/src/...` for a
   monorepo `presentations/` app), replacing `{{SLUG}}` and `{{TITLE}}`.
2. Write `entities.ts` (the presentation's stable `layoutId` namespace) and `steps/*` (Scenes that compose the
   kit's primitives). Entities that continue between steps keep the same id and are **not** wrapped in
   `Appear`; only newcomers use `appear`/`Appear`. Steps that show successive states of the same diagram share
   a `groupKey` and `Scene` so the scene persists. Keep intentional overlaps; do not spread entities out just
   to avoid them.
3. Put the look in the presentation's own `styles.css` (plain CSS by default), imported by `Talk.tsx`. The
   scene kit ships no styles and must stay free of colors, fonts, borders, shadows, and theme tokens. Style the
   chrome through its `data-presentation-*` hooks: make the active progress dot and active table-of-contents
   entry (`[data-presentation-active]`, also `aria-current="step"`) visibly distinct, and make the
   `[data-presentation-attribution]` link legible and intentional.
4. Register it by adding **one line** to `src/presentations/index.ts`:
   `{ slug, title, load: () => import('./<slug>/Talk') }`. Leave every other presentation, registry entry,
   and anchor as it is. It is then reachable at `/<slug>`.

### Modify

If the user does not clearly name the presentation, list the registered presentations and ask which one,
before changing anything. Once the target is known, ask only about the requested changes (steps, entities, or
style) and edit that presentation in place. Do not re-walk the create flow, and do not touch other
presentations. If anchors are missing, scaffold them as in step 3 first; that does not license edits to any
presentation you were not asked to change.

### 5. Self-verify, then report

Run all of these on the presentation you created or changed, and fix what fails before reporting:

1. `npm run build` completes with no type errors.
2. The route renders its first step with no runtime or console errors. `npm run verify` renders every
   registered presentation through all of its steps; run it before reporting completion.
3. Visual composition. Prefer the project-local helper:
   `npm run inspect -- <slug>` (and `npm run inspect -- <slug> --narrow` for a responsive-sensitive
   presentation). It writes settled screenshots to `.inspection/<slug>/step-NN.png`. If the helper is missing,
   write any temporary Playwright script **under the project root**, so it resolves the project's own
   dependencies, never in `/tmp`. Look at the first step, the last step, and any dense or key steps. Check that
   important content fits the canvas, intentional overlaps stay readable, and nothing collides with the
   caption, progress dots, table of contents, or prev/next controls.
4. Review every warning the helper prints. Each one is advisory, but each needs an answer:
   - an accidental text/chrome collision: fix the layout;
   - indistinct active progress or table-of-contents state, or an unpolished attribution: fix the
     presentation's CSS;
   - a genuinely intentional, readable overlap: mark only that subtree with `data-presentation-allow-overlap`.
   Never silence warnings wholesale. Re-run the helper after fixing.

If any check fails, fix the problem and run the check again. Report only what you ran and what it showed,
including any warning you left in place and why.
