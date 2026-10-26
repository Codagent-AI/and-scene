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

Create `src/presentations/<slug>/` using the presentation templates as structural
examples. Adapt import depths to the destination. Use a unique kebab-case slug;
never overwrite an existing slug without an explicit modification request.

Write `entities.ts` with a presentation-local layoutId namespace, `steps/*.tsx`
with typed Step objects, `Talk.tsx` rendering Presentation, and presentation-local
CSS. Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry
to `src/presentations/index.ts`; keep every existing entry. Verify the landing
index links the new route. On modification, edit only the chosen presentation and
necessary registration/verification artifacts.

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

1. Run `npm run build`. Fix all type/build failures.
2. Run `npm run verify -- --slug <slug>` for the created/modified route. This
   builds and renders every step in Chromium against a production preview on
   127.0.0.1, rejecting console errors, uncaught errors and failed transitions.
   At minimum a first-step production render is mandatory even during iteration.
   Run the app's full default `npm run verify` before completion too, preserving
   its reference-sample gate if present. Do not replace a failing check with a
   weaker one, delete assertions, or report a broken build/render as success.
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
