---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a reusable React scene kit and production verification.
---

# Presentation

Use this workflow for a new presentation or a scoped edit. A presentation is one
scene developing through named steps, with stable entities, rather than unrelated
slides. `Talk.tsx` is simply the entry component filename.

## Gather the story

For creation, first read the supplied prompt. If topic, visual direction, and the
content and visual description of every intended step are already supplied,
proceed. Otherwise ask **one question at a time**: topic, look, then each beat's
content and visual description. Capture a title, paragraph caption, era, scene
state, and what continues or changes between beats. Do not invent details while
the user can still provide them. The user controls depth: offer to build from the
captured partial detail and iterate when they choose; never require every field
to be exhaustively specified. For a key or complex layout, optionally offer an
ASCII mockup to confirm relationships; do not require one for every step.

For modification, identify the target before edits. If unspecified or ambiguous,
list the registry's presentations and ask which one to change. Once identified,
ask only about the requested changes to steps, entities, or appearance. Reuse the
existing story; do not restart the creation interview.

## Resolve the app and scaffold missing contracts

Resolve all paths below relative to **this SKILL.md's directory**, not the caller's
working directory. `templates/bootstrap/` is a distributable app snapshot;
`templates/presentation/` is an authoring example. `scripts/scaffold.mjs` can copy
missing infrastructure without overwriting files.

Inspect the target project semantically for three anchors:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A reusable scene kit with typed Step/Scene, motion stage, navigation,
   present/browse chrome, and fit scaling.
3. A presentation index that registers independent routes.

Judge these by their contracts, not matching filenames, formatting, extra
dependencies, or byte identity. Pass the confirmed present anchor names (`build`,
`kit`, `index`) to the helper; do not rely on the example layout to detect them.
If all three are present, reuse the app and skip scaffolding. If only some are
present, add only missing anchors and their dependencies; preserve working
configuration and adapt imports/router integration to the host.

If already inside a presentation app, use it. When invoked at a monorepo root,
inspect an existing `presentations/` app **before planning any scaffold**. Detect
its three contracts semantically, including custom file layouts, just as for the
root. Reuse a complete nested app without adding example files or restoring
removed template entry points. For a partial nested app, scaffold only its missing
contracts. Pass its confirmed anchor names as `--target-anchors build,kit,index`
(or `--target-anchors none` after confirming none are present); these describe the
resolved nested app, while `--anchors` describes the invocation root. The helper
refuses to plan writes into an existing non-empty nested target until that
inspection is supplied. Alternatively invoke the helper directly inside the
resolved app with its own `--anchors`.

Otherwise a standalone or empty
project targets its root. A monorepo, identified by package.json `workspaces`,
`pnpm-workspace.yaml`, or `packages/` or `apps/`, targets a self-contained app at
`presentations/`; leave the monorepo root build and unrelated files alone. A build
anchor in the monorepo root is not the new presentation app's build anchor.
Before writing into **any non-empty project missing the kit or index**, state the
resolved target and wait for user confirmation. Do not treat planning as consent.

Optional helper, using an absolute skill directory resolved from this file:

```sh
node "$SKILL_DIR/scripts/scaffold.mjs" /absolute/project --anchors build
# Prints target and plan without writing. After required confirmation:
node "$SKILL_DIR/scripts/scaffold.mjs" /absolute/project --anchors build --apply --confirm
```

Omit `--anchors` for a fully unscaffolded project. In a monorepo the helper resolves
`presentations/` and does not carry the root's partial anchors into that app; use
`--target-anchors` to retain contracts already present in an existing nested app.
If a nonstandard host already implements an anchor elsewhere, preserve it and
integrate the missing template pieces deliberately rather than blindly copying
entry points. The helper preserves existing package metadata, including an absent `type`,
`private`, or `version`; it merges only missing scripts and dependencies. It never
overwrites an existing file; resolve conflicts by
integrating only missing contracts. An existing index is preserved in full.

Ensure runtime dependencies `react`, `react-dom`, `motion`, `lucide-react` and
build/dev dependencies `vite`, `@vitejs/plugin-react`, `typescript`,
`@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`,
`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`,
`globals`, and `playwright`. Install them rather than assuming they exist. Run
`npm ci` for an unchanged full snapshot lockfile; after merging dependencies in a
partial host run `npm install` to regenerate its lockfile. Install Chromium with
`npx playwright install chromium` when absent. The snapshot's test tooling is
included for its unit tests. It imposes no styling framework or presentation
visual defaults. Do not introduce Tailwind, a Vite Tailwind plugin, theme tokens,
fonts, colors, borders, shadows, card/button defaults, or a spacing scale into the
kit or neutral bootstrap. Keep canonical kit and snapshot files aligned when
maintaining this skill.

## Create or edit the presentation

Create `src/presentations/<slug>/entities.ts`, `steps/`, and `Talk.tsx`, following
`templates/presentation/`. Choose a unique slug and namespace every stable
entity's layoutId. Define named ordered steps with id, era, title, caption,
Scene, and typed payload. Share `groupKey` and the same Scene for consecutive
states of one diagram so the scene persists as payload changes. Continuing
entities retain IDs and morph in place; apply Appear only to newcomers, after
continuing motion settles. Support exits for entities leaving a scene. SceneLayer
keeps independent layers from reflowing one another. Literal coordinates and raw
motion elements with stable layoutIds are valid when the primitives do not fit.
Preserve readable intentional overlaps; never spread a layout merely to fit an
implementation pattern. Number steps from order, not manually.

Give the presentation its own plain CSS by default. A framework is appropriate
only if the host already uses it or the user explicitly requests it. All visual
choices belong to presentation/host files, not `presentation-kit`: palette,
typography, spacing, borders, shadows, and controls. Target `data-presentation-*`
hooks and active semantics for distinct progress/ToC states. Style the
`data-presentation-attribution` link so “made by and-scene” is legible and
intentional; keep the kit's bottom-right GitHub disclosure. Top-left branding is
host opt-in. Use a fixed 880 × 380 design composition, scaled uniformly by the kit
without internal responsive reflow. Reserve room for captions and chrome.

Append one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry to
`src/presentations/index.ts`; preserve all existing entries and folders. Integrate
the landing links and lazy pathname router if that anchor was missing. Unknown
routes may return the landing page. Each presentation must remain independently
reachable. For modification, edit only the selected presentation and necessary
registration/verification integration; preserve other presentations and routes.

## Verify and repair before completion

Run `npm run build` over the whole app, then `npm run verify -- --slug <slug>` to
render the selected route in production Chromium and navigate every step. The
repository's default `npm run verify` additionally validates the canonical
nine-step reference sample. Keep preview host, readiness probes, and browser URLs
on `127.0.0.1`. A build error, console error, page error, failed navigation, or
failed render is a failure: fix it and rerun the affected checks. Never report
success on a failed check. Each step needs a caption, next/previous navigation,
and the evolving-scene identity model.

Then run `npm run inspect -- <slug>` using the **project-local** screenshot helper.
It captures settled production steps into a predictable local artifact directory.
Prefer it over scripts outside the app so dependencies resolve locally. If the
helper is unavailable, write a temporary Playwright helper **under the project
root**, wait for transitions to settle, and keep artifacts local. Review the
first, last, and all dense/key steps in screenshots or equivalent browser views;
for responsive-sensitive layouts also inspect a narrow viewport (the helper's
`--width` option). Confirm important content fits the canvas, intentional overlaps
stay readable, and content does not collide with captions, progress, ToC, or
navigation. Use chrome-devtools-axi for interactive browser inspection where
available; begin with a structural snapshot before screenshots.

Warnings are advisory evidence for review, not a visual-quality verdict. Review
the cited steps and elements. Fix accidental text/chrome collisions and
indistinct current-step styling, and polish small/browser-default attribution
using its hook. Mark only readable intentional overlap with
`data-presentation-allow-overlap` on its intended subtree; never silence warnings
by exempting the whole presentation. Rerun inspection after repairs and review
remaining advisories honestly. A green build alone does not establish visual
coherence.

Report the route, files changed, build/render results, reviewed visual coverage,
and any remaining advisory findings only after required checks and repairs are
complete. Do not publish or deploy as part of this skill.
