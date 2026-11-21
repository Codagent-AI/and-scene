---
name: presentation
description: Create or modify a browser presentation that evolves one diagram through named steps. Use when asked to turn a topic into a presentation or to change an existing And Scene presentation.
---

# Presentation

Resolve template paths from the directory containing this `SKILL.md`, even when
the working directory is elsewhere. Bootstrap files live in
`templates/bootstrap/` and the authoring example in `templates/presentation/`.

## 1. Gather the brief

For creation, use the topic, visual style, and step details already provided.
Ask for the next missing detail one question at a time. For each proposed step,
gather what it says and what the diagram will show or change. Don't fill in a
detail while the user is still deciding it. If the user chooses to build with
partial detail, use what they have provided and leave room to iterate. Start
building immediately when the brief is complete. An ASCII sketch can help
confirm the layout of a key or complex step.

For modification, identify the target from the presentation registry first. If
the request leaves the target unspecified or ambiguous, list the entries and
ask which one to modify before making edits. Ask only about missing details
for the requested changes. Keep the remaining steps, entities, style, and
other presentations intact.

## 2. Locate and prepare the application

Check for these three anchors by what each provides. Existing names, directory
layout, formatting, and extra dependencies can differ from the templates.

1. A Vite, React, and TypeScript application with a working `npm run build`.
2. A reusable scene kit with a typed step and scene contract, a fitted stage
   with stable entity morphs, and present/browse navigation and chrome.
3. A presentation index that maps registered presentations to distinct routes.

If already in an And Scene application, use that application. Otherwise check
the repository root for npm-compatible `workspaces` metadata, a
`pnpm-workspace.yaml`, or a workspace-style `packages/` or `apps/` layout. For a
monorepo, resolve a self-contained app at `<repo>/presentations/` and preserve
root setup and unrelated files. If that app exists, evaluate its anchors there.
For an empty or standalone project use the repository root (the current
directory for an empty target outside a repository).

When all three anchors are present, proceed to the work. If scaffolding is
needed in a non-empty project, state the resolved location and the missing
anchors, then obtain confirmation before making any scaffold writes there.
For an empty target, copy the full bootstrap. If a non-empty target has none
of the anchors, add all three from the bootstrap while preserving unrelated
files. For a partial app, add only the missing anchors, their required
dependencies, and wiring to existing contracts. Merge scripts and configuration
as needed and retain working setup, registries, and presentation files.
Use the startup registry entry from the template as an example when merging
into an existing app.

Install dependencies before generating the presentation. For a full unchanged
bootstrap, run `npm ci --workspaces=false` from the app directory to use its
own lockfile even when the parent workspace includes that directory. When
merging into an existing app, update its manifest and lockfile with its
package manager. For a self-contained app inside an npm workspace, run
`npm install --workspaces=false` from the app directory. Ensure React,
React DOM, Motion, Lucide React, Vite, Vite's React plugin, TypeScript, the
React/React DOM/Node types, ESLint and its TypeScript/React configuration, and
Playwright are installed. Use Playwright's Chromium installation if the
environment does not already provide the browser. Include the verification
and screenshot helper scripts from the bootstrap when missing. Keep the
bootstrap and kit independent of any styling framework.

## 3. Create or edit the presentation

Use the presentation template as an example. For a new presentation, choose an
available URL slug and create its own folder alongside the existing
presentations. Keep its stable entity ID namespace in `entities.ts`, its
ordered step definitions and scenes under `steps/`, and its entry in
`Talk.tsx`. Append a registry entry with the slug, title, and lazy entry import.
Preserve existing entries and their routes. For an edit, change the selected
presentation within the requested scope and retain stable IDs for entities
that continue.

Design one evolving scene on the kit's fixed canvas. Give every step a stable
ID, an era label, a one-line presenter title, a readable browse caption, and a
diagram state. Prefer a shared scene group for adjacent variations of one
diagram. Keep continuing entities mounted with the same React keys and
Motion layout IDs, and update their state in place. Use `SceneLayer` and
`Appear` for entering and exiting entities. Use the exposed classes, hooks,
and styles for exact coordinates or compose raw Motion elements with stable
layout IDs when needed.

Use presentation-local plain CSS by default. An existing host styling system
or a framework explicitly requested by the user is also supported. Leave
visual treatments out of the kit. Style the active progress and ToC hooks to
distinguish the current step, and style `[data-presentation-attribution]` to
keep the disclosure legible.

## 4. Verify before reporting success

Run the project's production build and verify the created or modified route
in a browser, at least through the first step, checking for runtime and
console errors. With the bundled tools, run `npm run verify -- <slug>` for a
build and production render check through the route's steps. If that command is
absent, run `npm run build` and use a project-local Playwright script against
the production preview. Wait for the first scene and fail the check on
`pageerror` or a console error. Resolve any build, navigation, or render
errors and repeat the affected check.

Prefer `npm run inspect -- <slug>` when the local helper is available. It uses
the project's browser dependencies and writes settled per-step screenshots
under `.presentation-inspection/`. Use `--width 390 --height 844` (or the
relevant narrow size) for responsive-sensitive output. If there is no local
helper, place any temporary Playwright script inside the project root, wait
for transitions to settle, and remove the temporary script once finished.

Review screenshots or equivalent browser views of the first step, last step,
and dense or key steps. Review those representative steps at the narrow
viewport for responsive-sensitive presentations. Check that important scene
content fits, important diagram labels remain readable after scaling,
intentional stacking remains readable, and content clears
captions, the table of contents, progress indicators, and other controls.
Review every overlap or chrome warning against the indicated step. Fix
accidental collisions, weak active state, and unpolished attribution.
Apply `data-presentation-allow-overlap` only to the smallest subtree whose
overlap is intentional and readable. Repeat inspection after repairs.

Report the route, checks that passed, and any remaining advisory warnings
after the generated or modified presentation clears the build, render, and
visual review gates.
