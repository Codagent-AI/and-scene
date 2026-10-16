---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagram (stable entities moving through named steps), from a topic. Self-bootstraps the Vite/React/TypeScript scaffold and scene kit when missing, then builds, renders, and visually inspects the result before reporting done. Use when asked to make, build, update, or edit a presentation, talk, or evolving-diagram deck.
---

# Presentation skill

A presentation is **one scene** moving through ordered, named **steps**, not a deck of
slides. Entities keep a stable identity (`layoutId`), so a box that exists in two steps
morphs in place; entities that only exist in one step enter or exit. Each step carries an
id, an era (section) label, a one-line title (present mode), and a caption paragraph
(browse mode).

"Presentation" is the canonical term; "talk" is informal. (`Talk.tsx` is just the
per-presentation entry component's filename.)

## Paths

Resolve every template and helper path **relative to this `SKILL.md` file's directory**
(call it `$SKILL`), never relative to the user's working directory:

- `$SKILL/scripts/scaffold.mjs`: detect / scaffold / create / list helper (Node, no deps)
- `$SKILL/templates/bootstrap/`: full app snapshot used only to bootstrap a project
- `$SKILL/templates/presentation/`: files for one new presentation (`{{placeholders}}`)

## Procedure

### 1. Gather (one question at a time)

Ask for what is missing, **one question per message**: the topic, the visual style, then
each step's content and visual description. Do not invent details the user can still give.
If the prompt already has topic, style, and all steps, proceed without questions. The user
controls depth: if they choose to build with partial detail, build from what you have and
iterate; do not block on completeness. For a key or complex step you may draw an ASCII
mockup and ask the user to confirm the layout, but not for every step.

### 2. Resolve the target and scaffold what is missing

Run `node $SKILL/scripts/scaffold.mjs detect <project-dir>`. It reports the resolved
`target`, whether it is a monorepo, and the three **contract anchors**:

1. **build**: Vite + React + TypeScript app with a working `npm run build`
2. **kit**: the scene kit in `src/presentation-kit/` (exports `Presentation`)
3. **index**: the presentation registry `src/presentations/index.ts`

Detection is contract-level (anchor present or not), so cosmetic differences never
trigger a re-scaffold.

- All anchors present: skip scaffolding; go to step 3.
- None or some present: scaffold only what is missing, never overwriting existing files.
- Target: a standalone or empty project scaffolds at its root; a monorepo (`workspaces`,
  `pnpm-workspace.yaml`, or `packages/` / `apps/`) gets a self-contained app in
  `presentations/` and its root is left untouched; inside an existing presentation app, use
  that app.
- If the project is **non-empty** and lacks the kit or index (`needsConfirmation: true`),
  **state the target directory and wait for the user to confirm before writing anything.**
- Then: `node $SKILL/scripts/scaffold.mjs scaffold <project-dir> --install` (add
  `--confirm` once the user approved). It merges the full dependency set (react,
  react-dom, motion, lucide-react, vite, @vitejs/plugin-react, typescript and @types/\*,
  the eslint stack, playwright) without assuming any is installed, and runs `npm install`.
  Do not assume Chromium is present: if the render check cannot launch a browser, run
  `npx playwright install chromium`.
- Files the helper reports as `skipped` already existed (for example an existing
  `src/main.tsx`); wire them by hand to the router in `templates/bootstrap/src/App.tsx`.

The scaffold is **styling-framework-neutral**: no Tailwind, theme, colors, fonts, card or
button styles. Add a styling framework only if the host already uses one or the user asks.

### 3. Generate or modify

**Create**: `node $SKILL/scripts/scaffold.mjs new <slug> "<Title>" <project-dir>`. This
writes `src/presentations/<slug>/` (`entities.ts`, `Scene.tsx`, `steps.ts`, `Talk.tsx`,
`styles.css`) and registers it in `src/presentations/index.ts`, leaving other presentations
untouched. Then edit those files for the gathered content:

- `entities.ts`: the presentation's `layoutId` namespace and canvas geometry (880 × 380).
- `Scene.tsx` / `steps.ts`: compose kit primitives (`Box`, `Label`, `Arrow`, `Frame`,
  `Emphasis`, `SymbolChip`, `SceneLayer`) from `src/presentation-kit`. Steps in one
  `groupKey` with the same `Scene` keep a single mounted scene, so only `payload` changes.
  Wrap **newcomers** in `<Appear>`; never wrap entities that continue. Give every direct
  child of `<SceneLayer>` a unique `key` (needed for exit animations). Accumulate or
  transform entities rather than redrawing them.
- `styles.css`: **all visual design lives here** (or in the host's CSS), targeting the kit's
  `data-presentation-*` hooks, `data-active`, and `aria-current`. Plain CSS by default.
  Give the active progress dot and ToC entry a visibly distinct look and make the
  attribution (`[data-presentation-attribution]`) legible. Never put colors, fonts,
  borders, or theme tokens in `src/presentation-kit/`.
- Mark an intentional, readable overlap with `data-presentation-allow-overlap` on that
  subtree only.

**Modify**: if the target is unnamed or ambiguous, run `scaffold.mjs list` and ask which
presentation to change before editing anything. Then ask only about the requested change
(steps, entities, or style) and edit that presentation in place; do not re-run the create
flow, and leave other presentations and the shared kit alone.

### 4. Self-verify before saying done

Fix failures yourself and re-check; never report success while a check fails.

1. `npm run build` (no type errors).
2. Render: `npm run verify` (builds, then steps every registered presentation in
   Chromium, failing on console/page errors and non-advancing steps). At minimum the first
   step must render with no runtime or console errors.
3. Visual composition: run `npm run inspect -- <slug>` (project-local helper; screenshots
   land in `.presentation-inspect/<slug>/step-NN.png`, captured after animations settle) and
   **look at** the first step, the last step, and any dense or key steps; also a narrow
   viewport (`npm run inspect -- <slug> --viewport 390x844`) for responsive-sensitive
   presentations. Confirm important content fits the canvas, intentional overlaps stay
   readable, and nothing collides with captions, progress dots, ToC, or nav controls.
   If no helper exists, write any temporary Playwright script **inside the project root**
   so it resolves local dependencies.
4. Review every advisory warning the helper prints (`overlap`, `active-nav`,
   `attribution`): fix accidental collisions, make the active chrome distinct, polish the
   attribution via its hook, and only mark genuinely intentional readable overlaps with
   `data-presentation-allow-overlap`. Re-run until warnings are resolved or explained.
5. Report the final build, render, and visual-check results and any remaining advisory
   warnings accurately.

## Quality bar

Every presentation builds with no type errors, renders its first step with no runtime or
console errors, shows a caption per step, supports next/previous (keys, swipe, buttons,
progress dots, ToC), passes the visual composition check, and follows the evolving-scene
model above. Keep generated build output, `node_modules`, and screenshots out of git.
