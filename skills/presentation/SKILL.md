---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label through named steps). Interviews the user, scaffolds the Vite + React + TypeScript presentation app and scene kit when they are missing, generates the presentation, and verifies it builds, renders and looks right. Use when asked to make, build, update or change a presentation, talk or slide deck from a topic.
---

# Presentation

A presentation is **one scene that evolves**, not a stack of slides. Entities have stable ids; each
step is a named state of the same diagram, so what persists morphs in place and only what is new
enters. "Presentation" is the canonical word; `Talk.tsx` is just the entry file name.

## Where things live

`<skill-dir>` is the directory that contains this `SKILL.md`. Resolve every template and helper
script **relative to `<skill-dir>`**, never relative to the current working directory:

- `<skill-dir>/scripts/scaffold.mjs` - detects, plans and applies the scaffold
- `<skill-dir>/scripts/new-presentation.mjs` - creates a presentation folder and registers it
- `<skill-dir>/templates/bootstrap/` - the full app, kit and tooling snapshot (used only to scaffold)
- `<skill-dir>/templates/presentation/` - the per-presentation templates

In a scaffolded app: `src/presentation-kit/` is the style-neutral scene kit (do not edit it per
presentation), `src/presentations/index.ts` is the explicit registry, and each presentation is its
own folder `src/presentations/<slug>/` with `entities.ts`, `Scene.tsx`, `steps/*`, `Talk.tsx` and
its own CSS file.

## 1. Gather

Ask the user **one question at a time**. Cover, in this order, only what is still missing:

1. the **topic**,
2. the **visual style** (look and feel),
3. for each step: its **content** (what is said) and its **visual description** (what is on screen
   and what changes from the previous step).

Rules:

- Never assume a detail the user can still supply. Do not ask again for anything the prompt already
  gave.
- If the prompt already contains the topic, style and all step details, skip the questions and
  build.
- The user controls the depth. At any point they may choose to build with partial detail. When they
  do, build from what was captured; there is no completeness gate. Offer to iterate after seeing
  the result.
- For a step whose layout is key or complex, you **may** draw an ASCII mockup and ask the user to
  confirm it before building. Do not mock up every step.

## 2. Check the infrastructure (before creating *and* before modifying)

Every create or modify request starts here, even when you expect everything to exist. A generated
presentation depends on three **contract anchors**:

1. **Build setup** - a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** - the `Step`/`SceneProps` contract, stage/host, present/browse navigation, chrome
   (captions, table of contents) and fit-scale canvas.
3. **Presentation index** - the registry that maps each presentation to its own route.

Detection is by contract, not by byte-identical files: renamed files, formatting and extra
dependencies do not count as missing.

Run the plan (it writes nothing):

```bash
node <skill-dir>/scripts/scaffold.mjs --dir <project directory>
```

It reports the resolved `target`, which anchors exist, and what it would copy. Target rules:

- an existing presentation app (anchors present, in the directory or in `presentations/`) is used
  as is;
- a **monorepo** (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` layout) gets a self-contained app in `presentations/`, never a change to the monorepo
  root;
- an empty or standalone project is scaffolded at its root.

Then branch on what the plan says:

- **All anchors present** - skip scaffolding entirely and go on.
- **Empty or VCS-only directory** - scaffold fully; no confirmation needed.
- **Non-empty project with any anchor missing (including the build setup)** - first tell the user
  the target location and what will be written (the plan's `copy` list and manifest merge), and
  wait for their confirmation before running anything that writes.
- **Partial scaffold** - only the missing anchors and their dependencies are added; existing
  files, scripts and dependency versions are preserved (the script never overwrites).

Apply it only after the branch above allows it:

```bash
node <skill-dir>/scripts/scaffold.mjs --dir <project directory> --apply [--confirmed]
```

`--confirmed` records that the user approved the stated target. The script installs the full
dependency set (React, Vite, TypeScript, Motion, Lucide icons, ESLint stack, Playwright) with
`npm install`; never assume dependencies or `node_modules` already exist. If it reports that
`src/main.tsx` already existed, make it render
`<Router pathname={window.location.pathname} registry={PRESENTATIONS} />`.

The scaffold is styling-framework-neutral and ships no colors, fonts, spacing, cards, buttons or
theme. Do not add Tailwind or any other framework unless the host project already uses one or the
user asks for it.

## 3. Create or modify

### Create

```bash
node <skill-dir>/scripts/new-presentation.mjs --target <app directory> --slug <slug> --title "<Title>"
```

This writes `src/presentations/<slug>/` (its own folder, reachable at `/<slug>`) and appends one
line to `src/presentations/index.ts`. It refuses to overwrite an existing presentation, so other
presentations stay intact and reachable. Then replace the template content with the user's:

- `entities.ts` - the presentation's `layoutId` namespace: one stable id per entity and the step
  where it first appears.
- `Scene.tsx` - the one scene component; steps in the same group share it, so the instance
  persists and only `payload` changes.
- `steps/*` - one `Step` per beat: stable `id`, `era` (section label), one-line `title`, browse
  `caption`, `Scene`, `groupKey`, `payload`. Numbers come from position; never store them.
- `<slug>.css` - the designed look, in **plain CSS owned by the presentation**. Never put colors,
  fonts, borders, shadows or spacing in `src/presentation-kit/`.

Scene rules: entities that continue keep their id and are not re-wrapped in `Appear`; only
newcomers use `Appear`, and anything that can leave sits under `AnimatePresence`. Compose inside the
fixed 880 x 380 canvas with kit primitives or raw `motion` elements that keep a stable `layoutId`.
Keep the caption area a fixed height in CSS so the fit scale is the same on every step. Preserve
intentional overlaps; spread `ALLOW_OVERLAP` on a subtree only when its overlap is deliberate and
readable.

Style the chrome in the presentation's CSS: make `[data-presentation-active]` on progress dots and
table-of-contents entries visibly distinct, and make `[data-presentation-attribution]` legible.

### Modify

1. If the user did not name a presentation, or the name is ambiguous, list the presentations in
   `src/presentations/index.ts` and ask which one **before changing anything**.
2. Once the target is identified, ask only about the requested changes (steps, entities or style).
   Do not re-walk the create flow.
3. Edit only that presentation's folder (plus its registry line if its title changes).

## 4. Self-verify before reporting done

Do not report success until all of this holds; fix failures yourself and re-check.

1. `npm run build` completes with no type errors.
2. The route renders its first step with no runtime or console errors. Before completion, run the
   full `npm run verify` (build, then every step of every registered presentation in Chromium).
3. Visual composition, using the project-local screenshot helper (not an ad hoc script):

   ```bash
   npm run inspect -- <slug>                       # wide desktop, writes .inspection/<slug>/1440x900/
   npm run inspect -- <slug> --viewport 390x844    # also for responsive-sensitive presentations
   ```

   It captures one settled screenshot per step. Look at the first step, the last step and every
   dense or key step, and confirm: important content fits the fixed canvas; intentional overlaps
   stay readable; scene content does not collide with captions, progress indicators, the table of
   contents or the navigation controls.
4. Review every `WARN [advisory]` line the helper prints. For each named step: fix accidental
   text/chrome collisions; style `[data-presentation-active]` where active chrome is indistinct;
   style `[data-presentation-attribution]` where it is missing, default or undersized; mark
   `ALLOW_OVERLAP` only on genuinely intentional, readable overlaps. Rerun the helper afterwards.
   Warnings are advisory and screenshots are for your review; neither replaces your visual check.
5. If you must write a temporary Playwright script instead, put it under the project root (never
   outside it) so dependencies resolve locally, and wait for animations to settle before capturing.

When you report, state the checks you ran and their results, and any advisory warnings that remain.

## Quality bar

Every generated presentation builds clean, renders its first step without errors, shows a caption
per step, supports next/previous navigation, passes the visual composition check, and follows the
evolving-scene model above. `src/presentations/how-to-make-a-presentation/` is a complete worked
example (nine steps in one persistent scene).
