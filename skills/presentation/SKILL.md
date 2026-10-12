---
name: presentation
description: Create a browser presentation, slide deck, talk, or evolving scene; add or change presentation steps; bootstrap and verify a Vite, React, and TypeScript app when needed.
---

# Presentation skill

Create browser presentations as one diagrammatic scene that changes through named steps. Keep stable entities stable across steps and give each step a title, caption, and visual purpose.

## Gather requirements

Gather details iteratively:

1. Read the request and retain any supplied topic, audience, visual style, and step descriptions.
2. Ask one question at a time for the next missing detail: first the topic, then the visual style, then the content and visual description for each story beat. Skip details already provided.
3. After each answer, update the outline and ask for the next missing detail. If the user chooses to proceed with partial details, build from the captured information; do not impose a completeness gate.
4. For a key or complex step, offer an ASCII mockup when it would help confirm the layout. Use mockups selectively, not for every step.
5. If the request already gives enough detail, proceed directly. The user may review the generated result and request iterations.

## Resolve the target and scaffold

Resolve all template paths from this skill file's directory, never from the caller's current working directory. The bootstrap is `templates/bootstrap/`; presentation file templates are under `templates/presentation/`.

Detect three contract anchors by presence, not byte equality:

1. Build setup: a Vite + React + TypeScript app with a working `npm run build`.
2. Scene kit: the `Step`/`Scene` contract, stage and morph host, present/browse navigation, chrome, and fit-scale canvas.
3. Presentation index: a registry mapping each presentation to its own route.

If all anchors exist, use the app and proceed without scaffolding or asking for scaffold confirmation. If some are missing, add only the missing infrastructure and dependencies without replacing present anchors. For a non-empty project missing any anchor, first state the resolved scaffold target and ask the user to confirm before writing, including when the project is a standalone non-monorepo. This also applies when the scene kit and presentation index exist but build setup is missing. An empty directory needs no confirmation.

Use `templates/bootstrap/package.json` as the authoritative exact dependency manifest for the scaffold. On a fresh app, copy that manifest and lockfile. On an existing app, preserve its manifest and merge any missing dependencies from the template before installing. The required runtime dependencies are `react`, `react-dom`, `motion`, and `lucide-react`; required development tools include Vite and its React plugin, TypeScript and React/Node types, ESLint with the repository's TypeScript, React Hooks, and React Refresh plugins, `globals`, and Playwright. Add Vitest and its test dependencies only when adopting the shipped tests. Do not assume dependencies are installed. Do not add Tailwind or another style framework unless the host already uses it or the user requests it. Keep this dependency set in sync with the bootstrap manifest rather than maintaining version ranges here.

Target rules:

- In an empty directory or standalone app, scaffold at the project root.
- In a monorepo, scaffold a self-contained app at `presentations/`, not the repository root. Detect monorepos from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory.
- If already inside a presentation app, reuse it and fill only missing anchors.
- In a non-empty project missing the scene kit, presentation index, or build setup, state the target path and wait for confirmation before writing. If all three anchors already exist, use the existing app without a scaffold confirmation.

When bootstrapping from an empty/standalone directory, copy `templates/bootstrap/` relative to this SKILL.md. For partial scaffolds, copy only the missing anchor files and merge dependencies. Install dependencies after updating the package manifest and lockfile. Preserve host files and existing presentations.

## Create or modify

For a new presentation, create a self-contained folder with this layout, then add one explicit registry entry in `src/presentations/index.ts`:

```text
src/presentations/<slug>/
  entities.ts             # stable IDs/layout IDs used by this presentation
  Talk.tsx                # composes the scene kit and presentation steps
  steps/
    <beat>.tsx            # scene components for individual beats
  style.css               # optional, presentation-owned styling
```

Represent each beat as a `Step` with `id`, `era`, `title`, `caption`, `Scene`, and `payload`. Keep IDs stable for entities that persist or morph between beats; use presentation-scoped `layoutId` values and the kit's generic primitives. `Talk.tsx` passes the ordered steps and presentation title to `<Presentation>`. Keep presentation CSS in presentation-owned files; plain CSS is the default. Use `data-presentation-*` hooks to style active-step state, attribution, and the look and feel. The reusable kit owns behavior and geometry only and must remain free of presentation styling defaults.

For a modification, identify the target first. If the request does not name a unique presentation, list the registered presentations and ask which one to change before editing. Once identified, ask only about requested changes and edit that presentation in place; do not repeat the full creation interview.

Templates are starting points, not a reason to overwrite existing files. Keep other registered presentations intact and reachable.

## Verify before reporting completion

Run `npm run build`, then a first-step render check (prefer `npm run verify`; during iteration a focused route smoke check is acceptable). Use the project-local screenshot helper when available: `npm run inspect -- <slug>`. Inspect first, last, and dense or key steps; use `--narrow` where the presentation is responsive-sensitive. Use `chrome-devtools-axi` for interactive browser inspection when available. Review overlap, active-chrome, and attribution warnings. Fix accidental collisions, indistinct active state, or illegible attribution; use the explicit allow-overlap marker only for intentional, readable overlaps. Re-run checks after fixes. Do not report success while build, render, or visual composition issues remain.

The bootstrap's `npm run verify` renders its registered starter route. The root app's verify script also checks the canonical sample across all steps.

After verification, report the presentation title and route, files created or changed, checks performed and their outcomes, and any remaining caveat. Keep the report concise and distinguish completed checks from checks that could not run.

## Out of scope

This skill creates browser-based React presentations. It does not export PowerPoint, Keynote, PDF, or image decks, and it does not scaffold non-React presentation hosts. If the user needs those outputs or a non-React host, explain that this skill does not provide them and let the user choose a suitable format or tool.
