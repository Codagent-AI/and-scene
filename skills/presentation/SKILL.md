---
name: presentation
description: Create or modify browser presentations as one evolving scene, with a reusable React kit, self-bootstrapping templates, and build/render/visual verification.
---

# Presentation

Create a presentation from a topic, or make a scoped change to an existing one.
A presentation is one evolving diagram: stable entities accumulate or change
through named steps. It is not a collection of independent slide layouts.

## Gather

First determine whether this is creation or modification. For creation, collect
the topic, visual style, and each step's content and visual description. Ask for
missing information **one question at a time**; do not invent details the user
can still provide. Invite the user to choose how much detail to give. If they
explicitly choose to build with partial detail, proceed from the captured
material and iterate; there is no completeness gate. A complete prompt can go
straight to building. Optionally draw an ASCII mockup for key/complex layouts,
not every step. Capture narrative beats, titles, captions, and which entities
continue, enter, leave, or change at each beat.

For modification, identify the target first. If unspecified or ambiguous, list
registered presentations and ask which to modify before editing. Once identified,
ask only about the requested steps, entities, or style changes. Do not restart
the create interview. Preserve unrelated presentations and their registrations.

## Resolve the target and scaffold

Resolve `templates/bootstrap/` and `templates/presentation/` relative to the
parent directory of **this SKILL.md**, never relative to the caller's working
directory. Use absolute resolved paths when copying. The bootstrap is a release
snapshot, not a directory to edit while creating a presentation.

Inspect three contract anchors, using their behavior rather than exact filenames
or formatting:

1. Vite + React + TypeScript build setup with working `npm run build`.
2. A reusable scene kit with typed Step/Scene contracts, morphing stage, fit
   canvas, present/browse navigation, captions and contents chrome.
3. An explicit presentation registry and route handling for multiple entries.

Extra dependencies and cosmetic variations do not invalidate an anchor.
If already inside a presentation app, reuse it. Otherwise detect monorepos using
package.json `workspaces`, pnpm-workspace.yaml, or packages/ or apps/ layouts:
put a self-contained app at `<repository>/presentations/`. In an empty or
standalone non-monorepo project, target the root. Never mutate the monorepo's
root build configuration to install the presentation app.

If a non-empty project lacks the kit or index, state the exact proposed target
and wait for user confirmation before writing. Do not treat silence as consent.
In the resolved app, add all anchors if none exist, only missing anchors if
partial, and skip scaffolding when all exist. Preserve working anchors and
unrelated content; merge necessary scripts/dependencies instead of replacing an
existing package file. For an empty target copy the full bootstrap, including
hidden files and lock data. For partial scaffolding use only corresponding
missing assets, adapt imports/routes to existing anchors, and regenerate lock
data after dependency merges. The starter route is removable only if it is the
unused bootstrap starter, never an existing authored presentation.

Ensure runtime dependencies react, react-dom, motion, lucide-react and development
dependencies vite, @vitejs/plugin-react, typescript, @types/react,
@types/react-dom, @types/node, @eslint/js, eslint, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, globals, typescript-eslint, and playwright.
The bootstrap also includes Vitest and testing dependencies for its fast tests.
Install declared dependencies (`npm ci` for intact lock data; `npm install` after
merging declarations), and install Chromium with `npx playwright install chromium`
if absent. Do not assume host dependencies or browsers exist.

The scaffold and kit have no default presentation styling and no required CSS
framework. Do not add Tailwind, plugins, colors, fonts, spacing tokens, borders,
shadows, card/button defaults, or a theme to the reusable kit or blank scaffold.
Use presentation-owned plain CSS by default. Reuse another styling framework
only when the host already uses it or the user explicitly requests it.

## Create or modify

Create `src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, and local
CSS. Start from the presentation templates and import the existing kit. Add one
explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry;
keep all existing entries and routes reachable. Check for slug collisions before
writing. The landing page enumerates the explicit registry. Do not use glob
registration or add a router dependency.

Each step needs stable id, era, presenter one-line title, browse paragraph
caption, Scene and typed payload. Number steps by array position. Use the same
Scene component and groupKey for adjacent states of the same evolving diagram;
update payload without remounting. Keep persisting entity layoutIds stable and
do not wrap continuing entities in repeatedly keyed newcomer fades. Introduce
new entities after layout motion settles; animate departures out. SceneLayer
preserves absolute composition. Raw motion elements with stable layoutIds are
appropriate when primitives do not match a shape. Keep intentional stacking,
not a forced spread-out layout. Default canvas: 880 × 380, uniformly scaled;
use literal coordinates when helpful.

Presentation owns color, typography, spacing and chrome treatments. Style
`[data-presentation-active="true"]` so active progress/contents differ visibly;
style `[data-presentation-attribution]` so the bottom-right GitHub disclosure is
legible (at least 11px, intentional colors, not browser-default link styling).
No default top-left brand is supplied; host branding is explicit.
Provide complete captions and next/previous navigation via Presentation. Preserve
keyboard, swipe, clamping, direct-jump, and mode behavior. Scoped modifications
must not alter unrelated presentations or the shared kit just to restyle one.

## Verify and repair before completion

Run `npm run build`. Run `node scripts/verify.mjs <slug>` for the generated or
modified route: it builds and checks every step, satisfying the minimum clean
first-step requirement. In this repository also run `npm run verify` for the
canonical nine-step reference. In a fresh bootstrap `npm run verify` initially
checks starter; update that script to the authored default route as appropriate.
Do not weaken canonical reference validation in the source repository.

Use the project-local `npm run inspect -- <slug>` helper when available. It uses
local Playwright, production preview at 127.0.0.1, waits for animations to settle,
and writes screenshots and advisory diagnostics to
`artifacts/inspection/<slug>/`. If no helper exists, create any temporary
Playwright helper **under the project root** so local dependencies resolve.

Inspect the first, last, and dense/key-step screenshots or equivalent browser
views. For responsive-sensitive presentations also capture and inspect a narrow
viewport. With AXI available, use `chrome-devtools-axi` (snapshot before
screenshots) for interactive inspection, not its underlying MCP server. Check
important content fits the canvas, intended overlaps remain readable, and text
and scene content avoid captions, contents, progress and navigation chrome.
Review every warning at the cited step. Fix accidental collisions, indistinct
active chrome, and unpolished attribution locally. Only intentional readable
compositions may receive `data-presentation-allow-overlap` on the smallest
appropriate subtree. Never blanket-exempt a scene to silence warnings.

Build/render failures and incoherent visual compositions must be repaired and
rechecked before reporting success. Advisory warnings are not automated taste
scores; review their cited views, fix real defects, and accurately report any
remaining advisory status. Report the route, changed files, commands and outcomes,
and visual review coverage. Clean up temporary browser/preview processes and do
not commit build output, dependencies, or screenshots.
