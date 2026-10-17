---
name: presentation
description: Creates or modifies a browser presentation modeled as one evolving diagrammatic scene (stable entities that appear, move, connect and re-label across named steps). Interviews the user, scaffolds the Vite + React + TypeScript app and scene kit when missing, generates the presentation, and verifies it builds and renders. Use when asked to make, build, edit or change a presentation, talk, or evolving-diagram walkthrough.
---

# Presentation

A presentation is **one scene that evolves through ordered, named steps**, not a stack of
slides. Entities keep a stable identity from step to step, so they move, resize, re-label and
connect in place; entities that only exist in some steps enter and leave. "Talk" is an informal
synonym; the only place the word survives is each presentation's entry file, `Talk.tsx`.

This skill is hybrid: this file is the procedure and quality bar, and the scene kit, templates
and scripts keep every generated presentation consistent.

## Where things live

`<skill dir>` is the directory that contains this `SKILL.md`. Resolve every template and script
path from it, never from the current working directory.

- `<skill dir>/scripts/scaffold.mjs` - detects the target and anchors, scaffolds what is missing,
  and creates a presentation folder from the template.
- `<skill dir>/templates/bootstrap/` - the app, scene kit, registry, and verification scripts used
  only to bootstrap a project that lacks them.
- `<skill dir>/templates/presentation/` - the folder created for each new presentation.

## Procedure

Work through these steps in order. For a modification, follow "Modify an existing presentation"
in place of steps 1 and 3; step 2 still applies if anchors are missing, and step 4 always applies.

### 1. Gather (one question at a time)

Ask the user clarifying questions **one at a time**, never as a batch, and never assume a detail
the user can still provide. Cover, in this order:

1. the **topic**,
2. the **visual style** (mood, palette, typography direction, density),
3. for each step: its **content** (the point it makes) and its **visual description** (what is on
   screen and what changed since the previous step).

Skip questions the prompt already answers. If the prompt already contains the topic, the style and
all step details, you may build without asking anything further. The user decides how much to
specify: when they choose to build with partial detail, do so from what was captured. There is no
completeness gate; offer to iterate afterwards.

You may draw an ASCII mockup of a step to confirm its layout before building. Do this at your
discretion for steps whose layout is key or complex, not for every step.

### 2. Resolve the target and scaffold what is missing

Run `node <skill dir>/scripts/scaffold.mjs detect --dir <project dir>`. It reports the three
**contract anchors**; detection is by capability, not by file names or formatting, so cosmetic
differences never trigger re-scaffolding:

1. **Build setup** - a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** - the reusable engine: the `Step`/`Scene` contract, the stage that mounts the
   active step and runs entity morphs, present/browse navigation, chrome (captions, table of
   contents) and the fit-scaled canvas.
3. **Presentation index** - the registry that maps every presentation to its own route.

Target resolution:

- Already inside an app that has all three anchors: use it; scaffold nothing.
- Empty or standalone (non-monorepo) project: the app is scaffolded at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  directory; any one signal is enough): the app is scaffolded as its own self-contained app under
  `presentations/`, never at the monorepo root. An existing complete `presentations/` app is reused.

If anchors are missing:

- **Empty directory, or the project has none of the anchors:** scaffold everything.
- **Some anchors present:** scaffold only the missing ones. Existing files are never overwritten
  and existing anchors are left as they are.
- **Non-empty project (whichever anchor is missing):** state the resolved target path to the user
  and wait for their confirmation before writing anything. Empty directories and fully scaffolded
  projects need no confirmation.

Then run `node <skill dir>/scripts/scaffold.mjs bootstrap --dir <project dir> --apply`
(add `--confirmed` only after the user confirmed a non-empty target). It copies the missing
anchors' files from `templates/bootstrap/`, merges any missing dependencies and scripts into an
existing `package.json`, and lists files it skipped because they exist (wire those by hand, for
example render `<Router />` from `src/main.tsx`). Do not assume any dependency is installed: run
the `nextSteps` it prints (`npm install` in the target, then `npx playwright install chromium`).
The required set is React, React DOM, Motion, Lucide icons, Vite, the React Vite plugin,
TypeScript with the React and Node type packages, the ESLint stack, and Playwright.

The scaffold is styling-framework neutral and has no visual defaults: no Tailwind, theme, colors,
fonts, cards, buttons, borders or shadows. Never add a styling framework unless the host project
already uses one or the user explicitly asks for one.

### 3. Generate

Create the presentation with
`node <skill dir>/scripts/scaffold.mjs presentation --dir <app dir> --slug <slug> --title "<title>"`.
It writes `src/presentations/<slug>/` (self-contained: `outline.ts`, `entities.ts`, `steps/`,
`Talk.tsx`, `style.css`) and appends one entry to `src/presentations/index.ts`; the presentation is
reachable at `/<slug>`. It refuses to touch a slug that exists, so other presentations stay intact
and reachable. Never rewrite or reorder other presentations' folders or registry entries.

Then fill the folder in:

1. `outline.ts`: one entry per step with a stable `id`, a section/era label, a one-line presenter
   `title`, and a paragraph browse `caption`.
2. `entities.ts`: the `layoutId` namespace, one stable id per entity, prefixed by the slug.
3. `steps/scene.tsx` (and more files if needed): scenes composed from the kit's primitives.
4. `style.css`: the whole visual design (see "Styling").

Step numbers are derived from position; never write them by hand.

### 4. Self-verify before reporting done

Do not report success until all of this has passed, fixing failures yourself and re-checking:

1. `npm run build` completes with no type errors.
2. A first-step render check: open the route and confirm the first step renders with no runtime or
   console errors (`npm run verify` also does this and steps through the reference presentation).
3. A browser visual composition check. Prefer the project-local helper
   `npm run inspect -- <slug>`: it captures a settled screenshot of every step into
   `.inspection/<slug>/` and prints advisory warnings. If it is unavailable, write any temporary
   Playwright script **inside the project root** so browser tooling resolves from local
   dependencies, never outside the project tree.
   Look at the screenshots (or an equivalent browser view) of the **first step, the last step, and
   every dense or key step**; also check a **narrow viewport** (about 390 px wide) when the
   presentation is responsive-sensitive. Judge three things: important scene content fits the
   fixed canvas, intentional overlaps stay readable, and nothing collides with chrome (captions,
   progress indicators, table of contents, navigation controls).
4. Review **every** warning the helper printed: open the referenced step and fix accidental
   collisions, indistinct current-step chrome, and unpolished attribution in CSS. Mark an overlap
   as intentional with `data-presentation-allow-overlap` only on the smallest subtree whose
   overlap is deliberate and readable; never use the marker to silence warnings wholesale. Rerun
   the helper and report any remaining advisory warnings accurately.
5. Run `npm run verify` as the last gate. You may iterate with the lighter checks above, but never
   report success while any check fails.

## Modify an existing presentation

1. Identify the target first. If the request does not clearly name one presentation, list the
   registered presentations (`src/presentations/index.ts`) and ask which to change before
   changing anything. Never default to the first entry.
2. Ask only about the requested changes (steps, entities, or style). Do not re-run the full
   gathering interview.
3. Edit only the selected presentation, plus registration changes if the slug itself changes.
4. Run the full self-verification (step 4 above).

## The scene kit

Import everything from `src/presentation-kit` (a vendored copy; do not edit it for a single
presentation).

- `defineStep({ id, era, title, caption, Scene, groupKey?, payload })` binds a typed payload to a
  scene. Adjacent steps with the same `groupKey` **and** the same `Scene` keep one mounted scene
  instance and only the `payload` changes, which is what lets entities morph. Steps without a
  group, or with a different group or scene, cross-fade, and shared `layoutId` entities still morph.
- `<Presentation steps title initialMode? brand? attribution? canvas? className? />` hosts the
  steps. Default design canvas 880 x 380, scaled uniformly to fit; present mode (marker + one-line
  title) and browse mode (title, caption, table of contents on viewports at least 1024 px wide,
  progress dots, previous/next), toggled with `P`. Keys: Right/Space/PageDown next, Left/PageUp
  previous; horizontal swipe; navigation clamps at both ends and never steals keys from a focused
  control.
- Primitives: `Box`, `Label`, `Frame`, `Emphasis`, `SymbolChip` (all take `id`, `x y w h`,
  `className`, `style`, optional `icon` as a Lucide component, and any `data-*` attribute),
  `Arrow` (`from`, `to`, `bidirectional`, `curve`), `SceneLayer`, `Appear`, `Presence`. For
  coordinate-heavy diagrams use the primitives' `style`, or raw `motion` elements with a stable
  `layoutId`.
- `Appear` fades a **newcomer** in after persisting entities have moved. Wrap an entity in `Appear`
  where it first appears; leaving that wrapper in place on later steps is fine, because it only
  animates on mount. Do not key it on the step or the payload.
- `Presence` lets entities that leave a grouped scene animate out: render each entity (or its
  `Appear`) as a direct, keyed child of `<Presence>`, and drop it from the children when it should
  leave.
- Hooks the kit renders for your CSS and tooling: `data-presentation-root` (also carries
  `data-step-count`, `data-step-index`, `data-step-id`, `data-presentation-mode`),
  `-header`, `-marker`, `-era`, `-step-number`, `-title`, `-caption`, `-footer`, `-body`, `-stage`,
  `-canvas`, `-toc` / `-toc-entry`, `-progress` / `-progress-item`, `-nav` / `-prev` / `-next`,
  `-attribution`, `-brand`, per-entity `data-presentation-entity` / `-node`. The current progress
  item and ToC entry carry `aria-current` and `data-presentation-active="true"`.
- The bottom-right "made by and-scene" attribution is toolkit disclosure. There is no default
  top-left brand; pass `brand` to add your own.

## Styling

The kit owns behavior, canvas geometry and DOM hooks only. **Everything visual belongs to the
presentation**: palette, typography, spacing, borders, shadows, card and button treatments, and
the look of the chrome. Write plain CSS in the presentation's `style.css` (scope selectors under
the class passed to `<Presentation className>`), unless the host already uses a styling framework
or the user explicitly asks for one. The presentation's CSS must:

- make the **active** progress item and table-of-contents entry visibly different from inactive ones,
- make the attribution legible (readable size, a considered color and font, a comfortable hit
  area), keeping it clear of the previous/next controls,
- keep the one-line present-mode title on one line.

## Quality bar

Every presentation you hand over builds with no type errors, renders its first step without
runtime or console errors, shows a caption for every step, supports next/previous navigation,
passes the visual composition check above, and follows the evolving-scene model (stable entity
ids, additive steps wherever possible, no per-step redrawing).
