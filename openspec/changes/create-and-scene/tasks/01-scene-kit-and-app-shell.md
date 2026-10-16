# Task: Scene Kit, Router, and Registry Shell

## Goal
Replace the placeholder app with the reusable, style-neutral scene kit (`src/presentation-kit/`), a zero-dependency pathname router, a `Landing` page, and an explicit presentation registry, with Vitest set up, so any presentation can be composed from `Step` data and rendered with present/browse modes, navigation, and morphing entities.

## Background
Current state: plain-CSS single-page `src/App.tsx` (+ `App.css`, template assets), no router, no Tailwind, no test runner. `react`, `react-dom`, `motion`, `lucide-react` are already dependencies. The repo uses TypeScript ~6, Vite 8, ESLint 10 (see `package.json`, `eslint.config.js`, `tsconfig.app.json`). Use TDD: write focused failing tests, then implement. Keep the app StrictMode-enabled (watch for effect/animation double-fire with `motion`). Use `127.0.0.1` for any local browser automation.

Design decisions to follow (from `design.md`; read it, especially "Repository layout", "Scene kit", "Routing + registry", "Styling", and "Decisions" 1-3 and 7):
- `src/main.tsx`: minimal pathname router. `"/"` renders `Landing`; `"/<slug>"` renders the matching registry entry loaded with `React.lazy` inside `<Suspense>`; unknown paths render `Landing` (or a simple not-found). No `react-router-dom`, no `import.meta.glob`.
- `src/Landing.tsx` replaces `App.tsx` and enumerates the registry with a link per presentation; remove `App.tsx`/`App.css` and the unused template assets. `src/index.css` holds host/app CSS only and gives the reusable kit no visual defaults.
- `src/presentations/index.ts` is an EXPLICIT array of `{ slug, title, load: () => import('./<dir>/Talk') }`. It starts empty in this task (a later piece of work adds the reference sample); the registry type and any registry-validation helper (unique slugs, non-empty title) live here and are unit tested.
- `src/presentation-kit/` layout and contents:
  - `types.ts`: `Step`, `Scene`, `StepMeta`, `SceneProps` — the generic `Step<TPayload>` / `SceneProps<TPayload>` contract. A step has a stable id, section/era label, presenter title, browse caption, a `Scene` component, and an optional `groupKey` + `payload`. Typed grouped payloads must flow through `<Presentation steps=…>` without casts (add a type-level test, e.g. via `expectTypeOf` or a compile-checked fixture).
  - `constants.ts`: `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
  - `usePresentationNav.ts`: keyboard (`ArrowRight`/Space/`PageDown` next, `ArrowLeft`/`PageUp` prev, `P` toggles mode), horizontal touch swipe (swipe left = next, right = prev), mode state; `next`/`prev` clamp at `[0, last]`; keys must not be hijacked when focus is on an interactive control (button, link, input, etc.). Direct `goTo(index)`.
  - `useFitScale.ts`: uniform fit scaling of the 880 × 380 canvas for the active mode's stage geometry (gap between header and footer); scale is constant within a mode; switching modes is a re-render, not a morph. Pure scale math should be a separately testable function.
  - `Stage.tsx`: `LayoutGroup` + `AnimatePresence` host for the active step's Scene. Steps that share `groupKey` (and the same `Scene`) are NOT remounted — the instance persists and only `payload` changes; otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph.
  - `Presentation.tsx`: composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`; a presentation may declare `initialMode`. Step numbers are derived from position.
  - `chrome/Header.tsx` (marker row; title in browse mode; NO default top-left and-scene brand — host opt-in slot only), `chrome/Footer.tsx` (caption in browse / title in present, progress dots, prev/next, default bottom-right attribution), `chrome/Toc.tsx` (era-based table of contents, browse mode, wide viewports only; an entry jumps to the first step of that era).
  - `nodes/`: generic primitives `Box.tsx` (optional `LucideIcon` glyph via `Icon: LucideIcon`, carries `layoutId`), `Label.tsx`, `Arrow.tsx`, `Frame.tsx`, `Emphasis.tsx`, `SymbolChip.tsx`, `Appear.tsx` (sequences newcomers to enter only after persisting entities settle; continuing entities are never wrapped in newcomer fade-in), `SceneLayer.tsx` (absolutely positions a step's diagram so mounting one layer never reflows another). Every primitive accepts a stable identity plus `className`/`data-*`/`style` hooks and supplies NO palette, font, spacing, border, shadow, card, button, or theme defaults.
- The kit must have zero styling defaults and no styling-framework dependency: no Tailwind, no CSS files with colors/fonts/borders/shadows, no inline visual styles beyond layout geometry/transform needed for the fixed canvas and chrome placement. Add a contract test that scans `src/presentation-kit/**` and fails on Tailwind imports/classes, `.css` imports, and visual inline-style properties (color, background, font*, border*, box-shadow, etc.).
- Add `vitest` (plus `@testing-library/react`, `@testing-library/user-event`/`jsdom` or equivalent as needed) and `npm test`; add the `test:browser` script and a minimal vitest config handling the `*.browser.test.ts` split described below. Also add `playwright` as a dev dependency now (later work uses it); do not require browser downloads for `npm test`.
- Keep a small `README.md` section on the kit contract and the registry (how to add a presentation = new folder + one registry line).

Shared hook and script vocabulary (the design fixes only the `data-step-count` / `data-step-index` hooks and the file paths/commands; the rest was chosen while planning so independent work stays compatible, and must be used verbatim):
- Chrome root element exposes `data-step-count` (total steps) and `data-step-index` (zero-based active index).
- Mode: `data-presentation-mode="present"` or `"browse"` on the chrome root.
- Progress indicators: `data-presentation-progress-item`; table-of-contents entries: `data-presentation-toc-item`. The one representing the active step also carries `aria-current="step"` and `data-presentation-active="true"`.
- Attribution link: `data-presentation-attribution` (text `made by and-scene`, bottom-right, links to the and-scene GitHub repository).
- Allow-overlap marker: `data-presentation-allow-overlap` on a subtree root; text/chrome overlap warnings are suppressed for elements inside it.
- Browser-backed vitest files are named `*.browser.test.ts`; `npm test` runs `vitest run` excluding them and `npm run test:browser` runs only them.

Do not add `.github/workflows/` or any CI config. Do not commit build output or `node_modules`.

## Spec
These are the canonical requirements for the runtime model (capability `evolving-scene-presentations`, copied verbatim):

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

## Done When
- Unit/contract tests (Vitest, jsdom) cover every scenario above that is deterministic without a real browser: order-derived numbering; typed payload compile check; grouped steps not remounting (instance persistence with payload change) vs. non-grouped steps remounting; `Appear`/continuing-entity behavior at the markup level; style-neutrality scan and unstyled primitive output; default attribution text/href/hook and absence of a top-left brand; present vs. browse chrome contents; mode toggle preserving position; keyboard (Right/Space/PageDown/Left/PageUp/P), touch swipe, direct jump (progress + TOC → first step of era), focused-control key passthrough; clamping at both ends; active-state hooks (`aria-current="step"`, `data-presentation-active`); fit-scale math and default 880 × 380 canvas; registry validation and router resolution (known slug, unknown path).
- `npm test`, `npm run test:browser` (passes with no browser tests present), `npm run lint`, and `npm run build` all pass; `App.tsx` is gone and `/` renders the Landing page listing the (currently empty) registry without console errors.
- Motion/continuity behavior that cannot be asserted in jsdom is manually spot-checked with a throwaway scratch presentation (not committed) via `chrome-devtools-axi` against a preview on `127.0.0.1`, covering a morphing entity, an entering entity, and a departing entity.
- No Tailwind or styling framework appears in the kit or `package.json`.
