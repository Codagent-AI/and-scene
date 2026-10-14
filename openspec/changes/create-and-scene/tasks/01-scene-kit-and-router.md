# Task: Scene kit, router, and registry foundation

## Goal
Deliver the reusable, style-neutral scene kit (`src/presentation-kit/`), the zero-dependency pathname router, the explicit presentation registry, and the Landing page, replacing the placeholder single-page app. Presentations, verification, and the skill all build on this engine, so its contract (step model, hooks, modes, navigation, fit scaling, attribution) must be complete, unit-tested, and stable.

## Background
This is a greenfield change to a Vite + React 19 + TypeScript app (`react`, `react-dom`, `motion`, `lucide-react` are already in `package.json`; there is no router, no Tailwind, and no test runner). Currently `src/App.tsx` is a placeholder single page with plain CSS (`src/App.css`, `src/index.css`, template assets under `src/assets/`). Read `CLAUDE.md` and `AGENTS.md` at the repo root for workflow rules (TDD, `127.0.0.1` for browser automation, no CI config, no committed build output or screenshots, commit message style).

Fixed design decisions (copy names verbatim; do not rename):

- Canonical kit source lives in `src/presentation-kit/`:
  - `types.ts` — `Step`, `Scene`, `StepMeta`, `SceneProps`. Generic `Step<TPayload>` / `SceneProps<TPayload>` preserve strongly typed grouped payloads through the `<Presentation>` boundary without casts. Steps that share a `groupKey` (and the same `Scene`) are not remounted between navigations: the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph.
  - `constants.ts` — `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
  - `usePresentationNav.ts` — keyboard (`→`/Space/PageDown next, `←`/PageUp previous, `P` toggles mode), horizontal touch swipe (left = next, right = previous), mode state; `next`/`prev` clamp at `[0, last]` with no wrap; keys must not hijack focused interactive controls.
  - `useFitScale.ts` — uniform fit scaling of the 880 × 380 canvas into the gap between header and footer using the active mode's `STAGE_LAYOUT` geometry. Scale is constant within a mode so `layoutId` morphs stay clean; switching modes is a re-render, not a morph.
  - `Stage.tsx` — `LayoutGroup` + `AnimatePresence` host for the active step's Scene.
  - `Presentation.tsx` — composes Stage + chrome + nav from `steps[]` plus `{ initialMode, title }`. Keep `StrictMode` (in `main.tsx`) and watch for effect/animation double-fire under StrictMode + `motion`.
  - `chrome/Header.tsx` (marker row; title in browse mode; top-left brand slot is host opt-in and renders no and-scene link by default), `chrome/Footer.tsx` (caption in browse / title in present, progress dots, prev/next), `chrome/Toc.tsx` (era-based table of contents, browse mode, wide viewports only).
  - `nodes/` generic primitives: `Box.tsx` (optional `LucideIcon` glyph via the icon-as-component pattern `Icon: LucideIcon`; carries `layoutId`), `Label.tsx`, `Arrow.tsx`, `Frame.tsx`, `Emphasis.tsx`, `SymbolChip.tsx`, `Appear.tsx` (sequences newcomers only after persisting entities settle; continuing entities are never wrapped in newcomer fade-in), `SceneLayer.tsx` (absolutely positions a step's diagram so mounting one layer never reflows another). Every primitive accepts stable identity and class/data/style hooks and supplies NO palette, font, spacing, border, shadow, card, button, or theme defaults.
- Stable test/inspection hooks use the `data-presentation-*` prefix. Required hooks include: `data-step-count` and `data-step-index` on the chrome (the headless verification driver enumerates steps through these and must not depend on DOM structure); semantic current-step state (`aria-current`) plus a stable active-state hook on the active progress indicator and active ToC entry; a stable hook on the default attribution link. Choose concrete `data-presentation-*` names consistently, export them from one place in the kit (e.g. a hooks constants module), and keep them stable — later tooling (screenshot helper, verification, sample CSS) targets them.
- Default attribution: a bottom-right link reading "made by and-scene" pointing at the and-scene GitHub repository (choose the repo URL from the git remote/README if discoverable; otherwise record the assumption). The kit adds no default top-left and-scene brand link.
- The kit has zero visual defaults and no styling-framework dependency; any default geometry (canvas size, chrome placement) is layout behavior only, not a visual style. Do not add Tailwind, a theme, or CSS custom-property tokens to the kit. `src/index.css` is host/app CSS only.
- Routing: `src/main.tsx` reads `window.location.pathname`: `"/"` → `Landing`; `"/<slug>"` → the matching registry entry, `React.lazy`-loaded inside `<Suspense>`; unknown → `Landing` (or a simple not-found). No `react-router-dom`.
- Registry: `src/presentations/index.ts` is an explicit array of `{ slug, title, load: () => import('./<dir>/Talk') }` (not `import.meta.glob`). Adding a presentation = a new folder + one registry line. The registry starts empty in this task (the reference sample is delivered separately); Landing must render sensibly with zero entries. Each presentation supplies its own `entities.ts` (layoutId namespace) and `steps/*`, and its entry component is named `Talk.tsx` (filename is incidental; "presentation" is the canonical term).
- `src/Landing.tsx` replaces `src/App.tsx`; delete the placeholder App/CSS/assets that are no longer used.
- Test tooling: add Vitest (and whatever DOM/test-utility packages you need, e.g. jsdom + Testing Library) and an `npm test` script. Configure it so a single `npm test` runs every Vitest suite in the repo, including later browser-backed integration/E2E suites that other work will add under separate directories (e.g. `tests/integration`, `tests/e2e`, with longer timeouts); keep the config extensible for that. Unit tests cover the isolated logic: step numbering derived from position, nav clamping/key/swipe handling and focus-control exemption, mode toggle preserving position, fit-scale math, registry/router resolution, grouped-step identity (same `groupKey` + `Scene` ⇒ no remount), and style-neutrality (kit source contains no color/font/border/shadow defaults and no Tailwind dependency).
- Lint (`npm run lint`) and build (`npm run build`, i.e. `tsc -b && vite build`) must remain green; update `tsconfig`/ESLint config as required for tests.
- Keep `src/presentation-kit/` self-contained (no imports from `src/presentations/` or host files) — a later deliverable snapshots it byte-for-byte into a bootstrap template, so only non-test kit files should be required to be copyable, and tests for the kit should live outside the kit's source tree or be clearly separable.

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
- Every scenario above that is observable without the reference sample is covered by a passing automated test (unit/component level) or, where only a real browser can show it, implemented so a later browser check can exercise it; nothing is covered by only a manual claim.
- `src/presentation-kit/` implements the files and contracts listed in Background, exposes the stable `data-presentation-*`, `data-step-count`, `data-step-index`, and `aria-current` hooks, and contains no visual defaults or styling-framework dependency.
- `main.tsx`, `Landing.tsx`, and `presentations/index.ts` implement pathname routing and the explicit registry; `App.tsx` is removed.
- A small throwaway or test-only presentation (not committed as a registered app presentation) demonstrates a grouped step and a non-grouped step rendering through `<Presentation>` with a typed payload and no casts at the boundary.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Quick browser sanity check with `chrome-devtools-axi` (snapshot + screenshot) of a temporary scene confirms the stage scales within the viewport, chrome hooks are present, and attribution renders bottom-right; remove any temporary scaffolding afterward.
