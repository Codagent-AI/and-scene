---
name: presentation
description: Create or modify a browser presentation from a topic, modeled as one evolving diagram (stable entities moving through named steps) on a reusable React scene kit. Use when the user asks to make, build, create, update, edit, or modify a presentation, talk, or deck. Self-bootstraps the Vite/React/TypeScript scaffold, registers each presentation at its own route, and verifies the result in a real browser.
---

# Presentation skill

A presentation is **one scene that evolves**: entities (boxes, labels, arrows, frames, emphasis marks)
keep a stable identity while ordered, named steps change them. Entities that persist morph in place;
new ones enter after the persisting ones settle; departing ones exit. This is not a deck of unrelated slides.

All paths below are relative to **this SKILL.md's directory** (`<skill>`), never to your working directory.
Run helper scripts by their full path: `node <skill>/scripts/presentation.mjs …`.

## 1. Gather (one question at a time)

Ask the user, **one question per message**, for anything still missing: the **topic**, the **visual style**
(look and feel), and each step's **content and visual description**. Do not invent details the user can
still provide. The user controls depth: if they choose to build with partial detail, accept that explicitly
and build from what was captured (no completeness gate), then iterate. If the prompt already contains the
topic, style, and all step details, proceed without more questions.

For a key or complex step you may draw an **ASCII mockup** and ask the user to confirm the layout before
building. Do not mock up every step.

## 2. Resolve the target and scaffold what is missing

```bash
node <skill>/scripts/presentation.mjs detect <project-dir>
```

The JSON reports `target`, `anchors` (`build`, `kit`, `index`), `missing`, `presentations`, and
`needsConfirmation`. The three contract anchors are detected by function, not by identical files:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/` exporting `Presentation` and the step/scene contract.
3. **Presentation index**: `src/presentations/index.ts`, the registry that gives each presentation a route.

Target rules:

- Empty or standalone project: scaffold at the project root.
- Monorepo (`workspaces`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout): scaffold a self-contained
  app in `presentations/`. Anchors are checked there; the monorepo root is never modified.
- Already inside a presentation app (kit or index present): use it and scaffold only what is missing.

If `needsConfirmation` is true (project is non-empty and something is missing), **state the target
directory and what will be added, and wait for the user to confirm before writing anything.**

Then scaffold only the missing anchors (never overwrites existing files; merges missing scripts and
dependencies into an existing `package.json`) and install. Do not assume any dependency is installed:

```bash
node <skill>/scripts/presentation.mjs scaffold <target> --install   # add --only build,kit,index to force groups
```

The scaffold sets up React, Vite, TypeScript, Motion, Lucide icons, ESLint, and Playwright (render
verification; run `npx playwright install chromium` if no Chromium is available). It is
**styling-framework-neutral and ships no visual defaults** (no Tailwind, theme, colors, fonts, card or
button styles). Add Tailwind or another framework only if the host already uses it or the user asks.
The scaffold registers a `starter` presentation so the app builds and renders; replace or delete it
(its folder plus one registry line) once a real presentation exists.

## 3. Create or modify

### Create

```bash
node <skill>/scripts/presentation.mjs create <target> <slug> "<Title>"
```

This writes `src/presentations/<slug>/` (`entities.ts`, `steps/meta.ts`, `steps/Scene.tsx`,
`steps/index.ts`, `Talk.tsx`, `talk.css`) and adds one line to `src/presentations/index.ts`; the route is
`/<slug>`. Existing presentations are untouched. Then fill it in:

- `entities.ts`: the presentation's own `layoutId` namespace, one stable id per entity.
- `steps/meta.ts`: per step a stable `id`, section `era`, one-line present `title`, browse `caption`.
  Step numbers are derived from position; never number by hand.
- `steps/Scene.tsx`: compose kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`,
  `SceneLayer`) on the fixed **880 × 380** canvas, positioned with `x`/`y`/`w`/`h`. Share one scene across
  adjacent steps with a common `groupKey` so it is not remounted. Wrap **only newcomers** in `<Appear>`
  inside `<AnimatePresence>`; never wrap an entity that continues. Keep intentional overlap and stacking.
  For coordinate-heavy diagrams use raw `motion` elements with stable `layoutId`s.
- `talk.css`: **all styling lives here** (plain CSS by default), never in `src/presentation-kit/`. Style
  the stable `data-presentation-*` hooks: make the active progress dot and active ToC entry
  (`[data-presentation-active]`, `aria-current`) visibly distinct, and make
  `[data-presentation-attribution]` ("made by and-scene") legible. Do not add a top-left brand unless the
  host asks (`brand` prop).

### Modify

If the user does not clearly name the target, **list the registered presentations
(`presentation.mjs list <target>`) and ask which to modify before changing anything.** Then ask only about
the requested changes (steps, entities, or style) and edit just that presentation, without re-walking the
create flow. Touch only its folder plus registration/verification artifacts that must change.

## 4. Self-verify before reporting done

From `<target>`:

```bash
npm run build                      # no type errors
npm run verify                     # build + render every step in Chromium on 127.0.0.1
npm run inspect -- <slug>          # settled per-step screenshots + advisory warnings
npm run inspect -- <slug> --viewport 390x844   # also for responsive-sensitive presentations
```

Prefer the project-local `inspect` helper over ad hoc scripts; if you must write a temporary Playwright
script, keep it under the project root so it resolves local dependencies. Open the screenshots (first step,
last step, and any dense or key step) and confirm: important content fits the canvas, intentional overlaps
stay readable, nothing collides with chrome (caption, progress, ToC, controls), the active step is distinct,
and the attribution is legible.

- If build, render, or verification fails: **fix it and re-run. Never report success while a check fails.**
- Review every advisory warning. Fix accidental text/chrome collisions, indistinct active chrome, and
  unpolished attribution. Mark only genuinely intentional, readable overlaps with
  `data-presentation-allow-overlap` on the smallest subtree that needs it, then re-run `inspect`.
- Quick iterations may use the lighter build plus a single-route render, but the full `npm run verify`
  must pass before you finish.

Quality bar for every presentation: builds with no type errors; first step renders with no runtime or
console errors; each step has a caption; next/previous navigation works; passes the visual composition
check; follows the evolving-scene model.

Finish by reporting accurately: the route URL, the build/verify results, what inspect warned about and
what you changed, and any advisory warnings that remain (and why they are acceptable).

## Reference

- Keys: Right/Space/PageDown next, Left/PageUp previous, `P` toggles present/browse; swipe left/right; focused
  controls keep their own keys; navigation clamps at both ends. Set `initialMode` on `<Presentation>`.
- Hooks for tooling: `data-step-count` and `data-step-index` on `[data-presentation-root]`.
- The scene kit lives canonically in `src/presentation-kit/`; `templates/bootstrap/` is a snapshot of it used
  only to bootstrap new projects (refresh with `npm run sync:templates` in the authoring repository).
