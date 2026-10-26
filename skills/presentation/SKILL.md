---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a self-bootstrapping React scene kit and production-browser verification.
---

# Presentation

Use this procedure to create a presentation from a topic or modify an existing
presentation. A presentation is one scene evolving through named steps, never a
collection of unrelated slide layouts. Keep stable entity identities and compose
with the shared scene kit. Do not claim success until the checks below pass.

## 1. Gather or identify

For creation, capture the topic, visual style, and each step's content AND visual
description. Ask **one question at a time** about missing information; do not
invent details the user can still provide. Record the answers in a working outline.
The human chooses the depth: if they explicitly choose to build with partial
detail, build from the captured information and iterate without a completeness
gate. If the prompt already contains all details, build without more questions.
For a key or complex layout, optionally show an ASCII mockup to confirm it; do not
require mockups for every step.

For modification, identify the target before editing. If it is unspecified or
ambiguous, enumerate the registered presentations and ask which one to modify.
Once identified, ask only about requested step/entity/style changes; do not repeat
the create interview. Preserve unrelated presentations and existing registry entries.

## 2. Resolve the app and missing infrastructure

Resolve `templates/bootstrap/` and `templates/presentation/` relative to **this
SKILL.md's directory**, never relative to the caller's working directory. Inspect
the target project before copying anything. Three contract anchors determine
what is present (equivalent file names, formatting, additional dependencies, and
cosmetic customizations do not make an anchor missing):

1. Build: a working Vite + React + TypeScript app with `npm run build`.
2. Scene kit: typed Step/Scene, stage/morph host, fit scaling, navigation and chrome.
3. Index: a presentation registry and per-presentation routes.

Record an anchor map while inspecting: the actual build command, kit entry and
contracts, presentation folder convention, registry file/export/form, route
resolver and route URL convention, plus available verification/inspection commands.
Use that map in every later step. These may have different names and locations;
never create a parallel anchor just because a bootstrap path is absent.

An existing presentation app takes precedence: reuse it and fill only missing
anchors. Otherwise, detect a monorepo by package.json `workspaces`,
`pnpm-workspace.yaml`, or an existing `packages/` or `apps/` directory. In a
monorepo, target a self-contained **presentations/** app, preserving the root
build setup and unrelated files. In an empty or standalone project, target root.
If the project is non-empty and lacks the kit or index, state the exact resolved
target and wait for user confirmation **before writing**. Confirmation does not
permit overwriting present anchors.

No anchors: copy the complete bootstrap. All anchors: skip scaffold copying.
Partial anchors: copy only missing pieces and integrate their imports/scripts
with the existing anchors; never replace working package/config/source files
wholesale. Preserve root and existing app contents. The bootstrap is a release
snapshot, not a required byte-identical shape for detection.

Ensure dependencies, even when the app was partially present:
- Runtime: react, react-dom, motion, lucide-react.
- Development: vite, @vitejs/plugin-react, typescript, @types/react,
  @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint,
  eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright.

Merge only missing dependencies/scripts into existing package data. Use the
committed lock and `npm ci` for a full bootstrap; after merging dependencies,
install and retain the updated lock. Install Playwright Chromium with
`npx playwright install chromium` if needed. The standalone bootstrap has no
styling framework, default theme, palette, font, spacing scale, cards, or buttons.
Do not add Tailwind or a Tailwind Vite plugin unless already used by the host or
explicitly requested. Geometry and motion belong to the kit; all visual styling
belongs to the presentation or host, using plain CSS by default.

## 3. Create or modify

Use the resolved presentation folder, kit imports, registry and route resolver
from the anchor map. The paths `src/presentations/<slug>/` and
`src/presentations/index.ts` are defaults ONLY for an app made from this bootstrap.
For an existing app (for example `talks/registry.ts`), register in that actual
index using its existing entry form; do not create a second canonical-path index.
Use the presentation templates as structural examples, adapting import depths,
module conventions and route URLs to the host. Choose a unique kebab-case slug;
never overwrite an existing slug without an explicit modification request.

Write a self-contained presentation folder with stable entity IDs, typed steps,
an entry component and local CSS, following the host's equivalent conventions.
In a bootstrap app these are `entities.ts`, `steps/*.tsx` and `Talk.tsx` plus one
explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry.
In every host, add exactly one entry to the discovered registry, preserve every
existing entry, and confirm the existing route resolver loads the new component.
Verify the landing index links the actual new route and existing routes remain
reachable. On modification, edit only the chosen presentation and necessary
registration/verification artifacts in their resolved locations.

Each step has id, era, title (one line for live delivery), caption (reading
paragraph), Scene, and payload; numbering derives from order. Adjacent beats in
the same diagram should share BOTH groupKey and Scene so the instance persists.
Continuing entities retain layoutId and morph in place, without newcomer wrappers
or forced remounts. Use AnimatePresence for departures and delay newcomer entry
until LAYOUT_T finishes (ENTER_DELAY). Preserve intended stacks/overlaps instead
of spreading everything into disconnected slides. Raw motion elements with
stable layoutId are allowed for shapes not served by kit primitives.

Compose at 880 × 380 by default. The kit uniformly scales the fixed canvas; it
owns mode geometry, keyboard/touch navigation and clamped boundaries. Present
mode focuses on marker/title; browse exposes caption, progress, controls and
wide-screen era ToC. Respect focused-control keys. Style hooks are stable
`data-presentation-*` attributes. Supply local CSS making
`[data-presentation-active="true"]` visibly distinct from inactive controls.
Style `[data-presentation-attribution]` as an intentional, legible link. Keep the
default bottom-right "made by and-scene" link; header branding is host opt-in.

## 4. Verify, inspect, repair

1. Run the resolved host build command (`npm run build` in the bootstrap).
   Fix all type/build failures without replacing working host build infrastructure.
2. Inspect the host's verification commands before invoking them. Reuse a working
   host render check that covers the actual selected route; never overwrite or
   rewrite an existing verifier. In a bootstrap app, use
   `npm run verify -- --slug <slug>` to build and render every step in Chromium
   against a production preview on 127.0.0.1, rejecting console/page errors and
   failed transitions. It supports presentations opening in either mode.
   If the host has no verifier, lacks slug selection, or cannot check this route,
   write a temporary Playwright render helper **under the project root** so it
   resolves the host's local dependencies. Run the host build, start its production
   preview on 127.0.0.1, wait for readiness there, and open the resolved route in
   Chromium. Attach console-error and pageerror listeners before navigation;
   wait for the first scene and its animations to settle, and fail non-zero on
   either error channel or a missing/failed scene. Respect the declared initial
   mode; do not require hidden browse captions in present mode. At minimum the
   first step must render cleanly; enumerate all steps when the host supports it.
   Always close browser/context and preview processes on success AND failure.
   A verifier is not a fourth scaffold anchor: do not scaffold over a complete
   host, add a permanent verifier or change its scripts just to meet this gate.
   Run the host's existing full verification command too when available,
   preserving its reference-sample gate if present. Report exactly which command
   and route ran, and whether only the first step or all steps were checked; do
   not claim a reference gate absent from that host. Do not substitute a weaker
   check for a failing compatible one, delete assertions, or report a broken
   build/render as success. Repair failures and rerun the actual failed checks.
3. Prefer `npm run inspect -- <slug>` to capture all settled steps from the
   project-local helper and review its advisory warnings. Dependencies resolve
   locally and captures wait for animations. If the host has no helper, write a
   temporary Playwright capture helper **under the project root**, never in an
   external /tmp script that cannot resolve project dependencies.
4. Inspect screenshots or equivalent browser views of the first, last, and
   dense/key steps. Also check a narrow viewport for responsive-sensitive work.
   Verify important content fits the fixed canvas, readable intentional overlaps
   survive, and no text collides with caption, ToC, progress or controls. Review
   every warning's referenced step. Fix accidental collisions, indistinct active
   controls, and tiny/browser-default attribution. Add
   `data-presentation-allow-overlap` only to genuinely intentional readable
   overlap subtrees; never blanket-exempt the scene to silence warnings.
5. Re-run the relevant build/render checks and local helper after repairs and
   inspect repaired compositions again. Do not report done on visual failures.
   Report route, checks actually run, and remaining advisory status accurately.

The quality bar is: no type errors, no first-step runtime/console errors, a
caption per step in browse mode, next/previous navigation, coherent browser
composition, and one evolving scene. Screenshots and advisory diagnostics aid
human visual review; they are not an automated visual taste score.
