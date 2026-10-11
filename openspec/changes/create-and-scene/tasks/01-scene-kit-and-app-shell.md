# Task: Build the style-neutral scene kit and presentation app shell

## Goal

Create the reusable, topic-agnostic React scene kit at `src/presentation-kit/` plus the
minimal app shell (pathname router, landing page, explicit presentation registry) that every
presentation in this repository and every scaffolded project runs on. The kit is the shared
contract: presentations supply only their own entities, steps, and CSS, then render
`<Presentation steps=… />`. It must own motion, fixed-canvas geometry, navigation, modes, and
stable DOM hooks — and nothing visual.

## Background

And Scene is a Vite 8 + React 19 + TypeScript app. Today `src/main.tsx` renders a
placeholder `src/App.tsx` (with `src/App.css` and unused `src/assets/*`); there is no router and
no Tailwind. `react`, `react-dom`, `motion`, and `lucide-react` are already dependencies.
`node_modules` is not installed yet — run `npm install` first. Read
`openspec/changes/create-and-scene/design.md` (sections "Repository layout", "Scene kit",
"Routing + registry", "Styling", and Decisions 1–3 and 7) before starting.

### Files to create

```
src/
  main.tsx                 # minimal pathname router (rewrite)
  Landing.tsx              # replaces App.tsx; lists registry entries with links
  index.css                # host/app CSS only (landing page); no kit visual defaults
  presentation-kit/
    index.ts               # public exports
    types.ts               # Step, Scene, StepMeta, SceneProps
    constants.ts           # EASE, LAYOUT_T, ENTER_T, ENTER_DELAY, DESIGN_W=880, DESIGN_H=380,
                           #   MIN_SCALE, STAGE_LAYOUT { browse, present }
    usePresentationNav.ts  # keyboard + touch + mode state; clamps at [0, last]
    useFitScale.ts         # uniform fit scale for the active mode's stage geometry
    Stage.tsx              # LayoutGroup + AnimatePresence host for the active step's Scene
    Presentation.tsx       # composes Stage + chrome + nav from steps[] + { initialMode, title }
    chrome/Header.tsx, chrome/Footer.tsx, chrome/Toc.tsx
    nodes/Box.tsx, Label.tsx, Arrow.tsx, Frame.tsx, Emphasis.tsx, SymbolChip.tsx,
          Appear.tsx, SceneLayer.tsx
  presentations/
    index.ts               # explicit registry array (empty for now, typed)
```

Delete `src/App.tsx`, `src/App.css`, and assets that become unused. Keep `StrictMode`.

### Decisions already made

- **Step contract.** Generic `Step<TPayload>` and `SceneProps<TPayload>`. Each step has a
  stable `id`, an era/section label, a presenter `title` (one-liner), a browse `caption`
  (paragraph), a `Scene` component, and its `payload`; optional `groupKey`. The on-screen step
  number is derived from array position (never stored). `<Presentation>` must accept a typed
  step array — including arrays whose grouped steps carry a strongly typed payload — without
  casts at the call site (a `defineSteps`/`step()` helper or a suitable generic signature is
  fine). Prove this with a compile-time check that runs in `npm run build` or a Vitest
  typecheck.
- **Grouped scenes.** Adjacent steps sharing a `groupKey` and the same `Scene` keep one
  mounted scene instance; only `payload` changes, so entities update in place. Otherwise
  `AnimatePresence` cross-fades and shared `layoutId` elements morph across scenes. Continuing
  entities in a group morph via layout projection and are never wrapped in newcomer fade-in.
- **Motion.** `motion` `layoutId` morphs inside a `LayoutGroup`. `Appear` delays newcomers
  (`ENTER_DELAY`) until persisting entities have finished their layout move; departing
  entities animate out. `SceneLayer` absolutely positions a step's diagram so mounting one
  layer never reflows another. Primitives must not force-spread or re-stack entities;
  intentional overlaps/stacks authored by a presentation are preserved.
- **Stage + fit scaling.** Fixed design canvas `DESIGN_W=880 × DESIGN_H=380` (overridable by a
  presentation), scaled uniformly by `useFitScale` to the space between header and footer
  using per-mode geometry `STAGE_LAYOUT.browse` / `STAGE_LAYOUT.present`. Scale is constant
  within a mode; a mode switch is a re-render, not a morph. Keep the scale computation a pure,
  unit-testable function.
- **Navigation (`usePresentationNav`).** `ArrowRight`/`Space`/`PageDown` → next;
  `ArrowLeft`/`PageUp` → prev; `P` toggles mode; horizontal swipe left → next, right → prev.
  `next`/`prev` clamp at `[0, last]` with no wrap. Ignore key events whose target is an
  interactive control (buttons, links, form fields, `contenteditable`, ARIA widgets) so the
  control keeps its keys, and ignore events with modifier keys. Progress dots jump to a step;
  ToC entries jump to the first step of their era.
- **Chrome.** Present mode: marker (position-derived number) + one-line title; caption, ToC,
  and prev/next controls are not shown. Browse mode: title, multi-line caption, era-based ToC
  on wide viewports (width threshold is a kit constant), progress dots, prev/next. A
  presentation may declare `initialMode`; toggling mode keeps the current step.
- **Attribution.** Default bottom-right link with text `made by and-scene` to
  `https://github.com/Codagent-AI/and-scene`, overridable/disable-able via a `Presentation`
  option. No default top-left brand: the header brand slot renders only when the host passes
  one.
- **Router + registry.** `main.tsx` reads `window.location.pathname`: `/` → `Landing`;
  `/<slug>` → the matching entry of `src/presentations/index.ts`, `React.lazy`-loaded inside
  `<Suspense>`; unknown → `Landing` or a simple not-found. The registry is an explicit array of
  `{ slug, title, load: () => import('./<dir>/Talk') }` with each `slug` written as a string
  literal (verification scripts parse it). No `import.meta.glob`, no `react-router-dom`.
  `Landing.tsx` enumerates the registry; it is host-owned and may be styled by `index.css`.
- **Zero visual defaults.** Kit files may set only behavioral/geometric inline styles
  (position, transform/scale, canvas width/height, overflow, pointer behavior, visibility). No
  colors, fonts, font sizes, borders, radii, shadows, backgrounds, spacing scales, CSS files,
  CSS variables/theme tokens, Tailwind classes, or button/card treatments. Every primitive
  accepts `className`, `style`, and `data-*` passthrough plus stable identity.
- **Kit purity.** `src/presentation-kit/` must contain only distributable kit source (it is
  later byte-copied into a bootstrap template), so put kit tests outside it, e.g.
  `tests/unit/presentation-kit/`.

### Stable DOM hook contract

Verification and screenshot tooling depend on these exact hooks; implement all of them:

| Element | Hook |
| --- | --- |
| Presentation root | `data-presentation-root`, `data-presentation-mode="browse"\|"present"`, `data-step-count` (total), `data-step-index` (0-based active index), `data-step-id` |
| Header / brand slot / marker | `data-presentation-header`, `data-presentation-brand` (only when host provides), `data-presentation-marker` |
| Active title / caption | `data-presentation-title`, `data-presentation-caption` |
| Stage / scaled canvas | `data-presentation-stage`, `data-presentation-canvas` |
| Footer | `data-presentation-footer` |
| Progress list / dot | `data-presentation-progress`, `data-presentation-progress-item` (focusable button) |
| ToC / entry | `data-presentation-toc`, `data-presentation-toc-item` (focusable button) |
| Prev / next | `data-presentation-prev`, `data-presentation-next` (buttons with accessible names) |
| Active progress dot or ToC entry | `aria-current="step"` **and** `data-presentation-active="true"` |
| Attribution link | `data-presentation-attribution` |
| Primitives | `data-presentation-node="box\|label\|arrow\|frame\|emphasis\|symbol-chip"`, `data-presentation-entity="<id>"` |
| Scene layer | `data-presentation-layer` |
| Author-marked intentional overlap (convention, not set by kit) | `data-presentation-allow-overlap` |

`Box` accepts an optional `Icon: LucideIcon` glyph and carries its `layoutId`.

### Testing setup

Add Vitest with a jsdom environment (`vitest`, `jsdom`, `@testing-library/react`, plus any
peers) and an `npm test` script (`vitest run`) that runs fast unit/contract tests only — scope
its include patterns so browser/subprocess suites under `tests/integration/` and `tests/e2e/`
are excluded. Use TDD: write each failing test before the behavior.

Unit/contract coverage must include: position-derived numbering; clamp at both ends; key
mapping including focused-control exemption and modifier exemption; swipe direction mapping;
mode toggle preserving the index; direct jumps (progress dot → step, ToC entry → first step of
era); present vs. browse chrome contents; active-state semantics; default attribution and no
default brand; fit-scale math for both modes and the 880 × 380 default; grouped steps not
remounting the scene instance across navigation (e.g., a mount counter); hook presence on
primitives; and a style-neutrality contract test that renders primitives and chrome without
CSS and asserts no inline visual properties, and scans kit sources for CSS imports, Tailwind
utility classes, color literals, and font declarations.

### Constraints

- Lint (`eslint .`) and `tsc -b` must pass; respect `noUnusedLocals`/`erasableSyntaxOnly`.
- Do not add Tailwind, a CSS framework, or a design system. Do not add CI configuration.
- Use `127.0.0.1` (not `localhost`) for any local browser automation.

## Spec

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

- Every scenario above is covered by a focused Vitest unit/contract test (or, for
  motion-timing scenarios jsdom cannot observe faithfully, by a test of the kit's ordering
  logic plus a manual browser check), and `npm test` passes.
- The typed-payload compile-time check passes without casts at the `<Presentation>` call.
- Every hook in the DOM hook contract table is rendered and asserted by tests.
- The style-neutrality contract test passes; `src/presentation-kit/` contains no CSS files,
  color/font literals, Tailwind classes, or styling-framework imports, and `package.json` has no
  Tailwind dependency.
- `src/App.tsx` and `src/App.css` are gone; `/` renders `Landing` listing registry entries;
  the registry type and lazy route loading compile with an empty registry.
- `npm run lint` and `npm run build` pass.
- Before reporting done, render a throwaway (unregistered, uncommitted) multi-step
  presentation in `npm run dev` on `127.0.0.1` and use `chrome-devtools-axi` to confirm
  keyboard navigation, mode toggle, active hooks, attribution, and fit scaling at a wide and a
  narrow viewport; remove the throwaway before committing.
