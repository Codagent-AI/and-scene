---
name: presentation
description: Create or modify a browser presentation that works as one evolving diagram (stable entities moving through named steps) from a topic. Use when the user wants a presentation, talk, or explainer built from a topic, or wants to change an existing one. Self-bootstraps the Vite + React + TypeScript scaffold and scene kit when missing, then builds, renders, and visually inspects the result.
---

# Presentation

Generate presentations that are **one evolving scene**, not a stack of slides:
entities (boxes, labels, arrows, frames, markers) keep a stable identity and
morph, appear, or leave as the explanation moves through ordered, named steps.
"Presentation" is the canonical term; `Talk.tsx` is just the entry filename.

Paths below are relative to **this file's directory** (`SKILL_DIR`). Resolve
`templates/` and `scripts/` from here, never from the user's working directory.

## Procedure

### 1. Gather (one question at a time)

Ask for what is missing, one question per message: the **topic**, the **visual
style**, then each **step's content and visual description**. Do not assume
details the user can still give. The user controls depth: if they choose to
build with partial detail, proceed with what you have and iterate afterwards;
if the prompt already holds topic, style and every step, build without more
questions. For a key or complex step you may draw an ASCII mockup and confirm
the layout before building. Do not mock up every step.

When **modifying**, skip the full interview: identify the target first (below),
then ask only about the requested changes (steps, entities, or style).

### 2. Resolve the target and scaffold what is missing

A presentation app needs three **contract anchors**:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/` (step contract, stage, nav, chrome, fit-scale canvas, primitives).
3. **Presentation index**: `src/presentations/index.ts`, mapping each presentation to its own route.

```bash
node SKILL_DIR/scripts/detect.mjs <project-dir>      # JSON: target, anchors, missing, needsConfirmation
node SKILL_DIR/scripts/scaffold.mjs <target> [--anchors build,kit,index]
```

`detect.mjs` is contract-level (anchors, not byte-identical files) and resolves
the target:

- empty or standalone project: the project root;
- monorepo (`workspaces`, `pnpm-workspace.yaml`, or `packages/` / `apps/`): a
  self-contained app in `presentations/`, never the monorepo root;
- already inside a presentation app: use it.

Then:

- All anchors present: skip scaffolding.
- Some missing: scaffold **only the missing anchors**; `scaffold.mjs` never overwrites an existing file and merges missing dependencies into an existing `package.json`.
- If `needsConfirmation` is true (non-empty project lacking the kit or index), **state the target directory and wait for the user to confirm before writing anything.**
- Run `npm install` in the target afterwards. Never assume the dependencies (react, react-dom, motion, lucide-react, vite, @vitejs/plugin-react, typescript, @types/*, eslint stack, playwright) are installed. Install Chromium for Playwright if needed (`npx playwright install chromium`).
- The scaffold is styling-framework-neutral and ships zero visual defaults. Do not add Tailwind or another framework unless the host already uses one or the user asks.

### 3. Generate or modify

**Create**: copy `templates/presentation/` to `src/presentations/<slug>/`, replace `__SLUG__` and `__TITLE__`, then register it with one line in `src/presentations/index.ts`:

```ts
{ slug: '<slug>', title: '<Title>', load: () => import('./<slug>/Talk') },
```

Each presentation is a self-contained folder: `entities.ts` (its `layoutId` namespace and canvas geometry), `steps/` (the persistent `Scene` and the `STEPS` array), `Talk.tsx`, and `talk.css`. Leave every other presentation untouched.

**Modify**: if the target is missing or ambiguous, list the registered presentations (`src/presentations/index.ts`) and ask which one before changing anything. Then edit only that presentation (plus its registry line if renamed).

Model rules:

- Each step has `id`, `era` (section label), `title` (one line, present mode), `caption` (paragraph, browse mode), `Scene`, `payload`. Step numbers come from array position; never number steps by hand.
- Put consecutive steps of one evolving diagram in a shared `groupKey` with the same `Scene`: the scene stays mounted and only `payload` changes. Entities that persist keep the same `layoutId` (use the primitive's `id` prop) and morph in place; wrap only **new** entities in `Appear` (it waits for persisting entities to settle) and put them under `AnimatePresence` so departing ones animate out. Do not fade persisting entities in.
- Compose with the kit's primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `SceneLayer`, `Appear`) imported from the kit's public entry (`../../presentation-kit`); for coordinate-heavy diagrams use raw `motion` elements with stable `layoutId`s. Lay out on the fixed **880 x 380** canvas inside a `SceneLayer`.
- Keep intentional overlaps and stacking when that is the composition; do not spread things out just to avoid them.

**Styling** belongs to the presentation (`talk.css`, plain CSS by default) or the host app, never the kit. The kit only exposes `data-presentation-*` hooks. At minimum style:

- the active progress dot and active table-of-contents entry (`[data-active='true']`, also `aria-current="step"`), so the current step is visibly distinct;
- `[data-presentation-attribution]` (the default bottom-right "made by and-scene" link) so it is legible and intentional;
- headers, captions, controls, and every node kind (`[data-presentation-kind=...]`).

Mark a subtree whose overlap is intentional and readable with `data-presentation-allow-overlap`. Use it only there.

### 4. Self-verify before reporting done

Never report success while a check fails. Fix the cause and re-run.

1. `npm run build` (no type errors) and `npm run lint`.
2. Render check: at minimum the first step renders with no runtime or console errors. Run the full `npm run verify` before completion (it builds and steps through the reference presentation). Do not report success on broken output.
3. Visual composition check with the project-local helper (preferred over ad hoc scripts; any temporary Playwright helper must live under the project root):

   ```bash
   npm run inspect -- <slug>                       # screenshots in .inspection/<slug>/step-NN.png
   npm run inspect -- <slug> --viewport 390x844    # narrow, for responsive-sensitive presentations
   ```

   It waits for each transition to settle, then prints advisory `WARN` lines for unmarked text/chrome overlap, indistinct active navigation, and missing/browser-default/undersized attribution. Look at the screenshots of the **first step, the last step, and every dense or key step**. Confirm important content fits the canvas, intentional overlaps stay readable, and nothing collides with captions, progress, table of contents or controls.
4. Review every warning: fix accidental collisions and indistinct or unpolished chrome in the presentation's CSS or layout, mark only genuinely intentional readable overlaps with `data-presentation-allow-overlap`, then re-run the inspection.
5. Report the checks actually run, their results, and any remaining advisory warnings, accurately.

Optionally use `chrome-devtools-axi` (`open`, `snapshot`, `screenshot`) for interactive inspection; it does not replace `npm run verify`.
