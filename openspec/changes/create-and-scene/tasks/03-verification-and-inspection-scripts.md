# Task: Production verification gate and screenshot inspection helper

## Goal
Deliver `npm run verify` (`scripts/verify.mjs`), the deterministic build-and-browser-render gate that proves the whole app and the reference sample work, and `npm run inspect` (`scripts/inspect-presentation.mjs`), the project-local screenshot and visual-diagnostics helper, with the browser-backed automated tests that prove both behave correctly, including on failure.

## Background
The scene kit (`src/presentation-kit/`), host shell (`src/main.tsx`, `src/Landing.tsx`), registry (`src/presentations/index.ts`), and the committed sample `how-to-make-a-presentation` already exist. The kit's chrome exposes `data-step-count` and `data-step-index` on one root element (plus `data-presentation-mode`), `aria-current="step"` and `data-presentation-active="true"` on active progress items and TOC entries, `data-presentation-attribution` on the attribution link, and `data-presentation-allow-overlap` as the explicit exempt-subtree marker. Read `src/presentation-kit/README.md` for the exact hook list and use those names; do not invent parallel ones.

Design decisions (from `design.md`) for `npm run verify` → `scripts/verify.mjs`:
1. Run `npm run build` (`tsc -b && vite build`) over the whole app. Any type or build error fails verification at the "build" phase.
2. Assert the canonical nine-step sample is present in `presentations/index.ts` (registered under slug `how-to-make-a-presentation`) with every normative title and caption in order. The titles and captions are in the Committed reference sample requirement below. Choose a mechanism (for example checking the rendered title and caption of each step in the browser in present and browse mode, or reading a shared expectations module); a missing, unregistered, or out-of-order sample fails at the "sample" phase.
3. Start `vite preview` on `127.0.0.1` (explicit `--host 127.0.0.1` and a free port), probe readiness on `127.0.0.1`, then drive Chromium with Playwright against `http://127.0.0.1:<port>/how-to-make-a-presentation`. Read the step count from `data-step-count`, then press `ArrowRight` through every step, checking that `data-step-index` advances each time. The host, readiness probe, and browser URL must all use `127.0.0.1`, never `localhost`.
4. Any `console.error`, `pageerror`, or failed step transition (the index did not advance) fails the "render" phase and reports the failing step index.
5. Print a clear PASS or FAIL summary that names the failed phase (and step for browser faults), exit non-zero on failure, and always terminate the preview subprocess and browser, including on failure or interruption.

Portability constraint: both scripts are later copied verbatim into a scaffold template used in brand-new projects that do NOT contain the nine-step sample. Keep them free of hard-coded paths to this repository's layout beyond conventional project structure (`package.json`, `src/presentations/index.ts`, `vite preview`). Put the reference-sample expectations (slug, titles, captions) in clearly separated data (for example `scripts/reference-sample.json`) that the "sample" phase applies only when such a data file is present, so the same verify script, when copied into a project without it, verifies the build and renders every registered presentation's first step and steps instead of failing on a missing sample. In THIS repository the data file is present, so a missing sample fails. Keep the two behaviors unambiguous and tested.

Inspection helper design → `npm run inspect -- <slug>` runs `scripts/inspect-presentation.mjs`:
- Builds if needed and serves a production preview on `127.0.0.1`, opens the presentation route in Chromium at a standard desktop viewport (for example 1440 × 900; allow an optional narrow-viewport flag), and captures a screenshot of every step after a configurable settle interval (default long enough for the kit's layout and enter animations; expose as a flag/env) into a predictable project-local, git-ignored directory such as `.and-scene/screenshots/<slug>/step-01.png` (add it to `.gitignore`; screenshots must never be committed).
- Prints advisory warnings (does not fail on them; exits zero unless the capture itself fails) per step: unmarked visible text/chrome overlap, naming the step and both elements, with elements inside a subtree marked `data-presentation-allow-overlap` exempt; indistinct active navigation (active progress indicator or active TOC entry computing visually identical to inactive peers); and unpolished attribution (too small or browser-default link styling), pointing authors at the `data-presentation-attribution` styling hook.
- Resolves Playwright from project-local dependencies so it works when run by an agent from any working directory inside the project; add `playwright` as a devDependency, and `verify`, `inspect`, `test:integration` scripts to `package.json`. Chromium installation (`npx playwright install chromium`) is documented in the README and invoked by the test setup if missing.
- `npm run inspect -- how-to-make-a-presentation` is the canonical invocation in `CLAUDE.md`.

Test layout: keep `npm test` fast (unit/contract). Add `npm run test:integration`, a Vitest configuration that runs browser-backed and subprocess tests under `tests/integration/` and `tests/e2e/`. Tests that mutate the repository MUST work on throwaway copies (copy the project without `node_modules` into a temp directory, symlink or install dependencies, and never touch the source checkout). Do not add CI configuration.

Use `127.0.0.1` throughout. Do not commit build output, dependency directories, or screenshots.

## Spec
(Capability: `presentation-verification`.)

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


## Test Plan
Assigned automated obligations (from `test-plan.md`):

- `INT-002` Screenshot helper emits faithful artifacts and advisory warnings. Boundary: the inspection script drives a production preview in Chromium and writes screenshots plus diagnostics to the filesystem. Setup: a controlled, registered test presentation (a fixture used only by the test, placed in a throwaway project copy so it is never registered in the real registry) with multiple steps and variants containing an unmarked text collision, an explicitly allowed overlap (inside `data-presentation-allow-overlap`), indistinct active chrome, and unpolished attribution. Action: run the helper through every step after the configured settle interval. Assertions: one predictable screenshot per step; captures occur only after transitions settle; the unmarked collision, indistinct active state, and attribution defect each produce step-specific advisory warnings; the allowed overlap produces no overlap warning. Runs in the browser-backed integration suite (`npm run test:integration`).
- `E2E-001` Reference presentation passes production verification. Surface: `npm run verify` from the repository root. Journey: invoke verification, let it build the app, start the preview on `127.0.0.1`, open the registered sample route, and advance through all nine steps using the public step hooks. Assertions: sample registered and reachable; all normative titles and captions occur in order; each of the nine step indices observed without console or page errors or failed transitions; host, readiness probe, and browser URL all use `127.0.0.1`; the command exits zero with a clear pass result.
- `E2E-002` Verification failures are actionable. Surface: `npm run verify` run in independent throwaway copies of the repository, one representative fault per phase: a build-breaking edit, a missing or out-of-order sample, a step that emits a browser error, and a transition that does not advance the public step index. Assertions: every faulty copy exits non-zero; output names the failed phase and, for browser/transition faults, the offending step; none is reported as success; preview subprocesses are cleaned up after each run (verify no listener remains on the port).

## Done When
- `npm run verify` passes on the repository (build, nine-step sample assertion, every step rendered via the production preview at `127.0.0.1`) and prints a clear pass result; it exits non-zero with a phase-naming message for each fault class in `E2E-002`.
- `npm run inspect -- how-to-make-a-presentation` writes one settled screenshot per step under the git-ignored artifact directory and prints advisory warnings per the scenarios; `INT-002`, `E2E-001`, and `E2E-002` pass via `npm run test:integration`; `npm test`, `npm run lint`, and `npm run build` also pass.
- The scripts contain no dependency on the sample being present when the reference-sample data file is absent (checked by a test that runs verify against a throwaway project without it, or equivalent), so they can be copied unmodified into a scaffold.
- You ran the inspection helper and `chrome-devtools-axi` against the sample and reviewed any warnings it raises (fixing accidental issues in the sample's presentation-local CSS, or marking only genuine intentional overlaps).
