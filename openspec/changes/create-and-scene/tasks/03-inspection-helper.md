# Task: Project-Local Screenshot and Visual-Diagnostics Helper

## Goal
Add `scripts/inspect-presentation.mjs`, exposed as `npm run inspect -- <slug>`, a project-local helper that captures one settled screenshot per step from a production preview and prints advisory warnings for suspicious text/chrome overlap, indistinct active navigation, and unpolished attribution — so the skill (and humans) can review visual composition without ad hoc scripts outside the project tree.

## Background
The scene kit, pathname router, registry (`src/presentations/index.ts`), and reference sample at `/how-to-make-a-presentation` exist, as does `scripts/verify.mjs` (build + `vite preview` on `127.0.0.1` + Playwright Chromium; reuse its patterns for free-port selection, readiness probing, and guaranteed subprocess/browser cleanup, but keep the helper standalone). Playwright and Vitest are dev dependencies; `npm test` excludes `*.browser.test.ts` and `npm run test:browser` runs only them (add either script like that if missing). Read `design.md` ("Verification", last paragraph about the screenshot helper) and use TDD for the pure analysis functions.

Decisions:
- Usage: `npm run inspect -- <slug> [--out <dir>] [--settle <ms>] [--viewport <WxH>] [--no-build]`. Default viewport is a standard desktop size (1280 × 800); a narrow viewport (e.g. `--viewport 390x844`) must work. By default the helper builds if no `dist/` exists (or when asked), serves `vite preview` bound to `127.0.0.1`, and opens `http://127.0.0.1:<port>/<slug>`.
- Artifacts: written under the predictable project-local directory `.inspection/<slug>/step-NN.png` (zero-padded, one-based `NN`, e.g. `step-01.png`); add `.inspection/` to `.gitignore`. Screenshots are never committed.
- Settling: after each navigation (`ArrowRight`, confirmed via `data-step-index`), wait a configurable settle interval (default long enough for the kit's morph + enter timings) before capturing; the first step is also captured only after settle.
- Hooks it relies on (see vocabulary below): `data-step-count`, `data-step-index`, `data-presentation-progress-item`, `data-presentation-toc-item`, `data-presentation-active`, `aria-current="step"`, `data-presentation-attribution`, `data-presentation-allow-overlap`.
- Advisory warnings are printed to stdout with the step number, a warning kind (`overlap`, `active-chrome`, `attribution`), and the involved elements (tag, text snippet, or selector). Warnings never change the exit code (screenshots/warnings are inspection artifacts, not pass/fail evidence); the exit code is non-zero only for operational failure (unknown slug, preview failure, browser crash). Implement the geometry analysis as pure functions over serialized element rects/styles (unit tested) with a thin in-page collector.
  - Overlap: visible text-bearing elements and presentation chrome whose rects intersect (beyond a small tolerance) without being in an ancestor/descendant relationship, excluding any element inside a `data-presentation-allow-overlap` subtree.
  - Indistinct active chrome: compare computed visual style (color, background, border, opacity, font-weight, size, transform, outline) of the `data-presentation-active` progress item / TOC entry versus its inactive siblings; warn when no meaningful difference exists.
  - Unpolished attribution: warn when `[data-presentation-attribution]` is missing, rendered below a minimum font size/hit area, or still has browser-default link styling (default link color and underline with default font), pointing authors to the `[data-presentation-attribution]` styling hook.
- A short section in `README.md` documents the command, output directory, and warning kinds.

Shared hook and script vocabulary (the design fixes only the `data-step-count` / `data-step-index` hooks and the file paths/commands; the rest was chosen while planning so independent work stays compatible, and must be used verbatim):
- Chrome root element exposes `data-step-count` (total steps) and `data-step-index` (zero-based active index).
- Mode: `data-presentation-mode="present"` or `"browse"` on the chrome root.
- Progress indicators: `data-presentation-progress-item`; table-of-contents entries: `data-presentation-toc-item`. The one representing the active step also carries `aria-current="step"` and `data-presentation-active="true"`.
- Attribution link: `data-presentation-attribution` (text `made by and-scene`, bottom-right, links to the and-scene GitHub repository).
- Allow-overlap marker: `data-presentation-allow-overlap` on a subtree root; text/chrome overlap warnings are suppressed for elements inside it.
- Browser-backed vitest files are named `*.browser.test.ts`; `npm test` runs `vitest run` excluding them and `npm run test:browser` runs only them.

Do not add `.github/workflows/` or other CI config. Do not commit screenshots or build output.

## Spec
Canonical requirement for capability `presentation-verification` (copied verbatim):

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

Related requirement fragments from `presentation-skill` that the helper supports (verbatim):

### Requirement: Self-verify before reporting completion
Before reporting success, the skill SHALL confirm that the generated or modified presentation builds, renders without errors, and is visually coherent in a browser, fixing any failures itself. The render check SHALL at minimum render the presentation's first step without runtime or console errors; the full multi-step render check across every step is defined by the `presentation-verification` capability. The visual composition check SHALL inspect screenshots or an equivalent browser view of the first step, the last step, and any dense/key steps; responsive-sensitive presentations SHALL also be checked at a narrow viewport. When a project-local screenshot helper is available, the skill SHALL prefer it over ad hoc scripts outside the project tree so browser tooling resolves from local dependencies, settled screenshots are captured after animations complete, and advisory visual warnings can be reviewed.

#### Scenario: Checks run before done
- **WHEN** the skill finishes generating or modifying a presentation
- **THEN** it runs the build, at least a first-step render check, and a browser visual composition check before reporting completion

#### Scenario: Failures are fixed, not reported as success
- **WHEN** the build, render, or visual composition check fails
- **THEN** the skill fixes the issues and re-checks rather than reporting success

## Test Plan
Assigned obligation (copied verbatim from `test-plan.md`):

### INT-002: Screenshot helper emits faithful artifacts and advisory warnings
- Covers: Project-local screenshot capture, settled transitions, overlap exemptions, active-navigation diagnostics, and attribution diagnostics.
- Boundary: The project-local inspection script drives a production preview in Chromium and writes screenshots plus diagnostics to the filesystem.
- Setup: Use a controlled registered test presentation with multiple steps and variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution.
- Action: Run the inspection helper through every step after the configured settle interval.
- Assertions: One predictable screenshot is written per step; captures occur only after transitions settle; the unmarked collision, indistinct active state, and attribution defect produce step-specific advisory warnings; and the explicitly allowed readable overlap does not produce an overlap warning.
- Execution: Run in the repository's browser-backed integration suite on every pull request with Chromium available.

Implementation guidance: the browser-backed vitest file (`*.browser.test.ts`) uses a controlled fixture presentation that lives under test fixtures (e.g. `tests/fixtures/inspection-fixture/`) and is registered only in a throwaway copy/temp project created by the test — never in the shipping registry. Its steps contain: an unmarked text collision, an explicitly allowed overlap (inside `data-presentation-allow-overlap`), indistinct active progress/TOC chrome (no active styling), and an unstyled/tiny attribution. Run the helper through every step with a short settle interval and assert: exactly one `step-NN.png` per step with non-trivial file size; the step-specific advisory warnings (overlap on the colliding step only, active-chrome, attribution) appear in output keyed to step numbers; the allowed overlap produces no overlap warning; and capture occurs only after the transition settles (e.g. assert the helper's recorded capture time is at least the settle interval after the step-index change, or that a fixture step with a delayed entrance is fully visible in the screenshot/DOM at capture time).

## Done When
- `npm run inspect -- how-to-make-a-presentation` writes `.inspection/how-to-make-a-presentation/step-01.png` … `step-09.png`, prints its warnings (the reference sample should produce no unexplained overlap, active-chrome, or attribution warnings; fix the sample's styling or mark genuinely intentional overlaps with `data-presentation-allow-overlap` if it does), and exits 0.
- Narrow-viewport capture works (`--viewport 390x844`).
- Pure analysis unit tests pass under `npm test`; the INT-002 browser test passes under `npm run test:browser`; `npm run lint`, `npm run build`, and `npm run verify` still pass.
- `.inspection/` is git-ignored; no screenshots are committed.
- Inspect a few captured screenshots (first, last, dense) with the image viewer / `chrome-devtools-axi` to confirm they are settled and correct.
