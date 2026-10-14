# Task: Presentation skill and distributable bootstrap templates

## Goal
Deliver the distributable `presentation` agent skill (`skills/presentation/SKILL.md`) and its template snapshot
(`skills/presentation/templates/`) so an agent can gather requirements, self-bootstrap a style-neutral presentation
app into an empty, standalone, monorepo, or partially scaffolded project, create or modify presentations, and
self-verify build, render, and visual composition before reporting success.

## Background
Read these (paths relative to `openspec/changes/create-and-scene/`):
- `design.md` — "Skill (`skills/presentation/SKILL.md`)" (procedure, scaffold target resolution, required dependency set), "Styling", Decisions 5–6, the risks "Template ↔ `src/presentation-kit` drift", "Monorepo detection is heuristic", "Self-verify cost inside the skill", and Open Questions (skill name defaults to `presentation`; finalize the monorepo signal set during implementation — behavior is fixed: scaffold into `presentations/`).
- `specs/presentation-skill/spec.md` — canonical requirements (copied below).
- `test-plan.md` — `INT-001`. (`AT-001`..`AT-004` are acceptance tests executed later by a separate acceptance pass; you do not run them, but write the skill so they pass.)

Preconditions in the repository (already in place when this work starts): the canonical kit `src/presentation-kit/` (with `README.md` documenting hooks), the router/`Landing`/registry in `src/main.tsx`, `src/Landing.tsx`, `src/presentations/index.ts`, the committed sample `src/presentations/how-to-make-a-presentation/`, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, `npm test` (Vitest), `npm run verify`, `npm run inspect -- <slug>`, and `playwright` in `package.json`.

### Layout to create
- `skills/presentation/SKILL.md` — YAML frontmatter (`name: presentation`, a trigger-oriented `description`) and the procedure: (1) **Gather** — ask one question at a time for topic, visual style, and each step's content + visual description; never assume details the user can still supply; allow proceeding with partial detail without a hard completeness gate; skip questions when the prompt is already complete; optionally draw ASCII mockups for key/complex steps only. (2) **Resolve target + scaffold if needed** — detect the three contract anchors (build setup; scene kit; presentation index) by contract, not byte-identity; partial scaffold only what is missing; resolve target (empty/standalone → root; monorepo → self-contained app under `presentations/`; already inside a presentation app → use it); in a non-empty project that lacks the scene kit or presentation index, state the resolved target and wait for confirmation before writing; install the full dependency set; resolve `templates/` relative to the directory containing `SKILL.md` (never the caller's working directory). (3) **Generate / modify** — create: write `entities.ts` + `steps/*` + `Talk.tsx` + presentation-local plain CSS in the presentation's own folder (never in the kit), register in `index.ts` via one new registry line, preserve existing presentations; modify: if the target is unspecified/ambiguous list existing presentations and ask which, then ask only about requested changes and make scoped edits. (4) **Self-verify** — run the build, at least a first-step render check, and a visual composition check; run the project-local screenshot helper (`npm run inspect -- <slug>`) in preference to ad hoc scripts (if a temporary Playwright helper is ever needed it goes under the project root); inspect first, last, dense/key steps (and a narrow viewport for responsive-sensitive presentations) with `chrome-devtools-axi` when available or an equivalent browser view; review every WARN, fix accidental collisions and indistinct current-step chrome / unpolished attribution via presentation-owned CSS, mark only intentional readable overlaps with `data-presentation-allow-overlap`, re-run, and never report success while build/render/visual checks fail; the full `npm run verify` is reserved for completion. Also encode the quality bar, the evolving-scene model rules (stable entity ids, grouped steps, entity continuity), plain CSS default (Tailwind/other only if the host already uses it or the user asks), and a monorepo-detection signal set (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) with the "state target and confirm" rule. Keep SKILL.md focused; put long reference material (step authoring guide, entity/`layoutId` conventions, hook reference, CSS guidance) in files under `skills/presentation/` that SKILL.md links to by relative path.
- `skills/presentation/templates/bootstrap/` — a complete, self-contained, **style-neutral** app snapshot that builds on its own: `package.json` (with `build`, `lint`, `verify`, `inspect`, `dev`, `preview`, `test` scripts as appropriate; full dependency set: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack used by this repo, `playwright`), a committed `package-lock.json` so installs are reproducible, `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.gitignore`, `src/main.tsx` (pathname router), `src/Landing.tsx`, `src/index.css` (host CSS, no theme tokens), `src/presentation-kit/**` (byte-identical copy of the canonical kit's non-test files), `src/presentations/index.ts` (registry) with a minimal registered starter presentation that satisfies the scaffold's own `verify`, plus `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` (byte-aligned with the repository root copies; the verifier must therefore be configurable so a scaffold's own starter presentation passes — if that requires changing `scripts/verify.mjs`, change both). No Tailwind, no Tailwind Vite plugin, no default colors/fonts/cards/buttons/theme tokens.
- `skills/presentation/templates/presentation/` — per-presentation templates: `entities.ts`, a sample `steps/*.tsx`, `Talk.tsx`, and a plain-CSS file stub, with documented substitution points (slug, title, dir) that the skill fills in.
- A drift guard: an automated test comparing every non-test file of `src/presentation-kit/` with `skills/presentation/templates/bootstrap/src/presentation-kit/` (and root `scripts/verify.mjs` / `scripts/inspect-presentation.mjs` with their template copies), failing with the list of differing files. Optionally provide `npm run sync:templates` that copies canonical → template to fix drift. Document in the repo `README.md` that the kit and scripts must be kept aligned.
- A small `skills/presentation/templates/README.md` or section in SKILL.md describing how the bootstrap template is materialized and the partial-scaffold rules (which files belong to which anchor so only missing anchors are added without disturbing existing files, `package.json` dependencies are merged rather than overwritten, and no existing presentation or file is overwritten).

**Generate the reference sample through the skill.** The proposal and the "Committed reference sample" requirement call for a sample *built by the skill*. The sample in `src/presentations/how-to-make-a-presentation/` may have been authored by hand to exercise the kit and verifier. Once `SKILL.md` and the templates are complete, follow the skill's own create procedure (in a disposable copy of the repository or a disposable bootstrap-materialized project, with a complete prompt consisting of the normative nine-step outline from the "Committed reference sample" requirement plus the visual style and per-step visual descriptions taken from the existing committed sample, so the skill has the topic, style, and every step's content and visual description and need not ask or invent anything) to produce the sample. Reconcile the committed sample with that output: adopt generated files or fix `SKILL.md`/templates wherever the procedure produced something that does not build, render, or match the normative titles, captions and eras. Keep the committed slug `how-to-make-a-presentation`, registry entry, and normative text unchanged, and rerun `npm run verify` and `npm run inspect -- how-to-make-a-presentation` afterwards.

Constraints: keep `src/presentation-kit/` the canonical source; do not add CI config; do not commit `node_modules`, build output, or screenshots (a committed `package-lock.json` inside the bootstrap template is required and intended).

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

## Test Plan
- `INT-001` — Materialized bootstrap is complete and style-neutral. Boundary: copy `skills/presentation/templates/bootstrap/` into a fresh temp directory, install dependencies from its committed lock data (`npm ci`), and invoke it from a working directory outside the source repository. Action: build the materialized app, run its local verification/route smoke entry point against its registered starter route (Chromium via Playwright), and compare non-test files of `src/presentation-kit/` with the template copy. Assert: build and route smoke check pass; all three anchors (build setup, scene kit, presentation index) and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present in the template `package.json`; template lookup works independent of the caller's working directory (e.g. a test helper that resolves templates relative to the skill directory is exercised from a different cwd, and SKILL.md instructs the same); canonical and template kit files are aligned; neither the kit nor the scaffold introduces Tailwind (no `tailwindcss`/`@tailwindcss/*` dependency or import) or visual defaults (no colors/fonts/borders/shadows/theme tokens in the kit; template `index.css` free of theme tokens). Implement in the repository's automated integration suite (e.g. `npm run test:integration` or a documented Vitest project; may share the browser-backed runner introduced for the repo's other e2e/integration tests — if none exists yet, add the script) so it runs on every pull request after dependency installation; do not add CI config.
- Add focused tests for any deterministic helper you introduce (anchor detection, monorepo-signal detection, template path resolution, dependency merging) if you implement them as scripts; the skill's agent-judgment behavior is covered by the later acceptance tests, not by unit tests.

## Done When
- Every scenario in the spec above is addressed by explicit, unambiguous instructions in `skills/presentation/SKILL.md` (and its linked reference files) and, where deterministic, by templates/helpers; a reviewer can trace each scenario to a SKILL.md section.
- `INT-001` and the drift-guard test pass; `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass in the repository.
- A manual dry run in a throwaway directory outside the repo (materialize the bootstrap template, `npm ci`, `npm run build`, `npm run verify`) succeeds and the scaffolded app contains no Tailwind or visual defaults; the throwaway directory is deleted afterward.
- The committed reference sample has been (re)generated by following the skill's create procedure as described above, still matches the nine normative steps in order, and `npm run verify` and `npm run inspect -- how-to-make-a-presentation` pass afterwards (with the first, last, and dense steps inspected via `chrome-devtools-axi`).
- The distributable skill contains everything needed to run outside this repository (no references to repo-only paths other than `templates/` relative to `SKILL.md`).
- No build output, screenshots, or dependency directories are committed (apart from the template lock file) and no CI configuration is added.
