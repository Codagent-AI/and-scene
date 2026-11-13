import { Presentation } from "../src/presentation-kit/Presentation";
import type { Step, SceneProps } from "../src/presentation-kit/types";
const Scene = ({ payload }: SceneProps<{ count: number }>) => (
  <div>{payload.count}</div>
);
const steps: Step<{ count: number }>[] = [
  {
    id: "typed",
    era: "era",
    title: "title",
    caption: "caption",
    groupKey: "typed",
    Scene,
    payload: { count: 3 },
  },
];
export const typedBoundary = <Presentation title="Typed" steps={steps} />;
// @ts-expect-error payload count must remain a number across the host boundary
export const invalidBoundary = (
  <Presentation<{ count: number }>
    title="Invalid"
    steps={[{ ...steps[0], payload: { count: "wrong" } }]}
  />
);
