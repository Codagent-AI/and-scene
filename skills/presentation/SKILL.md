---
name: presentation
description: Creates evolving-scene browser presentations from a topic and updates existing presentation routes. Trigger for requests to create, generate, make, or modify a presentation, diagrammatic talk, or scene-based visual explainer.
---

# Presentation skill

Create browser-based presentations as one scene that evolves through named
states. Each step changes a shared layout; it is not a separate slide deck.

## 1. Understand the request

Determine whether the user wants a new presentation or a modification. Do not
make the user repeat details already in the request.

For a new presentation, gather these details only when missing, asking **one
question at a time**:

1. Topic and intended audience or purpose.
2. Visual direction (palette, typography, mood, references, or permission to
   choose a direction).
3. The ordered steps. For each, capture its title, what changes in the scene,
   and its caption or takeaway. Ask for both content and visual intent rather
   than inventing details the user could supply.

The user controls the depth. If they say to proceed with incomplete details,
create from the information available, use restrained assumptions for gaps, and
call those assumptions out in the completion report. Do not keep asking or block
on a completeness checklist. A complex or central composition may benefit from
a small ASCII layout sketch for confirmation; this is optional, not a ritual for
every step.

For a modification, identify the target presentation first. If the request does
not identify a unique target, list the registered presentations and ask which
one to edit before changing files. Then ask only about the requested change.
Preserve unrelated steps, presentation files, and registry entries.

## 2. Resolve the app and its target

Resolve this skill's own directory from the location of this `SKILL.md` before
reading templates. Never locate templates relative to the shell's current
directory. Use `templates/presentation/`, `templates/step/`, and
`templates/bootstrap/` as needed.

Check the three infrastructure anchors at the contract level:

- **Build setup:** Vite + React + TypeScript configuration and a working
  `npm run build` script.
- **Scene kit:** a typed step/scene contract, active scene host with entity
  transitions, present/browse navigation and chrome, and fixed-canvas fit
  scaling.
- **Presentation index:** an explicit registry connecting each presentation to
  its own route.

Inspect what exists; filenames and formatting may vary. Do not replace a valid
anchor merely because it differs from the template. Scaffold only missing
anchors and the dependencies they require.

Resolve the app location before writing:

- An empty directory or standalone app: use its root.
- An existing presentation app with the anchors: work in that app.
- A monorepo (workspace declaration, `pnpm-workspace.yaml`, or a `packages/`
  or `apps/` layout): create a self-contained app under `presentations/` rather
  than taking over the monorepo root.

If the project is non-empty and lacks any scaffold anchor, state the proposed
target and ask the user to confirm before writing. Do not overwrite existing
build configuration or unrelated files. Once confirmed, copy only missing
parts and merge required dependency entries into the target app's package file.
For a monorepo, keep the presentation app's package/build setup inside its own
`presentations/` app directory.

The scaffold must ensure these dependencies, regardless of what is currently
installed:

- Runtime: `react`, `react-dom`, `motion`, `lucide-react`.
- Build/type: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`,
  `@types/react-dom`, `@types/node`.
- Lint: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
- Browser render: `playwright` and a usable Chromium installation.

Use npm scripts for build, lint, tests, verification, and inspection as provided
by the scaffold. Install dependencies after updating the package manifest.
Do not add Tailwind or another styling framework unless the host already uses
it or the user explicitly requests it.

## 3. Create or edit the presentation

For a new presentation, make a self-contained directory under
`src/presentations/<slug>/` (or the equivalent in the scaffolded app). Use
`templates/presentation/` as the starting point and `templates/step/` for each
step component. Include presentation-owned `entities.ts`, ordered `steps/`, a
`Talk.tsx` entry, and presentation-local CSS for the visual design. Register it
with one explicit entry in the presentation index. Never replace or unregister
existing presentations.

Use stable entity IDs across steps so existing elements move or change in place.
Keep continuing entities in the scene, add new entities as the story advances,
and remove or transform entities only when the narrative calls for it. Share a
scene component and group key for adjacent states that should persist as one
mounted scene. Put captions on every step. Compose the fixed canvas from the
generic kit primitives; keep all color, type, spacing, borders, shadows, and
component treatment in the presentation or host CSS. Do not add visual defaults
to the reusable kit.

For a modification, first inspect the selected presentation and its current
steps. Make the smallest scoped changes that fulfill the requested edit. Do not
re-run the full creation interview or alter other registered presentations.

## 4. Verify behavior and composition

Run the app's `npm run build` and fix all failures. Open the target route in a
real browser, check the first step for runtime and console errors, and exercise
next/previous navigation. Prefer the project's `npm run verify` when available;
it should render every step and catch browser errors. Do not claim success when
any required check fails.

Prefer the app's local screenshot helper (`npm run inspect -- <slug>` when
available). Otherwise create any temporary Playwright helper under the project
root and use the project's installed browser tooling. Capture settled views of
the first and last steps and every dense or key composition. Check narrow
viewport screenshots too when the layout is responsive-sensitive. Review the
actual images, not only tool output.

Review helper warnings for overlaps, active navigation, and attribution. Fix
accidental text/chrome collisions and indistinct active state. An intentional
overlap may use the explicit allow-overlap marker only when it remains readable.
Ensure attribution is visible and legible. Keep the kit style-neutral.
Re-run build, render, and inspection after fixes; report remaining advisory
warnings accurately.

## 5. Report completion

Report the route, created or changed files, build/render/visual checks run, and
any assumptions or remaining advisory warnings. Report failure plainly if a
required check cannot pass; never describe an unchecked presentation as done.
Use this compact report format:

```text
Route: /<slug>
Changed files: <paths>
Checks: build <result>; render <steps/routes>; visual review <viewports/steps>
Assumptions: <none or list>
Remaining warnings: <none or list>
```

## Out of scope

This skill creates browser presentations. It does not export PowerPoint,
Keynote, PDF, or image files, provide a visual editor, or publish/host the app.
Use a format-specific workflow for exports or a deployment workflow for hosting.
