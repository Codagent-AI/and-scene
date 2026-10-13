# Task: Reference sample presentation and production verification gate

## Goal
Commit the self-referential nine-step sample "How to Use This Skill to Make a Presentation" and implement
`npm run verify` (`scripts/verify.mjs`) so the whole app builds and the sample is rendered through every step in
a real browser, with unambiguous pass/fail reporting. Prove the verification contract with the E2E tests.

## Background
Already in the repo: the scene kit in `src/presentation-kit/`, the
pathname router in `src/main.tsx`, `src/Landing.tsx`, and an explicit registry `src/presentations/index.ts`
(`{ slug, title, load: () => import('./<dir>/Talk') }`). Read those first and reuse their exports; do not alter the
kit's style-neutral contract. Kit hooks you can rely on (exact spellings): `data-step-count` and
`data-step-index` on the chrome root (`data-presentation-chrome`, which also carries
`data-presentation-mode="present"|"browse"`); `data-presentation-title`, `data-presentation-caption`;
`data-presentation-progress-item`, `data-presentation-toc-item`, `data-presentation-prev`,
`data-presentation-next`, `data-presentation-attribution`; active nav items carry
`data-presentation-active="true"` plus `aria-current`; `data-presentation-allow-overlap` marks intentional
overlap; Landing anchors carry `data-presentation-link`. If any of these are missing or misnamed, fix the kit
to match rather than inventing new names.

Rules: use `127.0.0.1` everywhere (preview host, readiness probe, browser URLs). No CI config. Test-first for
verification behavior. Keep all visual styling in presentation-local plain CSS (e.g. `style.css` in the sample
folder); no Tailwind. Use `chrome-devtools-axi` to inspect the sample's first, last, and dense steps and a
narrow viewport, and fix visual problems (use AXI
screenshots).

### Sample layout (fixed by the design)
```
src/presentations/how-to-make-a-presentation/
  entities.ts      # this presentation's layoutId namespace (stable entity ids)
  steps/*.tsx      # 9 Step objects composing kit primitives (use grouped scenes: a shared groupKey/Scene so the scene persists and entities only accumulate/morph)
  Talk.tsx         # <Presentation steps={STEPS} title=… initialMode="browse" />
  <local>.css      # presentation-owned styling: palette, type, spacing, active-chrome distinction, legible attribution
```
Register slug `how-to-make-a-presentation` in `src/presentations/index.ts` with title "How to Use This Skill to
Make a Presentation". Per-step visual design (coordinates, shapes, colors, motion timing) is yours to settle,
within the scene intent in the spec table. Entities accumulate; they are never rearranged or redrawn. Show the
bottom-right attribution legibly styled; mark any intentional overlap with `data-presentation-allow-overlap`.
Keep the fixed 880 × 380 canvas content clear of chrome.

### Verification script decisions
`scripts/verify.mjs`, invoked by `"verify": "node scripts/verify.mjs"`, in this order:
1. `npm run build` (`tsc -b && vite build`) over the whole app; failure → fail phase "build".
2. Static sample check (no browser needed): with `verify.config.json` loaded, assert each configured reference
   presentation's slug is registered in `src/presentations/index.ts`; absent → fail phase "sample".
3. Start `vite preview` on `127.0.0.1` (explicit `--host 127.0.0.1` and fixed/probed port), poll readiness at the
   IPv4 URL, then drive Chromium via Playwright to the sample route (browser URLs also `127.0.0.1`). Confirm
   the route is reachable (the landing page's `data-presentation-link` anchors include it), read
   `data-step-count`, and press `ArrowRight` through every step asserting `data-step-index` advances by exactly
   one each time. While traversing (browse mode), read each step's title and caption via the hooks and assert
   they equal the normative table in order; a mismatch or wrong step count fails phase "sample".
4. Any `console.error`, `pageerror`, or failed/non-advancing transition fails and reports the failing step index.
5. Always kill the preview subprocess (including on failure); exit non-zero on any failure with output naming
   the failed phase (`build`, `sample`, `render`, `transition`) and step where relevant, and print a clear
   PASS line on success.

This script will be copied verbatim into a distributable bootstrap template, so
make it project-agnostic: the reference-sample requirement comes from a root `verify.config.json`
(`{ "referencePresentations": [{ "slug": "...", "steps": [{ "title": "...", "caption": "..." }] }] }`). This repo's
config lists the nine normative steps; a scaffolded project ships an empty list. In addition to configured
reference presentations, the script discovers other registered routes from the landing page's
`data-presentation-link` anchors and renders each through all steps with the same error checks. A configured
reference slug that is absent from the registry/landing fails the "sample" phase.

Add `playwright` as a devDependency (update `package-lock.json`), document `npx playwright install chromium`
in README, and add a `test:e2e` script (a Vitest config/directory such as `tests/e2e/` kept out of the default
`npm test` run) alongside the existing scripts.

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


## Test Plan
These E2E obligations first become executable in this task; implement them as automated tests (`npm run test:e2e`).

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


Implementation notes for E2E-002: build each throwaway copy by copying the repo (excluding `node_modules`,
`dist`, `.git`) into a temp directory with `node_modules` symlinked or reused, inject one fault per copy (e.g. a
type error; remove or reorder the sample's registry entry or a step title; a step that calls `console.error` on
mount; a nav handler that does not advance `data-step-index`), run `npm run verify` there, and assert non-zero
exit, phase/step naming in output, and that no `vite preview` process remains (check the port is free). The
source checkout must be untouched.

## Done When
- The sample exists, is registered at `/how-to-make-a-presentation`, and implements the nine steps' titles, captions, eras, and scene intent in order; it reads as one continuously evolving scene (grouped, entities accumulate/morph, never redrawn).
- The sample's styling lives in presentation-owned plain CSS; active ToC/progress chrome is visibly distinct and the attribution is legible.
- `npm run verify` passes from the repo root with a clear PASS result; `verify.config.json` exists and lists the nine steps.
- E2E-001 and E2E-002 pass via `npm run test:e2e`; failures name the phase and step and always clean up the preview.
- AXI inspection of first, last, dense (e.g. steps 3–4 and 7), and a narrow viewport shows no accidental collisions with chrome (fix any).
- `npm test`, `npm run lint`, `npm run build`, `npm run verify` all pass.
