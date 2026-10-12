# Task: Scene kit, host shell, and test harness

## Goal
Deliver the reusable, style-neutral scene kit at `src/presentation-kit/` and the minimal host app shell (pathname router, explicit presentation registry, landing page) that mounts presentations, so any presentation can be authored as `<Presentation steps=… />` and navigated in present/browse modes. This is the foundation every presentation, verification script, and scaffold template builds on.

## Background
Repository state: Vite 8 + React 19 + TypeScript app with a placeholder plain-CSS `src/App.tsx`/`src/App.css`, no router, no Tailwind, no test runner. `react`, `react-dom`, `motion`, and `lucide-react` are already in `package.json`. ESLint, `tsc -b && vite build` already work (`npm run build`, `npm run lint`). Use `127.0.0.1` for any local browser automation. Do not add CI configuration (no `.github/workflows/`). Do not commit build output or dependencies. Commit messages use `type: lowercase description`.

Read for context: `openspec/changes/create-and-scene/design.md` (sections "Repository layout", "Scene kit (the engine)", "Routing + registry", "Styling", Decisions 1–3 and 7) and `openspec/changes/create-and-scene/proposal.md`.

### Test harness (do this first, test-driven)
Add Vitest (+ `@testing-library/react`/`jsdom` or equivalent as needed) with an `npm test` script. `npm test` must run the whole automated suite for the repository (unit/contract tests in `src/**/*.test.ts(x)`, and later browser-backed integration/end-to-end tests under `tests/integration/` and `tests/e2e/` — configure Vitest so those directories are picked up with generous timeouts, and so a missing browser is a clear failure rather than a silent skip). Write focused failing unit tests before implementing each piece of isolated logic (navigation clamping/keys/swipe/mode, fit-scale computation, step numbering derived from order, registry/route resolution, typed-payload acceptance at the `<Presentation>` boundary via type-level or compile-checked test, hook/attribute presence on chrome and primitives, "no style defaults" contract test).

### Layout to create (names are fixed by the design)
```
src/main.tsx               # minimal pathname router: "/" → Landing, "/<slug>" → React.lazy presentation inside <Suspense>; unknown → Landing; keep StrictMode
src/Landing.tsx            # replaces src/App.tsx (delete App.tsx/App.css and unused starter assets); enumerates the registry, links to each presentation
src/index.css              # host/app CSS only; no reusable-kit visual defaults
src/presentation-kit/
  types.ts                 # Step<TPayload>, Scene, StepMeta, SceneProps<TPayload> (the step contract)
  constants.ts             # EASE, LAYOUT_T, ENTER_T/ENTER_DELAY, DESIGN_W=880, DESIGN_H=380, MIN_SCALE, STAGE_LAYOUT { browse, present }
  usePresentationNav.ts    # keyboard (→/Space/PageDown, ←/PageUp, P) + touch swipe + mode; clamp at [0,last]; keys do not hijack focused controls
  useFitScale.ts           # uniform fit scaling for the active mode's stage geometry
  Stage.tsx                # LayoutGroup + AnimatePresence host for the active step's Scene
  Presentation.tsx         # composes Stage + chrome + nav from steps[] + { initialMode, title }
  chrome/Header.tsx, chrome/Footer.tsx, chrome/Toc.tsx
  nodes/Box.tsx, Label.tsx, Arrow.tsx, Frame.tsx, Emphasis.tsx, SymbolChip.tsx, Appear.tsx, SceneLayer.tsx
src/presentations/index.ts # EXPLICIT registry array: [{ slug, title, load: () => import('./<dir>/Talk') }] (start empty or with a tiny test-only entry; do not use import.meta.glob)
```

### Design decisions to honor
- **Style-neutral kit**: zero palette, font, color, border, glow, shadow, card, button, spacing-scale, theme-token defaults; no Tailwind or any styling framework dependency. Layout geometry (canvas size, positioning plumbing) is allowed; it is behavior, not style. Primitives accept stable identity (`layoutId`) plus `className`/`data-*`/`style` hooks and supply nothing visual. `Box` may carry an optional `LucideIcon` component prop (icon-as-component pattern).
- **Stable DOM hooks**: all kit-exposed hooks use the `data-presentation-*` prefix. The chrome root MUST expose `data-step-count` and `data-step-index` (these exact names; verification tooling depends on them). Also expose hooks for: presentation root, mode (browse/present), stage/canvas, header, footer, caption, title, progress indicators (each indicator gets a step index hook), table-of-contents entries, prev/next controls, and the attribution link (`data-presentation-attribution`). Active progress indicators and active ToC entries MUST expose both `aria-current="step"` and a stable active-state hook `data-active="true"` (absent or `"false"` when inactive). Provide an explicit allow-overlap marker attribute `data-presentation-allow-overlap` (kit just documents/passes it through; the inspection tooling consumes it). Document the full hook list in a short `src/presentation-kit/README.md`.
- **Grouped scenes**: steps sharing `groupKey` and the same `Scene` component are not remounted between navigations — the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph. `Appear` sequences newcomers only after persisting entities settle (use `ENTER_DELAY`), and continuing entities must NOT be wrapped in newcomer fade-in. `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. Intentional overlapping/stacked composition must be preserved.
- **Stage**: fixed 880×380 canvas scaled uniformly by `useFitScale` to the space between header and footer; scale is constant within a mode so morphs stay clean; switching mode is a re-render, not a morph.
- **Chrome**: present mode shows marker + one-line title only (caption, ToC, prev/next hidden); browse mode shows title + multi-line caption + ToC (wide viewports only) + progress dots + prev/next. A presentation may declare `initialMode`. The ToC is era-based: entries come from each step's section/era label; activating one jumps to the first step of that era. Bottom-right attribution defaults to a link reading exactly `made by and-scene` pointing to the and-scene GitHub repository (read `README.md`/git remote for the URL; if none is discoverable use `https://github.com/and-scene/and-scene` and record that as an assumption); an option lets a host override/disable it. NO default top-left and-scene brand — the header brand slot is host opt-in (a prop).
- **Step order numbering**: step numbers shown on screen are derived from position, never stored.
- **Strict typing**: `Step<TPayload>`/`SceneProps<TPayload>` preserve typed grouped payloads through `<Presentation>` with no casts at the call site (design: generic `Presentation` accepts a heterogeneous typed step array).
- Keep `StrictMode`; watch effect/animation double-fire.
- A later change will vendor this kit byte-for-byte into a bootstrap template, so keep the kit self-contained: it may import only `react`, `motion`, `lucide-react`, and its own files — never host files (`src/index.css`, `Landing.tsx`, presentations).
- The host owns `index.css`/Landing styling (plain CSS); keep it minimal and unopinionated.

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
- Every scenario above is satisfied; scenarios that are isolated logic (navigation keys/clamp/swipe/focus guard, mode toggle preserving position, fit-scale, order-derived numbering, typed payload boundary, attribution default + hook, no top-left brand, unstyled-kit contract, active-state `aria-current`/`data-active` hooks, ToC era jump) have focused Vitest tests that failed first.
- `npm test`, `npm run lint`, and `npm run build` pass; `src/App.tsx` is replaced by `Landing.tsx` and the router works for `/`, `/<registered-slug>`, and unknown paths.
- A grep/contract test proves `src/presentation-kit/` contains no color/font/border/shadow declarations, no CSS files, and no Tailwind/styling-framework imports.
- `src/presentation-kit/README.md` lists the exact `data-presentation-*` hooks, `data-step-count`, `data-step-index`, `aria-current`, `data-active`, and `data-presentation-allow-overlap`.
- With a throwaway multi-step presentation (not committed, or committed only as a test fixture under `src/` test files), confirm in a real browser via `chrome-devtools-axi` at `127.0.0.1` that grouped steps morph, nav/modes work, and the attribution renders bottom-right.
