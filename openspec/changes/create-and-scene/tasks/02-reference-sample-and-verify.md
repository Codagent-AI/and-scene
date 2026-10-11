# Task: Ship the reference sample presentation and the `npm run verify` gate

## Goal

Commit the self-referential reference presentation "How to Use This Skill to Make a
Presentation" and add `npm run verify` (`scripts/verify.mjs`): a deterministic gate that builds
the whole app, confirms the canonical nine-step sample is registered and in order, renders it in
a real browser against a production preview on `127.0.0.1`, steps through every step, and exits
non-zero with an actionable message on any failure. This is the repository's automated
end-to-end gate and the known-good example the presentation skill is measured against.

## Background

Read `openspec/changes/create-and-scene/design.md` ("Verification", "Routing + registry",
"Styling", Decision 4) and `openspec/changes/create-and-scene/test-plan.md` (E2E-001, E2E-002).

### Existing foundation you build on

- `src/presentation-kit/` is the style-neutral scene kit. Import from its `index.ts`:
  `Presentation`, the `Step`/`SceneProps` types (grouped steps share a `groupKey` + `Scene` and
  receive a typed `payload`), `Stage`, and primitives `Box` (optional `Icon: LucideIcon`),
  `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear` (delays newcomers until
  persisting entities settle), `SceneLayer`. Constants include `DESIGN_W=880`, `DESIGN_H=380`.
  Read the kit source before composing steps; do not modify kit behavior to suit the sample
  unless you find a genuine kit bug (fix it with a failing test first).
- The kit renders these hooks, which the verifier must use instead of DOM structure:
  `[data-presentation-root]` with `data-step-count` (total), `data-step-index` (0-based active
  index), `data-step-id`, and `data-presentation-mode="browse"|"present"`;
  `[data-presentation-title]`, `[data-presentation-caption]`, `[data-presentation-progress-item]`,
  `[data-presentation-toc-item]`, `[data-presentation-prev]`, `[data-presentation-next]`,
  `[data-presentation-attribution]`; active progress/ToC items carry `aria-current="step"` and
  `data-presentation-active="true"`. Keys: `ArrowRight`/`Space`/`PageDown` next,
  `ArrowLeft`/`PageUp` prev, `P` toggles mode.
- `src/main.tsx` routes `/<slug>` to entries of the explicit registry
  `src/presentations/index.ts` (`{ slug, title, load: () => import('./<dir>/Talk') }`, slug as
  a string literal). `npm test` runs Vitest unit/contract tests; `npm run lint` and
  `npm run build` (`tsc -b && vite build`) exist.

### Reference sample

Create `src/presentations/how-to-make-a-presentation/`:

- `entities.ts` — this presentation's stable `layoutId` namespace (e.g. `you`, `prompt`,
  `skill`, `you-skill-link`, `question-chip`, `tray`, `card-1..n`, `card-link-*`,
  `ghost-card`, `depth-control`, `scene-kit-socket`, `verify-node`, `verify-pass`,
  `modify-arc`, `edited-flag`, `reveal-frame`, `reveal-label`).
- `steps/*.tsx` — nine `Step` objects in the normative order, era, title, and caption below.
  Model the whole talk as one continuously evolving grouped scene (one `groupKey` and one
  `Scene` with a typed payload) so entities accumulate in place: nothing already on screen is
  rearranged or redrawn; later beats add connections, the socket, the verify node, the modify
  arc, and finally the outer reveal frame. Lay out the 880 × 380 canvas so the final, densest
  step still fits with readable labels. Use `lucide-react` icons for glyphs.
- `Talk.tsx` — `<Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" />`
  and imports presentation-owned plain CSS (e.g. `talk.css`).
- Presentation-owned plain CSS supplies the entire look: palette, typography, card/arrow
  treatments, chrome (title, caption, ToC, progress, prev/next), a visibly distinct active
  progress dot and ToC entry (target `[data-presentation-active="true"]`/`[aria-current]`), and
  a legible, intentional attribution (target `[data-presentation-attribution]`). Do not add
  styles to `src/presentation-kit/`. Mark any intentional readable overlap with
  `data-presentation-allow-overlap` on its subtree; avoid accidental text/chrome collisions.
- Register it in `src/presentations/index.ts` with slug `how-to-make-a-presentation`.
- The sample is specified as output of the presentation skill, so keep it in the canonical
  per-presentation shape (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, one presentation-owned CSS
  file, one registry line) with no sample-specific changes outside its folder and the registry.
  That shape lets it later be reconciled with the skill's generated output without restructuring.

### Verifier (`scripts/verify.mjs`, `npm run verify`)

Add `playwright` as a dev dependency and `"verify": "node scripts/verify.mjs"`. Keep the script
generic — no repository-specific constants — because it is copied verbatim into a bootstrap
template for freshly scaffolded projects. Repository-specific expectations live in
`scripts/verify.expectations.json`:

```json
{ "referenceSample": { "slug": "how-to-make-a-presentation",
  "steps": [ { "era": "the ask", "title": "You have a topic", "caption": "It starts with you, a topic, and mild overconfidence." }, … ] } }
```

Required behavior, in phases:

1. **build** — run `npm run build`; any non-zero exit fails.
2. **sample** — when the expectations file exists, the reference slug must be present in
   `src/presentations/index.ts` (static parse of `slug: '…'` literals); a missing slug fails.
   When the file is absent (scaffolded projects), skip this phase.
3. **render** — targets are every registered slug, or only slugs passed as CLI arguments
   (`npm run verify -- <slug>`); zero targets fails. Start `vite preview` from local
   `node_modules` with `--host 127.0.0.1 --strictPort` on a free port, probe readiness at
   `http://127.0.0.1:<port>/`, and open `http://127.0.0.1:<port>/<slug>` in Playwright
   Chromium. Wait for `[data-presentation-root]`, read `data-step-count`, and for each step
   press `ArrowRight` and require `data-step-index` to advance to the next index within a
   timeout. For the reference sample, in browse mode (press `P` if it opened in present mode),
   compare each step's rendered `[data-presentation-title]` and `[data-presentation-caption]`
   with the expectations in order and require the step count to equal nine; report mismatches
   as `sample` failures naming the step. Any `console.error` message, `pageerror`, or
   non-advancing transition fails and names the 1-based step number and step id.
4. **report** — print the preview URL used, one line per check, and a final unambiguous line:
   `verify: PASS` or `verify: FAIL [<phase>] <slug> step <n> (<id>): <reason>` (omit
   slug/step when not applicable). Exit `0` only on pass.

Always close the browser and terminate the preview process (on success, failure, and
`SIGINT`/`SIGTERM`). If Chromium is missing, fail with a message naming
`npx playwright install chromium`.

### Tests

- In `npm test`, add a fast contract test that imports the sample's step array and asserts it
  matches `scripts/verify.expectations.json` exactly (count, order, era, title, caption) and that
  ids are unique.
- Browser/subprocess suites go in `tests/e2e/` and run via `npm run test:integration`
  (Vitest with a dedicated `vitest.integration.config.ts` and long timeouts); create that script
  and config if they are not present, and make sure `npm test` excludes them. Each faulty run
  works in a disposable copy of the repository under the OS temp dir (copy sources excluding
  `.git`, `node_modules`, `dist`; symlink `node_modules` from the checkout) and must leave the
  source checkout unchanged.
- Gitignore any generated output (`dist`, Playwright artifacts); commit no build output.
- Do not add CI configuration.

## Test Plan

- `E2E-001` — Reference presentation passes production verification. `npm run verify` from the
  repository root builds the app, starts the preview on `127.0.0.1`, opens the registered sample
  route, and advances through all nine steps via the public step hooks. Completion signal: the
  command exits `0` with `verify: PASS`; output shows a `http://127.0.0.1:<port>` preview URL
  (never `localhost`); all normative titles and captions were matched in order; nine step indices
  were observed with no console/page errors or failed transitions. Also cover this run inside
  the `tests/e2e/` suite against a disposable copy so the assertions (exit code, `127.0.0.1`
  URL, nine steps) are machine-checked.
- `E2E-002` — Verification failures are actionable. In `tests/e2e/`, create independent
  disposable copies and inject exactly one fault each: (a) a type/build error in a sample step;
  (b) the sample's registry entry removed, and separately two sample steps swapped out of order;
  (c) a step that emits `console.error` or throws on render at a known step; (d) a step whose
  transition does not advance `data-step-index` (e.g. a step-scoped capture listener that
  swallows `ArrowRight`). Completion signal: every copy exits non-zero; output names the failed
  phase (`build`, `sample`, `render`) and, for browser and transition faults, the offending step;
  no run prints `verify: PASS`; and the preview port is no longer listening and no preview
  process remains after each run.

## Spec

### Requirement: Build verification
Verification SHALL build the whole application — all presentations plus the index — and fail if the build does not succeed.

#### Scenario: Build must succeed
- **WHEN** verification runs
- **THEN** it builds the whole app and fails if `npm run build` reports any type or build error

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

### Requirement: Render verification
Verification SHALL render the reference sample through all of its steps and fail if any step produces a runtime or console error. The render check runs the sample in a real browser against a production preview and steps through every step. The preview server and browser navigation SHALL use a deterministic IPv4 loopback address (`127.0.0.1`) so verification does not depend on how `localhost` resolves in the runtime environment. (Mechanism settled in design: `vite preview` + a Playwright/Chromium driver that enumerates steps via the chrome's step-count hook.)

#### Scenario: Every step renders cleanly
- **WHEN** verification renders the sample
- **THEN** it steps through every step and asserts each renders without runtime or console errors

#### Scenario: Preview uses IPv4 loopback
- **WHEN** verification starts the production preview and opens presentation routes
- **THEN** the preview host, readiness probe, and browser URLs use `127.0.0.1` consistently

#### Scenario: Console or page error fails verification
- **WHEN** the sample emits a console error or an uncaught page error while stepping through it
- **THEN** verification fails and identifies the failing step

#### Scenario: Step error fails verification
- **WHEN** any step errors during render
- **THEN** verification fails and identifies the failing step

### Requirement: Pass/fail reporting
Verification SHALL produce an unambiguous pass/fail outcome suitable for automated checks.

#### Scenario: Clear outcome
- **WHEN** verification completes
- **THEN** it reports a clear pass or fail (non-zero exit on failure) identifying which check failed

### Sample's portion of the generated-presentation quality bar (from `presentation-skill`)

#### Scenario: Presentation owns its visual style
- **WHEN** the skill creates a presentation with a designed visual look
- **THEN** the styling is added in files owned by that presentation or by the host app rather than in the reusable scene kit
- **AND** plain CSS is the default styling approach unless the host project already uses a styling framework or the user explicitly requests one

#### Scenario: Captions and navigation present
- **WHEN** viewing a presentation
- **THEN** each step shows a caption and the user can navigate to the next and previous steps

#### Scenario: Active chrome and attribution are styled locally
- **WHEN** the generated presentation includes table-of-contents, progress, navigation, or attribution chrome
- **THEN** presentation-owned or host-owned CSS makes the active step visibly distinct and the attribution legible
- **AND** the reusable scene kit remains free of default colors, fonts, borders, button styles, and theme tokens

## Done When

- `src/presentations/how-to-make-a-presentation/` exists with `entities.ts`, `steps/*`,
  `Talk.tsx`, and presentation-owned plain CSS; it is registered and reachable at
  `/how-to-make-a-presentation` and listed on `/`.
- The sample-vs-expectations contract test passes in `npm test`.
- `E2E-001`: `npm run verify` exits `0`, prints `verify: PASS`, and shows only `127.0.0.1`
  URLs; the `tests/e2e/` copy-based run asserts the same.
- `E2E-002`: every injected fault exits non-zero with the specified phase/step reporting and
  clean process/port teardown, via `npm run test:integration`.
- `src/presentation-kit/` gained no styling; `scripts/verify.mjs` contains no
  repository-specific slugs, titles, or captions.
- `npm test`, `npm run lint`, `npm run build`, `npm run verify`, and
  `npm run test:integration` all pass.
- Using `chrome-devtools-axi` against a production preview on `127.0.0.1`, inspect (snapshot
  then screenshot) steps 1, 7, 8, and 9 at a wide desktop viewport and steps 1 and 9 at a
  narrow (≈390 px) viewport; confirm entities accumulate without rearranging, content fits the
  canvas without colliding with captions, ToC, progress, or navigation, the active progress dot
  and ToC entry are visibly distinct, and the attribution is legible. Fix anything that fails.
  Do not commit screenshots.
