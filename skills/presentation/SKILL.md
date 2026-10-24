---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram (stable entities that appear, move, connect, and re-label across named steps), from a topic. Use when asked to make, build, create, edit, or change a presentation or talk. Scaffolds the Vite + React + TypeScript app and scene kit when missing, then builds, renders, and visually checks the result.
---

# Presentation

Generate a browser presentation modeled as **one evolving scene**: entities with stable
IDs move through ordered, named steps. It is not a deck of disconnected slides. "Presentation"
is the canonical term; "talk" is an informal synonym (the per-presentation entry component is
named `Talk.tsx` only by convention).

## Where things live

All paths below that start with `templates/` are relative to **the directory containing this
`SKILL.md`**, never to the current working directory. Work out that directory first and use
absolute paths when copying from it.

- `templates/bootstrap/` — a complete, style-neutral app: build setup, scene kit
  (`src/presentation-kit/`), router and presentation index (`src/presentations/index.ts`),
  `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `verify.config.json`, and a lock file.
  `gitignore.template` is copied as `.gitignore`.
- `templates/presentation/` — the files of one new presentation (`entities.ts`, `Scene.tsx`,
  `steps/`, `Talk.tsx`, `styles.css`) with `{{SLUG}}` and `{{TITLE}}` placeholders.

## Procedure

Follow the steps in order. Do not skip step 4.

### 1. Gather

Ask the user for what is missing, **one question at a time**, never several in one message:
the topic, the visual style, and the content plus visual description of each step.

- Do not assume or invent a detail the user can still provide. Ask for it.
- If the prompt already contains the topic, style, and all step details, proceed without
  further questions.
- The user decides how much to specify. When they choose to build with partial detail, build
  from what you have. There is no completeness gate once they have said to proceed; they can
  iterate afterwards.
- When a step's layout is key or complex, you may draw an ASCII mockup of that step and ask
  the user to confirm it. Do this only where it helps, not for every step.

When modifying an existing presentation, skip this step's full interview; see "Modify".

### 2. Resolve the target and scaffold what is missing

A project is ready when it has all three **contract anchors**. Detect them by what they do, not
by exact file names or formatting; cosmetic differences and extra dependencies do not count as
missing.

1. **Build setup** — a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** — the presentation-agnostic engine: the `Step`/`Scene` step contract, the stage
   that mounts the active step and runs entity morphs, present/browse navigation, chrome
   (captions, table of contents), and the fit-scaled canvas. (`src/presentation-kit/`.)
3. **Presentation index** — the registry mapping each presentation to its own route, so several
   coexist. (`src/presentations/index.ts`.)

Decide what to do:

| Situation | Action |
|---|---|
| All three anchors present (you are inside a presentation app) | Use that app. Do not scaffold. Go to step 3. |
| Some anchors present | Scaffold **only the missing anchors** and their dependencies. Leave existing files untouched. |
| None present | Full scaffold from `templates/bootstrap/`. |

**Where to scaffold.** If anchors already exist, that app is the target and nothing is relocated.
Otherwise:

| Project | Target |
|---|---|
| Empty directory or standalone (non-monorepo) project | The project root |
| Monorepo: `workspaces` in the root `package.json`, **or** a `pnpm-workspace.yaml`, **or** a root `packages/` or `apps/` directory | A self-contained app in `presentations/`; do not modify the monorepo root |

**Confirm before writing in a non-empty project.** If the project is non-empty and lacks the
scene kit or presentation index, first tell the user the exact target directory and what you will
add, and wait for their confirmation. Make no write, install, or generation before they confirm.
The monorepo heuristic is a guess; the confirmation is what catches a wrong guess.

**Scaffolding.** Copy from `templates/bootstrap/` (resolved from this file's directory, see
above), copying only the missing anchors when the scaffold is partial. Never assume dependencies are
installed; ensure the full set, installing whatever is absent:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node`, the ESLint stack, and `playwright` (render verification; also run
  `npx playwright install chromium` if no Chromium is available).

Then run `npm ci` (or `npm install` when merging dependencies into an existing project).

The scaffold is **styling-framework-neutral** and ships with **zero presentation styling
defaults**: no Tailwind, theme tokens, colors, fonts, card or button styles. Never add a styling
framework unless the host project already uses one or the user explicitly asks for it.

### 3. Generate

**Create** a presentation:

1. Copy `templates/presentation/` into `<app>/src/presentations/<slug>/` (the folder is
   self-contained; replace `{{SLUG}}` and `{{TITLE}}`).
2. Write `entities.ts` (this presentation's `layoutId` namespace: one stable id per entity, with
   coordinates in the 880 × 380 design canvas) and `steps/*` (one file per step, each with `id`,
   `era`, one-line `title`, paragraph `caption`, and its diagram state).
3. Register it with one new entry in `src/presentations/index.ts`
   (`{ slug, title, load: () => import('./<slug>/Talk') }`). It is then reachable at `/<slug>`.
   Do not touch other presentations' folders or entries; they must stay intact and reachable.

**Scene model rules** (the quality bar):

- Entities that persist keep the same id on every step they appear in, and change in place
  (position, size, label, emphasis). Never re-create an entity under a new id to move it.
- Steps showing successive states of one diagram share a `groupKey` and `Scene`, so the scene
  persists and only `payload` changes.
- Wrap only **newcomers** in `<Appear>`; pass `active={false}` once an entity continues, so it
  morphs rather than fading in again. Wrap conditional entities in `AnimatePresence` so
  departing entities animate out.
- Keep the whole composition inside the fixed canvas. Intentional overlap or stacking is fine
  when it reads clearly; do not spread entities just to avoid overlap.
- Every step has a caption and the user can move next/previous.

**Styling.** The kit owns behavior and geometry, never looks. Put the visual design (palette,
type, spacing, borders, shadows, control treatments) in presentation-owned files, typically
`<slug>/styles.css` imported by `Talk.tsx`, or the host app's CSS. Plain CSS is the default.
Never add styles to `src/presentation-kit/`. Style the chrome through the kit's hooks:

- the **active** progress dot and table-of-contents entry:
  `[data-presentation-progress-item][data-presentation-active]` and
  `[data-presentation-toc-item][data-presentation-active]` (also `aria-current="step"`) must be
  visibly distinct from inactive ones;
- the attribution link `[data-presentation-attribution]` must be legible (readable size, a
  deliberate color; never the browser-default link look).

### 4. Self-verify before reporting done

Run these on the presentation you generated or modified (not only on the sample). Do not
report success until every one passes; fix failures yourself and re-run.

1. **Build:** `npm run build` — no type or build errors.
2. **Render:** at minimum the presentation's first step renders at its route with no runtime or
   console errors. Run `npm run verify` (builds, then steps the configured routes in Chromium
   on `127.0.0.1`) for completion; you may run a lighter build plus single-route render first.
   Add the new route to `verify.config.json`. A failing phase is named in the output, with the
   step index for browser and transition failures.
3. **Visual composition:** run the project-local helper (preferred over ad hoc scripts):
   `npm run inspect -- <slug>`. It writes settled screenshots to
   `inspection-output/<slug>/step-NN.png` (options: `--out`, `--settle`, `--width`, `--height`,
   `--no-build`). Look at the screenshots for the **first step, the last step, and every
   dense or key step**; for responsive-sensitive presentations also run a narrow pass such as
   `npm run inspect -- <slug> --width 390 --height 844 --out inspection-output/<slug>-narrow`.
   If the repository provides `chrome-devtools-axi`, use `snapshot` first, then screenshots.
   Check that:
   - important scene content fits inside the fixed canvas;
   - intentional overlaps stay readable;
   - nothing collides with chrome: captions, progress indicators, table of contents, or
     navigation controls.
   If the project has no helper, write any temporary Playwright script **inside the project
   root** so it resolves the project's own dependencies.
4. **Review the helper's advisory warnings** (overlap, indistinct active chrome, unpolished
   attribution). Open each referenced step. Fix accidental collisions, make the active
   progress/ToC state visibly distinct, and polish the attribution via its hook. Mark an
   overlap as allowed (`data-presentation-allow-overlap` on the narrowest subtree) **only** when it is
   intentional and reads clearly; never to silence a defect. Re-run the helper after fixes and
   report remaining advisory warnings accurately.

Warnings are advisory and screenshots are inspection aids: they do not replace judging the
composition. A build, render, or visual failure is fixed and re-checked, never reported as success.
Do not commit `inspection-output/`, `dist/`, or `node_modules/`.

## Modify an existing presentation

First run step 2 (detect the three anchors and scaffold only what is missing), as for create.

1. Identify the target first. If the request does not clearly name one presentation (or is
   ambiguous), **list the existing presentations** from the index and ask which one, before
   changing anything.
2. With the target known, ask **only** about the requested changes (steps, entities, or style)
   and make scoped, in-place edits to that presentation. Do not re-walk the create interview,
   and leave other presentations alone.
3. Run step 4 (self-verify) again on the modified presentation.

## Reference: the scene kit's hooks

Root: `data-presentation-root`, `data-presentation-mode`, `data-step-count`, `data-step-index`.
Chrome: `data-presentation-chrome` (`header`, `footer`, `nav`, `toc`), `-marker`, `-step-title`,
`-caption`, `-progress-item`, `-toc-item`, `-prev`, `-next`, `-attribution`, `-brand-slot`.
Entities: `data-presentation-node` (`box`, `label`, `arrow`, `frame`, `emphasis`,
`symbol-chip`) and `data-presentation-entity` (the id). Primitives accept `className`, `style`,
and any `data-*` attribute. For coordinate-heavy shapes, use raw `motion` elements with a stable
`layoutId`. Keys: Right/Space/PageDown next, Left/PageUp previous, `P` toggles present/browse.
The default attribution ("made by and-scene", bottom-right) can be restyled but not removed
silently; the top-left slot is empty unless the host passes `brand`.
