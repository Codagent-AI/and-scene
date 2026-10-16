# Task: Add production verification and screenshot inspection

## Goal
Deliver `npm run verify` (`scripts/verify.mjs`: whole-app build plus real-browser render check of the reference sample over `vite preview` on `127.0.0.1`, with unambiguous pass/fail reporting) and `npm run inspect -- <slug>` (`scripts/inspect-presentation.mjs`: settled per-step screenshots plus advisory visual warnings), together with the automated tests that prove both, including failure behavior.

## Background
You MUST read `design.md` sections "Verification" and "Decisions" 4 (Playwright over `vite preview`), and the three spec files' relevant requirements (copied below). Existing pieces: the scene kit in `src/presentation-kit/` exposes the hooks `data-step-count` and `data-step-index` on the chrome root, `data-presentation-*` hooks (`data-presentation-chrome`, `data-presentation-mode`, `data-presentation-progress` / `-progress-item`, `data-presentation-toc` / `-toc-entry`, `data-presentation-prev`, `data-presentation-next`, `data-presentation-attribution`, `data-presentation-allow-overlap`) and active-state markers `aria-current="step"` + `data-presentation-active="true"`; the sample presentation `how-to-make-a-presentation` is registered in `src/presentations/index.ts` and routed at `/how-to-make-a-presentation`. Read the kit and sample first. The repo has Vitest (`npm test`) and ESLint; Playwright is not yet a dependency.

Dependencies / scripts: add `playwright` (devDependency; commit lock data), add `"verify": "node scripts/verify.mjs"` and `"inspect": "node scripts/inspect-presentation.mjs"` to `package.json`, and document installing Chromium (`npx playwright install chromium`) in the README. Add the inspection artifact directory to `.gitignore` (screenshots must never be committed). Use `.inspection/<slug>/step-NN.png` (zero-padded one-based `NN`) as the predictable project-local artifact path, and a configurable `--settle` interval in milliseconds (default long enough for the kit's longest morph + enter delay; read from the kit constants or a sane default such as 1200).

Key decisions:
- Everything uses `127.0.0.1` — the `vite preview` host (`--host 127.0.0.1` with an explicit port), the readiness probe, and every browser URL. Never `localhost`.
- `scripts/verify.mjs` phases, each named in its output so failures are attributable: (1) `build` — `npm run build` over the whole app; non-zero exit fails. (2) `sample` — assert the committed nine-step reference sample is present in `src/presentations/index.ts` with every normative title and caption in order. (3) `preview` — start `vite preview` on 127.0.0.1 and wait for readiness. (4) `render` — Playwright Chromium opens `/how-to-make-a-presentation`, reads step count from `data-step-count`, advances with `ArrowRight` through every step checking `data-step-index` advances by one; any `console.error`, `pageerror`, or failed transition fails and reports the failing step index. (5) Always clean up the preview subprocess (including on failure and signals). Exit 0 with a clear PASS line only if every phase passes; exit non-zero with a `FAIL` line naming the phase (and offending step for browser/transition faults) otherwise.
- Make the scripts generic enough to be reused by the skill's bootstrap template (they are also copied verbatim into `skills/presentation/templates/bootstrap/scripts/`; CLAUDE.md requires the root copies stay aligned with the template copies). Do this by driving verification from a small data file, `scripts/verification.config.json`, listing the presentations to verify as `{ "slug": string, "expectedSteps"?: [{ "title": string, "caption": string }] }`; this repo's config lists the sample with its nine normative titles/captions, and `expectedSteps` triggers the order/content check (a missing or out-of-order sample fails). Verification checks exactly the entries listed in the config (the skill appends an entry for each new presentation it creates), so also support an optional `--slug <slug>` flag that restricts the render phase to that entry (still running the build phase) for fast iteration, and fail clearly if a slug is not in the config or registry. The scripts themselves must not hard-code this repo's sample, must resolve all paths from the project root (the directory that contains the script's parent), not from the caller's working directory, and must resolve `playwright`/`vite` from the project's local `node_modules`.
- `scripts/inspect-presentation.mjs <slug> [--settle ms] [--out dir] [--viewport WxH]`: builds if `dist/` is stale or missing (or accepts `--no-build`), serves a production preview on 127.0.0.1, opens the route at a standard desktop viewport (default 1440×900; a `--viewport` such as `390x844` supports the narrow pass), steps through every step, waits the settle interval after each navigation before capturing, and writes one screenshot per step. It prints advisory warnings (never non-zero exit for warnings; non-zero only for real operational errors such as a missing slug) naming the step and elements:
  - suspicious overlap: visible text or chrome elements (the `data-presentation-*` chrome plus text-bearing scene elements) whose boxes intersect other visible text/chrome, excluding any element inside an ancestor with `data-presentation-allow-overlap`;
  - indistinct active chrome: computed style of the active progress item / ToC entry (`aria-current="step"`) not visibly different (color, background, border, opacity, font-weight, size/transform) from its inactive siblings;
  - unpolished attribution: `data-presentation-attribution` missing, rendered below a small readable size (e.g. under 11px), or still browser-default (default link color + underline with default font) — message must point authors to the `data-presentation-attribution` styling hook.
  Keep the pure detection logic in importable functions so it can be unit tested.
- Test fixtures: INT-002 needs a controlled registered test presentation with variants (unmarked text collision, explicitly allowed overlap, indistinct active chrome, unpolished attribution). Keep the fixture under `tests/fixtures/` and exercise it from a throwaway copy or by letting the test harness temporarily add a registry entry in a temp copy of the repo — the real `src/presentations/index.ts` must not register fixtures. Put browser-backed tests in `tests/integration/` and `tests/e2e/` (Vitest; long timeouts) and make sure they all run under `npm test`. Tests that mutate the project must do so in disposable copies (e.g. `fs.cp` of the repo without `node_modules`/`dist`, symlinking or reusing `node_modules`) and leave the source checkout unchanged.
- `README.md`: document `npm run verify`, `npm run inspect -- how-to-make-a-presentation`, and the Chromium prerequisite.

## Spec
Copied from `specs/presentation-verification/spec.md` (the committed-sample requirement's table is owned by the reference-sample work, but the check against it belongs here):

### Requirement: Build verification
Verification SHALL build the whole application — all presentations plus the index — and fail if the build does not succeed.

#### Scenario: Build must succeed
- **WHEN** verification runs
- **THEN** it builds the whole app and fails if `npm run build` reports any type or build error

### Requirement: Committed reference sample (verification portion)
#### Scenario: Sample exists and matches the outline
- **WHEN** verification runs
- **THEN** it confirms the committed reference sample presentation exists, is registered/reachable, and implements the nine steps above in order (titles and captions exactly as in the sample's content contract: `src/presentations/how-to-make-a-presentation/` and `specs/presentation-verification/spec.md`)

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
Assigned from `test-plan.md` (read it for the full definition). Unit cases (pure warning detectors, config parsing, step-assertion helpers) are your own decision.

- **INT-002 — Screenshot helper emits faithful artifacts and advisory warnings.** Boundary: the inspection script drives a production preview in Chromium and writes screenshots + diagnostics. Setup: a controlled registered test presentation with multiple steps and variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution. Action: run the helper through every step after the configured settle interval. Assert: one predictable screenshot per step; captures occur only after transitions settle (e.g. assert via timing/log that the settle wait precedes each capture, or that a deliberately slow transition is complete in the image/DOM state); the unmarked collision, indistinct active state, and attribution defect each produce step-specific advisory warnings; the explicitly allowed readable overlap produces no overlap warning. Runs in the browser-backed integration suite on every PR with Chromium available.
- **E2E-001 — Reference presentation passes production verification.** Surface: `npm run verify` from the repo root (the suite may invoke it in an isolated copy/checkout). Journey: build, preview on 127.0.0.1, open the registered sample route, advance through all nine steps via the hooks. Assert: sample registered and reachable; all normative titles/captions in order; each of the nine step indices observed without console/page errors or failed transitions; host, readiness probe, and browser URL all use `127.0.0.1`; exit code 0 with a clear PASS result.
- **E2E-002 — Verification failures are actionable.** Surface: `npm run verify` against independent disposable copies of the repo, each with one fault: a build-breaking edit; a missing or out-of-order sample; a step that emits a browser error (`console.error`); a transition that does not advance `data-step-index`. Assert: every faulty copy exits non-zero; output names the failed phase and, for browser/transition faults, the offending step; none is reported as success; preview subprocesses are cleaned up after each run (assert no leftover process listening on the chosen port). The source checkout stays unchanged.

## Done When
- `npm run verify` passes on the repository and prints a clear PASS; `npm run inspect -- how-to-make-a-presentation` writes `.inspection/how-to-make-a-presentation/step-01.png` … `step-09.png` and prints any advisory warnings (review them; fix real issues in the sample's presentation-local CSS or mark genuine intentional overlaps with `data-presentation-allow-overlap`).
- `npm run verify -- --slug <slug>` restricts the render phase to one configured presentation (unknown slug fails clearly), covered by a test.
- INT-002, E2E-001, and E2E-002 exist as automated tests, run under `npm test`, and pass. The `.inspection/` directory is git-ignored; no screenshots or build output are committed.
- `package.json` has `verify` and `inspect` scripts; `playwright` is a devDependency with updated lock data; README documents usage and the Chromium prerequisite.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass.
- Manually inspect with `chrome-devtools-axi` and the helper's screenshots: first, last, and dense steps at the desktop viewport and at a narrow viewport (`--viewport 390x844`).
