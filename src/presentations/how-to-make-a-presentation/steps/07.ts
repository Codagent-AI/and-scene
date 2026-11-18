import { outline } from "./outline";
import { Scene } from "./Scene";
import type { Step } from "../../../presentation-kit/types";
export const step: Step<number> = {
  ...outline[6],
  groupKey: "conversation",
  Scene,
  payload: 7,
};
