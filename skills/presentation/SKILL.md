---
name: presentation
description: Create or modify an evolving-scene browser presentation, bootstrapping a Vite, React, and TypeScript app when needed.
---

# Presentation skill

Create browser presentations as one diagrammatic scene that changes through named steps. Keep stable entities stable across steps and give each step a title, caption, and visual purpose.

## Gather requirements

Read the request first. If the topic, visual style, or step content and visual descriptions are missing, ask one question at a time for the missing information. Ask about the topic, then the look, then each beat as needed. The user controls the level of detail: they may proceed with partial details, and you can generate from what is known and iterate. Do not impose a completeness gate. Skip questions already answered in the prompt. For a key or complex step, an ASCII mockup may help confirm layout; use it selectively, not for every step.

## Resolve the target and scaffold

Resolve all template paths from this skill file's directory, never from the caller's current working directory. The bootstrap is `templates/bootstrap/`; presentation file templates are under `templates/presentation/`.

Detect three contract anchors by presence, not byte equality:

1. Build setup: a Vite + React + TypeScript app with a working `npm run build`.
2. Scene kit: the `Step`/`Scene` contract, stage and morph host, present/browse navigation, chrome, and fit-scale canvas.
3. Presentation index: a registry mapping each presentation to its own route.

If all anchors exist, use the app. If some are missing, add only the missing infrastructure and dependencies without replacing present anchors. Ensure the runtime dependencies `react`, `react-dom`, `motion`, and `lucide-react`; and the build/tool dependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, ESLint with its React Hooks and Refresh plugins and TypeScript support, `globals`, and `playwright`. Also ensure `vitest` when using the shipped tests. Do not assume dependencies are installed. Do not add Tailwind or another style framework unless the host already uses it or the user requests it.

Target rules:

- In an empty directory or standalone app, scaffold at the project root.
- In a monorepo, scaffold a self-contained app at `presentations/`, not the repository root. Detect monorepos from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory.
- If already inside a presentation app, reuse it and fill only missing anchors.
- In a non-empty project missing the scene kit or presentation index, state the target path and wait for confirmation before writing.

When bootstrapping from an empty/standalone directory, copy `templates/bootstrap/` relative to this SKILL.md. For partial scaffolds, copy only the missing anchor files and merge dependencies. Install dependencies after updating the package manifest and lockfile. Preserve host files and existing presentations.

## Create or modify

For a new presentation, create a self-contained folder with `entities.ts`, `steps/*`, and `Talk.tsx`, then add one explicit registry entry in `src/presentations/index.ts`. Use stable entity IDs and the kit's generic primitives. Keep presentation CSS in presentation-owned files; plain CSS is the default. Use `data-presentation-*` hooks to style active-step state, attribution, and the look and feel. The reusable kit owns behavior and geometry only and must remain free of presentation styling defaults.

For a modification, identify the target first. If the request does not name a unique presentation, list the registered presentations and ask which one to change before editing. Once identified, ask only about requested changes and edit that presentation in place; do not repeat the full creation interview.

Templates are starting points, not a reason to overwrite existing files. Keep other registered presentations intact and reachable.

## Verify before reporting completion

Run `npm run build`, then a first-step render check (prefer `npm run verify`; during iteration a focused route smoke check is acceptable). Use the project-local screenshot helper when available: `npm run inspect -- <slug>`. Inspect first, last, and dense or key steps; use `--narrow` where the presentation is responsive-sensitive. Use `chrome-devtools-axi` for interactive browser inspection when available. Review overlap, active-chrome, and attribution warnings. Fix accidental collisions, indistinct active state, or illegible attribution; use the explicit allow-overlap marker only for intentional, readable overlaps. Re-run checks after fixes. Do not report success while build, render, or visual composition issues remain.

The bootstrap's `npm run verify` renders its registered starter route. The root app's verify script also checks the canonical sample across all steps.
