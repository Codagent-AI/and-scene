# Task: Presentation skill and bootstrap templates

## Goal
Deliver the distributable `presentation` agent skill: a `SKILL.md` procedure
(gather → resolve target + scaffold if needed → generate/modify → self-verify)
plus a `templates/` tree that can materialize a complete, style-neutral
presentation app (build setup, scene kit, presentation index, verification and
inspection scripts) in a fresh or partially scaffolded project, kept in sync with
the canonical kit and root scripts.

## Background
You MUST read:
- `openspec/changes/create-and-scene/design.md` (Skill, Scaffold target resolution, required dependency set, Verification, Decisions 5–7, Risks → template drift and monorepo heuristic, Open Questions)
- `openspec/changes/create-and-scene/specs/presentation-skill/spec.md` (copied below)
- `openspec/changes/create-and-scene/specs/evolving-scene-presentations/spec.md` requirement "Style ownership boundary" (the scaffold must not introduce visual defaults)
- `openspec/changes/create-and-scene/test-plan.md` (INT-001, and AT-001/AT-002/AT-004 which later exercise this skill — they are not yours to run, but write `SKILL.md` so those journeys succeed)

Assumes already present in the repo: `src/presentation-kit/` (canonical scene kit), `src/main.tsx`, `src/Landing.tsx`, `src/presentations/index.ts`, the sample `src/presentations/how-to-make-a-presentation/`, `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, and the `test`/`lint`/`build`/`verify`/`inspect` npm scripts. Read them; they are the source for the templates.

Deliverables (paths fixed by the design/CLAUDE.md):
- `skills/presentation/SKILL.md` (skill name `presentation`; valid frontmatter with `name` and a trigger-oriented `description`). Procedure content:
  1. Gather: one question at a time for topic, visual style, and each step's content + visual description; never assume what the user can still provide; accept an explicit "build with what we have" (partial detail) without a hard completeness gate; may proceed without questions when the prompt is complete; may draw ASCII mockups for key/complex steps only. Explain the evolving-scene model (stable entity ids/`layoutId`s, grouped steps via `groupKey`, `Appear` for newcomers, `data-presentation-allow-overlap` for intentional overlap).
  2. Resolve target + scaffold: detect the three contract anchors by contract (build setup with working `npm run build`; scene kit `Step`/`Scene` contract + stage/nav/chrome/fit-scale; presentation index registry), not byte equality. Targets: empty/standalone ⇒ project root; monorepo (any of `workspaces` in `package.json`, `pnpm-workspace.yaml`, a `packages/` or `apps/` layout) ⇒ self-contained app under `presentations/`; already inside a presentation app ⇒ use it and scaffold only missing anchors, leaving present ones untouched. In a non-empty project missing the kit or index, state the target and wait for confirmation before writing. Install the full dependency set (runtime: `react`, `react-dom`, `motion`, `lucide-react`; dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack, `playwright`; plus Chromium via Playwright) — never assume any is present; no Tailwind or other framework unless the host already uses it or the user asks. Templates are resolved relative to the directory containing `SKILL.md`, not the cwd.
  3. Generate/modify: new presentation = own folder `entities.ts` + `steps/*` + `Talk.tsx` + presentation-owned plain-CSS (default), registered with one line in the index, existing presentations untouched; modify = if target missing/ambiguous list the registered presentations and ask which, then ask only about the requested changes and make scoped edits.
  4. Self-verify: run build, at least a first-step render check, and a browser visual composition check (first, last, dense/key steps; narrow viewport when responsive-sensitive) preferring the project-local `npm run inspect -- <slug>` over ad hoc scripts (or write any temporary Playwright helper under the project root); review every advisory warning, fix accidental collisions / indistinct active chrome / unpolished attribution through presentation-owned CSS, mark only genuinely intentional readable overlaps with the allow-overlap marker; fix failures and re-check; finish with the full `npm run verify`; never report success on failing output and report remaining advisories accurately. Note the allowed lighter loop (build + single-route render first, full verify at completion).
- `skills/presentation/templates/bootstrap/`: a complete self-contained app snapshot — `package.json` (with `build`, `lint`, `test` if relevant, `verify`, `inspect`, `preview`, `dev` scripts and every dependency above), a committed `package-lock.json` (INT-001 installs "from the committed lock data"), `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.gitignore` (including the inspection artifact dir, `dist`, `node_modules`), `src/main.tsx`, `src/Landing.tsx`, `src/index.css` (host CSS with NO theme tokens/colors/fonts/card/button styles), an empty-or-minimal `src/presentations/index.ts`, `src/presentation-kit/**` (byte-identical to the canonical kit), and `scripts/verify.mjs` + `scripts/inspect-presentation.mjs` (aligned with the root copies). The bootstrap's own verify must work on a minimal registered starter presentation included in the template (so a fresh scaffold builds and passes a route smoke check) — give `verify.mjs` an explicit opt-in smoke mode (e.g. a `--smoke <slug>` flag that the bootstrap template's `verify` npm script passes) that skips only the nine-step sample-outline phase and instead render-checks the starter route. The default mode MUST stay strict: with no flag, a missing, unregistered, malformed, or out-of-order reference sample fails exactly as at the repository root (never infer "skip" from the sample's registration being absent). Keep the root `verify` script and its existing tests unchanged, and add a test that default mode still fails when the sample's registry entry is removed. Hand-maintained duplication is the accepted trade-off (Decision 5): add a sync mechanism — e.g. `scripts/sync-templates.mjs` + `npm run sync:templates` that copies canonical kit/scripts into the template and a `--check` mode — and make the INT-001 drift assertion fail clearly when they diverge. Update `AGENTS.md`/`README.md` change guidance only if you add commands.
- `skills/presentation/templates/presentation/`: per-presentation templates (`entities.ts`, `steps/step-01.tsx` example, `Talk.tsx`, `<slug>.css`) with placeholder-free instructions of which tokens to replace; neutral and style-free (a documented skeleton, not a look).
- Partial-scaffold guidance: SKILL.md should describe, per missing anchor, which template files to copy (build setup; scene kit; index + router + Landing) and how to merge dependencies into an existing `package.json` without disturbing it.

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
- `INT-001` — Materialized bootstrap is complete and style-neutral. Boundary: copy `skills/presentation/templates/bootstrap/` into a fresh temp directory outside the repo and exercise it through its package scripts. Setup: materialize, `npm ci` from the template's committed lockfile (a repository-local npm cache is an allowed substitute for network downloads), invoke everything with a cwd outside the source repo. Action: build the materialized app, run its verification/route smoke entry point against its registered starter route, and compare non-test scene-kit files with canonical `src/presentation-kit/`. Assertions: build + route smoke pass; all three anchors present (build setup, kit, presentation index); the full dependency set (React, Vite, TypeScript, Motion, Lucide, eslint stack, Playwright) is declared; template lookup does not depend on the caller's cwd (e.g. a small helper/test that locates templates relative to `SKILL.md`); canonical and template kit files are byte-aligned (and root vs template scripts aligned); neither kit nor scaffold contains Tailwind (`tailwindcss`, `@tailwindcss/vite`) or visual defaults (no default colors/fonts/borders/shadows/theme tokens in kit or scaffold CSS). Implement as a Vitest integration test in `npm test`; runs on every PR with Chromium available; clean up the temp directory and any preview process.
- Unit/contract tests (test-first): `SKILL.md` frontmatter validity and presence of required procedure sections/keywords (one-question-at-a-time, partial-detail opt-in, confirm-before-write, monorepo signals, `presentations/` target, template-relative resolution, project-local `npm run inspect`, allow-overlap marker, fix-before-success); every file referenced by `SKILL.md` exists; sync `--check` fails on a deliberately drifted copy.
- AT-001/AT-002/AT-004 are agent-acceptance journeys performed later; do not execute them, but use their Expected lists as a checklist for the quality of `SKILL.md`.

## Done When
- `skills/presentation/SKILL.md`, `templates/bootstrap/`, and `templates/presentation/` exist and satisfy every scenario above.
- INT-001 passes in `npm test` from a clean temp materialization, including drift detection (kit and script parity) and style-neutrality checks.
- Template and canonical sources are byte-aligned (`sync --check` passes).
- Materialized bootstrap: `npm ci`, `npm run build`, `npm run lint`, and `npm run verify` all succeed outside the source repo.
- Using the completed skill procedure, a disposable copy of the repository is walked through creating a presentation from the canonical nine-step outline (titles, captions, eras, and scene intent from the "Committed reference sample" requirement) as the skill's input. The committed sample's structure (folder layout of `entities.ts`, `steps/*`, `Talk.tsx`, presentation-owned CSS, one registry line, allow-overlap/hook usage) is reconciled with the skill's output; if `SKILL.md` or the templates and the committed sample disagree, fix whichever is wrong, keeping the normative strings and scene intent unchanged. Afterward the committed sample's contract tests, `npm run verify`, and an AXI/`npm run inspect` visual check still pass. (This is a one-time consistency pass, not the deferred AT-* journeys.)
- Root `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass; `npm run inspect -- how-to-make-a-presentation` still works; no generated output, `node_modules`, or screenshots are committed; no CI configuration is added.
