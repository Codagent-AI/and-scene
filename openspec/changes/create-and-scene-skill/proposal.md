## Why

Agent Runner needs a realistic eval fixture for comparing workflow behavior across
models and workflow revisions. A presentation-generation skill is large enough to
exercise planning, frontend implementation, verification, and artifact quality,
while still being small enough to reset and rerun from a spec-only branch.

## What Changes

- Add a hybrid agent skill that creates browser-based presentations from a topic.
- Model presentations as one evolving diagrammatic scene, not as independent
  slides.
- Add reusable React components, templates, and scripts that the skill can use
  when creating a new talk.
- Add a verification flow that invokes the skill on a silly topic and confirms
  the generated presentation builds and renders.
- Keep the repository usable as an eval fixture by supporting a branch that
  contains the starter scaffold and OpenSpec artifacts, but no implementation.

## Capabilities

### New Capabilities

- `presentation-skill`: Defines the skill contract, inputs, workflow, generated
  artifacts, and quality bar for creating a new presentation.
- `evolving-scene-presentations`: Defines the runtime presentation model: one
  scene moving through named states with stable entities, captions, navigation,
  and present/browse modes.
- `presentation-verification`: Defines how generated talks are verified through
  build checks, render checks, and a sample silly-topic output.
- `eval-fixture-branching`: Defines the repository state needed for repeatable
  Agent Runner evals, including a spec-only branch and a reference
  implementation branch.

### Modified Capabilities

- None.

## Technical Approach

And Scene will remain a small Vite, React, and TypeScript app. The implementation
will add a reusable presentation kit and a local skill that can generate a new
talk from a topic.

```text
topic
  |
  v
skill procedure
  |
  +--> talk outline and narrative beats
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

The eval workflow will clone the spec-only branch, run Agent Runner's OpenSpec
implementation workflow for this change, then compare the resulting behavior and
artifacts across candidate models or workflow versions.

## Out of Scope

- PowerPoint, Keynote, PDF, or image export.
- A general-purpose visual editor.
- A production hosting or publishing workflow.
- Subjective scoring of visual taste as the primary verification mechanism.
- Recreating the full codagent.dev site.

## Impact

- Adds a local skill definition for generating presentations.
- Adds React presentation-kit code and generated presentation conventions.
- Adds scripts or tests for build/render verification.
- Adds OpenSpec artifacts that can be preserved on a spec-only branch for evals.
- Requires Docker smoke-test updates in Agent Runner so the smoke project can be
  cloned from this repository's spec-only branch instead of a generic starter.
