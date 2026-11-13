import { Box } from "../src/presentation-kit/nodes/Box";
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
export const invalidBoundary = (
  <Presentation<{ count: number }>
    title="Invalid"
    // @ts-expect-error payload count must remain a number across the host boundary
    steps={[{ ...steps[0], payload: { count: "wrong" } }]}
  />
);

export const typedPrimitive = <Box id="typed-node">Text and optional icon</Box>;
