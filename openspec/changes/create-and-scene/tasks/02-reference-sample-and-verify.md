# Task: Reference sample presentation and `npm run verify` gate

## Goal
Commit the self-referential nine-step sample "How to Use This Skill to Make a Presentation" as a registered, routed presentation, and add `scripts/verify.mjs` (`npm run verify`) that builds the whole app and renders the sample through every step in a real browser, failing loudly and specifically on any fault.

## Background
You MUST read these before editing (all under `openspec/changes/create-and-scene/`):
- `design.md`: "Repository layout", "Verification (`npm run verify` → `scripts/verify.mjs`)", Decisions 3–5, and Risks (Playwright in Docker, StrictMode + motion).
- `specs/presentation-verification/spec.md`: build, sample, render, and reporting requirements (copied below; the nine-step table is normative for titles, captions, eras, and scene intent).
- `test-plan.md`: `E2E-001`, `E2E-002`.
- Repo `CLAUDE.md`: workflow, commands, AXI inspection duties, change guidelines.

Already present in the repo (read it rather than rebuilding it): the scene kit in `src/presentation-kit/` (`Presentation`, `Stage`, chrome, `nodes/*`, `usePresentationNav`), the pathname router in `src/main.tsx`, `src/Landing.tsx`, the explicit registry `src/presentations/index.ts` (`{ slug, title, load }`), and Vitest (`npm test`, with `tests/integration/` and `tests/e2e/` as homes for subprocess/browser suites). The chrome root exposes `data-step-count` and `data-step-index`; other hooks use `data-presentation-*` (find the exact names in the kit source). The kit has zero visual defaults.

What to build:

1. **Sample presentation** in `src/presentations/how-to-make-a-presentation/`: `entities.ts` (its `layoutId` namespace), `steps/*.tsx` (nine `Step` objects composing kit primitives; use grouped scenes with a shared `groupKey` and typed payload so entities persist and morph rather than remount), `Talk.tsx` (`<Presentation steps={STEPS} title=… initialMode="browse" />`; `Talk.tsx` is the required filename for the per-presentation entry), and presentation-owned plain CSS (e.g. `talk.css`) imported from the presentation folder. Register it in `src/presentations/index.ts` with slug `how-to-make-a-presentation` and the title "How to Use This Skill to Make a Presentation". The per-step visual design (shapes, coordinates, colors, motion timing) is yours to design; the titles, captions, eras and scene intent in the spec table are fixed. The scene is one continuously evolving diagram: entities accumulate and are never rearranged or redrawn.
2. **Local styling**: the sample's CSS makes the active progress/ToC entry visibly distinct and the `made by and-scene` attribution legible (size, color, not browser-default link styling) via the kit's hooks. Mark any intentional overlap with the attribute `data-presentation-allow-overlap` on the subtree (a later inspection helper honors exactly this name).
3. **`scripts/verify.mjs`** and an `npm run verify` script; add `playwright` as a devDependency (update `package-lock.json`). Phases, each reported by name on failure:
   - `build`: run `npm run build`; any type/build error fails.
   - `sample`: assert the registry contains the canonical sample and that its nine steps, in order, carry every normative title (present mode) and caption (browse mode) from the spec table; missing sample or wrong/out-of-order content fails. Keep the expected outline in a separate module or data file so it can be removed or swapped without touching the generic runner logic.
   - `render`: start `vite preview` bound to `127.0.0.1` (explicit `--host 127.0.0.1` and a free/deterministic port), probe readiness at `http://127.0.0.1:<port>/`, open `http://127.0.0.1:<port>/how-to-make-a-presentation` in Playwright Chromium, read `data-step-count`, then press `ArrowRight` through every step asserting `data-step-index` advances to each of the nine indices. Any `console.error`, `pageerror`, or a transition that does not advance the index fails and names the failing step index.
   - Always kill the preview subprocess (including on failure/signal), print a clear final `PASS`/`FAIL` line naming the failed check, and exit non-zero on any failure.
   - Structure `verify.mjs` so the runner (build, preview, browser stepping, error capture) is generic over "the registered presentations to render" and the sample-outline check is the only sample-specific piece; the same runner will later be copied into a scaffold template for projects that have no reference sample, where it should render each registered presentation route instead.
4. Document the Playwright Chromium requirement (`npx playwright install chromium`) in `README.md` next to the commands.
5. **Tests.** Add tests for the pure parts of `verify.mjs` (outline comparison, argument/port handling, failure formatting) as Vitest unit tests. Add `tests/e2e/verify.e2e.test.ts` implementing `E2E-001` and `E2E-002` (below). Use TDD: write the failing test or fault first.

Visual duty (from `CLAUDE.md`): after the sample works, inspect with `chrome-devtools-axi` (`open http://127.0.0.1:<port>/how-to-make-a-presentation`, `snapshot`, `screenshot`) the first step, the last step, and dense steps (3–7 at minimum), plus a narrow viewport. Fix accidental overlaps, content colliding with captions/ToC/progress/nav, and anything off-canvas. Do not commit screenshots.

## Spec
Copied from `specs/presentation-verification/spec.md`. This task owns the requirements below. (Requirement "Visual inspection artifacts" is out of scope for this task.)

## ADDED Requirements

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

## Test Plan
- `E2E-001: Reference presentation passes production verification` — surface `npm run verify` from the repo root in an isolated checkout with committed deps and Playwright Chromium. Assert: sample registered and reachable; all normative titles and captions occur in order; each of the nine step indices is observed without console/page errors or failed transitions; the preview host, readiness probe and browser URL all use `127.0.0.1`; exit code zero with a clear pass result. This runs as the repository's full verification gate.
- `E2E-002: Verification failures are actionable` — create independent disposable copies of the repository (reuse the source `node_modules` by symlink or a fast copy so no network is needed; never modify the source checkout) and introduce one fault per phase: (a) a type error that breaks the build, (b) a missing sample registry entry and an out-of-order/mis-titled step, (c) a step that throws or calls `console.error` at render, (d) a transition that never advances `data-step-index`. For each: exit non-zero, output names the failed phase and (for browser/transition faults) the offending step, nothing is reported as success, and no preview subprocess survives (assert the port is free afterward).
- Both live under `tests/e2e/` and run through `npm test` (browser-backed; Chromium available).

## Done When
- The sample exists at `src/presentations/how-to-make-a-presentation/`, is registered, reachable at `/how-to-make-a-presentation`, and implements the nine normative steps in order with their exact titles and captions.
- `npm run verify` passes from a clean checkout and prints a clear pass; `E2E-001` and `E2E-002` pass under `npm test`.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass.
- AXI snapshots/screenshots of the first, last, dense, and a narrow-viewport step show clean composition (nothing committed).
- The sample's visual styling lives only in the presentation folder or host CSS; `src/presentation-kit/` is unchanged except for bug fixes needed to make the sample work (if you change it, add a test).
- Commits use `type: lowercase description`; no generated output, dependency directories, or screenshots committed.
