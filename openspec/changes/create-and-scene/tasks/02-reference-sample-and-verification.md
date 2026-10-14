# Task: Reference sample, production verification, and screenshot inspection

## Goal
Deliver the committed self-referential sample presentation ("How to Use This Skill to Make a Presentation"),
the `npm run verify` build-and-render gate (`scripts/verify.mjs`), and the project-local screenshot/diagnostics
helper (`scripts/inspect-presentation.mjs`, run via `npm run inspect`). Together they prove the kit works end to end in a
real browser and give the skill (and humans) a deterministic pass/fail gate and a visual-inspection tool.

## Background
Read these (paths relative to `openspec/changes/create-and-scene/`):
- `design.md` — "Verification (`npm run verify` → `scripts/verify.mjs`)", "Styling", the repository layout for `src/presentations/how-to-make-a-presentation/`, Decisions 1, 3, 4, and the StrictMode risk.
- `specs/presentation-verification/spec.md` — canonical requirements (copied below).
- `specs/evolving-scene-presentations/spec.md` — the sample must conform to the evolving-scene model (stable entities, grouped scenes, style ownership).
- `test-plan.md` — `E2E-001`, `E2E-002`, `INT-002`.

Preconditions in the repository (already in place when this work starts): `src/presentation-kit/` (style-neutral scene kit: `Presentation`, `Stage`, chrome, node primitives `Box/Label/Arrow/Frame/Emphasis/SymbolChip/Appear/SceneLayer`, `Step`/`SceneProps` types, `usePresentationNav`, `useFitScale`), the pathname router in `src/main.tsx`, `src/Landing.tsx`, the explicit registry `src/presentations/index.ts` (`{ slug, title, load }` entries), and Vitest behind `npm test`. Read `src/presentation-kit/README.md` for the exact hook names. The kit exposes `data-step-count` and `data-step-index` on the chrome root, `data-presentation-attribution` on the attribution link, `data-presentation-allow-overlap` as the overlap-exemption marker, and per-item `data-presentation-progress-item`/`data-presentation-toc-item` with `aria-current` plus `data-presentation-active="true"` on the active item. Use whatever the README documents if it differs slightly.

### Sample presentation
- Folder `src/presentations/how-to-make-a-presentation/` with `entities.ts` (its `layoutId` namespace), `steps/*.tsx` (nine `Step` objects composing kit primitives and/or raw `motion` elements with stable `layoutId`s), `Talk.tsx` rendering `<Presentation steps={STEPS} title=… initialMode="browse" />`, and presentation-local plain CSS (palette, typography, spacing, borders, shadows, active-chrome and attribution styling). Styling lives in the presentation (or host `src/index.css`), never in `src/presentation-kit/`. Make the active progress/ToC state visibly distinct and the attribution legible (sized, non-browser-default) so the inspection helper emits no advisory warnings on the sample.
- Register it in `src/presentations/index.ts` with slug `how-to-make-a-presentation` and title "How to Use This Skill to Make a Presentation". (The slug is also used by `npm run inspect -- how-to-make-a-presentation`.)
- The nine steps' eras, titles, captions and scene intent are normative (table in the spec below; copy titles/captions character-for-character, including punctuation and the em dashes). Visual design is yours: one continuously evolving scene where entities accumulate and are never rearranged or redrawn; use grouped scenes (shared `groupKey` + Scene component, payload = active step data) so continuing entities morph rather than remount; newcomers use `Appear`; departing entities exit. Fit everything inside the 880 × 380 canvas, keep content clear of the chrome, and mark only genuinely intentional readable overlaps with the allow-overlap marker.
- Export the normative titles/captions in a form `verify.mjs` can read without a browser (e.g. the step data in a plain `.ts` module with no React import, or a JSON-like constant) — or have the verifier extract them from the production preview DOM. Either way the order and exact text must be asserted.

### `scripts/verify.mjs` and npm scripts
- Add `"verify": "node scripts/verify.mjs"` and `"inspect": "node scripts/inspect-presentation.mjs"` to `package.json`; add `playwright` as a devDependency (update `package-lock.json`). Chromium must be installable via `npx playwright install chromium`; document this in `README.md` and in a clear failure message if the browser is missing.
- Phases, in order, each reporting its name on failure: (1) **build** — `npm run build` (`tsc -b && vite build`); (2) **sample** — assert the registry registers the canonical sample and that its nine titles and captions appear in order; (3) **render** — start `vite preview` bound to `127.0.0.1` (host flag, readiness probe URL, and browser URLs all use `127.0.0.1`, never `localhost`), use Playwright Chromium to open the sample route, read `data-step-count` (must equal 9), press `ArrowRight` through every step checking `data-step-index` advances each time, and record `console.error` and `pageerror` events attributed to the current step index; (4) **report** — print a clear PASS summary and exit 0, or a clear FAIL naming the failed phase (and the step index for browser/transition faults) and exit non-zero.
- Always clean up the preview subprocess (including on failure/exception/signals). Use an ephemeral or configurable free port so repeated/parallel runs do not collide.
- Keep the script free of repo-specific assumptions that would break when it is later copied into a scaffolded project (resolve the project root from the script location or `process.cwd()` consistently; accept the sample slug/title expectations in a way the scaffold's own template sample can satisfy — e.g. configurable via a small constant at the top of the file). Any later template copy must stay byte-aligned with this file, so avoid hard-coding absolute paths.

### `scripts/inspect-presentation.mjs`
- `npm run inspect -- <slug>` builds if needed (or requires an existing build — pick one and document it), serves a production preview on `127.0.0.1`, opens `/<slug>` at a standard desktop viewport (1440×900), and for every step waits a configurable settle interval (default long enough for the morph/enter animations; expose an option such as `--settle <ms>` and a viewport option such as `--viewport WxH` so a narrow viewport can be inspected) before writing `artifacts/inspection/<slug>/step-<NN>.png` (zero-padded, predictable; ensure `artifacts/` is git-ignored). Screenshots are not committed.
- Advisory diagnostics (printed as `WARN` lines naming the step and the elements; they never change the exit code): (a) visible text/chrome elements that overlap another visible text/chrome element unless either lies inside a subtree marked `data-presentation-allow-overlap`; (b) the active progress indicator or active ToC entry being visually indistinguishable from inactive ones (compare computed styles); (c) the attribution link (`data-presentation-attribution`) being too small or browser-default (e.g. default link color/underline with default font size, or below a minimum size) with a message pointing to the attribution styling hook. Make the detection thresholds constants at the top of the file.
- Structure the diagnostics so the pure evaluation logic is unit-testable and the browser part is thin.

### Fixture for INT-002
Provide a small controlled test presentation (a test-only fixture, not shipped in the production registry — e.g. built into a temporary copy of the app or registered only when an env var is set, your choice; document it) with several steps and variants containing: an unmarked text collision, an explicitly allowed readable overlap, indistinct active chrome, and unpolished attribution.

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

### Related requirement (evolving-scene-presentations) the sample must satisfy — Persistent grouped scenes and Stable entities morph across steps

### Requirement: Stable entities morph across steps
Entities that persist between steps SHALL keep a stable identity and animate their change in place rather than disappearing and reappearing. Entities present in only one of two adjacent steps SHALL animate in or out.

#### Scenario: Persisting entity morphs
- **WHEN** an entity with the same identity exists in two consecutive steps
- **THEN** navigating between them animates that entity from its old state (position, size, label, emphasis) to its new state in place

#### Scenario: New entity enters after others settle
- **WHEN** a step introduces a new entity
- **THEN** it animates in after the persisting entities have moved to their new positions

#### Scenario: Departing entity exits
- **WHEN** an entity exists in a step but not in the next step
- **THEN** it animates out on that transition

### Requirement: Persistent grouped scenes
Adjacent steps that represent successive states of the same evolving diagram SHALL be able to share a scene group so that the scene component persists while only the active step data changes. Shared groups prevent the whole scene from remounting between beats and preserve entity continuity for layout morphs.

#### Scenario: Grouped steps update in place
- **WHEN** adjacent steps share a scene group and the same scene component
- **THEN** navigating between those steps updates the existing scene instance with the new step state rather than remounting separate scenes

#### Scenario: Continuing entities are not faded as newcomers
- **WHEN** an entity with the same stable identity continues across grouped steps
- **THEN** it morphs through layout projection without being wrapped in newcomer fade-in behavior

#### Scenario: Intentional composition is preserved
- **WHEN** a grouped scene intentionally overlaps or stacks entities
- **THEN** the implementation preserves that composition while maintaining clean morphs, rather than flattening or spreading entities only to satisfy an implementation pattern


## Test Plan
- `E2E-001` — Reference presentation passes production verification. Surface: `npm run verify` from the repo root. Assert: sample registered and reachable; all nine normative titles/captions in order; each of the nine step indices observed with no console/page errors or failed transitions; preview host, readiness probe and browser URL use `127.0.0.1`; exit code 0 with a clear PASS. Implement as an automated test in the repo's browser-backed e2e suite (e.g. a Vitest project/file that spawns `npm run verify` against a checkout with Chromium available, with a generous timeout) that runs on every PR via a documented npm script (e.g. `npm run test:e2e`; keep it out of plain `npm test` if it is slow, but document it and make sure `npm run verify` itself is the full gate). Do **not** add CI configuration or `.github/workflows/`.
- `E2E-002` — Verification failures are actionable. Create independent disposable copies of the repo (copy to a temp dir, excluding `node_modules`/`dist`, symlinking or reusing installed dependencies; never modify the source checkout) and inject one fault per phase: a build-breaking edit (type error), a missing sample / out-of-order sample titles, a step that emits a `console.error` (and/or throws), and a transition that does not advance `data-step-index`. Assert each run exits non-zero, output names the failed phase and (for browser/transition faults) the offending step index, never reports success, and the preview subprocess is gone afterwards (e.g. the port is free / no child process remains).
- `INT-002` — Screenshot helper emits faithful artifacts and advisory warnings. Run `scripts/inspect-presentation.mjs` against the controlled fixture through every step. Assert: exactly one predictable screenshot per step; screenshots are taken only after the settle interval (e.g. verify the helper's recorded timing/step-index handshake, or that a step with a delayed animation is captured in its final state); the unmarked collision, indistinct active state, and attribution defect each yield a step-specific WARN; the explicitly allowed overlap yields no overlap WARN. Runs in the browser-backed integration suite on every PR with Chromium available.
- Unit tests (implementer's choice) for the verifier's pure parts (phase result formatting, title/caption ordering assertion) and the inspector's pure diagnostics evaluation.

## Done When
- The nine-step sample is committed, registered, reachable at `/how-to-make-a-presentation`, and matches the normative titles, captions and eras in order.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass (verify exits 0 with a clear PASS summary), and the E2E/INT suites above pass.
- `npm run inspect -- how-to-make-a-presentation` writes nine settled screenshots under the git-ignored artifact directory and prints no unexplained WARN lines for the sample.
- With `chrome-devtools-axi` (against a production preview on `127.0.0.1`), you have inspected the first, last, and dense/transition-critical steps at a wide viewport and a narrow viewport, confirmed content fits the canvas, does not collide with chrome, active chrome is distinct, attribution is legible, and entities morph/enter/exit correctly. Fix issues found; record what you checked in your report.
- `package.json`/`package-lock.json` include `playwright` and the `verify`/`inspect` scripts; README documents browser installation and the commands. No build output, screenshots, or dependency directories are committed and no CI configuration is added.
