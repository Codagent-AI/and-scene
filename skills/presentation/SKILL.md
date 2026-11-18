---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a self-bootstrapping React scene kit and production verification.
---

# Presentation

Treat “presentation” as the artifact name. `Talk.tsx` is only the entry filename.
Work locally; publishing, export, and a general visual editor are outside this skill.

## Gather the story

First determine whether the request creates a presentation or modifies one. For
creation, gather the topic, visual direction, and each step's content and visual
description **one question at a time**. Use information already supplied; complete
input needs no extra questions. Do not invent details the user can still provide.
The user controls depth: when they explicitly choose to proceed with partial detail,
build from the captured details and support iteration rather than imposing a
completeness gate. For a key or complex visual, optionally sketch ASCII to confirm
its layout; do not require mockups for every step.

For modification, identify the target before changing files. If unspecified or
ambiguous, enumerate the registered presentations and ask which one. Once identified,
ask only about the requested step/entity/style changes, and edit that presentation
without repeating creation gathering. Preserve all other presentations and routes.

## Resolve the app and anchors

Inspect contracts, not exact filenames or formatting. The anchors are:

1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A topic-neutral scene kit: typed Step/Scene contracts, active-scene host,
   stable-entity motion, present/browse navigation and chrome, and fixed-canvas fit.
3. A presentation registry mapping presentations to independent routes.

Cosmetic differences, extra dependencies, and equivalent file layouts do not mean
an anchor is missing. If all anchors exist, reuse the app without scaffolding.
For partial scaffolds, add only missing anchors and their dependencies; preserve
existing configuration, anchors, unrelated files, and presentations.

Resolve standalone or empty targets to the project root. Detect a monorepo through
package.json workspaces, pnpm-workspace.yaml, or a packages/ or apps/ layout; put a
new self-contained app under `presentations/`. If already inside a presentation
app, reuse it. In a non-empty project missing the kit or registry, **state the
resolved target and obtain user confirmation before writing scaffolding**. Do not
silently guess a target or overwrite a host app. In a partial monorepo, preserve
its root build and place missing presentation infrastructure in the child app,
including the build setup needed for that child to run independently.

Locate every template relative to **this SKILL.md's directory**, never the user's
cwd: `templates/bootstrap/` and `templates/presentation/`. The adjacent
`scaffold.mjs` exports a skill-relative `bootstrapDirectory` and a full-bootstrap
`materialize(target)` helper that refuses overwrites. Use it for an empty target;
for partial targets copy/integrate only missing contracts manually. Do not use a
whole-template overwrite to repair a partial app. If equivalent host files already
exist, wire missing routing into them while retaining host behavior.

Install the full required set; assume none is installed:
- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.

Bootstrap includes package-lock.json; use npm ci after copying it. Merge missing
dependencies into partial hosts and update their lockfile. Install Chromium with
`npx playwright install chromium` when unavailable. Keep the scaffold free of
presentation visual defaults and styling frameworks. Add Tailwind or another
framework only if the host already uses it or the user explicitly asks.

## Create or edit

Use `templates/presentation/` as a structural starting point, replacing its topic
and metadata. Each new presentation gets `src/presentations/<slug>/entities.ts`,
`steps/`, `Talk.tsx`, and local plain CSS by default. Add one explicit
`{ slug, title, load: () => import('./<slug>/Talk') }` registry entry; do not replace
existing entries. Landing must enumerate the registry; each route lazy-loads its
presentation under Suspense. Pick a unique slug; preserve existing folders.

Compose the canonical scene kit, using generic Box, Label, Arrow, Frame,
Emphasis, SymbolChip, Appear, and SceneLayer primitives. Every step needs a stable
id, era, presenter one-liner, browse paragraph caption, and diagram state. Order
provides numbering. Put stable layoutId namespaces in the presentation's entities.
Adjacent states of the same diagram share groupKey AND Scene; pass strongly typed
payloads through Presentation without casts. Continuing entities keep their keyed
instance and layoutId; do not wrap them in a newly keyed newcomer fade. Use Appear
for actual entrants, which enter after layout motion; retain presence handling for
departures. SceneLayer prevents neighboring scenes reflowing. Preserve intentional
readable stacks/overlap; literal style coordinates or raw motion elements with
stable layoutId are valid when a primitive is not the right shape.

Use the fixed 880 × 380 canvas and uniform fit scaling, not independent slides.
Presentation supports keyboard, swipe, direct step and era jumps, and P mode toggle.
Use stable data-presentation-* hooks and aria-current for active navigation. Own
all colors, typography, spacing, borders, shadows, and control styles in the
presentation or host CSS, never in the kit. Style active progress and ToC distinctly.
Make `[data-presentation-attribution]` legible and intentional; preserve the default
bottom-right GitHub link. Top-left branding is opt-in. Do not add kit theme defaults.

## Verify and repair before success

Run the app build and at least a first-step render check on the generated or edited
route without runtime or console errors. The scaffold's verification script can
check a selected slug via its exported verify({ slug, canonical: false }) function;
`npm run verify` checks the configured reference through every step. Set
presentation.config.json for a bootstrap app's own default sample. Do not replace
the canonical reference configuration in this repository to hide a failed check.
Use production preview and readiness/browser URLs on 127.0.0.1 consistently.

Prefer the project-local `npm run inspect -- <slug>` helper: it builds, captures
all steps at a desktop viewport after animations settle, and writes predictable
`.presentation-artifacts/<slug>/NN.png` artifacts with advisory visual diagnostics.
If unavailable, write any temporary Playwright helper under the project root so
local dependencies resolve. Review first, last, dense, and key steps in screenshots
or an equivalent browser view. Check narrow viewports too when responsive-sensitive.
Check important content fits the fixed canvas, intentional overlap is readable,
and no content collides with captions, progress, ToC, or navigation.

Review every cited warning. Repair accidental overlap, indistinct active states,
and tiny or browser-default attribution in presentation/host CSS. Only genuinely
intentional readable overlap may receive `data-presentation-allow-overlap` on the
smallest relevant subtree; never exempt the entire scene to suppress defects.
Warnings and screenshots are advisory review artifacts, not an automatic aesthetic
pass verdict. Fix build, render, and visual composition failures and rerun affected
checks before reporting completion. Report actual checks and remaining advisory
status accurately; never call broken output successful.
