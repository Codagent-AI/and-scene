---
name: presentation
description: Creates or modifies a browser presentation from a topic, built as one evolving diagrammatic scene (stable entities that move, connect, and re-label across named steps). Use when asked to make, build, extend, or edit a presentation, talk, or animated explainer. Bootstraps the Vite + React + TypeScript scene kit when the project lacks it.
---

# Presentation

A presentation is **one scene** moving through ordered, named steps. Entities keep a
stable id, so they morph in place between steps instead of being redrawn. "Talk" is only
informal speech for presentation (the per-presentation entry component is `Talk.tsx`).

Paths below are relative to this `SKILL.md`. Run the helper by its absolute path:
`node <skill-dir>/scripts/scaffold.mjs ...`. It resolves its templates from its own
location, so the current working directory never matters.

## 1. Gather

Ask the user **one question at a time**, never assuming what they can still tell you:

1. the topic,
2. the visual style (palette, mood, typography),
3. for each step: its content and what the diagram looks like.

Skip questions the prompt already answers. The user decides how much to specify: if they
choose to build with partial detail, build from what you have and iterate — there is no
completeness gate. For a key or complex step you may draw an ASCII mockup to confirm the
layout; do not do this for every step.

## 2. Resolve the target and scaffold what is missing

A project is ready when three contract anchors exist (detection is by presence, not by a
byte-identical scaffold):

1. **Build setup** — Vite + React + TypeScript with a working `npm run build`.
2. **Scene kit** — `src/presentation-kit/` (step contract, stage, nav, chrome, nodes).
3. **Presentation index** — `src/presentations/index.ts`, the registry giving each
   presentation its own route.

```bash
node <skill-dir>/scripts/scaffold.mjs detect <project-dir>
```

prints the resolved `target`, which anchors exist, and which are `missing`. The helper
recognizes anchors by what source files export (a `Presentation` component, a
`presentations` registry array), not by their names — but it is a heuristic. **Before
trusting a `missing` result, look at the project yourself** for equivalent
implementations (a differently named kit, a registry in another file, a half-written
stub) and treat those as present: never scaffold over them. Cosmetic differences such
as file names, formatting, or extra dependencies never justify re-scaffolding. If the
`detect` output says `needsRouting: true`, the app entry point does not use the registry:
wire it (the `src/main.tsx` and `src/router.ts` templates show the pathname router)
before creating presentations. Then resolve the target:

- empty or standalone project → the target is the project root;
- monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/`|`apps/`) → a
  self-contained app under `presentations/`, leaving the monorepo root untouched;
- already inside a presentation app → use it.

If nothing is missing, skip scaffolding. Otherwise scaffold only the missing anchors:

```bash
node <skill-dir>/scripts/scaffold.mjs bootstrap <project-dir> [--confirmed] [--install]
```

In a **non-empty** project, first tell the user the target directory and what will be
added, wait for their confirmation, then pass `--confirmed` (the helper refuses with exit
code 2 otherwise). Never overwrite files that already exist. Never assume dependencies
are installed: pass `--install` (or run `npm install`) so React, Vite, TypeScript,
Motion, Lucide, the ESLint stack, and Playwright are present, then run
`npx playwright install chromium` if no browser is available.

The scaffold is styling-framework neutral and ships zero visual defaults. Do not add
Tailwind or another framework unless the host already uses one or the user asks.

## 3. Generate or modify

**Create.** Make a self-contained folder and register it:

```bash
node <skill-dir>/scripts/scaffold.mjs create <app-dir> <slug> "<Title>"
```

This copies `templates/presentation/` to `src/presentations/<slug>/` and adds one entry to
`src/presentations/index.ts`. Existing presentations are never touched. Then rewrite:

- `entities.ts` — the presentation's `layoutId` namespace (stable ids);
- `steps/meta.ts` — per step: stable `id`, `era`, one-line `title`, paragraph `caption`;
- `steps/Scene.tsx` — one persistent scene whose `payload` selects the active beat.
  Steps sharing a `groupKey` keep one scene instance, so continuing entities morph;
  only newcomers go in `<Appear>`. Build from the kit primitives (`Box`, `Label`,
  `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `SceneLayer`) or raw `motion` elements
  with stable `layoutId`s when coordinates are specific. The canvas is 880 × 380.
- `style.css` — **all** visual styling lives here (plain CSS by default), targeting the
  stable `data-presentation-*` and `data-variant` hooks. Never add styling to
  `src/presentation-kit/`. Style the active progress dot / table-of-contents entry
  (`[data-presentation-active="true"]`) so it is clearly distinct, and the attribution
  (`[data-presentation-attribution]`, "made by and-scene", bottom-right) so it is legible.

Intentional, readable overlaps are marked with `data-presentation-allow-overlap` on the
smallest subtree that needs it.

**Modify.** If the target presentation is missing or ambiguous, list the registered
presentations and ask which one before changing anything. Then ask only about the
requested changes (steps, entities, or style) and edit that presentation in place; do not
re-walk the create flow.

## 4. Self-verify before reporting done

Never report success while any check fails; fix and re-run.

1. `npm run build` — no type errors.
2. Render the first step with no console or runtime errors (`npm run verify` builds, then steps every
   registered presentation through all its steps and fails on any console or page error;
   for a quick check of just yours use `node scripts/verify.mjs --slug <slug>`).
3. Visual composition: run the project-local helper (prefer it over ad hoc scripts, which
   would not resolve Playwright from the project):

   ```bash
   npm run inspect -- <slug>            # screenshots in inspection/<slug>/step-NN.png
   ```

   Look at the first step, the last step, and any dense or key steps — and at a narrow
   viewport (`--viewport 480x800`) when the layout is responsive-sensitive. Confirm the
   scene fits the canvas, intentional overlaps stay readable, and nothing collides with
   the caption, progress dots, table of contents, or controls.
4. Review every `WARN` line the helper prints (overlap, indistinct active chrome,
   unpolished attribution). Fix accidental collisions and chrome polish in the
   presentation's CSS; add `data-presentation-allow-overlap` only to overlaps that are
   intentional and readable; re-run, and report any remaining advisory warnings honestly.

## Quality bar

Every presentation builds without type errors, renders its first step without errors,
shows a caption per step, supports next/previous navigation, passes the visual check, and
follows the evolving-scene model (stable entities, grouped scene, order-derived numbering).
