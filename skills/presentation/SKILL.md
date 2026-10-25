---
name: presentation
description: Creates or modifies a browser presentation that works as one evolving diagram (stable entities that appear, move, connect, and re-label across named steps) from a topic. Use when asked to make, build, generate, edit, or change a presentation, talk, or slide-style explainer in a Vite + React project. Self-bootstraps the scene kit, presentation index, and build setup when they are missing.
---

# Presentation

Generate a browser presentation modeled as **one scene that evolves through named steps**, not a deck of
unrelated slides. Entities keep a stable identity, so across steps they move, morph, connect, and
re-label in place; newcomers arrive after the existing entities settle.

"Presentation" is the term for the generated artifact ("talk" is only a synonym in conversation; the
per-presentation entry component is `Talk.tsx`).

All paths below that start with `scripts/` or `templates/` are relative to **this file's directory**
(the skill directory), not the user's working directory. Run the skill's scripts by their path next to
this `SKILL.md`, for example `node <skill-dir>/scripts/detect-target.mjs`.

## Contract anchors

A project can host presentations when it has three anchors:

1. **Build setup**: a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit**: `src/presentation-kit/`, the reusable engine (the `Step`/`Scene` contract, stage,
   present/browse navigation, chrome, fit-scale canvas, generic node primitives).
3. **Presentation index**: `src/presentations/index.ts`, the registry mapping each presentation slug to
   its route, plus the router that serves `/<slug>`.

Detection is by contract, not byte-for-byte: file naming or extra dependencies never trigger
re-scaffolding.

## Procedure

### 1. Gather (one question at a time)

Ask the user for what is missing, **one question per message**, never several at once:

- the topic,
- the visual style (mood, palette, typography direction),
- for each step: its content and a description of what is on screen.

Rules:

- Do not assume details the user can still provide. Ask first.
- The user controls the depth. If they choose to build with only some details ("just build it"),
  proceed with what was captured and iterate afterwards; there is no completeness gate.
- If the prompt already contains the topic, style, and every step, build without further questions.
- For a key or complex step you may draw an ASCII mockup to confirm the layout. Do not do it for every
  step.

For a **modification**, skip the full interview: see "Modify an existing presentation".

### 2. Resolve the target and scaffold what is missing

Run:

```bash
node <skill-dir>/scripts/detect-target.mjs <project-dir>
```

It prints JSON: `kind`, the `target` directory, which `anchors` exist, what is `missing`, and
`needsConfirmation`. Target resolution:

- Empty directory or standalone (non-monorepo) project: the app lives at the project root.
- Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout):
  the app is a self-contained app under `presentations/`. Never mutate the monorepo root.
- Already inside a presentation app (the kit or index is present): use it and scaffold only what is
  missing.

If `needsConfirmation` is true (a non-empty project lacks the kit or the index), **state the target
location and what will be added, then wait for the user to confirm** before writing anything. A
wrong monorepo guess must be caught by the user, not silently applied.

If anything is missing, scaffold it:

```bash
node <skill-dir>/scripts/scaffold.mjs --cwd <project-dir> --install
```

The script copies only the missing anchors from `templates/bootstrap/`, never overwrites an existing
file, merges the missing dependencies into an existing `package.json`, then installs dependencies and
the Chromium browser used by the render check. Do not assume any dependency is already installed. If
`wire` in its output says `src/main.tsx` already exists, or that `index.html` loads another entry,
render `<App pathname={window.location.pathname} />` from `src/App.tsx` there. An existing
`index.html` with no module script is not a working build setup: the script adds
`<script type="module" src="/src/main.tsx">` to it (and nothing else) so the route mounts.

When all three anchors are present, skip scaffolding.

The scaffold is styling-framework neutral and ships no default presentation styling: no colors, fonts,
card or button styles, themes, or Tailwind. Add a styling framework only if the host project already
uses one or the user explicitly asks.

### 3. Create or modify the presentation

**Create**: from the resolved target run

```bash
node <skill-dir>/scripts/new-presentation.mjs --cwd <project-dir> --slug <slug> --title "<Title>"
```

It writes `src/presentations/<slug>/` (`entities.ts`, `Scene.tsx`, `steps.ts`, `Talk.tsx`,
`style.css`) from `templates/presentation/` and appends one line to the registry; existing
presentations are left untouched. The generated `style.css` is an empty placeholder: the look is yours
to write from the user's visual direction. If the registry cannot be extended (no `presentations = [` array it can read) the script writes nothing:
add the entry to that registry by hand, following its conventions, without re-scaffolding. Then fill in the story:

- `entities.ts`: this presentation's `layoutId` namespace, one stable id per thing on screen.
- `steps`: ordered steps. Each has a stable `id`, an `era` (section label), a one-line `title`
  (present mode), a paragraph `caption` (browse mode), and a payload describing the diagram state.
  Step numbers come from position; never number steps by hand.
- Use one persistent scene for adjacent steps of the same evolving diagram (same `groupKey` and `Scene`),
  so the scene updates in place. Wrap newcomers in `Appear`; keep continuing entities mounted with the
  same ids so they morph instead of fading again. Preserve intentional overlaps and mark them with
  `allowOverlap` rather than spreading entities apart.
- Compose the diagram from the kit primitives (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`,
  `SymbolChip`, `Appear`, `SceneLayer`). For coordinate-heavy diagrams use raw `motion` elements with
  stable `layoutId`s. The design canvas is 880 × 380 and is scaled to fit.
- **All visual style lives in the presentation**: plain CSS in `style.css` (or the host app's CSS)
  targeting the kit's `data-presentation-*` hooks and `[data-active='true']` / `[aria-current='step']`
  states. Never put colors, fonts, spacing, or borders in `src/presentation-kit/`.
- Style the chrome: make the active progress dot and active table-of-contents entry visibly distinct,
  and make the `[data-presentation-attribution]` link ("made by and-scene") legible. The kit does not
  add a top-left brand; pass `brand` to `<Presentation>` only if the host wants one.

**Modify an existing presentation**: list `src/presentations/index.ts` entries. If the user did not
name a clear target, show the list and ask which presentation to change **before changing anything**.
Then ask only about the requested change (steps, entities, or style) and edit that presentation in
place; do not re-walk the create flow and do not touch other presentations.

### 4. Self-verify before reporting done

Never report success until all of these pass. Fix failures yourself and re-run.

1. `npm run build`: no type or build errors.
2. Render check: `npm run verify` builds the app and steps the registered presentations in a real
   browser against a production preview on `127.0.0.1`, failing on any console error, page error, or
   non-advancing step. (A single-route check of the first step is acceptable while iterating, but run
   the full `npm run verify` before reporting completion.)
3. Visual composition check with the project-local screenshot helper (preferred over ad hoc
   scripts; if you must write a temporary Playwright script, put it under the project root so
   dependencies resolve locally):

   ```bash
   npm run inspect -- <slug>                       # wide desktop, writes inspection/<slug>/step-NN.png
   npm run inspect -- <slug> --viewport 390x844 --out inspection/<slug>-narrow   # responsive-sensitive
   ```

   Screenshots are captured after each step's animation settles. Look at the first step, the last
   step, and every dense or key step. Confirm the important content fits the canvas, intentional
   overlaps stay readable, and nothing collides with captions, progress indicators, the table of
   contents, or navigation controls. Check a narrow viewport when the presentation is
   responsive-sensitive.
4. Review every advisory warning the helper printed (`overlap`, `indistinct active`, `attribution`):
   look at the referenced step, fix accidental collisions and indistinct current-step chrome in the
   presentation's CSS or layout, and add `data-presentation-allow-overlap` (via `allowOverlap`) **only**
   to a composition that is genuinely intentional and readable. Re-run the helper and report any
   warnings that remain, accurately.

Screenshots and warnings are inspection artifacts for you to read; `inspection/` is not committed.

## Quality bar

Every generated presentation: builds with no type errors; renders its first step with no runtime or
console errors; shows a caption for every step; supports next/previous navigation (keys, swipe,
controls, progress dots, table of contents); passes the visual composition check; and conforms to the
evolving-scene model.
