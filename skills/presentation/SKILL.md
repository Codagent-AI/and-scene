---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a portable React scene kit and build/render/visual verification.
---

# Presentation

Create an explanation as one evolving scene, never a sequence of unrelated slide layouts. A presentation is the canonical artifact name; `Talk.tsx` is simply its entry filename.

## Gather the brief

Ask one question at a time. First obtain the topic, then visual direction, then each beat's content and visual description. Capture an ordered outline with a stable step id, era/section, presenter one-liner, browse paragraph, diagram state, continuing entities, newcomers, departures, and what morphs between beats. Do not assume missing details the user can still provide. Let the user choose the depth: if they explicitly choose to build with partial detail, proceed with that material and iterate; there is no hard completeness gate. A complete brief needs no further questions. Optionally sketch a key or complex composition in ASCII to confirm it; do not require a mockup for every step.

For modification, identify the target first. If missing or ambiguous, list registry presentations and ask which one before editing. Once identified, ask only about the requested step, entity, or style changes. Preserve other presentations and avoid repeating the create interview.

## Resolve the app and scaffold

Resolve `SKILL_DIR` from the absolute path of this SKILL.md, not from the caller's working directory. Bootstrap files are at `SKILL_DIR/templates/bootstrap/`; per-presentation files are at `SKILL_DIR/templates/presentation/`. Read templates from there even when writing to a different app.

Inspect contracts rather than exact filenames or formatting. Locate these three anchors:

1. Vite + React + TypeScript build setup with a working `npm run build`.
2. Scene kit providing typed Step/Scene contracts, entity morph host, navigation, modes, chrome, and fit-scale canvas.
3. Explicit presentation registry mapping independent presentations to routes and a landing index.

Extra dependencies, cosmetic differences, and equivalent anchor filenames do not mean an anchor is missing. If inside an existing presentation app, reuse it, filling only missing anchors. If resolving a new app in a monorepo (package.json workspaces, pnpm-workspace.yaml, or packages/ or apps/ layout), target a self-contained `presentations/` app; preserve the monorepo root build and unrelated files. Otherwise use the standalone/empty project root. Evaluate partial anchors in the resolved app, not an unrelated workspace's build setup. In a non-empty project missing kit or index, state the exact resolved target and obtain confirmation before scaffold writes. Never overwrite an unrelated existing presentations/ directory: identify a compatible app there or ask to resolve the conflict.

No anchors: materialize the entire bootstrap at the resolved target. All anchors: skip scaffolding. Some anchors: copy only missing anchor files, merge only missing package dependencies/scripts, and adapt imports to preserved equivalent anchors. Never replace an existing build config, kit, registry, lockfile, or presentation wholesale. Review differences before merging partial infrastructure.

The template is a snapshot. When working in this source repository, update canonical `src/presentation-kit/` and its bootstrap copy together, byte-for-byte for non-test files. Keep scaffolded verification/inspection scripts aligned too.

Ensure runtime dependencies `react`, `react-dom`, `motion`, `lucide-react`; dev dependencies Vite and React plugin, TypeScript, React/DOM/Node types, ESLint and its TypeScript/React hooks/refresh stack, Vitest and test support, and Playwright. Do not assume dependencies are installed. For a copied full scaffold use its lock data with `npm ci`; after partial dependency merges install/update the lock without discarding existing dependencies. Install Chromium with `npx playwright install chromium` when unavailable. Resolve npm commands from the target app directory.

The scaffold and kit have zero visual defaults: no required Tailwind/plugin/framework, theme tokens, default colors, fonts, spacing scale, borders, shadows, card or button treatments. Fixed canvas and chrome geometry are behavioral layout plumbing. Use presentation-local plain CSS by default; use another system only if already supplied by the host or explicitly requested.

## Generate or modify

For creation, choose a unique kebab-case slug. Materialize presentation templates into `src/presentations/<slug>/`; replace the placeholders and author `entities.ts`, `steps/*`, `Talk.tsx`, and presentation-local CSS. Add exactly one explicit registry entry `{ slug, title, load: () => import('./<slug>/Talk') }`. Preserve all existing registry entries and routes. Landing lists the registry; direct navigation uses `/<slug>`.

Use the generic kit, not sample-specific primitives. Box, Label, Arrow, Frame, Emphasis, SymbolChip accept stable id, class/data/style hooks; raw motion elements with stable layoutId are allowed for unusual shapes. Namespace every entity identity within the presentation. Compose at 880 × 380; use literal coordinates where helpful. Stage uniformly scales the whole composition. SceneLayer isolates layers from reflow.

Group successive diagram states with the same Scene and groupKey. Pass typed payloads through `Step<T>` to `<Presentation>` without casts. Keep continuing entities mounted with the same id/layoutId so their position, size, text, and emphasis morph. Wrap newcomers in Appear with stable entity keys inside AnimatePresence; do not re-key continuing entities or fade them as newcomers. Entrance waits until layout motion settles; departures animate out. Preserve intentional stacks/overlaps rather than rearranging them for an implementation pattern. The reference sample is stricter: its conversation/tray entities accumulate in fixed locations through nine beats.

Each step needs an era, one-line title and paragraph caption. Numbering is order-derived. Use the supplied next/previous keys, touch swipes, controls, progress jumps and era ToC. Navigation clamps at both ends and leaves focused controls' keys alone. Browse shows captions, controls and wide-screen ToC; present focuses on marker/title. P switches modes without changing position. An initial mode may be declared.

Style primitives and chrome locally through data-presentation hooks. Make `[data-presentation-active="true"]` visibly distinct for progress and ToC. Style `[data-presentation-attribution]` as an intentional legible bottom-right `made by and-scene` GitHub link. Keep top-left branding opt-in. Do not put these treatments in the kit. Allow sufficient space for captions, navigation and attribution at wide and narrow sizes.

## Verify and repair before success

Run from the resolved app directory:

1. `npm run build` for the whole application, including every presentation and registry.
2. `npm run verify -- --presentation <slug>` for production Chromium rendering of every generated/modified step. It must render at least the first step without runtime/console errors; this local verifier checks them all. If the canonical reference sample is registered, also run the normal reference gate `npm run verify`. Preview, readiness probes and browser URLs must use `127.0.0.1`.
3. `npm run inspect -- <slug>` to capture settled per-step screenshots from production preview. Prefer this project-local helper over ad hoc scripts. If no local helper is available, any temporary Playwright helper must be under the target project root so dependencies resolve locally. Artifacts are under `artifacts/inspection/<slug>/<width>x<height>/` with a report.json.
4. Review screenshots or equivalent browser views of first, last, and dense/key steps. For responsive-sensitive layouts also capture `npm run inspect -- <slug> --width 390 --height 844` and review those steps. Important content must fit the canvas; intentional overlaps must stay readable; scene content must avoid captions, ToC, progress and controls.
5. Review advisory warnings by their step/element references. Fix accidental collisions, visually indistinct active navigation and missing/default/undersized attribution in local CSS. Only mark genuinely intentional readable overlap subtrees with `data-presentation-allow-overlap`; never blanket-mark a scene to silence faults. Re-run relevant checks after fixes.

A successful build or warning-free helper is not a substitute for visual review. Screenshots and visual warnings are inspection artifacts, not automated quality certification. Never report success while build, render or composition failures remain: fix and re-check them yourself. Confirm each step's caption, next/previous navigation, evolving-scene continuity and local styling ownership. Report the route, changed files and actual check results. Do not publish or export; those workflows are out of scope.
