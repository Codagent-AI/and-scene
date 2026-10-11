# Task: Presentation skill and bootstrap templates

## Goal
Deliver the distributable agent skill at `skills/presentation/` — `SKILL.md` (the interactive procedure and quality bar) plus `templates/` (a bootstrap snapshot of the app, scene kit, scripts, and presentation index, and presentation templates) — so an agent can gather requirements, self-bootstrap a missing scaffold in the right location, create or modify presentations, and self-verify before reporting success.

## Background
Assume the following already exist in this repository (built as part of this change) and are the sources the templates snapshot: the canonical scene kit `src/presentation-kit/`; the pathname router `src/main.tsx`, `src/Landing.tsx`, and the explicit registry `src/presentations/index.ts` (`[{ slug, title, load }]`); the committed sample `src/presentations/how-to-make-a-presentation/` (`entities.ts`, `steps/*.tsx`, `Talk.tsx`); `scripts/verify.mjs` (`npm run verify`, build + Playwright render check over `vite preview` on `127.0.0.1`, reading `data-step-count`/`data-step-index`); `scripts/inspect-presentation.mjs` (`npm run inspect -- <slug>`, settled per-step screenshots and advisory overlap / active-chrome / attribution warnings with an allow-overlap marker); Vitest (`npm test`); ESLint; Vite + React + TypeScript config. Inspect them before copying.

Fixed paths and names (copy verbatim): skill at `skills/presentation/SKILL.md` (skill name `presentation`); bootstrap snapshot at `skills/presentation/templates/bootstrap/`; presentation templates under `skills/presentation/templates/` (e.g. `skills/presentation/templates/presentation/` with `entities.ts`, `steps/`, `Talk.tsx` templates — exact layout is yours, but `templates/bootstrap/` is fixed); per-presentation files are `entities.ts`, `steps/*`, and `Talk.tsx` in a folder registered by one line in `presentations/index.ts`; monorepo scaffold target directory `presentations/`; the scaffold's scripts `npm run build`, `npm run verify`, `npm run inspect`.

Design decisions (see `design.md` "Skill", "Scaffold target resolution", "Required dependency set", Decisions 5 and 6, and Risks):

- The skill is hybrid: SKILL.md drives the procedure; templates + kit keep output consistent. Procedure: (1) Gather — one question at a time for topic, visual style, and each step's content/visual description, optional ASCII mockups for key/complex steps only, user may proceed with partial detail, skip questions if the prompt is already complete; (2) Resolve target and scaffold what is missing — detect the three contract anchors by presence (build setup = Vite+React+TS app with working `npm run build`; scene kit; presentation index), not byte equality; scaffold only missing anchors without disturbing present ones; install the full dependency set (runtime: `react`, `react-dom`, `motion`, `lucide-react`; dev/build: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack, and `playwright`, plus `vitest` as needed by shipped scripts) rather than assuming any is present; no Tailwind or any styling framework unless the host already uses it or the user explicitly asks; (3) Generate/modify — write `entities.ts` + `steps/*` + `Talk.tsx` in the presentation's own folder, register it, default to plain CSS owned by the presentation/host (never in the kit), preserve existing presentations; for modification, if the target is unspecified/ambiguous list existing presentations and ask which, then ask only about requested changes and edit in place; (4) Self-verify — run build, at least a first-step render check, then the project-local screenshot helper and browser inspection of first, last, dense/key steps (and narrow viewport when responsive-sensitive); review advisory warnings, fix accidental collisions and indistinct active chrome / unpolished attribution, mark only intentional readable overlaps with the allow-overlap marker; fix failures and re-check rather than reporting success; prefer the lighter build + single-route render during iteration and run the full `npm run verify` before completion; if a project-local helper is absent, any temporary Playwright helper must live under the project root. Use `chrome-devtools-axi` for interactive inspection where available.
- Scaffold target resolution: empty dir or standalone project → root; monorepo (detect `workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) → a self-contained app in `presentations/`, not the monorepo root; already inside a presentation app → reuse it. In any non-empty project that lacks the scene kit or presentation index, state the target location and proceed only after the user confirms. Finalize the monorepo-signal set (design Open Question) and document it.
- Templates resolve relative to the directory of the skill's own `SKILL.md` (never the caller's cwd); SKILL.md must say so explicitly and must reference templates via paths relative to itself.
- `templates/bootstrap/` is a release snapshot of the repository's own app: kit files under it must be byte-identical to `src/presentation-kit/` (excluding test files), and its verification/inspection scripts must stay aligned with `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`. It must be a complete buildable app: `package.json` (with a committed lockfile so `npm ci` works — INT-001 installs from committed lock data), `index.html`, `vite.config.ts`, tsconfigs, `eslint.config.js`, `src/main.tsx` router, `src/Landing.tsx`, `src/index.css` (the bootstrap copy MUST NOT be a copy of the repository's own `src/index.css`, which sets global fonts, colors, and a background gradient; ship an empty or purely structural file — e.g. at most a `box-sizing`/margin reset — with no colors, fonts, backgrounds, spacing scale, or theme tokens), `src/presentation-kit/`, `src/presentations/index.ts` containing at least one registered minimal presentation so its route smoke check can run, and `scripts/verify.mjs` + `scripts/inspect-presentation.mjs`. Prefer generating/refreshing the snapshot from the canonical sources with a small script (e.g. `scripts/sync-templates.mjs`, with a `--check` mode used by tests) rather than hand-copying; never commit `node_modules`/`dist`. The template's verify entry point must work against the template's own registered presentation (slug/params configurable rather than hard-coding the sample).
- The kit stays style-neutral; the skill must instruct authors to put active-step, attribution, and look-and-feel styling in presentation- or host-owned CSS using the kit's `data-presentation-*` hooks.
- Project rules: TDD for behavior (sync/drift script, contract tests); prose-only SKILL.md content does not need tests but is covered by the contract tests below; no CI config; commit messages `type: lowercase description`.

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
- `INT-001` Materialized bootstrap is complete and style-neutral: copy `skills/presentation/templates/bootstrap/` into a fresh temporary directory outside the repository, `npm ci` from the committed lock data, and invoke its scripts with a working directory outside the source repository. Assert: the materialized app builds; its local verification entry point opens its registered route and passes the smoke check; all three anchors (build setup, scene kit, presentation index) are present; the full dependency set (React, Vite, TypeScript, Motion, Lucide, lint stack, Playwright) is declared; template lookup is independent of the caller's cwd (e.g. the SKILL.md-relative path resolution is documented and a helper/test resolves `templates/bootstrap/` from the SKILL.md directory regardless of cwd); non-test kit files under `templates/bootstrap/src/presentation-kit/` are byte-identical to `src/presentation-kit/`; the template scripts remain aligned with the root scripts; and neither the kit nor any part of the scaffold (kit, host CSS such as `src/index.css`, `Landing`, and the registered starter presentation and its CSS) contains Tailwind (dependency, plugin, import) or default presentation styling (colors, fonts, spacing scale, card/button styles, borders, shadows, theme tokens). Implement the CSS assertion as a scan of every `.css` file and inline style in the materialized app for those declarations. Run it in the repository's automated integration suite (Vitest-driven, requires network-free installs from the lockfile and Chromium for the smoke check; make Chromium availability explicit and fail with an actionable message when absent).
- Add a cheap static contract test (runs in plain `npm test`) that checks SKILL.md contains the required procedure elements (one-question-at-a-time gathering, partial-detail opt-in, three anchors, root vs `presentations/` target rules, confirm-before-write in non-empty projects, SKILL.md-relative template resolution, plain-CSS default, ambiguous-target listing, self-verify with build/render/visual inspection and warning review) and that frontmatter `name`/`description` are valid. This is an implementation-time unit decision, not a substitute for the skill's acceptance exploration, which is performed separately by a reviewer (do not attempt AT-* acceptance runs here).

## Done When
- `skills/presentation/SKILL.md` exists with valid frontmatter and covers every scenario above; `skills/presentation/templates/` contains the bootstrap snapshot and presentation templates; templates resolve relative to SKILL.md.
- A materialized copy of `templates/bootstrap/` installs from its lockfile, builds, and passes its own verify smoke check from outside the source repo (`INT-001`), including drift checks against `src/presentation-kit/` and the root scripts.
- Style-neutrality and no-Tailwind assertions pass for the kit and the whole bootstrap scaffold, including its host CSS (`src/index.css`), `Landing`, and starter presentation; no global colors, fonts, or backgrounds are shipped.
- A drift-sync mechanism (script plus `--check` test) keeps the template snapshot aligned with canonical sources.
- Monorepo-detection signals and the root-vs-`presentations/` rule are documented in SKILL.md.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` all pass; no generated output, `node_modules`, screenshots, or CI configuration are committed.
