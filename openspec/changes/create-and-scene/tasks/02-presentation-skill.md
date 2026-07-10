# Task: Presentation skill

## Goal

Author the local **presentation skill** that an agent uses to create and modify
evolving-scene presentations: a hybrid skill made of a `SKILL.md` procedure plus
`templates/`. The skill interactively gathers details, self-bootstraps missing
scaffolding (monorepo-aware), generates or modifies presentations, registers them,
and self-verifies build + render before reporting done.

## Background

This repo (`and-scene`) is a Vite + React 19 + TypeScript app whose reusable
presentation engine — the "scene kit" — lives at `src/presentation-kit/`, with an
explicit presentation registry at `src/presentations/index.ts` and a zero-dep
pathname router in `src/main.tsx` (presentations live at `/<slug>`, each as its own
folder under `src/presentations/<slug>/` rendering `<Presentation steps={…} />`).
A presentation supplies only its own entities (a `layoutId` namespace) and its
`steps/*` (Scenes composing the kit's generic node primitives: `Box`, `Label`,
`Arrow`, `Frame`, `Emphasis`, `SymbolChip`, plus `Appear`/`SceneLayer`).

You MUST read these files before starting:
- `openspec/changes/create-and-scene/design.md` — full architecture; see the
  "Skill" section (procedure, scaffold target resolution, required dependency set)
  and the repository layout.
- `openspec/changes/create-and-scene/specs/presentation-skill/spec.md` — the
  behavioral contract (also copied verbatim below).
- `src/presentation-kit/` (all files) — the engine the skill writes presentations
  against; the SKILL.md must describe how to compose it.
- `src/presentations/index.ts` and `src/main.tsx` — how presentations are
  registered and routed.
- `package.json`, `vite.config.ts` — the build setup and dependency baseline.

**This is a hybrid skill** — the `SKILL.md` provides the agent procedure and
quality bar; `templates/` keep generated output consistent. Place it at
`skills/presentation/` with:
- `skills/presentation/SKILL.md` — the procedure.
- `skills/presentation/templates/` — a presentation template (folder with
  `entities.ts`, a `steps/` example, and `Talk.tsx`), a single-step template, AND
  a snapshot of the app + scene kit used ONLY to bootstrap a fresh/empty project.

**Procedure the SKILL.md must encode (from the design):**
1. **Gather** — ask one question at a time for topic, visual style, and each step's
   content + visual description; optionally draw ASCII mockups for key/complex
   steps. The human controls depth and may build from partial detail and iterate.
2. **Resolve target + scaffold if needed** — detect the three contract anchors
   (build setup; scene kit; presentation index) at the contract level (not a
   byte-identical match). Resolve a target location, then scaffold whatever is
   missing from `templates/`, installing the required dependencies. Never assume
   deps are installed.
   - Target resolution: empty/standalone → repo root; **monorepo** (workspaces in
     `package.json`, `pnpm-workspace.yaml`, or a `packages/`|`apps/` layout) →
     scaffold a self-contained app under `presentations/`; already-scaffolded →
     use it, scaffold only missing anchors.
   - Required dependency set the scaffold ensures: runtime `react`, `react-dom`,
     `motion`, `lucide-react`; dev/build `vite`, `@vitejs/plugin-react`,
     `typescript` + `@types/react` + `@types/react-dom` + `@types/node`,
     `tailwindcss`, `@tailwindcss/vite`, the eslint stack, and `playwright` (for
     the render check).
   - In a non-empty project, state the resolved target location and confirm before
     writing.
3. **Generate / modify** — create writes a new `src/presentations/<slug>/`
   (`entities.ts` + `steps/*` + `Talk.tsx`) and registers one line in
   `src/presentations/index.ts`; modify identifies the target first (listing
   existing presentations if ambiguous) and makes only the requested scoped edits.
4. **Self-verify** — run the build and a render check; fix failures before
   reporting done.

**Constraint:** the SKILL.md is a procedure document, so it may reference the
project's verification entry point (`npm run verify`) as the self-verify command
even though the script itself is delivered alongside the reference sample. Keep the
procedure tool-agnostic about how the agent asks questions.

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

#### Scenario: Empty or fully unscaffolded directory
- **WHEN** the skill runs in an empty directory or a project with none of the three anchors present
- **THEN** it performs a full scaffold (build setup, scene kit, and presentation index) and installs the required dependencies before creating the presentation

#### Scenario: Already scaffolded
- **WHEN** all three anchors are already present
- **THEN** the skill skips scaffolding and proceeds directly to creating or modifying the presentation

#### Scenario: Partial scaffold
- **WHEN** some but not all anchors are present
- **THEN** the skill scaffolds only the missing anchors (and their dependencies) without disturbing the ones already present

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
Before reporting success, the skill SHALL confirm that the generated or modified presentation builds and renders without errors, fixing any failures itself. The render check SHALL at minimum render the presentation's first step without runtime or console errors; the full multi-step render check across every step is defined by the `presentation-verification` capability.

#### Scenario: Checks run before done
- **WHEN** the skill finishes generating or modifying a presentation
- **THEN** it runs the build and at least a first-step render check before reporting completion

#### Scenario: Failures are fixed, not reported as success
- **WHEN** the build or render check fails
- **THEN** the skill fixes the issues and re-checks rather than reporting success

### Requirement: Generated presentation quality bar
Every generated presentation SHALL build with no type errors, render its first step without runtime errors, present a caption per step, support next/previous navigation, and conform to the evolving-scene model.

#### Scenario: Builds clean
- **WHEN** a presentation is generated
- **THEN** `npm run build` completes with no type errors

#### Scenario: Renders without errors
- **WHEN** the presentation route is opened
- **THEN** it renders its first step with no runtime or console errors

#### Scenario: Captions and navigation present
- **WHEN** viewing a presentation
- **THEN** each step shows a caption and the user can navigate to the next and previous steps

## Done When

`skills/presentation/SKILL.md` and `skills/presentation/templates/` exist and fully
encode the procedure above: interactive one-at-a-time gathering, contract-anchor
detection with monorepo-aware target resolution and the full dependency set,
create/modify flows that register in the index, self-verify, and the quality bar.
The templates are sufficient to bootstrap a fresh project and to stamp out a new
presentation. (The procedure is exercised end-to-end when the skill is used to
build a real presentation.)
