---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagram (stable entities moving through named steps). Use when asked to make, build, change, or extend a presentation, talk, or deck from a topic.
---

# Presentation

Builds browser presentations modeled as **one evolving scene**: entities have
stable ids and morph, appear, and leave as the viewer moves through named
steps. It is not a stack of unrelated slides. "Presentation" is the canonical
term; "talk" is an informal synonym (the per-presentation entry file is
`Talk.tsx` only by convention).

All paths below that start with `templates/` or `scripts/` are relative to the
directory containing this `SKILL.md`, never to the current working directory.
The helper `scripts/scaffold.mjs` resolves them from its own location; call it
as `node <skill-dir>/scripts/scaffold.mjs ...`.

## Workflow

### 1. Gather

Ask the user for what is missing, **one question at a time**, never several at
once:

1. the topic,
2. the visual style,
3. for each step: its content and a description of what the diagram shows.

Do not invent details the user can still supply; ask first. Skip any question
the prompt already answers. If the prompt already holds the topic, style, and
all step details, build without further questions.

The user decides how much detail to give. If they choose to build with partial
detail, build from what you captured; there is no completeness gate, and they
can iterate afterwards.

When a step's layout is key or complex, you may draw an ASCII mockup of that
step to confirm the layout before building. Do this at your discretion for the
few steps where it helps, not for every step.

If the user wants to **modify** an existing presentation, do step 2 first (a
modification also needs the build setup, scene kit and presentation index in
place; scaffold anything missing before editing), then go to
[Modify](#modify-an-existing-presentation); ask only about the changes.

### 2. Resolve the target and scaffold what is missing

Run `node <skill-dir>/scripts/scaffold.mjs detect <project-dir>`. It checks three
contract anchors, by contract rather than by byte-identical files, so naming,
formatting, and extra dependencies never trigger re-scaffolding:

1. **Build setup**: a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit**: `src/presentation-kit/`, the presentation-agnostic engine: the
   `Step`/`Scene` contract, the stage that mounts the active step and runs
   morphs, present/browse navigation, chrome (captions, table of contents), and
   the fit-scaled canvas.
3. **Presentation index**: `src/presentations/index.ts`, the registry that maps
   each presentation to its own route so several coexist.

Target resolution:

- Empty directory, or a standalone (non-monorepo) project: scaffold at the root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a
  `packages/` or `apps/` layout): scaffold a self-contained app in
  `presentations/`; never mutate the monorepo root.
- Already inside a presentation app (any anchor present): use that app.

Then:

- **All three anchors present**: skip scaffolding and go to step 3.
- **None or some present**: scaffold only the missing anchors, leaving present
  ones untouched. The scaffold must also install the full dependency set and
  must not assume any of it is installed: `react`, `react-dom`, `motion`,
  `lucide-react`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`.
- **Non-empty project missing any anchor** (the project directory or the resolved
  target already holds files, including a monorepo whose `presentations/` does not
  exist yet, and including when only the build setup is missing): before writing
  anything, tell the user the resolved target directory and the reason, then wait
  for them to confirm. Only after confirmation run
  `node <skill-dir>/scripts/scaffold.mjs bootstrap <project-dir> --confirm`.
  For an empty project, run it without `--confirm`. The helper refuses to write
  into a non-empty project without `--confirm`.
- When the helper reports `notes` (for example that your existing `src/main.tsx`
  was kept), act on them: wire the registry and `src/Router.tsx` into the existing
  entry point so every presentation is reachable at `/<slug>`.
- After scaffolding, run `npm install` in the target (it merges only missing
  dependencies into an existing `package.json`, and never overwrites existing
  files), then `npx playwright install chromium` if the browser is not available.

The scaffold is styling-framework neutral and ships no colors, fonts, spacing,
cards, or buttons. Tailwind or any other framework is added only if the host
project already uses it or the user explicitly asks for it, configured in the
host or the presentation, never in the kit.

### 3. Generate

Create the presentation with
`node <skill-dir>/scripts/scaffold.mjs create <project-dir> --slug <slug> --title "<Title>"`.
It copies `templates/presentation/` into `src/presentations/<slug>/` and appends
one line to the registry, leaving every other presentation untouched; the
presentation is then reachable at `/<slug>`.

Then edit the new folder:

- `entities.ts`: the presentation's own `layoutId` namespace (stable entity ids).
- `scene.tsx` and `steps/*`: compose the kit primitives (`Box`, `Label`, `Arrow`,
  `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`). Persisting entities
  keep their id; wrap a newcomer in `Appear` with a stable `key` and keep that
  same key for as long as the entity stays, so its entry does not replay;
  departing entities leave through `SceneLayer`.
  Steps that share a `groupKey` and a `Scene` keep one mounted scene and change
  only `payload`. Every step needs a stable id, an era label, a one-line title,
  and a paragraph caption. Step numbers come from array position.
- For coordinate-heavy diagrams, raw `motion` elements with a stable `layoutId`
  are fine where a primitive is the wrong shape.
- `talk.css`: the look. **Styling belongs to the presentation or host, never to
  the kit.** Use plain CSS unless the host already uses a styling framework or
  the user explicitly requested one. Target the kit's `data-presentation-*`
  hooks. The CSS must make the active progress dot and active table-of-contents
  entry visibly distinct from inactive ones (`[data-presentation-active]`) and
  the attribution link legible (`[data-presentation-attribution]`). Do not edit
  files under `src/presentation-kit/`.

### 4. Self-verify before reporting done

Never report success while any check fails. Fix the cause and re-run.

1. `npm run build` must finish with no type errors.
2. Render the presentation's route and confirm it renders with no runtime or
   console errors: `npm run verify -- --slug <slug>` builds the app, opens that
   route in Chromium on `127.0.0.1`, steps through every step, and fails on any
   console error, uncaught exception, or stalled step. A lighter single-route
   render may run first while iterating; finish with `npm run verify -- --slug <slug>`
   (and plain `npm run verify` where the project declares a reference sample).
3. Visual composition: run the project-local helper
   `npm run inspect -- <slug>` (add `--narrow` when the presentation is
   responsive-sensitive). Prefer it over ad hoc scripts; if it is unavailable,
   write any temporary Playwright script under the project root so browser
   tooling resolves from local dependencies. It captures settled screenshots of
   every step under `inspection/<slug>/`. Look at the first step, the last step,
   and any dense or key steps (and a narrow viewport when responsive-sensitive).
   Important content must fit the canvas, intentional overlaps must stay
   readable, and nothing may collide with chrome such as the caption, progress
   dots, table of contents, or navigation.
4. Review every advisory warning the helper prints: open the cited steps; fix
   accidental collisions, indistinct current-step chrome, and unpolished
   attribution in the presentation CSS or scene; re-run the helper. Mark a
   subtree with `data-presentation-allow-overlap` only when that overlap is
   intentional and readable. Report the final check results and any remaining
   advisory warnings accurately.

Quality bar for every generated presentation: builds without type errors;
renders its first step with no runtime or console errors; has a caption on every
step; supports next/previous navigation; passes the visual composition check;
and follows the evolving-scene model.

## Modify an existing presentation

1. Identify the target. If the request does not clearly name one, list the
   presentations (`node <skill-dir>/scripts/scaffold.mjs list <project-dir>`) and
   ask which to modify. Change nothing before the target is clear.
2. Ask only about the requested changes (steps, entities, or style); do not
   walk the full creation flow again.
3. Edit only that presentation's folder (and its registry entry if its title or
   slug changed). Leave other presentations as they are.
4. Run the same self-verification as above.
