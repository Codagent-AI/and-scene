# Task: Presentation Skill and Bootstrap Templates

## Goal
Author the distributable agent skill `skills/presentation/SKILL.md` and its `templates/` so an agent can gather requirements, self-bootstrap a missing scaffold (standalone or monorepo), create or modify registered presentations, and self-verify — with the bootstrap snapshot proven to build, render, and stay aligned with the canonical kit and scripts.

## Background
The repository already contains the canonical pieces the templates snapshot: `src/presentation-kit/` (style-neutral scene kit), `src/main.tsx` router, `src/Landing.tsx`, `src/presentations/index.ts` (explicit registry), the committed sample `src/presentations/how-to-make-a-presentation/` (use it as the worked reference for generated structure: `entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-local plain CSS), `scripts/verify.mjs`, `scripts/inspect-presentation.mjs`, and `package.json`/`eslint.config.js`/`tsconfig*.json`/`vite.config.ts`/`index.html`. Playwright and Vitest are dev dependencies; `npm test` excludes `*.browser.test.ts` and `npm run test:browser` runs only them (add either script like that if missing). Read `design.md` fully, especially "Skill", "Scaffold target resolution", "Required dependency set", "Risks / Trade-offs", Decisions 5-7, and Open Questions (finalize the monorepo signal set as: `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/` or `apps/` layout; behavior is fixed — scaffold into `presentations/`).

### Deliverables
- `skills/presentation/SKILL.md` — YAML frontmatter (`name: presentation`, a trigger-rich `description`) and the procedure: (1) Gather — ask one question at a time for topic, visual style, and each step's content + visual description; never assume details the user can still supply; allow proceeding with partial detail after an explicit choice; may skip questions if the prompt is complete; may draw ASCII mockups for key/complex steps only. (2) Resolve target + scaffold — detect the three contract anchors (build setup, scene kit, presentation index) at contract level, resolve target (empty/standalone → root; monorepo → self-contained app under `presentations/`; already inside a presentation app → reuse and scaffold only missing anchors), state the target and get confirmation before writing in any non-empty project, resolve templates relative to the directory containing `SKILL.md` (never the caller's cwd), copy only missing anchors without disturbing present ones, and install the full dependency set (never assume deps are installed; Playwright Chromium too). (3) Generate/modify — new presentation = own folder (`entities.ts`, `steps/*`, `Talk.tsx`, local plain-CSS), registered in `presentations/index.ts` with its own route; existing presentations untouched; modification lists existing presentations when the target is unspecified/ambiguous and asks only about the requested changes. Plain CSS by default; Tailwind or another framework only if the host already uses it or the user explicitly asks; never in the kit. Document the hook vocabulary below, how to style the active TOC/progress state and attribution, grouped scenes with `groupKey`, and when/how to mark intentional overlaps with `data-presentation-allow-overlap`. (4) Self-verify — `npm run build`, at least a first-step render check (`npm run verify -- --slug <generated-or-modified-slug>` so the render check targets the presentation just produced, not only the reference sample; a lighter single-route check may run first, with the full verify at completion), then visual inspection with the project-local `npm run inspect -- <slug>` (prefer it over ad hoc scripts; any temporary Playwright helper must live under the project root): inspect first, last, dense/key steps, plus a narrow viewport for responsive-sensitive presentations; review warnings, fix accidental collisions / indistinct active chrome / attribution polish, mark only genuinely intentional readable overlaps, rerun; never report success while build/render/visual checks fail; report remaining advisory status accurately.
- `skills/presentation/templates/bootstrap/` — a complete, self-contained, buildable app snapshot: `package.json` (with `build`, `lint`, `test` as appropriate, `verify`, `inspect`, `dev`, `preview` scripts), committed `package-lock.json` (so `npm ci` works), `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/Landing.tsx`, `src/index.css` (no visual defaults), `src/presentations/index.ts` (empty explicit registry), `src/presentation-kit/**` (byte-identical snapshot of the canonical kit), `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` (byte-identical to the root copies — the root `verify.mjs` reads its reference-sample configuration from data, not from the script body, so the template copy needs no sample; the template's config must name no reference sample so that verify renders every registered presentation and requires at least one), and a `.gitignore` covering `node_modules`, `dist`, `.inspection/`. Dependencies: runtime `react`, `react-dom`, `motion`, `lucide-react`; dev `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack, `playwright`. NO Tailwind, Tailwind Vite plugin, default CSS theme, colors, fonts, card or button styles.
- `skills/presentation/templates/presentation/` — templates for a new presentation (`entities.ts`, a `steps/` example, `Talk.tsx`, a local CSS file with only structural placeholders/comments, no look) and the one-line registry entry pattern.
- A drift/contract test suite (Vitest, runs under `npm test`) asserting: every non-test file under `src/presentation-kit/` is byte-identical to `skills/presentation/templates/bootstrap/src/presentation-kit/` (and no extra/missing files), root `scripts/verify.mjs` and `scripts/inspect-presentation.mjs` match their template copies, the template `package.json` declares the full required dependency set and no Tailwind/styling framework, the template has all three anchors, `SKILL.md` frontmatter is valid and every template path it references exists, and `SKILL.md` text states the key behaviors (one question at a time, template resolution relative to `SKILL.md`, monorepo → `presentations/`, confirm before writing in non-empty projects, project-local inspection helper, never report success on failure). Keep `README.md` pointing at the skill and updated to describe the finished repository (replace "Current State").
- Resolve any wording choices consistently with the vocabulary below.
- Reconcile the committed sample with the finished skill: the sample is meant to be the skill's own output, so walk `SKILL.md` and `templates/presentation/` against `src/presentations/how-to-make-a-presentation/` and align the sample's structure (`entities.ts`, `steps/*`, `Talk.tsx`, presentation-local plain CSS, one explicit registry line, styling only outside the kit, `data-presentation-allow-overlap` only on intentional overlaps) and the skill's documented conventions with each other, adjusting whichever deviates. Keep the nine normative titles, captions, and scene intent unchanged, and re-run `npm run verify` and `npm run inspect -- how-to-make-a-presentation` afterwards.

Shared hook and script vocabulary (the design fixes only the `data-step-count` / `data-step-index` hooks and the file paths/commands; the rest was chosen while planning so independent work stays compatible, and must be used verbatim):
- Chrome root element exposes `data-step-count` (total steps) and `data-step-index` (zero-based active index).
- Mode: `data-presentation-mode="present"` or `"browse"` on the chrome root.
- Progress indicators: `data-presentation-progress-item`; table-of-contents entries: `data-presentation-toc-item`. The one representing the active step also carries `aria-current="step"` and `data-presentation-active="true"`.
- Attribution link: `data-presentation-attribution` (text `made by and-scene`, bottom-right, links to the and-scene GitHub repository).
- Allow-overlap marker: `data-presentation-allow-overlap` on a subtree root; text/chrome overlap warnings are suppressed for elements inside it.
- Browser-backed vitest files are named `*.browser.test.ts`; `npm test` runs `vitest run` excluding them and `npm run test:browser` runs only them.

Do not add `.github/workflows/` or any CI config. Do not commit build output, `node_modules` (including inside templates), or screenshots.

## Spec
Canonical requirements for capability `presentation-skill` (copied verbatim):

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

Style-neutrality of the scaffold relates to this requirement of capability `evolving-scene-presentations` (verbatim):

### Requirement: Style ownership boundary
The scene kit SHALL have zero styling defaults. It SHALL provide motion behavior, fixed-canvas layout plumbing, navigation/chrome behavior, and stable DOM hooks for authors to style, but it SHALL NOT impose a palette, font, color, border treatment, glow, card appearance, button style, spacing scale, CSS theme tokens, or styling-framework dependency. Any default geometry used for the fixed canvas or chrome placement is layout behavior, not a visual style system.

#### Scenario: Kit primitives expose style hooks
- **WHEN** a presentation composes scene kit primitives or chrome
- **THEN** the rendered markup exposes stable hooks that presentation-owned CSS can target
- **AND** visual choices such as color, typography, spacing scale, borders, and shadows come from the presentation or host app

#### Scenario: Unstyled kit output
- **WHEN** a presentation uses scene kit primitives without presentation-owned CSS
- **THEN** the kit does not supply fallback colors, fonts, borders, shadows, card treatments, or button treatments

#### Scenario: Optional styling frameworks remain optional
- **WHEN** a presentation author wants to use Tailwind or another styling framework
- **THEN** that framework is configured by the presentation or host app, not required by the reusable scene kit

#### Scenario: Coordinate-heavy diagrams are supported
- **WHEN** a presentation needs literal per-step coordinates for diagram entities
- **THEN** kit primitives expose class/style hooks, and authors MAY use raw motion elements with stable `layoutId`s when a primitive is not the right shape

## Test Plan
Assigned obligation (copied verbatim from `test-plan.md`):

### INT-001: Materialized bootstrap is complete and style-neutral
- Covers: Self-bootstrapping scaffold, template resolution, required dependencies, style ownership, and template-to-canonical-kit drift.
- Boundary: The distributable `skills/presentation/templates/bootstrap/` snapshot is copied into a fresh filesystem location and exercised through its package scripts and canonical scene-kit contracts.
- Setup: Materialize the bootstrap template in an isolated temporary directory, install its declared dependencies from the committed lock data, and invoke it from a working directory outside the source repository.
- Action: Build the materialized app, open its registered route through its local verification entry point, and compare non-test scene-kit files with the canonical `src/presentation-kit/` source where parity is required.
- Assertions: The build and route smoke check pass; all three scaffold anchors and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; template lookup is independent of the caller's working directory; canonical and template kit files remain aligned; and neither the kit nor scaffold introduces Tailwind or visual defaults owned by the reusable kit.
- Execution: Run in the repository's automated integration suite on every pull request after dependency installation.

Implementation guidance: INT-001 is a browser-backed vitest file (`*.browser.test.ts`). It copies `skills/presentation/templates/bootstrap/` (resolving the path from the test file location, not cwd) into a fresh `os.tmpdir()` directory, runs `npm ci` from the committed lock (an offline/cache-assisted install is acceptable as a permitted substitute), instantiates a presentation from `templates/presentation/` under a throwaway slug and registers it in the materialized registry, then — with the process cwd set OUTSIDE the source repository — runs `npm run build` and `npm run verify -- --slug <throwaway slug>` (and may run the inspect helper once) in the materialized app. It then asserts the build and route smoke pass, the three anchors and complete dependency set exist, the byte-parity checks from the drift suite hold, and no Tailwind or kit-owned visual defaults appear. Always clean up the temp directory and preview processes.

## Done When
- `SKILL.md`, `templates/bootstrap/`, and `templates/presentation/` exist as described and the materialized bootstrap builds, lints, and passes its own verify with a template-generated presentation registered.
- The committed sample and the skill's documented structure/conventions agree (see reconciliation above), with `npm run verify` and `npm run inspect -- how-to-make-a-presentation` passing afterwards.
- Contract/drift tests pass under `npm test`; INT-001 passes under `npm run test:browser`.
- The full suite passes from the repo root: `npm ci`, `npm test`, `npm run test:browser`, `npm run lint`, `npm run build`, `npm run verify`, and `npm run inspect -- how-to-make-a-presentation`; screenshots were reviewed with `chrome-devtools-axi` for first, last, dense, and narrow-viewport steps.
- `README.md` documents the skill, commands, and layout accurately; no CI config, build output, dependency directories, or screenshots are committed.
