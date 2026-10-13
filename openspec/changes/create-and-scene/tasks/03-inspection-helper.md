# Task: Screenshot and visual-diagnostics helper

## Goal
Add `scripts/inspect-presentation.mjs` (`npm run inspect -- <slug>`), a project-local helper that captures one settled screenshot per step from a production preview and prints advisory warnings for suspicious overlaps, indistinct active chrome, and unpolished attribution, so authors and the skill can review visual composition.

## Background
You MUST read these before editing (all under `openspec/changes/create-and-scene/`):
- `design.md`: the last two paragraphs of "Verification" (screenshot helper), "Styling", and Decision 4.
- `specs/presentation-verification/spec.md`: "Visual inspection artifacts" (copied below).
- `specs/presentation-skill/spec.md`: "Generated presentation quality bar" scenarios on screenshot helper, visual warnings, and local styling of active chrome/attribution (context for how the helper is consumed).
- `test-plan.md`: `INT-002`.
- Repo `CLAUDE.md`: workflow, commands, AXI duties, change guidelines.

Already present in the repo: the style-neutral scene kit in `src/presentation-kit/` (chrome root exposes `data-step-count` / `data-step-index`; active progress/ToC items expose `aria-current="step"` and `data-presentation-active`; the attribution link exposes `data-presentation-attribution`; other hooks use `data-presentation-*`; read the kit source for the exact set), the registry `src/presentations/index.ts`, the committed sample `src/presentations/how-to-make-a-presentation/`, `scripts/verify.mjs` (reuse its preview-on-`127.0.0.1` and Playwright conventions rather than inventing new ones; extract shared helpers only if it does not change verify's behavior), Playwright as a devDependency, and Vitest (`npm test` runs `src/**` and `tests/**`).

Decisions already made (use exactly):
- Command: `npm run inspect -- <slug> [options]`; script `scripts/inspect-presentation.mjs`. It builds if `dist/` is missing or stale (or accepts `--no-build`), starts `vite preview` on `127.0.0.1`, opens `http://127.0.0.1:<port>/<slug>` in Playwright Chromium at a standard desktop viewport (1440 × 900, overridable with `--viewport WxH` so a narrow viewport can be inspected too), and always cleans up the preview process.
- Output: one PNG per step at `.presentation-inspection/<slug>/step-NN.png` (zero-padded, 1-based, predictable). Add `.presentation-inspection/` to `.gitignore` (screenshots must never be committed).
- Settling: before each capture, wait a configurable settle interval (`--settle <ms>`, sensible default of about 1200 ms) after the step index advances via `ArrowRight`, so transitions finish.
- Intentional overlap marker: an element (or any ancestor) carrying the attribute `data-presentation-allow-overlap` exempts every element inside that subtree from overlap warnings.
- Warnings are advisory: printed with the step number and element descriptions (tag, hook/text snippet); they do not change the exit code. Exit non-zero only for real failures (unknown slug, navigation failure, preview not starting, browser/page error preventing capture).

What to build:
1. The helper with three diagnostics evaluated per settled step in the page:
   - **Overlap**: visible text-bearing elements and presentation chrome (`data-presentation-*` chrome regions) whose rendered boxes intersect another visible text/chrome element, excluding ancestor/descendant pairs and anything inside a `data-presentation-allow-overlap` subtree; warn with step and both elements.
   - **Indistinct active chrome**: compare computed styles of the active progress indicator / ToC entry against inactive siblings (color, background, border, opacity, font-weight, size, outline, box-shadow, transform); warn when no visible difference exists. Only run on controls present in the current mode (ToC is browse-mode/wide-viewport only).
   - **Attribution**: warn when the `data-presentation-attribution` link is missing, looks browser-default (default link color/underline with no author styling), or is too small (choose a documented font-size/hit-area threshold); the message points authors to the `data-presentation-attribution` styling hook.
2. A `README.md` section documenting usage, options, output path, and the allow-overlap marker.
3. Run the helper on the committed sample. Review its warnings: fix accidental collisions or indistinct chrome/attribution in the sample's own CSS/markup (presentation-owned files only), and mark only genuinely intentional, readable overlaps with `data-presentation-allow-overlap`. Report remaining advisory warnings accurately in your final notes.
4. Pure logic (box intersection, threshold decisions, warning formatting, argument parsing) gets Vitest unit tests; the browser-backed behavior gets the integration suite below.

Visual duty (from `CLAUDE.md`): use `chrome-devtools-axi` (`snapshot`, `screenshot`) on the sample's first, last, dense and a narrow-viewport step in addition to the helper's output. Do not commit screenshots.

## Spec
Copied from `specs/presentation-verification/spec.md`:

## ADDED Requirements

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
- `INT-002: Screenshot helper emits faithful artifacts and advisory warnings` — create `tests/integration/inspect-presentation.int.test.ts`. Boundary: the real inspection script driving a production preview in Chromium and writing to the filesystem. Setup: a controlled, test-only registered presentation (kept under `tests/fixtures/`, copied into a throwaway project copy or registered via a throwaway registry, never added to the real registry) with multiple steps and variants containing (a) an unmarked text collision, (b) an explicitly `data-presentation-allow-overlap` readable overlap, (c) indistinct active chrome, (d) unpolished/browser-default or tiny attribution, plus a clean variant. Action: run the helper through every step with a short settle interval. Assert: exactly one predictably named screenshot per step; captures occur only after transitions settle (e.g. verify the settle delay is honored and that a deliberately slow transition in the fixture is complete in the captured frame); the unmarked collision, indistinct active state, and attribution defect each produce a step-specific advisory warning; the allowed overlap produces no overlap warning; the clean variant produces none; advisory warnings leave the exit code at zero; the preview process is gone afterward. Runs through `npm test` where Chromium is available.

## Done When
- `npm run inspect -- how-to-make-a-presentation` writes one screenshot per step under `.presentation-inspection/how-to-make-a-presentation/` and prints any advisory warnings; the directory is git-ignored.
- Every scenario in the spec above is demonstrably satisfied; `INT-002` and the unit tests pass under `npm test`.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass.
- The sample has been reviewed with the helper and AXI; accidental warnings are fixed, and any `data-presentation-allow-overlap` marker is limited to genuinely intentional readable overlaps.
- README documents the helper. Commits use `type: lowercase description`; no screenshots or generated output are committed.
