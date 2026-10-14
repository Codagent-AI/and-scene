# Task: Reference sample presentation and `npm run verify`

## Goal
Deliver the committed, self-referential sample presentation "How to Use This Skill to Make a Presentation" (nine steps, one continuously evolving scene), register it, and add `scripts/verify.mjs` behind `npm run verify` so the whole app is built and the sample is rendered step by step in a real browser, with an unambiguous pass/fail exit code. The sample is the worked example every other piece of the change (skill, templates, inspection) is measured against.

## Background
The scene kit already exists at `src/presentation-kit/` (canonical engine: `Presentation`, `Stage`, `usePresentationNav`, chrome, generic `nodes/` primitives, `Appear`, `SceneLayer`), with a pathname router in `src/main.tsx`, `src/Landing.tsx`, and an explicit registry at `src/presentations/index.ts` (entries shaped `{ slug, title, load: () => import('./<dir>/Talk') }`). Read the kit source to learn its exact props and the stable `data-presentation-*`, `data-step-count`, `data-step-index`, `aria-current` hooks before writing the sample or the driver. Read `CLAUDE.md` and `AGENTS.md` for workflow rules (TDD, `127.0.0.1` everywhere, no CI config such as `.github/workflows/`, no committed build output or screenshots, `chrome-devtools-axi` for interactive inspection).

Sample layout (fixed paths):

```
src/presentations/how-to-make-a-presentation/
  entities.ts      # this presentation's layoutId namespace (stable entity ids)
  steps/*.tsx      # 9 Step objects composing kit primitives
  Talk.tsx         # <Presentation steps={STEPS} title=… initialMode="browse" />
  (presentation-local plain CSS)
```

Registry slug: `how-to-make-a-presentation` (route `/how-to-make-a-presentation`). The sample opens in `initialMode="browse"`.

Sample design guidance (per-step visual design is yours to settle; the table in the Spec is normative for titles, captions, eras, and scene intent):
- One continuously evolving scene. Use shared scene groups (`groupKey` + same `Scene`) so persisting entities morph in place; entities accumulate and are never rearranged or redrawn. Newcomers enter after persisting entities settle; departing ones exit.
- All visual styling (palette, typography, spacing, borders, shadows, control treatments) lives in presentation-local plain CSS (or host `src/index.css`), never in the kit. No Tailwind. Style the active progress indicator/ToC entry so the active step is clearly distinct (target the kit's active-state hook) and style the attribution link so it is legible and not browser-default or tiny (target the attribution hook).
- Compose within the 880 × 380 canvas; keep content from colliding with captions, progress, ToC, or nav chrome. Mark any intentionally overlapping subtree with the allow-overlap marker if/when the inspection helper defines one (if that helper does not exist yet, keep the composition collision-free instead).

Verification design (`npm run verify` → `scripts/verify.mjs`; add the `verify` script to `package.json` and `playwright` as a devDependency; the verify step itself must provision Playwright Chromium before launching the browser, per the design's "Install Chromium in the verify step" — e.g. run `npx playwright install chromium` idempotently (a no-op when already cached; if the install attempt fails but a launch still succeeds, continue with a warning; if the launch then fails, fail with a clear provisioning message)):
1. Run `npm run build` (`tsc -b && vite build`) over the whole app; any type/build error fails the run.
2. Assert the canonical nine-step sample is registered in `presentations/index.ts` and that every normative title and caption occurs in order. Pick a robust mechanism (e.g. read titles/captions from the rendered DOM in browse mode while stepping, and/or validate the registry); the sample is absent/malformed ⇒ fail with a clear message.
3. Start `vite preview` bound to `127.0.0.1` (explicit `--host 127.0.0.1` and a probed or fixed port), wait for readiness by probing `127.0.0.1`, then drive Playwright Chromium to `http://127.0.0.1:<port>/how-to-make-a-presentation`. Read the step count from `data-step-count`, then press `ArrowRight` through every step checking `data-step-index` advances to each index.
4. Any `console.error`, `pageerror`, or failed step transition (index does not advance) fails verification and reports the failing step index.
5. Print which phase failed (build / sample registration / render / transition) and exit non-zero; print a clear pass line and exit zero on success. Always kill the preview subprocess and close the browser, including on failure.
6. Structure the script so that the reference-sample expectations (slug, nine titles/captions) are isolated in one clearly separable place (e.g. a data module or constant block) and the rest (build, preview, driving every registered presentation or a given slug, error capture, reporting) is generic. A later bootstrap template will carry an aligned copy of this script in projects that have no reference sample, so the generic parts must work when the sample expectations are absent or disabled, and the script must be runnable from the project root of whatever project it lives in (resolve paths from the project root, not from the caller's cwd or the original repository).

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

<!-- deferred-to-design: per-step visual design — exact entity shapes, layout coordinates, layoutId namespace, colors, and motion timing — is settled in the design stage. The steps, titles, captions, and scene intent above are fixed. -->

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

The sample is also a generated presentation, so it must meet the skill's quality bar (the helper-related parts are verified elsewhere):

### Requirement: Generated presentation quality bar
Every generated presentation SHALL build with no type errors, render its first step without runtime errors, present a caption per step, support next/previous navigation, pass a visual composition check, and conform to the evolving-scene model.

#### Scenario: Builds clean
- **WHEN** a presentation is generated
- **THEN** `npm run build` completes with no type errors

#### Scenario: Renders without errors
- **WHEN** the presentation route is opened
- **THEN** it renders its first step with no runtime or console errors

#### Scenario: Captions and navigation present
- **WHEN** viewing a presentation
- **THEN** each step shows a caption and the user can navigate to the next and previous steps

#### Scenario: Visual composition is inspected
- **WHEN** a presentation is generated or modified
- **THEN** key browser screenshots or equivalent browser views show that important scene content fits the fixed canvas, intentional overlaps remain readable, and content does not collide with chrome such as captions, progress indicators, table of contents, or navigation controls

#### Scenario: Screenshot helper is project-local
- **WHEN** the skill captures screenshots for visual inspection
- **THEN** it uses the scaffolded project-local helper when available, or otherwise writes any temporary Playwright helper under the project root

#### Scenario: Visual warnings are reviewed
- **WHEN** the screenshot helper emits overlap or chrome-polish warnings
- **THEN** the skill reviews the referenced steps, fixes accidental collisions or indistinct current-step chrome, and marks only intentional readable overlaps as allowed

#### Scenario: Active chrome and attribution are styled locally
- **WHEN** the generated presentation includes table-of-contents, progress, navigation, or attribution chrome
- **THEN** presentation-owned or host-owned CSS makes the active step visibly distinct and the attribution legible
- **AND** the reusable scene kit remains free of default colors, fonts, borders, button styles, and theme tokens

## Test Plan
- `E2E-001` (Reference presentation passes production verification): from the repository root, `npm run verify` builds the app, starts the production preview on `127.0.0.1`, opens the registered sample route, and advances through all nine steps via the public step hooks. Assert the sample is registered and reachable, all normative titles and captions occur in order, each of the nine step indices is observed without console/page errors or failed transitions, the host/readiness probe/browser URL all use `127.0.0.1`, and the command exits zero with a clear pass result. Implement as an automated test under the Vitest-driven E2E suite (e.g. `tests/e2e/`) that runs `npm run verify` and asserts on exit code and output; it runs as part of `npm test` (browser-backed, long timeout).
- `E2E-002` (Verification failures are actionable): create independent disposable copies of the repository (excluding `node_modules`, `dist`, `.git` as appropriate; reuse installed dependencies via symlink or equivalent) and introduce one fault per phase without touching the source checkout: a build-breaking edit, a missing or out-of-order sample (e.g. removed registry entry or swapped titles), a step that emits a browser `console.error`/throws, and a transition that does not advance the public step index. Run `npm run verify` in each. Assert every copy exits non-zero, output names the failed phase and (for browser/transition faults) the offending step, none is reported as success, and no preview subprocess survives (check the port/process is released).
- Unit-level tests for the verify script's pure helpers (title/caption order comparison, report formatting) are your call.

## Done When
- The sample is registered, reachable at `/how-to-make-a-presentation`, implements the nine steps in order with the normative titles and captions, opens in browse mode, and is styled entirely outside the kit.
- `scripts/verify.mjs` and the `verify` npm script exist, satisfy the Verification design above (including provisioning Chromium before launching the browser, so a fresh environment without a cached browser still works), and `playwright` is declared in `devDependencies` (lock file updated).
- `E2E-001` and `E2E-002` pass as automated tests within `npm test`.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass.
- Using `chrome-devtools-axi` against a production preview on `127.0.0.1` (snapshot first, then screenshots), inspect the first step, the last step, the densest step (e.g. steps 6–7), and a narrow viewport; confirm content fits the canvas, intentional overlaps are readable, active chrome is visually distinct, attribution is legible, and nothing collides with chrome. Fix what you find before finishing. Do not commit screenshots.
