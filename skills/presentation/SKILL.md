---
name: presentation
description: Creates or modifies a browser presentation that behaves like one evolving diagram (entities appear, move, connect and re-label across named steps) from a topic. Use when asked to make, build, create, edit or update a presentation, talk or slide deck in a Vite + React project. Self-bootstraps the scene kit, presentation index and verification scripts when they are missing.
---

# Presentation

A presentation is **one scene that evolves through named steps**, not a stack of
unrelated slides. Entities keep a stable identity, so when a step changes them
they morph in place; entities that are new enter after the others settle, and
entities that disappear exit. "Talk" means the same thing; the only place the
word survives is each presentation's entry file `Talk.tsx`.

`<skill-dir>` below means the directory that contains this `SKILL.md`. Resolve
every template and helper path from it, never from your working directory:

- `<skill-dir>/scripts/bootstrap.mjs` — detects, plans and applies the scaffold
- `<skill-dir>/templates/bootstrap/` — the full app snapshot (build setup, scene kit, presentation index, verification scripts, a starter presentation)
- `<skill-dir>/templates/presentation/` — files for one new presentation (`__SLUG__` and `__TITLE__` are placeholders)

## 1. Gather

Ask the user one question at a time. Cover, in this order, whatever the prompt
has not already answered:

1. the topic;
2. the visual style (palette, mood, typography direction);
3. for each step: its content (what the viewer should learn), and a visual
   description (which entities appear, move, connect or re-label).

Never assume a detail the user can still provide. The user decides how deep to
go: if they choose to build with partial detail, stop asking and generate from
what you have; they can iterate afterwards. If the prompt already contains the
topic, the style and every step, skip the questions and build.

For a step whose layout is key or complex, you may draw an ASCII mockup and ask
the user to confirm it before building. Do this when it helps, not for every step.

## 2. Resolve the target and scaffold what is missing

Run, from anywhere:

```bash
node <skill-dir>/scripts/bootstrap.mjs detect --dir <project-dir>
```

It reports the target app and which of the three **contract anchors** exist.
Detection is by contract, not by byte-identical files, so renamed or reformatted
files and extra dependencies do not trigger re-scaffolding:

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — the presentation-agnostic engine in `src/presentation-kit/`: the `Step`/`Scene` contract, the stage that mounts the active step and runs morphs, present/browse navigation, chrome (captions, table of contents) and the fit-scale canvas.
3. **Presentation index** — `src/presentations/index.ts`, the registry that gives each presentation its own route, plus the pathname router.

Where the app lives:

- already inside a presentation app (anchors present) → use it, scaffold only missing anchors;
- a monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout) → a self-contained app in `presentations/`; never modify the monorepo root, and judge the anchors in `presentations/`, not in the root app;
- an empty or standalone project → the project root.

Then act on what is missing:

- **All three present** → skip scaffolding and go to step 3.
- **Some or none present** → scaffold only the missing anchors and the dependencies they need. Existing files are never overwritten; `plan` lists any `conflicts` (a file you must merge by hand, for example wiring `Root` into an existing `main.tsx`).
- **Empty directory** → scaffold without asking.
- **Non-empty project** (including a monorepo, or a project that only lacks the kit or index) → first tell the user the exact target directory and what will be added, and wait for them to confirm. Only then run `apply --confirmed`. Without `--confirmed` the helper refuses to write.

```bash
node <skill-dir>/scripts/bootstrap.mjs plan  --dir <project-dir>
node <skill-dir>/scripts/bootstrap.mjs apply --dir <project-dir> [--confirmed]
```

`apply` installs dependencies (`react`, `react-dom`, `motion`, `lucide-react`,
`vite`, `@vitejs/plugin-react`, `typescript` with its React and Node types, the
ESLint stack and `playwright`). Never assume any of them is already installed.
If browsers are missing, run `npx playwright install chromium` in the target.

The scaffold is **styling-framework-neutral**: no Tailwind, no theme, no default
colors, fonts, cards or buttons. Add a styling system only if the host project
already uses one or the user asks for it.

## 3. Create or modify

### Create

Make a self-contained folder `src/presentations/<slug>/` in the target app by
copying `<skill-dir>/templates/presentation/` and replacing `__SLUG__` and
`__TITLE__`:

- `entities.ts` — the presentation's `layoutId` namespace: every entity, its stable id, geometry, and the step it first appears in. Keep coordinates inside the 880 × 380 design canvas.
- `Scene.tsx` — composes kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`) from `../../presentation-kit`. Raw `motion` elements with a stable `layoutId` are fine where a primitive is the wrong shape.
- `steps/*.tsx` plus `steps/index.ts` — one `Step` per beat: stable `id`, `era` (the table-of-contents section), a one-line `title`, a paragraph `caption`, a `groupKey` shared by steps of the same evolving diagram, and the `payload` that is the diagram state. Steps that share a `groupKey` and `Scene` keep one mounted scene, so only the payload changes and entities morph in place. Step numbers come from position; never number them by hand.
- `Talk.tsx` — `<Presentation steps={STEPS} title=… initialMode="browse" />`.
- `style.css` — **the presentation owns its look**: palette, typography, spacing, borders, shadows, button and card treatments, written as plain CSS targeting the kit's stable `data-presentation-*` hooks and your own classes. Never put visual styling in `src/presentation-kit/`.

Then register it with one line in `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<slug>/Talk') }`). Keep every existing
entry and folder untouched; all presentations stay reachable at `/<slug>`.

Design the evolution, not the slides: persist entities across steps, add rather
than redraw, use each step to change something the viewer can see move.

### Style the chrome

Because the kit has no visual defaults, the presentation's CSS must make these
legible and distinct:

- the active progress dot (`[data-presentation-progress-dot][data-presentation-active]`, also `aria-current`) and active table-of-contents entry (`[data-presentation-toc-entry][data-presentation-active]`) must look clearly different from inactive ones;
- the bottom-right attribution (`[data-presentation-attribution]`, "made by and-scene") must be readable (at least 11px) and not browser-default blue/underlined;
- caption, title, controls and marker typography.

### Modify

If the user has not clearly named the presentation, list the presentations in
`src/presentations/index.ts` and ask which one before changing anything. Once
the target is known, ask only about the requested change (steps, entities or
style) and make scoped edits to that presentation. Do not re-walk the create
flow, and leave every other presentation and file alone.

## 4. Self-verify before saying you are done

Never report success while any check fails; fix the problem and re-run.

1. `npm run build` — no type or build errors.
2. First-step render of **your** presentation's route, with no runtime or console errors. `npm run verify` renders every registered presentation through every step; run it before finishing (it also confirms the route you created loads, so a passing sample elsewhere cannot hide a broken new presentation).
3. Visual composition, with the project-local helper (not an ad hoc script outside the project):

   ```bash
   npm run inspect -- <slug>                       # 1440×900 screenshots, one per step
   npm run inspect -- <slug> --viewport 390x844    # narrow pass for responsive-sensitive work
   ```

   Screenshots land in `artifacts/inspection/<slug>/step-NN.png`, captured after
   a settle interval (`--settle-ms`, default 900). Look at the **first step, the
   last step, and any dense or key steps**. Check that important content fits
   the canvas, intentional overlaps stay readable, and nothing collides with
   chrome (captions, progress dots, table of contents, controls). If the helper
   is unavailable, write any temporary Playwright script **under the project
   root** so it resolves the local dependencies.
4. Review every `WARN step NN [...]` line the helper prints. Warnings are
   advisory, so judge each one: fix accidental text/chrome collisions, indistinct
   active progress or table-of-contents styling, and missing, tiny or
   browser-default attribution. Mark an overlap as intentional only when it is
   deliberate and readable, by putting `data-presentation-allow-overlap` on that
   element's subtree — never on a whole scene or layer to silence warnings. Re-run
   the helper after fixing and report any warnings that remain.

## Quality bar

A finished presentation builds with no type errors; renders its first step with
no runtime or console errors; shows a caption for every step; supports next and
previous; passes the visual composition check; and follows the evolving-scene
model (stable entities, grouped scenes, newcomers entering after others settle).

## Kit reference

`import { … } from '../../presentation-kit'`: `Presentation`, `Step`,
`SceneProps`, `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
`Appear`, `SceneLayer`, `usePresentationNav`. Every primitive takes a stable
`id` (used as its `layoutId`), optional `x y w h` canvas geometry, `className`,
`style` and `data-*` attributes. Keys: Right/Space/PageDown next, Left/PageUp
back, `P` toggles present/browse; navigation clamps at both ends.
