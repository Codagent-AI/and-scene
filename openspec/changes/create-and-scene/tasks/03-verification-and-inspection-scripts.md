# Task: Verification and visual-inspection scripts

## Goal
Provide `npm run verify` (deterministic build + production-preview render check of the reference sample, with unambiguous pass/fail reporting) and `npm run inspect -- <slug>` (project-local per-step screenshot capture with advisory visual diagnostics), each covered by browser-backed automated tests including failure-injection against disposable copies of the repository.

## Background
Read `openspec/changes/create-and-scene/design.md` sections "Verification" and Decision 4, and `openspec/changes/create-and-scene/test-plan.md` for INT-002, E2E-001, E2E-002.

Repository: Vite + React 19 + TS app with the scene kit in `src/presentation-kit/` (see its `README.md` for the exact stable hooks), the explicit registry `src/presentations/index.ts`, and the committed sample `src/presentations/how-to-make-a-presentation/` (slug `how-to-make-a-presentation`; nine steps; its outline is exported from a plain data module under its `steps/` folder). `npm test` runs Vitest (unit tests in `src/`, browser-backed tests in `tests/integration/` and `tests/e2e/`). Add `playwright` as a devDependency (use the Chromium browser; document `npx playwright install chromium` in the README and have scripts fail with a clear message when Chromium is missing).

Fixed names and rules:
- Files: `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`; npm scripts `verify` (`node scripts/verify.mjs`) and `inspect` (`node scripts/inspect-presentation.mjs`, invoked as `npm run inspect -- how-to-make-a-presentation`).
- Hooks the scripts rely on (exposed by the kit): `data-step-count` and `data-step-index` on the chrome; `data-presentation-attribution` on the attribution link; `aria-current="step"` + `data-active="true"` on active progress indicators / ToC entries; `data-presentation-allow-overlap` as the explicit allow-overlap marker. Read the kit source/README for the remaining `data-presentation-*` hooks rather than guessing selectors.
- Always use `127.0.0.1` (never `localhost`) for the `vite preview` host, the readiness probe, and every browser URL, so behavior is independent of IPv4/IPv6 resolution. Pick a free port (or accept `--port`) to allow parallel runs.
- Scripts must resolve all imports (Playwright) from project-local dependencies, run correctly regardless of caller cwd by resolving paths from the script location, and always tear down the preview subprocess (including on failure/timeout/SIGINT).
- Isolate the repository-specific "canonical sample outline" check (normative titles/captions/order of the nine steps) from the generic machinery (build, preview, stepping every step of a route, error capture, reporting) — put the outline data/check in its own module or config so a scaffolded copy of the scripts can omit it and instead smoke-render every registered presentation. Scripts must not import from anything that only exists in this repository's `src/presentations/` sample unless via that isolated module. Keep scripts dependency-light (Node built-ins + Playwright).

### verify.mjs behavior (design "Verification")
1. Run `npm run build` (`tsc -b && vite build`) over the whole app; any type/build error fails with the phase named `build`.
2. Assert the canonical nine-step sample is registered in `src/presentations/index.ts` and that every normative title and caption occurs in order (phase `sample`); missing or malformed/out-of-order sample fails.
3. Start `vite preview` on `127.0.0.1`, probe readiness on the same address, open the sample route in Chromium, read the step count from `data-step-count`, observe `data-step-index` for the first step, then press `ArrowRight` through every step confirming the index advances to each of the nine steps (phase `render`).
4. Any `console.error`, `pageerror`, or failed/non-advancing step transition fails and reports the failing step index.
5. Print a phase-by-phase report and a final clear PASS/FAIL line naming the failed phase(s); exit non-zero on any failure; exit zero only when every check passed. Failure to start preview or Chromium is a failure, never a skip.

### inspect-presentation.mjs behavior
Builds if `dist` is stale or missing (or accepts `--no-build`), serves a production preview on `127.0.0.1`, opens the presentation route for the given slug at a standard desktop viewport (e.g. 1440×900; allow `--width/--height` overrides for narrow-viewport checks), waits a configurable settle interval (default long enough for the kit's morph + `ENTER_DELAY` animations; `--settle <ms>`) after each navigation before capturing, and writes one screenshot per step to a predictable project-local, git-ignored directory such as `.inspection/<slug>/<viewport>/step-<NN>.png` (add the directory to `.gitignore`). It prints advisory warnings (exit 0 unless the script itself fails to run) identifying the step and elements for:
- visible text or chrome overlapping another visible text/chrome element, unless either element is inside a subtree marked `data-presentation-allow-overlap`;
- active progress indicator / active ToC entry visually indistinguishable from inactive ones (compare computed styles/colors/size/border/opacity of active vs inactive);
- attribution link too small (e.g. computed font-size below ~11px or tiny hit area) or browser-default styling (default link blue / underline with default font and no author styling), with a message pointing to the `data-presentation-attribution` styling hook.
Screenshots and warnings are inspection artifacts, not pass/fail evidence.

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

(The reference sample presentation already exists and is registered; this task implements the verification and inspection of it. The sample's own content is not to be redesigned here.)

## Test Plan
- `INT-002` Screenshot helper emits faithful artifacts and advisory warnings: a browser-backed Vitest test under `tests/integration/` that drives `scripts/inspect-presentation.mjs` against a controlled, multi-step test presentation (a fixture registered in a disposable copy/fixture app, never the committed registry) containing: an unmarked text collision, an explicitly allowed readable overlap, indistinct active chrome, and an unpolished attribution. Assert: one predictable screenshot per step; capture happens after the settle interval (e.g. a fixture step whose transition visibly finishes only after settle, or timing assertions); step-specific advisory warnings for the collision, indistinct active state, and attribution defect; no overlap warning for the marked overlap.
- `E2E-001` Reference presentation passes production verification: a test under `tests/e2e/` that runs `npm run verify` from the repository root (in the checkout or a clean copy with installed dependencies) and asserts exit code 0, clear PASS output, that all nine step indices were observed, and that the host/readiness probe/browser URL all use `127.0.0.1` (surface this in the script's output so the test can assert it).
- `E2E-002` Verification failures are actionable: a test under `tests/e2e/` that creates independent disposable copies (copy the repo sans `node_modules`/`dist`, symlink or reuse installed dependencies) and injects one fault per phase — a type error breaking `npm run build`; a missing sample and a reordered/altered sample title; a step that throws or logs `console.error` at runtime; a transition that does not advance `data-step-index` — and asserts each run exits non-zero, names the failed phase and (for browser/transition faults) the offending step index, never reports PASS, and leaves no preview process listening afterward. The source checkout must remain unchanged.

## Done When
- All Spec scenarios above are satisfied.
- `INT-002`, `E2E-001`, and `E2E-002` exist, pass, and run as part of `npm test`; each was observed failing before the corresponding behavior existed or against a deliberately broken script.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass from a clean `npm ci`; `npm run inspect -- how-to-make-a-presentation` writes nine screenshots under the git-ignored artifact directory and prints a warnings summary (or "no warnings").
- `package.json` has `verify`, `inspect`, and `playwright`; `.gitignore` covers inspection output; README documents the commands and Chromium install.
- Inspect representative output with `chrome-devtools-axi` and the screenshots (first, dense, last steps; narrow viewport) and review any advisory warnings emitted for the committed sample; fix genuine issues in the sample's CSS/markup.
