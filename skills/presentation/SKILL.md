---
name: presentation
description: Create or modify a browser presentation as one evolving diagram, with a reusable React scene kit and build/render/visual verification.
---

# Presentation

Use this procedure for a topic-driven evolving-scene presentation, or a scoped
change to an existing presentation. A presentation is the artifact; `Talk.tsx`
is merely its entry filename. Do not build disconnected slide components.

## Gather the story

Read the supplied request before asking anything. Gather the topic, visual style,
and the content AND visual description of each step. Ask **one question at a
time**, only for missing details; never invent details the user can still supply.
A complete request can proceed immediately. Offer to build with partial detail
and iterate: the user controls depth, and an explicit choice to proceed removes
any completeness gate. Optionally show ASCII mockups for key or complex layouts;
do not require mockups for every step.

For modification, identify the target first. If unspecified or ambiguous, list the
registered presentations and ask which one to change before editing anything.
Once identified, ask only about the requested step, entity, or style changes;
do not walk through the create interview again.

## Resolve the target and infrastructure

Resolve this skill's directory from the loaded `SKILL.md` path, NOT the caller's
working directory. All template paths below are relative to **that directory**:
`templates/bootstrap/` and `templates/presentation/`. Never assume this skill is
installed inside the project being edited.

Detect infrastructure by contracts, not byte identity or filenames:

1. A working Vite + React + TypeScript build (`npm run build`).
2. A reusable scene kit with typed Step/Scene contracts, stage/entity morphs,
   navigation, present/browse chrome, and fixed-canvas fit scaling.
3. An index explicitly registering independent presentation routes.

Cosmetic changes, extra dependencies, or renamed files do not invalidate an
anchor. If all anchors exist, use them and skip scaffolding. If already inside a
presentation app, reuse it, filling only missing anchors. Otherwise resolve:

- Empty or standalone non-monorepo project: app at project root.
- Monorepo (`package.json` workspaces, `pnpm-workspace.yaml`, or a packages/ or
  apps/ layout): a self-contained app at `presentations/`, preserving unrelated
  root content and existing build setup. Reuse a compatible app already there.

In a **non-empty** project missing the kit or index, state the resolved target
and wait for the user's confirmation before writing. Do not overwrite an existing
anchor to make it match the snapshot. With no anchors, copy the full bootstrap;
with some anchors, merge only missing infrastructure and necessary dependencies,
package scripts, and wiring. Do not replace existing manifests wholesale. Stop
and resolve an incompatible integration with the user rather than destroying it.

Ensure dependencies are declared and installed; do not assume they exist:
`react`, `react-dom`, `motion`, `lucide-react`; development dependencies `vite`,
`@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
`@types/node`, `eslint`, `@eslint/js`, `typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `playwright`.
Preserve the dependency lock; use `npm ci` when it matches, otherwise `npm install`
to update it, then install Chromium with `npx playwright install chromium` if needed.

Bootstrap is intentionally unstyled. Do not add Tailwind, a styling plugin, theme
tokens, default fonts/colors/spacing scales, or card/button/border/shadow styling
to the kit or scaffold. Use presentation-local plain CSS by default. Use another
framework only if the host already uses it or the user explicitly requests it.
The canonical kit and bootstrap copy are a release snapshot: when maintaining
this skill, keep non-test kit files byte-aligned, and keep scripts aligned.

## Generate or modify

Copy `templates/presentation/` to `src/presentations/<slug>/`, replace placeholders
and write `entities.ts`, `steps/`, `Talk.tsx`, and presentation-owned CSS. Use
lowercase hyphenated slugs. Add exactly one explicit lazy import entry to the
existing registry; preserve every existing folder, registry entry, and route.
The bootstrap's unstyled `example` is disposable; after replacing it, update the
bootstrap verify script's `--slug` to the real route. Do not remove actual user
presentations. The landing page enumerates the registry; unknown paths fall back
to it. In an established host, integrate with its routing contract.

Give each step a stable id, era, one-line title, paragraph caption, Scene and
payload. Numbers derive from order. Use a presentation-specific layoutId namespace
and maintain identity for entities that continue across beats. Reuse the same
Scene and groupKey for successive states so the scene instance persists, changing
only payload. Continuing entities must not replay newcomer opacity animations;
keep keyed Appear wrappers mounted and use them only for actual newcomers.
Departures animate out; newcomers wait for continuing motion to settle.

Compose kit Box, Label, Arrow, Frame, Emphasis, SymbolChip, SceneLayer and Appear,
or raw motion elements with stable layoutIds for coordinate-heavy diagrams.
Preserve intentional stacking/overlap; do not spread everything out to suit a
component pattern. The canvas is 880 × 380, scaled uniformly, never internally
reflowed. The kit owns geometry, motion and navigation; your CSS owns every
visual decision, including chrome, active progress/ToC contrast and readable
`[data-presentation-attribution]`. Default attribution stays bottom-right and
links to the kit repository. Top-left branding requires explicit host opt-in.

## Verify and repair before completion

1. Build the whole app with `npm run build`, including all registered presentations.
2. Run `npm run verify -- --slug <slug>` on the generated/modified route. This must
   at least render its first step without console errors or uncaught errors; use
   the supplied driver to check every step. Also run `npm run verify` for the
   repository reference sample when present. Browser previews must bind, probe,
   and navigate using `127.0.0.1`.
3. Inspect visual composition in a browser: first step, last step, and all dense
   or key beats. Also use a narrow viewport for responsive-sensitive output.
   Prefer `npm run inspect -- <slug>`: it uses project-local Playwright, production
   preview, settled per-step screenshots and advisory diagnostics. If absent,
   write any temporary helper **under the project root** so dependencies resolve.
   Use the project's browser inspection interface for review; in the source And
   Scene repository this is `chrome-devtools-axi` (start with snapshot, then images).
4. Review screenshots/equivalent browser views: important content must fit the
   canvas, intentional overlaps must remain readable, and captions, progress,
   ToC and controls must not collide with scene content. Fix accidental collisions,
   indistinct active controls, and tiny/default-looking attribution in local CSS.
   Review every overlap/chrome warning's step. Mark only truly intentional,
   readable overlap subtrees with `data-presentation-allow-overlap`; never hide
   accidental problems with blanket exemptions. Rerun inspection after fixes.

A failed build, render, or visual check is unfinished work: fix it and recheck;
do not report it as success. Screenshots and diagnostic warnings are advisory
review artifacts, not automated proof of visual taste. Each step must have a
caption in browse mode, next/previous navigation, and evolving-scene continuity.
Report the route, changed files, checks actually run, and remaining advisory
warnings accurately only after build/render and visual composition gates pass.
