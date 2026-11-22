---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with an optional self-bootstrapping React scene kit.
---

# Presentation

Create a presentation from a topic, or modify an identified presentation. A
presentation is one evolving scene with stable entities moving through ordered,
named states. Do not generate disconnected slide pages.

## Gather, with the user in control

If modifying and the target is absent or ambiguous, list the registered
presentations and ask which one to modify **before editing anything**. Once
identified, ask only about requested step, entity, or style changes. Do not
repeat the create interview. Preserve unrelated presentations.

For creation, gather the topic, visual style, and the content **and visual
description of each step**, including what persists, enters, changes, and exits.
Ask for missing information **one question at a time**. Do not assume details
the user can still provide. If the prompt contains all those details, proceed
without another interview. The user controls depth: explicitly allow them to
choose to build with partial detail and iterate; once they choose, use the
captured information without a hard completeness gate. You may offer an ASCII
mockup for a key or complex layout to confirm composition; this is optional and
not required for every step.

## Resolve infrastructure before creating or modifying

Resolve every template path relative to **this SKILL.md's directory**, never
relative to the caller's current working directory. Let `SKILL_DIR` mean the
absolute directory containing this file. Bootstrap is
`SKILL_DIR/templates/bootstrap/`; the presentation starter is
`SKILL_DIR/templates/presentation/`.

Inspect the target project for three **contract anchors**, not exact filenames
or byte equality:

1. A Vite + React + TypeScript build setup with a working `npm run build`.
2. A reusable scene kit with Step/Scene contracts, morphing stage, navigation,
   present/browse chrome, and fixed-canvas fit scaling.
3. A presentation registry mapping multiple presentations to individual routes.

Cosmetic differences, extra dependencies, formatting, or alternate file names
are not missing anchors. Read existing code to establish its contract. Already
inside a presentation app: reuse it. With all anchors present skip scaffolding.
With only some anchors present, add **only missing infrastructure and its
required dependencies**, adapt imports to existing contracts, and preserve
working build files and existing routes. Do not overwrite existing anchors.

If no app has been identified, detect monorepos through package.json workspaces,
pnpm-workspace.yaml, or packages/ or apps/ layouts. In a monorepo target a
self-contained `presentations/` app; do not alter root build infrastructure.
In an empty/standalone project target its root. If non-empty and lacking scene
kit or presentation index, **state the resolved target and wait for explicit
user confirmation before writing scaffold files**. Do not infer confirmation
from elapsed time. If the destination already contains an app inspect it before
copying anything.

For a full scaffold, copy the bootstrap tree. It includes an unstyled example
route as a wiring check; replace or retain it as appropriate, preserving any
user-created presentations. For partial scaffolding, selectively copy missing
kit/scripts/router infrastructure and merge required package entries, never
replace a user's package manifest or lockfile wholesale. Install dependencies:
`npm ci` for a fresh matching lock, or `npm install` after a partial manifest
merge. Do not assume any dependency is present:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.
- Install Chromium with `npx playwright install chromium` if unavailable.

The bootstrap and kit contain **no presentation visual defaults**. Never add a
required CSS framework, theme, palette, font, spacing scale, border, shadow,
card, or button treatment to the kit. Canvas dimensions and chrome positioning
are geometry. Default to presentation-local plain CSS; use a framework only
when the host already uses it or the user requests it.

## Create or modify

For creation, choose a unique slug, copy the starter into
`src/presentations/<slug>/`, and fill in entities.ts, steps/, Talk.tsx and
presentation.css. Prefix stable entity IDs with the slug. Each step has an id,
era, one-line title, paragraph caption, Scene and typed payload. Reuse groupKey
and Scene for successive states of one diagram so payloads change without
remounts. Key entity nodes by stable identity; do not key the whole group by
active step. Continuing nodes use layout morphs; only new nodes enter after
continuing motion settles and departing nodes exit. Preserve intentional stacks
and overlaps. Use kit primitives or raw motion elements with stable layoutIds
for literal coordinate work. Add one explicit lazy registry entry and confirm
existing entries/folders are intact. The host landing page enumerates registry
links. Keep every presentation reachable at its own route.

For modification, edit only the selected presentation and necessary registry
or verification artifacts; preserve all unrelated content. Adapt the starter
to the existing host instead of re-scaffolding it.

Style the presentation locally: canvas content, titles, captions, progress,
ToC, controls, and attribution. Make active progress/ToC states visibly distinct
using data-presentation-active and aria-current hooks. Make the bottom-right
`[data-presentation-attribution]` link legible and intentionally styled (at
least 12px, no accidental browser-default link treatment). Top-left branding
is host opt-in. Keep default disclosure unless the user asks otherwise.

## Verify and repair before completion

Run `npm run build`, then `node scripts/verify.mjs --slug <slug> --first` for at
least the generated/modified route's first-step render. Full completion also
runs `npm run verify`, which checks every canonical reference step when present.
For scaffold apps the package script checks the example; change its --slug to
the generated presentation. Run the full target with
`node scripts/verify.mjs --slug <slug>` to check all generated steps.
Fix type/build, console, runtime and transition failures and rerun affected
checks. Never report success while checks fail.

Inspect browser composition before reporting success: the first step, last
step, dense/key steps, and a narrow viewport when responsive-sensitive. Prefer
`npm run inspect -- <slug>` and `npm run inspect -- <slug> --width 390`, which
use local Playwright dependencies and settled screenshots from a production
preview. If the helper is unavailable, write any temporary Playwright helper
**under the project root**, not outside the project. Review screenshots or an
equivalent browser view for content fitting the fixed canvas, readable
intentional overlap, and accidental collisions with captions, ToC, progress,
or controls. Review every advisory's referenced steps. Fix accidental
collisions, indistinct active chrome and attribution polish, and rerun
inspection. Only mark a genuinely intentional, readable overlap subtree with
`data-presentation-allow-overlap`; never suppress warnings indiscriminately.
Warnings are advisory and do not replace visual review. Each step must retain
its caption and next/previous navigation in browse mode and conform to the
evolving-scene model. Report route, changed files, check outcomes and any
remaining advisory status accurately. Screenshots and build/dependency output
are local artifacts, not committed source.
