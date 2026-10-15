---
name: presentation
description: Create or modify a presentation (a diagrammatic, evolving-scene talk) as a React/Vite web app. Use when the user wants to make, build, generate, edit, or change a presentation, talk, deck, or slides from a topic. Gathers details interactively, self-bootstraps any missing scaffolding (build setup, scene kit, presentation index), generates the presentation, and self-verifies build, render, and visual composition before reporting done.
---

# presentation

Terminology: **presentation** is the canonical word. `Talk.tsx` is only the entry filename of a
presentation folder. A presentation is one diagrammatic scene that *evolves* through named steps
(entities appear, move, collapse, connect, re-label) — not a stack of unrelated slides.

All paths below that start with `templates/` or `scripts/` are relative to **the directory that
contains this `SKILL.md`** (call it `$SKILL`), never the caller's working directory. The helper
scripts resolve templates from their own location, so run them by absolute path:
`node $SKILL/scripts/detect-anchors.mjs [dir]` and `node $SKILL/scripts/scaffold.mjs`.

## 1. Gather

Ask the user clarifying questions **one at a time**, covering: the topic, the visual style, and for
each step its content and its visual description.

- Do not assume details the user can still provide. Ask for whatever is missing.
- The user controls depth. If they say to go ahead with partial detail, build from what you have —
  there is no hard completeness gate; they can iterate afterwards.
- If the prompt already contains topic, style, and all step details, proceed without questions.
- For a key or complex step you may draw an ASCII mockup to confirm the layout before building.
  Do not mock up every step.

When *modifying*: if the target presentation is missing or ambiguous, list the existing
presentations (the entries in `src/presentations/index.ts`) and ask which one, before changing
anything. Then ask only about the requested changes (steps, entities, or style).

## 2. Resolve the target and scaffold if needed

Run `node $SKILL/scripts/detect-anchors.mjs <project-dir>`. It reports the resolved `target`, the
three **contract anchors**, what is `missing`, and `needsConfirmation`. Detection is contract-level,
not byte-identical, so cosmetic differences or extra dependencies never trigger re-scaffolding:

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — the `Step`/`Scene` contract, stage/host (`Presentation`), present/browse
   navigation, chrome (captions, table of contents), and the fit-scale canvas (`src/presentation-kit/`).
3. **Presentation index** — the route registry (`src/presentations/index.ts`).

Target resolution:

- Empty directory or standalone (non-monorepo) project → scaffold at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) →
  a self-contained app under `presentations/`, not the repository root.
- Already inside a presentation app (anchors present) → use it; scaffold only the missing anchors
  and leave existing ones untouched.

Then:

- All three anchors present → skip scaffolding.
- Nothing present (empty dir or none of the anchors) → full scaffold with `node $SKILL/scripts/scaffold.mjs --target <target>`
  (copies `templates/bootstrap/`, which includes a registered `starter` presentation you may delete and
  unregister, or replace, once your own is added).
- Some anchors present → the same command copies **only** the missing ones and never overwrites files.
  If `package.json` already exists, merge the required dependency set into it yourself (see below).
- **Route wiring.** The scaffold report includes `routeWiring`. If `wired` is `false`, the app's existing
  entry (`entry`, usually `src/main.tsx`) was kept as-is and does not mount the registry, so
  `/<slug>` would render the old app, not the presentation. Make the smallest edit that keeps the existing
  app: resolve `resolveRoute(window.location.pathname, presentations)` (from `src/routes.ts`), render the
  matched presentation (lazy-load `entry.load`, wrapped in `RouteBoundary`) when `route.kind === 'presentation'`,
  and fall through to the existing app otherwise. `routeWiring.template` shows the wiring.
- **Non-empty project that lacks the scene kit or presentation index: state the target location you will
  scaffold into and wait for the user to confirm before writing anything.** Empty directories need no confirmation.

Never assume dependencies are installed. After scaffolding, install the full set (`npm ci` when the
lock data was copied, otherwise `npm install`), plus a browser for checks (`npx playwright install chromium`).
Required: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`,
`typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `globals`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`, `playwright`; scripts
`dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `verify`, `inspect`.

The scaffold is styling-framework-neutral with zero presentation styling defaults. Do not add Tailwind
or any CSS framework unless the host project already uses one or the user explicitly asks.

## 3. Generate / modify

**Create.** Write the presentation as its own folder `src/presentations/<slug>/`:

- `entities.ts` — stable entity ids (the `layoutId` namespace)
- `Diagram.tsx` (or similar) — the persistent scene built from kit nodes
- `steps/*.tsx` + `steps/index.ts` — one `Step` per file
- `Talk.tsx` — default export rendering `<Presentation steps={STEPS} title="…" />`
- `style.css` — presentation-owned plain CSS

`node $SKILL/scripts/scaffold.mjs --target <target> --presentation <slug> --title "<Title>"` creates this
folder from `templates/presentation/` (placeholders filled in). Then register it with **one line** in
`src/presentations/index.ts`:
`{ slug: '<slug>', title: '<Title>', load: () => import('./<slug>/Talk') },`.
Preserve every existing presentation; they must stay intact and reachable.

**Modify.** Identify the target (see Gather), ask only about the requested changes, and make scoped edits
to that presentation's folder. Do not re-walk the create flow.

**Evolving-scene model.** Give entities stable ids and reuse the same id across steps so they morph in
place. Adjacent steps that share `groupKey` and `Scene` keep one persistent scene instance; only `payload`
changes. Wrap newcomers in `<Appear>`. Render entities that come and go as direct children of `SceneLayer`
(or `Presence`) so removed ones animate out; nested inside a plain element they vanish instantly.
Every step has an `id`, `era`, `title`, and a `caption`.

**Styling ownership.** The scene kit ships no CSS, colors, fonts, borders, shadows, or theme tokens — never
add any to `src/presentation-kit/`. Presentations (or the host app) own colors, typography, spacing, and
component treatments. Use plain CSS in the presentation's `style.css` by default, targeting the kit's
`data-presentation-*` hooks. Make the active ToC entry / progress dot (`aria-current`,
`data-presentation-active="true"`) visibly distinct, and make the attribution link legible.

**Scene-kit cheat sheet** (full hook table: `templates/bootstrap/src/presentation-kit/README.md`):

- `<Presentation steps title initialMode brand attribution />`, types `Step<P>`, `Scene<P>`, `SceneProps<P>`
- Nodes: `Box` (`id`, `Icon`), `Label`, `Arrow` (`from`, `to`), `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `Presence`, `SceneLayer`
- Fixed 880×380 canvas, uniformly fit-scaled; position nodes absolutely in canvas units
- Hooks: `data-presentation-root` (with `data-step-count`, `data-step-index`), `-caption`, `-step-title`,
  `-prev`, `-next`, `-toc`, `-progress`, `-attribution`, `-node`, `-id`; `data-presentation-allow-overlap`
  marks an intentional readable overlap that inspection should skip

## 4. Self-verify (before reporting done)

Never report success on a failing check; fix and re-check. You may start lighter (build + a single-route
render) while iterating and reserve the full `npm run verify` for completion.

1. `npm run build` — no type errors. Also `npm run lint`.
2. Render: at minimum the first step renders with no runtime/console errors (open `/<slug>` and confirm
   `[data-presentation-root]` exists, not the host app's own page); `npm run verify` steps through every step.
3. Visual composition: run the project-local helper `npm run inspect -- <slug>` (screenshots land in
   `.inspect/<slug>/step-NN.png`, git-ignored; add `--narrow` for a narrow viewport). If the project has no
   helper, write a temporary Playwright script **under the project root** (never outside the tree) so
   browser tooling resolves from local dependencies; wait for animations to settle before capturing.
   Inspect the first step, the last step, and any dense/key steps; also a narrow viewport when the
   presentation is responsive-sensitive. Use `127.0.0.1`, not `localhost`.
4. Review **every** advisory warning. Fix accidental collisions, indistinct active chrome, and unpolished
   attribution through presentation-owned CSS. Mark only genuinely intentional readable overlaps with
   `data-presentation-allow-overlap`.

Quality bar for every presentation: builds with no type errors; first step renders without errors; a
caption on every step; next/previous navigation works; important content fits the canvas and does not
collide with chrome (captions, progress, ToC, navigation); and it conforms to the evolving-scene model
(stable entity ids, grouped scenes via shared `groupKey`).

## Examples

- **Standalone** (`~/talks/my-talk`, empty or plain Vite app): target = project root → `src/presentations/<slug>/`.
- **Monorepo** (`pnpm-workspace.yaml` at the root): target = `<repo>/presentations/` (own `package.json`,
  `npm ci` run there) → `<repo>/presentations/src/presentations/<slug>/`.
- **Inside an existing presentation app**: use it as-is; add the new folder and one registry line.

## Maintenance

`templates/bootstrap/src/presentation-kit/` and the aligned scripts (`scripts/verify.mjs`,
`scripts/inspect-presentation.mjs`, `scripts/preview-lib.mjs`, plus `src/main.tsx`, `Landing.tsx`, `RouteBoundary.tsx`, `routes.ts`)
are snapshots of the repository's canonical copies. Update the snapshot whenever those change; the drift
test (`npm test`) fails otherwise.
