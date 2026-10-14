# Task: Presentation skill and bootstrap templates

## Goal
Deliver the distributable agent skill at `skills/presentation/` — `SKILL.md` plus `templates/` — that gathers presentation details interactively, resolves a scaffold target (standalone vs. monorepo), self-bootstraps whichever of the three contract anchors are missing (build setup, scene kit, presentation index) with the full dependency set, creates or modifies presentations, and self-verifies before reporting completion. The bootstrap template must materialize a working, style-neutral app outside this repository.

## Background
This repo already contains the canonical pieces the skill snapshots; read them first:
- `src/presentation-kit/` (canonical scene kit; its non-test files are what the template must mirror byte-for-byte), `src/main.tsx` (pathname router), `src/Landing.tsx`, `src/presentations/index.ts` (explicit registry of `{ slug, title, load }`), and the worked sample `src/presentations/how-to-make-a-presentation/` (`entities.ts`, `steps/*.tsx`, `Talk.tsx`, presentation-local plain CSS) as the model for what a generated presentation looks like.
- `scripts/verify.mjs` (build + Playwright render verification, `npm run verify`) and `scripts/inspect-presentation.mjs` (screenshot + advisory diagnostics, `npm run inspect -- <slug>`, with a documented allow-overlap marker attribute and settle-interval option). Read their headers for exact behavior and names. The verify script isolates reference-sample expectations from its generic parts; the bootstrap copy must work in a project with no reference sample (and build-only/pass-with-notice when zero presentations are registered, unless you choose a clearer rule and record it).
- `package.json`, `package-lock.json`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, `index.html` as the model for the bootstrap app's build setup.
Read `CLAUDE.md` and `AGENTS.md` for workflow rules (TDD where behavior is involved, `127.0.0.1`, no CI config, no committed build output/screenshots/`node_modules`, `chrome-devtools-axi` for interactive inspection).

Fixed layout and decisions:
```
skills/presentation/
  SKILL.md          # procedure
  templates/
    bootstrap/      # app + kit + router + empty registry + verify/inspect scripts + lock data; used only to bootstrap a fresh project
    presentation/   # per-presentation templates (entities.ts, steps/*, Talk.tsx, presentation CSS) with substitution points
```
- Skill name `presentation` (`skills/presentation/`), with valid skill frontmatter (`name`, `description`).
- Procedure in `SKILL.md`: (1) **Gather** — one question at a time for topic, visual style, and each step's content + visual description; may draw ASCII mockups for key/complex steps (not every step); the user may proceed with partial detail; do not invent details the user can still provide. (2) **Resolve target + scaffold if needed** — detect the three anchors at contract level (build setup with working `npm run build`; scene kit: step contract/stage/nav/chrome/fit-scale; presentation index mapping presentations to routes), not byte-identical files; resolve target then scaffold only what's missing from `templates/` and install the full dependency set; in a non-empty project state the target and get confirmation before writing. (3) **Generate/modify** — write `entities.ts` + `steps/*` + `Talk.tsx` plus presentation-owned plain-CSS styling (create; register in `src/presentations/index.ts`) or make scoped edits to an identified presentation (modify: list presentations if the target is unclear, ask only about the requested changes). (4) **Self-verify** — build, at least first-step render, browser visual composition check using the project-local helper (`npm run inspect -- <slug>`) with first, last, dense/key steps and a narrow viewport when responsive-sensitive; review advisory warnings, fix accidental collisions/indistinct active chrome/attribution polish, mark only intentional readable overlaps with the allow-overlap marker; run the full `npm run verify` for completion; never report success on failing output.
- Scaffold target resolution: empty dir/standalone project → scaffold at root; monorepo (`workspaces` in `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout — finalize the signal set, behavior is fixed) → self-contained app under `presentations/` rather than mutating the repo root; already inside a presentation app (anchors present) → use it and scaffold only missing anchors.
- Required dependency set the scaffold ensures (never assume present): runtime `react`, `react-dom`, `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, the eslint stack, and `playwright`. Tailwind or any other styling framework only if the host already uses it or the user explicitly requests it. The bootstrap ships zero presentation styling defaults (no Tailwind, theme tokens, default colors/fonts/cards/buttons) — host `index.css` in the template should be structural-only (e.g. reset/layout needed for the app to fill the viewport, nothing visual).
- Template path resolution: `SKILL.md` must instruct resolving `templates/bootstrap/` and `templates/presentation/` relative to the directory containing `SKILL.md`, never the user's current working directory. If useful, add a small deterministic helper (e.g. `skills/presentation/scripts/scaffold.mjs`) that resolves templates via `import.meta.url`, detects anchors/target, and copies missing parts; this makes template lookup and partial scaffolding testable. Whether to add it is your call — keep the skill readable if you do not.
- Drift control: `templates/bootstrap/` carries a snapshot of `src/presentation-kit/` that must stay byte-aligned for non-test kit files, and aligned copies of `scripts/verify.mjs` and `scripts/inspect-presentation.mjs`. Add an automated parity test that fails on drift. Document this sync rule in the skill directory (brief README or comment) for future maintainers.
- The bootstrap's `scripts/verify.mjs` copy must keep the aligned behavior of provisioning Playwright Chromium before launching the browser (the design's "Install Chromium in the verify step"), so a freshly materialized project works without a pre-cached browser.
- The bootstrap includes a committed `package-lock.json` (so installs in tests are reproducible) and `.gitignore` entries for build output, `node_modules`, and the inspection artifact directory. Do not add `.github/workflows/`.

Reference sample conformance: the committed sample `src/presentations/how-to-make-a-presentation/` (slug `how-to-make-a-presentation`, route `/how-to-make-a-presentation`, entry `Talk.tsx` opening in `initialMode="browse"`) is specified as "a presentation, built by the skill, about building presentations with the skill". It is normative that it has nine steps with these exact titles, in order — "You have a topic", "The skill interviews you", "Answers become steps", "The deck grows", "You set the depth", "It assembles the scene", "It checks its own work", "Changed your mind? Loop it.", "You're looking at one" — grouped into eras "the ask" (steps 1–2), "the gathering" (3–5), "the build" (6–7), "the loop" (8), and "the reveal" (9), with the captions already committed in the sample (do not alter any title, caption, or era; `npm run verify` enforces titles and captions, so during conformance also compare the eras against this list by hand). Because the sample was authored before the skill existed, you must prove the finished skill produces output of the same shape: follow `SKILL.md` end to end (scaffold plus create) in a disposable scratch project outside this repository, using the nine-step outline above as the topic input, and reconcile every structural difference between that output and the committed sample (file layout `entities.ts` / `steps/*.tsx` / `Talk.tsx` / presentation-local CSS, registry entry shape, kit usage, grouped-scene use, hooks styled locally) by updating the templates, `SKILL.md`, or the committed sample so they agree. If regenerating the committed sample through the skill is simpler, you may do so, provided titles, captions, eras, scene intent, route, and verification results are unchanged. Delete the scratch project afterward.

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
- `INT-001` (Materialized bootstrap is complete and style-neutral): boundary is the `skills/presentation/templates/bootstrap/` snapshot copied into a fresh temporary directory and exercised through its package scripts and the canonical scene-kit contracts. Setup: materialize the bootstrap (via the helper script if you added one, otherwise copy + the documented steps) into an isolated temp dir, instantiate a minimal presentation from `templates/presentation/` and register it, install dependencies from the committed lock data (`npm ci`; reuse a local npm cache if available), and invoke everything from a working directory outside the source repository. Action: build the materialized app, run its local `npm run verify` against the registered route, and compare non-test scene-kit files with `src/presentation-kit/`. Assert: build and route smoke check pass; all three anchors and the complete React/Vite/TypeScript/Motion/Lucide/lint/Playwright dependency set are present; template lookup does not depend on the caller's cwd; canonical and template kit files are byte-identical; and neither kit nor scaffold introduces Tailwind or visual defaults (no Tailwind/theme dependency, no color/font/border/shadow/card/button defaults in the kit or bootstrap CSS). Also cover, at the filesystem level, the target-resolution and partial-scaffold scenarios if you built a helper (empty dir ⇒ root full scaffold; monorepo signal ⇒ `presentations/` self-contained app, root files untouched; partial anchors ⇒ only missing ones added, existing ones untouched). Implement as a Vitest integration test (e.g. `tests/integration/`) included in `npm test`, with a long timeout; it may be slower because of `npm ci` and Chromium.
- Agent acceptance (`AT-*`) and human testing are not implementor deliverables, but write `SKILL.md` so those journeys (empty standalone, partial monorepo with confirmation, add/modify with ambiguous-target listing, failure-repair loop) are followable by an agent.

## Done When
- `skills/presentation/SKILL.md` and `templates/bootstrap/` + `templates/presentation/` exist and satisfy every requirement and scenario above; every scenario is explicitly addressed in the procedure or backed by an automated test.
- `INT-001` and the template-parity test pass within `npm test`.
- A materialized bootstrap in a scratch directory outside the repo builds, lints, and passes its own `npm run verify` (including Chromium provisioning) with a presentation generated from `templates/presentation/`; the scratch directory is removed afterward.
- The reference sample conformance exercise described in Background has been performed through the finished `SKILL.md`, any structural differences are reconciled, and the committed sample still passes `npm run verify` with its nine titles/captions unchanged and its eras matching the grouping above.
- `npm test`, `npm run lint`, `npm run build`, and `npm run verify` pass in this repository; nothing generated (dist, node_modules, screenshots) is committed.
- Final pass with `chrome-devtools-axi` and `npm run inspect -- how-to-make-a-presentation`: inspect first, last, dense, and narrow-viewport steps of the sample, confirm no regressions, and run the complete test, lint, build, and verify suite once more before reporting the change complete.
