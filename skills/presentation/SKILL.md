---
name: presentation
description: Creates or modifies a browser presentation that runs as one evolving diagram scene (stable entities that appear, move, connect and re-label across named steps). Use when asked to make, build, extend, or change a presentation, talk, or slide-style walkthrough for a topic.
---

# Presentation

Generate a browser presentation modeled as **one evolving scene**, not a stack of
slides: entities keep a stable identity and morph from step to step. "Presentation"
is the canonical term; "talk" is a synonym only in conversation (the per-presentation
entry file is `Talk.tsx`, nothing more).

Everything this skill needs sits beside this file. Resolve `scripts/` and `templates/`
**relative to this `SKILL.md`'s directory**, never relative to the current directory.
In the commands below `SKILL_DIR` means that directory.

## 1. Gather

Ask the user **one question at a time**, never several at once:

1. the topic,
2. the visual style (look, mood, palette, type),
3. for each step: the story beat and a description of what the diagram shows.

Do not assume what the user can still tell you. The user decides how much to specify:
if they choose to build with partial detail, build from what you have and iterate —
there is no completeness gate. If the prompt already carries the topic, style, and
every step, proceed without further questions.

For a key or complex step you may draw an ASCII mockup and ask the user to confirm the
layout before building. Do this for the steps where it helps, not for every step.

When the request is to **modify** a presentation, skip the full interview (see §4).

## 2. Resolve the target and scaffold what is missing

The scaffold has three contract anchors, detected by presence (not byte equality):

1. **Build setup** — Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — `src/presentation-kit/`: the `Step`/`Scene` contract, stage, navigation, chrome, fit-scale canvas.
3. **Presentation index** — `src/presentations/index.ts`: the registry mapping each presentation to its own route.

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" plan  <projectDir>   # anchors, target, missing, needsConfirmation
node "$SKILL_DIR/scripts/scaffold.mjs" apply <projectDir> [--confirm]
```

`plan` resolves the target:

- empty or standalone project → the project root;
- monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`/`apps/` layout) → a self-contained app in `presentations/`, never the monorepo root;
- an app that already has the kit or index → that app.

If `needsConfirmation` is true (the project is non-empty and lacks the kit or index),
**state the target path and what will be added, and wait for the user to confirm**
before running `apply --confirm`. Never write into a non-empty project unconfirmed.

`apply` writes only the missing anchors, never overwrites an existing file, and merges
missing dependencies and scripts into an existing `package.json`. It does not install
anything: run `npm install` in the target afterwards (never assume the dependencies are
present). If it reports `manual` items (for example an existing `src/main.tsx`), do
that wiring yourself. If all three anchors exist, skip scaffolding.

The scaffold is styling-framework neutral. Do not add Tailwind or another framework
unless the host project already uses one or the user explicitly asks for it.

## 3. Create a presentation

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" add <projectDir> <kebab-slug> "<Title>"
```

This creates `src/presentations/<slug>/` (`Talk.tsx`, `entities.ts`, `steps/`, `styles.css`)
and adds one registry line to `src/presentations/index.ts`; the presentation is then
reachable at `/<slug>`. Other presentations are left untouched. Then replace the starter
content with the user's steps:

- **`entities.ts`** — the presentation's `layoutId` namespace: one stable id per entity.
- **`steps/`** — each step has `id`, `era` (section label), `title` (one line), `caption` (a paragraph), and the diagram state. Use one `Scene` component and a shared `groupKey` so adjacent steps update the same mounted scene; entities that continue keep the same id and morph in place, newcomers are wrapped in `<Appear>`, departing ones leave through it. Preserve intentional overlaps and stacking instead of spreading entities apart.
- **Primitives** — compose `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer` from `src/presentation-kit/`, or raw `motion` elements with stable `layoutId`s for coordinate-heavy diagrams. The design canvas is 880 × 380.
- **Style** — all colors, type, spacing, borders and shadows live in the presentation's own plain CSS (`styles.css`) or the host app, targeting the kit's `data-presentation-*` hooks. **Never edit the kit to style anything.** Style the active progress/ToC state (`[data-active='true']`, `[aria-current]`) so the current step is visibly distinct, and style `[data-presentation-attribution]` so the "made by and-scene" link is legible. The top-left brand slot is empty by default; fill it through the `brand` prop only if the host wants one.
- Mark an overlap that is deliberate and readable by wrapping that subtree in an element with `data-presentation-allow-overlap`.

Each presentation must have a caption per step and next/previous navigation (the kit supplies both).

## 4. Modify an existing presentation

Identify the target first. If the user did not name one, or it is ambiguous, **list the
registered presentations** (the slugs in `src/presentations/index.ts`) and ask which to
change before touching anything. Once identified, ask **only** about the requested
changes (steps, entities, or style) and make scoped edits to that presentation; do not
re-walk the create flow and do not touch other presentations.

## 5. Self-verify before reporting done

Never report success until all of these pass. Fix failures yourself and re-run.

1. `npm run build` — no type errors.
2. Render check — at minimum the first step renders with no runtime or console errors; `npm run verify` builds the whole app and steps through every step of every registered presentation, failing with the phase and step index. Run the lighter checks while iterating and `npm run verify` before finishing.
3. Visual composition — capture settled screenshots with the **project-local helper**:

   ```bash
   npm run inspect -- <slug>                       # desktop viewport
   npm run inspect -- <slug> --viewport 390x844 --out .presentation-inspect/<slug>-narrow
   ```

   Look at the first step, the last step, and any dense or key step (add the narrow
   viewport when the presentation is responsive-sensitive). Confirm the scene fits the
   canvas, intentional overlaps stay readable, and nothing collides with the caption,
   progress indicator, table of contents, or navigation controls. If the helper is
   missing, write any temporary Playwright script **inside the project root** so it
   resolves local dependencies, not elsewhere.
4. Review every `WARN` the helper prints. Fix accidental collisions, indistinct active
   chrome (style the active state), and unpolished attribution (style
   `[data-presentation-attribution]`); add `data-presentation-allow-overlap` only to
   genuinely intentional, readable overlaps. Re-run until the warnings are fixed or
   deliberately accepted, then report the final checks and any remaining advisory
   warnings accurately.

Do not commit `.presentation-inspect/` screenshots or `dist/`.

## Quality bar

A generated presentation builds with no type errors, renders its first step with no
runtime or console errors, shows a caption per step, supports next/previous navigation,
passes the visual composition check, and follows the evolving-scene model (one scene,
stable entity ids, named steps).
