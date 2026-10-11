# Task: Author the presentation skill and its self-bootstrapping templates

## Goal

Create the distributable hybrid agent skill at `skills/presentation/`: a `SKILL.md` procedure
that interviews the user, resolves where presentation infrastructure belongs, scaffolds only
what is missing from bundled templates, creates or modifies a presentation, and self-verifies
(build, render, visual composition) before reporting success. The templates carry a snapshot
of this repository's app shell, scene kit, verifier, and screenshot helper so the skill works
in an empty directory, a standalone project, a monorepo, or an existing presentation app.

## Background

Read `openspec/changes/create-and-scene/design.md` ("Skill", "Scaffold target resolution",
"Required dependency set", Decisions 5–6, Risks — template drift, monorepo heuristics,
self-verify cost) and `openspec/changes/create-and-scene/test-plan.md` (INT-001).

### Existing repository state to snapshot

The repository root is itself a complete presentation app — all three contract anchors exist:

1. **Build setup** — `package.json` (`build: tsc -b && vite build`, `lint`, `preview`, `test`,
   `verify`, `inspect`), `index.html`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`.
2. **Scene kit** — `src/presentation-kit/` (style-neutral; exports `Presentation`, `Step`,
   `SceneProps`, primitives, hooks; renders `data-presentation-*` hooks).
3. **Presentation index** — `src/presentations/index.ts` (explicit array of
   `{ slug, title, load: () => import('./<dir>/Talk') }`, slug as a string literal), routed by
   the pathname router in `src/main.tsx`, listed by `src/Landing.tsx`.

Verification tooling: `scripts/verify.mjs` (`npm run verify [-- <slug>]`; generic — renders every
registered slug or the given ones on `127.0.0.1`, and checks the reference sample only when
`scripts/verify.expectations.json` exists), `scripts/inspect-presentation.mjs`
(`npm run inspect -- <slug> [--viewport WxH]`; screenshots to `artifacts/inspect/<slug>/…` plus
advisory `WARN` lines), and any shared modules under `scripts/lib/`. The committed sample
`src/presentations/how-to-make-a-presentation/` shows the per-presentation shape:
`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-owned plain CSS.
`npm run test:integration` runs browser/subprocess suites from `tests/integration/` and
`tests/e2e/` (`vitest.integration.config.ts`); `npm test` runs fast Vitest unit/contract tests.

### Files to create

```
skills/presentation/
  SKILL.md                         # frontmatter + procedure (keep under ~200 lines)
  references/                      # optional progressive-disclosure detail (scaffolding,
                                   #   authoring steps with the kit, visual check)
  scripts/scaffold.mjs             # deterministic, cwd-independent anchor scaffolder
  templates/
    bootstrap/                     # a complete minimal presentation app
      package.json, package-lock.json, index.html, vite.config.ts,
      tsconfig.json, tsconfig.app.json, tsconfig.node.json, eslint.config.js, .gitignore
      src/main.tsx, src/Landing.tsx, src/index.css
      src/presentation-kit/**      # byte-identical copy of src/presentation-kit/
      src/presentations/index.ts   # empty, typed registry
      scripts/verify.mjs, scripts/inspect-presentation.mjs, scripts/lib/**  # identical copies
    presentation/                  # starter for one presentation folder
      entities.ts, steps/01-<name>.tsx, Talk.tsx, <name>.css
```

### Decisions

- **Template snapshot.** `src/presentation-kit/` is canonical; the bootstrap copy must be
  byte-identical (same file set). Root `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`,
  and `scripts/lib/**` must be identical to their bootstrap copies. Do not copy
  `scripts/verify.expectations.json`, the reference sample, tests, or Vitest into the bootstrap.
- **Bootstrap dependency set** (pin the same versions as the root `package.json`): runtime
  `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`,
  `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@eslint/js`, `eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`,
  `playwright`. Scripts: `dev`, `build`, `lint`, `preview`, `verify`, `inspect`. Commit a
  `package-lock.json` generated for it (e.g. `npm install --package-lock-only` in the template
  directory). No Tailwind, Tailwind Vite plugin, CSS framework, theme tokens, or default
  colors/fonts/cards/buttons; bootstrap `src/index.css` is minimal host CSS with no presentation
  visual defaults. The presentation starter CSS is a skeleton of hook selectors
  (`[data-presentation-title]`, `[data-presentation-active="true"]`,
  `[data-presentation-attribution]`, …) with no visual values, for the agent to fill from the
  user's chosen style.
- **`scripts/scaffold.mjs`.** Locates templates via `import.meta.url` (never `process.cwd()`),
  takes `--target <dir>`, detects each anchor at contract level (build: `package.json` with
  Vite + React + TypeScript and a `build` script; kit: a module exporting `Presentation` and the
  `Step` contract; index: a slug→loader registry wired to routes), copies only missing anchors
  without overwriting existing files, adds missing required dependencies/scripts to an existing
  `package.json` without changing existing entries, and prints which anchors it created or
  skipped. **Route-wiring exception:** when the presentation index is missing but a build
  setup already exists, the existing entry point (e.g. `src/main.tsx`) will not route to
  presentations, so the scaffolder (or the `SKILL.md` instruction it prints) must make a
  narrowly scoped, additive change to that entry point — mount the pathname router so
  `/<slug>` reaches the registry while the host's existing root content stays reachable (e.g.
  at `/` or its previous route) — without altering build configuration, other host files, or
  existing behavior beyond that wiring. Report the exact entry-point edit it made. Cosmetic differences (naming, formatting, extra deps) must not trigger
  re-scaffolding. The skill runs `npm install` afterwards and installs Chromium for Playwright
  when missing.
- **Target resolution (in `SKILL.md`, optionally aided by the script).** Monorepo signals:
  `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout →
  scaffold a self-contained app in `<repo>/presentations/` and never mutate the monorepo root.
  Empty or standalone non-monorepo project → scaffold at the root. Anchors already present →
  use that app, scaffolding only missing anchors. In any non-empty project, state the resolved
  target and wait for user confirmation before writing.
- **`SKILL.md` procedure.** Frontmatter `name: presentation` and a third-person `description`
  (≥50 and <1024 characters, use case and trigger phrases such as "make a presentation",
  "create a talk", "build slides about…", "modify my presentation" front-loaded in the first
  250 characters). Body uses imperative numbered steps and resolves every template/reference
  path relative to the directory containing `SKILL.md`. Branch on intent first:
  **Create** runs steps 1→4 below; **Modify** runs M1→M3 and never enters the create
  interview.
  1. **Gather** — ask one question at a time for topic, visual style, and each step's content +
     visual description; never invent details the user can still give; let the user proceed
     with partial detail; optionally show ASCII mockups for key/complex steps only.
  2. **Resolve target + scaffold** — as above, including confirmation in non-empty projects.
  3. **Create** — copy `templates/presentation/` to `src/presentations/<slug>/`, write
     `entities.ts`, one evolving scene's `steps/*`, and presentation-owned plain CSS (unless the
     host already uses, or the user requests, a styling framework); add one registry line;
     never touch other presentations or the kit.
  - **M1. Identify the target before any write** — read the registry; if the request does not
    clearly name one presentation, list the registered presentations and ask which to modify.
    Make no file changes (including scaffolding) until the target is identified.
  - **M2. Gather only the requested change** — ask only about the requested steps, entities,
    or style; do not re-ask topic/style/per-step questions for unchanged parts.
  - **M3. Ensure infrastructure, then edit** — scaffold only anchors still missing (with the
    same target-confirmation rule), then make scoped edits to that presentation's folder (and
    its registry line only if needed), and continue with step 4 (self-verify).
  4. **Self-verify** — run `npm run build`, at least `npm run verify -- <slug>` (full
     `npm run verify` before completion), then `npm run inspect -- <slug>` at desktop and, for
     responsive-sensitive work, a narrow viewport; review the first, last, and dense/key step
     screenshots and every `WARN`; fix accidental collisions, indistinct active chrome, and
     attribution polish in presentation-owned CSS; mark only intentional readable overlaps with
     `data-presentation-allow-overlap`; rerun until clean. If no project-local helper exists,
     write any temporary Playwright helper under the project root. Never report success while a
     check fails; report final check results and any remaining advisory warnings accurately.
- **Docs.** Update `README.md` to describe the skill, where it lives, the scene kit, and the
  `test`, `lint`, `build`, `verify`, `inspect`, and `test:integration` commands.

### Tests

- Add a fast parity/neutrality contract test to `npm test`: kit and verification-script
  template copies are byte-identical to the canonical files with identical file sets; bootstrap
  and root share dependency versions; the bootstrap declares the full dependency set and no
  Tailwind or styling framework; and `SKILL.md` frontmatter has `name` and a valid-length
  `description`.
- Use TDD for `scaffold.mjs` with fast unit tests over temporary directories (empty, standalone,
  monorepo variants by signal, partial anchors present, no-overwrite of existing files, and the
  additive entry-point route wiring for a build-only project).
- In `tests/integration/` (run by `npm run test:integration`), add a build-only partial-scaffold
  case: a minimal standalone Vite + React + TypeScript app with its own `src/main.tsx` and root
  content; scaffold it, add a registered presentation from `templates/presentation/`, install,
  and assert that `npm run build` and `npm run verify` pass for `/<slug>`, the host's original
  root content is still rendered, and its build configuration files are unchanged.

### Dogfooding the skill on the reference sample

The committed reference sample is specified as a presentation built by the skill. After the
skill and templates are complete, follow `skills/presentation/SKILL.md` yourself on the
reference sample: in a disposable copy of this repository (already-scaffolded case), invoke
the create flow with a complete prompt containing the topic "How to Use This Skill to Make a
Presentation", the existing sample's visual style, and the nine normative steps (eras, titles,
captions, scene intent) from `scripts/verify.expectations.json` and the "Committed reference sample" table in `openspec/changes/create-and-scene/specs/presentation-verification/spec.md`, so no
questions are needed. Compare the generated presentation with the committed
`src/presentations/how-to-make-a-presentation/`; then bring the committed sample into
conformity with the skill's output (folder shape and files derived from
`templates/presentation/`, registry line, presentation-owned CSS covering the skeleton's hook
selectors) — or adopt the generated output where it is at least as good — so the committed
sample is genuine skill output. Fix `SKILL.md` or the templates if following them could not
reproduce a passing, normatively correct sample. Keep the normative titles, captions, and order
unchanged and rerun `npm run verify` and `npm run inspect -- how-to-make-a-presentation`
(desktop and narrow) afterwards.
- Do not add CI configuration.

## Test Plan

- `INT-001` — Materialized bootstrap is complete and style-neutral. In `tests/integration/`
  (run by `npm run test:integration`, long timeout): from a working directory outside the
  repository, run `node <absolute path>/skills/presentation/scripts/scaffold.mjs --target <tmp>`
  into a fresh temp directory; instantiate `templates/presentation/` as a registered
  presentation with a few steps; `npm ci` from the committed template lock (offline cache use is
  allowed); run `npm run build` and `npm run verify` in the materialized app. Completion signal:
  build and verify pass for the registered route on `127.0.0.1`; all three anchors and the full
  React/Vite/TypeScript/Motion/Lucide/ESLint/Playwright dependency set are present; template
  lookup did not depend on the caller's cwd; the materialized kit equals canonical
  `src/presentation-kit/`; and no Tailwind dependency, CSS framework, or kit-owned visual
  defaults exist in the materialized app.

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

### Bootstrap's portion of visual inspection (from `presentation-verification`)

This task ships the existing project-local helper in the bootstrap template so scaffolded
projects provide it.

### Requirement: Visual inspection artifacts
Scaffolded projects SHALL provide a project-local helper that captures per-step screenshots from a production preview for human visual review. The helper SHALL wait for step transition animations to settle before each screenshot and SHALL surface advisory warnings for suspicious text/chrome collisions, visually indistinct active navigation states, and unpolished attribution. The helper supports the skill's visual composition check, but its screenshots and warnings are inspection artifacts rather than automated pass/fail evidence.

#### Scenario: Capture step screenshots
- **WHEN** the screenshot helper runs for a registered presentation
- **THEN** it captures each step at a standard desktop viewport and writes the images under a predictable project-local artifact directory

## Done When

- `skills/presentation/SKILL.md`, `references/` (if used), `scripts/scaffold.mjs`,
  `templates/bootstrap/`, and `templates/presentation/` exist; every scenario above is addressed
  by an explicit `SKILL.md` instruction or by deterministic scaffold behavior.
- `SKILL.md` meets the frontmatter/conciseness/imperative-style requirements and references
  templates only via paths relative to its own directory.
- `SKILL.md` branches on create vs. modify before gathering: a modify request identifies (and,
  if ambiguous, asks for) the target before any file write or scaffold, asks only about the
  requested change, and never re-walks the create interview.
- Partial scaffolding of a build-only project yields a reachable `/<slug>` route via a scoped,
  additive entry-point change while preserving the host's build configuration and root
  content; the integration case for this passes.
- The dogfooding pass is complete: following `SKILL.md` with the canonical sample prompt
  produced a passing presentation, the committed sample conforms to the skill's output
  conventions, any `SKILL.md`/template gaps it exposed are fixed, and `npm run verify` and the
  desktop and narrow `npm run inspect` runs for the sample pass with no unreviewed warnings.
- The parity/neutrality contract test and `scaffold.mjs` unit tests pass in `npm test`.
- `INT-001` passes via `npm run test:integration` and leaves the source checkout unchanged.
- `README.md` documents the skill and commands.
- `npm test`, `npm run lint`, `npm run build`, `npm run verify`, and
  `npm run test:integration` all pass, and `npm run inspect -- how-to-make-a-presentation`
  still runs with no unreviewed warnings.
- Using `chrome-devtools-axi` on a `127.0.0.1` production preview of the materialized
  bootstrap app from `INT-001` (or an equivalent manual materialization in a temp directory),
  confirm the registered starter presentation renders its first and last steps with kit chrome,
  attribution, and no console errors; delete the temp directory afterwards.
