import type { Step, SceneProps } from "../../../presentation-kit/types";
import { Box } from "../../../presentation-kit/nodes/Box";
import { SceneLayer } from "../../../presentation-kit/nodes/SceneLayer";
import { entityId } from "../entities";
import type { Payload } from "../entities";
function Scene({ payload }: SceneProps<Payload>) {
  return (
    <SceneLayer>
      <Box
        id={entityId("idea")}
        style={{
          position: "absolute",
          left: 220,
          top: 140,
          width: 440,
          height: 100,
        }}
      >
        {payload.label}
      </Box>
    </SceneLayer>
  );
}
export const STEPS: Step<Payload>[] = [
  {
    id: "opening",
    era: "the idea",
    title: "{{TITLE}}",
    caption: "{{CAPTION}}",
    groupKey: "idea",
    Scene,
    payload: { label: "{{TOPIC}}" },
  },
];
