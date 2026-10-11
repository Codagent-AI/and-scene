# Task: Presentation skill and bootstrap templates

## Goal
Deliver the distributable agent skill at `skills/presentation/` — a `SKILL.md` procedure plus a self-contained bootstrap template snapshot — so an agent can gather requirements, scaffold a missing Vite/React/TypeScript app, scene kit, and presentation index (standalone or monorepo), create or modify presentations, and self-verify before reporting done.

## Background
Existing state: the repository already contains the canonical kit (`src/presentation-kit/`), router and explicit registry (`src/main.tsx`, `src/Landing.tsx`, `src/presentations/index.ts`), the nine-step sample, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, Vitest, ESLint, and Playwright. The skill packages these for reuse in other projects. Read them (including documented `data-presentation-*` hooks) before writing templates. Also read the skill-quality review at `.validator/reviews/skill-quality.md` and `AGENTS.md` and follow any skill-authoring rules there.

Design decisions (from `design.md`):

- **Layout**: `skills/presentation/SKILL.md` (procedure) and `skills/presentation/templates/`, including `templates/bootstrap/` (a complete minimal app) and presentation templates (a presentation folder with `entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-owned plain CSS). Templates are a **release snapshot** of the kit: non-test files under `templates/bootstrap/src/presentation-kit/` must remain byte-identical to `src/presentation-kit/` (parity is checked by a test), and the bootstrap copies of `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` must stay aligned with the root scripts. Add a note in `CLAUDE.md`'s guidance only if one is missing (it already states the alignment rule).
- **Bootstrap template** contains: `package.json` with scripts `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `verify` (`node scripts/verify.mjs --smoke`, the script's route-smoke mode that renders every step of a registered presentation without requiring the canonical reference sample; the root repository's strict default mode is unchanged), `inspect`, and the full dependency set — runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, and `playwright` — plus a committed `package-lock.json` (so installs are reproducible), tsconfigs, `vite.config.ts`, `eslint.config.js`, `index.html`, `.gitignore` (including inspection artifacts and build output), minimal `main.tsx` router, `Landing.tsx`, a host-only `index.css` that is deliberately minimal and defines no theme tokens, the kit, a `presentations/index.ts` registering a tiny, style-neutral starter presentation (built from the presentation template) so the route smoke check has a registered route to open — the materialized app must build, and `npm run verify` (smoke mode) must pass in it, and the verify/inspect scripts. **No Tailwind, no Tailwind Vite plugin, no default CSS theme, colors, fonts, card or button styles** anywhere in the scaffold or kit.
- **Skill procedure**:
  1. *Gather*: ask one question at a time for topic, visual style, and each step's content and visual description; never assume details the user can still provide; accept an explicit choice to proceed with partial detail without a hard completeness gate; may proceed without questions when the prompt is already complete; may draw ASCII mockups for key/complex steps only.
  2. *Resolve target and scaffold if needed*: detect the three contract anchors (build setup with a working `npm run build`; scene kit; presentation index) at the contract level (presence of the `Step`/`Scene` contract, stage/host, nav, chrome, fit-scale canvas; a registry mapping presentations to routes), not byte-identical scaffolds, so cosmetic differences don't trigger re-scaffolding. All three present → skip scaffolding. Partial → scaffold only missing anchors and their dependencies without disturbing existing ones. Never assume dependencies are installed; install the full dependency set. Target resolution: empty/standalone → app at root; monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) → self-contained app under `presentations/` rather than mutating the monorepo root; already inside a presentation app → use it. In a non-empty project lacking the kit or index, state the exact target location and proceed only after user confirmation. Resolve all template paths relative to the directory of `SKILL.md` itself, never the caller's working directory (document how, e.g. "paths below are relative to this file's directory"; if the skill ships a helper script for copying, it must resolve via `import.meta.url`/`__dirname`).
  3. *Generate / modify*: create = write `entities.ts` + `steps/*` + `Talk.tsx` + presentation-owned plain CSS in its own folder and add one explicit registry line; existing presentations stay intact and reachable. Plain CSS is the default styling approach unless the host already uses another framework or the user explicitly asks for one. Modify = if the target is missing/ambiguous, list existing presentations and ask which before changing anything; then ask only about the requested changes and make scoped edits without re-walking the create flow.
  4. *Self-verify*: run the build, at least a first-step render check, and a browser visual composition check before reporting completion; prefer the project-local `npm run inspect -- <slug>` helper (or write any temporary Playwright helper under the project root, never outside it) and capture settled screenshots of the first step, last step, and dense/key steps (plus a narrow viewport when the presentation is responsive-sensitive); fix failures and re-check instead of reporting success; review advisory warnings, fix accidental collisions and indistinct current-step chrome, mark only intentional readable overlaps with the allow-overlap marker; style the active progress/ToC state and attribution in presentation-owned CSS. The skill may run the lighter build + single-route render first and reserve the full `npm run verify` for completion but must not report success on broken output, and it must report remaining advisory status accurately.
- Keep `SKILL.md` concise and procedural; skill name `presentation`; follow the skill frontmatter conventions used by other skills (name, description with trigger phrases).
- Use TDD; tests live in the Vitest suite. Use `127.0.0.1` for local browser automation. Do not add CI configuration. Do not commit `node_modules`, build output, or screenshots, including any inside `templates/`.

Test strategy: INT-001 below materializes the template into a temporary directory outside the repository, installs from the template's own committed lock data (a repository-local package cache is permitted to avoid network), builds it, runs a route smoke check through its own local `verify`/render entry point from a working directory outside the source repository, compares kit parity, and scans for style-neutrality violations. Because this installs dependencies, keep it in a clearly named integration test (or script such as `npm run test:integration`) that is part of the repository's automated suite and documented.

## Spec
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

Style-ownership scenarios the template and kit snapshot must satisfy (the kit itself is already style-neutral; this task's portion is that the scaffold and its snapshot stay so):

#### Scenario: Unstyled kit output
- **WHEN** a presentation uses scene kit primitives without presentation-owned CSS
- **THEN** the kit does not supply fallback colors, fonts, borders, shadows, card treatments, or button treatments

#### Scenario: Optional styling frameworks remain optional
- **WHEN** a presentation author wants to use Tailwind or another styling framework
- **THEN** that framework is configured by the presentation or host app, not required by the reusable scene kit

## Test Plan
- `INT-001` (Materialized bootstrap is complete and style-neutral): Materialize `skills/presentation/templates/bootstrap/` into an isolated temp directory, install declared dependencies from the template's committed lock data, and invoke it from a working directory outside the source repository. Build the materialized app and open its registered route through its local verification entry point (the template's `verify` script in smoke mode). Compare non-test kit files with `src/presentation-kit/` (and the bootstrap script copies with the root scripts where parity is required). Assert: build and route smoke check pass; all three anchors and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; template lookup is independent of the caller's working directory (template paths resolve from the skill file's directory); canonical and template kit files are byte-aligned; and neither the kit nor the scaffold introduces Tailwind or visual defaults owned by the reusable kit.

## Done When
- Every scenario above is satisfied by the `SKILL.md` procedure and templates; contract tests assert that `SKILL.md` carries each normative instruction (one-question-at-a-time gathering, partial-detail opt-in, optional ASCII mockups, three-anchor contract-level detection, skip/partial/full scaffold behavior, full dependency set, no styling framework by default, SKILL.md-relative template resolution, monorepo → `presentations/`, standalone → root, confirm-before-writing in non-empty projects, create/preserve/modify behavior, build + first-step render + visual composition self-verify, fix-before-success, project-local screenshot helper, warning review with scoped allow-overlap marking, local active-chrome/attribution styling).
- `INT-001` passes in the repository's automated suite.
- `npm ci`, `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass for the repository; kit and script parity between `src/`/`scripts/` and `templates/bootstrap/` is enforced by a test.
- Do a hands-on walkthrough in a disposable directory (outside the repo, deleted afterwards): materialize the bootstrap per `SKILL.md`, add a small presentation from the presentation template, run the materialized project's `build`, `verify` (smoke mode), and `inspect`, and use `chrome-devtools-axi` (`snapshot` plus screenshots) to inspect its first and last step. Fix any template defects found.
- Sample provenance: the committed reference sample (`src/presentations/how-to-make-a-presentation/`) was authored before the skill existed, but the verification spec requires it to be a presentation built by the skill. Align the presentation templates and `SKILL.md` conventions with the sample's folder layout (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-owned CSS, one registry line). Then, in a disposable copy of the repository with the existing sample folder and its registry line removed, follow the completed `SKILL.md` create flow, supplying the topic "How to Use This Skill to Make a Presentation" and the nine-step outline (eras, titles, captions, and scene intent verbatim from the verification spec's normative table) as the answers. Review the generated output against the normative outline and the visual quality bar (build, strict `npm run verify`, `npm run inspect`, and `chrome-devtools-axi` screenshots of the first, last, and dense steps; refine as needed, keeping the normative eras, titles, captions, and scene intent exact). Adopt the reviewed output as the committed sample in the real repository (replacing the earlier hand-authored folder, keeping the same slug and registry entry), then rerun `npm test`, `npm run lint`, `npm run build`, `npm run verify`, and the visual inspection there. Never leave the repository without a passing strict sample.
- Final project-level check from the repository root: `npm run inspect -- how-to-make-a-presentation` plus `chrome-devtools-axi` screenshots of the first, last, dense (steps 5–8), and a narrow-viewport step confirm the finished reference sample and chrome are visually coherent. No generated output, dependencies, or screenshots are committed.
