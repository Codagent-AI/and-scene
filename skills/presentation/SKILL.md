---
name: presentation
description: Creates and modifies browser-based presentations as one evolving diagrammatic scene. Use when the user asks for a presentation, slide deck, talk, or visual explainer; asks to add or edit a step; or mentions a presentation or scene.
---

# Presentation skill

Create browser presentations as a single scene whose entities persist and evolve across named steps. Use the reusable scene kit for behavior and geometry; each presentation owns its visual design.

## Scope

This skill creates React browser presentations. It does not produce PowerPoint, Keynote, PDF, or other exported slide files, and it does not scaffold non-React applications.

For exported slide files, explain that this skill does not create those formats and suggest a dedicated document or slide-export workflow. For a request targeting a non-React app, ask whether the user wants to proceed with a React presentation scaffold.

## 1. Gather the brief

For a new presentation, gather the topic, visual direction, and the content and visual intent for each narrative step. Ask one concise question at a time, only for information the user has not already supplied. Do not silently invent details the user could still decide. Offer an explicit choice to proceed with partial detail; if the user chooses it, make reasonable implementation decisions for unspecified details and report those assumptions. A prompt containing a complete brief can proceed directly. For a visually complex step, an ASCII layout sketch can help confirm composition; use it selectively, not for every step.

For a modification, identify the existing presentation first. If the target is absent or ambiguous, list registered presentations and ask which one. Then ask only about the requested changes; do not repeat the new-presentation interview.

## 2. Resolve the app and scaffold only what is missing

Resolve this skill's directory from the location of this `SKILL.md`; resolve all template paths from that directory, never from the process working directory. For example, `templates/bootstrap/` is adjacent to this file.

Check these three anchors at the contract level, allowing different filenames and formatting:

1. **Build setup:** a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit:** typed step/scene contracts, a stage that mounts scenes and supports entity morphs, present/browse navigation and chrome, and fixed-canvas fit scaling.
3. **Presentation index:** an explicit or equivalent registry mapping independent presentation routes to their components.

If all are present, reuse the app. If only some are present, add only missing infrastructure and its dependencies; preserve existing anchors and presentations. If the directory is empty or a standalone project without anchors, scaffold at the repository root. In a monorepo (workspaces in package.json, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout), scaffold a self-contained app in `presentations/`. For a non-empty, unscaffolded project, state the exact target and wait for confirmation before writing there.

Resolve these template paths relative to the directory containing this `SKILL.md`:

- `templates/bootstrap/` — complete app and scene-kit scaffold when infrastructure is missing.
- `templates/presentation/` — starting structure for a new routed presentation.
- `templates/step/` — starting structure for a step scene.

Copy scaffold files from the resolved `templates/bootstrap/` directory. Ensure dependencies rather than assuming they exist: runtime `react`, `react-dom`, `motion`, `lucide-react`; development/build `vite`, `@vitejs/plugin-react`, TypeScript, React/Node type packages, ESLint and its configured plugins, and Playwright. Install the full set needed by the copied app. Do not add Tailwind or another styling framework unless the host already uses it or the user requests it.

The reusable kit owns behavior, geometry, and stable hooks, not visual design. Keep its templates free of palette, typography, spacing scale, borders, shadows, card/button treatments, and theme tokens. Put visual treatment in presentation-owned plain CSS by default.

## 3. Create or modify

For a new presentation, create a self-contained folder under `src/presentations/<slug>/`, with an entry component, stable entity IDs, step scene components/data, and presentation-owned CSS. Register one route without changing existing presentations. Use the kit's `Step<TPayload>`, `SceneProps<TPayload>`, and `Presentation` generics so grouped scene payloads remain typed. Prefer stable IDs/layout IDs for entities that continue; let them accumulate or transform rather than redrawing the whole diagram each step. Each step needs a title and useful caption, and the scene must support next/previous navigation.

For a modification, scope edits to the selected presentation and explicitly requested changes. Preserve other presentation files and routes.

## 4. Verify and inspect before reporting done

Run `npm run build`. Render the new/modified route in a real browser and check at least its first step for runtime errors. Use `npm run verify` when available; otherwise use the project's render check or a temporary Playwright helper saved under the project root. Prefer `npm run inspect -- <slug>` when the project-local screenshot helper exists. Use 127.0.0.1 for local browser preview.

Inspect settled views of the first, last, and densest/key steps. Check that the fixed-canvas content fits, intentional overlaps remain readable, and diagram content does not collide with captions, navigation, or other chrome. Check a narrow viewport when the composition is responsive-sensitive. Review inspection warnings: fix accidental overlap, make active progress/ToC states distinct, and style the attribution legibly. Mark an overlap as allowed only when it is intentional and readable. Fix build, render, and visual issues and repeat the relevant checks before reporting completion.

Use this completion report, filling only what applies:

```text
Presentation: <title> (<route>)
Changed: <presentation files and behavior>
Checks: <build, render, and visual inspection performed>
Warnings or assumptions: <remaining advisory warnings/assumptions, or "None">
```

Never claim a check passed if it was not run.
