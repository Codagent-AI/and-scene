---
name: presentation
description: Create, scaffold, style, verify, inspect, or modify an evolving browser presentation in a new or existing React app. Use when asked to make a presentation, talk, explainer, visual walkthrough, or step-by-step scene; when adding or changing presentation steps, entities, routes, or presentation styling; or when bootstrapping the And Scene presentation kit.
---

# Create or modify a presentation

## Gather the story

1. If the request does not already give a topic, ask one question about the topic.
2. Ask one question at a time about the visual style, then the content and visual description for each step. Wait for each answer before asking the next question. Do not assume details the user can still provide.
3. If the user says to build with partial detail, proceed with what they gave and iterate without a completeness gate. If the prompt is already complete, proceed without questions.
4. Offer a small ASCII mockup only for key or complex steps when it would clarify composition. Do not mock up every step.

## Resolve the target and scaffold

1. Inspect the current directory and use `scripts/detect-target.mjs <dir>` from this skill directory. Resolve all template and helper paths relative to the directory containing this `SKILL.md`, never the user's current working directory. For example, invoke `node <skill-dir>/scripts/scaffold.mjs --target <app-dir> --anchors all`; `<skill-dir>` is the parent directory of this `SKILL.md`.
2. Detect the three app anchors by their contracts, not byte identity: (a) Vite + React + TypeScript setup with a working `npm run build`; (b) scene kit exposing the Step/Scene contract, stage/host, navigation, chrome, and fit-scale canvas; (c) presentation index explicitly mapping presentations to routes. A `presentation-kit/` with the relevant files/exports is one way to identify the kit.
3. Target an empty or standalone project at its root. In a monorepo (`package.json` workspaces, `pnpm-workspace.yaml`, or `packages/`/`apps/` layout), use a self-contained app under `presentations/`. If already inside a presentation app, use it and scaffold only missing anchors.
4. If a non-empty project lacks the scene kit or presentation index, state the exact target location and proceed only after the user confirms. Scaffold the full app only when no anchors exist; do nothing when all exist; otherwise add only missing anchors and their dependencies. Never overwrite existing files or disturb unrelated content.
5. Ensure the complete dependency set even if packages appear installed: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`, and `playwright`. `scaffold.mjs` merges missing declarations. Then run `npm install` in the target.
6. Do not add Tailwind or another styling framework unless the host already uses it or the user explicitly requests it. Use presentation-local plain CSS by default. The kit has no default theme.

## Create a presentation

1. Make a self-contained `src/presentations/<slug>/` folder from `templates/presentation/` using `scripts/new-presentation.mjs --target <app-dir> --slug <slug> --title <title>` (paths relative to this skill's directory). Keep the presentation's `entities.ts`, `steps/*`, `Talk.tsx`, and CSS together. Register an explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry in `src/presentations/index.ts`; the route is `/<slug>`.
2. Model one evolving scene. Keep entity IDs and `layoutId`s stable across steps; group successive steps sharing the same scene. Add newcomers with `Appear`; let continuing entities morph. Give every step a stable `id`, `era`, `title`, `caption`, `Scene`, and typed `payload`.
3. Keep all visual choices in presentation or host CSS, never in the kit. Style the active progress/ToC entry visibly using `[data-active="true"]` and/or `[aria-current]`. Style `[data-presentation-attribution]` locally at a legible size of at least 12px. Use `data-presentation-allow-overlap` only for genuinely intentional, readable overlap.
4. Read the scaffolded `src/presentation-kit/README.md` for the stable DOM hooks. Contract summary: `Step<T>` has `id`, `era`, `title`, `caption`, `Scene`, `payload`, and optional `groupKey`; `SceneProps<T>` receives `payload` and `stepIndex`; `Presentation` receives typed `steps`, `title`, and optional `initialMode`. Node primitives include `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, and `SceneLayer`. Root, stage, nav, active-state, and attribution hooks are documented in that README.

## Modify a presentation

If the target is missing or ambiguous, read `src/presentations/index.ts`, list its existing presentations, and ask which one to change before editing anything. Then ask only about the requested step, entity, or style changes. Make scoped edits to that presentation; do not repeat the create workflow or rebuild unrelated presentations.

## Verify before reporting done

1. Run `npm run build`. A lighter single-route/first-step check is allowed first, but it does not replace full verification.
2. Confirm the first step renders without runtime or console errors, every step has a caption, and next/previous navigation works.
3. Run `npm run inspect -- <slug>` from the project. Review settled screenshots for the first, last, and dense or key steps. Check a narrow viewport when the composition is responsive-sensitive. Review overlap, active-nav, and attribution warnings; fix accidental collisions, indistinct active chrome, and unpolished attribution, then rerun inspection. Mark only intentional readable overlaps.
4. Run `npm run verify` for the full route and step render check. Never report success while build, render, or visual checks fail. Report the checks run and any remaining advisory warnings accurately.

The quality bar is a clean build, a working first step, a caption for every step, working next/previous navigation, and a composition that fits without accidental collisions.
