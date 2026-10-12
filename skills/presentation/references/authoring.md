# Scene authoring guide

Model a talk as one scene that changes through named steps. Give persistent
entities stable IDs in `entities.ts`; reuse those IDs in adjacent scenes so
layout transitions can morph entities in place. Keep adjacent states in a
shared scene group when they continue one composition. New elements should
enter after continuing elements settle, and removed elements should exit.
Captions explain the current step, and previous/next navigation must work.

```ts
// entities.ts
const prefix = "product-launch";
export const ENTITIES = {
  title: `${prefix}:title`,
  chart: `${prefix}:chart`,
};

// steps/step2.tsx
import type { Step } from "../../../presentation-kit/types";
import { ENTITIES } from "../entities";
import { EvidenceScene, type LaunchPayload } from "./EvidenceScene";

export const evidenceStep: Step<LaunchPayload> = {
  id: "evidence",
  section: "Product",
  title: "Evidence",
  caption: "The signal grows over time",
  groupKey: "launch-story",
  Scene: EvidenceScene,
  payload: { through: 2, entityIds: [ENTITIES.title, ENTITIES.chart] },
};

// presentations/index.ts — one explicit lazy loader per talk
export const presentations = [{
  slug: "product-launch",
  title: "Product Launch",
  load: () => import("./product-launch/Talk"),
}];
```

The example follows this kit's `Step` contract and registry shape. Define a
payload type and scene component for the talk, and make every continuing step
reuse the same entity IDs and `groupKey`. For another host, adapt imports to its
exports while preserving the stable IDs and scene continuity.

Keep colors, typography, spacing, borders, shadows, and component treatment in
the talk's local `styles.css`. The kit supplies behavior, geometry, and data
hooks, not a visual theme. Match an existing app's import and naming
conventions as described in the workflow reference. Accumulate-only sequencing
is a story choice in the sample, not a general composition constraint.
