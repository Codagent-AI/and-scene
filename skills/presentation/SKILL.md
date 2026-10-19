---
name: presentation
description: Create or modify a browser presentation modeled as one evolving diagrammatic scene (stable entities that move, connect and re-label across steps). Use when the user wants a presentation, talk, deck or explainer built from a topic. Gathers details one question at a time, scaffolds the React/Vite scene kit if the project lacks it, generates and registers the presentation, and verifies build, render and visual composition before reporting done.
---

# Presentation skill

Build a presentation as **one evolving scene**: a set of named entities that appear, move, connect and
re-label as the explanation develops. It is not a deck of unrelated slides. Entities accumulate and keep
their identity (and normally their position) from step to step.

All paths below named `templates/...`, `scripts/...` and `reference/...` are relative to **the directory
that contains this SKILL.md**, never to the current working directory. Resolve that directory first and
build absolute paths from it (call it `$SKILL`). Never write `./templates/...` and expect the cwd to hold it.

Reference material (read when you need it):
- `reference/kit-api.md`: the scene kit API, step contract, hooks and data attributes.
- `reference/quality-bar.md`: composition and styling checklist used in the verify stage.

## 1. Gather requirements

Ask the user **one question at a time**. Wait for the answer before asking the next. Do not assume anything
the user can still tell you. Collect, in this order, skipping what the prompt already answers:

1. **Topic**: what the presentation explains and for whom.
2. **Visual style**: look and feel, palette, typography, mood (the presentation will own this; see Styling).
3. **Per-step content and visual**: for each step, what is said and what the diagram shows or changes.
   Ask for steps one at a time, then ask whether there are more.

Rules:
- **Complete prompt**: if the prompt already gives the topic, style and every step's content and visual,
  you may build without asking further questions.
- **Missing details**: ask for the missing items (topic, style, step descriptions), one question each.
- **Partial detail**: the user decides how much to specify. If they choose to build now with only some
  details, build from what was captured, do not impose a completeness gate, and tell them they can
  iterate afterwards. Fill remaining gaps with sensible, clearly-reported choices only after the user opted in.
- **ASCII mockups are optional.** For a key or visually complex step you may draw an ASCII mockup and ask
  the user to confirm the layout before building. Do not draw one for every step.

For a **modify** request, do not replay this section; go to "Modify an existing presentation".

## 2. Resolve the target and scaffold what is missing

A presentation depends on three **contract anchors**. Detect them by what they provide, not by exact
file contents, so cosmetic differences (file names, formatting, extra dependencies, a different app name)
never trigger re-scaffolding. An empty directory that merely has the right name does not count.

1. **Build setup**: a Vite + React + TypeScript app whose `package.json` has a working `npm run build`
   (Vite config, `tsconfig.json`, and `react`, `vite`, `typescript` dependencies).
2. **Scene kit**: the reusable engine at `src/presentation-kit/`: the `Step`/`SceneProps` step contract,
   the `Stage` host that mounts the active step and runs entity morphs, present/browse navigation
   (`usePresentationNav`), chrome (captions, table of contents), and the fit-scale canvas (`useFitScale`).
3. **Presentation index**: the registry at `src/presentations/index.ts` that maps each presentation
   (`slug`, `title`, `load`) to its own route, so several presentations coexist.

Optional helper: `node "$SKILL/scripts/detect-scaffold.mjs" <dir>` prints the anchors found, the resolved
target, what is missing, and whether confirmation is required (JSON). It encodes exactly the rules below;
you may instead apply the rules by hand. `--apply --confirmed` runs the copy/merge in "Scaffold" below.

### Choose the target location

Apply in this order (the first match wins):

1. **Empty directory**: scaffold at the directory root. No confirmation needed.
2. **Already inside a presentation app** (the working directory or an ancestor, or a `presentations/` child
   of one, already has the scene kit or presentation index): reuse that app. Scaffold only the anchors
   that are missing.
3. **Monorepo**: any of `workspaces` in the root `package.json`, a `pnpm-workspace.yaml`, or a `packages/`
   or `apps/` directory. Scaffold a **self-contained app in `presentations/`** at the monorepo root
   (its own `package.json`, build, kit and index; the index is then `presentations/src/presentations/index.ts`).
   Do not modify the monorepo root's package or workspace configuration.
4. **Standalone project** (non-empty, no monorepo signals): scaffold at the project root.

In every case the presentation index lives at `src/presentations/index.ts` **inside the app**
(project root for standalone, `presentations/` for a monorepo).

### Confirm before writing

- If the directory is **non-empty** and any scaffold files will be written (zero, one or two anchors
  missing, whether partial or none present), **state the resolved target path and what will be added,
  then wait for the user to confirm** before writing anything. If they decline, ask where to scaffold.
- Only an empty directory is scaffolded without confirmation.
- If all three anchors are present, skip scaffolding entirely and go to step 3; nothing is rewritten.

### Scaffold

Source: `$SKILL/templates/bootstrap/` (a complete, framework-free Vite + React + TypeScript app with the
scene kit, a router, the registry with one unstyled `starter` presentation, `scripts/verify.mjs`,
`scripts/inspect-presentation.mjs`, and a committed `package-lock.json`).

- **Full scaffold** (nothing present): copy the whole bootstrap tree to the target. Keep the starter
  presentation or replace it with the new one.
- **Partial scaffold**: copy only the files for the missing anchors and leave present ones untouched
  (never overwrite). Build setup = package/config files and `scripts/`; scene kit = `src/presentation-kit/`;
  index = `src/presentations/`, `src/main.tsx`, `src/Root.tsx`, `src/route.ts`, `src/Landing.tsx`,
  `src/index.css`. In an existing `package.json` merge in only the missing scripts and dependencies; do not
  change versions or scripts that already exist. If an existing `main.tsx` does not route through the
  registry, wire the registry in by hand instead of replacing the file.
- **Never assume dependencies are installed.** After scaffolding, install the **complete** dependency set
  with npm (`npm ci` when the bootstrap lock file was copied, otherwise `npm install`) in the app
  directory: runtime `react`, `react-dom`, `motion`, `lucide-react`; build/dev `vite`,
  `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack,
  and `playwright` (for render checks). Install before creating the presentation.
- For browser checks, Chromium must be available to Playwright (`npx playwright install chromium` if needed).
- The scaffold is **styling-framework-neutral**: no Tailwind, theme tokens, default colors, fonts, card or
  button styles. Do not add a CSS framework unless the host project already uses one or the user asks for it.

## 3. Create a new presentation

Each presentation is a self-contained folder `src/presentations/<slug>/` (inside the app) with its own route:

- `entities.ts`: the stable entity ids, prefixed with the slug, used as the `layoutId` namespace.
- `steps/`: the `Scene` component(s) and the `STEPS` array (one `Step` per step: id, era, title, caption, Scene).
- `Talk.tsx`: `export default function Talk()` rendering `<Presentation steps={STEPS} title="..." initialMode="browse" />`.
- `styles.css` (or other presentation-local CSS): all of the visual design.

Start from `$SKILL/templates/presentation/` (replace `__SLUG__` and `__TITLE__`), then:

1. Pick a unique kebab-case slug (not already in the registry).
2. Model the topic as one scene: decide the entities, then per step what appears, moves or is emphasized.
   Give every direct child of `<SceneLayer>` a `key` equal to its entity id (no fragments), or the console
   reports duplicate keys and verification fails. Steps in one group share `groupKey` and the same `Scene`, so the scene persists and entities morph in place.
3. Write a **title and a caption for every step**.
4. **Register** it by adding exactly one entry to `src/presentations/index.ts`
   (`{ slug, title, load: () => import('./<slug>/Talk') }`). Do not edit other presentations' folders or
   entries; existing presentations stay intact and reachable.
5. Style it in presentation-owned plain CSS (see Styling).

Details of the kit API are in `reference/kit-api.md`; read it before writing scenes.

## 4. Modify an existing presentation

1. **Identify the target first.** If the user did not name one, or the name is ambiguous, list the
   registered presentations (slug and title) from the index and ask which one before changing anything.
2. Once identified, ask **only about the requested changes** (steps, entities or style). Do not re-walk
   the full create flow and do not ask about things that are not changing.
3. Edit only that presentation's folder (and its registry title if asked). Leave other presentations alone.
4. Then run the verify stage.

## 5. Styling

The kit ships **no visual styles** and exposes stable `data-presentation-*` hooks. The designed look
belongs to the presentation (or the host app): write **plain CSS** in the presentation folder, scoped
to that presentation, unless the host project already uses a styling framework or the user explicitly asks
for one. Never add colors, fonts, borders, shadows or theme tokens to `src/presentation-kit/`.

Make chrome legible and distinct in your CSS: the active progress dot, table-of-contents entry and
navigation state must look different from inactive ones (use `[data-presentation-active]` /
`aria-current="step"`), and the bottom-right attribution link (`[data-presentation-attribution]`) must be
legible: at least 12px, deliberately colored, not browser-default link styling.

## 6. Self-verify before reporting done

Do not report success until every check below passes. Fix the cause, then re-run the failed check.

**While iterating**, lighter checks are fine: `npm run build`, plus a single-route first-step render check.
**Before reporting completion** of any create or modify, run all of:

1. `npm run build` in the app directory. Fix every type or build error.
2. The project-local `npm run verify`. It builds, then renders every step of every registered presentation
   in Chromium and fails on console errors, page errors or steps that do not advance. If the project has
   **no** `verify` script (for example a hand-built app detected by contract), run the build plus a
   first-step render check using a small Playwright helper written **under the project root** (never in
   `/tmp` or outside the project, so Playwright resolves from local dependencies). Never expect or require
   the repository's own canonical sample in a user's project.
3. **Visual composition check** with the project-local helper:
   `npm run inspect -- <slug>` captures a settled screenshot of every step into `.inspection/<slug>/`
   (git-ignored) and prints advisory warnings. Look at the screenshots of the **first step, the last step,
   and every dense or key step**. For a presentation that is responsive-sensitive, also run
   `npm run inspect -- <slug> --narrow` and inspect at the narrow viewport. If `inspect` is not available,
   use the project's own settled-screenshot helper, written under the project root so Playwright resolves
   from the project's local dependencies. Screenshots must be taken only after the step's animations have
   settled (the helper waits a settle interval of a second or more; a fallback helper must do the same).
   Confirm: important scene content fits the fixed canvas; intentional overlaps are readable; nothing
   collides with the caption, progress dots, table of contents or navigation controls; active chrome is
   visibly distinct; attribution is legible.
4. **Review every warning** the helper prints, step by step. Fix accidental text collisions and
   indistinct active chrome or unpolished attribution (in the presentation's CSS or layout), then re-run
   and re-inspect. Mark an overlap as intentional with `data-presentation-allow-overlap` on the smallest
   element or group that is intentionally layered **and** actually readable. Never silence warnings
   wholesale (do not put the marker on the scene root or the whole layer to hide them).

If build, render or visual composition fails, fix and re-check; never describe a failing or unchecked
presentation as done. When reporting, say which checks ran and their results, and name the route
(`/<slug>`) and how to start it (`npm run dev`).

## 7. Quality bar

Every presentation you hand over must:
- build with no type errors (`npm run build`);
- render its first step with no runtime or console errors;
- show a caption on every step and support next and previous navigation;
- pass the visual composition check above;
- conform to the evolving-scene model: one persistent scene, stable entity ids, entities that morph rather
  than being redrawn, newcomers that appear, and a clear reason for every change between steps;
- keep its styling in presentation-owned files, and leave the kit and other presentations untouched.
