# Task: Scene kit + app shell

## Goal

Build the reusable presentation engine (the "scene kit") and the app shell it runs
in: adopt Tailwind v4, implement the generic scene-rendering kit under
`src/presentation-kit/`, a zero-dependency pathname router, a `Landing` page that
replaces the placeholder `App.tsx`, and an explicit presentation registry. After
this task the app builds and serves a landing page, and the kit provides the full
evolving-scene runtime contract that individual presentations will compose against.

## Background

This repo (`and-scene`) is a Vite + React 19 + TypeScript app. Current state: a
plain-CSS single-page `src/App.tsx`, `src/main.tsx` mounting it, no router, no
Tailwind. `react`, `react-dom`, `motion`, and `lucide-react` are already in
`package.json`; `tailwindcss` and `@tailwindcss/vite` are NOT and must be added.

You MUST read these files before starting:
- `openspec/changes/create-and-scene/design.md` — full architecture (repository
  layout, scene-kit module list, routing/registry approach, styling decision).
- `openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md` —
  the behavioral contract this kit must provide (also copied verbatim below).
- `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `src/index.css`,
  `package.json` — the current scaffold you are extending/replacing.

**Reference implementation (read to port from, do not copy verbatim):** the proven
runtime model lives in the sibling repo at
`~/paul/codagent-dot-dev/src/presentation/harness/`. Study `types.ts`,
`constants.ts`, `usePresentationNav.ts`, `useFitScale.ts`, `Stage.tsx`,
`Header.tsx`, `Footer.tsx`, `Toc.tsx`, `nodes.tsx`, and `HarnessNode.tsx`. That
code is **talk-specific** (nodes like `LLMNode`, `ToolsNode`). Your job is to
**generalize** it: keep the engine and chrome, but replace the talk-specific nodes
with generic, reusable primitives parameterized by a `layoutId`, a Tailwind
accent, and (where a glyph applies) a `lucide-react` `LucideIcon`.

**What to build (per the design's Approach section):**

- **Styling:** add Tailwind v4 via `@tailwindcss/vite` (wire into `vite.config.ts`)
  and a small theme in `src/index.css` with accent colors (`bg`, `cyan`, `amber`,
  `green`) mirroring the reference. The kit and chrome are authored in utility
  classes.
- **`src/presentation-kit/`** — the canonical engine:
  - `types.ts` — `StepMeta { id, era, title, caption, groupKey?, payload? }`,
    `SceneProps { step }`, `Step extends StepMeta { Scene: ComponentType<SceneProps> }`.
  - `constants.ts` — `EASE`, `LAYOUT_T`, `ENTER_DELAY`/`ENTER_T`, `DESIGN_W = 880`,
    `DESIGN_H = 380`, `MIN_SCALE`, and per-mode `STAGE_LAYOUT { browse, present }`.
  - `usePresentationNav.ts` — step index + mode; `→`/Space/PageDown next,
    `←`/PageUp prev, `P` toggles mode, horizontal touch swipe = next/prev; `next`
    clamps at `last`, `prev` clamps at `0`; keys do not hijack focused controls
    (`button, a, input, textarea, select`, contentEditable).
  - `useFitScale.ts` — uniform scale fitting the canvas into the space between
    header and footer for the active mode; recompute on resize and mode change.
  - `Stage.tsx` — fixed `DESIGN_W × DESIGN_H` canvas wrapped in `LayoutGroup` +
    `AnimatePresence`, keyed by `step.groupKey ?? step.id`, scaled by
    `useFitScale`.
  - `Presentation.tsx` — the per-presentation entry: takes `steps: Step[]` and
    options `{ initialMode?, title? }`, owns the nav hook, and renders
    `Stage` + chrome.
  - `chrome/Header.tsx`, `chrome/Footer.tsx`, `chrome/Toc.tsx` — present mode shows
    marker + one-line title only; browse mode shows title + multi-line caption +
    table of contents (wide viewports only) + clickable progress dots + prev/next.
    The on-screen step number is derived from the step's position (auto-numbered),
    not stored per step.
  - **Chrome test hooks:** the progress/step chrome MUST expose `data-step-count`
    (total steps) and `data-step-index` (active index) attributes so a later
    headless render-check can enumerate steps without coupling to DOM structure.
  - `nodes/` — generic primitives composed by presentations: `Box` (bordered card,
    optional `LucideIcon`, carries `layoutId`), `Label`, `Arrow`, `Frame` (a group
    boundary), `Emphasis`, `SymbolChip` (generalized `HarnessNode`: `symbol`↔`chip`
    variants with accent + `LucideIcon`), plus `Appear` (sequences a newcomer to
    fade in after persisting entities settle) and `SceneLayer` (absolutely
    positions a step's diagram layer so mounting one never reflows another).
- **Routing + registry:**
  - `src/presentations/index.ts` — an EXPLICIT registry array of
    `{ slug, title, load: () => import('./<dir>/Talk') }`. Start it empty (or with
    no entries); adding a presentation is a new folder + one line here. Do NOT use
    `import.meta.glob` — registration must be explicit and diffable.
  - `src/main.tsx` — minimal router reading `window.location.pathname`: `"/"` →
    `Landing`; `"/<slug>"` → the matching registry entry, `React.lazy`-loaded in a
    `<Suspense>`; unknown path → `Landing`.
  - `src/Landing.tsx` — replaces `App.tsx`; enumerates the registry and links to
    each presentation. Remove/replace the placeholder `App.tsx` content.

**Conventions:** keep the existing eslint/tsconfig setup green. Match the
reference's design constants exactly where the spec requires parity (canvas
880 × 380, present/browse fit geometry analogous to the reference).

## Spec

### Requirement: Scene step model
A presentation SHALL be one scene rendered through an ordered list of named steps. Each step SHALL have a stable identity, a section/era label, a presenter title (one-liner), a browse caption (paragraph), and a diagram state shown while it is active.

#### Scenario: Step carries narration and identity
- **WHEN** a presentation defines a step
- **THEN** that step has a stable id, a section/era label, a presenter title, a browse caption, and the diagram state shown while it is active

#### Scenario: Order-derived numbering
- **WHEN** steps are inserted, removed, or reordered
- **THEN** each step's on-screen number is derived from its position so no manual renumbering is required

### Requirement: Stable entities morph across steps
Entities that persist between steps SHALL keep a stable identity and animate their change in place rather than disappearing and reappearing. Entities present in only one of two adjacent steps SHALL animate in or out.

#### Scenario: Persisting entity morphs
- **WHEN** an entity with the same identity exists in two consecutive steps
- **THEN** navigating between them animates that entity from its old state (position, size, label, emphasis) to its new state in place

#### Scenario: New entity enters after others settle
- **WHEN** a step introduces a new entity
- **THEN** it animates in after the persisting entities have moved to their new positions

#### Scenario: Departing entity exits
- **WHEN** an entity exists in a step but not in the next step
- **THEN** it animates out on that transition

### Requirement: Present and browse modes
A presentation SHALL support a present mode for live delivery and a browse mode for self-guided reading, switchable at runtime, and MAY declare which mode it opens in.

#### Scenario: Present mode is title-focused
- **WHEN** the presentation is in present mode
- **THEN** the active step shows its marker and one-line title, with the caption, table of contents, and prev/next controls hidden

#### Scenario: Browse mode is reading-focused
- **WHEN** the presentation is in browse mode
- **THEN** the active step shows its title, multi-line caption, a table of contents on wide viewports, prev/next controls, and step progress indicators

#### Scenario: Mode toggle preserves position
- **WHEN** the user toggles the mode
- **THEN** the presentation switches between present and browse while staying on the current step

### Requirement: Step navigation
A presentation SHALL let the viewer move between steps via keyboard, touch, and on-screen controls, and SHALL allow jumping directly to a step or section.

#### Scenario: Keyboard navigation
- **WHEN** the user presses Right, Space, or PageDown
- **THEN** the presentation advances one step; and WHEN the user presses Left or PageUp THEN it goes back one step

#### Scenario: Touch swipe
- **WHEN** the user swipes horizontally
- **THEN** swiping left advances and swiping right goes back

#### Scenario: Direct jump
- **WHEN** the user activates a progress indicator or a table-of-contents entry
- **THEN** the presentation jumps directly to that step, or to the first step of that section's era for a table-of-contents entry

#### Scenario: Controls keep their keys
- **WHEN** focus is on an interactive control
- **THEN** navigation keys drive that control rather than also advancing the deck

### Requirement: Boundary behavior
Navigation SHALL clamp at both ends with no wrap-around.

#### Scenario: Clamp at start
- **WHEN** the presentation is on the first step and the user goes back
- **THEN** it stays on the first step

#### Scenario: Clamp at end
- **WHEN** the presentation is on the last step and the user advances
- **THEN** it stays on the last step

### Requirement: Fixed-canvas fit scaling
The diagram SHALL be composed in a fixed design canvas and scaled uniformly to fit the available viewport, so the composition does not reflow and entity morphs stay clean across viewport sizes. The default design canvas SHALL match the current reference presentation's dimensions (880 × 380), with per-mode fit geometry analogous to the reference's browse and present layouts.

#### Scenario: Uniform scaling on resize
- **WHEN** the viewport size changes
- **THEN** the diagram scales uniformly to fit without reflowing its internal composition

#### Scenario: Default canvas dimensions
- **WHEN** a presentation does not override the design canvas
- **THEN** it uses the reference dimensions of 880 × 380

## Done When

`npm run build` and `npm run lint` pass. The router resolves `"/"` → `Landing`
(which enumerates the registry) and an unknown path → `Landing`, and the
`"/<slug>"` lazy-load path type-checks and compiles against the registry shape.
The `src/presentation-kit/` engine exports the step contract, `Stage`,
`Presentation`, the nav hook, fit-scale, chrome (with `data-step-count` /
`data-step-index` hooks, and clickable progress dots and table-of-contents entries
as jump targets), and the generic node primitives, such that the evolving-scene
scenarios above hold for any presentation built on it. (The navigation/morph
scenarios are fully exercised end-to-end once a real presentation exists; the
registry starts empty in this task.)
