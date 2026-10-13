# Task: Project-local screenshot and visual-diagnostics helper

## Goal
Add `scripts/inspect-presentation.mjs` and `npm run inspect -- <slug>`: a project-local helper that captures
settled per-step screenshots from a production preview and prints advisory visual-quality warnings (text/chrome
overlap, indistinct active navigation, unpolished attribution). The skill's visual-composition check relies on it
instead of ad hoc scripts, so browser tooling resolves from local dependencies.

## Background
Already in the repo: the scene kit with stable hooks, router/registry/landing, the committed sample
`how-to-make-a-presentation`, `playwright` as a dependency, `scripts/verify.mjs`, and `npm run test:e2e`.
Read `scripts/verify.mjs` and reuse its approach for starting `vite preview` on `127.0.0.1`, readiness polling,
and cleanup (extract shared helpers into a small local module under `scripts/` only if both scripts and their
bootstrap template copies can stay self-contained and aligned).

Rules: `127.0.0.1` for preview and browser URLs. No CI config. Screenshots are inspection artifacts and **must
not be committed**: write them under `.inspection/<slug>/step-NN.png` (two-digit, one-based `NN`) and add
`.inspection/` to `.gitignore`. Warnings are advisory: they never change the exit code (exit non-zero only for
real failures such as an unreachable route, missing step-count/step-index hooks that prevent traversal, or a crash; a missing attribution link is an advisory warning, not a failure).

Package script: `"inspect": "node scripts/inspect-presentation.mjs"` so `npm run inspect -- how-to-make-a-presentation` works.
Options: slug positional; `--settle <ms>` (default that comfortably exceeds the kit's morph + enter timing —
derive from the kit's timing constants rather than guessing); `--viewport <WxH>` (default standard desktop
1440x900; a narrow value such as 390x844 must work); `--build` or reuse existing `dist` (build if `dist` is
missing). Add `test:integration` (a Vitest config/directory such as `tests/integration/`, kept out of the
default `npm test`) if it does not exist yet.

Hooks to rely on (exact spellings): `data-step-count`/`data-step-index` on the chrome root; `data-presentation-title`,
`data-presentation-caption`, `data-presentation-progress-item`, `data-presentation-toc-item`,
`data-presentation-prev`, `data-presentation-next`, `data-presentation-attribution`, `data-presentation-stage`;
`data-presentation-active="true"` + `aria-current` on active nav; and the subtree marker
`data-presentation-allow-overlap` that exempts elements inside it from overlap warnings.

Diagnostic definitions (choose sensible thresholds; make them named constants):
- **Overlap**: any pair of visible text-bearing elements or chrome elements whose bounding boxes intersect by more than a small tolerance, unless either lies inside a `data-presentation-allow-overlap` subtree. Print `step <n>: overlap between <selector/text A> and <selector/text B>`.
- **Indistinct active chrome**: compare computed visual style (color, background, border, opacity, font-weight, outline/box-shadow, size/transform) of the active progress item / active ToC entry against an inactive sibling; warn when no meaningful difference exists. Name the affected chrome.
- **Unpolished or missing attribution**: warn (advisory, step-specific) when the attribution link is absent from a step, and also warn when the attribution link's computed font size is too small (e.g. under ~11px), or its style is browser-default (default link blue/underline with no author styling), or it is clipped/invisible. Message points to the `data-presentation-attribution` styling hook.
Each warning line begins with `WARN` and identifies step number and elements so tests can match it.

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
This integration obligation first becomes executable here; implement it as an automated test run by `npm run test:integration`.

### INT-002: Screenshot helper emits faithful artifacts and advisory warnings
- Covers: Project-local screenshot capture, settled transitions, overlap exemptions, active-navigation diagnostics, and attribution diagnostics.
- Boundary: The project-local inspection script drives a production preview in Chromium and writes screenshots plus diagnostics to the filesystem.
- Setup: Use a controlled registered test presentation with multiple steps and variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution.
- Action: Run the inspection helper through every step after the configured settle interval.
- Assertions: One predictable screenshot is written per step; captures occur only after transitions settle; the unmarked collision, indistinct active state, and attribution defect produce step-specific advisory warnings; and the explicitly allowed readable overlap does not produce an overlap warning.
- Execution: Run in the repository's browser-backed integration suite on every pull request with Chromium available.


Implementation notes for INT-002: register a controlled test presentation (a fixture used only by the test,
in a temp copy of the app or a test-only registry entry that is not shipped in the real registry) with several
steps and variants containing (a) an unmarked text collision, (b) an overlap inside a
`data-presentation-allow-overlap` subtree, (c) active chrome styled identically to inactive chrome, and (d)
default/tiny attribution. Verify one `step-NN.png` per step exists, the diagnostics are step-specific, the
allowed overlap yields no overlap warning, and settle behavior (e.g. a step with a slow animation whose capture
must reflect the settled state, or assert the helper waits at least the settle interval between navigation and
capture). Use the sample presentation as the clean baseline: it should emit no warnings.

## Done When
- `npm run inspect -- how-to-make-a-presentation` writes nine screenshots under `.inspection/how-to-make-a-presentation/`, prints advisory warnings (none expected for the sample; fix the sample's CSS if the helper finds a real defect), and exits zero; `.inspection/` is git-ignored.
- All `Visual inspection artifacts` scenarios hold; warnings do not affect the exit code; real failures do.
- INT-002 passes via `npm run test:integration`.
- Use `chrome-devtools-axi` and the helper to confirm the sample's first, last, and dense steps and one narrow-viewport run look right.
- `npm test`, `npm run lint`, `npm run build`, `npm run verify` pass.
