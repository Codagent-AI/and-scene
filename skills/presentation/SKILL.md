---
name: presentation
description: Create or modify an evolving-scene browser presentation in this project.
---

# Presentation skill

Use this procedure to create a new presentation or make a scoped change to an
existing one. A presentation is one scene evolving through steps, not a set of
unrelated slide layouts.

## 1. Gather what the user wants

First determine whether the request is to create or modify.

For a new presentation, collect the topic, visual direction, and each step's
content and visual intent. Ask only for missing information, one question at a
time. Let the user decide how much detail to provide. If they choose to proceed
with partial details, use only what they supplied and make reasonable, clearly
revisable implementation choices; do not block on a completeness checklist.
Offer a small ASCII layout sketch only when a key or complex scene would benefit
from confirming spatial intent.

For a modification, first identify the target presentation. If the request does
not clearly name one, list the registered presentations and ask which one to
change. Once selected, ask only about the requested edit; do not restart the
new-presentation interview.

If the original request already gives the topic, style, and step descriptions,
proceed without redundant questions.

## 2. Resolve the app and scaffold missing anchors

Resolve paths to this skill's files from the directory containing this
`SKILL.md`, never from the caller's current working directory. The distributable
templates are under `templates/` next to this file.

Inspect the project and detect these three anchors by their contracts, not by
exact filenames or byte comparison:

1. A working Vite + React + TypeScript app with `npm run build`.
2. A reusable scene kit that exposes a typed Step/Scene contract, active-step
   host with entity morph support, present/browse navigation and chrome, and a
   fit-scaled design canvas.
3. An explicit presentation registry mapping presentation slugs to their own
   routes.

If all exist, reuse them. If only some exist, add only missing infrastructure;
preserve existing anchors and unrelated presentations. The bootstrap snapshot
is a reference implementation for missing anchors, not permission to overwrite
existing project work. Required dependencies must be ensured even if an anchor
already exists: React, React DOM, Motion, Lucide React, Vite, the React Vite
plugin, TypeScript, React/Node type packages, ESLint and its React/TypeScript
stack, and Playwright. Install with the project's package manager and update its
lockfile. Do not add Tailwind or another styling framework unless the host
already uses it or the user asked for it.

Resolve the target before writing:

- Empty directory or standalone app: scaffold at the repository root.
- Monorepo (workspace declaration, `pnpm-workspace.yaml`, or `apps/` / `packages/`
  layout): make a self-contained app in `presentations/`.
- Already inside an app with all three anchors: use that app and scaffold only
  any missing anchors.

If a non-empty project is missing any required anchor, state the target path and
proposed files, then wait for the user's confirmation before writing there. This
confirmation is specific to writing into an existing, unscaffolded project.

## 3. Create or modify in scope

Create each new presentation in its own `src/presentations/<slug>/` folder. Keep
its entities, steps, and visual CSS local to that folder, then add one explicit
registry entry. Never replace or disturb existing presentations. When modifying,
confine edits to the selected presentation and the requested change, plus a
necessary registry or verification adjustment.

Use the presentation template as a starting shape and the step template for
each scene. Compose generic primitives from the scene kit; keep stable entity
IDs consistent as entities move between steps. Give every step a distinct title,
era, caption, and concise diagram description. The fixed scene canvas is
880 × 380 by default; arrange scene layers within that canvas rather than relying
on page reflow.

The kit owns behavior, geometry, and stable data hooks. It must not own colors,
fonts, spacing systems, borders, shadows, card or button treatments, or theme
tokens. Put the designed appearance in the presentation's plain CSS by default.
Honor an existing host styling system when present or one explicitly requested.
Make active navigation visibly distinct and attribution legible in presentation
or host CSS.

## 4. Verify and inspect before reporting success

Run the build and a browser render check for the new or modified route. At
minimum, render its first step with no runtime or console errors. Then inspect
settled browser screenshots of the first step, last step, and every dense or
visually important step; use a narrow viewport too when the composition is
responsive-sensitive. Prefer the project-local screenshot helper:

```sh
npm run build
npm run inspect -- <slug>
```

Use `npm run verify` as well when available. If no local inspector exists, use
the project's browser tooling or put any temporary helper under the project
root. Review warnings about collisions, active navigation, and attribution.
Fix accidental overlap or unreadable chrome; mark an overlap intentional only
when it remains readable. Repeat the checks after fixes. Do not report success
while a build, render, or visual issue remains.

## 5. Completion report

Report the target route, files or presentation scope changed, build/render
commands run, and the steps/viewports visually inspected. State any unresolved
advisory warning accurately.
