---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagram (entities appear, move, connect and re-label across named steps). Use when asked to make a presentation from a topic, add a presentation to an existing presentations app, or change an existing presentation. Self-bootstraps a Vite + React + TypeScript app with a style-neutral scene kit when one is missing.
---

# Presentation

A presentation is **one scene that moves through named steps**, not a deck of disconnected
slides. Entities keep a stable identity and morph in place between steps; new entities enter
after the persisting ones settle; departing entities exit. "Talk" is only an informal synonym.

Everything below is a procedure you follow. Do the steps in order, for **both** creating and
modifying a presentation.

## 0. Locate this skill's files

Resolve every template path **relative to the directory that contains this `SKILL.md`**, never
relative to the user's current working directory:

- `<skill-dir>/templates/bootstrap/` — the complete, style-neutral app (build setup, scene kit,
  presentation index, a registered `starter` presentation, `scripts/verify.mjs`,
  `scripts/inspect-presentation.mjs`, lockfile).
- `<skill-dir>/templates/presentation/` — the folder template for one new presentation
  (`entities.ts`, `steps/`, `Talk.tsx`; see its `README.md`).

## 1. Gather requirements (one question at a time)

Ask the user clarifying questions **one at a time**, waiting for each answer, covering:

1. the **topic**,
2. the **visual style**,
3. the **content and visual description of each step** (what appears, moves, connects or
   changes, and what the presenter title and browse caption say).

Rules:

- Never assume a detail the user can still provide. Ask for whatever is missing instead of
  inventing a default. Never batch several questions into one message.
- If the prompt already contains the topic, style and all step details, skip the questions and
  go straight to building.
- The user controls the depth. If they choose to build with only partial detail, accept that
  explicitly and generate from what was captured; there is no completeness gate. They can
  iterate afterwards.
- Optionally, at your discretion, draw an **ASCII mockup** of a key or complex step to confirm
  its layout before building. Do not do this for every step.

When the request is to **modify** an existing presentation, do this step only for the requested
change (see section 6), not the full interview.

## 2. Resolve the target and detect the scaffold (before create *and* modify)

Never skip this step because a presentation folder already exists; modification goes through it
too. The app needs three **contract anchors**. Detect them by what they provide, not by
byte-identical files — file naming, formatting and extra dependencies do not count as missing:

1. **Build setup** — a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** — the presentation-agnostic engine: the `Step`/`Scene` step contract, the stage
   that mounts the active step and runs entity morphs, present/browse navigation, the chrome
   (captions, table of contents) and fit-scaled canvas (the `presentation-kit` directory).
3. **Presentation index** — the registry mapping each presentation to its own route, so several
   presentations coexist (`src/presentations/index.ts` plus the route handling in `main.tsx`).

Decide where the app lives:

- **Already inside a presentations app** (anchors present at the root or in `presentations/`):
  use it.
- **Empty directory or standalone (non-monorepo) project**: the app lives at the repository root.
- **Monorepo** — any of: `workspaces` in the root `package.json`, a `pnpm-workspace.yaml`, or a
  `packages/` or `apps/` directory: scaffold a self-contained app in a `presentations/` directory
  and leave the monorepo root build and unrelated content untouched.

**Non-empty project missing scaffolding** (the scene kit or presentation index is absent): first
state the exact target location you will scaffold into, then **wait for the user to confirm**.
Make no writes and run no installs before that confirmation. This applies to standalone and
monorepo targets alike.

## 3. Scaffold what is missing

Do not assume any dependency is installed.

- **No anchors present** (empty directory, or a non-empty project with none): copy the whole of
  `<skill-dir>/templates/bootstrap/` into the target, then install dependencies (`npm ci`, or
  `npm install` when merging into an existing manifest).
- **All anchors present**: skip scaffolding and go straight to section 4.
- **Some anchors present**: scaffold only the missing anchors and their dependencies, copying just
  those parts of the bootstrap template (for example only `src/presentation-kit/` and the
  scripts, or only `src/presentations/index.ts`, `registry.ts`, `router.tsx`, `routes.ts`,
  `Landing.tsx` and the `main.tsx` wiring). Never overwrite or restructure an anchor that already
  exists, and never touch unrelated files.

The scaffold must make these dependencies available (install any that are missing, merging into
an existing `package.json` rather than replacing it):

- runtime: `react`, `react-dom`, `motion`, `lucide-react`;
- build/dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node`, the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`), and `playwright`
  (then `npx playwright install chromium`).

The scaffold is **styling-framework-neutral** and ships **zero presentation styling defaults**: no
Tailwind or Tailwind Vite plugin, no theme, colors, fonts, card or button styles. Add a styling
framework only if the host project already uses one or the user explicitly asks for it. Also make
sure the project has the `verify` and `inspect` npm scripts and `.inspection/` in `.gitignore`.

## 4. Create a presentation

1. Copy `<skill-dir>/templates/presentation/` to `src/presentations/<slug>/` (inside the resolved
   app) and replace the placeholders. Each presentation is a **self-contained folder** with its
   own `entities.ts` (stable `layoutId` namespace), `steps/*`, and `Talk.tsx`, importing the shared
   kit rather than copying it.
2. Model the content as one evolving scene: one persistent `Scene` shared through a common
   `groupKey`, per-step payloads, entities defined once and reused with the same id and
   coordinates so they morph in place. Wrap only genuinely new entities with `enter`; do not fade
   continuing ones. Keep every important element inside the 880 × 380 design canvas.
3. **Register** the presentation with one new line in `src/presentations/index.ts`
   (`{ slug, title, load: () => import('./<slug>/Talk') }`). Registration is additive: keep every
   existing folder and registry entry intact and reachable.
4. **Style it locally.** The kit has zero styling defaults and must stay that way. Put the look in
   presentation-owned (or host-owned) files; plain CSS is the default unless the host already uses
   a styling framework or the user asks for one. The CSS must style the kit's
   `data-presentation-*` hooks, including a visibly distinct active state for progress and
   table-of-contents items (`[data-presentation-active="true"]`, `aria-current="step"`) and a
   legible, deliberate `[data-presentation-attribution]` link ("made by and-scene").
5. Every step needs a one-line presenter title, a browse caption, an era label, and a stable id;
   numbering is derived from position.

## 5. Self-verify before reporting completion

Do not report success until all of this has run against the presentation you generated or
modified (not just the reference sample):

1. `npm run build` — no type or build errors.
2. A render check of the presentation's route that at least renders the first step with no runtime
   or console errors (the full `npm run verify` steps through every step of the reference sample).
3. A browser **visual composition check** using the project-local screenshot helper:
   `npm run inspect -- <slug>` writes settled per-step screenshots to
   `.inspection/<slug>/step-NN.png`. Prefer this helper over ad hoc scripts. If you must write a
   temporary Playwright helper, put it under the project root so browser tooling resolves from the
   local dependencies, not outside the project tree. Always use `127.0.0.1`, not `localhost`.
4. Look at the screenshots of the **first step, the last step, and every dense or key step**. If
   the presentation is responsive-sensitive, also inspect a narrow viewport
   (`npm run inspect -- <slug> --viewport 390x844`). Confirm that important scene content fits the
   canvas, intentional overlaps stay readable, and nothing collides with the captions, progress
   indicators, table of contents, navigation controls or attribution.
5. **Review every advisory warning** the helper prints (overlap, indistinct active chrome,
   unpolished attribution). Open the referenced step, fix accidental collisions and indistinct
   current-step chrome or attribution styling, and re-run the helper. Mark a subtree with
   `data-presentation-allow-overlap` only where the overlap is intentional **and** readable; never
   suppress warnings wholesale, and never treat the absence of warnings as proof that the picture
   looks good.

If the build, the render check, or the visual check fails, **fix the problem and re-run the
checks**. Do not report success on a failing check or with a disclaimer. Finish by reporting the
checks that ran, their results, and any remaining advisory warnings accurately.

Quality bar for every generated presentation: builds with no type errors; renders its first step
without errors; shows a caption per step; supports next/previous navigation; passes the visual
composition check; follows the evolving-scene model.

## 6. Modify an existing presentation

Run sections 2 and 3 first (detect anchors, resolve the target, scaffold anything missing), then:

1. **Identify the target.** If the user did not name one clearly, list the existing presentations
   (registry slugs and titles) and ask which to modify before changing anything.
2. Ask **only** about the requested changes — steps, entities or style — not the full create
   interview. Apply scoped edits to that presentation's own folder (plus its registry line if a
   slug or title changes); leave every other presentation untouched.
3. Run section 5 in full for the modified route.
