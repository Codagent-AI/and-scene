## Why

Agent Runner needs a realistic eval fixture for comparing workflow behavior across
models and workflow revisions. A presentation-generation skill is large enough to
exercise planning, frontend implementation, verification, and artifact quality,
while still being small enough to reset and rerun from a spec-only branch.

## What Changes

- Add a hybrid agent skill that creates browser-based presentations from a topic.
- Make the skill self-bootstrapping: when the presentation scaffold (build setup,
  scene kit, presentation index) is missing, it scaffolds what's needed before
  creating a presentation.
- Model presentations as one evolving diagrammatic scene, not as independent
  slides.
- Add reusable React components, templates, and scripts that the skill can use
  when creating a new presentation.
- Add a verification flow that invokes the skill on a silly topic and confirms
  the generated presentation builds and renders.

## Capabilities

### New Capabilities

- `presentation-skill`: Defines the skill contract, inputs, workflow, generated
  artifacts, and quality bar for creating a new presentation.
- `evolving-scene-presentations`: Defines the runtime presentation model: one
  scene moving through named states with stable entities, captions, navigation,
  and present/browse modes.
- `presentation-verification`: Defines how generated presentations are verified
  through build checks, render checks, and a sample silly-topic output.

### Modified Capabilities

- None.

## Technical Approach

And Scene will remain a small Vite, React, and TypeScript app. The implementation
will add a reusable presentation kit and a local skill that can generate a new
presentation from a topic.

Throughout this change, "presentation" is the canonical term for the generated
artifact. "Talk" is treated as a synonym only in informal narrative and carries
no separate meaning in the skill or scene contracts.

```text
topic
  |
  v
skill procedure
  |
  +--> presentation outline and narrative beats
  |
  +--> typed scene-state data
  |
  +--> generated presentation route/files
  |
  v
verification
  |
  +--> npm run build
  +--> render smoke check
  +--> generated silly-topic presentation exists
```

The core representation should be stateful:

```text
Scene
  entities: stable IDs for boxes, labels, arrows, groups, and emphasis markers
  steps: ordered named states that transform those entities over time
  chrome: navigation, captions, present mode, and browse mode
```

The skill should be hybrid rather than prompt-only. The skill document provides
the agent procedure and quality bar; reusable templates/scripts/components keep
the generated output consistent enough for evals.

The eval workflow will clone a spec-only branch, run Agent Runner's OpenSpec
implementation workflow for this change, then compare the resulting behavior and
artifacts across candidate models or workflow versions. Creating that spec-only
branch (proposal + specs + design, without tasks or implementation) and a
reference implementation branch is a one-time manual setup performed after this
change is implemented; it is not itself a capability of this system (see Out of
Scope).

The Agent Runner-side Docker/smoke-test configuration that points the eval at this
repository's spec-only branch lives in the Agent Runner codebase and is tracked
separately (see Out of Scope); it is a consumer of this change, not a deliverable
of it.

## Out of Scope

- PowerPoint, Keynote, PDF, or image export.
- A general-purpose visual editor.
- A production hosting or publishing workflow.
- Subjective scoring of visual taste as the primary verification mechanism.
- Recreating the full codagent.dev site.
- Eval fixture branching. Creating the spec-only and reference-implementation
  branches is a one-time manual operation done after this change ships, not a
  capability the system implements (a spec for branch creation would otherwise
  have to live on the very branch it creates, and only ever runs once).
- Agent Runner's Docker smoke-test configuration. Updating Agent Runner so its
  smoke project is cloned from this repository's spec-only branch is an external
  dependency tracked in the Agent Runner codebase, not a deliverable of this
  change.

## Impact

- Adds a local skill definition for generating presentations.
- Adds React presentation-kit code and generated presentation conventions.
- Adds scripts or tests for build/render verification.
- Adds OpenSpec artifacts that can be preserved on a spec-only branch for evals.
- External dependency (not delivered here): Agent Runner's Docker smoke test must
  be updated separately so the smoke project is cloned from this repository's
  spec-only branch instead of a generic starter. Tracked in the Agent Runner
  codebase; see Out of Scope.
