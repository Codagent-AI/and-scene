# Task: Project-local screenshot and visual-diagnostics helper

## Goal
Deliver `scripts/inspect-presentation.mjs` and the `inspect` npm script so that `npm run inspect -- <slug>` captures one settled screenshot per step of a registered presentation from a production preview and prints advisory warnings for suspicious text/chrome overlap, indistinct active navigation, and unpolished attribution. This is the project-local helper agents use for the visual composition check; its output is inspection evidence, not an automated pass/fail gate.

## Background
The app is a Vite + React + TypeScript app with a style-neutral scene kit at `src/presentation-kit/`, a pathname router (`/<slug>`), and an explicit registry at `src/presentations/index.ts`. The kit exposes stable hooks you must target rather than DOM structure: `data-step-count` and `data-step-index` on the chrome, `aria-current` plus an active-state hook on the active progress indicator and ToC entry, and a stable attribution hook on the "made by and-scene" link (all in the `data-presentation-*` family; read the kit source, especially any hook-constants module, for the exact names). A `scripts/verify.mjs` build-and-render gate and the reference sample `how-to-make-a-presentation` (nine steps) may already exist; if so, reuse its conventions (preview startup on `127.0.0.1`, readiness probe, Chromium via Playwright, subprocess cleanup) rather than inventing new ones. If `playwright` is not yet in `devDependencies`, add it. Read `CLAUDE.md` and `AGENTS.md` for workflow rules (TDD, `127.0.0.1` only, no committed screenshots or build output, no CI config).

Fixed names and behavior:
- Command: `npm run inspect -- how-to-make-a-presentation` (slug is the argument) → `scripts/inspect-presentation.mjs`.
- Production preview via `vite preview` bound to `127.0.0.1`; browser URLs use `127.0.0.1`. The helper should reuse an existing build in `dist/` or build first (state which; building first when `dist/` is missing or stale is preferred). Always clean up the preview subprocess and browser, including on failure.
- Standard desktop viewport (e.g. 1280 × 800; also allow a narrow-viewport option such as `--viewport 390x844` or `--narrow` for responsive-sensitive presentations).
- Screenshots go under a predictable project-local artifact directory, e.g. `.presentation-inspect/<slug>/step-<NN>.png` (zero-padded, one per step, plus a viewport suffix or subfolder if a narrow pass is requested). Add that directory to `.gitignore`. Never commit screenshots.
- A configurable settle interval (flag and/or env var, with a sensible default that exceeds the kit's transition time constants `LAYOUT_T`/`ENTER_T`/`ENTER_DELAY`) is awaited after each step transition before capturing; step index is confirmed through `data-step-index` before capture. Step count comes from `data-step-count`.
- Allow-overlap marker: define an explicit attribute authors place on a subtree to exempt elements inside it from overlap warnings, using the `data-presentation-*` naming family (e.g. `data-presentation-allow-overlap`). Document the exact name in the script's header comment/`--help` output so a skill document can cite it. Do not make the kit apply the marker by default.
- Diagnostics (all advisory: print to stdout/stderr with the step index and element descriptors; exit zero unless the helper itself fails to run, e.g. cannot capture):
  - Overlap: visible text-bearing or chrome elements whose bounding boxes intersect another visible text/chrome element without an allow-overlap ancestor ⇒ warning naming the step and both elements.
  - Indistinct active chrome: compare computed styles (e.g. color, background, border, opacity, font-weight, transform/size) of the active progress indicator/ToC entry versus inactive siblings; visually identical ⇒ warning naming the affected chrome.
  - Attribution: the attribution link absent-of-styling (browser-default color/underline/font-size equivalent), or smaller than a sensible minimum font size/tap size ⇒ warning that points authors to the attribution styling hook by name.
- The script must run from the project root of whatever project it lives in (resolve paths from the project root, not the caller's cwd), and its logic must not depend on repository-specific presentation content, because a bootstrap template will carry an aligned copy for freshly scaffolded projects. Keep dependencies to what a scaffolded project has (`playwright`, `vite`).
- Make the helper testable against a controlled fixture: support a way to point it at a project directory/preview other than the repository's own sample (e.g. `--root <dir>` and/or `--base-url`), so a test can run it against a temporary fixture app.

## Spec
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
- `INT-002` (Screenshot helper emits faithful artifacts and advisory warnings): boundary is the project-local inspection script driving a production preview in Chromium and writing screenshots plus diagnostics to the filesystem. Build a controlled registered test presentation with multiple steps (test fixture app under e.g. `tests/fixtures/` that uses the kit via the canonical source, built and previewed by the test) and variants that contain: an unmarked text collision, an explicitly allowed readable overlap (marked with the allow-overlap attribute), indistinct active chrome, and unpolished (browser-default/tiny) attribution — plus a clean variant. Run the helper through every step with a short settle interval. Assert: one predictable screenshot file per step is written; captures occur only after transitions settle (e.g. verify capture happens after the settle delay, using timing instrumentation or a step whose transition completes only after a known delay, and that screenshots are not mid-transition); the unmarked collision, indistinct active state, and attribution defect each produce a warning naming the step (and elements/chrome); the allowed overlap produces no overlap warning; the clean variant produces no warnings; and preview/browser processes are cleaned up. Implement as a Vitest browser-backed integration test (e.g. `tests/integration/`) included in `npm test` (needs Chromium available; use a long timeout).
- Unit tests for pure diagnostic helpers (rect intersection, style-distinctness comparison, size thresholds) are your call.

## Done When
- `npm run inspect -- how-to-make-a-presentation` (when the sample exists) or any registered slug writes one settled screenshot per step under the predictable ignored artifact directory and prints advisory warnings in the formats above; a narrow-viewport mode is available.
- The allow-overlap marker name and the settle-interval option are documented in the script and discoverable via `--help`.
- `INT-002` passes as an automated test within `npm test`.
- `npm test`, `npm run lint`, `npm run build`, and (if present) `npm run verify` pass; `.gitignore` excludes the artifact directory; no screenshots are committed.
- Run the helper on a real presentation and review a few screenshots with the Read tool plus a quick `chrome-devtools-axi` snapshot to confirm the screenshots show settled steps and that warnings are accurate (no obvious false positives from kit-internal hidden elements).
