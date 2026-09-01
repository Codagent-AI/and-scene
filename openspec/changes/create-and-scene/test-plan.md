## Coverage Strategy

Specifications remain the source of unit-test requirements. Focused tests should
cover isolated scene-state, navigation, scaling, registry, and validation logic;
this plan does not inventory those tests. Additional coverage targets the risks
that require real filesystem materialization, subprocesses, a production browser,
or an agent following the public skill workflow.

The integration layer proves that the distributable bootstrap and inspection
helper work outside the repository that authored them. End-to-end coverage stays
limited to the committed reference presentation's production verification path
and its failure contract. Agent acceptance exercises the non-deterministic skill
journeys and uses browser evidence for interaction and visual quality. All
acceptance work occurs in disposable local copies, has no network publication or
paid effects, and must leave the source repository unchanged.

## Integration Tests

### INT-001: Materialized bootstrap is complete and style-neutral
- Covers: Self-bootstrapping scaffold, template resolution, required dependencies, style ownership, and template-to-canonical-kit drift.
- Boundary: The distributable `skills/presentation/templates/bootstrap/` snapshot is copied into a fresh filesystem location and exercised through its package scripts and canonical scene-kit contracts.
- Setup: Materialize the bootstrap template in an isolated temporary directory, install its declared dependencies from the committed lock data, and invoke it from a working directory outside the source repository.
- Action: Build the materialized app, open its registered route through its local verification entry point, and compare non-test scene-kit files with the canonical `src/presentation-kit/` source where parity is required.
- Assertions: The build and route smoke check pass; all three scaffold anchors and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; template lookup is independent of the caller's working directory; canonical and template kit files remain aligned; and neither the kit nor scaffold introduces Tailwind or visual defaults owned by the reusable kit.
- Execution: Run in the repository's automated integration suite on every pull request after dependency installation.

### INT-002: Screenshot helper emits faithful artifacts and advisory warnings
- Covers: Project-local screenshot capture, settled transitions, overlap exemptions, active-navigation diagnostics, and attribution diagnostics.
- Boundary: The project-local inspection script drives a production preview in Chromium and writes screenshots plus diagnostics to the filesystem.
- Setup: Use a controlled registered fixture presentation with multiple steps and variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution.
- Action: Run the inspection helper through every step after the configured settle interval.
- Assertions: One predictable screenshot is written per step; captures occur only after transitions settle; the unmarked collision, indistinct active state, and attribution defect produce step-specific advisory warnings; and the explicitly allowed readable overlap does not produce an overlap warning.
- Execution: Run in the repository's browser-backed integration suite on every pull request with Chromium available.

## End-to-End Tests

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

## Agent Acceptance Tests

### AT-001: Scaffold the correct target and create through the public skill
- Classification: Required
- Covers: Interactive gathering, partial-detail opt-in, standalone and monorepo target resolution, full and partial scaffolding, confirmation before non-empty writes, registration, presentation-owned styling, and self-verification.
- Actor and surface: An agent uses `skills/presentation/SKILL.md` as the public workflow in two temporary projects: an empty standalone directory and a non-empty monorepo with only the build anchor present.
- Setup: For each target, provide a representative topic, visual direction, and two or more step descriptions; intentionally leave one nonessential detail open and then explicitly choose to proceed with partial detail. Give the monorepo a workspace signal and existing unrelated root content, but no scene kit or presentation index. No credentials are required.
- Steps: Invoke the skill in the empty target, answer its questions one at a time, let it scaffold and create at the root, and open the generated route after completion. Repeat in the partial monorepo, verify that the skill states the proposed target before writing, approve that target, and open the generated route after completion.
- Expected: The agent does not invent missing details before asking and accepts the explicit partial-detail choice; the standalone app is scaffolded at its root; the partial monorepo preserves its build setup and unrelated content while adding only missing infrastructure in a self-contained `presentations/` app after confirmation; each result has all three anchors and required dependencies; and each presentation is registered, routed, styled outside the reusable kit, built, rendered, and visually inspected before success is reported.
- Evidence: Capture both question/answer transcripts, the monorepo target confirmation, final changed-file summaries, successful build/render output, route URLs, preservation diff for existing monorepo content, and wide screenshots of the first, last, and densest step in each generated presentation.
- Effects and cleanup: Local files, package installation, and local preview processes are authorized only inside the disposable projects; stop processes and delete both directories after evidence is retained. No publication or paid effects.
- Permitted substitutes: A repository-local package cache or already-installed Playwright browser may replace network dependency downloads; the real generated app, build, browser render, and visual inspection may not be mocked.

### AT-002: Preserve existing presentations and scope a modification
- Classification: Required
- Covers: Already-scaffolded detection, new-presentation coexistence, ambiguous-target handling, and scoped modification.
- Actor and surface: An agent uses `skills/presentation/SKILL.md` against a disposable copy of a scaffolded app containing at least two registered presentations.
- Setup: Seed two distinct presentations and record their files, registry entries, and working routes; prepare one request to add a third presentation and a second request that asks to modify a presentation without naming it. No credentials are required.
- Steps: Create the third presentation through the skill, confirm all routes, issue the ambiguous modification request, select one target when prompted, request a visible step or style change, and let the skill complete its verification.
- Expected: Existing anchors are reused instead of overwritten; all seeded presentations remain intact and reachable after creation; the agent lists or otherwise identifies candidates before an ambiguous modification; only the selected presentation and necessary registration/verification artifacts change; and the agent rebuilds, renders, and visually checks the result before reporting success.
- Evidence: Preserve before/after diffs, the interaction transcript, route checks for every presentation, verification output, and before/after screenshots of the modified step.
- Effects and cleanup: Local edits, package commands, and preview processes are authorized only in the disposable copy; stop processes and delete the copy after evidence is retained. No publication or paid effects.
- Permitted substitutes: Existing local dependency and browser caches are allowed; no dry run may replace file-preservation checks, real route rendering, or the scoped edit.

### AT-003: Interact with the evolving reference scene across modes and viewports
- Classification: Required
- Covers: Nine-step scene continuity, grouped persistence, entering and departing entities, browse/present modes, navigation methods and boundaries, position preservation, active-state semantics, fixed-canvas scaling, attribution, and responsive visual composition.
- Actor and surface: A viewer uses the committed reference presentation in a production preview through `chrome-devtools-axi`.
- Setup: Build and serve the app on `127.0.0.1`; open the canonical sample at a wide desktop viewport, with a narrow viewport available for a second pass. No credentials are required.
- Steps: Inspect the first step; navigate by keyboard, progress control, table of contents, and representative horizontal touch swipe; attempt navigation before the first and after the last step; focus an interactive control and use its key behavior; toggle browse/present mode on a middle step and back; traverse all nine steps while inspecting continuing, entering, and departing entities; then repeat representative first, dense, and final steps at the narrow viewport.
- Expected: Every input reaches the intended step without wrapping or double-handling focused-control keys; direct jumps and semantic current-state hooks agree; mode changes preserve the active step and expose the specified chrome; grouped scenes update without whole-scene replacement, persisting entities morph in place, newcomers enter after continuing motion, and departing entities exit; the 880 × 380 composition scales without internal reflow; attribution is legible and linked; active chrome is distinct; and important content remains readable without accidental chrome collisions at both viewport widths.
- Evidence: Record an accessibility/DOM snapshot showing active semantics and attribution, step-index observations for every navigation method and boundary, and settled screenshots of the first, last, and dense or transition-critical steps in both wide and narrow views.
- Effects and cleanup: Only local preview and browser processes are authorized; stop them after evidence capture. No repository writes, credentials, publication, or paid effects.
- Permitted substitutes: Equivalent browser input synthesis may stand in for a physical touchscreen; DOM-only inspection may not replace the required settled screenshots or continuity observations.

### AT-004: The skill repairs verification and visual-warning failures before completion
- Classification: Required
- Covers: Self-verification failure handling, project-local inspection, visual-warning review, intentional-overlap marking, active-state polish, and attribution polish.
- Actor and surface: An agent follows `skills/presentation/SKILL.md` while modifying a presentation in a controlled disposable app copy.
- Setup: Seed the target with a deterministic build or browser-render failure plus an accidental text/chrome collision, indistinct active navigation, unpolished attribution, and one readable intentional overlap. No credentials are required.
- Steps: Request the intended modification, allow the skill to build and render, observe its response to the failing check, run the project-local screenshot helper, and continue until the agent reports completion.
- Expected: The agent does not report success while build/render checks fail; it fixes the functional fault and reruns verification; it reviews the cited visual warnings, fixes accidental collisions and chrome polish, marks only the genuinely intentional readable overlap, reruns inspection, and reports the final checks and remaining advisory status accurately.
- Evidence: Preserve the interaction transcript, initial failing and final passing verification output, initial and final warning output, focused before/after screenshots, and the final diff showing that any allow-overlap marker applies only to the intentional composition.
- Effects and cleanup: Fault injection, fixes, screenshots, package commands, and local preview processes are authorized only in the disposable copy; stop processes and delete the copy after evidence is retained. No publication or paid effects.
- Permitted substitutes: A deterministic console error may replace another browser-runtime fault when both exercise the same repair loop; automated pass/fail output may not replace visual-warning review and screenshot evidence.

## Human-Only Testing

None.

## Coverage Map

| Requirement or journey | INT | E2E | AT | HT |
| --- | --- | --- | --- | --- |
| Bootstrap templates, dependencies, standalone/monorepo target resolution, partial scaffolding, and style ownership | INT-001 | — | AT-001 | — |
| Create, preserve, and modify presentations through the skill | — | — | AT-001, AT-002 | — |
| Reference sample build, registration, nine-step order, and clean production render | — | E2E-001 | AT-003 | — |
| Verification failure detection and repair | — | E2E-002 | AT-004 | — |
| Screenshot artifacts, warnings, exemptions, and local chrome polish | INT-002 | — | AT-003, AT-004 | — |
| Modes, navigation, boundaries, active semantics, and position preservation | — | — | AT-003 | — |
| Grouped-scene continuity, entity transitions, attribution, and wide/narrow composition | — | — | AT-003 | — |
