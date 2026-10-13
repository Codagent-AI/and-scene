# Task: Scene kit and presentation host app

## Goal
Build the reusable, style-neutral scene kit in `src/presentation-kit/` plus the host app plumbing (router, explicit registry, landing page, Vitest) that mounts presentations, so any presentation can be authored as `<Presentation steps=… />` and navigated in present and browse modes.

## Background
You MUST read these before editing (all under `openspec/changes/create-and-scene/`):
- `design.md`: "Repository layout", "Scene kit (the engine)", "Routing + registry", "Styling", and Decisions 1–3.
- `specs/evolving-scene-presentations/spec.md`: the full runtime contract (copied below).
- `test-plan.md`: Coverage Strategy (specs are the source of unit-test requirements).
- Repo `CLAUDE.md`: workflow (TDD), commands, and change guidelines.

Current state: a plain Vite + React 19 + TypeScript scaffold with a placeholder `src/App.tsx`, `src/App.css`, `src/index.css`, and `src/main.tsx` that renders `App`. `react`, `react-dom`, `motion`, and `lucide-react` are already dependencies. There is no router, no Tailwind, no test runner.

What to build:

1. **Kit** at `src/presentation-kit/` with the files named in the design: `types.ts` (generic `Step<TPayload>`, `Scene`, `StepMeta`, `SceneProps<TPayload>`), `constants.ts` (`EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`), `usePresentationNav.ts` (→/Space/PageDown next, ←/PageUp prev, `P` toggles mode, horizontal swipe left=next / right=prev, clamp at `[0, last]`, keys not hijacked from focused interactive controls), `useFitScale.ts`, `Stage.tsx` (`LayoutGroup` + `AnimatePresence`, steps sharing a `groupKey` and Scene component are not remounted, only `payload` changes), `Presentation.tsx` (props: `steps`, `title`, optional `initialMode`; keep `StrictMode`-safe), `chrome/Header.tsx`, `chrome/Footer.tsx`, `chrome/Toc.tsx` (era-based), and `nodes/` (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`). Node primitives accept stable identity (`layoutId`) and class/data/style hooks and supply NO palette, font, spacing, border, shadow, card, button, or theme defaults. `Appear` sequences newcomers only after persisting entities settle; continuing entities are never wrapped in newcomer fade-in. `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another.
2. **Stable hooks.** The chrome root MUST expose `data-step-count` and `data-step-index` (these exact names; a headless verifier enumerates steps with them). Progress indicators and ToC entries expose semantic current-step state (`aria-current="step"` on the active item) plus a stable active hook `data-presentation-active="true"`. The attribution link exposes `data-presentation-attribution`. All other kit hooks use the `data-presentation-*` prefix (e.g. root, mode, stage, header, footer, toc, progress, per-node kind). Later tooling (a screenshot helper, skill templates) reads these names from the kit source, so keep them in one documented place (e.g. a short comment block or exported constants in `constants.ts`) and do not rename them afterwards.
3. **Attribution**: default bottom-right link text exactly `made by and-scene` pointing to the and-scene GitHub repository (use `https://github.com/Codagent-AI/and-scene`, the repository's `origin` remote, kept in one exported constant); overridable via a `Presentation` option; no default top-left brand link (the header brand slot is an opt-in prop).
4. **Host app**: replace `src/App.tsx` (delete it and `App.css` if unused) with `src/Landing.tsx` enumerating the registry; rewrite `src/main.tsx` as a zero-dependency pathname router: `"/"` → `Landing`, `"/<slug>"` → the matching registry entry loaded with `React.lazy` inside `<Suspense>`, unknown → `Landing` or a simple not-found. Create `src/presentations/index.ts` as an EXPLICIT array of `{ slug, title, load: () => import('./<dir>/Talk') }` (no `import.meta.glob`, no `react-router-dom`). Keep `StrictMode`. `src/index.css` is host CSS only; the kit contains no CSS file with visual defaults. The canonical worked presentation does not exist yet, so the registry may be empty and the landing page must render cleanly with zero entries; use test-only fixtures (not registered in the real registry) for router and registry tests.
5. **Tooling**: add Vitest (with jsdom + Testing Library or equivalent) and an `npm test` script. `npm test` is the single entry point and must run every `*.test.ts(x)` under `src/` and every test under `tests/` (use the directories `tests/integration/` and `tests/e2e/` for later suites; give the config generous per-test timeouts for subprocess/browser tests). Keep `npm run lint` and `npm run build` green; extend ESLint/tsconfig globs only as needed. Add a short note to `README.md` about the commands. Do not add CI configuration, Tailwind, or any styling framework.
6. **Keep hosts honest about types**: a grouped scene with a strongly typed payload must pass its `Step<TPayload>[]` to `<Presentation>` with no casts (cover with a type-level test or a compiled test file).

Use TDD for behavior: unit-test the step model (order-derived numbering), clamp/boundary logic and key mapping in `usePresentationNav`, swipe direction handling, `useFitScale` uniform scaling math, mode toggle preserving position, active-state semantics in chrome, attribution default/override/no top-left brand, registry/router resolution, grouped-step non-remount, and that kit source files contain no color/font/border/shadow declarations or Tailwind references.

## Spec
Copied from `specs/evolving-scene-presentations/spec.md`; this task owns all of it.

## ADDED Requirements

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
No `INT-*` or `E2E-*` obligation is first executable here. Per `test-plan.md`, scenarios in the spec above are the unit-test requirements; write focused Vitest tests for them. Use `chrome-devtools-axi` against `npm run dev` (127.0.0.1) with a throwaway local presentation to eyeball modes and fit scaling, but do not commit that throwaway presentation.

## Done When
- Every scenario above is covered by passing Vitest tests (or, for animation continuity that jsdom cannot show, by explicit structural assertions such as no-remount and absence of newcomer wrappers on continuing entities).
- `npm test`, `npm run lint`, and `npm run build` pass.
- `src/presentation-kit/` matches the design's file layout, exposes `data-step-count`, `data-step-index`, `aria-current="step"`, `data-presentation-active`, and `data-presentation-attribution`, and contains no visual defaults or styling-framework dependency.
- `src/main.tsx` routes `/` and `/<slug>` via the explicit registry in `src/presentations/index.ts`; `src/Landing.tsx` replaces `App.tsx`.
- Work is committed in logical commits with `type: lowercase description` messages; no build output or dependency directories are committed.
