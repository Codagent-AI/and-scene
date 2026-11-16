---
name: presentation
description: Create or modify browser presentations as one evolving React diagram, bootstrapping missing infrastructure and verifying build, render, and composition.
---

# Presentation

Use this hybrid skill to turn a topic into one evolving diagram rather than independent slides. The local templates and vendored scene kit supply the engine; the agent supplies the narrative and presentation-owned design.

## Gather or identify

For a new presentation, collect the topic, visual style, and each step's content and visual description. Ask one question at a time for missing information; do not invent details the user can still provide. A complete prompt may go directly to building. Let the user control depth: an explicit choice to proceed with partial detail is sufficient; do not impose a completeness gate. Iterate from the captured detail. ASCII mockups are optional for key or complex layouts, not mandatory for every step.

For modification, first identify the target from the presentation registry. If unspecified or ambiguous, list the existing presentations and ask which one before editing. Once identified, ask only about the requested changes to steps, entities, or style; do not repeat the full create interview. Keep edits scoped to that presentation and necessary registration or verification changes.

## Resolve the target and missing contracts

Before creating or modifying, inspect the current project for three infrastructure contracts, even when filenames and formatting differ:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A presentation-agnostic scene engine: typed Step/Scene contract, active-step host and stable-entity motion, present/browse navigation and chrome, fixed-canvas fit scaling.
3. An explicit presentation registry mapping independent folders to routes.

Presence of extra dependencies, different names, or cosmetic changes does not invalidate these contracts. If all are present, use the existing app without scaffolding. If some are present, preserve them and all unrelated content; add only missing anchors and their dependencies. Never replace an existing build setup or registry with a template wholesale.

Resolve in this order:
- When already inside a presentation app, reuse that app, filling any missing contracts there.
- Otherwise detect a monorepo from package.json `workspaces`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout. Put a self-contained app under `presentations/`, preserving root build/workspace files. An unrelated root build anchor is not a presentation-app anchor.
- In an empty or standalone project, use the project root.

For a non-empty project missing the scene kit or presentation index, state the exact resolved location and obtain confirmation before writing. Existing session authorization for that exact target applies; do not ask again unnecessarily. If confirmation has not been given, wait for it.

Locate templates relative to **this SKILL.md's directory**, never the caller's working directory: `templates/bootstrap/` and `templates/presentation/`. Resolve that absolute skill directory before copying. For a fully unscaffolded target, copy bootstrap contents, including hidden ignore files, package metadata and lock data, then run `npm ci` in the target. For partial scaffolds, merge missing contracts and missing dependency entries without overwriting existing scripts or infrastructure; refresh lock data with npm and install. Build and render to prove compatibility.

Ensure runtime dependencies `react`, `react-dom`, `motion`, `lucide-react`, and development dependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, ESLint and its TypeScript/React plugins, `vitest`, and `playwright`. Install Chromium with `npx playwright install chromium` when not available. Never assume infrastructure dependencies are installed.

The bootstrap and reusable kit have zero presentation styling defaults. Do not add Tailwind, a Vite styling plugin, a theme, or any required styling framework. The author or host may add an explicitly requested framework, or reuse one already present, outside the kit.

## Generate or modify

Create `src/presentations/<slug>/entities.ts`, `steps/`, and `Talk.tsx` from the presentation template. Use a unique slug and namespaced stable layout IDs. Register a new explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry without replacing existing entries. Preserve all existing presentation files and routes. The root landing enumerates the registry; each registered path lazy-loads its Talk component.

Each step has a stable id, era, one-line presenter title, paragraph browse caption, scene component, and typed payload. Numbering derives from array order. Group successive states with the same groupKey and Scene so only payload changes; do not key entities by step index. Persistent entities stay mounted and morph through layout projection; newcomers enter after continuing motion and departing entities exit. Use AnimatePresence around conditional keyed Appear wrappers. Keep intentional stacks and overlaps; do not spread the composition merely to fit an implementation pattern.

Use generic Box, Label, Arrow, Frame, Emphasis, SymbolChip, Appear and SceneLayer primitives, or raw motion elements with stable layoutId where needed. Class/style/data hooks support literal coordinates. The kit owns navigation, geometry and animation, not appearance. Default canvas is 880 × 380 and scales uniformly without internal reflow. It supports arrow/Space/Page keys, P mode toggle, swipe, direct step/era jumps and clamped boundaries without hijacking focused controls.

Write visual design in presentation-local plain CSS unless the host already uses a framework or the user requests one. Never style the reusable kit source to suit a topic. Supply readable typography, a coherent palette, spacing, node treatments, and visible focus styles locally. Style `[data-presentation-active="true"]` distinctly for both progress and ToC. Style `[data-presentation-attribution]` legibly (at least 11 CSS px, deliberate color/treatment); the default bottom-right link is toolkit disclosure, not a theme. Top-left branding is host opt-in.

## Verify and repair before completion

1. Run `npm run build` for the whole app. Fix type/build failures and rerun the affected check.
2. Run `node scripts/verify.mjs --slug <slug>` for the created/modified route. It must at least render the first step without console or uncaught errors; the local verifier checks every step. For this repository's canonical reference sample, `npm run verify` additionally validates all nine normative titles and captions. Use the installed production preview/Chromium verification, not a DOM-only substitute.
3. Prefer `npm run inspect -- <slug>` for project-local settled screenshots and advisory warnings. Use `--width 390` for responsive-sensitive work. If the helper is absent, write any temporary Playwright helper **under the project root** so it resolves local dependencies; never use an external ad hoc helper.
4. Review the first, last, dense and key steps in settled screenshots or an equivalent browser view. Also review a narrow viewport for responsive-sensitive presentations. Important content must fit the canvas, text must be readable, and scene content must not collide with captions, progress, ToC or controls. Use `chrome-devtools-axi` for interactive browser inspection when available: snapshot first, then screenshots. Do not replace automated verification with interactive inspection.
5. Review every overlap or chrome-polish warning at its referenced step. Fix accidental text/chrome collisions, indistinct current-step controls, and too-small/browser-default attribution in presentation-owned CSS. Only truly intentional **readable** overlap may use `data-presentation-allow-overlap` on the smallest relevant subtree. Do not silence accidental overlap by marking the whole presentation.
6. Fix build, render, and visual-composition failures yourself and recheck; never report success while a required check fails. Screenshots and warnings are advisory artifacts, not automated proof of visual quality. Report the actual build/render outcome, visual review and any remaining advisories accurately.

Keep `npm test` fast; integration/browser tests belong in a separate script. Do not commit dependency directories, build output, screenshots, or temporary helpers. In this repository, keep canonical kit and bootstrap kit byte-aligned, and sync root scripts with bootstrap scripts whenever their behavior changes.
