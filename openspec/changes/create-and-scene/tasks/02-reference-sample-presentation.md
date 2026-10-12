# Task: Reference sample presentation "How to Use This Skill to Make a Presentation"

## Goal
Build and register the committed, self-referential nine-step sample presentation as one continuously evolving scene on the existing scene kit. It is the known-good example of the skill's output, the target of the production verification gate, and the model for what the skill generates.

## Background
The scene kit already exists in `src/presentation-kit/` (`Presentation`, `Stage`, chrome, nav, and the generic node primitives `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`), along with `src/main.tsx` (pathname router), `src/Landing.tsx`, and the explicit registry `src/presentations/index.ts`. Read `src/presentation-kit/README.md` and the kit sources for the exact prop names and `data-*` hooks before writing steps. Do not modify the kit's behavior for this task except for a genuine bug fix; if you must, add a failing kit test first. The kit is style-neutral: every color, font, border, shadow, spacing, and control treatment for this sample lives in presentation-local plain CSS in the sample's own folder (no Tailwind or other framework).

Layout to create (from `design.md`):

```
src/presentations/
  index.ts                           # add ONE registry line for the sample (explicit array, not import.meta.glob)
  how-to-make-a-presentation/        # slug: how-to-make-a-presentation
    entities.ts                      # this presentation's layoutId namespace (stable entity ids)
    steps/*.tsx                      # 9 Step objects composing kit primitives
    Talk.tsx                         # <Presentation steps={STEPS} title=… initialMode="browse" />
    <presentation-local>.css         # plain CSS owned by this presentation
```

The registry entry is `{ slug: 'how-to-make-a-presentation', title: 'How to Use This Skill to Make a Presentation', load: () => import('./how-to-make-a-presentation/Talk') }`. The entry component is named `Talk.tsx`; "presentation" is the canonical term everywhere else (the filename is incidental).

Key design constraints:
- One scene, not nine slides. Steps 1 to 9 share a scene group (`groupKey` + the same `Scene` component with a typed payload) so the scene instance persists and only the payload changes. Entities accumulate and are never rearranged or redrawn; every entity keeps one stable id from `entities.ts` across all steps where it appears, so persisting entities morph via `layoutId` and newcomers enter after continuing motion settles (`Appear`). Continuing entities must not be wrapped in newcomer fade-in. Entities that leave (for example a transient chip) animate out. Intentional stacking or overlap in the composition (e.g. the reveal frame around everything) must stay readable and be marked with the kit's allow-overlap hook (`data-presentation-allow-overlap`) only where truly intentional.
- Per-step visual design (exact shapes, coordinates in the 880 × 380 canvas, ids, colors, motion timing) is yours to settle. The titles, captions, eras, and scene intent in the spec table are normative and must be reproduced verbatim, in order. Use literal per-step coordinates through `SceneLayer` / raw `motion` elements with stable `layoutId`s where primitives are not the right shape.
- Step 3's tray cards each show title, caption, and visual parts; what morphs is drawn on the link between consecutive cards, not inside them. Step 6's scene-kit socket plugs into the bottom edge of the assembled tray (the tray is not framed). Step 7's verify node is chained after the step cards in the same tray row and resolves to a green pass check. Step 9's outer frame draws around the whole diagram with a label that makes the self-reference clear.
- Presentation-local CSS must make the active progress dot and active TOC entry visibly distinct, make the bottom-right attribution (`data-presentation-attribution`) legible (not browser-default, not tiny), and keep important content from colliding with the caption, progress dots, TOC, and prev/next controls, at wide desktop and at a narrow viewport. Chrome hooks to style are `data-presentation-*` and `aria-current="step"`.
- Eras for the table of contents: the ask (steps 1 to 2), the gathering (3 to 5), the build (6 to 7), the loop (8), the reveal (9).
- Opens in browse mode (`initialMode="browse"`).
- Use `127.0.0.1` for local browser work. Do not commit build output or screenshots.

Use TDD: add a failing contract test first (below), then build the steps.

## Spec
(Capability: `presentation-verification`.) The requirement below is the normative definition of the sample. In this task you own its content and registration; the verification script asserts the "Sample exists" and "Missing sample fails" scenarios, so here satisfy them by making the sample exist, be registered/reachable, and match exactly.

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


### Related kit requirements the sample must honor
(Capability: `evolving-scene-presentations`; the sample is a consumer of these requirements. Copied verbatim.)

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
No `INT-*` or `E2E-*` obligation is first executable in this task (the verification gate that runs `E2E-001` against this sample is delivered separately). Add Vitest contract tests so the sample is verified at implementation time:
- A registry/content test asserting `how-to-make-a-presentation` is registered, resolves via the pathname routing function, has exactly nine steps, and that every step's era, present title, and browse caption equal the normative table values in order.
- A rendering test (jsdom, via the kit's `Presentation`) that walks all nine steps with `ArrowRight`, asserts `data-step-index` advances 0 through 8, `data-step-count` is 9, clamps at the end, and that no `console.error` is emitted.
- A test that every entity id used across steps is declared in `entities.ts` and that entities named in the spec table (you, prompt, skill, question chip, step-card, ghost card, scene-kit, verify, modify, outer frame) appear in their specified steps.

## Done When
- The nine steps match the spec table's titles, captions, eras, and scene intent, in order, with no manual step numbering.
- The sample is registered with one explicit line in `src/presentations/index.ts`, reachable at `/how-to-make-a-presentation`, and listed on the Landing page.
- All sample styling is presentation-local plain CSS; nothing under `src/presentation-kit/` changed to carry visual styling.
- The tests above pass along with `npm test`, `npm run lint`, and `npm run build`.
- Using `chrome-devtools-axi` against `npm run preview` on `127.0.0.1`, you inspected the first step, the last step, the dense steps (3 to 7), and a narrow viewport, and fixed accidental collisions with chrome, indistinct active TOC/progress state, and unpolished attribution.
