# Task: Scene kit, router, and registry host app

## Goal
Replace the placeholder `App.tsx` page with the reusable, style-neutral, topic-agnostic scene kit in
`src/presentation-kit/` plus the pathname router, explicit presentation registry, and landing page that host
presentations. This is the engine every presentation (the committed sample, and everything the skill
generates) runs on, so it must be correct and fully hooked for styling, navigation, and verification.

## Background
Repo today: Vite + React 19 + TypeScript app with `react`, `react-dom`, `motion`, `lucide-react` already in
`package.json`; plain-CSS single-page `src/App.tsx`/`src/App.css`, no router, no Tailwind, no test runner.
Use `127.0.0.1` for any local browser automation. Do not add CI configuration. Do not commit build output.

Test-driven development applies: add focused failing tests first. Add **Vitest** (with whatever DOM
environment/testing library you need) and an `npm test` script that runs the unit and contract tests. Also
keep `npm run lint` and `npm run build` green.

### Layout to create (fixed by the design)
```
src/main.tsx               # minimal pathname router: "/" → Landing, "/<slug>" → lazy presentation (React.lazy + Suspense); unknown → Landing (or simple not-found). Keep StrictMode.
src/Landing.tsx            # replaces App.tsx (delete App.tsx/App.css and unused assets); enumerates the registry, links to each presentation
src/index.css              # host/app CSS only; no reusable-kit visual defaults
src/presentation-kit/
  types.ts                 # Step, Scene, StepMeta, SceneProps  (generic Step<TPayload>, SceneProps<TPayload>)
  constants.ts             # EASE, LAYOUT_T, ENTER_T/ENTER_DELAY, DESIGN_W=880, DESIGN_H=380, MIN_SCALE, STAGE_LAYOUT { browse, present }
  usePresentationNav.ts    # keyboard (→/Space/PageDown, ←/PageUp, P) + touch swipe + mode; clamp at ends
  useFitScale.ts           # uniform fit scaling for the active mode's stage geometry
  Stage.tsx                # LayoutGroup + AnimatePresence host for the active step's Scene
  Presentation.tsx         # composes Stage + chrome + nav from steps[] + { initialMode, title }
  chrome/Header.tsx        # logo/marker row; title in browse mode
  chrome/Footer.tsx        # caption (browse) / title (present), progress dots, prev/next
  chrome/Toc.tsx           # era-based table of contents (browse, wide viewports)
  nodes/Box.tsx            # bordered-card role; optional LucideIcon glyph (`Icon: LucideIcon`); carries layoutId
  nodes/Label.tsx, Arrow.tsx, Frame.tsx, Emphasis.tsx
  nodes/SymbolChip.tsx     # generic symbol chip with stable styling hooks
  nodes/Appear.tsx, SceneLayer.tsx
src/presentations/index.ts # EXPLICIT registry: Array<{ slug, title, load: () => import('./<dir>/Talk') }> — not import.meta.glob. Start with an empty (typed) array; the committed sample is registered separately.
```
Each presentation supplies only its own `entities.ts` (its `layoutId` namespace) and `steps/*` (Scenes composing
primitives), then renders `<Presentation steps={…} title={…} initialMode="browse" />` from its `Talk.tsx`
(the filename is incidental; "presentation" is the canonical term).

### Kit behavior decisions (from the design)
- Steps that share a `groupKey` (and the same `Scene` component) are not remounted between navigations: the
  instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId`
  elements morph. Generic `Step<TPayload>`/`SceneProps<TPayload>` types must keep payloads strongly typed
  through the `<Presentation>` boundary with no casts at the call site (cover with a type-level test).
- Step identity: stable id, era/section label, present title, browse caption. On-screen numbers are derived
  from position.
- Stage: fixed canvas 880 × 380, scaled uniformly by `useFitScale` to the gap between header and footer; scale
  is constant within a mode so morphs stay clean; switching modes is a re-render, not a morph.
- Nav: `next`/`prev` clamp at `[0, last]`; keys never hijack focused interactive controls (buttons, links,
  inputs) — those keep their own key behavior.
- Chrome: present mode shows marker + one-line title only (no caption, ToC, prev/next). Browse mode shows
  title, multi-line caption, ToC (wide viewports only), progress dots, prev/next. `initialMode` may be
  declared. Direct jump: progress dot → that step; ToC entry → first step of that era.
- Primitives are topic-agnostic, accept stable identity (`layoutId`) and `className`/`data-*`/`style` hooks, and
  supply **no** palette, font, spacing, border, shadow, card, button, or theme defaults. `Appear` sequences
  newcomers only after persisting entities settle (ENTER_DELAY) and must not wrap continuing entities.
  `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. Raw `motion`
  elements with stable `layoutId`s remain usable alongside primitives.
- Bottom-right attribution defaults to a "made by and-scene" link to the and-scene GitHub repository with a
  stable hook; no default top-left brand (header exposes an opt-in brand slot only). Allow overriding/disabling
  attribution through a prop.
- Any inline style the kit itself authors is limited to layout geometry/transform (canvas size, scale, absolute
  positioning); no kit-owned colors, fonts, borders, shadows. Properties generated at runtime by `motion`
  (e.g. animated opacity/transform for fades and layout morphs) and author-supplied `style`/`className` are permitted. No Tailwind or other styling-framework dependency.

### Stable DOM hooks (fixed for the whole change; other tooling depends on exact spelling)
The design fixes `data-step-count` and `data-step-index` on the chrome root element; the verification and
inspection scripts read them. All additional hooks below use the `data-presentation-*` convention required by
the repository's CLAUDE.md. Spell them exactly:
- `data-step-count` (number of steps) and `data-step-index` (zero-based active index) on the chrome root, which also carries `data-presentation-chrome` and `data-presentation-mode="present"|"browse"`.
- `data-presentation-stage` (fixed canvas element), `data-presentation-title`, `data-presentation-caption`, `data-presentation-marker`, `data-presentation-era` for the active step's narration.
- `data-presentation-progress` (container) and `data-presentation-progress-item` (each dot/button); `data-presentation-toc` and `data-presentation-toc-item`; `data-presentation-prev`, `data-presentation-next`.
- Active navigation items carry `data-presentation-active="true"` and semantic current state: `aria-current="step"` on the active progress item and `aria-current="true"` on the active ToC entry (inactive items carry neither).
- `data-presentation-attribution` on the attribution link; `data-presentation-brand` on the opt-in header brand slot (empty by default).
- Node primitives carry `data-presentation-node="box|label|arrow|frame|emphasis|symbol-chip|appear|scene-layer"`.
- `data-presentation-allow-overlap` is the subtree marker authors use to exempt intentional overlap from inspection warnings (the kit only documents/exports it; the inspection helper consumes it).
- `Landing.tsx` renders one anchor per registry entry with `data-presentation-link` and `href="/<slug>"`.

Open assumption: the unprefixed `data-step-count`/`data-step-index` conflict stylistically with the
`data-presentation-*` convention in CLAUDE.md; the design fixes them, so keep them verbatim.

## Spec
These are the canonical requirements this task implements (the whole `evolving-scene-presentations` capability).

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

Routing/registry (from the design, not a separate spec): `/` shows Landing listing every registry entry;
`/<slug>` lazily loads that entry; unknown paths fall back to Landing; adding a presentation is one new folder
plus one registry line.

## Done When
- All scenarios above are covered by focused Vitest unit/contract tests where isolable (nav clamping, key/swipe mapping, focused-control key handling, mode toggle preserving index, derived numbering, fit-scale math, registry/router resolution, ToC era-first jump, active-state hooks, attribution default and override, no-default-brand, type-level payload test). Visual morph behavior needs a real browser to verify; do not mock it into false confidence.
- A style-neutrality contract test fails if kit source contains Tailwind, color/font/border/shadow declarations, or CSS files, or if `package.json` gains a styling framework.
- `src/App.tsx`/`App.css` are gone, `src/Landing.tsx` and the pathname router work, and `src/presentations/index.ts` exists as an explicit typed registry.
- `package.json` has `test` (Vitest) alongside existing scripts; `npm test`, `npm run lint`, and `npm run build` pass.
