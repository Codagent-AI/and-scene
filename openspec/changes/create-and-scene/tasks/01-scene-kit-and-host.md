# Task: Build the style-neutral scene kit, router, and registry

## Goal
Deliver the reusable, topic-agnostic `src/presentation-kit/` engine (step contract, stage, navigation, chrome, generic node primitives, attribution) plus the host plumbing (pathname router, explicit presentation registry, Landing page) and the Vitest test setup, so a presentation can be written as `<Presentation steps=… />`. The sample presentation, verification tooling, and skill templates depend on this.

## Background
Current state: a Vite + React 19 + TypeScript scaffold with a plain-CSS single-page `src/App.tsx` (+ `src/App.css`), no router, no Tailwind, no test runner. `react`, `react-dom`, `motion`, `lucide-react` are already dependencies. ESLint is configured (`npm run lint`). `npm test` (Vitest) does not exist yet: add `vitest` (plus a DOM test environment and Testing Library only if you need them) and a `test` script. Use TDD for the logic-heavy parts (nav clamping, step numbering, fit-scale math, registry/route resolution).

Design decisions to follow (from `design.md`; read it in full before starting):
- Layout (canonical kit source lives in `src/`):
  - `src/main.tsx`: minimal pathname router. `"/"` renders `Landing`; `"/<slug>"` renders the matching registry entry via `React.lazy` inside `<Suspense>`; unknown paths fall back to `Landing` (or a simple not-found). Keep `StrictMode` (watch for effect/animation double-fire with `motion`). No `react-router-dom`.
  - `src/Landing.tsx` replaces `src/App.tsx` (remove `App.tsx`/`App.css` and unused template assets if no longer referenced). It enumerates the registry and links to each presentation. Host CSS lives in `src/index.css`; it must contain no reusable-kit visual defaults.
  - `src/presentations/index.ts`: EXPLICIT array of `{ slug, title, load: () => import('./<dir>/Talk') }` (not `import.meta.glob`). Create it now; it may be empty or hold a tiny test fixture until a reference presentation is registered. (The per-presentation entry component is named `Talk.tsx`; the filename is incidental.)
  - `src/presentation-kit/`: `types.ts` (`Step`, `Scene`, `StepMeta`, `SceneProps`), `constants.ts` (`EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`), `usePresentationNav.ts`, `useFitScale.ts`, `Stage.tsx`, `Presentation.tsx`, `chrome/{Header,Footer,Toc}.tsx`, `nodes/{Box,Label,Arrow,Frame,Emphasis,SymbolChip,Appear,SceneLayer}.tsx`.
- Step contract: generic `Step<TPayload>` / `SceneProps<TPayload>`; each step has a stable id, a section/era label, a presenter title, a browse caption, and a diagram state (scene component + payload). Steps sharing a `groupKey` (and the same `Scene`) are NOT remounted between navigations: the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph. A strongly typed grouped payload array must be accepted at `<Presentation>` without casts (verify with a type-level test or a compile-checked fixture). On-screen step numbers derive from array position.
- Stage: fixed design canvas 880 × 380 in `LayoutGroup` + `AnimatePresence`, uniformly scaled by `useFitScale` into the gap between header and footer, per-mode geometry from `STAGE_LAYOUT`. Scale is constant within a mode; switching modes is a re-render, not a morph.
- Nav (`usePresentationNav`): `ArrowRight`/`Space`/`PageDown` next, `ArrowLeft`/`PageUp` prev, `P` toggles mode, horizontal swipe (left = next, right = prev). `next`/`prev` clamp to `[0, last]` (no wrap). Keys must not hijack focused interactive controls (buttons, links, inputs, etc.). Mode toggling preserves the current step.
- Chrome: present mode shows marker + one-line title only (caption, ToC, prev/next hidden); browse mode shows title + multi-line caption + ToC (wide viewports only) + progress dots + prev/next. `<Presentation>` accepts `{ steps, title, initialMode }`. ToC is era-based: an entry jumps to the first step of that era; progress dots jump to their step.
- Attribution: by default a bottom-right link reading "made by and-scene" pointing at the and-scene GitHub repository (use `https://github.com/and-scene/and-scene` unless the repository's `package.json`/README names a different URL), with a stable hook. No default top-left and-scene brand: the header brand slot is host opt-in only. Provide an option to override/disable attribution.
- Node primitives are generic: each accepts stable identity (`layoutId`/id) and `className`/`data-*`/`style` pass-through, and supplies NO palette, font, spacing, border, shadow, card, button, or theme defaults. `Appear` sequences newcomers only after persisting entities have settled (use `ENTER_DELAY`); entities that continue across grouped steps morph via layout projection and must NOT be wrapped in newcomer fade-in. `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. `Box` may take an optional `Icon: LucideIcon`. Raw `motion` elements with stable `layoutId`s must remain usable for coordinate-heavy diagrams.
- Zero style defaults means: no CSS file shipped by the kit, no inline color/font/border/shadow/spacing defaults, no Tailwind or other framework dependency. Layout geometry (canvas size, absolute positioning, chrome placement) is allowed as behavior. Add a contract test that scans `src/presentation-kit/` for forbidden visual declarations (color/font/border/shadow/background properties, `tailwind` imports, CSS files, CSS custom-property theme tokens) so the style-neutral rule is enforced.
- Stable DOM hooks. The names below are fixed by the design/specs where marked; the rest are chosen here and must be used verbatim by later tooling:
  - `data-step-count` and `data-step-index` on the chrome root (fixed by design; `data-step-index` is the zero-based active index and must update when the active step changes).
  - Use the `data-presentation-*` prefix for every other hook: `data-presentation-chrome` (chrome root), `data-presentation-mode` (`"present"|"browse"`), `data-presentation-stage` (fixed canvas), `data-presentation-progress` (progress indicator container) and `data-presentation-progress-item`, `data-presentation-toc` and `data-presentation-toc-entry`, `data-presentation-prev` / `data-presentation-next` (controls), `data-presentation-attribution` (the attribution link), `data-presentation-title`, `data-presentation-caption`, `data-presentation-allow-overlap` (author marker; the visual-inspection tooling treats elements inside a marked subtree as exempt from overlap warnings), and `data-presentation-entity` on primitives (carrying the entity identity).
  - Active state: the active progress item and active ToC entry carry `aria-current="step"` and `data-presentation-active="true"` (inactive ones omit/false-valued, never `aria-current`).
- Keep this kit byte-aligned with its future bootstrap-template copy (the kit is snapshotted into skill bootstrap templates): avoid repo-specific imports from kit files (only `react`, `motion`, `lucide-react`, and files inside the kit).

Dependencies to add now: `vitest` (and DOM env / testing-library if used). Do not add Playwright here.

## Spec
These are the canonical requirements of `evolving-scene-presentations` (copied from `specs/evolving-scene-presentations/spec.md`).

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
- All scenarios above are covered by focused Vitest tests (nav clamping/keys/swipe/focus-guard, step-number derivation, mode toggle preserving index, fit-scale math and default canvas constants, grouped-scene persistence — the scene instance is not remounted across grouped steps, chrome visibility per mode, attribution default/override and absent top-left brand, active-state attributes on progress/ToC, typed-payload compile check, registry/route resolution including the unknown-path fallback) and the style-neutrality contract test over `src/presentation-kit/`.
- `npm test`, `npm run lint`, and `npm run build` pass; `npm test` is a real script using Vitest.
- `src/App.tsx` is replaced by `Landing.tsx`; `/` renders the landing list and `/<slug>` lazy-loads the registered presentation (demonstrate with a minimal throwaway or test-only fixture if the sample doesn't exist yet; do not leave a half-built sample registered).
- `src/presentation-kit/` imports only from `react`, `motion`, `lucide-react`, and itself, ships no CSS, and exposes every hook listed in Background.
- Spot-check in a browser with `chrome-devtools-axi` (`snapshot`, then a screenshot) against `http://127.0.0.1:5173/` using a fixture presentation: stepping, mode toggle, and morphs work.
