/* eslint-disable react-refresh/only-export-components -- compiled type fixture, never a runtime module */
// Compiled by the whole-application build; never loaded by the runtime.
import { Presentation } from "./Presentation";
import type { Step, SceneProps } from "./types";
function TypedScene({ payload }: SceneProps<{ label: string }>) {
  return <span>{payload.label}</span>;
}
const typed: Step<{ label: string }>[] = [
  {
    id: "typed",
    era: "contract",
    title: "Typed",
    caption: "Typed payload",
    groupKey: "typed",
    Scene: TypedScene,
    payload: { label: "ok" },
  },
];
export const validBoundary = <Presentation steps={typed} title="Contract" />;
// @ts-expect-error payload type must match the scene contract
export const invalidBoundary = <Presentation<number> steps={typed} title="Invalid" />;
