# Task: Reference sample, verification gate, and inspection helper

## Goal
Deliver the committed self-referential sample presentation "How to Use This Skill to Make a Presentation" (nine normative steps), the deterministic `npm run verify` gate (`scripts/verify.mjs`) that builds the whole app and renders the sample step by step in a real browser, and the project-local screenshot/diagnostics helper (`scripts/inspect-presentation.mjs`, run as `npm run inspect -- <slug>`). Together they are the repository's automated browser gate and the visual-inspection toolchain.

## Background
Assume the following already exist in the repository (built as part of this change): the style-neutral scene kit at `src/presentation-kit/` (`Presentation`, `Stage`, `Step`/`Scene` types, `nodes/*` primitives such as `Box`, `Label`, `Arrow`, `Frame`, `Emphasis`, `SymbolChip`, `Appear`, `SceneLayer`, chrome with `data-step-count` and `data-step-index` hooks, `aria-current` + a stable active-state hook on progress/ToC, a bottom-right `made by and-scene` attribution with a stable `data-presentation-*` hook), a pathname router in `src/main.tsx`, an explicit registry `src/presentations/index.ts` (`[{ slug, title, load }]`), `src/Landing.tsx`, and Vitest (`npm test`). Read the kit's documentation comments to find the exact hook names (active-state hook, attribution hook, allow-overlap marker) and use them; if the allow-overlap marker is not yet defined, define it as a documented `data-presentation-allow-overlap` attribute that the kit's node primitives pass through. Fixed names from the design/specs — copy verbatim: sample slug `how-to-make-a-presentation`; sample folder `src/presentations/how-to-make-a-presentation/` containing `entities.ts` (its `layoutId` namespace), `steps/*.tsx` (nine `Step` objects), and `Talk.tsx` (renders `<Presentation steps={STEPS} title=… initialMode="browse" />`; the filename `Talk.tsx` is incidental); registry entry `{ slug, title, load: () => import('./how-to-make-a-presentation/Talk') }`; scripts `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`; npm scripts `verify` and `inspect`; hooks `data-step-count` / `data-step-index`; host `127.0.0.1`.

Sample (see the spec below for the normative table): one continuously evolving scene — conversation row (you ↔ skill) on top, a tray of step cards accumulating beneath, later beats drawing connections and a final reveal frame. Entities accumulate and are never rearranged or redrawn; use grouped scenes (shared `groupKey` + Scene, typed payload) so the scene persists and entities morph via stable `layoutId`s. Titles, captions, eras, and scene intent are normative; per-step visual design (shapes, coordinates, `layoutId` names, colors, motion timing) is yours to settle. Styling for the sample is presentation-owned plain CSS in files inside the sample folder (not in the kit): make the active ToC/progress step visibly distinct and make the attribution legible via its styling hook. The sample must pass its own inspection helper cleanly or with only deliberate, marked overlaps. Mark intentional overlaps with the allow-overlap marker.

`scripts/verify.mjs` (design "Verification"): (1) run `npm run build` over the whole app; any type/build error fails; (2) assert the canonical nine-step sample is registered in `src/presentations/index.ts` and that every normative title and caption appears in order (parse/import the sample's step metadata — keep the extraction robust and testable so a missing/out-of-order/malformed sample is detected); (3) start `vite preview` bound to `127.0.0.1` (explicit `--host 127.0.0.1` and a free or configured port), poll readiness with a probe at `127.0.0.1`, then drive Chromium via Playwright to `http://127.0.0.1:<port>/how-to-make-a-presentation`, read `data-step-count`, and press `ArrowRight` through every step confirming `data-step-index` advances to each of the nine indices; (4) any `console.error`, `pageerror`, or failed transition fails verification and reports the failing step index; (5) exit non-zero on any failure with output that names the failed phase (build / sample-registration / render / transition) and, for browser faults, the step; print a clear final PASS/FAIL line; (6) always terminate the preview subprocess and browser, including on failure/timeouts/SIGINT. Add `playwright` as a dev dependency, add `"verify": "node scripts/verify.mjs"`, and make sure Chromium installation is documented (e.g. `npx playwright install chromium`) and that the scripts give an actionable message when the browser is missing. Structure the script so phases are importable/testable functions and so the repository root and sample slug can be overridden by flags/env (needed to run against disposable repository copies).

`scripts/inspect-presentation.mjs` (spec "Visual inspection artifacts"): `npm run inspect -- <slug>` builds (or reuses an existing production build — document which) and serves a production preview on `127.0.0.1`, opens the registered presentation at a standard desktop viewport (e.g. 1440 × 900; support an optional narrow viewport flag), and for every step captures one screenshot into a predictable project-local, git-ignored directory (e.g. `artifacts/inspection/<slug>/step-NN.png`; add the directory to `.gitignore`), waiting a configurable settle interval (flag/env, sensible default) after each advance before capturing. It prints advisory warnings (never a non-zero exit for warnings) that name the step and the elements involved for: (a) visible text/chrome elements overlapping other visible text/chrome without an allow-overlap marker on an ancestor (elements inside a marked subtree are exempt); (b) active progress indicator or active ToC entry visually indistinguishable from inactive ones (compare computed styles of the active vs inactive items); (c) attribution link missing, browser-default (e.g. default link color/underline and default font size), or too small — the warning points authors to the attribution styling hook. Keep detection logic in importable pure functions so it is unit-testable and so the script can later be copied verbatim into a scaffold template. Add `"inspect": "node scripts/inspect-presentation.mjs"`. Screenshots are inspection artifacts, not pass/fail evidence.

Project rules: use TDD (failing test first, then smallest implementation); no CI config; never commit generated build output, screenshots, or `node_modules`; commit messages `type: lowercase description`.

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

## Test Plan
- `E2E-001` Reference presentation passes production verification: from the repository root, `npm run verify` builds, starts the preview on `127.0.0.1`, opens the registered sample route, observes all nine step indices, confirms every normative title/caption in order, asserts the host/readiness probe/browser URL all use `127.0.0.1`, and exits zero with a clear pass result. Implement as an automated browser-backed test (Vitest test that spawns `npm run verify`, or a dedicated npm script such as `npm run test:e2e` run alongside `npm test`) and as the full verification gate itself.
- `E2E-002` Verification failures are actionable: in independent throwaway copies of the repository (copy to a temp dir, symlink or reuse `node_modules`; never modify the source checkout) introduce one fault per phase — a type/build-breaking edit; a missing sample and an out-of-order sample; a step that emits a `console.error` / uncaught page error; a transition that does not advance `data-step-index` — and run `npm run verify` in each. Assert every copy exits non-zero, output names the failed phase and (for browser/transition faults) the offending step, no failure is reported as success, and no preview subprocess is left running afterwards.
- `INT-002` Screenshot helper emits faithful artifacts and advisory warnings: register a controlled multi-step test presentation (a fixture used only by the test, e.g. injected into a throwaway repo copy or registered via a test-only registry entry) with variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution. Run the helper through every step with the configured settle interval and assert: one predictable screenshot per step; captures occur after transitions settle (e.g. verify no in-flight transform/animation at capture time or that the settle wait is honored); step-specific advisory warnings for the unmarked collision, indistinct active state, and attribution defect; no overlap warning for the allowed overlap; warnings do not change the exit code.
- Unit-level logic (step-metadata extraction/order check, overlap geometry, active-vs-inactive style comparison, attribution polish heuristics, argument parsing) is an implementation-time decision; cover it with Vitest.
- These browser-backed tests need Chromium via Playwright; make them runnable by `npm test` or a documented companion script, and keep the full gate (`npm test`, `npm run lint`, `npm run build`, `npm run verify`) green.

## Done When
- The sample exists at `src/presentations/how-to-make-a-presentation/`, is registered with slug `how-to-make-a-presentation`, is reachable at `/how-to-make-a-presentation`, and implements the nine steps with the normative eras, titles, and captions in order; its look is presentation-owned plain CSS; it uses grouped scenes with stable `layoutId` morphs.
- `npm run verify` passes on the repository and fails (non-zero, phase- and step-naming output, no orphaned preview process) for each fault class in `E2E-002`; preview/readiness/browser URLs use `127.0.0.1`.
- `npm run inspect -- how-to-make-a-presentation` writes one settled screenshot per step to a git-ignored project-local directory and prints no unexplained warnings for the sample (intentional overlaps are marked).
- `E2E-001`, `E2E-002`, and `INT-002` are implemented and pass; `playwright` is a dev dependency with `verify` and `inspect` npm scripts.
- Using `chrome-devtools-axi` (see `CLAUDE.md` Browser Tooling) and the screenshot helper, inspect the sample's first, last, and dense steps at desktop width and at least one narrow viewport; fix accidental collisions and indistinct active chrome before finishing.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass; no screenshots or build output are committed.
