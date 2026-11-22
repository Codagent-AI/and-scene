---
name: presentation
description: Create or modify browser presentations as one evolving diagram with stable entities, a reusable scene kit, and build/render verification.
---

# Presentation

Use this procedure to create or modify a presentation. Resolve this file's actual
installation directory first. All paths below, including `templates/bootstrap/`,
`templates/presentation/`, and `scaffold.mjs`, are relative to that directory,
never to the user's working directory.

## Gather

For a new presentation, gather the topic, visual direction, and the content and
visual description of each step. Ask only one question at a time. Do not invent
information the user can still supply. Explain that the user controls depth:
they may explicitly choose to build with partial detail and iterate. Once they
choose that, proceed with the captured material rather than imposing a
completeness gate. A complete prompt can proceed directly. Optionally show an
ASCII mockup for a key or complex layout; mockups are not required for every beat.
Capture title, paragraph caption, era, diagram state, and what persists or morphs
between consecutive beats. Treat the result as one evolving scene, not slides.

For modification, identify the target first. If unspecified or ambiguous, list
registered presentations and ask which to modify before changing files. Once
identified, ask only about the requested step, entity, or style changes. Preserve
other presentations and avoid restarting the create interview.

## Resolve infrastructure

Before either create or modify, inspect three semantic anchors:

1. A working Vite + React + TypeScript build setup (`npm run build`).
2. A scene kit providing Step/Scene contracts, active-stage entity morphs,
   navigation, browse/present chrome, captions/ToC, and fit scaling.
3. A presentation registry mapping presentations to separate routes.

Check capability, not byte identity. Different file names, formatting, and extra
dependencies do not justify replacement. If all anchors exist, reuse them. If
only some exist, add only missing anchors and their dependencies, preserving
existing infrastructure. In an already established presentation app, work there.

For an empty or standalone project, use the root. For a monorepo (package.json
workspaces, pnpm-workspace.yaml, or apps/ or packages/ layout), use a self-contained
`presentations/` app and preserve the monorepo root. If non-empty and missing the
kit or registry, state the resolved target and wait for explicit confirmation
before writes. Existing session authorization can satisfy confirmation when it
clearly approves this target.

`scaffold.mjs` provides conventional anchor detection and safe copying. Its
programmatic `anchors` option accepts the results of your semantic inspection;
use it when contracts live at nonconventional paths. Do not use conventional
file absence as grounds to overwrite a working anchor. CLI usage:

```sh
node /absolute/path/to/skill/scaffold.mjs /absolute/path/to/project --confirmed
```

The CLI installs dependencies. Without confirmation it refuses a non-empty target
missing kit or registry. Full scaffolding copies `templates/bootstrap/` relative
to this skill; partial scaffolding copies only missing groups and never overwrites
existing files. Review conflicts and integrate missing behavior without discarding
existing code. Ensure runtime react, react-dom, motion, lucide-react and build/dev
vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node,
the ESLint stack, and playwright are installed, even if the host appears similar.
Do not assume dependencies or Chromium are already available. Use the committed
lock data for a fresh scaffold; merge dependencies conservatively for a partial
app. Install Chromium with `npx playwright install chromium` when necessary.

## Generate or modify

Use `templates/presentation/` as a structural starting point. Create a unique
folder under `src/presentations/<slug>/` containing `entities.ts`, `steps/`,
`Talk.tsx`, and presentation-owned CSS. Add one explicit registry entry containing
slug, title, and a lazy `load` import. Preserve all existing entries and files.
The root landing page lists entries; each `/<slug>` route loads its presentation.

Use strongly typed Step payloads without casts at the Presentation boundary.
Adjacent states of the same diagram should share `groupKey` and Scene so the
instance persists and only payload changes. Continuing entities retain stable
layoutIds and are not wrapped in newcomer fades. Introduce new entities with
Appear after continuing layout motion settles; departing entities receive exit
motion. Preserve intentional readable stacks and overlaps. Use coordinate styles
or raw motion elements with stable layoutIds where primitives do not fit.

The kit owns behavior, fixed 880 × 380 canvas geometry, scaling, and stable
`data-presentation-*` hooks. It owns no presentation palette, font, spacing scale,
border, shadow, card/button treatment, or theme tokens. Put all visual design in
presentation or host files, using plain CSS unless the host already uses a
framework or the user explicitly requests one. Style active progress/ToC hooks
visibly differently and make the bottom-right attribution legible. Header brands
are host opt-in. Keep the default made-by link unless explicitly overridden.

## Verify before completion

Run `npm run build`, then a production browser render check for the generated or
modified route: `node scripts/verify.mjs --slug <slug>`. At minimum the first step
must render without runtime or console errors; this driver also traverses all
steps. The reference sample's full canonical gate is `npm run verify`. Fix any
build, browser, or transition failures and rerun affected checks before success.

Perform a browser visual composition check of first, last, and dense/key steps;
include a narrow viewport for responsive-sensitive content. Prefer
`npm run inspect -- <slug>`: it uses local dependencies, a production preview,
settled captures, and predictable project-local artifacts. For narrow captures:
`npm run inspect -- <slug> --width 390 --height 844`. If the helper is unavailable,
write any temporary browser helper under the project root, never outside it.
Use AXI for interactive browser inspection when available, starting with a DOM
snapshot then inspecting settled screenshots.

Check that important content fits the canvas, readable intentional overlaps stay
intact, and no content collides accidentally with captions, ToC, progress, or nav.
Review every warning's step and affected elements. Fix accidental overlap,
indistinct active controls, and missing, tiny, or browser-default attribution.
Mark an overlap-allowed subtree only for an intentional readable composition;
never use exemptions to silence accidental collisions. Recheck after fixes.
Screenshots and advisory warnings support composition review; they do not certify
visual quality automatically. Do not report completion until build, render, and
composition checks pass. Report performed checks and remaining advisory status
accurately, and leave existing presentations reachable.
