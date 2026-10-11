# Task: Add the project-local screenshot inspection helper with advisory visual warnings

## Goal

Add `scripts/inspect-presentation.mjs` and `npm run inspect -- <slug>`: a project-local helper
that drives a production preview in Chromium, captures one settled screenshot per step of a
registered presentation into a predictable project-local directory, and prints advisory
warnings for suspicious text/chrome collisions, visually indistinct active navigation, and
unpolished attribution. It gives agents and humans the visual-composition evidence that
build/render verification cannot, and it is later shipped in scaffolded projects. Then use it
on the committed reference sample and resolve what it reports.

## Background

Read `openspec/changes/create-and-scene/design.md` ("Verification" — the paragraph on the
project-local screenshot helper — and "Styling") and
`openspec/changes/create-and-scene/test-plan.md` (INT-002).

### Existing repository state

- `src/presentation-kit/` is the style-neutral scene kit; `src/presentations/index.ts` is the
  explicit registry (`{ slug, title, load }`, slug as a string literal) routed at `/<slug>` by
  `src/main.tsx`. The committed reference sample is `how-to-make-a-presentation`, styled by its
  own plain CSS in `src/presentations/how-to-make-a-presentation/`.
- Kit DOM hooks the helper must rely on (never DOM structure):
  `[data-presentation-root]` with `data-step-count`, `data-step-index` (0-based),
  `data-step-id`, `data-presentation-mode`; chrome `[data-presentation-header]`,
  `[data-presentation-footer]`, `[data-presentation-title]`, `[data-presentation-caption]`,
  `[data-presentation-marker]`, `[data-presentation-toc]`/`[data-presentation-toc-item]`,
  `[data-presentation-progress]`/`[data-presentation-progress-item]`,
  `[data-presentation-prev]`, `[data-presentation-next]`, `[data-presentation-attribution]`;
  scene `[data-presentation-canvas]`, `[data-presentation-node]`,
  `[data-presentation-entity]`; active progress/ToC items carry `aria-current="step"` and
  `data-presentation-active="true"`. The intentional-overlap marker is the author-set
  attribute `data-presentation-allow-overlap` on a subtree. `ArrowRight` advances a step.
- `scripts/verify.mjs` (`npm run verify`) already builds the app, starts `vite preview` on
  `127.0.0.1` with a free port and readiness probe, drives Playwright Chromium, and tears the
  preview down. Reuse that lifecycle — extract shared code into a module under `scripts/lib/`
  if it helps — but keep `npm run verify` behavior and output unchanged, keep the scripts free
  of repository-specific constants (they are copied verbatim into a bootstrap template), and
  keep `npm run verify` passing.
- `npm run test:integration` runs browser/subprocess suites (`tests/integration/`,
  `tests/e2e/`) via `vitest.integration.config.ts`; create the script/config if absent and
  keep them out of `npm test`.

### Decisions for the helper

- CLI: `node scripts/inspect-presentation.mjs <slug> [--viewport <W>x<H>] [--settle <ms>] [--out <dir>] [--no-build]`;
  add `"inspect": "node scripts/inspect-presentation.mjs"`. Defaults: desktop viewport
  `1440x900`, a settle interval longer than the kit's longest enter delay + transition (read
  the kit constants), output `artifacts/inspect/<slug>/<viewport>/step-NN.png` (1-based,
  zero-padded). Add `artifacts/` to `.gitignore`. Unknown slugs and operational failures exit
  non-zero; warnings alone exit `0` (they are advisory, not pass/fail evidence).
- Preview and browser URLs use `127.0.0.1` only. Always stop the preview and browser.
- Settling: after each step change, wait until `data-step-index` reflects the target step,
  then wait the settle interval (optionally also for running Web Animations to finish) before
  capturing.
- Warnings print as `WARN step <n> (<id>) <kind>: <detail>` with kinds `overlap`,
  `active-chrome`, `attribution`, followed by a summary count. Also write a machine-readable
  `report.json` (per step: index, id, screenshot path, warnings) next to the screenshots.
- **overlap**: among visible elements that render their own text plus chrome elements, report
  pairs whose bounding boxes intersect beyond a small tolerance, excluding ancestor/descendant
  pairs and any element inside a `[data-presentation-allow-overlap]` subtree. Identify each
  element by its hook and a short text excerpt.
- **active-chrome**: compare computed visual styles (e.g. color, background, border, outline,
  box-shadow, opacity, font weight, size/transform) of the active progress item and active ToC
  entry against an inactive sibling; warn when they are indistinguishable.
- **attribution**: warn when `[data-presentation-attribution]` is missing, renders smaller than
  a legibility threshold (e.g. under 11 px font size), or still shows browser-default link
  styling (default link color with default underline); the message must name the
  `[data-presentation-attribution]` hook as the place to style it.

### Fixtures for INT-002

Keep fixtures out of the shipped registry: put controlled fixture presentations under
`tests/fixtures/` and have the integration test build a disposable copy of the app under the
OS temp dir (sources copied, `node_modules` symlinked from the checkout) with the fixtures
registered. Suggested fixtures: a *defective* presentation with ≥3 steps containing one step
with an unmarked text collision, one step with an explicitly marked readable overlap, no active
chrome styling, and default attribution; and a *clean* presentation with distinct active chrome
and polished attribution, to prove there are no false positives. Include a newcomer entity whose
final, settled appearance is distinguishable in the PNG (or in recorded metadata) so the test
can prove capture happened after the transition settled.

## Test Plan

- `INT-002` — Screenshot helper emits faithful artifacts and advisory warnings. Run the helper
  against the controlled fixture presentations in a disposable app copy through every step.
  Completion signal (in `tests/integration/`, run by `npm run test:integration`): exactly one
  predictable screenshot per step exists at the documented path; captures reflect the settled
  post-transition state; the unmarked collision, indistinct active state, and attribution
  defect each produce warnings naming the correct step; the explicitly allowed overlap produces
  no overlap warning; the clean fixture produces no warnings; the helper exits `0` with
  warnings and non-zero for an unknown slug; and the source checkout is unchanged.

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

### Helper's portion of the generated-presentation quality bar (from `presentation-skill`)

This task delivers the project-local helper and applies its review loop to the committed
reference sample; the skill's instructions for using it are written elsewhere.

#### Scenario: Screenshot helper is project-local
- **WHEN** the skill captures screenshots for visual inspection
- **THEN** it uses the scaffolded project-local helper when available, or otherwise writes any temporary Playwright helper under the project root

#### Scenario: Visual warnings are reviewed
- **WHEN** the screenshot helper emits overlap or chrome-polish warnings
- **THEN** the skill reviews the referenced steps, fixes accidental collisions or indistinct current-step chrome, and marks only intentional readable overlaps as allowed

## Done When

- `npm run inspect -- how-to-make-a-presentation` writes nine settled screenshots plus
  `report.json` under `artifacts/inspect/how-to-make-a-presentation/1440x900/`, and a
  `--viewport 390x844` run writes the narrow set; `artifacts/` is gitignored.
- Every warning reported for the reference sample at both viewports has been reviewed: accidental
  collisions and chrome-polish defects are fixed in the sample's own CSS/steps (never in
  `src/presentation-kit/`), and only genuinely intentional, readable overlaps carry
  `data-presentation-allow-overlap`. The final runs report zero warnings, or any remaining
  warning is a documented, reviewed false positive.
- `INT-002` passes via `npm run test:integration`.
- `scripts/inspect-presentation.mjs` (and any `scripts/lib/` module) contains no
  repository-specific slugs or text.
- `npm test`, `npm run lint`, `npm run build`, `npm run verify`, and
  `npm run test:integration` all pass.
- Using `chrome-devtools-axi` on a `127.0.0.1` production preview, spot-check the first, last,
  and densest sample steps at wide and narrow viewports and confirm they match the helper's
  screenshots and verdicts. No screenshots are committed.
