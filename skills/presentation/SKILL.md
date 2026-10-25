---
name: presentation
description: Create or modify browser presentations as one evolving diagram with stable entities, named steps, and present/browse modes.
---

# Presentation

Resolve all template paths relative to the directory containing this SKILL.md,
never the caller's working directory. The distributable app is
`templates/bootstrap/`; the authoring skeleton is `templates/presentation/`.

## Gather

For creation, read the request first. A complete topic, visual style, and ordered
step content plus visual descriptions may proceed without more questions.
Otherwise ask one question at a time: missing topic, then visual style, then the
content and visual description of each step. Ask only for missing information;
do not invent details the user can still provide. The user controls depth.
Offer an explicit “build with what we have” path: once chosen, generate from the
captured details and iterate without imposing a completeness gate. Optionally
show an ASCII mockup of a key or complex step to confirm layout; do not require
mockups for every step.

For modification, read the registry and identify the target first. If absent or
ambiguous, list the existing presentations and ask which one before any edits.
Once identified, ask only about the requested step, entity, or style changes.
Edit that presentation, plus strictly necessary registration/verification files;
do not repeat the create interview or change unrelated presentations.

## Resolve and scaffold

Inspect contracts, not exact paths or template bytes. Three anchors are needed:
1. A functioning Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene, morphing stage, grouped persistence,
   navigation, present/browse chrome, captions, era ToC, and fit scaling.
3. A presentation registry mapping multiple entries to their own routes.
Cosmetic filenames, formatting, and extra dependencies do not invalidate anchors.

First reuse an existing presentation app when inside one, including partially
implemented anchors. Otherwise detect monorepos using package.json workspaces,
pnpm-workspace.yaml, or packages/ or apps/ directories. In a monorepo target a
self-contained `presentations/` app; do not mutate the monorepo root build. Empty
or standalone non-monorepo targets use the root. State the resolved target and,
before scaffold writes in any non-empty project (including missing kit/index),
obtain user confirmation. Prior explicit authorization of that target suffices.

With no anchors, copy the complete bootstrap. With all anchors, skip scaffolding.
With partial anchors, add only missing contracts: preserve working build setup,
kit, registry, existing routes, and unrelated files. Adapt imports to existing
contracts rather than replacing cosmetic variants. Do not blindly copy over an
existing package.json, registry, or source tree.

Ensure dependencies even when some are installed: runtime react, react-dom,
motion, lucide-react; development vite, @vitejs/plugin-react, typescript,
@types/react, @types/react-dom, @types/node, eslint, @eslint/js,
typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh,
globals, and playwright. Keep or produce package-lock.json and install with
npm ci (npm install when merging dependency declarations). Make Chromium
available with `npm run browser:install` or a declared PLAYWRIGHT_BROWSERS_PATH.
Bootstrap templates include no presentation visual defaults. Do not add Tailwind,
a Vite styling plugin, theme, fonts, colors, borders, spacing scale, card/button
styles, or shadows to the kit or bootstrap. The host may already use a framework,
or the user may explicitly request one; otherwise use plain presentation CSS.

## Generate

Use templates/presentation as the structural starting point. Create a unique
`src/presentations/<slug>/` with entities.ts, steps/, Talk.tsx, and local CSS.
Each Step has id, era, title, caption, Scene, payload, and optional groupKey.
Number steps from array order. Use a typed payload without boundary casts.
Share Scene and groupKey for successive states of a continuous diagram.
Keep stable namespaced layoutIds and DOM identity for continuing entities;
change their geometry/data in place. Use AnimatePresence for departing children,
and Appear for actual newcomers only after layout motion settles. Continuing
entities must not replay newcomer fades. Keep intentional overlapping composition;
SceneLayer and raw motion elements with layoutId are available for coordinates.

Add exactly one additive entry to the explicit registry with slug, title, and
lazy `load: () => import('./<slug>/Talk')`. Preserve prior entries, order, folders,
and routes. Landing enumerates the registry; unknown paths return Landing.

Own all palette, typography, spacing, borders, shadows, and controls in local or
host CSS, never the kit. Style data-presentation-active navigation distinctly;
make data-presentation-attribution legible and intentional. Keep a caption for
each step, working previous/next controls, and the fixed-canvas scene model.

## Verify and repair

Run the target project's build and verify the actual created/modified route,
not just the reference sample: `npm run verify -- --slug <slug>` renders every
step, including at least its first, and fails on console/page errors. Run the
full `npm run verify` reference gate before completion. Fix build or browser
failures and rerun the affected check; never report success on a failing result.

Visual review is also a completion gate. Prefer `npm run inspect -- <slug>`:
it uses local dependencies, production preview, settled per-step captures, and
step-specific advisory warnings. Review first, last, dense/key steps and, for
responsive-sensitive scenes, narrow viewports (`--width 390 --height 844`).
For interactive inspection use chrome-devtools-axi: start with a structure
snapshot, then inspect composition screenshots. Do not use the underlying MCP
server when AXI is available. If the local helper is absent, write any temporary
Playwright helper under the project root to resolve local dependencies.

Check that important content fits the fixed canvas; intentional overlaps remain
readable; scene text avoids captions, progress, ToC, and navigation. Review every
warning's referenced step. Fix accidental collisions, indistinct active chrome,
and attribution polish locally, then rerun inspection and review. Only genuinely
intentional readable overlap gets `data-presentation-allow-overlap` on its scoped
subtree. Never use blanket exemptions to hide defects. Warnings and screenshots
are advisory review artifacts, not an automated visual-quality score or a
substitute for composition review. Capture failures still fail the command.

Report completion only after build, target render, full reference verification,
and visual review pass; state checks and any remaining advisory status honestly.
