---
name: presentation
description: Create or modify a browser presentation as one evolving scene, with self-bootstrapping React infrastructure and build/render/visual verification.
---

# Presentation

Use this hybrid skill to turn a topic into a routed browser presentation. Resolve
all templates relative to this SKILL.md directory, never the caller's working
directory: `templates/bootstrap/` is the distributable app snapshot;
`templates/presentation/` is the authoring starting point. `scaffold.mjs` is next
to this file and resolves its snapshot using import.meta.url.

## Gather

For creation, collect the topic, visual style, and each step's content and visual
description, including what persists, enters, exits, or morphs. Ask only one
question at a time for information the user has not supplied. Do not invent
missing details while the user can still provide them. A complete prompt can
proceed directly. Let the user choose to build with partial detail and iterate;
there is no hard completeness gate. Preserve the captured details and the user's
depth choice. Optionally draw ASCII mockups for key or complex layouts when useful
to confirm the composition; do not require one for every step.

For modification, first identify the target presentation. If unspecified or
ambiguous, list the existing registry entries and ask which one to modify before
editing anything. Once identified, ask only about the requested step, entity, or
style changes, and edit that presentation in place. Do not repeat the full create
interview or regenerate unrelated presentations.

## Resolve and bootstrap

Inspect the target project for three functional anchors, not a byte-identical
scaffold: a working Vite/React/TypeScript build, a reusable scene kit with typed
Step/Scene contracts, morphing stage, navigation, modes, chrome and fit scaling,
and a registry mapping presentations to routes. Cosmetic filenames, formatting,
and extra dependencies do not invalidate existing anchors. `scaffold.mjs`
provides conservative detection; inspect unfamiliar equivalent infrastructure
before deciding it is missing.

Reuse an existing presentation app. In an empty or standalone project, scaffold
at its root. In a monorepo (package workspaces, pnpm-workspace.yaml, packages/ or
apps/), create a self-contained app under `presentations/` without disturbing the
root build or unrelated content. If a non-empty project lacks kit or registry,
state the resolved target and obtain the user's confirmation before writing.
Do not infer confirmation from silence. Only after confirmation pass
`--confirmed` to `node <absolute-skill-directory>/scaffold.mjs <project-root>`.
An empty target needs no confirmation. If all anchors exist, skip scaffolding;
if only some exist, add only missing anchors and their dependencies.

The helper preserves existing files. Review and merge integration points such as
an existing src/main.tsx and package build scripts rather than replacing them.
Ensure the registry is actually routed, the build includes new files, and existing
presentations still resolve. For equivalent host layouts adapt imports and
entry points without overwriting working infrastructure. Do not report completion
from anchor detection alone.

Ensure the complete dependency set; do not assume installed packages: react,
react-dom, motion, lucide-react; vite, @vitejs/plugin-react, typescript,
@types/react, @types/react-dom, @types/node; eslint, @eslint/js, globals,
typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh; and
playwright. Install dependencies and Chromium (`npx playwright install chromium`)
when absent. The bootstrap has no visual theme or framework. Never add Tailwind,
a Tailwind Vite plugin, or another framework unless the host already uses it or
the user requests it. Preserve the host's existing framework when adapting.

## Author

Copy/adapt `templates/presentation/` into `src/presentations/<unique-slug>/`.
Provide entities.ts, steps, Talk.tsx, and presentation-local CSS. Add an explicit
`{ slug, title, load: () => import('./<slug>/Talk') }` registry entry; keep all
existing entries, files, and routes intact. For modifications scope changes to
the selected presentation and necessary registration/verification artifacts.

Use typed Step<TPayload>/SceneProps<TPayload> with stable IDs, era, one-line
title, paragraph caption, Scene, and payload. Numbering follows array position.
Adjacent states of one diagram share groupKey and Scene; continuing nodes retain
layoutIds and remain mounted. Introduce individually keyed nodes after continuing
layout motion settles, and animate departures with AnimatePresence. Use the
kit's generic nodes, Appear, and SceneLayer, or raw motion elements with stable
layoutIds for shapes requiring coordinates. Preserve intentional readable stacks;
do not redistribute a composition just to fit a component pattern.

Create a presentation-owned plain CSS file by default. Keep every color, font,
spacing scale, border, shadow, card, button and theme token outside the reusable
kit. Style stable data-presentation-* hooks locally. Make current progress and
ToC entries visibly distinct, and the bottom-right `made by and-scene` attribution
legible and intentional via `[data-presentation-attribution]`. Top-left branding
is opt-in. Keep scene content within the 880 × 380 canvas and clear of captions,
ToC, navigation, and progress chrome in both modes and relevant viewports.

## Verify and repair before completion

Run npm run build (all presentations and the index), then
`node scripts/verify.mjs --presentation <slug>` for the generated/modified route.
It must render at least the first step without runtime or console errors; prefer
the every-step check the local driver supplies. Run npm run verify for the full
canonical reference gate when completing work in this repository. Use 127.0.0.1
for preview binding, readiness probes, and browser URLs.

Run `npm run inspect -- <slug>` to capture settled screenshots locally. Prefer
this project-local helper over ad hoc scripts so dependencies resolve correctly;
if it is unavailable, write any temporary Playwright helper under the project
root. Inspect first, last, and dense or key steps in a browser view or screenshots;
check a narrow viewport too when the composition is responsive-sensitive. In
this environment use chrome-devtools-axi for interactive browser inspection,
starting with snapshot and then screenshots. Verify that important content fits,
intentional overlaps remain readable, and scene text does not collide with chrome.

Review each helper warning at its referenced step. Fix accidental text/chrome
collisions, indistinct active navigation, and small or browser-default attribution
in presentation/host CSS. Mark only genuinely intentional, readable overlap
subtrees with `data-presentation-allow-overlap`; never blanket-mark the whole
presentation to suppress warnings. Rerun inspection after repairs. Screenshots
and diagnostic warnings are advisory artifacts, not an automated visual-quality
pass/fail score.

If build, render, or visual composition fails, fix the problem and repeat the
relevant checks before reporting success. Do not call broken output complete.
Report what was built or modified, the checks actually run, and remaining advisory
warnings accurately. Preserve existing routes and avoid generated screenshots,
dependency folders, or build artifacts in commits.
