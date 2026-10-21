---
name: presentation
description: Creates or modifies a browser-based presentation that is one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps) built on a React scene kit. Use when the user wants a presentation, talk, deck, or explainer made from a topic, or wants to change an existing one. Scaffolds the Vite + React + TypeScript app and scene kit first if the project does not have them.
---

# Presentation

A presentation is **one scene moving through ordered, named steps**, not a deck of
independent slides. Entities keep a stable identity from step to step, so what
persists morphs in place, what is new enters after the morphs settle, and what is
gone exits. "Presentation" is the canonical term; "talk" means the same thing
(only the per-presentation entry file is named `Talk.tsx`).

Paths below are relative to **this file's directory** (the skill directory), never
to the current working directory. Resolve `templates/bootstrap/` and
`templates/presentation/` from here, however the user invoked you.

## Procedure

1. Gather
2. Resolve the target and scaffold what is missing
3. Create or modify the presentation
4. Self-verify, and fix before reporting

### 1. Gather

Ask the user **one question at a time** for anything still missing: the topic, the
visual style, and for each step its content and what the diagram should look like.
Do not guess details the user can still give you. If the prompt already contains the
topic, style and every step, go straight to building.

The user decides how much to specify. If they choose to build with only some of the
detail ("just sketch it", "go with what you have"), build from what you captured and
iterate afterwards. Never gate the build on completeness.

For a step whose layout is key or complex, you may draw an ASCII mockup and confirm
it before building. Do not do this for every step.

When the request is to **modify** an existing presentation, first identify it. If the
user did not name a clear target, list the existing presentations (the entries in
`src/presentations/index.ts`) and ask which one before changing anything. Once the
target is known, ask only about the requested change (steps, entities or style); do
not walk the full create flow again.

### 2. Resolve the target and scaffold what is missing

A presentation app needs three **contract anchors**. Detect them by what they
provide, not by byte-identical files, so renamed files, formatting differences and
extra dependencies do not count as missing:

| Anchor | Present when |
|---|---|
| Build setup | A Vite + React + TypeScript app whose `npm run build` works |
| Scene kit | The `Step`/`Scene` step contract, a stage that mounts the active step and runs entity morphs, present/browse navigation, chrome (captions, table of contents) and the fit-scale canvas (`src/presentation-kit/`) |
| Presentation index | A registry mapping each presentation to its own route (`src/presentations/index.ts`) |

Choose the **target directory**:

- Empty directory or standalone (non-monorepo) project: the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or
  `apps/` layout): a self-contained app in `presentations/`. Do not modify the
  monorepo root.
- Already inside a presentation app (the anchors exist): use it as it is.

Then act on what is missing:

- None of the anchors: full scaffold.
- All three: skip scaffolding and go to step 3.
- Some: scaffold only the missing anchors and their dependencies. Leave the
  anchors that exist untouched.

**Confirm before writing into a non-empty project.** If the project already has
content but lacks the scene kit or the presentation index, tell the user the exact
target directory you will scaffold into and what you will add, and continue only
after they confirm. Heuristic detection can guess wrong; the user must be able to
catch it before anything is written.

To scaffold, copy from `templates/bootstrap/` (resolved from this skill's
directory) into the target: `package.json`, `package-lock.json`, the tsconfigs,
`eslint.config.js`, `vite.config.ts`, `index.html`, `.gitignore`, `src/` (router,
landing page, `presentation-kit/`, `presentations/index.ts`), and `scripts/`
(`verify.mjs`, `inspect-presentation.mjs`, `lib/`, `verify.config.json`). When adding
only missing anchors to an existing project, copy just those files and merge
dependencies and scripts into the existing `package.json` rather than replacing it.

**Never assume dependencies are installed.** The scaffold must provide, and you must
install (`npm ci` from the copied lock file, or `npm install` after merging):

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`
- Build and dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`, the ESLint stack (`eslint`, `@eslint/js`,
  `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
  `globals`) and `playwright` for rendering
- After installing, make sure a Chromium for Playwright is available
  (`npx playwright install chromium`).

The scaffold is **style-neutral**. Do not add Tailwind, another styling framework,
a CSS theme, default colors, fonts, card or button styles. Add a styling system only
when the host project already uses one or the user explicitly asks for it.

The template's `scripts/verify.config.json` describes the placeholder `example`
presentation, which stays registered: never remove or rewrite an existing
presentation, including the placeholder. Each time you create a presentation, add
its outline (slug, title, and each step's era, title and caption) to that file so
`npm run verify` checks it too: change the file to
`{ "presentations": [ <existing outline>, <new outline> ] }`. When you modify a
presentation's slug, title or steps, update only its own outline. Never change the
logic of the scripts.

### 3. Create or modify

**Create** a presentation as a self-contained folder under
`src/presentations/<slug>/`, starting from `templates/presentation/`:

- `entities.ts`: this presentation's `layoutId` namespace. Every entity id, and where
  it sits on the 880 × 380 canvas.
- `steps/*.ts(x)`: ordered `Step` objects (`id`, `era`, `title`, `caption`, `Scene`,
  `payload`, optional `groupKey`).
- `Scene.tsx`: the scene component. Steps that share `groupKey` and `Scene` keep one
  mounted instance and only `payload` changes, so entities morph in place.
- `Talk.tsx`: `<Presentation steps={STEPS} title="…" initialMode="browse" />`.
- `styles.css`: the presentation's own look, plain CSS.

Register it with **one explicit line** in `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<slug>/Talk.tsx') }`), appended to the array.
Never replace or reorder existing entries: other presentations must stay intact and
reachable at their own routes (`/<slug>`).

**Modify** only the identified presentation (and its registry entry or verify outline
if its slug, title or steps changed). Make scoped edits.

#### The model to follow

- Each step has a stable `id`, a section/era label, a one-line presenter title, a
  paragraph browse caption, and the diagram state shown while it is active. Step
  numbers come from position; never number steps by hand.
- Give every entity a stable id and keep it across steps. A persisting entity changes
  position, size, label or emphasis in place. A newcomer is wrapped in `Appear`
  (enters after the morphs settle); a departing entity is removed from an
  `AnimatePresence` so it animates out. Do not wrap continuing entities in `Appear`.
- Keep one scene for a run of related steps, with entities accumulating rather than
  being rearranged, unless the story needs a new diagram.
- If the story intentionally overlaps or stacks entities, keep that composition and
  mark the subtree `data-presentation-allow-overlap` (see below) instead of
  spreading things out.

#### The kit (`src/presentation-kit/`)

The kit owns behavior and geometry only. It has **no colors, fonts, borders,
shadows, spacing scale, button or card styles, and no styling-framework
dependency**. Do not add any to it, and never edit the kit to style a presentation.

- `Presentation`, `Stage`, `usePresentationNav`, `useFitScale`, chrome (`Header`,
  `Footer`, `Toc`, `Attribution`), and the constants (canvas 880 × 380, easing and
  timing).
- Primitives `Box` (accepts `icon` as a Lucide component), `Label`, `Arrow`, `Frame`,
  `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`. Each takes a stable `id` and
  passes `className`, `style` and `data-*` through. For literal per-step coordinates,
  position with `style`, or use raw `motion` elements with a stable `layoutId`.
- Navigation: Right/Space/PageDown next, Left/PageUp previous, `P` toggles present and
  browse mode, horizontal swipe, progress dots, table-of-contents entries. It clamps
  at both ends and leaves keys to focused controls.
- Stable hooks for your CSS: `data-presentation-root`, `-header`, `-footer`,
  `-caption`, `-step-title`, `-toc`, `-toc-entry`, `-progress`, `-progress-dot`,
  `-nav-prev`, `-nav-next`, `-attribution`, `-stage`, `-canvas`, `-entity="<id>"`,
  `-node="<kind>"`. The chrome root carries `data-step-count`, `data-step-index` and
  `data-presentation-mode`. The active progress dot and table-of-contents entry carry
  `aria-current` and `data-presentation-active="true"`.

#### Styling

Plain CSS in the presentation folder is the default. Style the look there: palette,
typography, spacing, borders, shadows, node treatments. Always style:

- the **active** progress dot and table-of-contents entry so they are visibly
  distinct from inactive ones (`[data-presentation-active="true"]`), and
- the **attribution** (`[data-presentation-attribution]`, the default
  "made by and-scene" bottom-right link) so it is legible and intentional: a
  readable size, a color that suits the design, not the browser-default link look.

The top-left header slot is empty unless the host passes `brand`.

### 4. Self-verify, and fix before reporting

Before reporting success, run these in the presentation app's directory and fix every
failure yourself, then re-run:

1. `npm run build`. No type errors.
2. A first-step render check: the route renders its first step with no runtime or
   console errors.
3. Visual composition, with the project-local helper:
   `npm run inspect -- <slug>` (settled screenshots in `inspection/<slug>/step-NN.png`,
   advisory warnings on stdout). View the **first step, the last step, and any dense
   or key steps**; for responsive-sensitive presentations also run
   `npm run inspect -- <slug> --viewport 390x844` and view that. Prefer this helper
   over ad hoc scripts. If you must write a temporary Playwright script, put it under
   the project root so it resolves local dependencies.
   Check that: important content fits the fixed canvas; intentional overlaps stay
   readable; nothing collides with chrome (caption, progress, table of contents,
   navigation, attribution); the active step is visibly distinct; the attribution is
   legible.
4. Review every warning the helper printed (`WARN [overlap]`, `WARN [active-nav]`,
   `WARN [attribution]`): open the referenced step, fix accidental collisions,
   indistinct active chrome and unpolished attribution in the presentation's CSS or
   layout, and mark **only** genuinely intentional, readable overlaps with
   `data-presentation-allow-overlap` on the smallest subtree that needs it. Re-run the
   helper after fixing. Warnings are advisory: report any that remain, and why.
5. `npm run verify` when the project has it: build, then every step of the registered
   sample in a real browser.

If the build, a render check or the visual check fails, fix it and check again. Never
report success while a check is failing. In your final report, state which checks you
ran and their results, and any remaining advisory warnings.
