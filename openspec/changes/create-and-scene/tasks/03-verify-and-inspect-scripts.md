# Task: Production verification and visual inspection scripts

## Goal
Deliver `npm run verify` (deterministic build plus real-browser render verification of the reference sample with actionable failure reporting) and `npm run inspect` (project-local per-step screenshot capture with advisory visual diagnostics), so agents and CI-less contributors have a repeatable automated gate and a visual-review aid.

## Background
Existing state: the repository has the scene kit (`src/presentation-kit/`), the pathname router and explicit registry (`src/presentations/index.ts`), the committed nine-step sample at slug `how-to-make-a-presentation`, and Vitest (`npm test`). Neither Playwright nor `verify`/`inspect` scripts exist yet. The chrome exposes stable hooks (step count, step index, active-state/`aria-current`, attribution, allow-overlap marker); read `src/presentation-kit/` and its documented hook names and consume them rather than coupling to DOM structure.

Files to create: `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, and `package.json` scripts `verify` (`node scripts/verify.mjs`) and `inspect` (`node scripts/inspect-presentation.mjs`, invoked as `npm run inspect -- <slug>`). Add `playwright` as a devDependency (update `package-lock.json`); make Chromium installable via `npx playwright install chromium` and say so in the failure message when the browser is missing. Scripts resolve all tooling from project-local dependencies, never ad hoc scripts outside the project tree. A later piece of work copies these scripts into a bootstrap template, so write them to be project-agnostic: derive the sample/registry from the project root and avoid hardcoded absolute paths, and let them accept a project root (cwd or an env var/flag) so tests can run them against throwaway copies.

`verify.mjs` flow (design.md):
1. Phase "build": run `npm run build` (`tsc -b && vite build`) over the whole app; any type/build error fails.
2. Phase "sample": assert the canonical nine-step sample exists, is registered in `src/presentations/index.ts`, and implements every normative era/title/caption in order. Missing sample, malformed registry entry, missing or out-of-order steps fail with a clear message. Embed the normative expectations in the script (single source) and keep them in sync with the sample.
3. Phase "render": start `vite preview` bound to `127.0.0.1` on a free port, poll readiness via `127.0.0.1`, launch Playwright Chromium, open `http://127.0.0.1:<port>/how-to-make-a-presentation`, read the step count from the chrome's step-count hook, step through every step with `ArrowRight` (waiting for the step-index hook to advance), and collect `console.error` and `pageerror`. Any console error, page error, or failed step transition fails verification and names the phase and offending step index.
4. **Route-smoke mode** (for scaffolded projects that do not contain the canonical sample): `node scripts/verify.mjs --smoke [--slug <slug>]` runs the build phase and the render phase (preview on `127.0.0.1`, step through every step, fail on console/page errors or failed transitions) against the given registered presentation, or the first registered one when no slug is given, and skips the canonical-sample outline phase. Default (no flag) remains strict: the canonical nine-step sample must exist, be registered, and match the outline. Smoke mode must still fail on an empty registry or unknown slug. The bootstrap template's `verify` npm script will invoke smoke mode, so this mode must be covered by a test (including a failing case) and documented in the script's usage text.
5. Always clean up the preview subprocess (and browser), including on failure and on signals. Exit non-zero on any failure with a clear final `PASS`/`FAIL` line that names the failed phase; zero only on full success.

`inspect-presentation.mjs` (CLI `npm run inspect -- <slug>`, optional settle-interval and viewport options):
- Build output is served by `vite preview` on `127.0.0.1` (reuse a build if present or build first; document which).
- Capture one screenshot per step at a standard desktop viewport (e.g. 1280×800) to a predictable project-local artifact directory (e.g. `.and-scene/inspection/<slug>/step-01.png`, …); add that directory to `.gitignore` so screenshots are never committed. Support an optional narrow viewport pass.
- Wait for the configured settle interval (and for motion layout animations to finish) after each navigation before capturing.
- Print advisory warnings (they never change the exit code unless the script itself fails to run) identifying the step and elements for: visible text/chrome overlap between elements not inside an allow-overlap marked subtree; active progress indicator or ToC entry visually indistinguishable from inactive ones (compare computed styles); attribution link too small (e.g. under a legible font-size threshold) or browser-default (default link color/underline/size), with the message pointing authors to the attribution styling hook.
- Treat screenshots and warnings as inspection artifacts, not pass/fail evidence.

Test strategy (Vitest; put browser-backed integration/e2e tests where `npm test` can run them or in a clearly separate script such as `npm run test:e2e` that is also documented; the requirement is that they are part of the repository's automated suite and runnable with Chromium available): tests that run the scripts must operate on disposable copies of the repo (copy sources, symlink or reuse `node_modules`; exclude `dist` and `.git`) and must never mutate the source checkout. Use `127.0.0.1` everywhere. Do not add CI configuration (`.github/workflows/`).

Fixture for INT-002: a controlled test presentation with multiple steps and variants containing (a) an unmarked text collision, (b) an explicitly allowed overlap inside an allow-overlap marked subtree, (c) indistinct active progress/ToC chrome, and (d) unpolished (tiny/browser-default) attribution. It is registered only in the disposable copy used by the test, never in the committed registry.

## Spec
### Requirement: Build verification
Verification SHALL build the whole application — all presentations plus the index — and fail if the build does not succeed.

#### Scenario: Build must succeed
- **WHEN** verification runs
- **THEN** it builds the whole app and fails if `npm run build` reports any type or build error

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

### Requirement: Visual inspection artifacts
Scaffolded projects SHALL provide a project-local helper that captures per-step screenshots from a production preview for human visual review. The helper SHALL wait for step transition animations to settle before each screenshot and SHALL surface advisory warnings for suspicious text/chrome collisions, visually indistinct active navigation states, and unpolished attribution. The helper supports the skill's visual composition check, but its screenshots and warnings are inspection artifacts rather than automated pass/fail evidence.

#### Scenario: Capture step screenshots
- **WHEN** the screenshot helper runs for a registered presentation
- **THEN** it captures each step at a standard desktop viewport and writes the images under a predictable project-local artifact directory

#### Scenario: Screenshots are settled
- **WHEN** the helper advances from one step to the next
- **THEN** it waits for the configured settle interval before capturing the next screenshot

#### Scenario: Suspicious overlap is reported
- **WHEN** visible text or presentation chrome overlaps another visible text/chrome element without an explicit allow-overlap marker
- **THEN** the helper prints an advisory warning identifying the step and overlapping elements

#### Scenario: Intentional overlap can be marked
- **WHEN** a presentation marks a subtree as allowing overlap
- **THEN** the helper does not report overlap warnings for elements inside that subtree

#### Scenario: Indistinct active chrome is reported
- **WHEN** the active progress indicator or active table-of-contents entry is visually indistinguishable from inactive controls
- **THEN** the helper prints an advisory warning identifying the affected chrome

#### Scenario: Unpolished attribution is reported
- **WHEN** the attribution link appears too small or browser-default
- **THEN** the helper prints an advisory warning pointing authors to the attribution styling hook

The verification flow owns the checking half of the committed-sample requirement below (the sample itself already exists in the repository). The normative step table is the single source for the expectations embedded in `scripts/verify.mjs`; take every era, title, and caption verbatim from this table, not from the sample's implementation.

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

## Test Plan
- `INT-002` (Screenshot helper emits faithful artifacts and advisory warnings): Boundary is the inspection script driving a production preview in Chromium and writing files. Using the fixture above in a disposable copy, run the helper through every step after the settle interval. Assert one predictable screenshot per step; captures occur only after transitions settle (for example, a step with a slow transition is captured in its final state); the unmarked collision, indistinct active state, and attribution defect each produce a step-specific advisory warning; and the allowed overlap produces no overlap warning. Runs in the browser-backed integration suite.
- `E2E-001` (Reference presentation passes production verification): Run `npm run verify` from the repository root (or an isolated checkout with the canonical sample). Assert the sample is registered and reachable, all normative titles and captions occur in order, each of the nine step indices is observed with no console/page errors or failed transitions, the preview host, readiness probe, and browser URL all use `127.0.0.1`, and the command exits zero with a clear pass result.
- `E2E-002` (Verification failures are actionable): In independent disposable copies, introduce one fault per phase: a build-breaking edit; a missing and an out-of-order sample; a step that emits a `console.error`; and a transition that never advances the public step index. Assert each copy exits non-zero, the output names the failed phase and (for browser/transition faults) the offending step, no failure is reported as success, and no preview subprocess survives each run.

## Done When
- Every scenario above is satisfied, and `INT-002`, `E2E-001`, and `E2E-002` pass in the repository's automated suite with Chromium available; the source checkout is unchanged by the tests.
- Smoke mode (`--smoke`) is implemented, documented, and tested (passes against a registered presentation, fails on an empty registry/unknown slug/console error), while default mode stays strict about the canonical sample.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass; `npm run inspect -- how-to-make-a-presentation` writes one screenshot per step under the documented ignored artifact directory and prints its (advisory) diagnostics.
- `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` are project-agnostic and self-contained (only Node built-ins, `playwright`, and project files) so they can be copied into a bootstrap template unchanged.
- Run the inspect script on the reference sample, review any warnings, and use `chrome-devtools-axi` (`snapshot` plus screenshots) on the first, last, and a dense step to confirm the helper's output matches what is visible. Fix real sample issues surfaced this way (collisions, indistinct active chrome, unpolished attribution), marking only genuinely intentional readable overlaps with the allow-overlap marker.
- `.gitignore` excludes inspection artifacts; no screenshots, build output, or CI configuration are committed.
