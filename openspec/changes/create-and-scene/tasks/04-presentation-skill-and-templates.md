# Task: Presentation skill and bootstrap templates

## Goal
Author the distributable `presentation` agent skill (`skills/presentation/SKILL.md`) and its template snapshot so an agent can gather requirements, self-bootstrap a style-neutral presentation app in a fresh, standalone, monorepo, or partially scaffolded project, create or modify presentations, and self-verify, plus prove the bootstrap works outside this repository.

## Background
Read `openspec/changes/create-and-scene/design.md` (sections "Skill", "Scaffold target resolution", "Required dependency set", "Verification", "Styling", Decisions 1, 5, 6, 7; Risks about template drift; Open Questions) and `openspec/changes/create-and-scene/test-plan.md` for INT-001 (plus the AT cases that will later exercise your skill, for context only — you are not asked to execute acceptance tests).

Existing repository assets you build on (read them first):
- `src/presentation-kit/` — canonical scene kit (hook list in its `README.md`);
- `src/presentations/index.ts` registry, `src/main.tsx` router, `src/Landing.tsx`, and the committed sample `src/presentations/how-to-make-a-presentation/` (use it as the worked example the skill points to and as a model for generated structure: `entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-local CSS);
- `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` (`npm run verify`, `npm run inspect -- <slug>`), with their canonical-sample outline check isolated in its own module; the Playwright dependency; Vitest (`npm test` covers `src/`, `tests/integration/`, `tests/e2e/`).

### Layout (fixed by the design/specs)
```
skills/presentation/
  SKILL.md                      # procedure: gather → resolve target + scaffold → generate/modify → self-verify
  templates/
    bootstrap/                  # full fresh-project snapshot: package.json (+ committed package-lock.json), index.html, vite/ts/eslint configs, src/main.tsx router, src/Landing.tsx, src/index.css (host CSS only), src/presentation-kit/** (byte-identical copy of the canonical kit's non-test files), src/presentations/index.ts, scripts/verify.mjs, scripts/inspect-presentation.mjs, .gitignore
    presentation/               # per-presentation templates: entities.ts, steps/*.tsx, Talk.tsx, presentation-local CSS
```
Decisions:
- **Template/kit alignment**: `src/presentation-kit/` and `templates/bootstrap/src/presentation-kit/` MUST be byte-aligned for all non-test files; root `scripts/verify.mjs`/`scripts/inspect-presentation.mjs` and their bootstrap copies must stay aligned except for the intentionally omitted canonical-sample outline module (the bootstrap `verify` smoke-renders the first step — and steps through all steps — of every registered presentation instead of asserting the nine-step sample). Add a drift contract test that fails when they diverge (and ideally a small `npm run sync-templates` helper script to refresh the snapshot — if added, document it in `AGENTS.md`/README and in the skill's maintainer notes).
- The bootstrap includes a minimal, unstyled **starter presentation** (own folder, registered, routed) so a freshly materialized app builds and its verification entry point has a registered route to open. The skill replaces or keeps it according to what the user asks; document this in SKILL.md.
- **Style-neutral scaffold**: no Tailwind, no Tailwind Vite plugin, no theme tokens, no default colors/fonts/cards/buttons in the bootstrap or kit. Plain presentation-local CSS is the default; another styling system only when the host already uses it or the user explicitly asks.
- **Dependency set the scaffold ensures** (never assume present): runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`), and `playwright` (render check). Mirror the versions in this repository's `package.json`. Bootstrap `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `verify`, `inspect`.
- **Contract-level detection**: the three anchors are (1) build setup — Vite + React + TypeScript with a working `npm run build`; (2) scene kit — the `Step`/`Scene` contract, stage/host, nav, chrome, fit-scale canvas; (3) presentation index — registry mapping each presentation to its route. Detection keys on anchor presence, not byte-identical files. Write SKILL.md so the agent checks each anchor with concrete, cheap checks (e.g. `package.json` scripts/deps and vite config for build; a directory exporting the step contract + `Presentation` for kit; a registry module plus router for index) and scaffolds only what is missing.
- **Target resolution** (SKILL.md must specify the order and the announce/confirm rules): inside an existing presentation app (anchors present) → use it; empty dir/standalone project → root; monorepo (signals: `workspaces` in `package.json`, `pnpm-workspace.yaml`, `packages/` or `apps/` layout — finalize the exact set in SKILL.md, resolving the design's open question; keep behavior: scaffold a self-contained app under `presentations/`, never mutate monorepo root). In any non-empty project missing the scene kit or presentation index, state the target location and wait for user confirmation before writing.
- **Template path resolution**: SKILL.md instructs the agent to resolve `templates/bootstrap/` and the presentation templates relative to the directory containing `SKILL.md`, never the user's cwd.
- **Interactive gathering**: one question at a time (topic, visual style, per-step content and visual description); never assume what the user could still provide; the user may proceed with partial detail ("build now") without a hard completeness gate; optional ASCII mockups for key/complex steps only; skip questions when the prompt is already complete.
- **Create**: write a self-contained folder `<presentations-dir>/<slug>/` with `entities.ts`, `steps/*`, `Talk.tsx`, and presentation-local plain CSS; register in the explicit registry (one line); never touch existing presentations. **Modify**: if the target is unspecified/ambiguous list existing presentations and ask which; then ask only about requested changes and edit that presentation in place without re-walking the create flow.
- **Self-verify** (SKILL.md must make these mandatory before reporting success; failures are fixed and re-checked): `npm run build`; a first-step render check at minimum (the full `npm run verify` before final completion; lighter single-route check during iteration is allowed); a browser visual composition check of the first step, last step, dense/key steps, plus a narrow viewport for responsive-sensitive presentations — using the project-local `npm run inspect -- <slug>` (settled screenshots, advisory warnings) in preference to ad hoc scripts, and otherwise writing any temporary Playwright helper under the project root; review each advisory warning, fix accidental collisions and indistinct active chrome / unpolished attribution (style the kit hooks in presentation-owned CSS), and mark only genuinely intentional readable overlaps with `data-presentation-allow-overlap`. Never report success while any check fails; report remaining advisory warnings accurately.
- Quality bar to restate in SKILL.md: clean build, first step renders w/o errors, caption per step, next/previous navigation, visual composition pass, conformance to the evolving-scene model (stable entity ids, persisting entities morph in place, new entities enter after persisting ones settle, departing entities exit, adjacent states share a scene group), presentation-owned styling. Accumulate-only composition is a property of the committed reference sample only, not a rule for generated presentations.
- Tone for SKILL.md: Agent Skill format with YAML frontmatter (`name: presentation`, a trigger-rich `description`), concise procedural body, links to the worked sample and templates by relative path; keep supporting detail in reference files under `skills/presentation/` rather than one giant file. Follow the repo's other conventions in `README.md`.

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
- `INT-001` Materialized bootstrap is complete and style-neutral: a Vitest test under `tests/integration/` that copies `skills/presentation/templates/bootstrap/` into a fresh temporary directory outside the repo, installs dependencies from its committed lock data (`npm ci`; allow a repo-local npm cache), and runs it from a cwd outside the source repo. It must: run `npm run build`; run its local `npm run verify` against its registered starter route (Chromium via Playwright; reuse the already-installed browser); assert all three anchors exist and `package.json` declares the complete dependency set listed above; assert template lookup does not depend on caller cwd (e.g. a helper that resolves template paths from the `SKILL.md` directory, or a check that SKILL.md references only skill-relative template paths); assert byte parity of non-test kit files between `src/presentation-kit/` and `templates/bootstrap/src/presentation-kit/` (and the script-alignment rule above); assert neither kit nor scaffold includes Tailwind (deps, plugin, directives) or default color/font/border/shadow/theme-token declarations.
- Unit/contract tests (implementor's judgment): SKILL.md frontmatter validity, referenced template files exist, monorepo/standalone target rules and dependency-set presence documented, drift check.

## Done When
- All Spec scenarios above are covered by `SKILL.md` and templates (review each scenario against the text), including target resolution, one-question-at-a-time gathering, partial-detail opt-in, confirm-before-write for non-empty projects, scoped modification, and the mandatory self-verify loop.
- `INT-001` exists, passes, and runs as part of `npm test`; the drift check fails if the template kit or scripts diverge from the canonical copies.
- `npm ci`, `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass in the repository; `npm run inspect -- how-to-make-a-presentation` runs; templates and `.gitignore` do not include build output, dependency directories, or screenshots.
- Do a manual dry run of the skill's scaffold path in a temp directory (copy `templates/bootstrap/`, create a presentation from `templates/presentation/` registered in the index, run build + verify + inspect). Use the committed reference sample's approved nine-step outline (titles, captions, eras, scene intent from the spec's sample table, and its visual direction) as the fully specified input so the skill's procedure and templates are shown to reproduce the sample's structure (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-local CSS, one-line registry entry, kit hooks); fix the skill/templates, or the sample where it deviates from the skill's documented conventions, for any structural divergence found. Do not overwrite the committed sample with unreviewed output and examine first/last/dense steps with `chrome-devtools-axi` and the project-local screenshot helper. Delete the temp directory afterward; the source repository must stay otherwise unchanged.
- `README.md` (or `AGENTS.md` note) briefly documents the skill location and template sync.
