---
name: presentation
description: Creates or modifies browser presentations as one evolving diagram using the local scene kit. Use when the user asks to “make a presentation,” “create a talk or slide deck,” “add or edit a step,” or mentions presentation steps, the scene kit, or an evolving diagram.
---

# Presentation skill

Create browser presentations as a single diagram that evolves through named beats. Use the scene kit for behavior and geometry; keep visual design in each presentation's CSS. Follow this procedure from any working directory. See [reference guide](references.md) for the kit API, DOM hooks, and inspection warnings.

## 1. Understand the request

Decide whether the user wants a new presentation or a modification. Use details already supplied; don't ask for them again. For creation, gather missing information one question at a time:

1. Ask for the topic and intended audience if unclear.
2. Ask for the visual direction (palette, mood, typography, reference, or permission to choose) if absent.
3. Establish the ordered steps. For each step, capture its narrative point and what the viewer should see/change in the diagram. Ask about missing steps or details rather than inventing them. The user may choose to proceed with partial detail; record what's known, make the remaining choices conservatively, and keep the result easy to revise. Do not impose a completeness gate.

Ask exactly one question per turn. Show an ASCII sketch only when a step has five or more interacting entities or a non-linear layout; ask whether it matches before implementation. If the user declines to provide more detail, proceed with the known details, choose only the unspecified implementation details, and keep them easy to revise.

For a modification, identify the target first. If the request names no presentation or could refer to more than one, list the registered presentations and ask which one. Once selected, ask only about the requested change; don't repeat the creation interview.

## 2. Resolve the app and scaffold only missing pieces

The `templates/` directory is next to this `SKILL.md`. Resolve it from the skill file's own location, never from the caller's current working directory.

Inspect the target repository before editing. Detect these three anchors at contract level, not by exact filenames or formatting:

- **Build setup:** a Vite + React + TypeScript application with a working `npm run build`.
- **Scene kit:** a reusable `Step`/`Scene` contract, active-step host with entity continuity/motion, present/browse navigation and chrome, and fit-scaled canvas.
- **Presentation index:** an explicit or equivalent registry mapping multiple presentations to individual routes.

If all anchors exist, reuse them. If one or more are absent, scaffold only the missing infrastructure and dependencies; do not overwrite existing anchors or unrelated project files. Start with `templates/bootstrap/` and merge in this order: (1) add missing package dependencies and scripts while preserving existing declarations, (2) copy only missing `src/presentation-kit/` files, (3) add missing registry/index, (4) add missing router and route integration, (5) add missing host/build configuration. Use `templates/presentation/Presentation.tsx`, `entities.ts`, `steps.tsx`, `presentation.css`, and `templates/step/Step.tsx` for generated presentation files. If an existing anchor has a different shape, adapt the generated integration to it rather than replacing it.

Resolve the target before writing:

- An empty directory or standalone app uses its root.
- A monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` or `apps/` layout) gets a self-contained app under `presentations/`.
- An already scaffolded presentation app is the target itself.

For a non-empty, unscaffolded project, state the resolved target and ask the user to confirm before writing. Continue independent inspection while awaiting confirmation; do not write into that target before it is confirmed. Do not ask for confirmation for an empty directory or an already scaffolded app.

The bootstrap dependency contract includes React, React DOM, Motion, Lucide React; Vite, its React plugin, TypeScript and React/Node types; ESLint and its configured plugins; and Playwright for local browser inspection/verification. Ensure these are declared and installed when scaffolding; don't assume the host already has them. Do not add Tailwind or another styling framework unless already used by the host or explicitly requested.

## 3. Create or modify

For a new presentation, create one self-contained directory with its own entity IDs, step components, and presentation-owned plain CSS, then add one route entry to the presentation index. Choose a unique URL slug and check for collisions first. Preserve every existing presentation and registry entry. Use the `templates/presentation/` and `templates/step/` examples as shape guidance, adapting names and content.

Each step has a stable ID, section/era, presenter title, browse caption, diagram state, and position-derived number. The `Step<TPayload>` fields are `id`, `era`, `title`, `caption`, optional `groupKey`, `payload`, and `Scene`; the number comes from array order. Compose generic kit primitives with their required `entityId` or raw motion elements with stable `layoutId`s. Keep continuing entities identifiable across states; introduce new entities after existing elements settle, and animate departing entities out. Group adjacent beats that update the same diagram. Avoid creating disconnected slide-like scenes when the explanation is meant to accumulate. Use `[data-presentation-allow-overlap]` only on an intentional, readable overlapping subtree.

For modifications, edit only the selected presentation and the minimal necessary registration or host integration. Preserve other presentations and unrelated files. Put colors, type, spacing, borders, shadows, and component treatments in presentation-owned CSS (or existing host styling), never in reusable kit primitives or the bootstrap kit.

## 4. Verify and inspect before completion

Repeat this sequence until each check passes:

1. Run `npm run build`; fix type or build failures.
2. Run `npm run verify` when available. Otherwise use the project's browser smoke check for the route and first step. Fix runtime or console errors.
3. Run `npm run inspect -- <slug>` to capture all steps at the helper's standard 1440px desktop viewport. When no project-local helper exists, create `scripts/inspect-presentation-temp.mjs` inside the app root, use its local Playwright dependency, then remove it.
4. Review screenshots for the first, last, and densest/key steps. Also inspect at 390px viewport width when composition may be responsive-sensitive. Check fit, readable intentional overlap, no text/chrome collisions, distinct active progress/TOC, and legible attribution. Review overlap, active-state, and attribution warnings. Fix accidental collisions and indistinct chrome; mark only intentional readable overlap with `[data-presentation-allow-overlap]`.
5. After any fix, rerun the affected check and repeat inspection for changed visuals. Do not report success while build or render checks fail.

## 5. Report

Report using all of these fields, marking any inapplicable field `N/A`: **Presentation:** title; **Route:** `/<slug>`; **Files changed:** paths; **Scene choices:** continuity and visual decisions; **Checks run:** build, verify/render, inspect with pass/fail/not run for each; **Remaining warnings:** exact advisory warnings or `None`. Do not claim checks that were not run.

## Out of scope

- Exporting PowerPoint, PDF, or Keynote: offer the browser presentation route or suggest a dedicated export tool when an export is requested.
- Building disconnected, conventional slide decks: keep the explanation as one evolving scene; if the user explicitly wants independent slides, direct them to a slide-authoring tool.
- Supporting non-React hosts: use the host's own presentation tooling or request a React app target.
- Adding a visual theme or styling framework to the reusable kit: put the look in presentation-owned CSS; only configure a framework when the host already uses it or the user asks for it.
