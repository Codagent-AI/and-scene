# Task: Scene kit engine, router, registry, and landing page

## Goal
Deliver the reusable, style-neutral scene kit at `src/presentation-kit/` plus the host app plumbing (pathname router, explicit presentation registry, landing page) and the Vitest test setup, so any presentation can be composed from `steps[]` and rendered at its own route. This is the foundation every generated presentation runs on.

## Background
The repository is a Vite 8 + React 19 + TypeScript 6 app (`package.json`, `tsconfig.app.json`, `eslint.config.js`). It currently has a placeholder `src/App.tsx`/`src/App.css`, a plain `src/main.tsx`, and no router, no Tailwind, no test runner. `react`, `react-dom`, `motion`, and `lucide-react` are already dependencies. Use `127.0.0.1` for any local browser automation. Do not add CI configuration (no `.github/workflows/`), and do not commit `dist/`, `node_modules/`, or screenshots.

Use test-driven development: add focused failing Vitest tests for isolated logic first, then implement. Add `vitest` (plus jsdom / `@testing-library/react` only if you need them) and an `npm test` script (`vitest run`). `npm run lint` and `npm run build` must stay green (`build` is `tsc -b && vite build`); make sure the tsconfig/eslint setup covers new test files.

Design decisions to follow (from `design.md`; read it, especially "Repository layout", "Scene kit (the engine)", "Routing + registry", "Styling", and Decisions 1–3):

- Canonical kit location and files:
  - `src/presentation-kit/types.ts` — generic `Step<TPayload>`, `Scene`, `StepMeta`, `SceneProps<TPayload>`; strongly typed grouped payloads pass through `<Presentation>` with no casts. Steps sharing a `groupKey` (and `Scene`) are not remounted between navigations — the instance persists and only `payload` changes; otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph.
  - `src/presentation-kit/constants.ts` — `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
  - `src/presentation-kit/usePresentationNav.ts` — keyboard (→/Space/PageDown next, ←/PageUp prev, P toggles mode), touch swipe (left = next, right = prev), mode state; `next`/`prev` clamp at `[0, last]`; keys must not hijack focused interactive controls.
  - `src/presentation-kit/useFitScale.ts` — uniform fit scaling for the active mode's stage geometry (scale constant within a mode so morphs stay clean; switching modes is a re-render, not a morph).
  - `src/presentation-kit/Stage.tsx` — `LayoutGroup` + `AnimatePresence` host for the active step's Scene on the 880×380 canvas.
  - `src/presentation-kit/Presentation.tsx` — composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`. Keep `StrictMode` in the app and watch for effect/animation double-fire.
  - `src/presentation-kit/chrome/Header.tsx`, `Footer.tsx`, `Toc.tsx` — present mode shows marker + one-line title (caption, ToC, nav hidden); browse mode shows title + multi-line caption + era-based ToC (wide viewports only) + progress dots + prev/next. Footer/progress/ToC active entries expose semantic current state (`aria-current`) plus a stable active-state hook. Step numbers are derived from position.
  - `src/presentation-kit/nodes/` — generic, topic-agnostic primitives: `Box.tsx` (optional `LucideIcon` glyph via the icon-as-component pattern; carries `layoutId`), `Label.tsx`, `Arrow.tsx`, `Frame.tsx`, `Emphasis.tsx`, `SymbolChip.tsx`, `Appear.tsx` (sequences newcomers only after persisting entities settle), `SceneLayer.tsx` (absolutely positions a step's diagram so mounting one layer never reflows another). Each accepts stable identity and class/data/style hooks and supplies no palette, font, spacing, border, shadow, card, button, or theme defaults. Raw `motion` elements with stable `layoutId`s must remain usable by authors.
- Stable hooks: expose `data-presentation-*` attributes (project convention). The chrome MUST expose `data-step-count` and `data-step-index` so a headless driver can enumerate and observe steps. Also provide stable `data-presentation-*` hooks for: the attribution link, active progress/ToC entries, mode, and an allow-overlap marker attribute that presentations can put on a subtree (the inspection tooling will honor it). Pick consistent names, document them in a short `src/presentation-kit/README.md`, and keep them stable.
- Attribution: default bottom-right link labeled `made by and-scene` pointing to the and-scene GitHub repository (`https://github.com/Codagent-AI/and-scene` (the repository's git remote)), with a stable hook; no default top-left brand link (host may supply one via an option).
- Style neutrality: the kit ships zero CSS (no stylesheet, no inline color/font/border/shadow defaults, no Tailwind or other framework dependency). Inline styles are allowed only for layout geometry (canvas size, transforms, absolute positioning).
- Router/registry: `src/main.tsx` reads `window.location.pathname`: `"/"` → `Landing`; `"/<slug>"` → matching registry entry, `React.lazy`-loaded inside `<Suspense>`; unknown → `Landing` (or a simple not-found). `src/presentations/index.ts` is an explicit array `{ slug, title, load: () => import('./<dir>/Talk') }` (no `import.meta.glob`, no `react-router-dom`). `src/Landing.tsx` replaces `src/App.tsx`/`App.css` and enumerates the registry with links. `src/index.css` is host-only CSS. The registry may start empty or with a minimal fixture presentation used for kit tests; the real sample is delivered separately — do not implement it here. Make `main.tsx` routing logic testable (e.g. a pure `resolveRoute(pathname, registry)` function).
- `Talk.tsx` is the incidental per-presentation entry filename; "presentation" is the canonical term everywhere else.
- Keep the kit self-contained (no imports from outside `src/presentation-kit/`, except npm packages) so it can later be copied byte-for-byte into a bootstrap template; later work will keep a template copy byte-aligned with this canonical source.

Unit-test the isolated logic that specs demand: nav clamping and key/swipe mapping (including focused-control exemption), fit-scale math, order-derived numbering, ToC era → first-step mapping, route resolution, and typed-payload compilation (a type-level test or a `tsc`-checked fixture proving no cast is needed). Exercise stage/chrome via component tests where feasible (grouped steps keep the same Scene instance; mode toggle preserves index; active hooks/`aria-current`).

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
- Every scenario above is covered by passing Vitest tests where unit/component-testable (navigation, boundaries, modes, active semantics, numbering, typed payloads, scaling, attribution, style-neutral output); scenarios that need a real browser (animated morphing, newcomer sequencing) are implemented per the design and left for the browser-based work to exercise.
- `src/presentation-kit/` exists with the files listed above, imports nothing from outside itself, contains no CSS file and no visual defaults, and documents its `data-presentation-*` hooks (including `data-step-count`, `data-step-index`, attribution, active-state, and allow-overlap marker).
- `src/main.tsx`, `src/Landing.tsx`, and `src/presentations/index.ts` implement the router/registry described; the placeholder `App.tsx`/`App.css` are removed.
- `package.json` has an `npm test` script; `npm test`, `npm run lint`, and `npm run build` all pass.
