---
name: presentation
description: Create or modify browser presentations as one evolving diagrammatic scene. Use when asked to make a presentation, visual explanation, or narrated technical diagram.
---

# And Scene presentation workflow

Create a browser presentation as one scene whose stable entities evolve through named steps. The canonical runtime lives in `src/presentation-kit/`; presentation-specific layout, copy, and visual style live in that presentation's folder.

## Gather the brief

For a new presentation, ask one question at a time for anything missing: the topic, visual direction, and for each story beat its title, narration, and visual description. Do not invent details while the user can still provide them. They may explicitly choose to proceed with partial detail; record the open points and make a useful first pass. For a visually complex beat, a small ASCII layout can clarify intent. If the request already includes the brief, proceed without redundant questions.

For a modification, first identify the target presentation. If the request is ambiguous, list registered presentations and ask which one. Ask only about the requested edit; preserve other presentations and unrelated files.

## Resolve the target and scaffold

Resolve the skill directory from this `SKILL.md` location; never assume the user's working directory contains the templates. The bootstrap source is `templates/bootstrap/` and the presentation starter is `templates/presentation/`.

Check the project for the three infrastructure anchors by contract, not filename formatting:

1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A reusable scene kit with typed steps, active-stage host, morph behavior, navigation/chrome, and fixed-canvas scaling.
3. A presentation registry that gives each presentation a route.

If all exist, reuse them. If some are missing, scaffold only missing infrastructure and its required packages. Do not overwrite a build setup, kit, registry, presentation, or unrelated file that already exists. Required packages are React, React DOM, Motion, Lucide React, Vite, the React Vite plugin, TypeScript and React/Node types, ESLint and its configured plugins, and Playwright. Tailwind and other styling systems remain optional.

Choose the target before writing. In a monorepo (workspaces in `package.json`, `pnpm-workspace.yaml`, or a `packages/` / `apps/` layout), put a self-contained app in `presentations/`. In an empty standalone folder or standalone app, use its root. If the project is non-empty and lacks scene-kit or registry anchors, state the exact target and wait for confirmation before writing. Resolve all copied template paths relative to this skill directory.

The distributable bootstrap template can be copied as a starting point, but inspect existing anchors first and merge only missing pieces. Install the complete dependency set where needed. Keep the kit style-neutral: no default palette, font, borders, shadows, spacing theme, card/button treatment, or required framework.

## Create or edit

Make a presentation folder containing its route component, stable entity ID namespace, ordered step definitions, scene components, and presentation-owned CSS. Register a new presentation with one explicit entry in the registry; never remove or rewrite unrelated entries. Reuse the generic kit primitives where they fit and use raw Motion elements with stable `layoutId`s for coordinate-heavy diagrams.

Each step needs a stable ID, era, presenter title, browse caption, and scene state. Derive displayed numbering from position. Persisting entities retain IDs and morph; additions enter after continuing entities move, and departing entities exit. Use the kit's `Appear` wrapper with a changing `present` boolean and keep that wrapper in the scene tree across beats so its exit animation can run. Group adjacent beats with the same scene component when the scene should persist. Compose on the 880 × 380 canvas and let its scale change uniformly. Keep intentional overlaps readable and mark only intentional overlap subtrees with `data-presentation-allow-overlap`.

The kit provides browse and present modes, direct progress and era navigation, keyboard/touch navigation with clamped ends, and a default bottom-right `made by and-scene` repository attribution. Style controls and attribution in presentation-owned CSS. Do not add default top-left kit branding.

## Verify before reporting success

Run `npm run build` and `npm run verify` (the scaffolded verification builds and walks the registered route through its steps in Chromium). For a generated route, open its production preview and check at least its first step for runtime/console errors. If Playwright reports that Chromium is missing, install it with `npx playwright install chromium` and retry. Run `npm run inspect -- <slug>` when available; it captures each settled step under `artifacts/inspection/<slug>/` and reports advisory collisions, weak active state, or attribution polish issues. Review those warnings and fix accidental problems. Inspect screenshots or the browser at first, last, and dense/key steps; check a narrow viewport when the composition is responsive-sensitive. Do not report done while checks fail or visual warnings remain unreviewed. Summarize the route, changed files, build/render evidence, and any advisory warnings that remain.

## Templates

- `templates/bootstrap/`: build and router anchors, neutral host CSS, scene kit, registry, dependencies, and scripts for a fresh app.
- `templates/presentation/`: starter files for a presentation folder.
