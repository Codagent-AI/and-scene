# Task: Build the style-neutral scene kit, host app routing, and registry

## Goal
Deliver the reusable, topic-agnostic presentation engine (`src/presentation-kit/`) plus the host app plumbing
(pathname router, `Landing`, explicit registry) so any presentation can be authored as `entities.ts` + `steps/*`
and rendered with `<Presentation steps={…} />`. This is the foundation every generated presentation and the
verification/inspection tooling depend on.

## Background
Read these for full context (paths relative to `openspec/changes/create-and-scene/`):
- `design.md` — "Repository layout", "Scene kit (the engine)", "Routing + registry", "Styling", Decisions 1–3 and 7, and the StrictMode risk.
- `specs/evolving-scene-presentations/spec.md` — the canonical requirements (copied below).
- `proposal.md` — terminology: "presentation" is canonical; `Talk.tsx` is just the per-presentation entry filename.

Current repo state: a Vite 8 + React 19 + TypeScript ~6 app with a placeholder plain-CSS `src/App.tsx`/`App.css`, `src/main.tsx`, `src/index.css`; `react`, `react-dom`, `motion`, `lucide-react` already installed; ESLint configured; **no test runner and no `test` npm script** (repo guidance expects `npm test` = Vitest, `npm run lint`, `npm run build`). `tsc -b` must keep passing with `tsconfig.app.json`.

Work to do (use TDD for behavior: failing focused test first, then implementation):
1. **Test infrastructure**: add Vitest (plus a DOM environment/testing library only if needed) and an `npm test` script (`vitest run`). Keep lint and `tsc -b` green for test files.
2. **Kit** in `src/presentation-kit/` with exactly this layout (file names fixed by the design):
   - `types.ts` — `Step`, `Scene`, `StepMeta`, `SceneProps`. `Step<TPayload>` / `SceneProps<TPayload>` are generic so grouped, strongly typed payloads pass through `<Presentation>` without casts. A step carries: stable id, section/era label, presenter title (one-liner), browse caption (paragraph), a scene component, optional `groupKey` and `payload`.
   - `constants.ts` — `EASE`, `LAYOUT_T`, `ENTER_T`/`ENTER_DELAY`, `DESIGN_W=880`, `DESIGN_H=380`, `MIN_SCALE`, `STAGE_LAYOUT { browse, present }`.
   - `usePresentationNav.ts` — keyboard (`→`/`Space`/`PageDown` next, `←`/`PageUp` prev, `P` toggles mode), horizontal touch swipe (left = next, right = prev), mode state, `next`/`prev` clamped to `[0, last]`, `goTo(index)`. Keys must not hijack focused interactive controls (buttons, links, inputs, etc.). Extract pure logic (clamping, key→action mapping, swipe classification, era→first-step lookup, order-derived numbering) so it is unit-testable.
   - `useFitScale.ts` — uniform fit scaling of the 880×380 canvas into the gap between header and footer for the active mode's `STAGE_LAYOUT`; constant within a mode; resize-aware. Pure scale computation should be a separately testable function.
   - `Stage.tsx` — `LayoutGroup` + `AnimatePresence` host for the active step's Scene. Steps sharing a `groupKey` (and the same Scene component) must **not** remount: the instance persists and only `payload` changes. Otherwise `AnimatePresence` cross-fades and shared `layoutId` elements morph. Switching modes is a re-render, not a morph.
   - `Presentation.tsx` — composes Stage + chrome + nav from `steps[]` and `{ initialMode, title }`; optional attribution override options; `initialMode` defaults sensibly.
   - `chrome/Header.tsx` (marker row; title in browse mode; **no** default and-scene brand link, host may supply its own brand), `chrome/Footer.tsx` (caption in browse / title in present, progress dots, prev/next, and the default bottom-right attribution), `chrome/Toc.tsx` (era-based table of contents, browse mode, wide viewports only).
   - `nodes/` — `Box.tsx` (optional `LucideIcon` glyph, carries `layoutId`), `Label.tsx`, `Arrow.tsx`, `Frame.tsx`, `Emphasis.tsx`, `SymbolChip.tsx`, `Appear.tsx` (sequences newcomers only after persisting entities settle; never wraps continuing entities in fade-in), `SceneLayer.tsx` (absolutely positions a step's diagram so mounting one layer never reflows another). Each primitive accepts a stable identity plus `className`/`data-*`/`style` hooks and supplies **no** palette, font, spacing, border, shadow, card, button or theme defaults.
   - Keep `StrictMode`; watch for effect/animation double-fire.
3. **Stable DOM hooks** (the `data-presentation-*` family is required by repo guidance; names below are fixed by this plan so downstream tooling can rely on them — document them in `src/presentation-kit/README.md`):
   - `data-step-count` and `data-step-index` on the chrome root (fixed by the design; the step index is zero-based and updates once the step is active).
   - `data-presentation-attribution` on the attribution link.
   - `data-presentation-allow-overlap` — a marker authors place on a subtree to exempt it from overlap diagnostics (kit exposes it as a documented, passable attribute only; it has no behavior in the kit).
   - Progress-indicator and ToC items: `data-presentation-progress-item` / `data-presentation-toc-item`, with `aria-current="step"` (progress) / `aria-current="true"` (ToC) and `data-presentation-active="true"` on the active item only.
   - Also expose hooks for the mode (`data-presentation-mode="present|browse"` on the root), header, footer, caption, title, stage/canvas, and per-primitive hooks (e.g. `data-presentation-node`) so presentation CSS has stable selectors.
4. **Attribution**: default bottom-right link text exactly `made by and-scene`, linking to the and-scene GitHub repository at `https://github.com/Codagent-AI/and-scene` (the repository's `origin` remote; neither `package.json` nor `README.md` carries a URL). Export the URL as a named constant, make the attribution overridable, and expose the hook above.
5. **Host app**: replace the placeholder `src/App.tsx`/`App.css` with `src/Landing.tsx`; rewrite `src/main.tsx` as a zero-dependency pathname router (`"/"` → `Landing`; `"/<slug>"` → the matching registry entry loaded with `React.lazy` inside `<Suspense>`; unknown → `Landing` or a simple not-found). Create `src/presentations/index.ts` as the **explicit** registry array of `{ slug, title, load: () => import('./<dir>/Talk') }` (no `import.meta.glob`, no router dependency). `src/index.css` holds host/app CSS only. The registry must be importable by Node-side tooling/tests without pulling in React (keep slug/title metadata statically readable) — keep the registry shape exactly as above. It may be empty or contain a minimal throwaway fixture only if it is removed before finishing; the real sample is added separately.
6. **Style neutrality is a contract**: no Tailwind, no CSS files inside `src/presentation-kit/` that set colors/fonts/borders/shadows, no inline default visual styles. Only layout geometry (fixed canvas, absolute positioning, scale transform) may be set by the kit. Add an automated check (unit/contract test) that scans `src/presentation-kit/` for forbidden visual defaults and styling-framework imports.
7. Because `src/presentation-kit/` is later vendored byte-for-byte into a bootstrap template, avoid imports from outside the kit directory other than `react`, `react-dom`, `motion`, `lucide-react`, and keep any kit unit tests in a location that is easy to exclude from the template (e.g. `*.test.ts(x)` next to sources).

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
No `INT-*` or `E2E-*` obligation is first executable in this task. Unit/contract tests (implementer's choice of cases, driven by the scenarios above) must cover at least: clamping and key mapping in the nav logic, swipe direction, focused-control key exemption, order-derived numbering and era→first-step lookup, fit-scale computation and default 880×380 canvas, same-`groupKey` persistence (scene instance not remounted, payload changes), typed-payload `<Presentation>` boundary (a type-level test or compile-checked fixture without casts), attribution default text, link target (`https://github.com/Codagent-AI/and-scene`), and hook and absence of a top-left brand, active-state semantics (`aria-current`, `data-presentation-active`) for progress and ToC items, present/browse chrome visibility and mode toggle preserving the step, direct jump via progress/ToC (ToC → first step of the era), and the style-neutrality scan. Router behavior (`/`, `/<slug>`, unknown) and the registry shape also get focused tests.

## Done When
- Every scenario above is covered by passing automated tests or by a compile-time check where that is the natural mechanism.
- `npm test`, `npm run lint`, and `npm run build` all pass.
- `src/presentation-kit/` contains the files listed above with the documented `data-presentation-*` hooks, `data-step-count`/`data-step-index`, and `src/presentation-kit/README.md` documents the hooks, constants, and the style-neutral contract.
- `src/App.tsx`/`App.css` are replaced by `Landing.tsx`; `main.tsx` routes `/` and `/<slug>`; `src/presentations/index.ts` exists with the explicit registry shape.
- A throwaway local smoke check (e.g. via `npm run dev` and `chrome-devtools-axi snapshot` on `http://127.0.0.1:5173/`) shows the app renders with no console errors; no generated build output, screenshots, or dependency directories are committed.
