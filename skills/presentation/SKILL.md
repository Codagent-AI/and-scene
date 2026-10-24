---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagram (stable entities that appear, move, connect and re-label across named steps) from a topic. Use when asked to make, build, create, update, change or fix a presentation, talk, or evolving-scene deck. Self-bootstraps the Vite + React + TypeScript app, the scene kit and the presentation index, then builds, renders and visually checks the result.
---

# Presentation

A presentation is **one scene moving through named steps**, not a deck of slides. Entities have
stable ids; between steps they morph in place, new ones fade in after the others settle, and
departing ones fade out. "Presentation" is the canonical term ("talk" is only a synonym; the entry
file is `Talk.tsx`).

## 0. Where things are

`SKILL_DIR` is the directory that contains this `SKILL.md`. Resolve it to an absolute path first
and use it for everything below. Never look for templates relative to the current working
directory.

- `SKILL_DIR/templates/bootstrap/`: the full app (build setup, scene kit, presentation index,
  starter presentation, `verify`/`inspect` scripts, committed lockfile).
- `SKILL_DIR/templates/presentation/`: the files of one new presentation (`entities.ts`,
  `Scene.tsx`, `steps.ts`, `Talk.tsx`, `style.css`).
- `SKILL_DIR/scripts/presentation-tool.mjs`: deterministic helper (`detect`, `scaffold`, `new`).
  Run it as `node "$SKILL_DIR/scripts/presentation-tool.mjs" <command>`; it finds the templates
  from its own location, so it works from any directory.

Every request, whether it **creates** or **modifies** a presentation, goes through section 2
(infrastructure) before any presentation file is written.

## 1. Gather the details (create only)

Ask clarifying questions **one at a time** (never a list of questions in one message) until you have:

1. the **topic**,
2. the **visual style** (mood, palette, typography, density),
3. for each step, its **content** and its **visual description** (which entities appear, move,
   connect or change).

Rules:

- Ask for anything missing from the prompt; do not invent an answer the user can still give.
- The user decides how much detail to give. If they choose to build with partial detail, build
  from what you have and iterate afterwards. There is no completeness gate and no mandatory
  re-interview. Mark gaps you filled in your final summary.
- If the prompt already contains the topic, the style and every step's details, skip the
  questions and build.
- For a key or visually complex step you may draw an ASCII mockup and ask the user to confirm the
  layout before building. This is optional and selective: never mock up every step.

## 2. Ensure the infrastructure (create and modify)

A generated presentation depends on three **contract anchors** in one app directory. Detection is
by contract, not by byte-identical files: renamed files, formatting and extra dependencies do not
count as missing.

1. **Build setup**: a `package.json` with a `build` script that runs a Vite + React + TypeScript
   build (`react`, `react-dom`, `vite`, `typescript`), a Vite config and tsconfig files.
2. **Scene kit**: the presentation-agnostic engine: the `Step`/`Scene` step contract
   (`Step`, `SceneProps`), a stage/host that mounts the active step and runs entity morphs
   (`Stage`, `Presentation`), present/browse navigation (`use…Nav`), the chrome (caption, table of
   contents, progress, prev/next) and the fit-scaled design canvas (`use…Fit…`).
3. **Presentation index**: a registry mapping each presentation to its own route (entries with
   `slug`, `title`, `load`), plus the router that reads `location.pathname` and loads the matching
   entry.

Procedure:

1. **Detect and resolve the target.** Run
   `node "$SKILL_DIR/scripts/presentation-tool.mjs" detect <project root>`. It reports `target`,
   `reason`, `anchors`, `missing`, `empty` and `needsConfirmation`. Target rules:
   - already inside a presentation app (all anchors at the root, or an existing app in
     `presentations/`): use it;
   - **monorepo** (any one of `workspaces` in `package.json`, `pnpm-workspace.yaml`, a `packages/`
     or `apps/` directory): scaffold a self-contained app in `presentations/` and leave the
     monorepo root untouched. Say which signal you used;
   - empty or standalone project: scaffold at the repository root.
2. **Confirm before writing into a non-empty project.** When `needsConfirmation` is true (the
   project is non-empty and scaffold files will be written), tell the user the resolved target and
   what will be added, and wait for their confirmation before copying or installing anything. No
   confirmation is needed for an empty directory, or when all three anchors are present and only
   presentation files are written.
3. **Scaffold only what is missing.** Run
   `node "$SKILL_DIR/scripts/presentation-tool.mjs" scaffold <target> --only <missing anchors, comma separated> --install`.
   - Empty directory or none of the anchors present: scaffold all three, then install.
   - All anchors present: skip scaffolding entirely and go to section 3 or 4.
   - Partial scaffold: scaffold only the missing anchors. Existing files are **never**
     overwritten; `package.json` only gains missing dependencies and scripts; an existing lockfile,
     Vite config or registry is kept as it is. If an existing anchor lives at different paths
     than the starter files assume, adapt the new files' imports instead of replacing the anchor.
   - If the app already has a `src/main.tsx`, the helper keeps it and mounts its `<App />` as the
     router's `fallback`; if it reports `manual`, mount `<Router />` from `src/Router.tsx` yourself
     so `/<slug>` routes load.
   - Do not assume any dependency is installed. The scaffold declares React, Vite, TypeScript,
     the `@types/*` packages, Motion, Lucide icons, ESLint and Playwright; `--install` runs
     `npm ci` (new lockfile) or `npm install`. If Chromium is missing, run
     `npx playwright install chromium`.
4. The scaffold is **style-neutral**: no Tailwind or other styling framework, no theme, colors,
   fonts, spacing scale, card or button styles. Do not add any styling framework unless the host
   project already uses one or the user explicitly asks for it.

## 3. Create a presentation

1. Pick a slug (lowercase words joined by hyphens) and a title.
2. `node "$SKILL_DIR/scripts/presentation-tool.mjs" new <target> <slug> --title "<title>"` writes
   a `<slug>/` folder from the template next to the presentation registry (its own folder, route
   `/<slug>`, kit imports resolved relative to the detected scene kit) and appends one entry to that
   registry. It refuses to overwrite an existing folder or slug, and
   it leaves every other presentation and registry entry as they are.
3. Replace the template content with the real presentation:
   - `entities.ts`: this presentation's entity namespace: stable ids, the step each first appears in,
     and geometry in the 880 × 380 design canvas.
   - `Scene.tsx`: one scene composed from the kit primitives (`Box`, `Label`, `Arrow`, `Frame`,
     `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`). Raw `motion` elements with a stable
     `layoutId` are fine for coordinate-heavy diagrams. Glyphs are Lucide components
     (`icon={User}`); no custom SVG authoring is required.
   - `steps.ts`: an ordered `Step[]`. Every step has a stable `id`, an `era` (table-of-contents
     section), a one-line `title`, a paragraph `caption` and a `Scene` + `payload`. Steps that are
     successive states of the same diagram share `groupKey` and the same `Scene`, so the scene
     persists and only the payload changes. Step numbers come from position; never number steps by
     hand.
   - `Talk.tsx`: `<Presentation steps={STEPS} title="…" initialMode="browse" />`.
4. Design rules for the scene: entities that continue keep their id and morph in place (do not
   re-create them with new ids); wrap only newcomers in `Appear`; keep every entity inside the
   canvas and clear of the chrome (caption, progress, table of contents, navigation); overlapping
   or stacked entities are fine when intentional and readable.
5. **Styling belongs to the presentation.** Put the look in `src/presentations/<slug>/style.css`
   (plain CSS by default), targeting the kit's `data-presentation-*` hooks. Never edit
   `src/presentation-kit/` to add colors, fonts, borders or other visual defaults. The CSS must
   also: make the active progress dot and active table-of-contents entry visibly different from
   inactive ones (`[data-presentation-active]`), and make the attribution link
   (`[data-presentation-attribution]`) legible: sized, colored and not browser-default. Style
   responsively when the layout depends on width.
6. Add the presentation's outline (`slug`, `title`, and each step's `era`, `title`, `caption`) to
   `verify.config.json` so `npm run verify` renders it.

## 4. Modify a presentation

1. Identify the target. If the request does not clearly name one presentation, **list the
   presentations in `src/presentations/index.ts` and ask which to modify before changing
   anything**. Never silently pick one (including the first or the sample).
2. Ask only about the requested change (steps, entities or style). Do not repeat the create
   interview and do not touch other presentations.
3. Edit that presentation's files (and its `verify.config.json` outline if titles or captions
   changed). Keep continuing entities' ids so they still morph.
4. Run section 5 in full.

## 5. Self-verify before reporting success

Do all of these, in order, for the presentation you created or modified. Do not report success
while any of them fails.

1. **Build:** `npm run build` (no type errors).
2. **Render the target route:** open `/<slug>` in a real browser and confirm its first step renders
   with no runtime, console or page errors. `npm run inspect -- <slug>` does this for every step
   and exits non-zero on errors. `npm run verify` is not a substitute: it only renders the
   presentations listed in `verify.config.json`. In a host that has no such scripts, write a
   temporary Playwright script **inside the project root** (so it resolves the project's own
   dependencies), run it, and delete it.
3. **Visual composition:** use the project-local helper `npm run inspect -- <slug> --narrow`
   (screenshots under `.inspection/<slug>/`, settled after the transitions) when it exists.
   Only if it is unavailable use an equivalent browser view, again from a script inside the
   project root. Look at the screenshots of the **first step, the last step, and every dense or
   key step**, and also the **narrow viewport** whenever the layout is responsive-sensitive.
   Check that important content fits the canvas, intentional overlaps stay readable, and nothing
   collides with the caption, progress dots, table of contents or navigation controls.
4. **Warnings:** read every `WARN` line the helper prints. Open the step it names, then fix
   accidental collisions, indistinct active progress/ToC styling and unpolished attribution
   (style `[data-presentation-active]` / `[data-presentation-attribution]` in the presentation's
   CSS). Mark a subtree with `data-presentation-allow-overlap` **only** when the overlap is
   intentional and readable, and mark only that subtree, never a whole scene. Rerun the helper
   and re-inspect. A warning count of zero is not visual approval.
5. **Final gate:** where the scaffolded scripts exist (`npm run verify` in the project's
   `package.json`), run `npm run verify` (it builds the whole app and renders every presentation
   listed in `verify.config.json`, failing on any console or page error). A host app that has no
   such script is not required to gain one: its completion gate is steps 1-4 (build, error-free
   first-step render of the target route, visual check) using equivalent commands.
6. If any check fails, fix the cause and repeat the checks that could be affected, including the
   visual ones. Rerunning only the build after a visual fault is not enough.

Finish with a short summary: the route, the files changed, the checks you ran, the advisory
warnings that remain and why they are acceptable, and any detail you filled in on the user's
behalf.
