---
name: presentation
description: Create, extend, or revise a browser presentation as one evolving scene with the And Scene kit. Use when a user asks for a presentation, explainer, talk, or visual walkthrough.
---

# Presentation skill

Create one evolving diagram, not a stack of unrelated slides. Stable entities persist between named steps; each step has its own title, caption, visual description, and scene state. The presentation owns its look. The reusable kit owns scene behavior and geometry.

Resolve every path below from the directory containing this `SKILL.md` (the skill directory), never from the caller's working directory. The bootstrap snapshot is `templates/bootstrap/`; the presentation starter is `templates/presentation/`.

## 1. Gather the brief

Use details already provided. Ask only for missing information, one question at a time:

1. What topic or explanation should the presentation cover?
2. What visual style should it use?
3. For each step in order, ask one question about what it explains and what viewers should see. Capture that step's title, caption, visual description, and which entities appear, persist, move, or leave before asking about the next step.

Do not invent details the user can still provide. The user controls depth: accept sketches, partial outlines, or a request to proceed with what is known, and iterate from the result. Do not impose a completeness gate. For a key or complex composition, an ASCII mockup may help confirm the layout; use it selectively, not for every step.

## 2. Resolve the app target and scaffold

Inspect the intended project and detect these three contract anchors, regardless of filenames or formatting:

- **Build setup:** Vite + React + TypeScript with a working `npm run build`.
- **Scene kit:** a `Step`/`Scene` contract, active-scene host with entity morphs, present/browse navigation and chrome, and fit-scaled canvas.
- **Presentation index:** a registry mapping each presentation to its route.

If all anchors exist, use the app and preserve its conventions. If any are missing, resolve the target as follows:

- An empty directory or standalone project uses its root.
- A monorepo uses a self-contained app under `presentations/`. Treat any of these as monorepo signals: a `workspaces` field in `package.json`, a `pnpm-workspace.yaml`, or a root `packages/` or `apps/` directory.
- When already inside an app with one or more anchors, complete only the missing infrastructure there.

In a non-empty project that needs scaffolding, state the exact target path and wait for confirmation before writing. Then copy only missing infrastructure from the skill-relative bootstrap, preserve existing files and package entries, merge missing scripts and dependencies, and install dependencies. For a monorepo, scaffold a self-contained app at `presentations/` rather than changing root build configuration. Do not infer that dependencies exist just because related source files do.

Ensure this full dependency set:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/lint/render development dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`, and `playwright`.

The scaffold is styling-framework-neutral. Do not add Tailwind, a Tailwind plugin, another required styling framework, or default presentation colors, fonts, spacing scales, card/button treatments, borders, shadows, or theme tokens. Use presentation-local plain CSS unless the host already has a styling framework or the user asks for one. Do not overwrite an existing anchor during a partial scaffold.

## 3. Create or modify

For a new presentation, create `src/presentations/<slug>/` with:

- `entities.ts`: stable, presentation-local identity names for elements that persist or morph.
- `steps/`: step modules plus a small `steps/index.ts` exporting the ordered `STEPS`. Each step supplies a unique id, era, title, caption, scene component, and payload. Use a shared scene module when steps evolve one grouped scene, as in the worked example. Compose generic nodes from `src/presentation-kit/` so continuing entities retain stable IDs and positions; describe each visual beat in the scene model.
- `Talk.tsx`: render the ordered steps through `<Presentation>` and import local CSS.
- `presentation.css`: the visual system for this presentation, including locally styled active navigation/TOC/progress and legible attribution when those controls are shown. Start with the user's direction; the CSS template contains no visual preset.

Register it with one explicit entry in `src/presentations/index.ts`, using a dynamic import of `./<slug>/Talk`. Keep other entries and presentation folders intact. The worked example at `src/presentations/how-to-make-a-presentation/` demonstrates the required nine-step content and visual quality; follow its scene and styling conventions.

For a modification, first identify the target. If the request does not name a unique presentation, list registered presentations and ask which one before editing. Ask only about the requested change (steps, entities, or style); do not repeat the create interview. Keep changes scoped to that presentation and preserve other routes.

## 4. Self-verify and inspect

Do not report completion until the result builds, renders, and has been visually inspected. Run checks from the presentation app root:

1. `npm run build`.
2. `npm run verify` for the production route/render check. At minimum confirm the first step renders without runtime or console errors; the project's full check should cover every step.
3. `npm run inspect -- <slug>` to capture settled screenshots and review advisory warnings. Keep screenshots under the project's `.and-scene/screenshots/`. If no local helper exists, put any temporary Playwright helper under the project root so it resolves that project's dependencies.
4. Review screenshots of the first and last steps and every dense/key step. Use `--narrow` for responsive-sensitive scenes. Inspect with the available browser tooling when needed. Fix accidental overlaps and collisions with captions, TOC, progress, navigation, or other chrome; make the active control distinct and attribution legible. Mark overlap with `data-presentation-allow-overlap` only when it is intentional and remains readable, then inspect again.

Fix any build, route, runtime, console, or composition failure and rerun the relevant checks. Report what was checked, the route, and any remaining advisory warnings accurately; never claim success while a failure remains.

## Maintenance

`src/presentation-kit/` is canonical. When it changes, synchronize its non-test files byte-for-byte to `templates/bootstrap/src/presentation-kit/`. Keep root `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `scripts/preview-process.mjs`, and `scripts/preview-process.d.mts` byte-aligned with their bootstrap copies. The automated parity integration test guards this release snapshot. Keep `scripts/reference-sample.json` out of the bootstrap so copied `verify` runs in generic mode.
