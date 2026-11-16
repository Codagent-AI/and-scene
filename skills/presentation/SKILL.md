---
name: presentation
description: Create or modify a browser presentation as one evolving scene, with a reusable React scene kit and local build/render/visual checks.
---

# Presentation

Use this procedure to turn a topic into a browser presentation or make a scoped
change to an existing one. A presentation is an evolving diagram, never a set of
disconnected slides. `Talk.tsx` is only its entry component filename.

## Gather the story

For creation, gather the topic, visual style, and each step's content and visual
description. Ask only one missing question at a time. Do not invent details the
user can still provide. The user controls depth: offer to build from partial
detail and iterate; once they explicitly choose that, use the captured direction
without a hard completeness gate. A complete prompt needs no further questions.
Optionally show an ASCII mockup of a key or complex layout to confirm intent;
this is discretionary, not something required for every step.

Capture ordered beats with stable id, era, one-line title, paragraph caption,
visual state, and what changes/morphs on the link to the next beat. Keep stable
entities, meaningful accumulation, and one coherent spatial composition.

For modification, identify the target first. If unspecified or ambiguous, list
existing registry entries and ask which presentation before changing files. Once
identified, ask only about the requested step/entity/style changes, preserve other
presentations, and skip the full creation interview.

## Resolve infrastructure before writing

Resolve all template paths relative to THIS SKILL.md's directory, never the
user's working directory. `templates/bootstrap/` is the standalone app snapshot;
`templates/presentation/` has the authored unit pattern. `materialize.mjs`, beside
this file, resolves its template via import.meta.url and copies it only into an
empty target. Run `node <absolute-skill-dir>/materialize.mjs <absolute-target>` for
a full empty-target bootstrap, then install dependencies in that target.

Inspect contracts, not exact filenames, formatting, or byte-identical source:

1. Build: Vite + React + TypeScript with a working `npm run build`.
2. Scene kit: typed Step/Scene, stage/host and stable layout morphs, fit canvas,
   present/browse navigation and caption/ToC chrome.
3. Index: registry mapping each presentation to its own route.

If all exist, reuse them. Cosmetic variations and extra dependencies do not
justify overwriting them. If some exist, add ONLY missing contracts and their
dependencies; preserve existing build setup, kit, routes, files, and unrelated
content. Adapt imports/routing to the host contract rather than copying over it.
If no anchors exist, provide all three. Before any writes in a non-empty project
missing kit or index, state the exact scaffold target and proceed only after
user confirmation (existing session authorization may supply that confirmation).

Target precedence: already inside a presentation app, use it and complete missing
anchors. Otherwise, a package.json workspaces field, pnpm-workspace.yaml, or
packages/ or apps/ layout indicates a monorepo: use a self-contained
`presentations/` application, preserving the root build and unrelated content.
Otherwise use the standalone project's root. Do not silently overwrite a
non-empty presentations/ target; inspect its contracts and complete only gaps.

Install all necessary dependencies, never assume they are installed. The
bootstrap lockfile supports `npm ci`. When merging a partial app, ensure runtime
react, react-dom, motion, lucide-react, and development vite,
@vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node,
eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, globals, and playwright. Preserve compatible host
versions and its lockfile; install missing packages. Install Chromium with
`npx playwright install chromium` if it is not available.

Scaffolding is style-neutral: no Tailwind, Tailwind plugin, visual theme, colors,
fonts, borders, shadows, card/button treatments, spacing scale, or CSS theme
tokens. Add a styling framework only if the host uses it or the user requests it.
The neutral example route is merely a bootstrap smoke fixture, not the generated
presentation. Replace it if desired, without deleting other authored content.

## Create or modify

Create `src/presentations/<slug>/entities.ts`, `steps/`, `Talk.tsx`, and local
plain CSS by default. Add one explicit `{ slug, title, load: () =>
import('./<slug>/Talk') }` entry to the registry, preserving all other entries.
Confirm the landing lists every presentation and routes remain separate.

Use `<Presentation steps={STEPS} title="…" initialMode="browse" />`. Step arrays
are generic: `Step<MyPayload>[]`; define `SceneProps<MyPayload>` without casts at
the Presentation boundary. Reuse `groupKey` AND Scene for consecutive payload
updates that must retain the Scene instance. Different diagrams can use separate
groups with AnimatePresence/shared layoutId transitions. Entity identities must
be stable, presentation-namespaced, and independent of array numbering.

Use kit Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer and Appear, or
raw motion elements with stable layoutIds for coordinate-heavy shapes. Keep a
new entity's keyed Appear wrapper mounted while it continues; never key it by
step, never wrap the whole continuing scene in a newcomer fade. Appear delays
newcomers until layout motion settles; AnimatePresence enables departures.
Preserve intentional readable stacks/overlaps, rather than flattening diagrams.
The default canvas is 880 × 380, uniformly scaled without internal reflow.

The kit owns behavior/layout geometry only. Put all visual decisions in the
presentation or host CSS: palette, typography, borders, shadows, spacing,
buttons and active chrome. Style `[data-presentation-active="true"]` distinctly
for ToC/progress, and `[data-presentation-attribution] a` legibly (at least 11px,
intentional link treatment). Default bottom-right attribution is “made by
and-scene”; top-left branding is explicit host opt-in. Do not add visual defaults
to the kit. Use stable `data-presentation-*` hooks instead of DOM structure.

## Verify and repair before completion

Run `npm run build`, then `node scripts/verify.mjs --route <slug> --first
--skip-build` for a minimum first-step browser check, and the full multi-step
`node scripts/verify.mjs --route <slug> --skip-build` before completion. Run
`npm run verify` for the committed reference gate when that sample exists.
Preview, readiness, and browser URLs must all use 127.0.0.1.

Visual composition is a separate required check, not a successful build. Prefer
`npm run inspect -- <slug> --skip-build`; it uses local Playwright dependencies,
a production preview, settled per-step captures, and advisory diagnostics under
`.inspection/<slug>/`. For responsive-sensitive output also run with `--narrow`.
If no local helper is available, write any temporary Playwright helper UNDER the
project root so imports resolve; do not use scripts outside the project.

Inspect screenshots or equivalent browser views of first, last, dense/key steps
(and a narrow viewport when sensitive). Use chrome-devtools-axi for interactive
inspection when installed, starting with snapshot, then screenshots. Verify
important content fits the canvas, text remains readable, and diagrams do not
collide with captions, progress, ToC, navigation, or attribution. Review each
reported overlap/active-state/attribution warning on its referenced step. Fix
accidental collisions, indistinct active controls, and unpolished attribution.
Only for intentional READABLE overlap, mark the relevant subtree
`data-presentation-allow-overlap="true"`; never exempt a whole scene to hide
accidental collisions. Screenshots/warnings are advisory review artifacts, not
an automated visual-quality score.

If any build, render, or visual check fails, fix and rerun the affected check;
never report success while a failure remains. Require per-step captions,
next/previous navigation, scene continuity, clean types/runtime, and a passed
visual composition review. Report the route, changed files, checks and any
remaining advisory status accurately. Stop local preview processes after use;
do not commit .inspection, dist, dependency directories, or temporary helpers.
