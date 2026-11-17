---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit and build/render/composition checks.
---

# Presentation

Use this procedure for both new presentations and scoped modifications. A presentation is one evolving scene with stable entities across ordered narrative beats, not a slide deck. Keep exports, publishing, and visual-editor work outside this skill.

## Gather the story

First identify create versus modify. For create, capture topic, visual style, and each step's content and visual description (including what persists, changes, arrives, or leaves). Ask for missing information **one question at a time**. Do not invent details the user can still provide. The user controls depth: explicitly choosing to build with partial detail is sufficient; there is no hard completeness gate. If the prompt already supplies all details, build directly. Optionally offer an ASCII mockup for a key or complex step to confirm composition; do not require mockups for every step.

For modify, read the registry and identify the target before changing anything. If ambiguous or unspecified, list the existing presentations and ask which one to modify. Once identified, ask only about the requested step/entity/style changes. Do not restart the create interview. Preserve all other presentations, their files, and their reachable routes.

## Resolve the app and missing infrastructure

Locate this SKILL.md's directory using its installed file location. Resolve `templates/bootstrap/` and `templates/presentation/` **relative to that directory**, never relative to the user's working directory. Bootstrap includes package/lock data, app build configuration, scene kit, index/router, and project-local verification/inspection scripts.

Inspect for three contract anchors, using actual behavior and exports rather than byte equality, naming, formatting, or extra dependencies:

1. A Vite + React + TypeScript build setup exposing a working `npm run build`.
2. A reusable scene kit with typed Step/Scene payloads, stage/morph hosting, persistent grouped scenes, present/browse navigation/chrome, and fixed-canvas fit scaling.
3. An explicit presentation registry connecting independently routed presentation folders to a landing/index view.

An app with all anchors is reused without re-scaffolding. If some anchors exist, preserve them and integrate only missing anchors and dependencies. Cosmetic differences are never a reason to replace a valid anchor. Inspect custom anchor interfaces and adapt imports to them.

Resolve the target before writes:

- Already inside a presentation app: reuse that app, adding only missing anchors.
- Monorepo signals include package.json `workspaces`, `pnpm-workspace.yaml`, or an existing `packages/` or `apps/` layout. Scaffold a self-contained app under `presentations/`, preserving the monorepo root build setup and unrelated content.
- Empty or standalone project: scaffold at its root.
- For a non-empty project lacking the kit or index, state the resolved target and wait for user confirmation before scaffolding. Prior explicit authorization of that exact target counts as confirmation. Do not interpret silence as approval.

With no anchors, materialize the full bootstrap. With partial anchors, copy only missing infrastructure, merge package scripts/dependencies carefully, and adapt routing without overwriting existing content. Do not blindly copy a template package.json or lock over an existing project. Never replace an existing registry with the template registry. Check destination paths first. If the nested target already has content, assess its anchors as well before writing.

Install all required dependencies; assume none are installed:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node, eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, playwright, vitest and jsdom/testing-library when using the supplied tests.

Use committed lock data and `npm ci` for an unchanged full bootstrap, or regenerate the lock after deliberate dependency merges and install it. Make Playwright Chromium available (`npx playwright install chromium`). Keep the app self-contained in a monorepo. Do not add Tailwind, a Tailwind Vite plugin, a default theme, or another styling framework unless the host already uses it or the user requests it.

## Generate or modify

For create, select a unique kebab-case slug and make `src/presentations/<slug>/`. Use the presentation templates as a starting point, replacing `__SLUG__` and `__TITLE__`. Add `entities.ts`, typed scene-state data and `steps/`, `Talk.tsx`, and presentation-local CSS. Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Preserve all existing entries. Set `presentation.config.json`'s default slug for a fresh bootstrap; leave an established app's reference configuration intact and pass the new slug explicitly to scripts.

Each step needs stable id, era, one-line presenter title, paragraph caption, and a diagram state. Numbering is array-derived. Use typed Step<T> and SceneProps<T> without boundary casts. Adjacent states of one diagram share groupKey and Scene so the component persists and only payload changes. Keep stable, presentation-namespaced layoutIds on continuing entities. Retain keyed Appear wrappers for continuing entities so they do not replay newcomer fades; AnimatePresence handles departing entities. New arrivals wait until continuing layout motion settles. Use absolute SceneLayer coordinates; preserve readable intentional stacking. Raw motion elements with stable layoutIds are valid when a generic primitive is unsuitable.

The kit owns behavior, canvas/chrome geometry, and `data-presentation-*` hooks only. Never add palette, fonts, colors, spacing scales, borders, card/button treatments, glow/shadows, or theme tokens to it. Plain presentation-local CSS is the default. Style chrome using its stable hooks, including visibly distinct `[data-presentation-active='true']`, and legible `[data-presentation-attribution]`. Keep the default bottom-right “made by and-scene” repository link; top-left branding is host opt-in. The fixed default canvas is 880×380; scale uniformly rather than reflowing its internals. Browse mode includes caption and navigation, with wide-screen era ToC; present mode is marker/title focused. Preserve keyboard, touch, boundary clamping, and focused-control behavior.

For modify, change only the selected presentation and strictly necessary registry/verification integration. Keep continuing entity identities, grouped instances, and unrelated presentations intact.

## Verify and repair before reporting success

Run `npm run build`. Use project-local `npm run verify -- <slug> --first` for at least a first-step production-browser render, then full `npm run verify -- <slug>` to check every step at completion. In the authoring repository, also run `npm run verify` to validate the canonical reference. All type/build errors, console errors, uncaught runtime errors, and failed transitions must be fixed and the affected checks rerun. Never report success on failed output. Keep fast `npm test` separate from slower `npm run test:integration` where available.

Run `npm run inspect -- <slug>` to obtain settled per-step screenshots and advisory warnings. Prefer this project-local helper so Playwright resolves from local dependencies. If unavailable, place any temporary helper under the project root, not outside it. Preview host, readiness probes, and browser URLs use `127.0.0.1` consistently. Artifacts live under `artifacts/inspection/<slug>/<viewport>/` and must not be committed.

Review the first, last, and dense/key steps in screenshots or an equivalent browser view. For responsive-sensitive scenes, also run `npm run inspect -- <slug> --narrow` and review those views. Use chrome-devtools-axi for interactive browser inspection when available, starting with snapshot before screenshot. Inspect important content fit, readable intentional overlap, and separation from captions, ToC, progress, and navigation. Diagnostic output is advisory and cannot replace visual review.

Review every referenced warning. Fix accidental collisions, indistinct active chrome, and missing/too-small/browser-default attribution in presentation or host CSS. Only genuinely intentional, readable overlaps may receive `data-presentation-allow-overlap` on the smallest appropriate subtree; do not blanket-exempt a scene to hide defects. Rerun inspection after fixes. A visual composition failure needs repair and re-review before success. Report checks run, route, and remaining advisory status accurately. Shut down local preview/browser processes after checks; do not publish.
