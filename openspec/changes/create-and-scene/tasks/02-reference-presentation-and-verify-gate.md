# Task: Reference Presentation and Production Verification Gate

## Goal
Commit the self-referential nine-step sample presentation "How to Use This Skill to Make a Presentation" as a registered, routed, designed presentation built on the scene kit, and add `npm run verify` (`scripts/verify.mjs`) — a deterministic build + real-browser render gate with actionable failure reporting.

## Background
The scene kit (`src/presentation-kit/`: `Presentation`, `Step`/`SceneProps` types, node primitives, chrome, nav, fit-scale), the pathname router in `src/main.tsx`, `Landing.tsx`, and the explicit registry `src/presentations/index.ts` (`{ slug, title, load: () => import('./<dir>/Talk') }`) already exist. Playwright and Vitest are dependencies; `npm test` excludes `*.browser.test.ts`, and `npm run test:browser` runs only them (if either script is missing, add it that way). Read `design.md` ("Repository layout", "Verification", "Styling", Decisions 1, 2, 4) — do not change the kit contract; if a small kit fix is truly needed to make the sample correct, keep it style-neutral and covered by a test. Use TDD where behavior is testable. Use `127.0.0.1` everywhere (preview host, readiness probe, browser URLs).

### Sample presentation
- Location `src/presentations/how-to-make-a-presentation/` with `entities.ts` (this presentation's `layoutId` namespace — stable entity ids), `steps/*.tsx` (nine `Step` objects composing kit primitives and/or raw `motion` elements with stable `layoutId`s), `Talk.tsx` (`<Presentation steps={STEPS} title=… initialMode="browse" />`), and presentation-local plain CSS (e.g. `how-to-make-a-presentation.css`) that gives it a designed look: palette, typography, spacing, borders, shadows, control treatments, and — required — a visibly distinct active progress/TOC state and a legible, intentional bottom-right attribution styled through `[data-presentation-attribution]`. Styling must never go into the kit. Register it in `src/presentations/index.ts` with slug `how-to-make-a-presentation` and title "How to Use This Skill to Make a Presentation".
- Titles, captions, eras, and scene intent of the nine steps are normative (table in the spec below). Per-step visual design is yours: one continuously evolving scene — conversation row (you ↔ skill) at top, a tray of step cards accumulating below, later connections and a final reveal frame. Entities accumulate and are never rearranged or redrawn; use grouped scenes (shared `groupKey` + `Scene`, changing `payload`) so continuing entities morph through `layoutId` instead of remounting, and newcomers enter via `Appear`. Everything must fit the 880 × 380 canvas with readable text, no text/chrome collisions in browse or present mode at a 1280-wide desktop viewport and at a narrow (~390 px) viewport. Any deliberately overlapping composition (e.g. the scene-kit socket plugging into the tray in step 6, the reveal frame in step 9) is marked with `data-presentation-allow-overlap` on that subtree and only there.
- Expose the normative titles/captions/eras as importable typed data (e.g. a `STEPS` export) so tests and `verify.mjs` can check them in order.

### Verification script
`scripts/verify.mjs`, invoked by `"verify": "node scripts/verify.mjs"` in `package.json`:
1. Run `npm run build` (`tsc -b && vite build`) over the whole app; any type/build error fails the "build" phase.
2. Assert the committed reference sample is present in `src/presentations/index.ts` (registered, loadable, route reachable) and implements the nine normative titles and captions in order; a missing, malformed, or out-of-order sample fails the "sample" phase. The reference slug and normative outline must come from configuration data that is NOT hard-coded in the script body (e.g. a `presentationVerification` key in `package.json` or a JSON file next to the script), so the same script file can later be reused unchanged in a fresh scaffold with no reference sample: when no reference sample is configured, the script requires at least one registered presentation and renders every registered presentation instead (planning assumption — keep this behavior and cover it with a test). The script also accepts a repeatable `--slug <slug>` option: each named registered presentation is additionally stepped through completely (same hooks, same console/page-error and transition checks, failures name the slug and step), so an agent that just generated or modified a presentation can verify that exact route; an unregistered slug fails the "sample" phase. Cover with a regression test where the reference sample is clean but another registered presentation emits a browser error: plain `npm run verify` is unaffected by it only if it is not selected, while `npm run verify -- --slug <that slug>` fails naming that slug and step.
3. Start `vite preview` bound to `127.0.0.1` (choose a free port; pass an explicit host flag), probe readiness over `127.0.0.1`, open the sample route in Playwright Chromium (`http://127.0.0.1:<port>/<slug>`), read `data-step-count` from the chrome, and press `ArrowRight` through every step confirming `data-step-index` advances to each index in turn.
4. Any `console.error`, `pageerror`, or a step transition that fails to advance the index fails the "render" phase and reports the failing step index.
5. Always terminate the preview subprocess and browser (including on failure/timeouts/SIGINT). Print one phase line per check and a final unambiguous `PASS`/`FAIL` line naming the failed phase (and step where relevant); exit non-zero on any failure. The script must be runnable against another project root (cwd or an explicit root argument) so failure fixtures can run it in throwaway copies.

Unit/contract tests (Vitest, runnable under `npm test`) should cover pure parts: outline comparison logic (order, missing, mismatched titles/captions), registry parsing, phase result/exit-code formatting, and the sample's step data (nine steps, ids unique, eras, titles/captions match the spec table, grouped steps share `groupKey`).

Do not add `.github/workflows/` or other CI config. Do not commit build output or screenshots.

## Spec
Canonical requirements for capability `presentation-verification` (copied verbatim; the visual-inspection requirement is out of scope for this piece of work):

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

Portions of `evolving-scene-presentations` the sample must demonstrate (verbatim):

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

## Test Plan
Both obligations below are assigned to this piece of work (copied verbatim from `test-plan.md`):

### E2E-001: Reference presentation passes production verification
- Covers: Whole-application build verification, the canonical nine-step sample, registered routing, clean rendering, IPv4 preview, and unambiguous success reporting.
- Surface: `npm run verify` from the repository root.
- Setup: Install committed dependencies and make Playwright Chromium available in an isolated checkout containing the canonical reference sample.
- Journey: Invoke verification, let it build the application, start the production preview on `127.0.0.1`, open the registered sample route, and advance through all nine steps using the public step hooks.
- Assertions: The sample is registered and reachable; all normative titles and captions occur in order; each of the nine step indices is observed without console or page errors or failed transitions; the host, readiness probe, and browser URL use `127.0.0.1`; and the command exits zero with a clear pass result.
- Execution: Run as the repository's full verification gate on every pull request.

### E2E-002: Verification failures are actionable
- Covers: Build failure, missing or malformed reference sample, runtime or console failure, failed step transition, and process-level failure reporting.
- Surface: `npm run verify` from controlled throwaway copies of the repository.
- Setup: Create independent disposable copies and introduce one representative fault per verification phase without changing the source checkout.
- Journey: Run verification against a build-breaking edit, a missing or out-of-order sample, a step that emits a browser error, and a transition that does not advance the public step index.
- Assertions: Every faulty copy exits non-zero; the output names the failed phase and, for browser or transition faults, the offending step; no failure is reported as success; and preview subprocesses are cleaned up after each run.
- Execution: Run in the repository's browser-backed end-to-end suite on every pull request with Chromium available.

Implementation guidance: E2E-001 is satisfied by `npm run verify` itself passing from the repo root. E2E-002 is a browser-backed vitest file (`*.browser.test.ts`) that creates independent throwaway copies of the repo (copy sources, symlink or reuse `node_modules`; never modify the source checkout), injects one fault per phase — a type error breaking the build, a missing sample registration and an out-of-order/mis-titled sample, a step that calls `console.error`/throws on a particular step, a non-sample presentation erroring only when selected via `--slug`, and a transition that never advances `data-step-index` — runs verification in each, and asserts non-zero exit, output naming the failed phase and (for browser/transition faults) the offending step, no `PASS` line, and no leftover preview process on the port afterward.

## Done When
- All nine steps exist with the exact normative titles and captions, registered at `/how-to-make-a-presentation`, rendering in the production preview with morphing continuing entities, entering newcomers, and clean browse/present chrome; plain-CSS styling lives only in presentation-local files.
- `npm run verify -- --slug <slug>` steps through the named registered presentation and fails (naming slug and step) on its browser errors.
- Unit tests above pass under `npm test`; `npm run test:browser` passes including E2E-002; `npm run lint` and `npm run build` pass; `npm run verify` exits 0 with a clear pass result (E2E-001).
- Using `chrome-devtools-axi` against a preview on `127.0.0.1`, the first, last, and dense/transition-critical steps (e.g. steps 1, 6, 7, 9) were inspected at a wide and a narrow viewport: content fits the canvas, nothing collides with chrome, active TOC/progress state is visibly distinct, and attribution is legible.
- No Tailwind or other styling framework was introduced; the kit gained no visual defaults.
