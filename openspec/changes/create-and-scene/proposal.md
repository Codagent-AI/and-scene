## Why

People who explain technical ideas often want a browser presentation that works
as one evolving diagram, where elements appear, move, connect, and re-label as the
explanation develops, rather than a deck of disconnected slides. Building that by
hand is slow and inconsistent. An agent skill that generates such presentations
from a topic, backed by a reusable scene kit and a verification flow, makes them
repeatable.

## What Changes

- Add a hybrid agent skill that creates browser-based presentations from a topic.
- Make the skill self-bootstrapping: when the presentation scaffold (build setup,
  scene kit, presentation index) is missing, it scaffolds what's needed before
  creating a presentation.
- Model presentations as one evolving diagrammatic scene, not as independent
  slides.
- Add reusable React components, templates, and scripts that the skill can use
  when creating a new presentation.
- Add a verification flow that invokes the skill on a sample topic and confirms
  the generated presentation builds and renders.

## Capabilities

### New Capabilities

- `presentation-skill`: Defines the skill contract, inputs, workflow, generated
  artifacts, and quality bar for creating a new presentation.
- `evolving-scene-presentations`: Defines the runtime presentation model: one
  scene moving through named states with stable entities, captions, navigation,
  and present/browse modes.
- `presentation-verification`: Defines how generated presentations are verified
  through build checks, render checks, and a sample output.

### Modified Capabilities

- None.

## Technical Approach

And Scene will remain a small Vite, React, and TypeScript app. The implementation
will add a reusable presentation kit and a local skill that can generate a new
presentation from a topic.

Throughout this change, "presentation" is the canonical term for the generated
artifact. "Talk" is treated as a synonym only in informal narrative and carries
no separate meaning in the skill or scene contracts. The one exception is the
per-presentation entry component, named `Talk.tsx`; the
filename is incidental and does not denote a distinct concept.

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
  +--> generated sample presentation exists
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
the generated output consistent across presentations.

## Out of Scope

- PowerPoint, Keynote, PDF, or image export.
- A general-purpose visual editor.
- A production hosting or publishing workflow.
- Subjective scoring of visual taste as the primary verification mechanism.

## Impact

- Adds a local skill definition for generating presentations.
- Adds React presentation-kit code and generated presentation conventions.
- Adds scripts or tests for build/render verification.
