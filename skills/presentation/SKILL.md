---
name: presentation
description: Creates and modifies evolving-scene browser presentations — one diagram whose entities appear, move, connect, and re-label across named steps. Use when the user asks to create a presentation, build a talk, add or change steps, modify an existing presentation, or scaffold presentation infrastructure. Gathers requirements interactively, bootstraps missing scaffolding (monorepo-aware), registers each presentation at its own route, and self-verifies build, render, and visual composition before reporting done.
---

# Presentation

A presentation is **one evolving scene**, not a deck of slides. Entities have stable ids; each
step is a named state that moves, adds, removes, or re-labels those entities, and the kit
animates the change in place. The skill is hybrid: this document is the procedure, and the
templates plus the scene kit keep every generated presentation consistent.

"Presentation" is the canonical term. "Talk" is only a synonym in conversation; the one place it
appears in code is the entry component file `Talk.tsx`, which is incidental.

## Where the templates live

Resolve **every** template path relative to the directory that contains this `SKILL.md`, never
relative to the current working directory (the user's project is somewhere else).

- `templates/bootstrap/` — a complete, buildable presentation app: Vite + React + TypeScript
  build setup, the scene kit (`src/presentation-kit/`), the presentation index and router
  (`src/presentations/index.ts`, `src/Router.tsx`, `src/Landing.tsx`), the `verify` and
  `inspect` scripts under `scripts/`, a lint config, a committed lock file, and one placeholder
  presentation named `starter`.
- `templates/presentation/` — the files of one presentation: `entities.ts`, `Scene.tsx`,
  `steps/*`, `Talk.tsx`, and an empty `presentation.css`.

## Workflow

Run the four steps in order: gather, resolve target and scaffold, generate or modify, self-verify.

### 1. Gather requirements (create)

Ask the user clarifying questions **one at a time**, waiting for each answer, covering:

1. the **topic**;
2. the **visual style**;
3. for **each step**, its content and a visual description (what appears, moves, connects, or
   changes label, and what the viewer should take from it).

Rules:

- Ask for anything the prompt omits. Do not assume a detail the user can still give you.
- The user decides how much to specify. If they choose to build with partial detail, say so,
  generate from what was captured, and offer to iterate. There is no completeness gate: no
  checklist, mockup, or missing field blocks building once the user chooses to proceed.
- If the prompt already contains the topic, style, and every step's detail, skip the questions
  and build.
- When a step's layout is key or complex, you **may** draw an ASCII mockup and ask the user to
  confirm it before building. Do this selectively — not for every step, and never as a condition
  of proceeding.

### 2. Resolve the target and scaffold what is missing

Do this before creating **or** modifying a presentation.

**Detect the three contract anchors.** The presentation infrastructure is exactly these:

1. **Build setup** — a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** — the presentation-agnostic engine: the `Step`/`Scene` step contract, the stage
   that mounts the active step and runs entity morphs, present/browse navigation, the chrome
   (captions, table of contents), and the fit-scaled canvas.
3. **Presentation index** — the registry mapping each presentation to its own route so several
   coexist.

Detection is by **contract**, not by byte-identical files. Different file names, formatting, or
extra dependencies are not a reason to re-scaffold; an existing kit that provides the contract is
the kit. Look in the working directory first, then in a `presentations/` child directory. If an
app with all three anchors exists, use it.
In a monorepo, the root's own build setup is not a presentation app's anchor: unless the root
itself has all three anchors, evaluate the anchors in `presentations/` (so a root with only a
build setup still gets a full self-contained app there) and leave the root untouched.

**Decide what to scaffold:**

- All three anchors present → skip scaffolding; go straight to step 3.
- None present (empty directory or no anchors) → full scaffold.
- Some present → scaffold **only the missing anchors** and their dependencies. Do not overwrite,
  reformat, or move anything that already exists.

**Resolve the target location:**

- **Monorepo** — any one of: `workspaces` in the root `package.json`, a `pnpm-workspace.yaml`,
  or a `packages/` or `apps/` directory. Scaffold a self-contained app in `presentations/` and do
  not touch the monorepo root's build setup. If a presentation app is already in `presentations/`,
  reuse it and add only its missing anchors.
- **Empty or standalone (non-monorepo) project** — scaffold at the project root.

**Confirm before writing into a non-empty project.** If the directory is non-empty and anything
must be scaffolded (including when only the build setup is missing), first state the resolved
target location and what you will add, then wait for the user's confirmation. Make no scaffold
write — no copy, no config edit, no install — before it. An empty directory needs no
confirmation. A complete scaffold needs none because nothing is written.

**Scaffold from the templates.** Copy from `templates/bootstrap/` (resolved relative to this
file):

- build setup → `package.json` (merge scripts and dependencies; never replace an existing file),
  `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `src/main.tsx`,
  `src/index.css`, `public/`, `.gitignore`;
- scene kit → `src/presentation-kit/`;
- presentation index → `src/presentations/index.ts`, `src/presentations/types.ts`,
  `src/Router.tsx`, `src/resolveSlug.ts`, `src/Landing.tsx`;
- verification tooling → `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`,
  `scripts/lib/`, and the `verify` and `inspect` npm scripts.

Never assume dependencies are installed. Ensure — and install — the full set:

- runtime: `react`, `react-dom`, `motion`, `lucide-react`;
- dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
  `@types/node`, the eslint stack (`eslint`, `@eslint/js`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`), and `playwright` (the
  render check; install its Chromium with `npx playwright install chromium` if missing).

The scaffold is **styling-framework neutral**: no Tailwind, no Tailwind Vite plugin, no theme
tokens, no default colors, fonts, cards, or buttons. Add a styling framework only when the host
project already uses one or the user explicitly asks.

A fresh scaffold includes a placeholder `starter` presentation so the app has a route to render.
When you scaffolded the project yourself and have registered the user's presentation, delete the
`starter` folder and its registry line.

### 3. Generate or modify

**Create a new presentation.** Each presentation is a self-contained folder reachable at its own
route and registered in the index.

1. Pick a kebab-case slug. Copy `templates/presentation/` (relative to this file) to
   `src/presentations/<slug>/`.
2. `entities.ts` — the presentation's `layoutId` namespace and design-canvas geometry (880 × 380).
3. `Scene.tsx` and `steps/*` — one `Step` per beat, each with a stable `id`, an `era` (section
   label), a one-line `title`, and a paragraph `caption`. Model the content as an evolving scene:
   - Steps that are successive states of the same diagram share a `groupKey` and the same Scene
     component, so the instance persists and only `payload` changes.
   - Keep an entity's id the same across steps so it morphs in place; add newcomers with
     `appear` (they enter after persisting entities settle); remove entities by no longer
     rendering them (they exit).
   - Do not rearrange or redraw what is already on screen unless the beat is about moving it.
   - Put coordinates in `entities.ts`; use `SceneLayer` so layers never reflow each other. Raw
     `motion` elements with stable `layoutId`s are fine where a primitive is the wrong shape.
4. `presentation.css` — the presentation's look, in plain CSS owned by this folder (see
   Styling).
5. `Talk.tsx` — renders `<Presentation steps={STEPS} title=… initialMode="browse" />`.
6. Add **one** line to the `presentations` array in `src/presentations/index.ts`:
   `{ slug, title, load: () => import('./<slug>/Talk') }`. Keep the other entries; never replace
   the index. Existing presentations must stay intact and reachable.

**Modify an existing presentation.** First identify the target.

- If the user did not name a presentation, or the name matches more than one, list the
  registered presentations (slug and title) and ask which to modify. Change nothing until they
  answer.
- Once the target is known, ask **only** about the requested change (steps, entities, or style).
  Do not re-run the create interview. Edit that presentation's folder (and its registry line only
  if the slug or title changes); leave every other presentation untouched. Self-verification in
  step 4 is still mandatory.

### Styling

The scene kit owns behavior, geometry, and stable hooks — nothing visual. Never add colors,
fonts, borders, or themes to `src/presentation-kit/`; never edit the kit to change a look.

- Style a presentation in plain CSS inside its own folder (`presentation.css`, imported by
  `Talk.tsx`), or in host-owned CSS. Use another styling system only if the host already uses it
  or the user explicitly requested it.
- Hooks to target: `[data-presentation-node='box|label|arrow|frame|emphasis|symbol-chip']`,
  `[data-presentation-entity]`, `[data-presentation-header|footer|marker|title|caption]`,
  `[data-presentation-toc-entry]`, `[data-presentation-progress-dot]`, `[data-presentation-prev]`,
  `[data-presentation-next]`, `[data-presentation-attribution]`, plus your own `className`s.
- Make the **active** step visibly distinct: style
  `[data-presentation-progress-dot][data-presentation-active='true']` and
  `[data-presentation-toc-entry][data-presentation-active='true']` (also exposed as
  `aria-current`). Make the bottom-right **attribution** (`made by and-scene`) legible: size,
  color, and underline in your CSS. Do not hide or remove it.
- A presentation can pass a host `brand` to `<Presentation>`; the kit adds no top-left brand.

### 4. Self-verify before reporting completion

Never report success until all of the following pass for the presentation you created or
modified. If any check fails, fix the cause yourself and re-run the failed check (and anything it
affects); do not report success, and do not hand the failure to the user.

1. **Build** — `npm run build` completes with no type or build errors.
2. **Render** — `npm run verify` builds and renders every registered presentation in Chromium,
   stepping through all steps, and fails on any console error, page error, or step that does not
   advance. At the very least the created/modified presentation's route must render its first
   step without errors; confirm the route you touched, not just the starter.
3. **Visual composition** — run `npm run inspect -- <slug>`. It builds, serves a production
   preview, waits for animations to settle, and writes `.inspection/<slug>/step-NN.png` (1-based,
   zero-padded) plus advisory warnings; a non-default viewport writes to
   `.inspection/<slug>-<W>x<H>/`, so the narrow pass keeps the desktop screenshots. Options: `--viewport WxH` (default 1440x900) and
   `--settle-ms N` (default 1000). Always use this project-local helper when it exists. Only if
   it does not, write a temporary Playwright helper **inside the project root** so it resolves
   Playwright from local dependencies — never an ad hoc script outside the project tree.
   - View screenshots of the **first step, the last step, and every dense or key step**. Check
     that important content fits the fixed canvas, intentional overlaps stay readable, and
     nothing collides with chrome (caption, progress indicators, table of contents,
     navigation controls).
   - If the presentation is responsive-sensitive, repeat on a narrow viewport
     (`npm run inspect -- <slug> --viewport 390x844`).
4. **Review every warning** the helper prints (`overlap`, `active-chrome`, `attribution`), at the
   step and element it names:
   - an accidental collision → fix the layout;
   - indistinct current-step chrome or an unpolished attribution → fix it in the presentation's
     CSS;
   - a genuinely intentional, readable overlap → mark only that subtree with
     `data-presentation-allow-overlap`. Never mark a whole scene or the page to silence warnings.
   Re-run `npm run inspect -- <slug>` after fixing and confirm the warnings are gone or
   deliberately accepted.

When done, report the route, the checks you ran, and any advisory warnings that remain and why.
