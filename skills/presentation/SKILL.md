---
name: presentation
description: Create or modify a browser presentation (one evolving diagrammatic scene, not a deck of slides) from a topic, using the and-scene kit. Use when the user asks to make, build, update, or change a presentation (informally, a talk).
---

# presentation

Generate a browser presentation modeled as **one evolving scene**: stable
entities (boxes, labels, arrows, frames, emphasis markers) move through ordered,
named steps. "Presentation" is the canonical term; "talk" is only an informal
synonym (the entry component is named `Talk.tsx` for historical reasons).

This skill is hybrid: this document is the procedure and quality bar; the
templates, helper script, and scene kit under this directory keep output
consistent.

**Locating files.** Everything this skill ships is resolved relative to the
directory that contains this `SKILL.md` (call it `$SKILL_DIR`), never relative
to the user's current working directory:

- `$SKILL_DIR/scripts/scaffold.mjs`: `detect`, `bootstrap`, and `new` helper.
- `$SKILL_DIR/templates/bootstrap/`: full app scaffold (build setup, scene kit,
  presentation index, verification scripts).
- `$SKILL_DIR/templates/presentation/`: files for one new presentation.

## Procedure

Work through four phases. Do not report success until phase 4 passes.

### 1. Gather

Ask the user clarifying questions **one at a time** (never batched), covering:

1. the **topic**,
2. the **visual style** (mood, palette, typography direction),
3. for each step: its **content** and a **visual description** of the diagram
   state.

Rules:

- Ask only for what the prompt omits. If it already contains the topic, style,
  and every step's details, proceed without further questions.
- Do not invent details the user can still provide.
- The user controls depth. If they choose to build with partial detail, accept
  that explicitly, build from what was captured, and iterate afterwards. There
  is no completeness gate.
- For a key or complex step, you may draw an ASCII mockup to confirm the layout
  before building. Do not mock up every step.

### 2. Resolve the target and scaffold what is missing

Run the helper (from any directory; use the absolute path):

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" detect <project-dir>
```

It reports the three **contract anchors** and the resolved target:

1. **Build setup**: a Vite + React + TypeScript app with a working
   `npm run build`.
2. **Scene kit**: `src/presentation-kit/` (step contract, stage, navigation,
   chrome, fit-scale canvas).
3. **Presentation index**: `src/presentations/index.ts`, the registry mapping
   each presentation to its own route (plus the pathname router and landing).

Detection is by contract, not byte-identical scaffolding: file naming,
formatting, and extra dependencies must not trigger re-scaffolding.

Target resolution:

| Situation | Target |
| --- | --- |
| Empty directory or standalone (non-monorepo) project | project root |
| Monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout) | self-contained app under `presentations/` (never mutate the monorepo root) |
| Already a presentation app (all anchors present) | use it; scaffold nothing |
| Some anchors present | scaffold only the missing ones; leave existing files alone |

Then:

- **All anchors present**: skip scaffolding and go to phase 3.
- **Non-empty project missing the kit or index** (`confirmationRequired: true`):
  tell the user the exact target directory and what will be added, and wait for
  their confirmation before writing anything. Never write first.
- **Scaffold**: `node "$SKILL_DIR/scripts/scaffold.mjs" bootstrap <project-dir> [--confirmed]`.
  It copies only missing files, merges missing dependencies and scripts into
  `package.json` without removing anything, and runs `npm install`. Do not assume
  any dependency is installed. If the render check needs a browser, run
  `npx playwright install chromium` when Chromium is not available.

The scaffold installs React, React DOM, Motion, Lucide icons, Vite,
`@vitejs/plugin-react`, TypeScript and the React/Node type packages, the ESLint
stack, and Playwright. It is styling-framework-neutral and ships **no** colors,
fonts, spacing scale, card or button styles, borders, shadows, or theme tokens.
Add Tailwind or another framework only when the host already uses it or the user
explicitly asks.

### 3. Generate or modify

**Create** (default):

```bash
node "$SKILL_DIR/scripts/scaffold.mjs" new <app-dir> <slug> "<Title>"
```

This writes `src/presentations/<slug>/` (`entities.ts`, `steps/*`, `Talk.tsx`,
`presentation.css`) and adds one line to the registry, so the presentation is
reachable at `/<slug>`. Then replace the placeholder content with the gathered
design:

- `entities.ts` holds the presentation's `layoutId` namespace (stable entity
  ids) and coordinates on the 880 × 380 design canvas.
- `steps/*` define ordered `Step` objects: stable `id`, section `era`,
  one-line `title`, browse `caption`, and a `payload` for the diagram state.
  Numbering derives from order; never hand-number steps.
- Put successive states of the same diagram in one scene group (shared
  `groupKey` and `Scene`) so the scene persists and entities morph in place.
  Wrap only *newcomers* in `<Appear>`; keep continuing entities as the same
  keyed element so they morph instead of fading. Preserve intentional overlap or
  stacking rather than flattening it.
- Compose the kit's public API from `src/presentation-kit` (`Box`, `Label`,
  `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`); use raw
  `motion` elements with stable `layoutId`s when a primitive does not fit.
- **Styling is owned by the presentation**: write plain CSS in
  `presentation.css` against the stable `data-presentation-*` hooks and your own
  `data-kind` attributes. Never edit the kit to add visual styles. Style the
  active progress dot and table-of-contents entry
  (`[data-presentation-active="true"]`, `aria-current`) so the current step is
  clearly distinct, and make `[data-presentation-attribution]` legible. Mark a
  subtree that overlaps on purpose and stays readable with
  `data-presentation-allow-overlap`.
- Existing presentations must stay intact and reachable; touch only the new
  folder and its one registry line.

**Modify** an existing presentation:

- If the target is missing or ambiguous, list the registered presentations
  (`src/presentations/index.ts`) and ask which to modify **before changing
  anything**.
- Once identified, ask only about the requested changes (steps, entities, or
  style) and make scoped edits to that presentation. Do not re-walk the create
  flow. Leave other presentations untouched.

### 4. Self-verify before reporting done

Run, from the app directory, and fix every failure yourself:

1. `npm run build`: no type or build errors.
2. A render check: at minimum the first step of the presentation renders
   without console or runtime errors. Before completion, run the full gate,
   `npm run verify` (builds, then renders every step in Chromium against a
   preview on `127.0.0.1`).
3. A **visual composition check** in a browser. Prefer the project-local helper:
   `npm run inspect -- <slug>` (add `-- --narrow` for a narrow viewport). It
   writes settled per-step screenshots to `.inspect/<slug>/` and prints advisory
   warnings. If you need an ad hoc Playwright script, write it under the
   project root so browser tooling resolves from local dependencies. Never put
   it outside the project tree.
   Inspect the **first step, the last step, and any dense or key steps**;
   inspect a narrow viewport too when the presentation is responsive-sensitive.
   Confirm that important content fits the canvas, intentional overlaps remain
   readable, and nothing collides with chrome (captions, progress indicators,
   table of contents, navigation controls).
4. **Review every warning** the helper prints (`overlap`, `active-chrome`,
   `attribution`). Fix accidental collisions, make the active step visibly
   distinct, and polish the attribution via its styling hook. Mark only genuine,
   readable intentional overlaps with `data-presentation-allow-overlap`. Re-run
   inspection afterwards and report any remaining advisory warnings accurately.

Never report success while build, render, or visual composition checks fail.
Fix, re-check, and only then report; state what was run and its outcome.

## Quality bar

Every generated presentation must: build with no type errors; render its first
step with no runtime or console errors; show a caption per step; support
next/previous navigation (keyboard, swipe, on-screen controls) with clamping at
both ends; pass the visual composition check; and conform to the evolving-scene
model (one scene, stable entities, ordered named steps, present and browse modes).
