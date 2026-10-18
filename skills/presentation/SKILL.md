---
name: presentation
description: Create or modify a browser presentation (one evolving diagrammatic scene, not a deck of slides) from a topic. Use when the user asks to make, build, or change a presentation or talk. Scaffolds the Vite + React + TypeScript app and scene kit when missing, generates the presentation, and verifies it builds and renders.
---

# Presentation

A presentation is **one scene that evolves through named steps**. Entities have stable
identities; between steps they morph in place, enter, or exit. It is never a stack of
unrelated slides. Each step has a stable id, an era (section) label, a one-line presenter
title, a browse caption (paragraph) and the diagram state shown while it is active.

`SKILL_DIR` below is the directory containing this `SKILL.md`. Resolve every template and
helper path relative to it (`$SKILL_DIR/templates/bootstrap/`,
`$SKILL_DIR/templates/presentation/`, `$SKILL_DIR/scripts/`), never relative to the
current working directory.

## 1. Decide: create or modify

- New presentation → follow steps 2–6.
- Change to an existing one → run step 3 first (resolve the target and scaffold anything
  missing, exactly as for a new presentation), then follow "Modifying a presentation" at the
  end, then step 6. The scaffold preflight applies before creating **or modifying**.

## 2. Gather

Ask the user **one question at a time** for whatever is missing:

1. the topic,
2. the visual style,
3. for each step: its content and what the diagram shows.

Do not assume details the user can still provide. The user controls the depth: if they
choose to build with partial detail, build from what you have and iterate afterwards; there
is no completeness gate. If the prompt already contains the topic, style and every step,
proceed without further questions.

For a key or complex step you may draw an ASCII mockup to confirm the layout before
building. This is optional; do not do it for every step.

## 3. Resolve the target and scaffold

Run the planner (it only reads):

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" plan --cwd <project>
```

It reports the `targetDir`, which of the three contract anchors exist, and which are
`missing`. The anchors are detected by contract, not by file names:

1. **Build setup** — a Vite + React + TypeScript app whose `npm run build` works.
2. **Scene kit** — the step contract, the stage that mounts the active step and runs
   morphs, present/browse navigation, chrome (captions, table of contents) and the
   fit-scale canvas.
3. **Presentation index** — the registry mapping each presentation slug to a route.

Target resolution: an empty or standalone project scaffolds at the project root. A monorepo
(root `package.json` `workspaces`, `pnpm-workspace.yaml`, or a `packages/` or `apps/`
directory) gets a self-contained app in `presentations/` instead of changes at the
monorepo root. If you are already inside a presentation app, use it.

- **All three anchors present:** skip scaffolding and go straight to step 4 (or to the modify steps). Do not ask
  for scaffold confirmation.
- **Some anchors missing:** scaffold only the missing ones and leave existing files alone
  (the helper never overwrites a file; it lists `skipped` files, so merge those by hand,
  for example wiring the router into an existing entry point).
- **Non-empty project with anything missing** (including only the build setup): first tell
  the user the resolved target directory and what will be added, and write only after they
  confirm. An empty directory needs no confirmation.

Then apply, adding `--confirm` only after the user agreed, and `--install` so the
dependencies are installed (never assume they are):

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" apply --cwd <project> [--confirm] --install
npx playwright install chromium   # if a browser is not already available
```

The scaffold is styling-framework-neutral: it adds React, Vite, TypeScript, Motion, Lucide
icons, ESLint and Playwright, and ships no colors, fonts, themes or Tailwind. Add a styling
framework only if the host project already uses one or the user asks for it.

## 4. Generate

```bash
node "$SKILL_DIR/scripts/new-presentation.mjs" create <slug> "<Title>" --cwd <project>
```

This copies the presentation template to `src/presentations/<slug>/` and appends one entry
to `src/presentations/index.ts`; existing presentations are never touched. If the app keeps
an equivalent registry under another name or shape, the helper refuses before writing
anything and says so (the plan's `indexFiles` lists the registry files it found). Then run
the same command with `--no-register` to copy only the folder, and add the entry by hand to
that registry, following its own pattern (slug, title, lazy `import()` of the folder's
`Talk`). Never leave the folder unregistered. Then edit the new folder:

- `entities.ts` — the presentation's stable entity ids (its `layoutId` namespace) and
  geometry on the 880 × 380 design canvas.
- `Scene.tsx` / `steps.ts` — one `Scene` shared by all steps of a group; each step adds,
  moves or removes entities. Keep a persisting entity in its keyed `Appear` so it morphs
  rather than re-entering; only newcomers enter, and they enter after the others settle.
  Build entities from the kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`), or use raw `motion` elements with a stable `layoutId` for coordinate-heavy
  diagrams.
- `talk.css` — **all** styling lives here (or in the host app), as plain CSS by default.
  Never put colors, fonts, borders or shadows in `src/presentation-kit/`.
  Style the active progress and table-of-contents entries
  (`[data-presentation-active="true"]`) so the current step is visibly distinct, and style
  the attribution (`[data-presentation-attribution]`) so it is legible.
- Mark an overlap that is intentional and readable with `data-presentation-allow-overlap`
  on that subtree only.

Keep text and entities clear of the chrome (header, caption, progress, table of contents,
prev/next, attribution).

## 5. Quality bar

Every presentation builds with no type errors, renders its first step without runtime or
console errors, shows a caption per step, supports next/previous navigation, passes the
visual composition check, and follows the evolving-scene model (stable entities, grouped
scene, no redraws).

## 6. Self-verify before reporting done

Run, in order, fixing and re-running whenever something fails. Never report success while a
required check fails.

1. `npm run build` — fix type and build errors.
2. A render check of at least the first step of the new route with no runtime or console
   errors (`npm run verify` does this for every step; use it for the final gate).
3. Visual composition, with the project-local screenshot helper:
   `npm run inspect -- <slug>` (add `--narrow` for a 390 × 844 pass when the presentation is
   responsive-sensitive). It waits for each transition to settle, writes
   `.presentation-inspection/<slug>/step-NN.png`, and prints advisory warnings. Look at the
   screenshots of the **first step, the last step, and every dense or key step**: important
   content must fit the canvas, intentional overlaps must stay readable, and nothing may
   collide with the chrome. If the helper is unavailable, write any temporary Playwright
   script under the project root so it resolves local dependencies, never outside the
   project tree.
4. Review every warning the helper prints: fix accidental overlaps, indistinct current-step
   chrome and unpolished attribution (in `talk.css`), and mark only genuinely intentional,
   readable overlaps with `data-presentation-allow-overlap`. Re-run the helper afterwards.
5. Report the final build, render and inspection results and any remaining advisory
   warnings accurately.

## Modifying a presentation

1. Identify the target. If the user did not name one, or the name is ambiguous, list the
   registered presentations (`node "$SKILL_DIR/scripts/new-presentation.mjs" list --cwd
   <project>`; if it cannot read an equivalent registry, read the registry file named in
   the plan's `indexFiles` yourself) and ask which one **before changing anything**.
2. Once the target is known, ask only about the requested changes (steps, entities or
   style) and edit that presentation in place. Do not re-run the full gathering flow or
   touch other presentations.
3. Run step 6.
