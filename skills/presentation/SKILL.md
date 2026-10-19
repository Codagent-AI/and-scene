---
name: presentation
description: Create or modify a browser presentation built as one evolving diagrammatic scene. Use when the user asks to make, build, add, or change a presentation, slide deck, or step-by-step visual explainer that runs in the browser, including adding steps, entities, or styling to an existing presentation.
---

# Presentation

A presentation is one evolving scene rendered through an ordered list of named
steps. "Presentation" is the only artifact term. `Talk.tsx` is just the entry
filename inside a presentation folder, not a separate concept, and there is no
separate talk registry, workflow, or runtime contract.

Paths in this procedure are written relative to the directory containing this
file (call it `<skill-dir>`). Resolve `<skill-dir>/templates/...` from that
location. Never rely on the current working directory to find templates.

## Step 1: Gather

Gather only what is missing. If the prompt already names the topic, the visual
style, and the content and visual description of every step, skip the questions
and go to Step 2.

Otherwise ask one question at a time, in this order, and wait for each answer:

1. **Topic**: what the presentation explains and who it is for.
2. **Visual style**: the look and feel (palette, density, mood, any existing
   brand). Ask before choosing one. Do not invent a style the user can still
   supply.
3. **Per-step content**: for each step, the one-line title and the paragraph
   caption.
4. **Per-step visual description**: for each step, what the diagram shows, which
   entities appear, and which entities persist from the previous step.

Rules for gathering:

- Ask before inventing. Do not fill in steps, labels, or visual details the user
  has not given while they are still supplying them.
- The user controls depth. If the user chooses to build with partial detail,
  build from what was captured. Do not block on a completeness gate, and do not
  require a full outline or full step list.
- Iterate later. Partial output is acceptable; after building, the user can
  add steps, entities, or style in a later modify pass.
- ASCII mockups are optional and selective. Draw one only for a key or complex
  step when it helps the user confirm the intended layout before building. Do
  not draw a mockup for every step, and do not treat mockups as a required gate.

## Step 2: Preflight (create and modify)

Run this step before any create or modify work. Modify requests run it too.

### 2a. Detect the three contract anchors

Detect the anchors by contract, not by byte identity. Ignore cosmetic
differences such as file naming, formatting, comments, or extra dependencies.
Do not use snapshot or file-hash comparison as detection.

1. **Build setup**: a `package.json` with a `build` script, plus Vite and
   TypeScript configuration (a Vite config file and a `tsconfig` that compiles
   the app).
2. **Scene kit**: a kit directory (conventionally `src/presentation-kit/`) that
   exports the Step/Scene contract (`Step`, `Scene`, `SceneProps`), a
   Stage/Presentation host, present/browse navigation, the chrome (captions,
   progress, table of contents), and a fit-scale fixed canvas.
3. **Presentation index**: a registry module (conventionally
   `src/presentations/index.ts`) that maps each presentation slug to its own
   route through an explicit list.

Record which anchors are present. Then choose one branch:

- **All three present**: skip scaffolding. Go to Step 3.
- **Some present**: scaffold only the missing anchors (see 2c). Do not touch the
  present ones.
- **None present**: full scaffold (see 2c).

### 2b. Resolve the target location

Resolve where the app belongs before writing anything. Check in this order:

1. **Already inside a presentation app**: if the current project (or the
   presentation app the user points to) already has the anchors, use it. Scaffold
   only missing anchors.
2. **Empty or standalone project**: no workspace signals. Scaffold the app at the
   repository root.
3. **Monorepo**: any of these signals means monorepo: `workspaces` in the root
   `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout.
   Scaffold a self-contained app under `presentations/`. Do not write
   scaffold files into the monorepo root, do not consume or replace root anchors
   as app-local infrastructure, and preserve all unrelated root content.

**Confirmation gate.** A directory is non-empty when it contains project files
beyond a `.git` directory or dotfiles. If the directory is non-empty and lacks
the scene kit or the presentation index (including a fully unscaffolded
non-empty project and a partial monorepo):

- State the resolved target path, and which anchors are missing.
- Stop and wait for explicit user confirmation before writing or installing
  anything.

The automatic scaffold in 2c applies only to empty or standalone targets where
the user has not been asked to confirm. It never silently exempts a non-empty
project.

### 2c. Scaffold the missing anchors

Templates come from `<skill-dir>/templates/bootstrap/`, the full app scaffold:
`package.json`, `package-lock.json`, configs, `index.html`, `src/main.tsx`,
`src/Root.tsx`, `src/Landing.tsx`, `src/router.ts`, `src/presentations/index.ts`,
`src/presentation-kit/**`, `scripts/verify.mjs`, and
`scripts/inspect-presentation.mjs`.

Rules that apply to every scaffold write:

- **Never overwrite an existing file.** Copy a bootstrap file only when its
  destination is absent. If an anchor is partly present, copy only the files that
  belong to the missing anchors.
- **Merge `package.json`; never replace it.** Add only the dependencies and
  scripts the project lacks. Keep existing versions, scripts, and fields.
- **Do not assume the dependencies are installed.** After any scaffold write,
  install the full required set:
  - Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
  - Build and dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
    `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright`.
  - Then install the Chromium browser for Playwright with
    `npx playwright install chromium`.
  Use `npm install` for the merged dependency set. The bootstrap lockfile is the
  reproducible base when the target has no lockfile of its own.
- **No styling framework.** The scaffold is styling-framework-neutral. Do not add
  Tailwind, a Tailwind Vite plugin, a default CSS theme, default colors, default
  fonts, card styles, or button styles. Add a styling framework only if the host
  already uses one or the user explicitly asks for it.
- **Order.** Scaffold and install before generating any presentation files. The
  presentation is created only after the build setup, scene kit, and registry
  exist and dependencies are installed.

## Step 3: Generate or modify

### Create a new presentation

1. Choose a unique slug (kebab-case). Create a new folder
   `src/presentations/<slug>/` (under `presentations/<app>/` in a monorepo).
2. Write the presentation files from `<skill-dir>/templates/presentation/`:
   - `entities.ts`: the presentation's own `layoutId` namespace. Every stable
     entity id is defined once here, with a prefix unique to the presentation,
     so layout identity cannot collide with another presentation.
   - `steps/`: one Step object per step. Each step has a stable unique `id`, an
     `era` label, a one-line `title`, a paragraph `caption`, a `Scene`, and a
     `payload` describing the diagram state for that step. Steps are ordered by
     array position; do not hard-code step numbers.
   - `Talk.tsx`: the entry that renders `<Presentation steps={...} title="..."
     initialMode="browse" />` and imports the presentation's stylesheet.
   - `styles.css`: plain CSS owned by this presentation. This is the default
     styling approach.
3. Build a grouped scene where the steps share one picture. Adjacent steps that
   share both the same `groupKey` and the same `Scene` keep one scene instance,
   and only `payload` changes. Use this for an accumulating diagram.
   - Keep entity `layoutId`s stable across steps so a continuing entity morphs
     in place instead of re-entering.
   - Give an `Appear` (enter) treatment only to newcomers. Continuing entities
     must not be faded again.
   - Keep intentional overlap or stacking, with authored positions unchanged.
     Do not flatten or respace overlapping entities to make them clean.
   - Use a different `groupKey` (or a different `Scene`) only when the picture
     really changes. Such a change takes the presence-transition path.
4. Register the presentation by adding exactly one line to the explicit list in
   `src/presentations/index.ts`, of the form
   `{ slug, title, load: () => import('./<slug>/Talk') }`. Keep every existing
   entry and line unchanged. The registry is explicit: do not switch to
   auto-discovery.
5. Do not change, move, or overwrite any other existing presentation file.

### Styling (presentation-owned)

- Put the look in the presentation's own `styles.css`, or in the host's
  `index.css` for host-wide styling. Never put visual defaults in the reusable
  scene kit.
- Plain CSS is the default. Use another styling system only when the host
  already uses it or the user explicitly requests it.
- Make the active table-of-contents entry and the active progress control
  visibly distinct from inactive ones. Target the state the kit exposes:
  `[data-presentation-active]` and `[aria-current]`. A selector without a
  distinguishing declaration does not count. Use a distinct color, weight,
  border, or background that is clearly visible.
- Style the attribution control through `[data-presentation-attribution]` so it
  is legible: font size of at least 11 px, not the browser-default link color,
  not the default serif font, and placed in the bottom-right area.
- Keep the kit's geometry and motion behavior untouched. Presentation CSS
  controls colors, typography, spacing, and component treatments.

### Modify an existing presentation

1. Run the Step 2 preflight first. Modify runs it too, including the skip rule
   when all anchors are present and the confirmation gate for non-empty projects.
2. Identify the target. If the request does not clearly name one presentation,
   list the presentations in `src/presentations/index.ts` (slug and title), ask
   which one to change, and wait. Change nothing before the user answers.
3. Once the target is identified, ask only about the requested changes (steps,
   entities, or style). Do not restart the create interview or re-gather the
   topic, visual style, or every step.
4. Edit that presentation in place: its `steps/`, `entities.ts`, `styles.css`,
   or `Talk.tsx` as needed. Keep stable ids and layoutIds for entities that
   persist. Do not replace unrelated presentation files or other registry entries.
5. Then run Step 4 on the modified route.

## Step 4: Self-verify before reporting done

Do not report success until every check below passes. Fix each failure, then
re-run the failing check. Never report success while any check fails.

1. **Build.** Run `npm run build` (`tsc -b && vite build`). It must exit zero with
   no type errors.
2. **Full verification gate.** Run `npm run verify`. This is the completion gate.
   It builds the app, checks the reference sample, and renders the sample in a
   real browser over production preview. Then confirm the generated route too:
   open `http://127.0.0.1:<port>/<slug>` on the preview and render its first step
   with no console or runtime errors. Use the project-local helper where it covers
   this; if it does not report console or runtime errors, write a temporary
   Playwright check under the project root, run it, and delete it. Never write a
   browser script outside the project tree.
3. **Visual composition.** Run the project-local helper, which is preferred over
   ad hoc scripts:
   - `npm run inspect -- <slug>` for the desktop capture (1440 × 900).
   - `npm run inspect -- <slug> --narrow` for a narrow capture (390 × 844) when the
     presentation is responsive-sensitive.
   The helper captures settled screenshots of every step of the route into
   `.inspection/<slug>/step-NN.png`, a project-local, gitignored directory. Its
   warnings are advisory and printed as lines that name the step and elements.
   A crash, missing route, or failed capture makes it exit non-zero, and that is
   a failure.
4. **Inspect the screenshots.** View at least the first step, the last step, and
   every dense or key step. For a responsive-sensitive presentation, also view the
   narrow capture. Check each image for:
   - Important scene content fits inside the fixed 880 × 380 canvas.
   - Intentional overlaps stay readable, with the text of each overlapping entity
     still legible.
   - Nothing collides with captions, progress controls, the table of contents, or
     navigation controls.
5. **Review every WARN line.** For each advisory line, look at the referenced step
   and element, then decide:
   - An accidental text or chrome collision: fix the layout or spacing.
   - Indistinct current-step chrome (active progress or ToC) or unpolished
     attribution: fix the presentation's own CSS (`styles.css` or host
     `index.css`).
   - A genuinely intentional, readable overlap: mark only that subtree with the
     attribute `data-presentation-allow-overlap` on the subtree root. Mark the
     smallest subtree that holds the intentional overlap. Never add it to the whole
     presentation or the whole scene as a blanket fix, and never suppress a
     warning you have not reviewed.
6. **Re-run inspection after fixes.** Re-run `npm run inspect -- <slug>` (and
   `--narrow` if used), re-inspect the affected screenshots, and re-run
   `npm run build` and `npm run verify`.

Final report. State each check's real outcome: build (pass or fail), verify (pass
or fail, with the phase that failed), generated-route first-step render (pass or
fail), and the visual review (which steps were inspected, and whether any
advisory warnings remain and why each is acceptable). Do not claim a check that
you did not run.

## Quality bar

A generated or modified presentation is done only when all of these hold:

- It builds with no type errors (`npm run build` exits zero).
- Its first step renders with no runtime or console errors.
- Every step shows a caption, and the user can move to the next and previous
  steps.
- The visual composition check passed on the first, last, dense or key, and (for
  responsive-sensitive presentations) narrow steps.
- It conforms to the evolving-scene model: ordered steps with stable ids, one
  shared scene per group, stable entity layoutIds, newcomer-only entry, continuing
  entities that are not refaded, intentional overlap preserved, and styling owned
  by the presentation.
