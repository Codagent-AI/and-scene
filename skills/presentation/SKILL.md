---
name: presentation
description: Create or modify a browser presentation as one evolving scene, with a reusable React kit and production verification.
---

# Presentation

Use this procedure to turn a topic into an evolving browser scene. The delivered artifact is a presentation; `Talk.tsx` is its entry component filename.

## Gather the story

For creation, read what the user already supplied. Ask about missing information one question at a time: the topic, the visual style, then each step's content and visual description. Capture a stable ID, era/section, one-line presenter title, paragraph browse caption, visual state, and what changes from the previous state for each beat. Do not invent details the user can still supply. Let the user control depth: explicitly choosing to proceed with partial detail is sufficient; there is no hard completeness gate. A complete prompt can proceed immediately. Optionally show ASCII layouts for key/complex steps when helpful; do not require them for every step.

For modification, enumerate existing registered presentations. If the target is unspecified or ambiguous, list candidates and ask which one before making changes. Once identified, ask only about requested changes to steps, entities, or style; do not repeat the create interview.

## Resolve the app and missing contracts

Resolve this file's actual directory first. All paths below are relative to that directory, never the caller's working directory: `templates/bootstrap/`, `templates/presentation/`, and `scripts/materialize.mjs`.

Inspect the project for three *contracts*, not exact filenames or byte equality:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit with typed Step/Scene contracts, layout morphs, grouped persistence, mode/navigation/chrome, and fit-scale canvas.
3. A presentation registry plus routes supporting coexistence.

Formatting, alternate filenames, or extra dependencies do not mean an anchor is absent. If all three exist, reuse the app and skip scaffolding. If some exist, preserve them and add only missing contracts and their dependencies; adapt imports/routing to existing conventions. Never overwrite existing anchors just to match the template.

If already inside a presentation app, use it. Otherwise detect a monorepo by package.json `workspaces`, `pnpm-workspace.yaml`, or `packages/` or `apps/` directories. In a monorepo, target a self-contained `presentations/` app, preserving the root build and unrelated content. In an empty/standalone project, target the root. When the project is non-empty and lacks the kit or index, state the resolved target and obtain confirmation before writes. If an existing `presentations/` directory contains unrelated files, inspect and integrate without overwriting them; clarify target conflicts before mutation.

For a fully missing scaffold in an empty target, run `node <skill-directory>/scripts/materialize.mjs <absolute-target>`. It copies only the distributable bootstrap; it refuses overwrites and resolves templates from its own directory. For partial scaffolds, selectively copy the missing template files after inspecting their contracts, merging package scripts/dependencies rather than replacing existing manifests. Install all required dependencies; never assume they are available:

- Runtime: react, react-dom, motion, lucide-react.
- Build/dev: vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/node, eslint, @eslint/js, globals, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, playwright.

Use the committed lock with `npm ci` for a full bootstrap. For adapted manifests, update lock data with npm install. Install Chromium using `npx playwright install chromium` if unavailable. The bootstrap has no visual defaults or styling-framework dependency. Do not introduce Tailwind, a Tailwind plugin, theme tokens, fonts, palette, borders, shadows, card/button treatments, or a spacing scale into the kit/scaffold. Use presentation-local plain CSS unless the host already uses a framework or the user requests one.

## Generate or modify

Use `templates/presentation/` as a shape reference, adapting its typed payload and scene. Create `src/presentations/<slug>/entities.ts`, `steps/*.tsx`, `Talk.tsx`, and presentation-owned CSS. Namespace stable entity IDs by slug. Add one explicit lazy registry entry `{slug, title, load: () => import('./<slug>/Talk')}` and preserve all existing entries and folders. Confirm landing links and routes still support coexistence. Do not auto-register with glob imports.

One diagram evolves through all beats. Group successive states using the same `groupKey` and Scene component so only payload updates. Use kit primitives or raw motion elements with stable layoutIds for literal coordinates. Keep continuing entities out of fresh fade wrappers; a keyed Appear wrapper may remain mounted with a continuing identity, but must never be keyed by step index. Appear waits for continuing layout motion before introducing new entities; AnimatePresence handles departures. Preserve readable intentional stacks instead of spreading them to suit a pattern. Step numbers derive from array order.

Use the 880 × 380 canvas and kit navigation/scaling. Provide title and browse caption per step. Style palette, typography, spacing, nodes, progress/ToC active hooks, controls, and attribution in presentation/host CSS. The kit's `data-presentation-*` hooks are the contract. Give `[data-presentation-active="true"]` an obvious visual distinction and `[data-presentation-attribution]` a legible, intentional appearance. Keep the bottom-right “made by and-scene” link unless explicitly overriding it; header branding is opt-in.

For modifications, edit only the selected presentation and strictly necessary registry/verification integration. Preserve unrelated presentations and their routes.

## Verify before success

Run `npm run build`, then `npm run verify -- <slug>` (at minimum the generated first step must render without runtime or console errors; this driver checks every step). In this repository also run `npm run verify` for the normative nine-step reference sample. Fix build/render errors and rerun the affected checks before success.

Perform browser visual composition review before reporting completion. Prefer `npm run inspect -- <slug>`: it captures every settled step from a production preview using project-local Playwright. For responsive-sensitive work also run `npm run inspect -- <slug> 390`. If the helper is absent, put a temporary Playwright helper under the project root so local dependencies resolve; do not place it in /tmp or another outside directory.

Review screenshots of first, last, and dense/key steps. Important content must fit the canvas, intentional overlap must stay readable, and scene text must not collide accidentally with captions, progress, ToC, or navigation. Review every cited overlap/chrome/attribution warning at its referenced step. Fix accidental collisions, indistinct active navigation, and unpolished attribution in local CSS. Only genuinely intentional, readable overlap may be exempted with `data-presentation-allow-overlap` on the smallest relevant subtree. Rerun inspection after fixes. Warnings and screenshots are advisory artifacts, not an automated visual score and not a substitute for looking at the composition.

Use chrome-devtools-axi for interactive browser inspection where available: start with snapshot, then inspect settled screenshots. Use 127.0.0.1 for all local browser URLs. Stop previews after use. Never report success while functional or visual checks fail; fix and recheck. Report the route, changed files, build/render outcome, visual review coverage, and any remaining advisory status accurately.
