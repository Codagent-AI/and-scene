---
name: presentation
description: Create or modify browser presentations as one evolving scene; bootstrap a style-neutral Vite/React/TypeScript app when needed.
---

# Presentation

Resolve this skill's directory from the location of this SKILL.md, never from the
caller's working directory. All paths below are relative to that directory.
The bootstrap snapshot is `templates/bootstrap/`; presentation starters are in
`templates/presentation/`. Do not assume this skill is installed inside the target.

## Gather or identify

For creation, capture topic, visual direction, and each step's title, caption,
content and visual description (including continuing entities and what changes).
Ask for missing information **one question at a time**; never invent a detail the
user can still provide. A complete prompt needs no more questions. The user
controls depth: explicitly let them choose to build with partial detail and
iterate, rather than imposing a completeness gate. ASCII mockups are optional for
key/complex layouts, not obligatory for every beat.

For modification, identify the target first. If unspecified or ambiguous, list the
existing registered presentations and ask which one before changing anything.
Then ask only about requested step/entity/style changes; do not repeat the create
interview. Preserve other presentations and unrelated files.

## Resolve the app before writing

Inspect contracts, not exact bytes or filenames:
1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene, grouped host/morphs, navigation, captions,
   ToC and fixed-canvas scaling.
3. A registry mapping independent presentations to routes.
Cosmetic filenames, formatting, and extra dependencies do not invalidate anchors.
If all exist, reuse the app. If only some exist, supply only missing anchors and
required dependencies; preserve functioning anchors, routes and host code. Merge
integration imports only as needed rather than replacing an existing entry point.

Outside an existing complete presentation app, detect monorepos via package.json
workspaces, pnpm-workspace.yaml, packages/ or apps/. Scaffold a self-contained app
under `presentations/` for a monorepo; use root for an empty or standalone project.
If a non-empty project lacks kit or registry, state the exact proposed target and
wait for the user to explicitly confirm that stated, resolved target before
writes. Do not infer confirmation from earlier authorization or silence.

Copy missing infrastructure from the skill-relative bootstrap directory; never
blindly overwrite the target. `node <skill-dir>/scaffold.mjs <target> --anchors
build,kit,index` copies explicitly selected missing anchors without overwriting
files and merges missing declared dependencies/scripts into package.json. Select
only anchors established as missing; assess alternate host contracts yourself.
The utility does not replace semantic contract inspection or confirmation.
In a partial host, adapt entry-point integration deliberately and preserve its
existing build configuration. If contracts use other paths, adapt imports.

Install the complete declared dependency set: react, react-dom, motion,
lucide-react; vite, @vitejs/plugin-react, typescript, @types/react,
@types/react-dom, @types/node, the ESLint stack, playwright, and testing tools.
Use npm ci when the copied lock matches; after merging into an existing package,
use npm install to update its lock. Make Chromium available with
`npx playwright install chromium` if absent. Never assume dependencies exist.
No Tailwind/plugin or visual theme is required. The scaffold and scene kit have
zero presentation visual defaults. Plain CSS in presentation/host-owned files is
the default unless the host already uses or the user explicitly requests another
framework.

## Create or modify

For creation, copy/adapt `templates/presentation/` into a unique
`src/presentations/<slug>/` folder, with `entities.ts`, `steps/`, `Talk.tsx`, and
presentation-local CSS. Register one explicit `{ slug, title, load: () =>
import('./<slug>/Talk') }` entry without removing existing entries. Keep old routes
working and enumerate the registry on the landing page. For modifications, edit
only the selected presentation and necessary integration/verification artifacts.

Model one scene, with stable namespaced entity IDs across named steps. Every step
has id, era, one-line title, paragraph caption, and diagram state. Order supplies
numbers. Use typed payloads directly at Presentation, no casts. Share groupKey and
Scene across related beats so only payload changes; use layoutId on continuing
entities. Appear is for newcomers, never a repeated fade on continuing entities;
retain stable React keys. Put dynamic children inside AnimatePresence for exits.
New entities enter after layout motion settles. Preserve authored intentional
stacking; never spread a diagram just to satisfy a component pattern. The kit's
880 × 380 canvas scales uniformly; raw motion nodes with layoutId and literal
coordinates are welcome when a primitive does not fit.

Own all colors, fonts, spacing, borders, shadows and controls in local CSS. Target
`data-presentation-*` hooks. Make `[data-presentation-active="true"]` visibly
different on progress/ToC controls and style `[data-presentation-attribution]`
with intentional color/type, at least 12px, and a legible contrast. Default
attribution reads "made by and-scene"; top-left branding is opt-in. Do not add
these visual treatments to the reusable kit.

## Completion gates and repair loop

Run the build and at least a first-step error-free browser render for the actual
created/modified route. `node scripts/verify.mjs --slug <slug>` builds and checks
all target steps; `npm run verify` checks the canonical reference in this repo.
A route-specific check does not replace full reference verification at completion.
Failures, including console/page errors, must be fixed and rechecked; never call a
failed build/render/visual check success.

Prefer `npm run inspect -- <slug>` for production, settled per-step screenshots
and advisory diagnostics. It resolves Playwright locally. If absent, put a
fallback helper **under the project root**, never outside the tree. Inspect the
first, last and every dense/key step, plus a narrow viewport for responsive
content (`npm run inspect -- <slug> --width 390 --height 844`). Use the permitted
browser interface for the environment. Check important content fits the canvas,
intentional overlap is readable, and scene content avoids captions, progress,
ToC and navigation chrome. Captions and next/previous navigation are required.

Review every overlap/chrome/attribution warning at its referenced step. Fix
accidental collisions, indistinct active states and unpolished attribution in
local CSS. Only genuinely intentional, readable overlapping subtrees may receive
`data-presentation-allow-overlap`; do not blanket-exempt the diagram. Re-run the
helper and review again after fixes. Warnings/screenshots are advisory review
artifacts, not an automated visual-quality verdict. Report build/render results,
visual review and any remaining advisory status accurately before success.
