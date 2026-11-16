---
name: presentation
description: Create or modify browser presentations as one evolving scene, with self-bootstrapping React infrastructure and build/render/visual verification.
---

# Presentation

Use this hybrid procedure together with the local templates and scene kit. A presentation is one evolving diagram, not independent slides. The `Talk.tsx` filename is an entry component, not a different artifact type.

## Locate this skill

Resolve `SKILL_DIR` to the absolute directory containing **this SKILL.md**, using the installed skill location supplied by your agent environment. Resolve `templates/bootstrap/`, `templates/presentation/`, and `scaffold.mjs` relative to that directory, never relative to the user's current directory. Do not assume this repository's path on another machine.

## Gather or identify

For creation, use the supplied details first. Ask for missing information **one question at a time**: topic, visual direction, then each step's content and visual description. Capture a title, paragraph caption, scene intent, continuing entities, newcomers, departures, and what morphs between beats. Do not invent information the user can still provide. The user chooses the depth: an explicit request to proceed with partial detail is sufficient; there is no mandatory completeness gate. A prompt containing all details can proceed directly. For a key/complex layout, optionally show an ASCII mockup to confirm it; do not require mockups for every step.

For modification, identify the target before edits. If unspecified or ambiguous, list existing registered presentations and ask which one. Once identified, ask only about requested changes to steps, entities, or style. Do not repeat the create interview. Preserve unrelated presentation files and routes.

## Resolve the app and anchors

Inspect contracts, not exact filenames or bytes:

1. Build: Vite + React + TypeScript with a working `npm run build`.
2. Scene kit: typed steps/scenes, a motion stage, navigation, present/browse chrome, and fit scaling.
3. Index: an explicit presentation registry with a route for each presentation.

Alternate filenames, formatting, extra dependencies, and equivalent host implementations count. Read enough source and package scripts to establish the contract; do not replace a valid anchor just because it differs from a template.

If already in a presentation app, reuse it. Otherwise detect a monorepo through package.json `workspaces`, pnpm-workspace.yaml, or a packages/ or apps/ layout and target a self-contained `presentations/` app under that repository. Empty or standalone projects target the repository root. Assess anchors **at the resolved target**, preserving monorepo root build infrastructure. If a non-empty project lacks kit or index, state the exact target location and missing anchors and obtain confirmation before writing. Prior explicit authorization of that target suffices; do not request it again.

- All three anchors: skip scaffolding.
- None: copy the complete bootstrap. For an empty target use `node "$SKILL_DIR/scaffold.mjs" /absolute/target`. The helper is deliberately non-destructive and refuses non-empty targets. For an authorized non-empty target, merge only missing files from `templates/bootstrap/`; inspect each collision and preserve unrelated host files.
- Partial: copy only missing anchor files and merge dependencies/scripts into the existing package. Never overwrite an existing build setup, kit, index, routes, or host content. Adapt imports to existing contracts. A partial monorepo root is not the child app: create missing infrastructure in its resolved child target.

Ensure the complete dependencies even when some infrastructure already exists: runtime `react react-dom motion lucide-react`; dev `vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/node @eslint/js eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint playwright`. Preserve compatible host versions. For a full copied bootstrap run `npm ci` using its lock; for a merge install missing packages and update its lock. Install Chromium with `npx playwright install chromium` if absent. Do not assume node_modules exists. Keep unit-test dependencies if using the provided test scripts.

The bootstrap is unstyled. Do not add Tailwind, a Tailwind Vite plugin, CSS theme tokens, palette, fonts, spacing scales, borders, shadows, cards, or button defaults to the reusable kit or scaffold. An existing host framework or explicit user request may determine presentation styling; otherwise use presentation-local plain CSS. The bundled unstyled reference route keeps the full verification command usable; it is not a theme.

## Generate or modify

Copy `templates/presentation/` to `src/presentations/<slug>/`, replacing placeholders with captured content. Each presentation owns `entities.ts`, `steps/*`, `Talk.tsx`, and any visual CSS. Use lowercase hyphenated unique slugs. Add one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` entry to `src/presentations/index.ts` without replacing existing entries. Root landing enumerates the registry; each entry loads lazily at `/<slug>`. Confirm existing entries remain unchanged.

Use `Step<TPayload>` and `SceneProps<TPayload>` without boundary casts. Each step requires stable ID, era, one-line presenter title, paragraph browse caption, and scene payload. Numbering follows array order. Share `groupKey` and `Scene` for successive diagram states; React retains the component while payload changes. Keep continuing entities keyed by presentation-scoped stable `layoutId`s; do not recreate them as newcomers or wrap the whole grouped scene in a fresh fade. Use generic Box/Label/Arrow/Frame/Emphasis/SymbolChip nodes, `SceneLayer`, and presence-aware entry/exit; raw motion elements with stable layout IDs and literal coordinates are allowed. Newcomer entry starts after layout motion; departures use AnimatePresence exit. Preserve intentional stacks and overlap. Compose on the fixed 880 × 380 canvas; the kit scales uniformly with per-mode geometry.

Keep all designed styling in presentation/host CSS targeting stable `data-presentation-*` hooks, classes, or style props. Style active progress and ToC controls distinctly via `[data-presentation-active="true"]`; preserve their `aria-current` semantics. Style `[data-presentation-attribution]` locally to be legible and intentional (at least 12px is the diagnostic threshold). The default bottom-right link discloses “made by and-scene”; header branding is opt-in. Browse supplies captions, progress, prev/next, and wide-screen ToC; present is title-focused. P toggles modes without losing position. Keyboard/touch and direct navigation are kit behavior, with clamped boundaries and focused-control key protection.

For a modification, change only the selected presentation and necessary registration/verification artifacts. Preserve stable entity IDs and unaffected coordinates wherever the requested scene intent permits. Do not replace the kit to implement a presentation's look.

## Verify, review, repair

Before reporting success, run `npm run build` and `node scripts/verify.mjs <slug> --first` for at least a first-step render without console/runtime errors. Run `npm run verify` for the canonical sample's full multi-step gate; `node scripts/verify.mjs <slug>` exercises every step of another target. Verification uses production preview and Chromium on `127.0.0.1`, enumerating public `data-step-count` / `data-step-index` hooks. Fix build/render/transition failures and rerun affected checks; a failed check is never success.

Prefer `npm run inspect -- <slug>` for project-local settled screenshots and advisory diagnostics. For responsive-sensitive compositions also run `npm run inspect -- <slug> --narrow`. Images and manifest are under `artifacts/inspection/<slug>/<width>x<height>/`. If the helper is unavailable, write any temporary Playwright helper **inside the project root** so imports resolve local browser dependencies; wait for motion to settle before captures. Do not use an ad hoc helper outside the project tree.

Perform visual composition review of the first, last, and any dense/key steps using those screenshots or an equivalent browser view; include a narrow viewport when responsive-sensitive. Use `chrome-devtools-axi` for interactive browser inspection when installed: start with `snapshot`, then inspect settled composition screenshots; do not call the underlying DevTools MCP directly. Important content must fit the fixed canvas, overlaps must remain readable, and captions, progress, ToC, and controls must not collide with scene content. Browser screenshots and warnings are review artifacts, not automated proof of visual quality.

Review every diagnostic's cited step. Fix accidental text/chrome collisions, indistinct current-step chrome, and browser-default or undersized attribution in local CSS. Only genuinely intentional readable overlap may receive `data-presentation-allow-overlap="true"` on the smallest appropriate subtree. Do not silence warnings wholesale. Repeat the helper and review changed steps after repairs. Do not report completion while build, render, or composition failures remain. In the final report identify the route, changed files, checks run, visual review performed, and any remaining advisory warnings accurately. Keep generated screenshots/build output/node_modules uncommitted; stop local processes after review.
