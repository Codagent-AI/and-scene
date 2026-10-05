---
name: presentation
description: Create or modify browser presentations as one evolving diagram using the local scene kit. Use when asked to make a presentation from a topic or to change an existing presentation.
---

# Presentation skill

Create browser presentations as a single diagram that evolves through named beats. Use the scene kit for behavior and geometry; keep visual design in each presentation's CSS. Follow this procedure from any working directory.

## 1. Understand the request

Decide whether the user wants a new presentation or a modification. Use details already supplied; don't ask for them again. For creation, gather missing information one question at a time:

1. Ask for the topic and intended audience if unclear.
2. Ask for the visual direction (palette, mood, typography, reference, or permission to choose) if absent.
3. Establish the ordered steps. For each step, capture its narrative point and what the viewer should see/change in the diagram. Ask about missing steps or details rather than inventing them. The user may choose to proceed with partial detail; record what's known, make the remaining choices conservatively, and keep the result easy to revise. Do not impose a completeness gate.

A compact prompt may collect one step's narrative and visual intent together, but ask only one question per turn. For a visually consequential or complex composition, optionally show a small ASCII sketch and ask whether it matches before implementation. Do not require sketches for routine steps.

For a modification, identify the target first. If the request names no presentation or could refer to more than one, list the registered presentations and ask which one. Once selected, ask only about the requested change; don't repeat the creation interview.

## 2. Resolve the app and scaffold only missing pieces

Resolve this skill's directory from the location of this `SKILL.md` (for example, in a Node helper use `new URL('./templates/bootstrap/', import.meta.url)`), then resolve templates beneath `templates/`. Never locate templates relative to the caller's current working directory.

Inspect the target repository before editing. Detect these three anchors at contract level, not by exact filenames or formatting:

- **Build setup:** a Vite + React + TypeScript application with a working `npm run build`.
- **Scene kit:** a reusable `Step`/`Scene` contract, active-step host with entity continuity/motion, present/browse navigation and chrome, and fit-scaled canvas.
- **Presentation index:** an explicit or equivalent registry mapping multiple presentations to individual routes.

If all anchors exist, reuse them. If one or more are absent, scaffold only the missing infrastructure and dependencies; do not overwrite existing anchors or unrelated project files. Use `templates/bootstrap/` as the complete baseline and merge only the missing parts. Use the standalone templates for a presentation and its steps. If an existing anchor has a different shape, adapt the generated integration to it rather than replacing it.

Resolve the target before writing:

- An empty directory or standalone app uses its root.
- A monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` or `apps/` layout) gets a self-contained app under `presentations/`.
- An already scaffolded presentation app is the target itself.

For a non-empty, unscaffolded project, state the resolved target and ask the user to confirm before writing. Continue independent inspection while awaiting confirmation; do not write into that target before it is confirmed. Do not ask for confirmation for an empty directory or an already scaffolded app.

The bootstrap dependency contract includes React, React DOM, Motion, Lucide React; Vite, its React plugin, TypeScript and React/Node types; ESLint and its configured plugins; and Playwright for local browser inspection/verification. Ensure these are declared and installed when scaffolding; don't assume the host already has them. Do not add Tailwind or another styling framework unless already used by the host or explicitly requested.

## 3. Create or modify

For a new presentation, create one self-contained directory with its own entity IDs, step components, and presentation-owned plain CSS, then add one route entry to the presentation index. Choose a unique URL slug and check for collisions first. Preserve every existing presentation and registry entry. Use the `templates/presentation/` and `templates/step/` examples as shape guidance, adapting names and content.

Each step has a stable ID, section/era, presenter title, browse caption, diagram state, and position-derived number. Compose generic kit primitives or raw motion elements with stable layout IDs. Keep continuing entities identifiable across states; introduce new entities after existing elements settle, and animate departing entities out. Group adjacent beats that update the same diagram. Avoid creating disconnected slide-like scenes when the explanation is meant to accumulate.

For modifications, edit only the selected presentation and the minimal necessary registration or host integration. Preserve other presentations and unrelated files. Put colors, type, spacing, borders, shadows, and component treatments in presentation-owned CSS (or existing host styling), never in reusable kit primitives or the bootstrap kit.

## 4. Verify and inspect before completion

Run the target app's `npm run build` and fix errors. Render the presentation route in a real browser; at minimum check the first step for runtime errors. Traverse every step when the app's `npm run verify` exists. Use the project-local screenshot helper when available (`npm run inspect -- <slug>`); otherwise create any temporary Playwright helper under the project root and remove it afterward. Do not put helper scripts or screenshots in a global temp directory.

Inspect settled screenshots or browser views of the first, last, and densest/key steps. If the layout may be viewport-sensitive, also inspect a narrow viewport. Check that the fixed-canvas composition fits, captions and controls do not collide with content, intentional overlaps remain readable, active progress/TOC state is distinct, and attribution is legible. Review every helper warning: fix accidental collisions and indistinct chrome; mark only intentional readable overlap with the supported allow-overlap hook. Re-run the relevant checks after fixes. Never report success while build or render checks fail.

## 5. Report

Summarize the presentation created or modified, its route, notable visual/scene choices, and checks actually completed. Mention any remaining advisory visual warnings accurately. Do not claim checks that were not run.
