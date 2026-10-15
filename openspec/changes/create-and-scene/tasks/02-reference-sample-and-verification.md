# Task: Reference sample presentation and verification tooling

## Goal
Deliver the committed, self-referential reference presentation "How to Use This Skill to Make a Presentation" (nine steps, registered and routed at `/how-to-make-a-presentation`) together with the repository's deterministic gate (`npm run verify` → `scripts/verify.mjs`) and the screenshot/diagnostics helper (`npm run inspect` → `scripts/inspect-presentation.mjs`). The sample is the known-good example and the target of all verification; the scripts are also later copied into the distributable bootstrap template, so they must be self-contained and project-local.

## Background
The scene kit (`src/presentation-kit/`: `Presentation`, `Stage`, nav, chrome, generic node primitives, `Step`/`Scene` types, `data-step-count`/`data-step-index` hooks, attribution hook, active-state hooks, allow-overlap marker attribute), the pathname router in `src/main.tsx`, `src/Landing.tsx`, and the explicit registry `src/presentations/index.ts` (entries `{ slug, title, load: () => import('./<dir>/Talk') }`) already exist. Read `src/presentation-kit/README.md` for the exact hook names and use those names verbatim; if the kit lacks a hook this task needs, add it to the kit consistently and keep its documentation current. `package.json` already provides `npm test` (Vitest), `npm run lint`, and `npm run build` (`tsc -b && vite build`). Keep all of them green. Do not add CI configuration. Do not commit `dist/`, `node_modules/`, or inspection screenshots (write screenshots under a git-ignored, predictable project-local directory such as `.inspect/<slug>/`, and add it to `.gitignore`).

Read `design.md` sections "Repository layout", "Verification", "Styling", and Decisions 1, 4, 5 and the proposal's "Technical Approach" for the sample's evolving-scene model. Also read `specs/evolving-scene-presentations/spec.md` — the sample must conform to it (stable entities morph, grouped steps share a `groupKey`+`Scene` so the scene persists, newcomers enter via `Appear` after persisting entities settle, intentional overlaps preserved) — and it must match the visual composition rules in `specs/presentation-skill/spec.md` "Generated presentation quality bar" (content fits the 880×380 canvas, no accidental collisions with chrome, active chrome visibly distinct, attribution legible).

### Sample presentation
- Location: `src/presentations/how-to-make-a-presentation/` with `entities.ts` (its `layoutId` namespace of stable entity ids), `steps/*.tsx` (nine `Step` objects composing kit primitives), `Talk.tsx` (`<Presentation steps={STEPS} title=… initialMode="browse" />`), and presentation-local plain CSS (e.g. `style.css`) that owns all colors, typography, spacing, borders, shadows, and styling of active ToC/progress chrome and attribution. No Tailwind; no styling added to the kit. Register it in `src/presentations/index.ts` with slug `how-to-make-a-presentation`.
- The sample is ONE continuously evolving scene: a conversation row (you ↔ skill) anchors the top, a tray of step cards accumulates below it, and later beats draw connections and a final reveal frame. Entities accumulate and are never rearranged or redrawn. Exact shapes, coordinates, `layoutId` namespace, colors, and motion timing are yours to design; the nine steps, eras, titles, captions, and scene intent in the table below are normative and must be reproduced exactly (verbatim titles and captions, in order).
- Use `SceneLayer` and the `groupKey` mechanism so adjacent beats of the same diagram persist as one scene instance. Include icons via `lucide-react` (`Icon: LucideIcon` pattern).
- Add a Vitest contract test asserting the registry contains the sample and that the sample's steps match the nine normative titles/captions/eras in order (the verify script performs the same check on the built app — share the expected-data fixture if practical, but keep `scripts/verify.mjs` runnable as plain Node ESM with no TS loader).

### `scripts/verify.mjs` (`npm run verify`)
Plain Node ESM script run from the repository root, invoked by an added `verify` npm script. Phases, each reported by name with a clear PASS/FAIL line and a final summary; process exits non-zero on any failure and the failure output names the failed phase (and, for browser/transition faults, the failing step index):
1. **build** — run `npm run build` over the whole app; any type/build error fails.
2. **sample** — assert the canonical nine-step sample is present in the registry with every normative title and caption in order (e.g. by reading the registry/sample sources or the built app's exposed data; a missing, misregistered, reordered, or retitled sample fails).
3. **render** — start `vite preview` bound to `127.0.0.1` on a free port (host, readiness probe, and browser URLs all use `127.0.0.1`, never `localhost`), launch Playwright Chromium, open `/how-to-make-a-presentation`, read `data-step-count`, then press `ArrowRight` through every step asserting `data-step-index` advances each time (and that the observed titles/captions match). Capture `console.error` messages and `pageerror` uncaught exceptions; any error, or a transition that does not advance `data-step-index`, fails and names the step index.
4. Always clean up the preview subprocess and browser, including on failure/timeouts (no orphaned processes).
Add `playwright` as a devDependency (the browser itself is installed by `npx playwright install chromium`; document this in `README.md`). Accept an optional way to point the script at another project root/route list (e.g. env vars or flags) if needed so it can be run against throwaway copies; default behavior with no arguments is the repository root. Keep the script free of repository-specific assumptions beyond the sample's slug and expected data, which should live in clearly-marked constants.

### `scripts/inspect-presentation.mjs` (`npm run inspect -- <slug>`)
Project-local helper (resolves Playwright from local dependencies, so it works from the project tree), driving a production preview on `127.0.0.1`:
- Captures one screenshot per step at a standard desktop viewport (default 1280×720; optionally a `--viewport WxH`/narrow option) into a predictable directory such as `.inspect/<slug>/step-<NN>.png`. Before each capture, waits for a configurable settle interval (default long enough for the kit's layout + enter timing; flag such as `--settle <ms>`) after advancing steps.
- Prints advisory warnings (never failing the exit code solely due to advisories) that identify the step and the elements involved for: (a) visible text/chrome elements that overlap another visible text/chrome element, exempting any element inside a subtree carrying the kit's allow-overlap marker attribute; (b) the active progress indicator or active ToC entry being visually indistinguishable from inactive ones (compare computed styles of active vs inactive entries); (c) the attribution link appearing too small (e.g. font size below a sensible threshold) or browser-default (default link color/underline/typography with no author styling), with the message pointing authors to the attribution styling hook by name.
- Exits non-zero only for operational errors (preview fails, route not found, unreadable step count), not for advisories.
- Must be able to run against a controlled registered presentation, so make the preview/route targeting configurable enough (project root, slug) for tests to point it at fixture presentations.
- Add the `inspect` npm script (`node scripts/inspect-presentation.mjs`).
Run it on the finished sample and fix accidental collisions or indistinct chrome it reports (mark only intentional readable overlaps with the allow-overlap marker). Also review the first, last, dense, and a narrow-viewport view of the sample yourself with `chrome-devtools-axi` (`open`, `snapshot`, `screenshot`) as the project's CLAUDE.md requires.

Browser-backed tests (Playwright/Chromium) need Chromium available; run them in the repository's automated suite (e.g. a separate Vitest project/config or `npm run test:browser`, included in `npm test` or documented clearly — `npm test` must still pass in a full environment). Use `127.0.0.1` everywhere.

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

(The evolving-scene requirements, which the sample must conform to, are in `specs/evolving-scene-presentations/spec.md`; the skill-level visual quality bar is in `specs/presentation-skill/spec.md` "Generated presentation quality bar".)

## Test Plan
- `E2E-001: Reference presentation passes production verification` — From the repository root, `npm run verify` builds the app, checks the registered nine-step sample (titles/captions in order), starts the production preview on `127.0.0.1`, opens the sample route, and advances through all nine steps via `data-step-count`/`data-step-index`. Assert: sample registered and reachable; all normative titles/captions in order; each of the nine step indices observed with no console/page errors or failed transitions; host, readiness probe, and browser URL all `127.0.0.1`; exit code zero with a clear pass result. Implement as an automated test that invokes the command (or this is satisfied by the `verify` gate itself plus a test wrapper asserting output and exit code).
- `E2E-002: Verification failures are actionable` — In independent disposable copies of the repository (temp directory; symlink or reuse `node_modules` to avoid reinstalling; never touch the source checkout), inject one fault per phase: a build-breaking edit, a missing or out-of-order sample, a step that emits a browser error (e.g. `console.error` in a step), and a transition that does not advance the public step index. Assert every faulty copy exits non-zero, output names the failed phase and (for browser/transition faults) the offending step, no failure is reported as success, and no preview subprocess remains afterwards (check the port/process is gone).
- `INT-002: Screenshot helper emits faithful artifacts and advisory warnings` — Use a controlled registered test presentation (fixture, in a temp copy or a test-only registry entry that is not shipped in the production registry) with multiple steps and variants containing: an unmarked text collision, an explicitly allowed overlap (allow-overlap marker), indistinct active chrome, and unpolished attribution. Run the inspection helper through every step with a settle interval. Assert one predictable screenshot per step; captures happen only after transitions settle (e.g. verify the settle wait occurs between advancing and capture, or that a delayed-animation fixture is captured in its final state); the unmarked collision, indistinct active state, and attribution defect each produce step-specific advisory warnings; the allowed readable overlap produces no overlap warning.

## Done When
- All scenarios above hold; the sample's nine steps, eras, titles, and captions match the table exactly and in order, it is registered with slug `how-to-make-a-presentation`, and it renders through the kit with presentation-owned plain CSS only (kit still contains no styling).
- `npm run verify` passes from a clean `npm ci` checkout with Chromium installed and fails with actionable, phase-named output for each E2E-002 fault; `npm run inspect -- how-to-make-a-presentation` writes nine screenshots and prints advisories, with no unexplained advisories remaining on the sample.
- Automated tests for `E2E-001`, `E2E-002`, and `INT-002` exist and pass, along with the sample contract test; `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass.
- First, last, dense, and narrow-viewport sample views were inspected with `chrome-devtools-axi` and the helper's screenshots, and any accidental collisions or indistinct chrome were fixed.
- `.inspect/` (or the chosen screenshot directory) is git-ignored; `README.md` documents `npm run verify`, `npm run inspect`, and the Chromium install step.
