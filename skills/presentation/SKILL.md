---
name: presentation
description: Create or modify browser presentations as one evolving scene, with a style-neutral React scene kit and build/render verification.
---

# Presentation

Use this procedure to create or modify a presentation. A presentation is an
ordered story told through one evolving diagram, not a stack of unrelated slides.

## Gather and choose the operation

For creation, gather the topic, desired visual style, and each step's content and
visual description. Ask **one question at a time**, only for information missing
from the request. Do not invent details the user can still provide. Ask what
should persist, enter, leave, or morph between beats. The user controls depth:
explicitly allow “build with what we have” at any point; do not impose a hard
completeness gate. A complete prompt can proceed without further questions.
Optionally draw ASCII mockups for a key or complex layout to confirm intent;
mockups are not required for every step.

For modification, identify the target first. If it is missing or ambiguous, list
the registered presentations and ask which to modify before editing anything.
Once identified, ask only about the requested steps, entities, or style changes;
do not restart the creation interview. Preserve unrelated presentations and files.

## Resolve target and ensure infrastructure

Locate this installed SKILL.md first. Resolve `templates/bootstrap/` and
`templates/presentation/` relative to **this file's directory**, never relative
to the caller's working directory. Copy templates from that absolute location.

Detect three anchors by inspecting their contracts, not exact bytes, file names,
formatting, or extra dependencies:

1. Working Vite + React + TypeScript build setup (`npm run build`).
2. Presentation-agnostic scene kit: typed Step/Scene contract, active host and
   stable entity morphs, present/browse navigation/chrome, fixed-canvas fit scale.
3. Explicit presentation registry and route mapping permitting coexistence.

Use the app if already inside a presentation app. Reuse every existing anchor;
scaffold only missing anchors and their dependencies, without overwriting working
host implementations. Cosmetic differences are not reasons to re-scaffold.

Otherwise resolve standalone/empty projects to the root. Detect monorepos through
package.json workspaces, pnpm-workspace.yaml, or packages/ or apps/ directories;
put a self-contained app in `presentations/` inside the repository, preserving the
root build and unrelated files. If that app already exists inspect its anchors.
In a non-empty project missing the scene kit or index, state the resolved target
and proceed only after user confirmation. Do not silently overwrite collisions.

For a full scaffold copy `templates/bootstrap/`, including dotfiles and lockfile,
to the resolved app target. For partial scaffolds transplant only missing anchors
and merge required dependencies/scripts into the existing package manifest. Keep
existing registry entries and routing working. If a partial merge changes the
manifest regenerate its lockfile with npm install. Never assume dependencies are
installed. Ensure runtime react, react-dom, motion, lucide-react and dev/build vite,
@vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node, the
ESLint stack, and playwright are present. Use npm ci with the matching lockfile,
and npx playwright install chromium for render verification.

The bootstrap deliberately has no theme. Do not add Tailwind, its Vite plugin,
fonts, colors, spacing tokens, card/button styles, borders, shadows, or another
styling framework to the kit or bootstrap. Plain presentation-local CSS is the
default. Use another styling system only if the host already uses it or the user
explicitly requests it. Scene-kit geometry is behavior; visual treatment belongs
to the presentation or host.

## Generate or modify

Copy `templates/presentation/` into `src/presentations/<slug>/` for a new
presentation, replacing __SLUG__ and __TITLE__ and authoring the actual story.
Use a lowercase hyphenated unique slug. Keep entities.ts, steps/, Talk.tsx, and
presentation-owned CSS together. Add exactly one explicit registry entry:
`{ slug, title, load: () => import('./<slug>/Talk') }`.
Preserve every existing presentation and its route. Modify only the selected
presentation (and necessary registration/verification artifacts) for scoped edits.

Every Step carries a stable id, era, one-line title, paragraph caption, Scene,
and typed payload. Numbering comes from array order. Share groupKey and Scene
between adjacent states of the same diagram so the component persists with new
payloads. Never cast at the Presentation boundary to erase payload typing.
Use stable presentation-namespaced entity IDs; continuing entities morph through
Motion layoutId. Keep continuing entities mounted; put newcomers in keyed Appear
wrappers inside AnimatePresence so they enter after layout movement and exit
when removed. Do not re-key a continuing entity or wrap it anew at every beat.
Compose Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer, and Appear, or
use raw motion elements with stable layoutIds for custom coordinate-heavy art.
SceneLayer keeps independent diagrams out of each other's flow. Preserve
intentional readable stacking rather than spreading diagrams to fit a pattern.

Author an intentional visual design locally: palette, typography, spacing,
controls, and all component treatments. Target data-presentation-* hooks. Make
[data-presentation-active="true"] visibly distinct for progress and ToC. Style
[data-presentation-attribution] a legibly and intentionally; the default link is
bottom-right “made by and-scene”. Header branding is host opt-in. Support the
880 × 380 fixed canvas scaling and browse/present chrome without collisions.
Captions and next/previous navigation must work for every step.

## Verify and repair before completion

Run npm run build and a real production-browser render check before reporting
success. `npm run verify -- <slug>` builds the entire app and renders every step
of the target with console/page error detection; without a slug it verifies the
canonical nine-step reference sample, when installed. Fix build/render faults
and rerun the affected checks. Never call failing output a success.

Then inspect browser composition: first, last, dense/key, and transition-critical
steps; also use a narrow viewport when responsive-sensitive. Prefer the local
helper `npm run inspect -- <slug>` (and `--narrow`) over ad hoc scripts. It uses
local Playwright dependencies, production preview, and settled captures in
artifacts/inspection/<slug>/<viewport>/. If unavailable, write any temporary
Playwright helper under the app root so local dependencies resolve.

Review the actual screenshots or equivalent browser view and each warning.
Important content must fit the canvas, intentional overlaps must be readable,
and diagrams must not collide with captions, ToC, progress, or controls. Fix
accidental text/chrome collisions, indistinct active navigation, and undersized
or browser-default attribution. Mark only deliberate readable overlap subtrees
with data-presentation-allow-overlap; never suppress warnings for the whole app.
Repeat affected build/render and visual checks after fixes. Diagnostics and
screenshots are advisory aids, not an automated aesthetic score or proof that
composition is good. Report checks and remaining advisory status accurately.
