# Task: Scene kit, routing shell, and unit-test harness

## Goal
Replace the placeholder Vite app with the reusable, style-neutral scene kit
(`src/presentation-kit/`), a pathname router, an explicit presentation registry,
and a Landing page, so any presentation can be written as `entities.ts` +
`steps/*` + `Talk.tsx` and rendered as one evolving scene. This is the
foundation every presentation, the verification scripts, and the skill templates
build on.

## Background
You MUST read:
- `openspec/changes/create-and-scene/design.md` (Repository layout, Scene kit, Routing + registry, Styling, Decisions 1–3 and 7)
- `openspec/changes/create-and-scene/proposal.md` (terminology: "presentation" is canonical; `Talk.tsx` is only a filename)
- `openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md` (copied below)

Repository state: Vite 8 + React 19 + TypeScript app; `src/main.tsx`, `src/App.tsx`,
`src/App.css`, `src/index.css` are the stock scaffold. `react`, `react-dom`, `motion`,
`lucide-react` are already dependencies. There is no router, no Tailwind, and no
test runner yet. Read `CLAUDE.md`/`AGENTS.md` for repo rules (use `127.0.0.1` for
browser automation; no CI config; do not commit build output).

What to build (paths are fixed by the design):
- `src/presentation-kit/types.ts`: generic `Step<TPayload>`, `Scene`, `StepMeta`, `SceneProps<TPayload>`. A step has a stable id, an era/section label, a presenter title, a browse caption, a `Scene` component, an optional `groupKey`, and a payload. Typed payload arrays must flow through `<Presentation>` with no casts. Step numbers are derived from array position.
- `src/presentation-kit/constants.ts`: `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
- `src/presentation-kit/usePresentationNav.ts`: keyboard (`→`/Space/PageDown next, `←`/PageUp prev, `P` toggles mode), horizontal touch swipe (left = next, right = prev), mode state, `next`/`prev`/`goTo` clamped to `[0, last]`; navigation keys must not hijack focused interactive controls. Keep the pure logic (clamping, key mapping, swipe interpretation) in functions that can be unit-tested without a browser.
- `src/presentation-kit/useFitScale.ts`: uniform fit scaling of the 880×380 canvas to the gap between header and footer for the active mode's stage geometry; scale is constant within a mode.
- `src/presentation-kit/Stage.tsx`: `LayoutGroup` + `AnimatePresence` host. Steps sharing a `groupKey` (and the same `Scene`) must NOT remount — the instance persists and only the payload changes; otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph. Switching modes is a re-render, not a morph.
- `src/presentation-kit/Presentation.tsx`: composes Stage + chrome + nav from `steps[]` + `{ initialMode, title }` (plus optional attribution/brand overrides).
- `src/presentation-kit/chrome/{Header,Footer,Toc}.tsx`: present mode shows marker + one-line title only (caption, ToC, prev/next hidden); browse mode shows title, multi-line caption, ToC (wide viewports only, era-based), progress dots, prev/next. Progress dots and ToC entries jump directly (ToC entry → first step of that era). Default bottom-right attribution link reading "made by and-scene" pointing at the and-scene GitHub repository; no default top-left brand (host opt-in via a prop/slot).
- `src/presentation-kit/nodes/{Box,Label,Arrow,Frame,Emphasis,SymbolChip,Appear,SceneLayer}.tsx`: generic, topic-agnostic primitives. Each accepts a stable identity (used as `layoutId`) and `className`/`data-*`/`style` hooks and supplies NO palette, font, spacing, border, shadow, card, button, or theme defaults (only geometry/behavior such as absolute positioning). `Box` optionally renders a `LucideIcon` passed as `Icon`. `Appear` delays newcomers until persisting entities settle and must never wrap continuing entities in fade-in behavior. `SceneLayer` absolutely positions a step's diagram so mounting one layer never reflows another.
- Router/registry shell: `src/main.tsx` (pathname router: `"/"` → `Landing`, `"/<slug>"` → matching registry entry loaded with `React.lazy` inside `<Suspense>`, unknown → `Landing` or a simple not-found; keep `StrictMode`), `src/Landing.tsx` (replaces `src/App.tsx`; enumerates the registry and links each presentation; delete `App.tsx`/`App.css` and unused stock assets), `src/presentations/index.ts` (EXPLICIT array of `{ slug, title, load: () => import('./<dir>/Talk') }`, not `import.meta.glob`). The registry may be empty or hold a small kit-exercising fixture at this stage; the committed reference sample is delivered separately. `src/index.css` is host/app CSS only; the kit ships no CSS file with visual defaults and no styling-framework dependency.

Stable hooks (exact names chosen by the plan so downstream tooling can rely on them; keep them verbatim):
- Chrome root element: `data-presentation-chrome`, with `data-step-count` (total steps) and `data-step-index` (zero-based active index) on that same element, plus `data-presentation-mode="present"|"browse"`.
- Header/title/caption: `data-presentation-title`, `data-presentation-caption` (browse only).
- Progress indicators: container `data-presentation-progress`, each item `data-presentation-progress-item`; table of contents: container `data-presentation-toc`, each entry `data-presentation-toc-item`; prev/next controls `data-presentation-prev` / `data-presentation-next`.
- Active-state semantics on the active progress item and active ToC entry: `aria-current="step"` AND `data-presentation-active="true"` (inactive items do not carry either).
- Attribution link: `data-presentation-attribution`.
- Scene area / stage: `data-presentation-stage`; each node primitive carries `data-presentation-node` plus the caller's own hooks.
- Intentional-overlap marker (consumed later by the inspection helper): `data-presentation-allow-overlap` on any subtree. The kit only documents it; it does not style it.
If any of these names conflicts with a fixed name in the design or specs, keep the fixed one and record it as an open assumption.

Test harness: add Vitest (`npm test` → `vitest run`), with jsdom/Testing Library only if you need DOM tests (prefer pure-function tests; do not try to assert animation in jsdom). Keep `npm run lint` and `npm run build` green (`tsc -b && vite build`); lint must cover the new files.

Assumptions to carry: the monorepo/skill/verification work is out of scope here. Do not add Tailwind or any CSS framework.

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
No `INT-*` or `E2E-*` obligation is first executable in this task. Per
`test-plan.md` ("Coverage Strategy"), the specs are the source of unit-test
requirements: write focused Vitest tests (test first) for the isolated logic
— step-numbering derived from position, clamped next/prev/goTo, key→action
mapping (including "focused interactive control keeps its keys"), swipe
direction interpretation, fit-scale computation and default 880×380 canvas,
registry shape/slug uniqueness, router path→route resolution, grouped-step
identity (same `groupKey` + `Scene` ⇒ same scene instance), and a contract test
that the kit contains no color/font/border/shadow declarations and no
Tailwind/CSS-framework dependency. Real-browser behavior (morphs, mode toggle,
touch) is exercised by later verification and acceptance work, not by jsdom.

## Done When
- `src/presentation-kit/**`, `src/main.tsx`, `src/Landing.tsx`, and `src/presentations/index.ts` exist as described; `src/App.tsx`/`App.css` are gone.
- A throwaway or fixture presentation composed from the kit primitives builds and renders in `npm run dev`/`vite preview` on `127.0.0.1`, navigates with keyboard/swipe/dots/ToC, toggles modes preserving the step, clamps at both ends, and exposes the hooks above (confirm with `chrome-devtools-axi snapshot` and a screenshot).
- Every scenario in the Spec section is covered by a unit test or an explicit browser observation.
- `npm test`, `npm run lint`, and `npm run build` pass.
- No styling framework dependency and no visual defaults in `src/presentation-kit/`.
