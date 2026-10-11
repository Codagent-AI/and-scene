# Task: "How to Use This Skill to Make a Presentation" reference sample

## Goal
Build and commit the self-referential nine-step reference presentation, registered at `/how-to-make-a-presentation`, as the known-good example of one continuously evolving scene. It proves the kit's morphs, grouped persistence, modes, and chrome in a real browser and is the target of verification and inspection tooling.

## Background
Paths and conventions (from `design.md`):

- `src/presentations/how-to-make-a-presentation/entities.ts`: this presentation's `layoutId` namespace (stable entity ids).
- `src/presentations/how-to-make-a-presentation/steps/*.tsx`: nine `Step` objects composing kit primitives from `src/presentation-kit/` (`Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`, and raw `motion` elements with stable `layoutId`s where coordinates are literal).
- `src/presentations/how-to-make-a-presentation/Talk.tsx`: `<Presentation steps={STEPS} title="…" initialMode="browse" />` (`Talk.tsx` is just the entry file name).
- Presentation-owned plain CSS (for example `presentation.css` in the same folder, imported by `Talk.tsx`) supplies every color, font, spacing, border, shadow, and control treatment, including a visibly distinct active progress/ToC state and a legible, intentional `made by and-scene` attribution via the kit's hooks. The kit (`src/presentation-kit/`) must stay style-neutral; do not add styling to it. Do not introduce Tailwind.
- Register it with one explicit line in `src/presentations/index.ts`: `{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }`.
- The kit, router (`main.tsx`), `Landing.tsx`, and `npm test` already exist (scene kit with `Step`/`SceneProps` types, grouped steps via `groupKey`, `Presentation`, nav, chrome, `data-step-count`/`data-step-index` hooks). Read the kit's source and its documented hook names before writing steps. If you find a genuine kit bug while building the sample, fix it in the kit with a failing test first.
- Per-step visual design (exact shapes, coordinates, `layoutId` namespace, colors, motion timing) is yours to settle; the steps, titles, captions, eras, and scene intent below are normative. The whole sample is one scene: steps share a `groupKey` and scene component so the scene persists, entities only accumulate (never rearranged or redrawn), the conversation row (you ↔ skill) anchors the top, the tray accumulates below, and later beats draw connections and a final frame around what is already on screen. Use `SceneLayer` positioning so mounting one layer never reflows another. Everything must fit the 880 × 380 canvas, with no unintended text overlap and no collision with chrome (caption, progress dots, ToC, nav controls, attribution). Any deliberate overlap must be wrapped in the kit's allow-overlap marker and remain readable.
- Eras for the ToC: the ask (1–2), the gathering (3–5), the build (6–7), the loop (8), the reveal (9).
- The skill that will later document and template this layout does not exist yet; use exactly the folder layout above so that the skill's presentation templates can mirror it, and keep the sample's structure conventional (no sample-only special cases in the kit).
- Use TDD for testable behavior: a contract test that imports the sample steps and asserts nine steps in order with the exact normative eras, titles, and captions (the same strings verification will later check), stable unique step ids, shared group, and that the registry contains the sample entry. Visual composition is inspected in the browser rather than unit tested.
- Use `127.0.0.1` for local browser automation. Do not commit build output or screenshots. Do not add CI configuration.

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

Shared scenario portions from the scene-model spec that this sample must demonstrate (the kit implements the mechanism; this task's portion is that the sample's steps actually compose the scene so these hold in the browser):

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

## Done When
- A contract test passes asserting the sample is registered at slug `how-to-make-a-presentation` and implements the nine steps with the exact era, title, and caption text from the table, in order, in one shared scene group.
- Every step's scene content matches the table's "Scene content" column, and entities accumulate without being rearranged or redrawn.
- `npm test`, `npm run lint`, and `npm run build` pass.
- Using `chrome-devtools-axi` against the dev or preview server on `127.0.0.1` (`snapshot`, then screenshots), inspect at least: step 1, step 9, and the densest steps (5–8), in both browse and present modes, plus a narrow viewport pass over a first, a dense, and the last step. Confirm: persisting entities morph in place, newcomers enter after continuing motion settles, nothing collides with chrome, the active progress/ToC entry is visibly distinct, the attribution is legible and linked, and the browser console has no errors across all nine steps. Fix what the inspection reveals.
- All visual styling lives in the presentation folder (or host CSS), none in `src/presentation-kit/`.
