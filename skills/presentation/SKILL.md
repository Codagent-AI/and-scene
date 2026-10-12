---
name: presentation
description: Creates and modifies evolving-scene browser presentations and bootstraps a Vite, React, and TypeScript app when needed. Use when the user asks for a presentation, slide deck, or talk, asks to add or change presentation steps, or mentions presentations, slides, or scenes.
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

If all anchors exist, use the app without scaffolding.

Use `templates/bootstrap/package.json` as the sole authoritative list of scaffold dependencies and versions.

1. For a fresh app, copy the template's `package.json` and `package-lock.json`.
2. For an existing app, preserve its manifest and merge any missing entries from the template manifest.
3. Install dependencies: use `npm ci` after copying the template lockfile, or `npm install` after merging into an existing app.

- Add Vitest and its test dependencies only when adopting the shipped tests.
- Do not add Tailwind or another style framework unless the host already uses it or the user requests it.

Target rules:

- In an empty directory or standalone app, scaffold at the project root.
- In a monorepo, scaffold a self-contained app at `presentations/`, not the repository root. Detect monorepos from `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` directory.
- If already inside a presentation app, reuse it and fill only missing anchors.
- An empty directory needs no confirmation. In any non-empty project missing one or more anchors, state the target path and wait for confirmation before writing. This includes standalone projects and projects missing only build setup.
- For a partial scaffold, add only missing infrastructure and dependencies without replacing anchors that are already present.

When bootstrapping from an empty/standalone directory, copy `templates/bootstrap/` relative to this SKILL.md. For partial scaffolds, copy only the missing anchor files and merge dependencies. Preserve host files and existing presentations.

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

Use this completion report:

```text
Presentation: <title> (route: /<slug>)
Files: <created or changed files>
Checks: build <pass/fail>, verify <pass/fail>, inspect <pass/fail/not run (reason)>
Caveats: <none or list>
```

## Out of scope

This skill creates browser-based React presentations. It does not export PowerPoint, Keynote, PDF, or image decks, and it does not scaffold non-React presentation hosts. For export or non-React requests, decline that output and offer to build the browser-based React version instead. Decline direct edits to presentations that do not use the scene-kit contract; offer to convert or recreate them as a scene-kit presentation.
