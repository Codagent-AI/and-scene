# Task: Presentation skill and bootstrap templates

## Goal
Author the distributable agent skill `skills/presentation/SKILL.md` and its bootstrap/presentation templates so
an agent can gather requirements, self-scaffold a style-neutral presentation app in any target project
(standalone or monorepo), create or modify presentations, and self-verify before reporting success. Prove the
materialized bootstrap works outside this repository.

## Background
Already in the repo: canonical scene kit `src/presentation-kit/`, router
(`src/main.tsx`), `src/Landing.tsx`, explicit registry `src/presentations/index.ts`, the committed sample
`src/presentations/how-to-make-a-presentation/`, `scripts/verify.mjs` (+ `verify.config.json`),
`scripts/inspect-presentation.mjs` (+ `npm run inspect -- <slug>`), Vitest `npm test`, `test:integration`,
`test:e2e`. Read them before writing templates. Use `127.0.0.1` for local browser automation. No CI config.
Do not commit generated output, `node_modules`, or screenshots.

### Files to create (fixed paths)
```
skills/presentation/
  SKILL.md                     # the agent procedure
  templates/
    bootstrap/                 # complete fresh app: package.json + package-lock.json (committed lock data), tsconfig*.json, vite.config.ts, eslint.config.js, index.html, src/main.tsx, src/Landing.tsx, src/index.css (host CSS only, no theme), src/presentation-kit/** (snapshot of canonical kit), src/presentations/index.ts (empty registry), scripts/verify.mjs, scripts/inspect-presentation.mjs, verify.config.json (empty referencePresentations), .gitignore (incl. .inspection/)
    presentation/              # per-presentation templates: entities.ts, steps/*.tsx, Talk.tsx, plain-CSS stub (owned by the presentation, no default theme)
```
Alignment rules (from CLAUDE.md and the design): `templates/bootstrap/src/presentation-kit/` is a release
snapshot that must stay byte-aligned with canonical `src/presentation-kit/`; `templates/bootstrap/scripts/verify.mjs`
and `inspect-presentation.mjs` must stay aligned with the root copies. Add a drift contract test (unit-level,
runs in `npm test`) that fails on any difference. Prefer a documented sync script/command (e.g. a small
`scripts/sync-templates.mjs` run by hand) over duplicating edits manually. Template resolution in SKILL.md is
relative to the directory containing `SKILL.md`, never the user's current working directory.

The bootstrap package.json must declare the full dependency set — runtime: `react`, `react-dom`, `motion`,
`lucide-react`; dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`,
`@types/node`, the eslint stack (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh`, `globals`), and `playwright` — and scripts `dev`, `build` (`tsc -b && vite build`),
`lint`, `preview`, `verify`, `inspect`. No Tailwind, Tailwind Vite plugin, theme tokens, default colors/fonts/
card/button styles anywhere in the bootstrap or kit. Because the bootstrap's registry starts empty, include a
minimal starter presentation or make `verify` pass trivially on an empty registry **and** be able to smoke
route a registered presentation (INT-001 requires opening a registered route via the verification entry point;
a tiny neutral template presentation registered in the test materialization is acceptable). Keep the bootstrap
free of the and-scene-specific sample.

### SKILL.md procedure (fixed by the design)
Frontmatter with `name: presentation` and a trigger-oriented `description`. Procedure:
1. **Gather** — one question at a time: topic, visual style, each step's content + visual description; optional ASCII mockups for key/complex steps only; human controls depth and may proceed with partial detail; skip questions when the prompt is already complete.
2. **Resolve target + scaffold if needed** — detect the three contract anchors by contract (not byte equality): build setup (Vite+React+TS app with working `npm run build`), scene kit (Step/Scene contract, stage/host, nav, chrome, fit-scale canvas), presentation index (registry mapping presentations to routes). Target resolution: empty dir/standalone → scaffold at root; monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) → self-contained app under `presentations/`; already inside a presentation app → use it and scaffold only missing anchors. In a non-empty project lacking the kit or index, state the target and wait for confirmation before writing. Install the complete dependency set (never assume installed). Tailwind or another framework only if host already uses it or the user requests it.
3. **Generate / modify** — create: write `entities.ts` + `steps/*` (+ presentation-owned plain CSS) in its own folder, register in `index.ts`, reachable at `/<slug>`, existing presentations untouched. Modify: if target unspecified/ambiguous, list existing presentations and ask which; then ask only about requested changes and edit in place.
4. **Self-verify** — build, render at least the first step without console/runtime errors, run the project-local `npm run inspect -- <slug>` helper and inspect first, last, and dense/key steps (narrow viewport too when responsive-sensitive; prefer `chrome-devtools-axi` if available); review every advisory warning, fix accidental collisions and indistinct active chrome / unpolished attribution via presentation-owned CSS, mark only readable intentional overlaps with `data-presentation-allow-overlap`; finish with `npm run verify`; never report success while checks fail; if the helper is unavailable, write any temporary Playwright helper under the project root. May run lighter build + single-route render first, full verify at completion.
Also document the quality bar, the style-ownership boundary (kit has zero defaults; presentations own palette/type/spacing/active-chrome/attribution styling via the stable hooks), the step/entity model, and the exact hook names. Keep SKILL.md concise; put long reference material in adjacent files if needed.

Hook spellings the skill must teach (exact): `data-step-count`, `data-step-index`, `data-presentation-chrome`,
`data-presentation-mode`, `data-presentation-title`, `data-presentation-caption`, `data-presentation-marker`,
`data-presentation-era`, `data-presentation-progress`, `data-presentation-progress-item`,
`data-presentation-toc`, `data-presentation-toc-item`, `data-presentation-prev`, `data-presentation-next`,
`data-presentation-attribution`, `data-presentation-brand`, `data-presentation-stage`,
`data-presentation-active="true"` with `aria-current`, `data-presentation-allow-overlap`, `data-presentation-link`.

Add a `test:integration` script/config if not present (keep it out of default `npm test`). Update README and
`AGENTS.md`-style docs only if they now misstate the project layout.

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
This integration obligation first becomes executable here; implement it as an automated test run by `npm run test:integration`. (Agent acceptance tests AT-001..AT-004 are run by a separate acceptance pass, not by this task; just make the skill satisfy them.)

### INT-001: Materialized bootstrap is complete and style-neutral
- Covers: Self-bootstrapping scaffold, template resolution, required dependencies, style ownership, and template-to-canonical-kit drift.
- Boundary: The distributable `skills/presentation/templates/bootstrap/` snapshot is copied into a fresh filesystem location and exercised through its package scripts and canonical scene-kit contracts.
- Setup: Materialize the bootstrap template in an isolated temporary directory, install its declared dependencies from the committed lock data, and invoke it from a working directory outside the source repository.
- Action: Build the materialized app, open its registered route through its local verification entry point, and compare non-test scene-kit files with the canonical `src/presentation-kit/` source where parity is required.
- Assertions: The build and route smoke check pass; all three scaffold anchors and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; template lookup is independent of the caller's working directory; canonical and template kit files remain aligned; and neither the kit nor scaffold introduces Tailwind or visual defaults owned by the reusable kit.
- Execution: Run in the repository's automated integration suite on every pull request after dependency installation.


Implementation notes for INT-001: copy `templates/bootstrap/` to a temp directory, run `npm ci` there (offline cache
permitted), run its `npm run build`, register/materialize a trivial presentation from `templates/presentation/`
and run its `npm run verify` with the working directory set to somewhere outside the source repo; also assert
the anchors and dependency set, kit parity with `src/presentation-kit/`, absence of Tailwind and of color/font/
border/shadow declarations in the kit and bootstrap host CSS, and that SKILL.md references templates relative to its own directory.

## Done When
- `skills/presentation/SKILL.md` and both template directories exist and cover every scenario above, including one-question-at-a-time gathering, partial detail, monorepo vs standalone targeting, partial scaffolding, confirmation before non-empty writes, ambiguous-modify handling, local helper usage, and warning review.
- The kit/script drift test passes in `npm test`; a sync command is documented.
- INT-001 passes via `npm run test:integration`.
- The committed sample `src/presentations/how-to-make-a-presentation/` conforms to the finished skill's generated-presentation conventions: it is checked against `SKILL.md` and `templates/presentation/` (own folder with `entities.ts`, `steps/*`, `Talk.tsx`, presentation-owned plain CSS; registered in `src/presentations/index.ts`; reachable at its own route; styled only outside the kit). Where it deviates, update the sample or the templates/skill so the skill's procedure would produce an equivalent presentation, keeping the nine normative titles/captions unchanged, and re-run `npm run verify` and the inspection helper on the result.
- No file in the skill or templates requires Tailwind or supplies default visual styling.
- Final gate, all passing: `npm ci`, `npm test`, `npm run test:integration`, `npm run test:e2e`, `npm run lint`, `npm run build`, `npm run verify`; plus AXI inspection (`chrome-devtools-axi`) and `npm run inspect -- how-to-make-a-presentation` review of first, last, dense, and narrow-viewport steps of the sample.
