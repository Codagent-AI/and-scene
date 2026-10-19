---
name: presentation
description: Creates or modifies a browser presentation, modeled as one evolving diagrammatic scene, from a topic. Use when asked to make, build, extend or change a presentation, talk or deck in a React/Vite project; it scaffolds the scene kit and presentation index when they are missing.
---

# Presentation

Build a browser presentation as **one evolving scene**: stable entities (boxes, arrows, chips, frames) persist from step to step and morph in place; new entities enter after the persisting ones have moved, and departing ones exit. It is not a deck of unrelated slides.

Paths below named `templates/...` are relative to **the directory that contains this `SKILL.md`**, never the current working directory. Resolve that directory first (call it `SKILL_DIR`) and use `SKILL_DIR/templates/bootstrap/` for scaffolding and `SKILL_DIR/templates/presentation/` for a new presentation.

Run the phases in order. Never report success before phase 4 passes.

## 1. Gather

Ask the user clarifying questions **one at a time**, never several in one message. Cover, in this order, only what the prompt does not already give:

1. the topic;
2. the visual style (look and feel);
3. for each step: its content (era/section, one-line title, caption) and a description of the visual (which entities appear, move or leave).

Do not invent anything the user can still provide. The user controls depth: if they choose to build with only some details (for example "sketch a few steps and let's see"), take that as an explicit choice, generate from what was captured, and iterate afterwards. There is no completeness gate. If the prompt already contains the topic, style and all step details, skip the questions and proceed.

When a step's layout is key or complex, you may draw an ASCII mockup of it and ask the user to confirm the layout before building. Do this at your discretion, not for every step.

For a modification request, skip the full gathering flow: see phase 3b.

## 2. Resolve the target and scaffold what is missing

Before creating or modifying anything, make sure the project has the three **contract anchors**. Detect them by what they do, not by file names, byte equality or formatting; extra dependencies or renamed files do not mean something is missing.

| Anchor | Present when |
| --- | --- |
| Build setup | A Vite + React + TypeScript app whose `npm run build` works. |
| Scene kit | A reusable engine providing the `Step`/`Scene` step contract, a stage/host that mounts the active step and runs entity morphs, present/browse navigation, and chrome (captions, table of contents) with a fit-scaled canvas. (Template: `src/presentation-kit/`.) |
| Presentation index | A registry mapping each presentation to its own route so several coexist. (Template: `src/presentations/index.ts` plus the router.) |

### Resolve where the app lives

- A presentation app already exists (anchors found in the current app, or in a `presentations/` app) → use it. Do not create a second app.
- The project is a **monorepo** — any of: `workspaces` in the root `package.json`, a `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory → scaffold a self-contained app in `presentations/` (its own `package.json`, config, scripts and `node_modules`). Do not modify the monorepo root build.
- Empty directory or standalone (non-monorepo) project → scaffold at the repository root.

### Decide what to scaffold

- **All three anchors present** → skip scaffolding; go straight to phase 3. Do not overwrite anything.
- **None present** (empty directory or no anchors) → full scaffold: copy everything in `SKILL_DIR/templates/bootstrap/`, then install dependencies.
- **Some present** → scaffold only the missing anchors and their dependencies, and leave present ones untouched. Build setup: `package.json` (merge the missing scripts and dependencies; keep every existing field), `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `src/main.tsx`, `scripts/`. Scene kit: `src/presentation-kit/`. Presentation index: `src/presentations/index.ts`, `src/Router.tsx`, `src/Landing.tsx`. Never replace an existing file with the template version; if a template file would collide, keep the existing file and adapt.

### Confirm before writing into a non-empty project

If the target directory is non-empty and **any** anchor must be scaffolded (including when only the build setup is missing), first tell the user the exact target location and what will be added, and **wait for their confirmation before writing anything**. Do not ask when the directory is empty or when all anchors are present.

### Dependencies

Never assume dependencies are installed. The scaffold must end with all of these in `package.json` and installed (`npm install`; use `npm ci` when a lockfile is present):

- runtime: `react`, `react-dom`, `motion`, `lucide-react`;
- dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`), and `playwright` (render verification). If Chromium is missing, run `npx playwright install chromium`.

The scaffold is **styling-framework-neutral** and ships no colors, fonts, themes, card or button styles. Do not add Tailwind or any other styling framework unless the host project already uses one or the user explicitly asks.

## 3a. Create a presentation

A presentation is a self-contained folder `src/presentations/<slug>/` (copy `SKILL_DIR/templates/presentation/` and replace `__SLUG__` and `__TITLE__`):

- `narration.ts` — plain data: `TITLE` and `NARRATION` (stable `id`, `era`, one-line `title`, paragraph `caption` per step). Numbering comes from position; never number steps by hand.
- `entities.ts` — the presentation's stable entity ids (its `layoutId` namespace) with fixed geometry and the step in which each first appears.
- `Scene.tsx` — one scene component that renders the entities visible at `payload.stage`, using the kit's `Box`, `Label`, `Arrow`, `Frame`, `SymbolChip`, `Emphasis`, `SceneLayer` and `Appear`. Raw `motion` elements with stable `layoutId`s are fine for coordinate-heavy diagrams.
- `steps.ts` — builds the `Step` array. Steps that share a `groupKey` and the same `Scene` keep one mounted scene and only the payload changes.
- `Talk.tsx` — `<Presentation steps title initialMode />`.
- `talk.css` — the presentation's look.

Then register it by adding **one line** to the explicit array in `src/presentations/index.ts` (`{ slug, title, load: () => import('./<slug>/Talk.tsx') }`). Keep existing entries and folders untouched so all existing presentations stay reachable. Do not use glob registration.

Design as an evolving scene, not as slides:

- An entity that persists keeps the **same id and position logic** so it morphs; change position, size, label or emphasis rather than deleting and redrawing it.
- Mark only entities that are new in the active step as entering (`Appear enter`); never fade continuing entities. Entities that leave the scene simply stop being rendered, and they animate out.
- Keep the composition inside the fixed 880 × 380 canvas; leave room so content never touches the caption, progress, table-of-contents or navigation chrome.
- Intentional overlaps and stacks are allowed if readable; mark only those subtrees with `data-presentation-allow-overlap`.

**Styling lives outside the kit.** Put the presentation's look in its own `talk.css` (or host-owned CSS). Plain CSS is the default; use a styling framework only when the host already uses one or the user explicitly asks. Never edit `src/presentation-kit/` to add colors, fonts, borders, shadows or button styles. Target the kit's stable hooks (`data-presentation-*`). Always style locally: the active progress indicator and table-of-contents entry (`[data-presentation-active='true']`, also `aria-current="step"`) so the current step is visibly distinct, and the attribution link (`[data-presentation-attribution]`) so it is legible (at least 12px, not browser-default). The kit shows a "made by and-scene" attribution bottom-right and no top-left brand; a host may pass its own `brand`.

## 3b. Modify a presentation

1. Identify the target. If the request does not clearly name one presentation, **list the registered presentations and ask which to modify before changing anything**.
2. Ask only about the requested changes (steps, entities, or style). Do not re-run the full gathering flow.
3. Edit only that presentation's folder, plus a registry or verification manifest edit only when the change needs it. Leave other presentations untouched.

## 4. Self-verify before reporting completion

Do all of this, in order, and fix every failure yourself and re-check; never report success on a failing check:

1. `npm run build` completes with no type errors.
2. Render check: the presentation route renders its first step with no runtime or console errors. For a final gate, run `npm run verify` (builds the whole app, then renders the reference sample through every step on `127.0.0.1`). A lighter build plus single-route render may be used while iterating.
3. Visual composition check with the project-local helper: `npm run inspect -- <slug>` (screenshots land in `.presentation-inspect/<slug>/step-NN.png`, captured after animations settle). Prefer it over ad hoc scripts; if it is unavailable, write any temporary Playwright helper **under the project root** so browser tooling resolves from local dependencies. Look at the screenshots of the **first step, the last step and any dense or key steps**; for responsive-sensitive presentations also run `npm run inspect -- <slug> --viewport 390x844` and look at those. Confirm that important content fits the canvas, intentional overlaps stay readable, and nothing collides with the caption, progress indicators, table of contents or navigation controls.
4. Review every advisory warning the helper prints (overlap, indistinct active chrome, unpolished attribution). Warnings are advisory and an empty list does not prove the composition is good. Fix accidental collisions and chrome polish in presentation CSS; mark only a genuinely intentional, readable overlap with `data-presentation-allow-overlap` on that subtree (never on a whole-deck root); then re-run the helper.

Report which checks ran, their results, and any remaining advisory warnings accurately.

## Keeping copies aligned

`templates/bootstrap/src/presentation-kit/` and the verification scripts are snapshots of the canonical `src/presentation-kit/` and `scripts/` in the And Scene repository. When the kit or scripts change, update the snapshots in the same change.
