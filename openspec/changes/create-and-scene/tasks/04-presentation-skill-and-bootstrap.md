# Task: Presentation skill and bootstrap templates

## Goal
Author the distributable agent skill at `skills/presentation/` — a `SKILL.md` procedure plus `templates/` (a complete, materializable bootstrap app and presentation templates) — so an agent can gather requirements, scaffold a missing presentation app (standalone or monorepo), generate or modify presentations, and self-verify, with the templates provably in sync with the canonical kit and scripts.

## Background
You MUST read these before editing (all under `openspec/changes/create-and-scene/`):
- `proposal.md`: scope, terminology ("presentation" canonical; `Talk.tsx` filename is incidental).
- `design.md`: "Skill (`skills/presentation/SKILL.md`)" including scaffold target resolution and the required dependency set, Decisions 5–7, Risks (template ↔ kit drift, monorepo heuristic), Open Questions (skill name `presentation`; monorepo signal set to finalize).
- `specs/presentation-skill/spec.md`: the full skill contract (copied below).
- `test-plan.md`: `INT-001`, and the Agent Acceptance Tests `AT-001`/`AT-002`/`AT-004` for how the skill will later be exercised (they are run by an acceptance reviewer, not by you; write the skill so an agent following it passes them).
- Repo `CLAUDE.md`: workflow, change guidelines (keep the template kit byte-aligned with `src/presentation-kit/`, keep scripts aligned, style-neutral kit, `127.0.0.1`, no CI config).

Already present in the repo: the canonical scene kit `src/presentation-kit/`, router `src/main.tsx`, `src/Landing.tsx`, explicit registry `src/presentations/index.ts`, the committed sample `src/presentations/how-to-make-a-presentation/` (use it as the model for presentation templates), `scripts/verify.mjs` (runner is generic over registered presentations; sample-outline check is separable), `scripts/inspect-presentation.mjs` (`npm run inspect -- <slug>`; output `.presentation-inspection/<slug>/step-NN.png`; marker `data-presentation-allow-overlap`), Playwright, and Vitest (`npm test` runs `src/**` and `tests/**`; `tests/integration/` and `tests/e2e/` exist).

What to build:
1. **`skills/presentation/SKILL.md`** (frontmatter `name: presentation` and a description with trigger phrases) implementing the procedure: (1) Gather — one question at a time for topic, visual style, and each step's content + visual description; user may proceed with partial detail; skip questions when the prompt is already complete; optional ASCII mockups only for key/complex steps. (2) Resolve target + scaffold — detect the three contract anchors (build setup, scene kit, presentation index) by presence, not byte equality; target resolution: empty/standalone → root, monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or `packages/`|`apps/` layout) → self-contained app in `presentations/`, already-in-a-presentation-app → reuse and scaffold only missing anchors; in a non-empty project state the target and wait for confirmation before writing; install the full dependency set (never assume deps present) and add no Tailwind/other framework unless the host already uses it or the user asks. Templates are resolved relative to the directory containing `SKILL.md`, never the caller's cwd. (3) Generate/modify — new presentation = own folder (`entities.ts`, `steps/*`, `Talk.tsx`, presentation-owned plain CSS) + one line in the registry, existing presentations untouched; modify = list presentations and ask which when the target is unclear, then ask only about requested changes and edit in place. (4) Self-verify — `npm run build`, at least a first-step render check, and a browser visual check (first, last, dense/key steps; narrow viewport when responsive-sensitive) using the project-local `npm run inspect -- <slug>` helper when present (otherwise any temporary Playwright helper under the project root); fix failures and re-check, review each advisory warning, fix accidental collisions/indistinct chrome/attribution, mark only intentional readable overlaps with `data-presentation-allow-overlap`; never report success while checks fail; report remaining advisory warnings accurately. Include the quality bar and the evolving-scene rules (stable entity ids, grouped scenes, style ownership, attribution styling). Keep it concise and procedural; point at template files rather than duplicating code.
2. **`skills/presentation/templates/bootstrap/`**: a complete app snapshot that builds and verifies on its own: `package.json` (React 19, `react-dom`, `motion`, `lucide-react`, Vite, `@vitejs/plugin-react`, TypeScript with `@types/react`, `@types/react-dom`, `@types/node`, the ESLint stack, `playwright`; scripts `dev`, `build`, `lint`, `preview`, `verify`, `inspect`), a committed `package-lock.json` (INT-001 installs from it), `index.html`, `vite.config.ts`, tsconfig files, `eslint.config.js`, `.gitignore` (incl. `.presentation-inspection/`), `src/main.tsx`, `src/Landing.tsx`, `src/index.css` (host CSS only, no theme tokens), `src/presentation-kit/` (copy of the canonical kit), `src/presentations/index.ts` containing the registry plus one minimal starter presentation so `verify` can smoke-test a registered route, and copies of `scripts/verify.mjs` / `scripts/inspect-presentation.mjs`. The template `verify` renders each registered presentation route (not the reference-sample outline). No Tailwind, no default colors/fonts/cards/buttons in the kit or scaffold beyond host-level minimal CSS that defines no theme.
3. **`skills/presentation/templates/presentation/`**: presentation templates (`entities.ts`, step file, `Talk.tsx`, plain CSS starter) derived from the sample's conventions, with a documented placeholder convention the skill fills in.
4. **Drift protection.** Add a contract test (`src/` or `tests/` Vitest) that fails when any non-test file under `skills/presentation/templates/bootstrap/src/presentation-kit/` differs byte-for-byte from `src/presentation-kit/`, and when the shared script logic in `templates/bootstrap/scripts/` diverges from the root scripts other than the documented sample-specific difference. Also assert the template package declares the full dependency set, has no Tailwind or `@tailwindcss/*` anywhere, and the kit has no visual defaults (colors, fonts, borders, shadows).
5. Use TDD for the contract tests and the integration test below.

## Spec
Copied from `specs/presentation-skill/spec.md`. This task owns all of it. The skill is prose plus templates; scenarios describing agent behavior are satisfied by SKILL.md instructions being explicit and unambiguous, and by template/script behavior where a scenario names an artifact.

## ADDED Requirements

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

## Test Plan
- `INT-001: Materialized bootstrap is complete and style-neutral` — create `tests/integration/bootstrap-template.int.test.ts`. Setup: copy `skills/presentation/templates/bootstrap/` into an isolated temp directory outside the repo, run `npm ci` there from the committed lock data (a repo-local npm cache or already-installed Playwright browser is an acceptable substitute for network downloads; the real app/build must not be mocked), and invoke commands with a working directory outside the source repo (also prove that the template path lookup used by your tests does not depend on cwd). Action: build the materialized app, run its local `npm run verify` entry point against its registered starter route, and compare the non-test kit files with canonical `src/presentation-kit/`. Assert: build and route smoke check pass; all three anchors (build setup, scene kit, presentation index) exist; the complete dependency set (React, react-dom, Vite, TypeScript, Motion, Lucide, lint stack, Playwright) is declared; canonical and template kit files are byte-aligned; no Tailwind and no kit-owned visual defaults. Runs through `npm test` after dependency installation.
- Do not write `AT-*` or `HT-*` executions; acceptance reviewers run those. Make `SKILL.md` precise enough that those journeys (empty standalone, partial monorepo with confirmation, already-scaffolded create/modify, repair loop) are followable.

## Done When
- `skills/presentation/SKILL.md`, `templates/bootstrap/`, and the presentation templates exist, satisfy every scenario above, and the quality bar is stated in the skill.
- `INT-001` and the drift/contract tests pass under `npm test`; the materialized bootstrap builds and its `verify` passes outside the source repo.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass in the repository root; lint/build do not choke on the templates (exclude template trees from root ESLint/tsconfig globs if needed, without hiding real source).
- The presentation templates and `SKILL.md` generation steps produce the same structure as the committed sample (`entities.ts`, `steps/*`, `Talk.tsx`, presentation-owned CSS, one registry line), so following the skill on the sample's nine-step brief yields a conforming presentation; note any structural difference you find in the sample in your final notes.
- Template kit is byte-aligned with `src/presentation-kit/`; template scripts are aligned with root scripts.
- No Tailwind or styling framework is introduced; no CI configuration is added; no generated output, `node_modules`, or screenshots are committed. Commits use `type: lowercase description`.
