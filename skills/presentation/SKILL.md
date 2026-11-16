---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a reusable React scene kit, self-bootstrapping scaffold, and build/render/visual verification.
---

# Presentation

A presentation is one scene moving through named states, never a collection of
unrelated slides. Use stable entity IDs, continuing positions and meaningful
connections. `Talk.tsx` is only the entry filename; presentation is the artifact.

## Gather the story

First identify create versus modify. For a modification, identify the target
before any edits: if unspecified or ambiguous, enumerate the existing registry
and ask which presentation to modify. Then ask only about the requested step,
entity, or style changes, and scope edits to that presentation and necessary
registration/verification artifacts. Do not restart the create interview.

For creation, gather topic, visual style, then each step's content and visual
description. Ask **one question at a time**, only for information still missing.
The user controls depth: offer to build with captured partial detail and iterate;
when they choose that, proceed without a completeness gate. A complete prompt
needs no further questions. Do not invent details the user can still supply.
For a key or complex step, optionally show an ASCII mockup to confirm its layout;
this is useful, not mandatory for every step.

Turn the captured details into an ordered outline: stable id, era, one-line
presenter title, paragraph browse caption, visual state, continuing entities,
newcomers, departures, and what changes on each connecting link. Let this outline
drive both metadata and the diagram. Do not put transition information inside a
card when it belongs on the link between states.

## Resolve infrastructure before writing presentations

Locate this `SKILL.md` first. Resolve `templates/bootstrap/`, `templates/presentation/`,
and `bootstrap.mjs` **relative to this file's directory**, never the caller's cwd.
The bootstrap snapshot is distributable; do not reach back into its authoring repo.

Inspect three contracts, not byte-identical filenames or formatting:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene contracts, motion stage, present/browse
   navigation, chrome and fixed-canvas fit scaling.
3. A presentation registry mapping distinct presentations to distinct routes.

Cosmetic differences, extra dependencies, and renamed but equivalent files do
not mean an anchor is missing. With all three present, reuse the app without
re-scaffolding. With some present, add only missing anchors and their dependencies;
never disturb the working contracts. If none are present, scaffold all three.

Resolve location in this order:
- Already in a presentation app: use that app and fill only missing anchors.
- Otherwise a monorepo signal (`package.json` workspaces, `pnpm-workspace.yaml`,
  `packages/`, or `apps/`): use a self-contained `presentations/` app. Do not mutate
  the monorepo root build or unrelated content.
- Otherwise an empty or standalone project: use its root.

In a non-empty project missing the scene kit or presentation index, state the
resolved target and obtain user confirmation **before writes**. Existing explicit
authorization of that target is sufficient. Do not silently choose a different
location. If the location contains partial anchors, preserve those there.

For standard filenames, after authorization use:

```sh
node /absolute/path/to/skills/presentation/bootstrap.mjs --target /absolute/target --anchors build,kit,index
```

Pass only missing anchor names. The copier refuses conflicting files; integrate
missing contracts by scoped edits when a host uses equivalent custom filenames.
Inspect before merging, preserve its framework and working routes, and do not
copy a second router over an existing one. Preserve unrelated files and versions.
The copier merges required dependencies and missing scripts into package.json;
review the merge and run `npm install` in the resolved app (or `npm ci` when its
lockfile is current). Never assume installed dependencies exist.

Required runtime dependencies: react, react-dom, motion, lucide-react.
Required dev/build dependencies: vite, @vitejs/plugin-react, typescript,
@types/react, @types/react-dom, @types/node, eslint, @eslint/js,
typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh,
globals, and playwright. The bootstrap also supplies Vitest and component-test tools.
Install Chromium using `npx playwright install chromium` if it is unavailable.
The scaffold and reusable kit have **zero presentation styling defaults** and no
required styling framework. Do not add Tailwind, its Vite plugin, theme tokens,
default colors, fonts, spacing scales, cards, borders, shadows or button styles.

## Create or modify

For creation, choose an unused kebab-case slug; preserve every existing folder,
registry entry and route. Copy the presentation template into
`src/presentations/<slug>/`, resolve its imports, then write:
- `entities.ts`: presentation-namespaced stable identities and state/coordinates.
- `steps/*`: typed ordered Step objects and Scenes, composed from kit primitives.
- `Talk.tsx`: `<Presentation steps={STEPS} title="…" initialMode="browse" />`.
- Presentation-local CSS implementing the captured visual direction.

Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry
entry. The landing page enumerates it; the pathname router lazy-loads it. Verify
other registrations remain intact. For modifications edit the chosen target,
not other presentations, and update registration only when necessary.

Use `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, and
`SceneLayer` as appropriate. Primitives expose `entityId`, class/style/data hooks;
raw motion elements with stable `layoutId`s are welcome for unusual shapes.
Author literal coordinates in the 880 × 380 fixed canvas when helpful. Adjacent
states of one diagram share `groupKey` and the same Scene; payload changes then
update the existing instance. Keep continuing entities mounted with stable keys;
do not wrap them in newly keyed Appear containers. Newcomers enter after layout
motion, and departing entities exit through AnimatePresence. Keep readable
intentional stacks instead of spreading everything out to fit an implementation.

Plain CSS owned by the presentation is the default. Use a styling framework only
when the host already uses one or the user requests one. Never put visual styles
in `presentation-kit/`. Style these stable hooks locally: active progress and ToC
items (`data-presentation-active="true"`, semantic `aria-current="step"`), navigation,
and `[data-presentation-attribution]`. Make active chrome visibly distinct and
attribution legible and intentional. Default bottom-right attribution links to
and-scene; top-left branding is opt-in via the host `brand` prop.

## Verify and repair before completion

Run `npm run build`. Run `npm run verify -- --route <slug>` to render the target
through every step in Chromium on a production preview at `127.0.0.1`; at minimum
the first step must have no console or runtime errors. In this repository run the
strict default `npm run verify` too: it requires the canonical nine-step sample.
Fresh scaffold apps without that sample use the explicit target-route command.
Use the public count/index hooks; never substitute a jsdom mount for browser render.
If build, render, or visual checks fail, fix the failure and rerun its check before
reporting success. Do not describe broken output as complete.

For visual composition, prefer `npm run inspect -- <slug>`. This project-local
helper uses local Playwright, a production preview, settled per-step screenshots,
and advisory overlap/active-state/attribution diagnostics. Review its report and
screenshots of the first step, last step, and dense or key steps. For responsive
content repeat with a narrow viewport (the exported inspectPresentation function
accepts viewport dimensions). If no local helper exists, put a temporary helper
**under the project root** so dependencies resolve locally; do not use an external
ad hoc helper. Agent-driven interactive browser work uses chrome-devtools-axi:
start with a snapshot, then capture screenshots; do not directly call its backing
MCP server while AXI is available.

Check that important content fits the fixed canvas; readable intentional overlaps
remain intact; nothing collides with captions, progress, ToC or navigation; active
chrome is distinct; attribution is legible. Review every cited warning's step.
Fix accidental collisions and chrome defects. Mark only genuinely intentional,
readable overlap subtrees with `data-presentation-allow-overlap=""`; never blanket
exempt a diagram to suppress warnings. Rerun inspection after fixes. Warnings and
screenshots are advisory artifacts, not automated visual pass/fail scores.

Report the route, changed files, build/render outcomes, reviewed visual steps and
viewports, and any remaining advisory warnings accurately. Stop local processes
and keep generated build output, node_modules and inspection images uncommitted.
