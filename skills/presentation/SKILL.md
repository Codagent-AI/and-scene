---
name: presentation
description: Create or modify a browser presentation modeled as one evolving diagrammatic scene (stable entities that appear, move, connect, and re-label across named steps). Use when asked to make, build, or change a presentation, talk, or slide deck from a topic. Bootstraps the Vite + React + TypeScript app and the scene kit when they are missing.
---

# Presentation skill

A presentation is **one scene that evolves through named steps**, not a stack of unrelated
slides. Entities have stable ids; between steps they move, re-label, and connect in place,
newcomers fade in after the persisting entities settle, and departing entities fade out. The
reusable engine (the *scene kit*) owns motion, the fixed 880 × 380 canvas, navigation, and
present/browse chrome. It owns **no visual style**: each presentation owns its colors,
typography, spacing, and component treatments in plain CSS.

"Presentation" is the canonical term; "talk" is an informal synonym (the entry component file
is named `Talk.tsx` only by convention).

## Paths

Resolve every path below **relative to the directory that contains this `SKILL.md`**, never
relative to the current working directory:

- `templates/bootstrap/` – a complete, self-contained app: build setup, scene kit, router,
  presentation index, `verify` and `inspect` scripts, and a lock file.
- `templates/presentation/` – `*.tmpl` files for one presentation (`entities.ts`, `steps/Scene.tsx`,
  `steps/steps.ts`, `Talk.tsx`, `styles.css`). Placeholders: `__SLUG__` (kebab-case route slug) and
  `__TITLE__` (deck title, escaped for a TypeScript string literal).
- `scripts/detect-target.mjs` – reports which scaffold anchors exist and where to scaffold.
- `scripts/scaffold.mjs` – copies the missing anchors from `templates/bootstrap/` and merges `package.json`.

## Procedure

### 1. Gather (one question at a time)

Ask for what is missing, **one question per message**, in this order: the **topic**, the **visual
style** (mood, palette, typography), then for each step its **content** (title, caption) and its
**visual description** (which entities appear, move, connect, or leave). Never assume a detail the
user can still provide.

- If the prompt already contains the topic, style, and every step's details, build without further
  questions.
- The user decides how much to specify. When they choose to build with partial detail, generate
  from what was captured and say what you filled in. There is no completeness gate; they can
  iterate afterwards.
- For a key or complex step you may draw an ASCII mockup of the layout and ask the user to confirm
  it before building. Do not do this for every step.

When asked to **modify** an existing presentation, go to [Modify](#modify-an-existing-presentation); it still starts with the infrastructure check in step 2.

### 2. Resolve the target and scaffold what is missing

Run `node <skill-dir>/scripts/detect-target.mjs <project-dir>` and read the JSON. It reports the three
contract anchors and where they belong:

1. **Build setup** – Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** – `src/presentation-kit/` (step contract, stage/host, navigation, chrome, fit-scale canvas).
3. **Presentation index** – `src/presentations/index.ts`, mapping each presentation to its own route.

Detection is by contract, so cosmetic differences (naming, formatting, extra dependencies) never
trigger re-scaffolding. Targets:

- Empty directory or standalone project → scaffold at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  layout) → scaffold a self-contained app in `presentations/`; never mutate the monorepo root.
- Already inside a presentation app → use it.

`scaffold` in the result says what to do:

- `none` – all anchors exist; go straight to step 3.
- `full` or `partial` – run `node <skill-dir>/scripts/scaffold.mjs <project-dir>` (after the
  confirmation below). It copies only what is missing from `templates/bootstrap/`, never
  overwrites an existing file (they are listed under `skipped`), and merges the dependencies and
  scripts the infrastructure needs into an existing `package.json` without changing existing
  entries (`addedDependencies`, `addedScripts`).
- If the result has `wiring` entries, the host already has its own entry point (for example
  `src/main.tsx`) that does not use the route registry. Make a scoped edit so `"/<slug>"` renders
  the lazy presentation from `src/presentations/index.ts` and `"/"` renders `src/Landing.tsx`, following
  `templates/bootstrap/src/main.tsx`, and keep the rest of the host file intact.

If `confirmRequired` is true (the project is non-empty), **state the target directory and what you
will add, and wait for the user to confirm before writing anything.** Preserve all existing
content.

Then install dependencies: never assume they are present. In `target`, run `npm ci` after a full
scaffold into an empty directory (the template ships a lock file), otherwise `npm install` so the
dependencies added to `package.json` are installed. The full set is: `react`, `react-dom`, `motion`, `lucide-react`, `vite`, `@vitejs/plugin-react`,
`typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and
`playwright` (then `npx playwright install chromium` if no browser is available).

The scaffold is styling-framework-neutral and ships no colors, fonts, or themes. Add Tailwind or
another framework **only** if the host already uses it or the user explicitly asks for it.

### 3. Generate

Create the presentation in `src/presentations/<slug>/` from `templates/presentation/` (drop the
`.tmpl` suffix, substitute placeholders):

- `entities.ts` – the presentation's `layoutId` namespace and canvas geometry (880 × 380).
- `steps/Scene.tsx` – the persistent scene. Entities that continue between steps keep one id and
  must **not** be re-wrapped in `<Appear>`; only entities new to a step are, and every direct child
  of `<SceneLayer>` needs a `key` so a dropped `<Appear>` can fade out. Put entities that
  persist in the same component so they morph in place.
- `steps/steps.ts` – the ordered `Step` list: stable `id`, `era` (ToC section), one-line `title`,
  `caption` paragraph, shared `Scene` + `groupKey`, and the `payload` for the step.
- `Talk.tsx` – `<Presentation steps title initialMode />` (default export).
- `styles.css` – **all** visual design (colors, type, spacing, borders, shadows, chrome). Style the
  stable hooks: `[data-presentation-*]` attributes, `[data-presentation-active="true"]`, and the
  `className` you pass to kit nodes. Plain CSS unless the host already uses a framework or the user
  asked for one. Never put visual defaults in `src/presentation-kit/`.

Register it with one line in `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<slug>/Talk') }`). Existing presentations and registry lines
stay intact. Step numbers derive from position; never number steps by hand.

Chrome you must style locally: the active progress dot and the active table-of-contents entry must
look clearly different from inactive ones, and the bottom-right `made by and-scene` attribution
(`[data-presentation-attribution]`) must be legible and intentional. Leave the top-left header slot
empty unless the host wants its own brand (`brand` prop). Mark a subtree that intentionally overlaps
with `data-presentation-allow-overlap`, only when the overlap stays readable.

### 4. Self-verify before reporting done

Run these from `target` and **fix failures yourself**; never report success while any check fails:

1. `npm run lint` and `npm run build` – no type or build errors.
2. `npm run verify` – builds, then renders the first step (and every step) in Chromium with no
   console or page errors. A lighter single-route check is fine while iterating, but run the full
   command before finishing.
3. Visual composition: `npm run inspect -- <slug>` writes settled screenshots to
   `.presentation-artifacts/<slug>/`. Look at the **first step, the last step, and every dense or
   key step**; repeat with `--narrow` when the presentation is responsive-sensitive. Use this
   project-local helper, not ad hoc scripts outside the project. Confirm important content fits the
   canvas, intentional overlaps remain readable, and nothing collides with captions, progress,
   table of contents, or navigation controls.
4. Review every advisory warning the helper prints (`overlap`, `active-chrome`, `attribution`). Fix
   accidental collisions, indistinct active chrome, and unpolished attribution in the presentation's
   CSS or layout, rerun, and mark only genuinely intentional, readable overlaps as allowed. Report
   any remaining advisory warnings honestly.

Do not commit `dist/`, `node_modules/`, or `.presentation-artifacts/`.

## Modify an existing presentation

0. Before touching anything, run `detect-target.mjs` and scaffold whatever anchor is missing,
   exactly as in step 2 (including the confirmation for a non-empty project). Modification
   depends on the same build setup, scene kit, and presentation index as creation.
1. If the target is not clearly named, **list the registered presentations** (read
   `src/presentations/index.ts`) and ask which one to modify before changing anything.
2. Ask **only** about the requested change (steps, entities, or style). Do not re-walk the create
   flow.
3. Edit that presentation's files in place; touch the registry only if the slug or title changes.
   Other presentations stay untouched.
4. Run the same self-verification as above.

## Quality bar

Every presentation builds with no type errors, renders its first step with no runtime or console
errors, shows a caption for every step, supports next/previous navigation (keyboard, swipe,
on-screen controls, progress dots, table of contents), passes the visual composition check, and
follows the evolving-scene model: stable ids, in-place morphs, one persistent scene per group.
