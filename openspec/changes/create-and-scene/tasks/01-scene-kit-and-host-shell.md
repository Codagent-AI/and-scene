# Task: Scene kit, host app shell, and unit-test harness

## Goal
Deliver the reusable, style-neutral scene kit (`src/presentation-kit/`) and the host app shell that routes to presentations (`src/main.tsx`, `src/Landing.tsx`, `src/presentations/index.ts`), together with the Vitest harness that proves the kit's behavior. Every later piece of the change (the reference sample, the verification scripts, the skill templates) builds on this engine, so its contract, hook names, and test coverage must be solid first.

## Background
The repository is a Vite + React 19 + TypeScript app with `react`, `react-dom`, `motion`, and `lucide-react` already in `package.json`. It currently holds the stock Vite starter: plain-CSS `src/App.tsx`, `src/App.css`, `src/main.tsx`, `src/index.css`, `src/assets/`. There is no router, no Tailwind, and no test runner. Do not add Tailwind or any styling framework. Keep `StrictMode` in `main.tsx` and watch for effect/animation double-fire with `motion`.

Design decisions to implement (from `design.md`):

- **Kit layout** (canonical source lives in `src/`; the skill's `templates/` later takes a snapshot, so keep kit files self-contained and free of imports from outside `src/presentation-kit/`):
  - `types.ts`: `Step`, `Scene`, `StepMeta`, `SceneProps`. Generic `Step<TPayload>` / `SceneProps<TPayload>` so a typed grouped payload passes through `<Presentation>` with no casts. A step has a stable id, a section/era label, a presenter title, a browse caption, and the diagram state (scene component + payload) shown while active. Steps that share a `groupKey` and the same `Scene` are not remounted between navigations: the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph. The on-screen step number is derived from position.
  - `constants.ts`: `EASE`, `LAYOUT_T`, `ENTER_T` / `ENTER_DELAY`, `DESIGN_W = 880`, `DESIGN_H = 380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }` (per-mode fit geometry).
  - `usePresentationNav.ts`: keyboard (`ArrowRight`/`Space`/`PageDown` next, `ArrowLeft`/`PageUp` prev, `P` toggles mode), horizontal touch swipe (left = next, right = prev), `next`/`prev` clamp at `[0, last]` with no wrap-around, and keys must not hijack focused interactive controls.
  - `useFitScale.ts`: uniform fit scaling of the 880 × 380 canvas to the active mode's stage geometry (the gap between header and footer). Scale is constant within a mode so morphs stay clean; switching mode is a re-render, not a morph.
  - `Stage.tsx`: `LayoutGroup` + `AnimatePresence` host for the active step's Scene.
  - `Presentation.tsx`: composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`; a presentation may declare `initialMode` (`'browse'` or `'present'`).
  - `chrome/Header.tsx` (marker row; title in browse mode; the top-left slot has NO default and-scene brand link, host-provided branding only), `chrome/Footer.tsx` (caption in browse / title in present, progress dots, prev/next), `chrome/Toc.tsx` (era-based table of contents, browse mode, wide viewports only).
  - `nodes/`: generic, topic-agnostic primitives `Box.tsx` (optional `LucideIcon` glyph via the `Icon: LucideIcon` component pattern; carries `layoutId`), `Label.tsx`, `Arrow.tsx`, `Frame.tsx`, `Emphasis.tsx`, `SymbolChip.tsx`, `Appear.tsx`, `SceneLayer.tsx`. Each accepts stable identity plus class/data/style hooks and supplies NO palette, font, spacing, border, shadow, card, button, or theme defaults. `Appear` sequences newcomers only after persisting entities settle (continuing entities are never wrapped in newcomer fade-in; they morph through layout projection). `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. Intentional overlapping/stacked compositions must be preserved.
- **Bottom-right attribution**: default link labeled exactly `made by and-scene` pointing to the and-scene GitHub repository (use the repository's own remote/`README.md` for the URL; if none is discoverable use `https://github.com/and-scene/and-scene` and note it as an assumption). Overridable via an options prop. Not styled by the kit.
- **Stable hooks.** The design fixes `data-step-count` and `data-step-index` on the chrome (used by the headless verification driver). The specs require stable `data-presentation-*` hooks and semantic active state but do not fix every name; use these and keep them in a short `src/presentation-kit/README.md` hook list:
  - `data-step-count` (total steps) and `data-step-index` (zero-based active index) on one chrome root element.
  - `data-presentation-mode` (`present` | `browse`) on the same root.
  - `data-presentation-attribution` on the attribution link.
  - `data-presentation-allow-overlap` as the explicit marker presentations put on a subtree to exempt it from overlap warnings (the kit documents it; the inspection tooling consumes it).
  - Progress indicators and TOC entries: `aria-current="step"` on the active one plus `data-presentation-active="true"` (absent or `"false"` otherwise); also stable `data-presentation-*` hooks for each chrome part (header, caption, title, progress, progress item, toc, toc item, prev, next, stage, canvas) and for primitives (e.g. `data-presentation-node` with the entity id).
- **Style ownership** (from the spec below): zero visual defaults and no styling-framework dependency. Geometry needed for the fixed canvas or chrome placement is layout behavior, not styling. Do not emit inline colors, fonts, borders, shadows, or button treatments. `src/index.css` is host-only; it must not contain reusable-kit visual defaults.
- **Routing and registry**:
  - `src/main.tsx` reads `window.location.pathname`: `"/"` renders `Landing`; `"/<slug>"` renders the matching registry entry via `React.lazy` inside `<Suspense>`; an unknown path falls back to `Landing` (or a simple not-found). No router dependency.
  - `src/presentations/index.ts` is an EXPLICIT array of `{ slug, title, load: () => import('./<dir>/Talk') }`. Do not use `import.meta.glob`. Registration is one diffable line per presentation. The registry may be empty or hold a small kit-test presentation at this stage; the reference sample is added later, so do not write it here. Keep route-resolution (pathname to registry entry) in a small pure function so it is unit-testable.
  - `src/Landing.tsx` replaces `src/App.tsx` (delete `App.tsx`/`App.css` and unused starter assets) and enumerates the registry with a link to each presentation. Landing styling is host-owned plain CSS in `src/index.css`.
- **Test harness.** Add `vitest` (plus `jsdom` and `@testing-library/react` or an equivalent for hook/component tests) as devDependencies, a `vitest` config, and an `npm test` script (fast unit and contract tests only). `eslint` and `tsc -b` must cover the new test files. Do not add CI configuration (`.github/workflows/`).
- Repo conventions: use `127.0.0.1` rather than `localhost` for anything local-browser related, do not commit build output or `node_modules`, and use commit style `type: lowercase description` if committing.

Use test-driven development: write a focused failing test, implement the smallest change, run the targeted test, then the full suite.

## Spec
(Capability: `evolving-scene-presentations`. All requirements below apply to this task.)

### Requirement: Scene step model
A presentation SHALL be one scene rendered through an ordered list of named steps. Each step SHALL have a stable identity, a section/era label, a presenter title (one-liner), a browse caption (paragraph), and a diagram state shown while it is active.

#### Scenario: Step carries narration and identity
- **WHEN** a presentation defines a step
- **THEN** that step has a stable id, a section/era label, a presenter title, a browse caption, and the diagram state shown while it is active

#### Scenario: Order-derived numbering
- **WHEN** steps are inserted, removed, or reordered
- **THEN** each step's on-screen number is derived from its position so no manual renumbering is required

#### Scenario: Typed payloads reach presentation boundary
- **WHEN** a grouped scene defines steps with a strongly typed payload
- **THEN** the presentation host accepts that typed step array without requiring casts at the `<Presentation>` boundary

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

### Requirement: Persistent grouped scenes
Adjacent steps that represent successive states of the same evolving diagram SHALL be able to share a scene group so that the scene component persists while only the active step data changes. Shared groups prevent the whole scene from remounting between beats and preserve entity continuity for layout morphs.

#### Scenario: Grouped steps update in place
- **WHEN** adjacent steps share a scene group and the same scene component
- **THEN** navigating between those steps updates the existing scene instance with the new step state rather than remounting separate scenes

#### Scenario: Continuing entities are not faded as newcomers
- **WHEN** an entity with the same stable identity continues across grouped steps
- **THEN** it morphs through layout projection without being wrapped in newcomer fade-in behavior

#### Scenario: Intentional composition is preserved
- **WHEN** a grouped scene intentionally overlaps or stacks entities
- **THEN** the implementation preserves that composition while maintaining clean morphs, rather than flattening or spreading entities only to satisfy an implementation pattern

### Requirement: Style ownership boundary
The scene kit SHALL have zero styling defaults. It SHALL provide motion behavior, fixed-canvas layout plumbing, navigation/chrome behavior, and stable DOM hooks for authors to style, but it SHALL NOT impose a palette, font, color, border treatment, glow, card appearance, button style, spacing scale, CSS theme tokens, or styling-framework dependency. Any default geometry used for the fixed canvas or chrome placement is layout behavior, not a visual style system.

#### Scenario: Kit primitives expose style hooks
- **WHEN** a presentation composes scene kit primitives or chrome
- **THEN** the rendered markup exposes stable hooks that presentation-owned CSS can target
- **AND** visual choices such as color, typography, spacing scale, borders, and shadows come from the presentation or host app

#### Scenario: Unstyled kit output
- **WHEN** a presentation uses scene kit primitives without presentation-owned CSS
- **THEN** the kit does not supply fallback colors, fonts, borders, shadows, card treatments, or button treatments

#### Scenario: Optional styling frameworks remain optional
- **WHEN** a presentation author wants to use Tailwind or another styling framework
- **THEN** that framework is configured by the presentation or host app, not required by the reusable scene kit

#### Scenario: Coordinate-heavy diagrams are supported
- **WHEN** a presentation needs literal per-step coordinates for diagram entities
- **THEN** kit primitives expose class/style hooks, and authors MAY use raw motion elements with stable `layoutId`s when a primitive is not the right shape

### Requirement: Kit attribution
The scene kit SHALL include a default attribution link reading "made by and-scene" in the bottom-right corner, linking to the and-scene GitHub repository. The attribution is toolkit disclosure, not a presentation style system. The kit SHALL expose a stable hook so presentation-owned CSS can make the attribution legible and intentional. The kit SHALL NOT add a default top-left "and-scene" brand link; host applications MAY provide their own header brand explicitly.

#### Scenario: Default attribution is shown
- **WHEN** a presentation renders without overriding attribution options
- **THEN** it shows a bottom-right link labeled "made by and-scene" pointing to the and-scene GitHub repository

#### Scenario: Attribution exposes a styling hook
- **WHEN** the default attribution is rendered
- **THEN** it exposes a stable presentation hook that the presentation or host app can target for local styling

#### Scenario: Top-left brand is opt-in
- **WHEN** a presentation renders without host-provided branding
- **THEN** the top-left header slot does not contain a default and-scene brand link

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

#### Scenario: Active navigation state is exposed
- **WHEN** a progress indicator or table-of-contents entry represents the active step
- **THEN** it exposes semantic current-step state and a stable active-state hook for presentation-owned styling

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
The diagram SHALL be composed in a fixed design canvas and scaled uniformly to fit the available viewport, so the composition does not reflow and entity morphs stay clean across viewport sizes. The default design canvas SHALL be 880 × 380, with per-mode fit geometry for the browse and present layouts.

#### Scenario: Uniform scaling on resize
- **WHEN** the viewport size changes
- **THEN** the diagram scales uniformly to fit without reflowing its internal composition

#### Scenario: Default canvas dimensions
- **WHEN** a presentation does not override the design canvas
- **THEN** it uses the default dimensions of 880 × 380


### Task-specific portion of the sample/verification contract
The reference sample's `Step` data, titles, and captions are NOT part of this task. From the verification capability only the hooks this task provides matter: the chrome must expose `data-step-count` and `data-step-index` so a headless driver can enumerate and observe steps without coupling to DOM structure.

## Done When
- Unit/contract tests under `src/presentation-kit/` (or a sibling `tests/` tree) cover, at minimum: step-model derived numbering after insert/remove/reorder; typed-payload grouped steps compiling through `<Presentation>` with no casts (a type-level check is acceptable); `groupKey` persistence (same instance across grouped steps, remount otherwise); nav clamping at both ends, key mapping (including `P` and that focused interactive controls keep their keys), and swipe direction; direct jump by progress indicator and TOC entry (TOC jumps to the first step of that era); active-state semantics (`aria-current="step"` and `data-presentation-active` on exactly the active progress item and TOC entry); mode toggle preserving the active step and the present vs. browse chrome visibility rules; fit-scale math for the 880 × 380 default canvas; default attribution (text, link target, `data-presentation-attribution`, no default top-left brand); kit primitives rendering stable hooks and no inline visual defaults; registry/route resolution including unknown paths.
- A test or lint-style check asserts the kit directory contains no styling framework import, no `tailwind` reference, and no color/font/border/shadow declarations in kit source (layout geometry excepted).
- `src/App.tsx` / `App.css` are gone; `Landing` lists registered presentations; `main.tsx` routes `/` and `/<slug>` as described.
- `npm test`, `npm run lint`, and `npm run build` all pass.
