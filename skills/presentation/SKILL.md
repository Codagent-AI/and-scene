---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with self-bootstrapping React infrastructure and build, render, and visual verification.
---

# Presentation

Resolve this skill directory from the location of this `SKILL.md`, never from the caller's working directory. All template references below are relative to this directory: `templates/bootstrap/` is a complete app; `templates/presentation/` is a new-presentation skeleton. `scaffold.mjs` is an optional additive materialization helper, not a substitute for understanding the host's contracts.

## Gather

Use supplied details first. Ask one clarifying question at a time for missing topic, visual style, and each beat's content and visual description. Capture the step title, caption, visual state, and what persists or changes between beats. Do not invent details while the user can still provide them. The user controls depth: offer the ability to build from partial detail and iterate, and honor an explicit choice to do so without a completeness gate. If all details are supplied, proceed. Optionally draw ASCII mockups for key or complex steps to confirm layout; do not require mockups for every step.

## Resolve infrastructure

Before either creation or modification, inspect the actual project for three contracts: a working Vite/React/TypeScript build; a generic Step/Scene engine with grouped state, motion, navigation, captions, ToC and fit scaling; and a registry mapping presentations to routes. Cosmetic naming, formatting, and extra dependencies do not invalidate an anchor. The helper detects conventional contracts; manually confirm semantically equivalent implementations it cannot recognize, and reuse them.

If all anchors exist, reuse the app. Otherwise resolve the target before writes. Empty or standalone projects use the root. A monorepo signaled by package workspaces, `pnpm-workspace.yaml`, `packages/`, or `apps/` gets its own self-contained `presentations/` app. An existing presentation app takes precedence over enclosing monorepo signals. For any non-empty project lacking the scene kit or registry, state the exact target location and obtain confirmation before writing. Do not treat invoking this skill as target confirmation.

Copy only missing anchors from the bootstrap, preserving host setup, other presentations, and unrelated files. The helper can be invoked by absolute skill-relative path: `node <skill-directory>/scaffold.mjs <target-root>`; add `--confirm` only after confirmation. Check any existing entry point and wire the registry router into it without replacing unrelated host behavior. Inspect anchors again after partial scaffolding.

Ensure/install React, React DOM, Motion, and Lucide runtime dependencies, plus Vite, the React plugin, TypeScript, React/DOM/Node types, the ESLint stack, and Playwright. Do not assume packages or browser binaries are present. Use the committed lock file and `npm ci` in fresh materializations; use package installation to reconcile partial hosts. Install Chromium with `npx playwright install chromium` when required. Templates must resolve from this skill directory even when invoked from elsewhere.

The bootstrap and kit have zero presentation styling defaults. Do not introduce Tailwind, theme tokens, palette, fonts, spacing scales, card/button appearances, borders, or shadows there. Plain presentation-owned CSS is the default. A styling framework is allowed only when already used by the host or explicitly requested. Preserve byte parity between the canonical kit and bootstrap snapshot when maintaining this skill; keep scaffolded browser scripts aligned too.

## Create or modify

For creation, choose an unused slug, copy the presentation skeleton into `src/presentations/<slug>/`, define local entity IDs in `entities.ts`, and compose generic primitives in typed `steps/*` scenes. Write `Talk.tsx` and presentation-owned CSS. Add exactly one explicit `{ slug, title, load: () => import('./<slug>/Talk') }` registry entry. Preserve all other files/entries and verify existing routes remain registered.

For modification, first identify the target. If unspecified or ambiguous, list the existing presentations and ask which one before edits. Once identified, ask only about requested changes to steps, entities, or style; do not repeat the create interview. Limit edits to that presentation and necessary registry/verification artifacts.

Use one evolving diagram, not unrelated slides. Every step needs a stable id, era, one-line title, paragraph caption, and scene/payload. Derive numbering from array order. Share Scene and groupKey for successive states so the component remains mounted. Use stable namespaced layoutIds for continuing entities, layout morphs for changes, delayed Appear only when an entity is first introduced, and exit animations for departures. Keep existing entities keyed; do not remount/fade the entire scene at every beat. Use absolute SceneLayer coordinates on the default 880 × 380 canvas. Preserve readable intentional overlaps. Raw motion elements with stable layoutIds are allowed for custom shapes.

Presentation or host CSS owns every visual treatment. Style the kit's `data-presentation-*` hooks, make current progress/ToC controls visibly distinct, and give the bottom-right `data-presentation-attribution` link legible intentional typography. Keep default top-left branding absent unless the host explicitly supplies it. Respect title-focused present mode, reading-focused browse mode, keyboard/touch controls and clamped boundaries.

## Verify and repair

Before reporting completion, run the whole app build and at least a first-step real-browser render check of the created/modified route with no console or runtime errors. Run `npm run verify` for completion (the canonical reference is checked across every step); also render the actual target route, not just the reference. Fix build/render failures and rerun the affected checks before success.

For visual composition, prefer `npm run inspect -- <slug>`, the project-local helper. It captures every settled step from production preview using local Playwright dependencies. If unavailable, place any temporary Playwright helper under the project root, never outside it. Review screenshots or equivalent browser views of the first, last, and dense/key steps; also check a narrow viewport for responsive-sensitive work. Important content must fit the canvas, readable intentional overlaps must remain intact, and text must not collide accidentally with captions, navigation, progress, or ToC. Review every cited advisory overlap/chrome/attribution warning. Fix accidental collisions, indistinct active navigation, and illegible/browser-default attribution in local CSS. Only mark genuinely intentional readable overlap subtrees with `data-presentation-allow-overlap`; never blanket-exempt a broken scene. Re-run capture and affected checks after repairs. Warnings are inspection aids, not an automated visual pass/fail score. Report the checks and remaining advisory status accurately; never report completion with an unresolved functional or visual failure.
