# Task: Committed reference presentation "How to Use This Skill to Make a Presentation"

## Goal
Author the committed, self-referential nine-step sample presentation using the
scene kit, register it, and give it a designed, presentation-owned look. It is
the known-good example for the skill and the subject of build/render
verification and inspection, so it must be visually coherent and genuinely
exercise grouped scenes, morphs, entering and departing entities.

## Background
You MUST read:
- `openspec/changes/create-and-scene/design.md` (Repository layout → `presentations/how-to-make-a-presentation/`, Scene kit, Styling, Decisions 1, 2, 7)
- `openspec/changes/create-and-scene/specs/presentation-verification/spec.md` (requirement "Committed reference sample", copied below)
- `openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md` (requirements copied below)
- `openspec/changes/create-and-scene/test-plan.md` (AT-003 describes how this presentation is later judged: continuity, modes, narrow viewport, attribution; use it as a quality target)

Assumes the scene kit already exists in `src/presentation-kit/` (types `Step`/`SceneProps`, `Presentation`, node primitives `Box/Label/Arrow/Frame/Emphasis/SymbolChip/Appear/SceneLayer`, chrome, `usePresentationNav`) and `src/main.tsx` + `src/presentations/index.ts` + `src/Landing.tsx` provide routing. Read those files first and use their actual exports; if a primitive is genuinely unsuitable, use raw `motion` elements with stable `layoutId`s as the spec allows. Do NOT modify the kit's behavior or add styling to it; if you find a kit bug, make the smallest fix and keep a note in your final report.

Deliverables (paths fixed by the design):
- `src/presentations/how-to-make-a-presentation/entities.ts`: this presentation's `layoutId` namespace — stable entity ids (you, prompt, skill, question chip, conversation arrow, tray, step cards, ghost card, partial↔full control, scene-kit socket, verify node + pass check, modify arc, edited-card flag, reveal frame, ...).
- `src/presentations/how-to-make-a-presentation/steps/*.tsx`: nine `Step` objects, in the order and with the exact era labels, present titles, and browse captions in the table below (copy strings verbatim, including punctuation and quotes as shown without the surrounding table quotes). Group consecutive beats that are successive states of the same diagram under a shared `groupKey`/`Scene` so the scene persists and entities morph; because the sample is one continuously evolving scene, entities accumulate and are never rearranged or redrawn.
- `src/presentations/how-to-make-a-presentation/Talk.tsx`: `<Presentation steps={STEPS} title="…" initialMode="browse" />` (default export so the registry's `load: () => import('./how-to-make-a-presentation/Talk')` works).
- `src/presentations/how-to-make-a-presentation/*.css` (plain CSS, presentation-owned) giving the presentation a deliberate visual design — palette, typography, spacing, borders — and explicit styling for every kit hook that matters: visibly distinct active progress dot and active ToC entry (target `[data-presentation-active="true"]` / `[aria-current="step"]`), legible bottom-right attribution (`[data-presentation-attribution]`: adequate size, contrast, non-browser-default styling), caption, prev/next controls. Import it from `Talk.tsx`. Any host-level brand in the top-left is optional.
- One registry line in `src/presentations/index.ts`: `{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }`.

Design guidance: use the 880×380 canvas; keep important content inside it and clear of the chrome (captions, dots, ToC, nav) in both browse and present modes; where entities intentionally overlap (e.g. the reveal frame around the diagram, the modify arc crossing the conversation row, the tray socket), keep text readable and mark such subtrees with `data-presentation-allow-overlap` so the inspection helper's overlap warnings stay meaningful. Nothing visible should depend on a viewport wider than the canvas scaling; check a narrow viewport (e.g. 390×844) as well as wide (1440×900).

Visual verification (required by `CLAUDE.md`): use `chrome-devtools-axi` against `vite preview` (or dev server) on `127.0.0.1` — `snapshot`, then screenshots of step 1, step 9, and dense steps (3–8), wide and narrow. Step through all nine with the keyboard and watch that you/skill/tray cards persist and morph, newcomers enter after persisting entities settle, and departing entities exit. Do not commit screenshots.

## Spec
### Requirement: Committed reference sample
A generated sample presentation SHALL be committed in the repository as a known-good example, registered and reachable like any other presentation.

The sample is the self-referential talk **"How to Use This Skill to Make a Presentation"** — a presentation, built by the skill, about building presentations with the skill. Its closing beat reveals that the viewer is looking at an example of the skill's own output. The sample SHALL implement the following steps (titles, captions, and scene intent are normative; the per-step visual design is deferred to design):

The sample is one continuously evolving scene: a conversation row (**you** ↔ **skill**) anchors the top, a tray of step cards accumulates below it, and later beats draw connections and a final reveal frame around what is already on screen. Entities accumulate; they are never rearranged or redrawn.

| # | Era | Title (present) | Caption (browse) | Scene content |
|---|-----|-----------------|------------------|---------------|
| 1 | the ask | "You have a topic" | It starts with you, a topic, and mild overconfidence. | A **you** entity and a **prompt** bubble appear. |
| 2 | the ask | "The skill interviews you" | One question at a time: the topic, the look, then each beat of the story. | A **skill** node appears; a two-way arrow connects you↔skill with a **question chip** above it. |
| 3 | the gathering | "Answers become steps" | Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next. | A tray appears under the conversation; the first **step-card** lands in it, showing the parts every step carries (title, caption, visual). What morphs is drawn on the link between consecutive cards, not inside them. |
| 4 | the gathering | "The deck grows" | Same shapes, new beats. Every answer extends the story without redrawing it. | More step-cards land in the tray; everything already on screen stays put. |
| 5 | the gathering | "You set the depth" | Spell out every step, or sketch a few and see how it looks. You hold the gate. | A dashed **ghost card** marks unspecified steps; a partial↔full control docks on **you**. |
| 6 | the build | "It assembles the scene" | Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph. | The **scene-kit** socket plugs into the bottom edge of the assembled tray of step cards (the tray is not framed); its label names the shared kit the scene is drawn with. |
| 7 | the build | "It checks its own work" | Before saying done, it builds and renders every step — and fixes what breaks. | A **verify** node is chained after the step cards in the same tray row (verification is part of the skill's own pipeline); build + render checks resolve to a green pass check on it. |
| 8 | the loop | "Changed your mind? Loop it." | Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch. | A **modify** arc reaches from the conversation down into the route; the edited card is flagged. |
| 9 | the reveal | "You're looking at one" | This presentation was built exactly this way. Thanks for watching. | An outer frame draws around the whole diagram, labeled — self-reference reveal. |

<!-- deferred-to-design: per-step visual design — exact entity shapes, layout coordinates, layoutId namespace, colors, and motion timing — is settled in the design stage. The steps, titles, captions, and scene intent above are fixed. -->

#### Scenario: Sample exists and matches the outline
- **WHEN** verification runs
- **THEN** it confirms the committed reference sample presentation exists, is registered/reachable, and implements the nine steps above in order

#### Scenario: Missing sample fails
- **WHEN** the reference sample is absent
- **THEN** verification fails


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


## Test Plan
No `INT-*` or `E2E-*` obligation is first executable in this task: end-to-end
production verification of this sample (E2E-001, E2E-002) is delivered with the
verification scripts. Write test-first Vitest contract tests for this task's
deterministic parts, e.g. the registry contains slug `how-to-make-a-presentation`;
the sample has exactly nine steps with the normative era/title/caption strings in
order (a shared constant or fixture of the normative table is fine); entity ids
in `entities.ts` are unique; consecutive steps that must persist share the same
`groupKey` and `Scene`; and the sample's CSS lives under
`src/presentations/` (nothing added under `src/presentation-kit/`).

## Done When
- The sample requirement's content is satisfied: it exists, is registered and reachable, and implements the nine steps with titles, captions, eras, and scene intent matching the table exactly and in order. The two "Sample exists…" / "Missing sample fails" scenarios describe what the verification command checks; the command itself is not part of this task's completion criteria — satisfy their preconditions (sample present, registered, normative strings in order) and cover them with the contract tests above.
- The copied evolving-scene scenarios hold for the sample itself (grouped steps update in place, persisting entities morph, newcomers enter after others settle, departing entities exit, no default styling added to the kit), confirmed by browser observation.
- The sample is registered and loads at `/how-to-make-a-presentation` in a production preview on `127.0.0.1` with no console errors across all nine steps.
- AXI snapshots/screenshots (wide and narrow; first, last, dense steps) show content fitting the canvas, no accidental text/chrome collisions, distinct active chrome, and legible attribution.
- `npm test`, `npm run lint`, and `npm run build` pass.
