---
name: presentation
description: Creates or modifies a browser presentation built as one evolving diagrammatic scene (stable entities moving through named steps) from a topic. Scaffolds the Vite + React + TypeScript app and scene kit when missing, then builds, renders, and visually checks the result. Use when asked to make, create, update, or modify a presentation, talk, or slide-like explainer.
---

# Presentation

A presentation is **one scene** that evolves through ordered, named steps. Entities keep a stable
identity and morph in place between steps; they are not independent slides. "Talk" is only an
informal synonym (the per-presentation entry file is `Talk.tsx`).

Everything below is relative to this file's directory (`SKILL_DIR`, the folder holding this
`SKILL.md`). Resolve `templates/` and `scripts/` from there, never from the user's current
working directory.

## 0. Decide: create or modify

- **Create** a new presentation → steps 1 to 5.
- **Modify** an existing one → step 3 (target) and the scoped path in step 4. If the request does not
  clearly name a presentation, list the registered presentations (slug and title from
  `src/presentations/index.ts`) and ask which one before changing anything. Then ask only about the
  requested changes (steps, entities, or style). Do not re-walk the full create interview.

## 1. Gather requirements (create)

Ask **one question at a time**. Cover, in this order, only what the prompt does not already give:

1. the topic,
2. the visual style (palette, typography, mood),
3. the content and visual description of each step (title, caption, what appears, moves, connects).

Never assume details the user can still provide. The user decides how much to specify: if they say to
build with partial detail, do so from what you captured, with no completeness gate, and offer to
iterate afterwards. If the prompt already holds the topic, style and every step, skip the questions.
For a key or complex step you may draw an ASCII mockup and confirm the layout; do not do this for
every step.

## 2. Resolve the target and scaffold what is missing

```bash
node SKILL_DIR/scripts/presentation-scaffold.mjs detect <project-dir>
```

The JSON names the `target` app directory, which `anchors` exist, and what is `missing`. The three
contract anchors are:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/` (the `Step`/`Scene` contract, stage, navigation, chrome).
3. **Presentation index**: `src/presentations/index.ts`, the registry mapping each slug to a route.

Detection is by contract, so cosmetic differences do not trigger re-scaffolding.

Target rules: an empty or standalone project is scaffolded at its root; inside a monorepo
(`workspaces`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) the app is scaffolded as its own
self-contained app in `presentations/`; a project that already has the kit or the index is used as is.

If `needsConfirmation` is true (the project is non-empty and lacks the kit or the index), tell the user
the exact target directory and what will be written, and **proceed only after they confirm**.

```bash
node SKILL_DIR/scripts/presentation-scaffold.mjs scaffold <project-dir> [--yes]
```

This writes only the missing anchors, never overwrites existing files, adds any missing dependencies to
`package.json`, and runs the install. Do not assume any dependency is already installed (React, Vite,
TypeScript, Motion, Lucide, ESLint, Playwright). The scaffold is styling-framework neutral and ships no
colors, fonts, spacing, card or button styles. If every anchor exists, skip scaffolding entirely.

## 3. Generate or modify

Create (from `<target>`):

```bash
node SKILL_DIR/scripts/presentation-scaffold.mjs add <target> --slug <slug> --title "<Title>"
```

This copies `templates/presentation/` to `src/presentations/<slug>/` and adds one line to the registry.
Existing presentations stay untouched. Then replace the starter content:

- `entities.ts`: the presentation's own `layoutId` namespace. One id per entity for the whole talk.
- `steps/*.ts`: one `Step` per beat: stable `id`, `era` (section label), `title` (one line),
  `caption` (paragraph), and a `payload` listing every entity visible at that step. Give adjacent
  steps of the same diagram the same `groupKey` so the scene persists and entities morph instead of
  remounting. Keep earlier entity ids in later steps; omit an id to make it animate out.
- `Scene.tsx`: composes kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
  `SceneLayer`). Use `appear` only for newcomers. Use raw coordinates on the 880 × 380 design canvas;
  fit scaling is automatic.
- `style.css`: **the presentation owns its look.** Plain CSS is the default, unless the host already uses
  a styling framework or the user asked for one. Never add colors, fonts, borders, shadows or theme
  tokens to `src/presentation-kit/`. Style the stable hooks: `[data-presentation-active]` (active
  progress and table-of-contents entries), `[data-presentation-attribution]`, `[data-presentation-kind]`,
  and the entity class names you set.

Mark a subtree whose overlap is intentional and readable with `allowOverlap` (renders
`data-presentation-allow-overlap`). Mark nothing else.

Modify: make scoped edits to the identified presentation only (and its registry line if the slug or
title changes).

## 4. Self-verify before reporting done

Run, from `<target>`, and fix everything that fails; never report success on broken output:

```bash
npm run build                                   # no type errors
npm run verify                                  # build plus render of every registered presentation
npm run inspect -- <slug>                       # settled per-step screenshots + advisory warnings
```

`npm run verify` renders every step in Chromium on `127.0.0.1` and fails on any console error, uncaught
error, or step that does not advance. While iterating you may run a lighter build plus a first-step
render, but the first-step render must show no runtime or console error before you finish.

Visual composition check: look at the screenshots under `inspection/<slug>/` (or an equivalent browser
view) for the **first step, the last step, and every dense or key step**. For presentations that are
sensitive to width, also capture a narrow viewport (`--viewport 480x800`). Important content must fit
the canvas, intentional overlaps must stay readable, and nothing may collide with captions, progress
indicators, the table of contents or the navigation controls. Prefer the project-local
`scripts/inspect-presentation.mjs`; if it is unavailable, write any temporary Playwright helper under
the project root so dependencies resolve locally, never in a path outside the project.

Review every `WARN` the helper prints, step by step: fix accidental text or chrome collisions, give the
active progress/TOC entry a visibly distinct style, and style the attribution link so it is legible. Mark
only genuinely intentional, readable overlaps with `allowOverlap`, then rerun the helper. The warnings
are advisory, so report any that remain, with the reason.

Quality bar for every presentation: builds with no type errors; renders the first step with no runtime
or console errors; shows a caption per step; supports next/previous; passes the visual check; follows the
evolving-scene model.

## 5. Report

State the route (`/<slug>`), the files changed, the build and verify results, and any remaining advisory
warnings. Keep unrelated files and other presentations exactly as they were.
