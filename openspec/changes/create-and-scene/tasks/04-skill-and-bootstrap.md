# Task: Author the presentation skill and bootstrap templates

## Goal
Deliver the distributable agent skill `skills/presentation/SKILL.md` and its `templates/` (a self-contained bootstrap app snapshot plus presentation templates) so an agent can gather requirements, scaffold a missing presentation app (standalone root or monorepo `presentations/` subdirectory), create or modify presentations, and self-verify — and prove with an automated integration test that the materialized bootstrap builds and renders outside this repository.

## Background
You MUST read `design.md` (sections "Skill", "Repository layout", "Decisions" 5–7, "Risks") and the canonical specs `specs/presentation-skill/spec.md` (copied below), `specs/evolving-scene-presentations/spec.md` (style ownership), and `specs/presentation-verification/spec.md` (verification/inspection scripts).

Already present in this repository (read before starting): the canonical kit `src/presentation-kit/`, the router `src/main.tsx`, `src/Landing.tsx`, the explicit registry `src/presentations/index.ts`, the worked sample `src/presentations/how-to-make-a-presentation/` (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-local CSS), `scripts/verify.mjs` + `scripts/verification.config.json` (verification driven by a config listing presentations to check; `expectedSteps` optional per entry), `scripts/inspect-presentation.mjs`, and npm scripts `test`, `lint`, `build`, `verify`, `inspect`. Kit hooks: `data-step-count`, `data-step-index`, `data-presentation-*` (including `data-presentation-attribution` and `data-presentation-allow-overlap`), active state `aria-current="step"` + `data-presentation-active="true"`.

Layout to create:
```
skills/presentation/
  SKILL.md                      # frontmatter (name: presentation, description) + procedure
  templates/
    bootstrap/                  # a complete, minimal, style-neutral app snapshot
      package.json              # full dependency set + scripts (dev, build, lint, preview, test if useful, verify, inspect)
      package-lock.json         # committed lock data so INT-001 can install deterministically
      index.html, vite.config.ts, tsconfig*.json, eslint.config.js, .gitignore (incl. .inspection/, dist/)
      src/main.tsx, src/Landing.tsx, src/index.css
      src/presentation-kit/**   # copy of canonical src/presentation-kit/ (byte-identical, non-test files)
      src/presentations/index.ts + a tiny starter presentation (registered, routed) so verify can smoke-test the fresh app
      scripts/verify.mjs, scripts/inspect-presentation.mjs, scripts/verification.config.json
    presentation/               # templates for a NEW presentation: entities.ts, steps/*.tsx, Talk.tsx, plain-CSS file, registry-line snippet
```
Decisions to follow:
- The skill's `templates/` is a release snapshot used only to bootstrap fresh projects; the canonical kit stays in `src/presentation-kit/`. The bootstrap `src/presentation-kit/**` non-test files MUST be byte-identical to the canonical ones, and `scripts/verify.mjs` / `scripts/inspect-presentation.mjs` MUST stay aligned with the root copies (CLAUDE.md requirement). Provide a small sync script (e.g. `scripts/sync-bootstrap-templates.mjs` — or an npm script `sync:templates`) that regenerates the snapshot copies from the canonical sources so drift is easy to fix, and add the alignment assertion to the automated tests (below). The bootstrap's own `verification.config.json` lists the starter presentation without `expectedSteps`.
- The scaffold is styling-framework-neutral: no Tailwind, no Tailwind Vite plugin, no theme tokens, no default colors/fonts/card/button styles in the kit or bootstrap CSS (the `index.css` may only hold minimal reset/layout needed to size the app, with no palette or typography choices; the starter presentation ships only structural CSS that is clearly a placeholder to be restyled, or none at all).
- Required dependency set in the bootstrap `package.json`: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack (match the root `package.json` versions), and `playwright`. Tailwind or another framework is added only when the host already uses it or the user explicitly asks.
- SKILL.md must be written for an agent with no other context and must contain:
  1. **Gather** — ask one question at a time (topic, visual style, each step's content and visual description); never invent details the user can still give; accept an explicit "build with partial detail" choice with no hard completeness gate; if the prompt already has topic, style, and all steps, proceed without more questions; optionally draw ASCII mockups for key/complex steps only.
  2. **Resolve target + scaffold** — detect the three contract anchors by contract rather than byte equality: build setup (Vite + React + TS app with a working `npm run build`), scene kit (step contract, stage/host, nav, chrome, fit-scale canvas), presentation index (registry mapping presentations to routes). Target resolution: empty/standalone → root; monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) → a self-contained app in `presentations/`; already inside a presentation app → use it, scaffold only missing anchors. All anchors present → skip scaffolding. Partial → add only missing anchors (and their dependencies) without disturbing existing ones. In a non-empty project missing the scene kit or index, state the target and wait for confirmation before writing. Install the full dependency set (never assume deps are present) and ensure Chromium for Playwright. Resolve every template path relative to the directory of `SKILL.md` itself (not the caller's working directory), and say so explicitly.
  3. **Generate / modify** — create: write `entities.ts` + `steps/*` + `Talk.tsx` + presentation-local plain-CSS in the presentation's own folder, register in `presentations/index.ts` via one new line AND add the new slug to `scripts/verification.config.json` (append an entry, preserving existing entries) so `npm run verify` actually builds and renders the new or modified presentation through every step rather than only the starter or reference sample, preserve existing presentations; styling stays in presentation/host files, plain CSS by default unless the host already uses a framework or the user asks for one. Modify: if the target is unspecified/ambiguous, list the existing presentations and ask which before changing anything; then ask only about the requested changes and edit that presentation in place without re-walking the create flow.
  4. **Evolving-scene rules** — one scene, stable `layoutId`s, grouped steps via `groupKey`/shared Scene, entities accumulate instead of being redrawn, newcomers via `Appear`, intentional overlaps preserved and marked with `data-presentation-allow-overlap`; stable `data-presentation-*` hooks to style; presentation-owned CSS must make the active ToC/progress item visibly distinct and the attribution (`data-presentation-attribution`) legible.
  5. **Self-verify before reporting done** — run `npm run build` and `npm run verify` (confirm the target presentation's slug is present in `scripts/verification.config.json` and appears in the verify output; the skill may run build + a first-step render check while iterating and reserve full `npm run verify` for completion, but must never report success over broken output); run the project-local `npm run inspect -- <slug>` (prefer it to ad hoc scripts; if absent, any temporary Playwright helper lives under the project root); inspect screenshots of the first step, last step, and dense/key steps, plus a narrow viewport (`--viewport 390x844`) for responsive-sensitive presentations; review every advisory warning, fix accidental collisions / indistinct active chrome / unpolished attribution, mark only genuinely intentional readable overlaps as allowed, rerun, and report remaining advisory status accurately. Failures are fixed and re-checked, not reported as success.
  6. **Quality bar** — builds with no type errors; first step renders without runtime/console errors; each step has a caption; next/previous navigation works; visual composition passes; conforms to the evolving-scene model.
- Presentation templates should produce compilable output when filled in and be consistent with the canonical sample's structure; keep `{{placeholders}}` out of files that must compile as-is in the bootstrap (the starter presentation in the bootstrap must build verbatim).
- Add `skills/` handling so lint/tsc for the root project don't choke on templates (exclude `skills/**/templates/**` from root `tsc`/ESLint if necessary) and `.gitignore`-safe (no `node_modules`/`dist` committed in templates). Add a short README section describing the skill and the template sync command.

## Spec
Copied from `specs/presentation-skill/spec.md`:

### Requirement: Interactive requirement gathering
The skill SHALL gather presentation details by asking the user clarifying questions one at a time — covering the topic, the visual style, and the content and visual description of each step. The user controls how much to specify; the skill SHALL NOT assume details the user can still provide, but SHALL allow the user to proceed with partial detail and iterate. The skill MAY, at its discretion, draw ASCII mockups to represent key or complex steps when doing so helps confirm the intended visual layout.

#### Scenario: Prompt is missing details
- **WHEN** the skill is invoked with a prompt that omits the topic, visual style, or per-step descriptions
- **THEN** the skill asks for the missing information one question at a time rather than assuming it

#### Scenario: User proceeds with partial detail
- **WHEN** the user chooses to build after providing only some details
- **THEN** the skill generates a presentation from what was captured without blocking on a hard completeness gate

#### Scenario: Prompt already complete
- **WHEN** the prompt already contains the topic, style, and all step details
- **THEN** the skill may proceed to build without further questions

#### Scenario: ASCII mockup for a complex step
- **WHEN** a step's visual layout is key or complex
- **THEN** the skill may present an ASCII mockup of that step to the user to confirm the layout before building, without doing so for every step

### Requirement: Self-bootstrapping scaffold
Before creating or modifying a presentation, the skill SHALL ensure the project provides the infrastructure a generated presentation depends on, SHALL resolve where that infrastructure belongs, and SHALL scaffold whatever is missing — including installing the dependencies the infrastructure requires. The required infrastructure is three contract anchors:

1. **Build setup** — a Vite + React + TypeScript app with a working `npm run build`.
2. **Scene kit** — the reusable, presentation-agnostic engine: the `Step`/`Scene` step contract, the stage/host that mounts the active step and runs entity morphs, the present/browse navigation, and the chrome (captions, table of contents) and fit-scale canvas.
3. **Presentation index** — the registry that maps each presentation to its own route so that multiple presentations coexist.

Detection is contract-level, keyed on the presence of these anchors rather than a byte-identical scaffold, so cosmetic differences (file naming, formatting, extra dependencies) do not trigger re-scaffolding. When scaffolding, the skill SHALL NOT assume the required dependencies are already installed.

The scaffold SHALL be styling-framework-neutral and SHALL ship with zero presentation styling defaults. It SHALL install the runtime and build dependencies needed for React, Vite, TypeScript, Motion, Lucide icons, linting, and render verification, but it SHALL NOT require Tailwind, a Tailwind Vite plugin, a default CSS theme, default colors, default fonts, default card styles, default button styles, or any other styling framework. Styling systems MAY be added by the presentation author or host project after scaffolding.

The skill SHALL resolve scaffold templates relative to the skill file that declares them, so agents do not depend on the user's current working directory when locating `templates/bootstrap/` or presentation templates.

#### Scenario: Empty or fully unscaffolded directory
- **WHEN** the skill runs in an empty directory or a project with none of the three anchors present
- **THEN** it performs a full scaffold (build setup, scene kit, and presentation index) and installs the required dependencies before creating the presentation

#### Scenario: Already scaffolded
- **WHEN** all three anchors are already present
- **THEN** the skill skips scaffolding and proceeds directly to creating or modifying the presentation

#### Scenario: Partial scaffold
- **WHEN** some but not all anchors are present
- **THEN** the skill scaffolds only the missing anchors (and their dependencies) without disturbing the ones already present

#### Scenario: Scaffold does not impose a style system
- **WHEN** the skill scaffolds a presentation app
- **THEN** the generated app can build without Tailwind or another styling framework
- **AND** the scaffold does not define default presentation colors, fonts, spacing scale, card styles, button styles, borders, shadows, or CSS theme tokens

#### Scenario: Templates resolve from skill directory
- **WHEN** the skill copies bootstrap or presentation templates
- **THEN** it resolves those paths relative to the skill's own `SKILL.md` directory

#### Scenario: Monorepo target
- **WHEN** the skill runs inside a monorepo
- **THEN** it scaffolds the presentation app into a `presentations/` directory as its own self-contained app rather than at the repository root

#### Scenario: Standalone project target
- **WHEN** the skill scaffolds in an empty or standalone (non-monorepo) project
- **THEN** it scaffolds the presentation app at the repository root

#### Scenario: Non-empty project missing scaffolding
- **WHEN** the project is non-empty but lacks the scene kit or presentation index
- **THEN** the skill states the target location it will scaffold into and proceeds only after the user confirms

### Requirement: Create a new presentation
The skill SHALL generate a new presentation as a self-contained unit reachable at its own route and registered so that multiple presentations coexist.

#### Scenario: New presentation is self-contained and routed
- **WHEN** a new presentation is created
- **THEN** it is written as its own folder, reachable at its own route, and registered in the presentation index

#### Scenario: Presentation owns its visual style
- **WHEN** the skill creates a presentation with a designed visual look
- **THEN** the styling is added in files owned by that presentation or by the host app rather than in the reusable scene kit
- **AND** plain CSS is the default styling approach unless the host project already uses a styling framework or the user explicitly requests one

#### Scenario: Existing presentations are preserved
- **WHEN** a new presentation is created and other presentations already exist
- **THEN** the existing presentations remain intact and reachable

### Requirement: Modify an existing presentation
The skill SHALL support modifying an existing presentation, identifying the target first and asking only about the requested changes.

#### Scenario: Target unspecified or ambiguous
- **WHEN** the skill is asked to modify a presentation without a clear target
- **THEN** it lists the existing presentations and asks which to modify before changing anything

#### Scenario: Scoped modification
- **WHEN** the target presentation is identified
- **THEN** the skill asks only about the requested changes (steps, entities, or style) and edits that presentation without re-walking the full create flow

### Requirement: Self-verify before reporting completion
Before reporting success, the skill SHALL confirm that the generated or modified presentation builds, renders without errors, and is visually coherent in a browser, fixing any failures itself. The render check SHALL at minimum render the presentation's first step without runtime or console errors; the full multi-step render check across every step is defined by the `presentation-verification` capability. The visual composition check SHALL inspect screenshots or an equivalent browser view of the first step, the last step, and any dense/key steps; responsive-sensitive presentations SHALL also be checked at a narrow viewport. When a project-local screenshot helper is available, the skill SHALL prefer it over ad hoc scripts outside the project tree so browser tooling resolves from local dependencies, settled screenshots are captured after animations complete, and advisory visual warnings can be reviewed.

#### Scenario: Checks run before done
- **WHEN** the skill finishes generating or modifying a presentation
- **THEN** it runs the build, at least a first-step render check, and a browser visual composition check before reporting completion

#### Scenario: Failures are fixed, not reported as success
- **WHEN** the build, render, or visual composition check fails
- **THEN** the skill fixes the issues and re-checks rather than reporting success

### Requirement: Generated presentation quality bar
Every generated presentation SHALL build with no type errors, render its first step without runtime errors, present a caption per step, support next/previous navigation, pass a visual composition check, and conform to the evolving-scene model.

#### Scenario: Builds clean
- **WHEN** a presentation is generated
- **THEN** `npm run build` completes with no type errors

#### Scenario: Renders without errors
- **WHEN** the presentation route is opened
- **THEN** it renders its first step with no runtime or console errors

#### Scenario: Captions and navigation present
- **WHEN** viewing a presentation
- **THEN** each step shows a caption and the user can navigate to the next and previous steps

#### Scenario: Visual composition is inspected
- **WHEN** a presentation is generated or modified
- **THEN** key browser screenshots or equivalent browser views show that important scene content fits the fixed canvas, intentional overlaps remain readable, and content does not collide with chrome such as captions, progress indicators, table of contents, or navigation controls

#### Scenario: Screenshot helper is project-local
- **WHEN** the skill captures screenshots for visual inspection
- **THEN** it uses the scaffolded project-local helper when available, or otherwise writes any temporary Playwright helper under the project root

#### Scenario: Visual warnings are reviewed
- **WHEN** the screenshot helper emits overlap or chrome-polish warnings
- **THEN** the skill reviews the referenced steps, fixes accidental collisions or indistinct current-step chrome, and marks only intentional readable overlaps as allowed

#### Scenario: Active chrome and attribution are styled locally
- **WHEN** the generated presentation includes table-of-contents, progress, navigation, or attribution chrome
- **THEN** presentation-owned or host-owned CSS makes the active step visibly distinct and the attribution legible
- **AND** the reusable scene kit remains free of default colors, fonts, borders, button styles, and theme tokens

Also from `specs/evolving-scene-presentations/spec.md` — "Style ownership boundary": the scene kit and the scaffold have zero styling defaults and no styling-framework dependency; presentations/hosts own palette, typography, spacing, borders, and shadows.

## Test Plan
- **INT-001 — Materialized bootstrap is complete and style-neutral** (`test-plan.md`). Boundary: the distributable `skills/presentation/templates/bootstrap/` snapshot is copied into a fresh temp directory and exercised through its package scripts. Setup: materialize it in an isolated temp dir outside the repo, install dependencies from the committed lock data (`npm ci`), and invoke from a working directory outside the source repository (the test resolves the template path from the skill file, not from `process.cwd()`). Action: build the materialized app, run its local verification entry point against its registered starter route, and compare non-test kit files with canonical `src/presentation-kit/`. Assert: build and route smoke check pass; all three anchors and the full React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; canonical and template kit files are identical (also assert `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` alignment with the root copies); neither the kit nor the scaffold introduces Tailwind or visual defaults. Runs in the repository's automated integration suite (`npm test`) on every PR; allow a long timeout and reuse a local npm cache if available, but the app build and browser smoke check must be real.
- Acceptance tests AT-001 to AT-004 are executed later by an acceptance pass, not by you, but SKILL.md must make those journeys work (partial-detail opt-in, monorepo `presentations/` target with confirmation, reuse of existing anchors, ambiguous modification listing, verify/inspect repair loop).

## Done When
- `skills/presentation/SKILL.md` and `templates/` exist as described; SKILL.md covers every scenario above and refers to templates relative to its own directory.
- INT-001 and a template-alignment test exist as automated tests, run under `npm test`, and pass; the sync command regenerates the snapshot and leaves a clean `git diff` when run on an aligned tree.
- Manually prove the skill's end-to-end procedure on a sample topic (the proposal's "invoke the skill on a sample topic" flow): follow `SKILL.md` literally, as an agent with no other context would, in a throwaway directory outside the repo — scaffold from the bootstrap, then create a small new presentation on a sample topic from `templates/presentation/` (registry line + `verification.config.json` entry), and confirm `npm run verify` output names the new slug's route and checks every step, `npm run inspect -- <new slug>` produces settled screenshots, and a second, pre-existing presentation stays intact and reachable. Then run the same procedure in this repository (all three anchors already present, so the skill must skip scaffolding) with the approved nine-step outline from `specs/presentation-verification/spec.md` as the gathered inputs, to finalize the committed `how-to-make-a-presentation` sample through the skill itself (the spec describes it as built by the skill): keep every normative title, caption, era, order, and scene intent, keep the existing registry and `verification.config.json` entries intact, and rerun `npm test`, `npm run verify`, and `npm run inspect -- how-to-make-a-presentation` afterwards.
- Manually prove the skill's bootstrap path: materialize the bootstrap in a throwaway directory outside the repo, `npm ci`, `npm run build`, `npm run verify`, `npm run inspect -- <starter slug>`; then dry-run the "create presentation" template flow there (add a presentation from `templates/presentation/` plus its registry line) and confirm build + verify pass. Inspect the result in a browser with `chrome-devtools-axi`. Remove the throwaway directory afterwards.
- The root project is unaffected by the templates: `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass; no `node_modules`, `dist`, or screenshots are committed under `skills/`.
- Before reporting the change complete, inspect representative first, last, dense, and narrow-viewport steps of the sample with `chrome-devtools-axi` and `npm run inspect -- how-to-make-a-presentation`.
