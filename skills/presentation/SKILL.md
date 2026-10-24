---
name: presentation
description: Create or modify browser presentations as one evolving diagram; bootstrap the scene kit when needed.
---

# Presentation

A presentation is one evolving diagram with stable entities, not independent slides.
Resolve `templates/bootstrap/`, `templates/presentation/`, and `scaffold.mjs`
relative to **this SKILL.md's absolute directory**, never the caller's cwd.

## Gather

Distinguish create from modify. For an unspecified/ambiguous modify target, read
the registry, list existing presentations, and ask which before any edit. Once
identified, ask only about requested steps, entities, or style; skip the create
interview and edit only that presentation and necessary registration/verification.

For create, use details already supplied. Ask for missing topic, visual style,
and each step's content and visual description **one question at a time**. Include
title, caption, visual, and what persists/morphs on the link to the next beat. Do
not assume details the user can still provide. The human controls depth: accept
an explicit choice to build with partial detail and iterate without a hard
completeness gate. Complete prompts need no questions. Optionally show an ASCII
mockup for key/complex layouts, without requiring one for every step.

## Resolve target and scaffold

Detect three **contracts**, not exact paths or byte-identical files:
1. Vite + React + TypeScript build setup with working npm run build.
2. Topic-agnostic scene kit: typed Step/Scene, stage/morphs, present/browse
   navigation/chrome, captions/ToC, fixed-canvas fit scaling.
3. Explicit presentation registry with individual routes.

Cosmetic differences, filenames, formatting, or extra dependencies do not mean
an anchor is missing. All present: reuse them. None present: full scaffold.
Partial: add only missing anchors/dependencies without disturbing existing ones.
Already inside a presentation app: reuse its target. Otherwise monorepo signals
(package.json workspaces, pnpm-workspace.yaml, or packages/apps layout) select a
self-contained `presentations/` app; empty/standalone projects select root.
Preserve monorepo root build setup and unrelated files. In **any non-empty project
lacking kit or index**, state the resolved target and wait for user confirmation
before scaffold writes, including partial monorepos.

Copy missing infrastructure from the skill-relative bootstrap. The optional helper
accepts an already resolved target and only the missing anchors:

```
node /absolute/skill/directory/scaffold.mjs --target /resolved/app --anchors build,kit,index
```

It refuses nonidentical existing files. For adapted host paths, integrate missing
contracts deliberately instead of overwriting existing ones. Ensure all runtime
dependencies (React, React DOM, Motion, Lucide) and dev dependencies (Vite, React
plugin, TypeScript, React/React DOM/Node typings, ESLint/TypeScript/hooks/refresh
stack, Playwright). Never assume dependencies or browsers exist. Use npm ci with
the unchanged bootstrap lock; npm install when merging host dependencies. Install
Chromium with npx playwright install chromium if needed.

The scaffold/kit have **zero visual defaults**: no palette, typography, spacing
scale, borders, shadows, theme tokens, card/button treatments, or styling-framework
dependency. Plain presentation-owned CSS is default. Add Tailwind or another
framework only if already hosted or explicitly requested, never as a kit dependency.

## Generate or modify

Copy templates/presentation into src/presentations/<unique-slug>/. Author its own
entities.ts, steps, Talk.tsx, and local CSS; register one explicit lazy import in
src/presentations/index.ts. Preserve all prior files, entries, and routes. Modify
only the selected presentation and necessary registration/verification artifacts.

Each ordered typed Step has id, era, title, caption, Scene, payload, and optional
groupKey; on-screen numbering derives from array order. Namespace stable layoutIds
in entities.ts. Group adjacent states with the same Scene/groupKey so the mounted
instance persists and receives new payload. Continuing identities morph their
position/size/label/emphasis; use AnimatePresence for departures, and Appear for
new entities after layout motion settles. Stable keyed entry wrappers must never
replay a newcomer fade on continuing entities. SceneLayer prevents reflow between
layers. Raw motion elements with stable layoutIds and literal coordinates are valid
when a generic primitive does not fit. Preserve readable intentional stacking and
overlap rather than flattening compositions for an implementation pattern.

Render Presentation with steps, title, and optional initialMode. Canvas defaults
to 880x380, uniformly fit without internal reflow. The kit provides keyboard,
swipe, progress/era jumps, clamped boundaries, and present/browse modes. Style
stable data-presentation-* hooks locally: visibly distinguish active progress/ToC
in addition to semantic current state; make the bottom-right
[data-presentation-attribution] link legible and intentional. Top-left branding is
host opt-in. Keep all visual decisions out of the reusable kit.

## Verify, repair, and review composition

Before reporting completion run the whole-app build and at least first-step clean
browser render of the created/modified route. Prefer
`node scripts/verify.mjs --slug <slug>` for build + every-step production render;
run npm run verify as the canonical reference gate when completing this repository.
Fix type/build/render failures and rerun affected checks rather than calling broken
output successful. Every step needs a browse caption and next/previous navigation.

Prefer the **project-local** `npm run inspect -- <slug>` helper: it resolves local
Playwright, waits for settled transitions, captures each step, and prints advisory
collision/active-state/attribution warnings. If absent, put any temporary Playwright
helper under project root, never elsewhere. Review first, last, and dense/key
screenshots or equivalent browser views; responsive-sensitive scenes also need a
narrow view, e.g. `npm run inspect -- <slug> --width 390 --height 844`. In this repo
use chrome-devtools-axi for interactive browser inspection, snapshot before
screenshots, without substituting it for deterministic verification. Honor caller
restrictions reserving interactive acceptance for a separate tester.

Review every warning's cited step. Fix accidental text/chrome collisions,
indistinct active chrome and unpolished attribution. Mark only intentional readable
overlap subtrees with data-presentation-allow-overlap. Re-run inspection after
fixes. Ensure important content fits canvas, overlaps remain readable, and captions,
progress, ToC and navigation don't collide with content. Screenshots and warnings
are review artifacts, not automated proof of taste. Repair functional/composition
failures before success and report remaining advisory status accurately.
