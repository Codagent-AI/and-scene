# Task: Scene kit, router, and registry

## Goal
Deliver the reusable, presentation-agnostic, style-neutral scene kit at `src/presentation-kit/` and the app shell (pathname router, explicit presentation registry, Landing page) that hosts presentations, so any presentation can be built from `Step` data plus kit primitives. This replaces the placeholder single-page app and adds the unit-test tooling the rest of the change relies on.

## Background
This is a greenfield change in a Vite + React 19 + TypeScript app (`react`, `react-dom`, `motion`, `lucide-react` are already dependencies). Today `src/App.tsx` is a plain-CSS placeholder, `src/main.tsx` renders it, and there is no router, no test runner, and no `presentations/` folder. `package.json` has `dev`, `build` (`tsc -b && vite build`), `lint`, and `preview` scripts only. Keep `StrictMode`.

Design decisions to honor (from `design.md`):

- **Layout** (all under `src/`):
  - `main.tsx`: minimal pathname router. `"/"` renders `Landing`; `"/<slug>"` renders the matching registry entry via `React.lazy` inside `<Suspense>`; an unknown slug falls back to `Landing` (or a simple not-found). No router dependency.
  - `Landing.tsx` replaces `App.tsx` (delete `App.tsx`/`App.css` and unused template assets if no longer referenced) and enumerates the registry, linking to each presentation.
  - `index.css`: host/app CSS only. No reusable-kit visual defaults.
  - `presentations/index.ts`: an **explicit** array `[{ slug, title, load: () => import('./<dir>/Talk') }]` (not `import.meta.glob`). Ship it with a minimal valid state; the reference sample is added later by other work. It must typecheck and Landing must render with an empty or non-empty list. `Talk.tsx` is the per-presentation entry component name (incidental filename); "presentation" is the canonical term.
  - `presentation-kit/`:
    - `types.ts`: generic `Step<TPayload>`, `SceneProps<TPayload>`, `Scene`, `StepMeta`. A step has stable id, section/era label, presenter title, browse caption, and a diagram state (a scene component plus optional `groupKey` and `payload`). Typed grouped payloads must flow through `<Presentation>` without casts at the call site.
    - `constants.ts`: `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
    - `usePresentationNav.ts`: keyboard (Right/Space/PageDown next, Left/PageUp prev, `P` toggles mode), horizontal touch swipe (left = next, right = prev), mode state, jump-to-step; `next`/`prev` clamp at `[0, last]` with no wrap; keys must not be hijacked when an interactive control (button, link, input, etc.) has focus.
    - `useFitScale.ts`: uniform fit scaling of the 880 × 380 canvas to the gap between header and footer for the active mode's stage geometry. Scale is constant within a mode; switching modes is a re-render, not a morph.
    - `Stage.tsx`: `LayoutGroup` + `AnimatePresence` host for the active step's scene. Steps sharing a `groupKey` and the same scene component are NOT remounted: the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph.
    - `Presentation.tsx`: composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`. Order-derived step numbering (no manual numbers). Position is preserved across mode toggles.
    - `chrome/Header.tsx`, `chrome/Footer.tsx`, `chrome/Toc.tsx`: present mode shows marker + one-line title only (caption, ToC, prev/next hidden); browse mode shows title, multi-line caption, ToC on wide viewports (era-based; entry jumps to the first step of that era), progress dots, prev/next. Top-left branding is a host opt-in slot with no default and-scene brand link. Footer/bottom-right attribution defaults to a `made by and-scene` link to the and-scene GitHub repository (look at `README.md`/git remote for the repo URL; if none can be determined, use `https://github.com/and-scene/and-scene`) with a stable styling hook.
    - `nodes/`: `Box` (optional `LucideIcon` glyph, carries `layoutId`), `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`. Each accepts stable identity plus class/data/style hooks and supplies **no** palette, font, spacing, border, shadow, card, button, or theme defaults. `Appear` sequences newcomers only after persisting entities settle (continuing entities are never wrapped in newcomer fade-in). `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. Authors may use raw `motion` elements with stable `layoutId`s for coordinate-heavy diagrams, so primitives must expose class/style hooks.
- **Stable hooks required by other tooling** (use `data-presentation-*` naming): the chrome exposes `data-step-count` and `data-step-index` (as `data-presentation-step-count` / `data-presentation-step-index` if the namespace is used consistently; pick one scheme, document it in a short comment/README near the kit, and keep it identical everywhere) on the presentation chrome element; progress indicators and ToC entries expose `aria-current="step"` (or `aria-current` equivalent) plus a stable active-state hook (e.g. `data-presentation-active`) when representing the active step; the attribution link has a stable hook; the mode is exposed as a hook; nodes expose `data-presentation-*` hooks. A hook for explicitly allowing overlap (e.g. `data-presentation-allow-overlap`) is documented here because the inspection tooling consumes it.
- **Style neutrality is a hard contract**: no Tailwind, no styling-framework dependency, no CSS theme tokens, no default colors/fonts/borders/shadows/card/button treatments in the kit. Fixed-canvas and chrome-placement geometry is layout behavior and is allowed (inline layout styles or structural positioning only). Prefer no CSS file in the kit; if structural CSS is needed it must contain only geometry.
- **Test tooling**: add Vitest (with jsdom or equivalent and Testing Library if useful) and an `npm test` script; keep `npm run lint` and `npm run build` green. Per `CLAUDE.md`, use TDD: write focused failing tests, then implement. Unit-test the isolated logic from the specs: nav reducer/hook (all keys, swipe, clamping, focus guard, mode toggle preserves index), fit-scale math and the 880 × 380 default, order-derived numbering and era grouping/jump targets, registry shape and Landing enumeration, router slug resolution, grouped-scene persistence (same instance not remounted), attribution default and hook, no top-left brand, and a style-neutrality check that scans the kit sources for forbidden styling dependencies/tokens (Tailwind, color literals, font declarations).
- Use `127.0.0.1` for any local browser automation. Do not add CI configuration. Do not commit build output, `node_modules`, or screenshots.
- A later piece of work copies this kit byte-for-byte into a bootstrap template; keep kit files self-contained (only import from `react`, `motion`, `lucide-react`, and within the kit) so that copy compiles in a fresh project. Do not import from `src/presentations` or host CSS inside the kit.

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
- Every scenario above is covered by passing unit/contract tests where it is isolatable (navigation keys/swipe/jump/clamp/focus guard, mode toggle position preservation, order-derived numbering, typed payload acceptance without casts, fit-scale and default canvas, attribution and top-left-brand absence, style-neutral kit scan, registry/router/Landing behavior). Motion-continuity scenarios (morph, newcomer enter-after-settle, departing exit) are implemented per the design and will be exercised in a real browser by the reference sample work; here, structurally verify that grouped steps do not remount and that continuing entities are not wrapped in newcomer behavior.
- `npm test`, `npm run lint`, and `npm run build` all pass from a clean `npm ci`.
- `src/presentation-kit/` matches the layout above, imports nothing from outside itself except `react`, `motion`, and `lucide-react`, and contains no Tailwind or visual defaults.
- `src/main.tsx` routes `/` and `/<slug>`, `Landing.tsx` replaces `App.tsx`, and `src/presentations/index.ts` is the explicit registry.
- The stable `data-presentation-*` hooks (step count/index, active state with semantic current state, attribution, mode, allow-overlap) are implemented and documented in one place so tooling can rely on them.
- With the dev server on `127.0.0.1`, a throwaway or test-only presentation rendered through the kit (not committed to the registry) is inspected with `chrome-devtools-axi` (snapshot plus a screenshot) to confirm that the chrome, navigation, and fit scaling work; the throwaway is removed before finishing.
