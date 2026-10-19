---
name: presentation
description: Creates or modifies a browser presentation built as one evolving diagram (stable entities that appear, move, connect and re-label across named steps) from a topic. Self-bootstraps the Vite + React + TypeScript scaffold and scene kit when the project lacks them, then builds, renders and visually inspects the result. Use when asked to make, create, build, edit or change a presentation, talk, or deck.
---

# Presentation

A presentation here is **one scene that evolves through named steps**, not a stack of slides. Entities keep a
stable identity (`layoutId`), so they move, resize and re-label in place between steps; only genuinely new
entities appear, and only entities that leave disappear. Each step has an id, an era (section label), a
one-line title (present mode), a paragraph caption (browse mode), and the diagram state shown while it is active.

`<skill-dir>` below is the directory containing this `SKILL.md`. Resolve every template and helper path from it,
never from the current working directory:

- `<skill-dir>/scripts/detect.mjs` — read-only target and anchor detection
- `<skill-dir>/scripts/scaffold.mjs` — copies missing anchors from `<skill-dir>/templates/bootstrap/`
- `<skill-dir>/templates/presentation/` — the files of one presentation (placeholders `__SLUG__`, `__TITLE__`)

## Workflow

Run the steps in order. For a modification, use step 2 and then "Modify an existing presentation".

### 1. Gather

Ask the user clarifying questions **one at a time**, in this order, skipping anything the prompt already answers:

1. the **topic** and who it is for;
2. the **visual style** (look, mood, colors, type);
3. for **each step**: its content and what the diagram looks like at that point.

Do not assume details the user can still provide. When a step's layout is key or complex, you may draw an ASCII
mockup of it and confirm before building; do this only where it helps, not for every step.

The user controls the depth. If they say to build with what they have given you, generate from the captured
details and iterate afterwards; there is no completeness gate. If the prompt already contains the topic, style and
all step details, go straight to step 2 without further questions.

### 2. Resolve the target and scaffold

1. Run `node <skill-dir>/scripts/detect.mjs <project-dir>`. It prints the resolved `target`, whether the project is a
   `monorepo`, which of the three contract **anchors** exist, which are `missing`, and `needsConfirmation`.

   The anchors are checked by contract, not by exact files or bytes, so renamed or reformatted files and extra
   dependencies do not trigger re-scaffolding:
   1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
   2. **Scene kit** — the presentation-agnostic engine (`Presentation`, `Stage`, step contract, present/browse
      navigation, chrome, fit-scale canvas), conventionally `src/presentation-kit/`.
   3. **Presentation index** — the registry mapping each presentation to its own route
      (`src/presentations/index.ts`).

2. Target rules:
   - Empty directory or standalone project: scaffold at the project root.
   - Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` / `apps/` layout): scaffold a
     self-contained app in `presentations/`. Never modify the monorepo root; its own build setup does not count as the
     app's build anchor.
   - Already inside a presentation app (all three anchors present): use it as is.

3. If `missing` is empty, **skip scaffolding** and go to step 3. Do not overwrite or reinstall anything.

4. If `needsConfirmation` is true (the project is non-empty and something is missing), **tell the user the exact
   target directory and what will be added, then wait for their confirmation before writing anything**.

5. Scaffold only what is missing: `node <skill-dir>/scripts/scaffold.mjs <target> --anchors <comma-separated missing>`.
   It never overwrites an existing file; `package.json` only gains missing dependencies and scripts, and the
   `scripts/` helpers behind `npm run verify` / `npm run inspect` are always ensured. A partial scaffold leaves the
   anchors already present untouched. If the output lists `wiring`, the project already had its own entry file: edit it
   as described (render the template's `Router` over the registry, see the listed `reference`) so the new routes are reachable.

6. Install dependencies; never assume they exist: `npm install` in the target (`npm ci` when the scaffold wrote a fresh
   `package-lock.json`). The scaffold needs React, ReactDOM, Motion, Lucide, Vite, the React Vite plugin, TypeScript and
   the React/Node type packages, the ESLint stack, and Playwright. Then make sure Chromium is available:
   `npx playwright install chromium`.

The scaffold is styling-framework neutral and ships no colors, fonts, spacing or component styles. Add Tailwind or
another styling system only if the host project already uses it or the user explicitly asks.

### 3. Generate

Create one self-contained folder per presentation and register it; never touch other presentations.

1. Copy `<skill-dir>/templates/presentation/` to `<target>/src/presentations/<slug>/` (`<slug>` is lowercase
   kebab-case) and replace `__SLUG__` and `__TITLE__`.
2. `entities.ts` — this presentation's `layoutId` namespace and canvas coordinates (the canvas is 880 × 380 design
   pixels, scaled to fit). Every entity that persists across steps keeps one id and its changing position, size, label
   or emphasis; do not redraw a persisting thing under a new id.
3. `steps/*.ts` — one `Step` per beat, in order. Step numbers are derived from position; never write them. Adjacent
   steps of the same evolving diagram share a `groupKey` and the same `Scene`, so the scene instance persists and
   only `payload` changes. Write a title (one line) and a caption (a paragraph) for every step.
4. `Scene.tsx` — compose kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `SceneLayer`,
   `Appear`), or raw `motion` elements with a stable `layoutId` when a primitive is the wrong shape. Render entities that
   already exist bare so they morph in place; wrap only entities that are new in this step in `Appear` (they enter after
   the continuing entities settle). Do not flatten or spread entities that are intentionally stacked or overlapping.
5. `styles.css` — **the presentation owns its look**: palette, type, spacing, borders, entity treatments. Plain CSS is the
   default; use another styling system only if the host already does or the user asks. Never add styling to
   `src/presentation-kit/`. Style the stable hooks (`data-presentation-*`), including a clearly distinct
   `[data-presentation-active="true"]` for the active progress dot and table-of-contents entry, and a legible
   `[data-presentation-attribution]` (the kit's "made by and-scene" link; pass `attribution={false}` only if the user asks).
   Mark a deliberately overlapping, readable composition with `data-presentation-allow-overlap` on its subtree.
6. Register it by **appending** one entry to `src/presentations/index.ts`:
   `{ slug: '<slug>', title: '<title>', load: () => import('./<slug>/Talk') }`. Keep the existing entries as they are.
   The presentation is then reachable at `/<slug>`.

### 4. Verify before reporting done

Run all of these in the target directory and **fix every failure and re-run** until they pass. Never report success
while any build, render or visual check is failing or unresolved; if you cannot make one pass, report that it is
blocked and why.

1. **Build**: `npm run build` — no type errors. Also `npm run lint`.
2. **Render**: `npm run verify` — builds the whole app and renders every registered presentation in Chromium through
   all steps against a production preview on `127.0.0.1`, failing on any console error, uncaught page error or step
   that does not advance. At minimum the new presentation's first step must render with no runtime or console errors.
   (To save time you may run the build and a single-route render first, but finish with `npm run verify`.)
3. **Visual composition**: run `npm run inspect -- <slug>`; use the project-local helper
   (`scripts/inspect-presentation.mjs`) rather than ad hoc scripts. If it is unavailable, write any temporary Playwright
   script **inside the project root** so browser tooling resolves from local dependencies. The helper waits for
   transitions to settle and writes one screenshot per step under `.inspection/<slug>/`. Look at the screenshots of the
   **first step, the last step, and every dense or key step**; also run with `--viewport 390x844` and inspect when
   the presentation is responsive-sensitive. Check that important content fits the canvas, intentional overlaps stay
   readable, and nothing collides with the caption, progress dots, table of contents or navigation controls.
4. **Warnings**: review every advisory warning the helper prints. For each one, open the cited step and elements; fix
   accidental collisions and indistinct active chrome or unpolished attribution in the presentation's CSS or scene; add
   `data-presentation-allow-overlap` only to a subtree whose overlap is intentional and readable. Never mark every
   reported collision as allowed or otherwise suppress warnings wholesale. Re-run the helper afterwards, and report the
   final checks and any remaining advisory warnings accurately.

Do not commit `dist/`, `node_modules/` or `.inspection/`.

## Modify an existing presentation

1. Identify the target. If the user did not name one clearly, **list the registered presentations and ask which to
   modify before changing anything**; never silently pick one.
2. Ask only about the requested changes (steps, entities, or style). Do not re-run the full gathering interview.
3. Edit only that presentation's folder, plus its registry entry if its slug or title changed. Leave other
   presentations untouched.
4. Run step 4 (verify) in full.

## Quality bar

A presentation is done only when it builds with no type errors, renders its first step without runtime or console
errors, shows a caption for every step, supports next/previous navigation, conforms to the evolving-scene model, and
has passed the visual composition check.
