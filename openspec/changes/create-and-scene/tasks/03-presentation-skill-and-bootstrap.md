# Task: Presentation skill and distributable bootstrap templates

## Goal
Deliver the hybrid agent skill at `skills/presentation/SKILL.md` and its `templates/` so an agent can, from a topic, gather details, self-bootstrap any missing scaffolding (build setup, scene kit, presentation index) in the right target location, generate or modify presentations, and self-verify before reporting done. The bootstrap template must materialize into a working, style-neutral app that builds and passes its own route smoke check from outside this repository.

## Background
The repository already contains (as canonical sources to snapshot, do not redesign): the scene kit `src/presentation-kit/` (with `src/presentation-kit/README.md` documenting the `data-presentation-*` hooks, including `data-step-count`/`data-step-index`, attribution, active-state, and allow-overlap marker), the pathname router `src/main.tsx`, `src/Landing.tsx`, the explicit registry `src/presentations/index.ts`, the worked sample `src/presentations/how-to-make-a-presentation/` (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, local CSS), and the root scripts `scripts/verify.mjs` (`npm run verify`) and `scripts/inspect-presentation.mjs` (`npm run inspect -- <slug>`), plus Vitest, ESLint, and `playwright` in `package.json`. Read them before writing templates. Use `127.0.0.1` for browser automation. Do not add CI configuration; do not commit `dist/`, `node_modules/`, or screenshots.

Read `design.md` sections "Skill (`skills/presentation/SKILL.md`)", "Scaffold target resolution", "Required dependency set", "Verification", Decisions 5–7, "Risks / Trade-offs" (template drift, monorepo heuristic, self-verify cost), and "Open Questions" (skill name defaults to `presentation`; monorepo signal set to finalize — support `workspaces` in `package.json`, `pnpm-workspace.yaml`, and `packages/`|`apps/` layouts, with scaffolding into `presentations/` fixed).

### Layout to create
```
skills/presentation/
  SKILL.md
  templates/
    bootstrap/      # complete fresh-project snapshot: package.json (+ lock data), index.html, vite/ts/eslint config,
                    # src/main.tsx, src/Landing.tsx, src/index.css (host CSS only), src/presentation-kit/** (snapshot),
                    # src/presentations/index.ts (registry containing exactly one entry: the minimal starter presentation below),
                    # scripts/verify.mjs, scripts/inspect-presentation.mjs, a minimal multi-step starter presentation
                    # under src/presentations/<starter-slug>/ that is REGISTERED in the registry so it is routable and
                    # renderable (the bootstrap verify targets this registered route), .gitignore
    presentation/   # per-presentation templates: entities.ts, steps/*.tsx, Talk.tsx, plain-CSS stylesheet
```
- `templates/bootstrap/src/presentation-kit/**` must be byte-identical to `src/presentation-kit/` (the "template snapshot"); the bootstrap `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` must stay aligned with the root copies except for any documented, deliberate differences (for example the bootstrap verify checks its own starter presentation rather than the nine-step reference sample — make `scripts/verify.mjs` parameterizable via its documented constants/flags so a single implementation serves both, keeping the bootstrap copy identical wherever possible). Add a Vitest drift test that fails when the kit snapshot or the aligned scripts differ from their canonical sources.
- Bootstrap `package.json` declares the complete dependency set and ships lock data (`package-lock.json`) so `npm ci` works: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack (`eslint`, `@eslint/js`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`), and `playwright`. Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `verify`, `inspect`. No Tailwind, no Tailwind Vite plugin, no CSS framework, no default theme/colors/fonts/card/button styles anywhere in the scaffold or kit (host `src/index.css` may only contain neutral resets needed for the fixed-canvas layout, and nothing that acts as a visual theme).
- `SKILL.md` has valid skill frontmatter (`name: presentation`, a trigger-oriented `description`) and documents this procedure:
  1. **Gather** — ask one question at a time about topic, visual style, and each step's content + visual description; do not assume details the user can still provide; allow the user to opt to proceed with partial detail (no hard completeness gate); may proceed without questions if the prompt is complete; may draw ASCII mockups for key/complex steps only.
  2. **Resolve target + scaffold if needed** — detect the three contract anchors at contract level (build setup = Vite+React+TS app with a working `npm run build`; scene kit = `Step`/`Scene` contract + stage/host + nav + chrome + fit-scale; presentation index = route registry), not byte-identical files. Resolve target: empty/standalone → root; monorepo → self-contained app under `presentations/`; already inside a presentation app → use it and scaffold only missing anchors. Resolve templates relative to the directory containing `SKILL.md` (never the caller's cwd). Never assume dependencies are installed; install the full set. In a non-empty project lacking the kit or index, state the target and obtain user confirmation before writing. Scaffold only missing anchors in partial scaffolds without disturbing existing ones.
  3. **Generate / modify** — create: write the presentation as its own folder (`entities.ts`, `steps/*`, `Talk.tsx`, presentation-owned plain CSS unless the host already uses a styling framework or the user explicitly asks for one), register it with one line in `presentations/index.ts`, preserve existing presentations; modify: if target missing/ambiguous, list existing presentations and ask which, then ask only about requested changes and make scoped edits.
  4. **Self-verify** — run the build, at least a first-step render check, and a visual composition check using the project-local `npm run inspect -- <slug>` helper (or, if absent, a temporary Playwright helper written under the project root, never outside the tree); inspect first, last, and dense/key steps (and a narrow viewport when responsive-sensitive); review each advisory warning, fix accidental collisions/indistinct active chrome/unpolished attribution through presentation-owned CSS, mark only genuinely intentional readable overlaps with the allow-overlap marker; fix failures and re-check rather than reporting success; may run lighter build + single-route render first and reserve full `npm run verify` for completion. Quality bar for every presentation: builds with no type errors, first step renders without errors, a caption per step, next/previous works, visual composition passes, conforms to the evolving-scene model (stable entity ids, grouped scenes via shared `groupKey`).
  Also cover in `SKILL.md`: the scene-kit API cheat-sheet and hook names (point to the template kit README), terminology ("presentation" canonical; `Talk.tsx` is just the entry filename), styling ownership rules, and monorepo/standalone examples.
- Parameterize the bootstrap `verify` so its sample/route expectations name the starter presentation's registered slug rather than the nine-step reference sample. Presentations the skill later creates are added to this registry with one line each.
- Add small deterministic helper code only if it improves reliability (e.g. a `skills/presentation/scripts/detect-anchors.mjs` and `scaffold.mjs` that detect anchors / resolve the target / copy missing template parts, resolving paths from `import.meta.url`). If you add them, unit-test their detection and target-resolution logic (empty dir, standalone project, monorepo via each signal, partial scaffold, full scaffold) with Vitest in temp directories, and have `SKILL.md` direct the agent to use them. Their behavior must match the scenarios below.

Agent acceptance (AT-001..AT-004) is exercised later by an acceptance pass, not by you, but write `SKILL.md` so those journeys are achievable: ask-before-assume, partial-detail opt-in, target statement + confirmation for non-empty projects, preservation of existing content and presentations, and the repair loop for failing checks and visual warnings.

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
- `INT-001: Materialized bootstrap is complete and style-neutral` — Automated integration test (run with the browser-backed integration suite after dependency installation): copy `skills/presentation/templates/bootstrap/` into a fresh temp directory outside the repository, run `npm ci` from the committed lock data (a repository-local npm cache or pre-installed Playwright browser may be used to avoid network), then from a working directory outside the source repository run the materialized app's `npm run build` and its `npm run verify` (route smoke check on its starter presentation via `127.0.0.1`). Assert: build and route smoke check pass; the starter presentation is registered in the materialized `src/presentations/index.ts` and its route is reachable; all three scaffold anchors exist; the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set is declared; template lookup (via any scaffold helper) works independent of the caller's cwd; non-test files of `templates/bootstrap/src/presentation-kit/` are byte-aligned with canonical `src/presentation-kit/`; and neither the kit nor the scaffold contains Tailwind (dependency, plugin, or directives) or visual defaults (no CSS in the kit; no theme tokens/colors/fonts/card/button styles in the scaffold).

## Done When
- Every scenario above is satisfied by `SKILL.md` and the templates (and any helper scripts, with unit tests for detection/target resolution/template lookup passing).
- `skills/presentation/templates/bootstrap/` materializes into a project where `npm ci`, `npm run build`, `npm run lint`, and `npm run verify` pass; the `INT-001` automated test and the kit/script drift test exist and pass.
- `templates/bootstrap/src/presentation-kit/` is byte-identical to `src/presentation-kit/`; aligned scripts match their root copies except documented deliberate differences.
- Reconcile the committed reference sample with the skill: follow the finished `SKILL.md` procedure (and `templates/presentation/` conventions) against the repository's `how-to-make-a-presentation` presentation so it has the structure the skill generates (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-owned plain CSS, one registry line) without changing its nine normative steps' eras, titles, captions, or scene intent; re-run the sample contract test, `npm run verify`, and `npm run inspect -- how-to-make-a-presentation` afterward and fix any regressions.
- The repository's own `npm test`, `npm run lint`, `npm run build`, and `npm run verify` still pass; no generated output, dependency directories, or screenshots are committed, and no CI configuration was added.
- `README.md` mentions the skill, its install/use, and the template-snapshot maintenance rule (update the snapshot whenever the kit or aligned scripts change).
