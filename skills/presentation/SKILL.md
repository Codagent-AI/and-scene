---
name: presentation
description: Creates or modifies browser-based presentations that run as one evolving diagrammatic scene (stable entities moving through named steps), scaffolding the Vite + React + TypeScript app and scene kit when they are missing. Use when asked to make, build, create, edit, or change a presentation, talk, or slide-style walkthrough from a topic.
---

# Presentation

A presentation is **one scene** that moves through ordered, named steps. Entities (boxes, labels,
arrows, frames, emphasis markers) keep a stable id, so between steps they move, re-label and
connect in place instead of being replaced. Each step also has an era (section) label, a one-line
presenter title and a paragraph browse caption. "Talk" is only a synonym in conversation; the
per-presentation entry component is named `Talk.tsx` for historical reasons.

The skill is hybrid: this document is the procedure and quality bar; `templates/` and
`scripts/presentation-tool.mjs` keep generated output consistent.

**Paths.** Everything bundled with this skill lives next to this `SKILL.md`:
`templates/bootstrap/` (a complete app), `templates/presentation/` (one presentation) and
`scripts/presentation-tool.mjs`. Resolve them from this file's directory, never from the
current working directory. Below, `TOOL` means `node <this skill dir>/scripts/presentation-tool.mjs`.

## 1. Gather

Ask the user **one question at a time**. Cover, in this order, whatever the prompt left out:

1. the topic (and audience, if it changes the story),
2. the visual style (mood, palette, typography, density),
3. each step: its era, title, caption, and a description of what the scene shows at that step
   (what appears, moves, connects, changes label).

Do not assume details the user can still supply. The user decides how deep to go: if they choose
to build with partial detail, build from what you have and offer to iterate; do not block on a
completeness gate. If the prompt already has the topic, style and every step, build without
further questions. For a key or complex step you may draw an ASCII mockup to confirm the layout
before building; do not do this for every step.

When modifying, identify the target first (see 3b) and ask only about the requested changes.

## 2. Resolve the target and scaffold what is missing

Run `TOOL detect <project dir>`. It reports the resolved `target` app directory, the `kind`
(`empty`, `standalone`, `monorepo`, `existing-app`), which of the three **contract anchors** are
present in that target, which are `missing`, and `needsConfirmation`.

The anchors are:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/`, the presentation-agnostic engine (step contract, stage,
   present/browse navigation, chrome, fixed-canvas fit scaling, node primitives).
3. **Presentation index**: `src/presentations/index.ts`, the registry that maps each presentation
   to its own route, plus the router and landing page.

Detection is by contract, so cosmetic differences (file naming, formatting, extra dependencies)
do not trigger re-scaffolding. Anchors are judged in the resolved target app.

Target rules:

- Empty or standalone project: scaffold at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
  directory): scaffold a self-contained app in `presentations/`. Never modify the monorepo root;
  a root build setup does not satisfy the target app's build anchor.
- Already inside a presentation app (kit or index anchor present): use it and scaffold only what
  is missing.

If `needsConfirmation` is true (non-empty project with missing anchors), **state the target
directory and what will be added, and wait for the user to confirm before writing anything**.
Empty directories and fully scaffolded apps need no confirmation.

Then run `TOOL bootstrap <target> ` (add `--no-install` only when you will install yourself). It
copies only the missing anchors from `templates/bootstrap/`, never overwrites existing files, merges
missing dependencies into an existing `package.json`, and runs `npm install`. Do not assume any
dependency is installed. The scaffold is styling-framework-neutral: it ships no colors, fonts,
spacing, card or button styles, and does not require Tailwind. Run
`npx playwright install chromium` if the render check cannot find a browser.

## 3a. Create a presentation

1. Pick a kebab-case slug and run `TOOL new <target> <slug> "<Title>"`. It writes
   `src/presentations/<slug>/` (`entities.ts`, `steps/scene.tsx`, `steps/index.ts`, `Talk.tsx`,
   `styles.css`) from the templates and registers the presentation in `src/presentations/index.ts`
   with its route `/<slug>`. Existing presentations are left untouched.
2. Fill in `entities.ts` (the presentation's `layoutId` namespace: stable ids, one-based first
   step, canvas coordinates on the 880 x 380 design canvas) and `steps/index.ts` (era, title,
   caption per step). Keep every step in one shared group (same `groupKey` and `Scene`) so the
   scene persists and entities morph; give each entity its coordinates once and keep them unless
   the story needs it to move. Wrap newcomers in `Appear`. Use `Box`, `Label`, `Arrow`, `Frame`,
   `Emphasis`, `SymbolChip` and `SceneLayer` from the kit, or raw `motion` elements with stable
   `layoutId`s when coordinates need it.
3. Style it in `styles.css` (plain CSS, scoped under the presentation's class), or in host-owned
   CSS. **Never put visual styling in `src/presentation-kit/`.** Use plain CSS unless the host
   already uses a styling framework or the user asks for one. Style the stable hooks:
   `[data-presentation-marker]`, `[data-presentation-step-title]`, `[data-presentation-caption]`,
   `[data-presentation-progress-item]` and `[data-presentation-toc-item]` with
   `[data-presentation-active='true']` (also `aria-current`), `[data-presentation-attribution]`,
   and the `.ent-<role>` classes. Make the active step visibly distinct and the attribution legible.
   Mark an intentional, readable overlap of text with `data-presentation-allow-overlap` on that
   subtree only.

## 3b. Modify a presentation

If the user did not name a clear target, list the presentations in `src/presentations/index.ts`
and ask which to modify before changing anything. Once identified, ask only about the requested
changes (steps, entities or style) and make scoped edits to that presentation. Do not re-run the
create flow, and leave other presentations alone.

## 4. Self-verify before reporting completion

Never report success while a check fails. Fix the cause, then re-run.

1. `npm run build` (type check and production build) must pass.
2. Render: the route must render its first step with no runtime or console errors.
   `npm run verify` builds, previews on `127.0.0.1` and steps through every registered
   presentation (and the committed sample, where the project has one); it exits non-zero and
   prints `FAIL [phase] step N` on failure. A quicker first check is acceptable while iterating,
   but run `npm run verify` before reporting done.
3. Visual composition: run `npm run inspect -- <slug>` (the project-local helper). It captures
   a settled screenshot of every step under `inspection/<slug>/` and prints advisory warnings.
   Open the screenshots of the first step, the last step and any dense or key steps (also a
   narrow viewport, for example `--viewport 390x844`, when the presentation is
   responsive-sensitive) and confirm that important content fits the canvas, intentional overlaps
   stay readable and nothing collides with the caption, progress, table of contents or
   navigation. Prefer this helper over ad hoc scripts; if you need one, keep it inside the
   project tree so Playwright resolves from the project's dependencies.
4. Review every warning, fix accidental collisions, indistinct active chrome and unpolished
   attribution in the presentation's CSS or scene, mark only genuinely intentional readable
   overlaps with `data-presentation-allow-overlap`, then re-run the inspection. Report any
   advisory warnings that remain.

## Quality bar

Every presentation builds with no type errors, renders its first step without runtime errors,
shows a caption per step, supports next/previous navigation (keys, swipe, controls), passes the
visual composition check and follows the evolving-scene model (one scene, stable entity ids).

## Keeping the template in sync

In the repository that authors this skill, `src/presentation-kit/` is canonical and
`templates/bootstrap/` carries a byte-identical snapshot; refresh it with `npm run sync:templates`.
