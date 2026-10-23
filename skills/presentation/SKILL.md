---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagrammatic scene (stable entities moving through named steps), built on a reusable React scene kit. Use when the user wants a presentation, talk, or explainer made from a topic, or wants an existing presentation changed.
---

# Presentation

Generate a browser presentation from a topic. A presentation is **one scene** that evolves
through named steps: entities keep a stable id, morph when they change, enter after the
others settle, and exit when they leave. It is not a deck of independent slides.
"Talk" is only an informal synonym; the per-presentation entry file is `Talk.tsx`.

All paths below are relative to this `SKILL.md`'s directory (`$SKILL`), never the user's
working directory. Helper: `node $SKILL/scripts/skill-tools.mjs <command>`.

## 1. Gather

Ask the user **one question at a time** for anything missing; never assume what they can still tell you.

1. The topic.
2. The visual style (palette, type, mood).
3. For each step: its content (era, title, caption) and what the diagram shows.

Rules:
- The user controls depth. If they choose to build with partial detail, proceed with what you have
  and iterate; there is no completeness gate.
- If the prompt already contains the topic, style, and every step, skip the questions.
- For a key or complex step you may draw an ASCII mockup and confirm the layout. Do not do it for every step.

## 2. Resolve the target and scaffold

Run `node $SKILL/scripts/skill-tools.mjs detect <project dir>`. It reports `target`, `kind`,
and which of the three contract anchors exist (detected by presence, not byte-identity):

1. **build** – Vite + React + TypeScript app with a working `npm run build`.
2. **kit** – `src/presentation-kit/` (the `Step`/`Scene` contract, stage, navigation, chrome, fit-scale canvas).
3. **index** – `src/presentations/index.ts`, the registry mapping each presentation to its own route.

Target rules (the tool applies them):
- Empty or standalone project: scaffold at the project root.
- Monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/`/`apps/`): scaffold a self-contained app in `presentations/`; do not touch the monorepo root.
- Already inside a presentation app: use it and scaffold only the missing anchors.

If `needsConfirmation` is true (non-empty project missing the kit or index), **state the target
location and wait for the user to confirm before writing anything.**

Then `node $SKILL/scripts/skill-tools.mjs scaffold <project dir>` copies only the missing anchors
(existing files are never overwritten) from `templates/bootstrap/`. Do not assume dependencies are
installed: run `npm install` and `npx playwright install chromium` in the target.

The scaffold is styling-framework-neutral and ships zero presentation styling. Add Tailwind or
another framework only if the host already uses it or the user asks.

## 3. Create or modify

**Create:** `node $SKILL/scripts/skill-tools.mjs new <target> <slug> "<Title>"` writes a self-contained folder
`src/presentations/<slug>/` (`entities.ts`, `steps/*`, `Talk.tsx`) from `templates/presentation/` and registers
it; other presentations stay untouched. Then edit it:
- `entities.ts` – this presentation's `layoutId` namespace (ids prefixed with the slug).
- `steps/meta.ts` – per step: `id`, `era`, `title` (one-liner), `caption` (paragraph).
- `steps/Scene.tsx` – compose kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`)
  inside `<SceneLayer>`, keyed by entity id. Steps that share a `groupKey` and Scene keep one mounted
  scene, so add entities as the story grows rather than redrawing. Keep intentional overlaps; raw
  `motion` elements with stable `layoutId`s are fine for coordinate-heavy diagrams.
- Canvas is 880 × 380 design units, scaled uniformly to fit.
- **Styling lives in the presentation** (a `style.css` imported by `Talk.tsx`, plain CSS by default),
  never in `src/presentation-kit/`, which has no styling defaults. Style the hooks: `data-presentation-*`
  attributes, entity kinds, the active dot / ToC entry (`[data-presentation-active='true']`, `aria-current`),
  and `[data-presentation-attribution]` so the "made by and-scene" link is legible. Do not add a top-left brand unless asked.

**Modify:** if the target is missing or ambiguous, list the registered presentations and ask which one
before changing anything. Then ask only about the requested changes (steps, entities, or style) and edit
that presentation in place; do not re-run the create flow.

## 4. Self-verify before reporting done

Never report success while a check fails. Fix, then re-run.

1. `npm run build` – no type errors.
2. Render check – at least the first step renders with no console/runtime errors; `npm run verify` renders every step.
3. Visual composition – `npm run inspect -- <slug>` (project-local helper; prefer it over ad hoc scripts, and put any
   temporary Playwright script under the project root so dependencies resolve locally). It writes settled per-step
   screenshots to `.inspection/<slug>/<viewport>/` and prints advisory warnings. Look at the first step, the last step,
   and dense/key steps; for responsive-sensitive presentations also run `-- --viewport 390x844`.
4. Review every warning: fix accidental text/chrome collisions, indistinct current-step chrome, and unpolished
   attribution in the presentation's CSS. Mark a genuinely intentional, readable overlap only by adding
   `data-presentation-allow-overlap` (kit export `ALLOW_OVERLAP`, via the primitive's `dataAttrs`) on that subtree.

Report the final build/verify results and any remaining advisory warnings accurately.
