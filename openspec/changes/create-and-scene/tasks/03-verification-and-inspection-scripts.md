# Task: Production verification and screenshot-inspection scripts

## Goal
Provide `npm run verify` (deterministic build + registry/outline check + real-browser
render of every step of the reference sample, with unambiguous pass/fail) and
`npm run inspect -- <slug>` (settled per-step screenshots plus advisory
visual-quality warnings). These are the repository's automated browser gate and the
project-local helper the skill uses for visual composition checks.

## Background
You MUST read:
- `openspec/changes/create-and-scene/design.md` (Verification section, Styling, Decision 4, Risks → Playwright in Docker/CI)
- `openspec/changes/create-and-scene/specs/presentation-verification/spec.md` (copied below)
- `openspec/changes/create-and-scene/specs/presentation-skill/spec.md` requirement "Generated presentation quality bar" (screenshot helper and warning-review scenarios; the helper is what the skill runs)
- `openspec/changes/create-and-scene/test-plan.md` (INT-002, E2E-001, E2E-002 — copied below)

Assumes the scene kit, router, registry, and the committed sample
`how-to-make-a-presentation` already exist under `src/`. The chrome exposes these
hooks (read the kit to confirm; they are the contract you must rely on):
`data-presentation-chrome` carrying `data-step-count` and `data-step-index`
(zero-based) and `data-presentation-mode`; `data-presentation-title`,
`data-presentation-caption`; `data-presentation-progress` / `-progress-item`;
`data-presentation-toc` / `-toc-item`; `data-presentation-prev` / `-next`; active
items carry `aria-current="step"` and `data-presentation-active="true"`;
`data-presentation-attribution`; intentional-overlap marker
`data-presentation-allow-overlap` on a subtree. If the kit's actual names differ,
the kit is the source of truth for tooling — report the discrepancy.

Deliverables:
- `scripts/verify.mjs` + `package.json` script `"verify": "node scripts/verify.mjs"` and `playwright` as a devDependency (commit the lockfile update). Phases, each named in output so a failure identifies the failed phase:
  1. `build`: run `npm run build`; any type/build error fails.
  2. `sample`: assert `src/presentations/index.ts` registers `how-to-make-a-presentation` and that the sample implements the nine normative era/title/caption entries in order (parse/import the sample's steps or the registry data; absent, unregistered, malformed, or out-of-order ⇒ fail). This default mode is strict; do not add any behavior that skips this phase when the registration is missing (if an explicit opt-in smoke flag for non-sample projects is ever added, it must leave this default unchanged).
  3. `render`: start `vite preview` bound to `127.0.0.1` (explicit `--host 127.0.0.1` and a free port), probe readiness at `http://127.0.0.1:<port>/`, open `http://127.0.0.1:<port>/how-to-make-a-presentation` with Playwright Chromium, read `data-step-count` from the chrome, observe `data-step-index` 0, press `ArrowRight` through every step confirming the index advances by exactly one each time, and fail on any `console.error`, `pageerror`, or a transition that does not advance the index, reporting the failing step index. Always kill the preview subprocess and close the browser, including on failure/timeout/interrupt.
  4. Exit code 0 with a clear PASS summary, non-zero with a clear FAIL naming the phase (and step for browser faults).
  Make the repository root and sample slug overridable only as needed for testing (e.g. root directory via `cwd`/env), so fault-injection tests can run against throwaway copies.
- `scripts/inspect-presentation.mjs` + `package.json` script `"inspect": "node scripts/inspect-presentation.mjs"` (invoked `npm run inspect -- <slug>`): builds if needed and serves a production preview on `127.0.0.1`, opens the registered presentation at a standard desktop viewport (1440×900; optionally accept a `--viewport WxH` flag for narrow checks), waits a configurable settle interval (default long enough for the morph + enter delay; flag/env override) after load and after every step advance, and writes one screenshot per step to a predictable project-local, git-ignored directory (e.g. `.inspection/<slug>/step-<NN>.png`; add the directory to `.gitignore`). It prints advisory warnings (never failing the process because of them) each naming the step and elements:
  - suspicious overlap between visible text/chrome elements, unless either element is inside a `[data-presentation-allow-overlap]` subtree;
  - indistinct active chrome: the active progress item / active ToC entry (`[aria-current="step"]`, `[data-presentation-active="true"]`) computes visually identical to its inactive siblings (compare relevant computed styles);
  - unpolished attribution: `[data-presentation-attribution]` missing, too small (e.g. computed font-size below a documented threshold or hit area undersized), or browser-default (default link color/underline with no author styling).
  Document thresholds in the script header. The helper must resolve Playwright from the project's local dependencies and take paths relative to the project root, never relying on the caller's cwd.
- Automated tests (Vitest; run in `npm test`, browser-backed ones requiring Chromium via `npx playwright install chromium`, with generous timeouts and guaranteed cleanup): see Test Plan.
- Brief README/doc notes for both commands (usage, flags, exit codes, where artifacts go). These scripts will later be copied into the skill's bootstrap templates; keep them free of repo-specific hard-coding beyond the slug/path conventions above so a copy works in a fresh project.

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
- `INT-002` — Screenshot helper emits faithful artifacts and advisory warnings. Boundary: the inspection script driving a production preview in Chromium and writing screenshots + diagnostics to the filesystem. Setup: a controlled, registered multi-step test presentation (a fixture placed in a throwaway copy of the app or a test-only registry entry; do not ship it in the real registry) with variants containing an unmarked text collision, an explicitly allowed overlap, indistinct active chrome, and unpolished attribution. Action: run the helper through every step after the settle interval. Assertions: one predictable screenshot per step; captures occur only after transitions settle (e.g. assert the settle wait happened before each capture / use a presentation whose content changes late); the unmarked collision, indistinct active state, and attribution defect each produce a step-specific advisory warning; the allowed readable overlap produces no overlap warning. Runs on every PR with Chromium available.
- `E2E-001` — Reference presentation passes production verification. Surface: `npm run verify` from the repository root. Journey: build, preview on `127.0.0.1`, open the registered sample route, advance through all nine steps via the public step hooks. Assertions: sample registered and reachable; all normative titles and captions in order; each of the nine step indices observed with no console/page errors or failed transitions; host, readiness probe, and browser URL all use `127.0.0.1`; exit code zero with a clear pass result.
- `E2E-002` — Verification failures are actionable. Surface: `npm run verify` in disposable copies of the repository (copy without `node_modules`/`dist`, symlink or reuse installed dependencies for speed; never edit the source checkout). One independent copy per fault: a build-breaking edit; a missing sample (both the sample folder removed and, separately, only its registry entry removed while the app still builds) and an out-of-order/malformed sample; a step that emits a browser `console.error`; a transition that does not advance `data-step-index`. Assertions: every faulty copy exits non-zero; output names the failed phase and, for browser/transition faults, the offending step; no fault is reported as success; no preview subprocess survives each run (assert the port is free / no child process).

## Done When
- `npm run verify` passes on the repository and prints a clear PASS; each fault-injection copy fails with phase (and step) named.
- `npm run inspect -- how-to-make-a-presentation` writes nine settled screenshots under the git-ignored artifact directory and prints warnings (if any) with step numbers; review a few screenshots with `chrome-devtools-axi`/the Read tool for sanity.
- INT-002, E2E-001, and E2E-002 are implemented as automated tests and pass in `npm test`; unit tests cover pure helpers (overlap-rect math, allow-overlap exemption, computed-style distinctness, threshold checks).
- All URLs and the preview host use `127.0.0.1`; no preview/browser processes leak.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass; no generated artifacts or screenshots are committed; no CI configuration is added.
