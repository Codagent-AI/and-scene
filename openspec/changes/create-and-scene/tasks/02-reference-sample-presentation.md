# Task: Reference sample presentation "How to Use This Skill to Make a Presentation"

## Goal
Build and register the committed, self-referential nine-step sample presentation on top of the existing scene kit, as the known-good example of the evolving-scene model and the artifact that verification and the skill's documentation point at.

## Background
Repository: Vite + React 19 + TypeScript; the reusable scene kit lives in `src/presentation-kit/` (style-neutral engine: `Presentation`, `Stage`, chrome, `nodes/*` primitives such as `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`; step contract in `types.ts`, constants in `constants.ts`; hook list in `src/presentation-kit/README.md`). The router in `src/main.tsx` resolves `/<slug>` through the explicit registry `src/presentations/index.ts` (`[{ slug, title, load: () => import('./<dir>/Talk') }]`). Read the kit source and README before writing the sample. Do not modify the kit's style-neutrality: all visual styling for the sample lives in presentation-local plain CSS (e.g. `src/presentations/how-to-make-a-presentation/styles.css`), imported by the sample. Do not add Tailwind.

Fixed names: slug `how-to-make-a-presentation`; folder `src/presentations/how-to-make-a-presentation/` containing `entities.ts` (this presentation's stable `layoutId` namespace), `steps/*.tsx` (nine `Step` objects composing kit primitives), and `Talk.tsx` (`<Presentation steps={STEPS} title=… initialMode="browse" />`). Register it with one line in `src/presentations/index.ts` with title "How to Use This Skill to Make a Presentation". The filename `Talk.tsx` is incidental; "presentation" is the canonical term everywhere else.

Design decisions:
- The sample is the reference fixture for the skill's conventions (the skill and its `skills/presentation/templates/presentation/` templates are authored to reproduce this folder structure and registration pattern), so keep its structure plain and conventional. The accumulate-only composition below is specific to this sample, not a rule for all presentations.
- The sample is ONE continuously evolving scene: a conversation row (**you** ↔ **skill**) anchors the top, a tray of step cards accumulates below, later beats draw connections and a final reveal frame. Entities accumulate and are never rearranged or redrawn; use shared `groupKey` + a single `Scene` component so the scene instance persists across steps and entities morph through `layoutId` projection. Do not wrap continuing entities in newcomer fade-in; use `Appear` only for entities that are new in that step.
- Per-step visual design (shapes, coordinates within the 880×380 canvas, `layoutId` names, colors, motion timing) is yours to settle; the titles, captions, eras, and scene intent in the table below are normative and must be reproduced exactly (titles and captions character-for-character, in order).
- Fill-in the sample's own look: a coherent designed treatment in presentation-owned CSS, with clearly visible active progress/ToC state (style the kit's `aria-current="step"` / `data-active="true"` hooks), a legible styled attribution (`data-presentation-attribution`), and no accidental collisions between scene content and chrome (caption, progress dots, ToC, nav controls) at desktop and narrow viewports. Mark only deliberate readable overlaps with `data-presentation-allow-overlap`.
- Export the nine step titles/captions from a plain data module (e.g. `steps/outline.ts`) so tests and tooling can import them.
- Step cards in step 3 show title/caption/visual parts; "what morphs" is drawn on the link between consecutive cards, not inside them. In step 6 the scene-kit socket plugs into the bottom edge of the tray (tray not framed). In step 7 the verify node is chained after the step cards in the same tray row.

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

(This task delivers the sample itself and its registration. The check that verification confirms it, and fails when it is missing, is implemented separately — here, add a unit/contract test asserting the registry contains slug `how-to-make-a-presentation` and the steps' titles, captions, and eras match the table in order.)

## Done When
- `src/presentations/how-to-make-a-presentation/` exists with `entities.ts`, nine step files under `steps/`, `Talk.tsx`, presentation-local CSS, and an importable outline module; it is registered in `src/presentations/index.ts`; the landing page lists it and `/how-to-make-a-presentation` renders it.
- A Vitest contract test (written first) asserts: registry entry, nine steps, exact normative titles/captions/eras in order, unique stable ids, and that all nine steps share one scene group.
- `npm test`, `npm run lint`, `npm run build` pass.
- Using `chrome-devtools-axi` against a production preview on `127.0.0.1` (`npm run build && npm run preview -- --host 127.0.0.1`): step through all nine steps with no console errors, and inspect settled screenshots of the first step, step 5 or 6 (dense), and the last step at a wide viewport, plus at least the first/dense/last at a narrow viewport (e.g. 390px wide). Fix accidental text/chrome collisions, indistinct active chrome, and unpolished attribution before finishing. Do not commit screenshots.
