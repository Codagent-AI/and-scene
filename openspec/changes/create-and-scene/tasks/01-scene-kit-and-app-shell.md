# Task: Scene kit and app shell

## Goal
Deliver the reusable, style-neutral evolving-scene engine at `src/presentation-kit/` plus the app shell (pathname router, explicit presentation registry, landing page) it runs in, with the unit/contract test tooling (`npm test`) that the rest of the change relies on. This is the foundation every generated presentation imports.

## Background
Repository today: a Vite + React 19 + TypeScript scaffold with `src/App.tsx`, `src/App.css`, `src/index.css`, `src/main.tsx`; `react`, `react-dom`, `motion`, and `lucide-react` are already dependencies. There is no router, no Tailwind, no test runner. `package.json` scripts today: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`. Project rules (from `CLAUDE.md`): no CI config, don't commit build output/`node_modules`/screenshots, use `127.0.0.1` for local browser automation, expose stable `data-presentation-*` hooks, commit messages are `type: lowercase description`.

Design decisions to follow (see `design.md` "Repository layout", "Scene kit", "Routing + registry", "Styling", Decisions 1–3):

- Kit layout under `src/presentation-kit/`: `types.ts` (`Step`, `Scene`, `StepMeta`, `SceneProps`; generic `Step<TPayload>` / `SceneProps<TPayload>` so typed grouped payloads reach `<Presentation>` without casts), `constants.ts` (`EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`), `usePresentationNav.ts` (keyboard `→`/Space/PageDown next, `←`/PageUp prev, `P` toggles mode, horizontal swipe left = next / right = prev, clamp at `[0, last]`, keys must not hijack focused interactive controls), `useFitScale.ts` (uniform fit scaling for the active mode's stage geometry; scale constant within a mode), `Stage.tsx` (`LayoutGroup` + `AnimatePresence` host for the active step's Scene; steps sharing a `groupKey` and `Scene` do not remount — only `payload` changes), `Presentation.tsx` (composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`), `chrome/Header.tsx`, `chrome/Footer.tsx`, `chrome/Toc.tsx`, and `nodes/` (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`).
- Present mode: marker + one-line title only (caption, ToC, prev/next hidden). Browse mode: title, multi-line caption, ToC on wide viewports (era-based), prev/next, progress dots. Step numbers derive from position. A presentation may declare `initialMode`.
- Fixed names the specs/design require — copy verbatim, do not rename: the chrome exposes `data-step-count` and `data-step-index` test hooks (used by headless drivers to enumerate/advance steps); the kit uses the `data-presentation-*` hook family; progress indicators and ToC entries expose `aria-current` semantics for the active step plus a stable active-state hook; the attribution link text is exactly `made by and-scene`, bottom-right, linking to the and-scene GitHub repository, with its own stable `data-presentation-*` hook; there is no default top-left and-scene brand link (host opt-in only). The design does not fix the exact attribute names for the active-state hook, the attribution hook, or an allow-overlap marker; choose clear `data-presentation-*` names (e.g. `data-presentation-active`, `data-presentation-attribution`, `data-presentation-allow-overlap`), document them in a short comment/README in the kit, and keep them stable — later tooling (inspection helper, skill docs) will depend on them.
- Style neutrality is a hard contract: the kit ships zero colors, fonts, borders, shadows, card/button treatments, spacing scale, CSS theme tokens, or styling-framework dependency. Layout geometry (canvas size, absolute positioning, chrome placement) is allowed; visual style is not. Node primitives accept stable identity (`layoutId`) and `className`/`style`/`data-*` hooks. Coordinate-heavy authors may use raw `motion` elements with stable `layoutId`s.
- Persisting entities morph via `layoutId` without newcomer fade wrappers; `Appear` sequences newcomers only after persisting entities settle (use `ENTER_DELAY`); departing entities exit via `AnimatePresence`; `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another. Keep `StrictMode` and watch for effect/animation double-fire.
- App shell: `src/main.tsx` becomes a zero-dependency pathname router — `"/"` → `Landing`; `"/<slug>"` → matching registry entry, `React.lazy` inside `<Suspense>`; unknown → `Landing` (or a simple not-found). `src/presentations/index.ts` is an explicit array `[{ slug, title, load: () => import('./<dir>/Talk') }]` (no `import.meta.glob`, no `react-router-dom`). `src/Landing.tsx` replaces `src/App.tsx` (remove `App.tsx`/`App.css` if unused) and enumerates the registry. `src/index.css` is host-only CSS. The registry may start empty or contain a minimal placeholder presentation to exercise the router; a later piece of work supplies the real sample. Export a small pure helper for slug → entry lookup so it is unit-testable.
- Test tooling: add Vitest (and a DOM environment plus React Testing Library if useful) with an `npm test` script (`vitest run`). Ensure `tsc -b`, `npm run lint`, and `npm run build` still pass with test files present. Per project workflow use TDD: write the focused failing test first.
- The scaffold templates under `skills/presentation/templates/bootstrap/` will later be kept byte-aligned with `src/presentation-kit/`; keep the kit self-contained (relative imports only, depends only on `react`, `react-dom`, `motion`, `lucide-react`) so it can be copied verbatim.

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

## Test Plan
No `INT-*` or `E2E-*` obligations are assigned to this piece of work (the test plan's AT-003 is an acceptance exploration performed later, not by the implementor). Unit and contract coverage is an implementation-time decision, driven by the scenarios above. At minimum cover with Vitest: navigation clamping at both ends and key/swipe mapping (including not hijacking focused controls); order-derived step numbering; fit-scale math (uniform scale, default 880 × 380); registry lookup / router resolution (known slug, unknown, `/`); present/browse chrome contents and mode toggle preserving step index; `aria-current` + active hook on progress/ToC and direct jump behavior (including ToC → first step of that era); default attribution text/href/hook and absence of a default top-left brand; a type-level test that a typed-payload `Step<T>[]` is accepted by `<Presentation>` without casts; and a style-neutrality contract test that scans `src/presentation-kit/**` for forbidden visual defaults (no CSS files with colors/fonts, no inline color/font/border/shadow declarations, no `tailwind` dependency or import).

## Done When
- Every scenario above is satisfied by the kit and covered by passing automated tests where practical.
- `src/presentation-kit/` exists with the layout above; `src/main.tsx` routes `/` and `/<slug>`; `src/presentations/index.ts` is an explicit registry; `src/Landing.tsx` lists registry entries and `App.tsx` is gone.
- Chrome exposes `data-step-count` / `data-step-index`; active nav exposes `aria-current` and a documented stable active hook; attribution and allow-overlap hooks are documented.
- `npm test`, `npm run lint`, and `npm run build` all pass; no Tailwind or visual defaults exist in the kit; no build output or `node_modules` is committed.
- Changes are committed with `type: lowercase description` messages.
