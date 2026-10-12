# Task: Presentation skill and bootstrap templates

## Goal
Author the distributable `presentation` agent skill (`skills/presentation/SKILL.md`) and its scaffold templates so an agent can, from a topic, interview the user, self-bootstrap a Vite + React + TypeScript presentation project anywhere (standalone or monorepo), generate or modify registered presentations, and self-verify them. Verify that the bootstrap template really materializes into a working, style-neutral project outside this repository.

## Background
Everything the templates must snapshot already exists in this repository: the canonical kit in `src/presentation-kit/`, the host shell (`src/main.tsx`, `src/Landing.tsx`, `src/presentations/index.ts`), the worked sample in `src/presentations/how-to-make-a-presentation/`, and the portable scripts `scripts/verify.mjs`, `scripts/inspect-presentation.mjs` (plus any reference-sample data file they use, which must NOT be shipped in the bootstrap so verify runs in generic mode). Read them, `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, and `index.html` before writing templates.

Design decisions (from `design.md`):
- **Skill is hybrid**: `SKILL.md` carries the agent procedure and quality bar; `templates/` and the kit keep output consistent. Frontmatter `name: presentation` with a trigger-oriented `description`. The skill name defaults to `presentation` (`skills/presentation/`).
- **Procedure**: (1) Gather: ask one question at a time for topic, visual style, and each step's content plus visual description; optionally draw ASCII mockups for key or complex steps only; the user controls depth and may proceed with partial detail. (2) Resolve target and scaffold if needed: detect the three contract anchors (build setup, scene kit, presentation index) at contract level, resolve a target, scaffold what is missing from `templates/`, install the full dependency set; in a non-empty project, state the target and confirm first. (3) Generate or modify: write `entities.ts` + `steps/*` + `Talk.tsx` + presentation-local plain CSS (create), or make scoped edits to an identified presentation (modify; list presentations and ask which when ambiguous); register new presentations with one line in `presentations/index.ts`. (4) Self-verify: run the build and render check, fix failures, run the project-local screenshot helper, inspect first, last, and dense or key steps (and a narrow viewport when responsive-sensitive) in a browser, review advisory warnings, fix accidental collisions and chrome polish, and mark only genuinely intentional overlaps with the kit's allow-overlap marker. The skill may run the lighter build plus a single-route render first and reserve full `npm run verify` for completion, but must never report success on broken output.
- **Scaffold target resolution**: empty or standalone project → scaffold at the root; monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout) → scaffold a self-contained app under `presentations/` instead of mutating the monorepo root; already inside a presentation app (anchors present) → use it and scaffold only the missing anchors. Document the finalized signal set in SKILL.md (open question in the design; behavior is fixed).
- **Required dependency set** the scaffold ensures (never assume any are present): runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack used by this repo, and `playwright`. No Tailwind, no Tailwind Vite plugin, no default CSS theme, colors, fonts, card or button styles, or any other styling framework unless the host already uses one or the user explicitly asks. Partial scaffolds merge the missing dependencies into the existing `package.json` without clobbering other entries.
- **Templates**: `skills/presentation/templates/bootstrap/` is a release snapshot of a fresh project: `package.json` with scripts (`dev`, `build`, `lint`, `preview`, `verify`, `inspect`) and a committed `package-lock.json`, tsconfig files, `vite.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/Landing.tsx`, an empty `src/presentations/index.ts` registry, a host-only `src/index.css` with no visual defaults, the full `src/presentation-kit/` copy, and `scripts/verify.mjs` + `scripts/inspect-presentation.mjs`. A separate presentation template under `skills/presentation/templates/` (for example `presentation/`) provides the skeleton for `entities.ts`, `steps/*`, `Talk.tsx`, and a CSS file with no styling presets beyond placeholders for the author's own look. The skill must say to resolve every template path relative to the directory containing `SKILL.md`, never the caller's working directory.
- **Drift control**: `src/presentation-kit/` is canonical; the bootstrap copy must stay byte-aligned for non-test kit files, and the root `scripts/` must stay aligned with the bootstrap script copies. Add a parity check (an automated test, run by the integration suite) that fails when they differ, and note the sync rule in `skills/presentation/SKILL.md` maintenance notes and `README.md`. Templates must be excluded from the root `tsc -b` project but remain lint-clean or explicitly ignored by the root ESLint config.
- Update `README.md` with how to run, test, verify, inspect, and use the skill. Do not add CI configuration. Do not commit `node_modules`, `dist`, or screenshots. Use `127.0.0.1` for local browser automation.

Verify the skill text for quality with a read-through: it should be actionable, concise, and cover every scenario below. Its description of the visual check should prefer the project-local `npm run inspect -- <slug>` helper, and where a temporary Playwright helper is needed it must be written under the project root so dependencies resolve locally.

## Spec
(Capability: `presentation-skill`, all requirements apply. The `Visual inspection artifacts` requirement from `presentation-verification` also applies to the scaffold because the helper must ship in the bootstrap.)

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
Assigned automated obligation (from `test-plan.md`):

- `INT-001` Materialized bootstrap is complete and style-neutral. Boundary: the distributable `skills/presentation/templates/bootstrap/` snapshot is copied into a fresh filesystem location and exercised through its package scripts and the canonical scene-kit contracts. Setup: materialize the bootstrap in an isolated temporary directory, install its declared dependencies from the committed lock data (`npm ci`), and invoke it from a working directory outside the source repository (also prove template lookup does not depend on the caller's cwd, for example with a small resolver the test exercises or by checking SKILL.md instructions plus the helper path logic). Action: instantiate the presentation template with a slug and register it in the materialized app (this supplies the "registered route"; the bootstrap itself ships an empty registry), build the materialized app, open the registered route through its local verification entry point (`npm run verify` in generic mode), and compare non-test scene-kit files with `src/presentation-kit/`. Assertions: build and route smoke check pass; all three anchors and the complete dependency set (React, Vite, TypeScript, Motion, Lucide, lint, Playwright) are present in `package.json`; the canonical and template kit files are byte-aligned (and root vs. bootstrap scripts aligned); neither the kit nor the scaffold introduces Tailwind or visual defaults (no tailwind dependency or plugin, no color/font/border/shadow/theme-token declarations in kit or scaffold CSS). Runs in the repository's automated integration suite (`npm run test:integration`).

Agent acceptance tests `AT-001` through `AT-004` are executed outside implementation; do not run them here, but write the skill so they can pass.

## Done When
- `skills/presentation/SKILL.md` exists with valid frontmatter, the four-step procedure, target-resolution rules, dependency set, the quality bar, and scenario coverage above; templates exist under `skills/presentation/templates/`.
- `INT-001` and the kit/script parity check pass under `npm run test:integration`; a partial-scaffold test (some anchors present, e.g. build setup only) shows only missing anchors and dependencies are added without disturbing existing files, and a monorepo-signal test shows the `presentations/` target is chosen (if target detection is implemented as a script or documented pure function; if it is prose-only, keep the signals unambiguous in SKILL.md).
- `README.md` documents usage; root `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm run verify`, `npm run test:integration`, and `npm run inspect -- how-to-make-a-presentation` all pass.
- Because the proposal requires a verification flow that exercises the skill on a sample topic, you followed the finished `SKILL.md` procedure end to end in a disposable copy of the project (scaffold from `templates/`, create a throwaway presentation on a sample topic using a complete prompt, register it, build, render, run the screenshot helper), confirmed it passes `npm run verify` there, and deleted the copy. Any convention in the committed sample `src/presentations/how-to-make-a-presentation/` that differs from what `SKILL.md` and the presentation template prescribe (folder layout, `entities.ts`, `steps/*`, `Talk.tsx`, local CSS, one-line registry entry) was reconciled, and `SKILL.md` names the sample as the worked example.
- As the final completion check for the whole change, you ran the full suite above and inspected the first, last, a dense, and a narrow-viewport step of the sample with `chrome-devtools-axi` and the screenshot helper.
