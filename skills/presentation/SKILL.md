---
name: presentation
description: Creates and modifies browser presentations as evolving scenes with named steps. Activates for requests to create a browser presentation, build an interactive talk, or edit presentation steps.
---

# Presentation skill

Create and maintain a browser presentation as a single scene that changes through named steps. Follow the user's requested scope and keep each presentation self-contained.

## Out of Scope

This skill creates browser-based, interactive presentations. It does not create PowerPoint files, PDF exports, or conventional static slide decks. For those requests, use an appropriate document or slide-generation workflow and preserve the requested output format.

## 1. Gather what is missing

Use details already present in the request. When information is missing, ask exactly one concise question at a time, in this order where applicable:

1. What is the topic and intended audience?
2. What visual style should the presentation use?
3. What should each step explain, and what should be visible or change in that step?

Do not invent details the user can provide. Ask for the desired depth or number of steps when it is not clear. The user may explicitly proceed with partial detail; use the captured information, make only necessary implementation choices, and allow iteration. A mockup is optional for a visually complex step; use one only when it would help confirm layout.

## 2. Identify the operation and target

For a modification, inspect the presentation registry first. If the requested target is missing or ambiguous, list the existing presentations and ask which one to change before editing. Ask only about the requested modification; do not repeat the creation interview.

Resolve this skill's directory from the location of this `SKILL.md` file. All template paths below are relative to that directory, never the agent's current working directory.

Detect the three contract anchors before creating or modifying anything:

- **Build setup:** a Vite + React + TypeScript application with a working `npm run build`.
- **Scene kit:** `Step`/`Scene` contracts, an active-step stage with entity morph support, navigation and browse/present chrome, and a fit-scaled canvas. Names may differ; inspect behavior rather than requiring byte-identical files.
- **Presentation index:** a registry mapping multiple presentation slugs to their own routes.

If all three anchors exist, reuse them. If some are missing, scaffold only those parts and their needed dependencies. For a full scaffold, materialize `templates/bootstrap/`. Use `templates/presentation/` and `templates/step/` as starting points for generated artifacts; adapt them to the user's content.

Choose the scaffold target as follows:

- In an empty standalone directory, scaffold at its root.
- In a standalone project, scaffold at its root while preserving existing files.
- In a monorepo (workspace declaration, `pnpm-workspace.yaml`, or `packages/` / `apps/` layout), create a self-contained app under `presentations/` rather than changing root build setup.
- If already inside a presentation app, use that app and fill only missing anchors.

Before writing into a non-empty unscaffolded project, state the exact target path and what existing files the scaffold may touch, then wait for confirmation. Never overwrite an existing presentation or unrelated file. A partial scaffold must preserve present anchors and unrelated content.

The bootstrap includes React, React DOM, Motion, Lucide, Vite, TypeScript, React type packages, Node types, ESLint, and Playwright. Install dependencies after materializing or updating the scaffold. Do not add Tailwind or another styling framework unless the host already uses it or the user requested it.

## 3. Create or modify the presentation

Create each new presentation in its own directory under the app's presentations source, with its entry component, step components, entity identifiers, and presentation-owned CSS as needed. Register it in the explicit presentation index so its own slug routes to it. Preserve all existing registry entries, files, and routes.

For modifications, edit only the selected presentation and the necessary registry or shared integration points. Keep the request's scope; do not redesign unrelated steps.

Represent the work as an evolving scene. Keep stable entities under stable IDs as they persist; add, move, connect, emphasize, or remove them across successive steps. Every step needs a distinct title, era/section, caption, and meaningful visual state. Avoid making a sequence of unrelated slide canvases.

Use the generic kit primitives and hooks. The reusable kit owns behavior and geometry, not visual style. Fit scaling reserves the header, footer, and side space in the kit's `STAGE_LAYOUT` (including the taller `narrowBrowse` footer), so keep presentation or host chrome and `.presentation-stage` insets within those reservations. Put the designed look in the presentation's own plain CSS (or the host's existing styling system): own colors, typography, spacing, borders, shadows, and control treatments there. Make captions readable, active progress or table-of-contents state obvious, and attribution legible. Mark overlap as intentional only when it remains readable.

## 4. Verify before reporting completion

From the app root:

1. Run `npm run build` and fix all type/build failures.
2. Run `npm run verify` when available. Otherwise start a local preview on `127.0.0.1`, open the generated route with the project-local browser tooling, and check at least its first step for runtime and console errors.
3. Prefer `npm run inspect -- <slug>` to capture settled screenshots and review advisory diagnostics. If no project helper exists, put any temporary Playwright helper under the project root.
4. Inspect the first and last steps and the densest or most visually important step. Check a narrow viewport when the layout is responsive-sensitive. Confirm important content fits the canvas, captions and controls do not collide with the scene, intentional overlaps remain readable, and active chrome and attribution are clear.
5. Fix every build/render failure. Review each overlap or chrome warning, fix accidental collisions and indistinct active state, and rerun the checks. Keep an allow-overlap marker only for intentional readable overlap.

Report completion only after checks pass. State the route, key changed files, build/render/visual checks run, and any remaining advisory warnings accurately. Never claim a check that was not performed.
