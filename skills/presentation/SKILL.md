---
name: presentation
description: Create or modify browser presentations as one evolving diagram, with a reusable scene kit and build, render, and visual verification.
---

# Presentation

Use this procedure to create or modify an evolving-scene presentation. Resolve all template paths relative to **this SKILL.md's directory**, never the caller's working directory: `templates/bootstrap/` is a complete runnable app; `templates/presentation/` is a starting point for one presentation. Keep implementation inside the target project.

## Gather

Read the request first. Ask only for missing details, **one question at a time**: topic, then visual direction, then each step's content and visual description (including what persists, enters, changes, or leaves). Do not invent details while the user can still supply them. Let the user choose how much to specify. An explicit request to build with partial detail is sufficient: record what was supplied and proceed, then iterate. A complete prompt needs no interview. For a complex/key step, an optional ASCII composition can help confirm the arrangement; do not require one per step.

For modification, identify the presentation before editing. Read the registry; if the target is absent or ambiguous, list the existing titles and routes and ask which to modify. Once identified, ask only about the requested changes. Do not restart the create interview.

## Resolve infrastructure

Inspect source and package scripts for three semantic anchors; names, formatting, extra packages, or cosmetic differences are irrelevant:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A scene kit providing typed steps/scenes, an animated active-step host, stable entity morphs, navigation, browse/present chrome, and fixed-canvas fit scaling.
3. An explicit presentation registry mapping separate presentations to routes.

If all anchors exist, reuse them. If only some exist, add only the missing anchors and their dependencies. Preserve existing build configuration, routing, presentations, lock data, and unrelated files. Adapt imports/registration to existing contracts instead of replacing working infrastructure with the snapshot.

Choose the existing presentation app if already inside one. Otherwise detect a monorepo from package.json workspaces, pnpm-workspace.yaml, or a packages/ or apps/ layout: put a self-contained app under `presentations/`, preserving the root. Use the root for an empty or standalone project. In a **non-empty project missing the scene kit or registry**, state the exact proposed target and wait for user confirmation before scaffolding. Explain that this confirmation is required by this skill's self-bootstrap contract. Existing session confirmation for that target suffices.

For a fresh app copy `templates/bootstrap/` including hidden config and lock files. It contains an intentionally unstyled two-step `example` route; replace that demonstration when creating the first real presentation. For a partial app selectively merge missing files/scripts and use the project's package manager to update its lock data when dependencies change; never overwrite an existing manifest or lock with the template's. Install in locked mode once manifests and lock agree.

Ensure runtime dependencies `react`, `react-dom`, `motion`, `lucide-react`; development dependencies `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`, and `playwright`. The supplied manifest also provides the test stack. Run `npm ci` in a copied bootstrap and `npx playwright install chromium` if its browser is missing. Do not assume dependencies are installed. No Tailwind, theme, styling plugin, or framework is required; use plain CSS unless the host already uses a framework or the user requests one.

## Create or modify

Create `src/presentations/<slug>/Talk.tsx`, `entities.ts`, typed steps/scenes under `steps/`, and presentation-owned CSS. Use `templates/presentation/` as a minimal contract example. Namespace stable entity IDs by slug. Register `{ slug, title, load: () => import('./<slug>/Talk') }` without removing existing entries. Preserve existing presentation folders and routes. For modification, edit only the identified presentation and any necessary registry/verification artifacts.

Model one evolving diagram, not unrelated slides. Every Step has a stable id, era, one-line title, paragraph caption, Scene and typed payload. Numbering derives from array order. Adjacent states of the same diagram share both Scene and groupKey, updating payload without remounting. Use stable layoutId identities for persisting entities; do not wrap continuing entities in a fresh fade. Use Appear for newcomers after shared layout motion settles, AnimatePresence for exits, and SceneLayer for absolute layers. The fixed 880 × 380 canvas scales uniformly; choose literal coordinates when helpful. Reuse kit primitives or raw motion elements with stable layout identities. Keep StrictMode.

All colors, typography, spacing, borders, shadows, cards, controls, and theme choices belong to the presentation or host CSS. Do not theme the kit or change its bootstrap snapshot to suit a topic. Style stable data-presentation hooks, including visibly distinct `[data-presentation-active="true"]` progress/ToC controls and legible `[data-presentation-attribution]`. Keep the default bottom-right linked attribution; host branding in the header is opt-in. Preserve caption/navigation behavior, keyboard focus handling, clamp boundaries, and browse/present position.

## Verify and repair

Run from the target app root:

- `npm run build` and the project lint/tests relevant to the edits.
- `node scripts/verify.mjs <slug>` for the created/modified registered route. It builds and checks every step in Chromium against production preview on 127.0.0.1, failing on console/page errors or stalled step indices. In this source repository also run `npm run verify` without a slug to enforce the normative nine-step sample. In bootstrapped apps update the verify npm script to name the intended presentation instead of `example`.
- `npm run inspect -- <slug>` using the **project-local helper**. It captures all settled steps under `inspection/<slug>/` and records advisory diagnostics. Prefer it over ad hoc helpers; if absent, place any temporary Playwright helper inside the project so local dependencies resolve.

Inspect actual screenshots/browser views of the first, last, and dense/key steps; also inspect a narrow viewport for responsive-sensitive work. Use chrome-devtools-axi where available: start with snapshot, then screenshots. Check scene content fits, persistent entities retain continuity, captions and ToC do not collide with the diagram, active navigation is distinct, and attribution is polished. Exercise keyboard, touch, direct jumps, mode preservation, and both boundaries.

Review every advisory warning at its referenced step. Fix accidental collisions, indistinct active chrome, and undersized/default attribution in presentation CSS. Only a deliberate readable overlap may receive `data-presentation-allow-overlap` on its narrowest intentional subtree. Never mark the entire presentation to hide warnings. Repeat build/render/inspection after repairs. A diagnostic warning is advisory evidence for inspection, not a substitute for looking at the screenshots.

Do not report success with broken build, rendering, or composition. Fix failures and recheck. Report routes, final check results, visual views inspected, and any remaining advisory warnings accurately. Keep generated build output, dependencies, and screenshots out of commits. Do not publish or add hosted CI.
