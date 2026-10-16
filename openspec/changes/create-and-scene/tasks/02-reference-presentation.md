# Task: Build the committed reference presentation

## Goal
Deliver the self-referential sample presentation "How to Use This Skill to Make a Presentation" (slug `how-to-make-a-presentation`) as nine steps of one continuously evolving scene, registered and routable at `/how-to-make-a-presentation`. It is the known-good example the verification flow and the skill templates are built around, so its titles, captions, and order are normative.

## Background
The scene kit already exists at `src/presentation-kit/` (types, `Stage`, `Presentation`, nav, chrome, node primitives `Box/Label/Arrow/Frame/Emphasis/SymbolChip/Appear/SceneLayer`, attribution), along with the pathname router (`src/main.tsx`), `src/Landing.tsx`, and the explicit registry `src/presentations/index.ts`. Read the kit's source and tests to learn its exact API before composing steps. Do not change the kit's visual-neutrality: all styling for this sample lives in presentation-local plain CSS (e.g. `src/presentations/how-to-make-a-presentation/talk.css`, imported from `Talk.tsx`) — no Tailwind, no styling in `src/presentation-kit/`. If you find a kit bug or missing hook, make the minimal kit fix with a test, and note it in your report (the kit is also snapshotted into skill bootstrap templates and must stay byte-aligned).

The sample is composed by hand to the structure the skill's presentation templates will encode (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, local CSS, one registry line); keep that structure conventional and free of repo-specific shortcuts so the skill can mirror it. This is the initial composition; the committed sample is later finalized by running the finished presentation skill procedure against it, so leave it in a clean, regenerable state.

Required layout (from `design.md`):
```
src/presentations/
  index.ts                           # add one registry line: { slug: 'how-to-make-a-presentation', title: …, load: () => import('./how-to-make-a-presentation/Talk') }
  how-to-make-a-presentation/
    entities.ts                      # this presentation's layoutId namespace (stable entity ids)
    steps/*.tsx                      # 9 Step objects composing kit primitives
    Talk.tsx                         # <Presentation steps={STEPS} title=… initialMode="browse" />
```
The per-presentation entry component is named `Talk.tsx` (filename incidental).

Design guidance:
- One evolving scene: a conversation row (**you** ↔ **skill**) anchors the top, a tray of step cards accumulates below it, later beats draw connections, and a final reveal frame wraps what is already on screen. Entities accumulate; they are never rearranged or redrawn. Use a shared scene group (`groupKey` + the same `Scene` component with a typed payload) so the scene persists across the steps that are successive states of one diagram, ensuring `layoutId` morphs, enter-after-settle for newcomers, and exit for departing entities. Continuing entities must not be wrapped in newcomer `Appear`.
- Compose in the 880 × 380 design canvas. Per-step visual design (shapes, coordinates, `layoutId` names, colors, motion timing) is yours to settle; keep important content inside the canvas and away from chrome (captions, progress dots, ToC, nav controls, attribution). Intentional overlaps (e.g. the reveal frame around everything, the scene-kit socket on the tray edge) must stay readable; mark such subtrees with `data-presentation-allow-overlap` (the hook that visual-inspection tooling treats as an overlap exemption).
- Presentation-owned CSS must make the active progress item / active ToC entry (`aria-current="step"` / `data-presentation-active="true"`) visibly distinct and style the attribution (`data-presentation-attribution`) so it is legible and intentional (readable size and contrast, non-default link styling). Hook names are those exposed by the kit (`data-step-count`, `data-step-index`, and `data-presentation-*`); do not rename them.
- Step ids should be stable and descriptive; eras are the "Era" column below (the ask, the gathering, the build, the loop, the reveal) — the ToC groups by era.
- Add a Vitest test (TDD) that imports the registry and the sample's steps and asserts: the slug is registered; there are exactly nine steps; titles, captions, and eras match the table below exactly and in order; entity ids in `entities.ts` are unique. The later verification script will perform its own equivalent check; this unit test protects the content contract now.
- The `src/Landing.tsx` list should now show the sample.

## Spec
Copied from `specs/presentation-verification/spec.md` — the committed sample requirement and its scenarios (the sample part of verification; the verification script itself is a separate piece of work):

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

#### Scenario: Sample exists and matches the outline
- **WHEN** verification runs
- **THEN** it confirms the committed reference sample presentation exists, is registered/reachable, and implements the nine steps above in order

#### Scenario: Missing sample fails
- **WHEN** the reference sample is absent
- **THEN** verification fails

Also from `specs/evolving-scene-presentations/spec.md` — the scenarios this sample must concretely satisfy through the kit:
- Persisting entity morphs: an entity with the same identity in consecutive steps animates in place (position, size, label, emphasis).
- New entity enters after others settle; a departing entity exits on its transition.
- Grouped steps update in place: adjacent steps sharing a scene group and scene component update the existing scene instance rather than remounting.
- Continuing entities are not faded as newcomers.
- Intentional composition is preserved: intentional overlaps/stacks are kept while morphs stay clean.
- Style ownership: visual choices (color, typography, spacing, borders, shadows) come from the presentation, never from the kit.

## Done When
- `/how-to-make-a-presentation` renders all nine steps in order with the exact titles/captions/eras above; step content matches each row's scene intent; the registry contains the entry and `Landing` links to it.
- The unit test for registry presence and exact content/order passes, along with all existing tests: `npm test`, `npm run lint`, `npm run build`.
- All sample styling lives in presentation-local plain CSS; `src/presentation-kit/` still has no visual defaults (the existing style-neutrality contract test passes).
- Manually inspect with `chrome-devtools-axi` against `http://127.0.0.1:5173/how-to-make-a-presentation` (`snapshot`, then screenshots of steps 1, 5 or the densest step, 6, 9, and a narrow viewport): no accidental collisions between scene content and chrome, intentional overlaps are readable and marked with `data-presentation-allow-overlap`, active progress/ToC state is visibly distinct, attribution is legible, morphs show continuity across steps (entities persist, newcomers enter after the others move, none are redrawn), and there are no console errors while stepping through all nine steps in both modes.
