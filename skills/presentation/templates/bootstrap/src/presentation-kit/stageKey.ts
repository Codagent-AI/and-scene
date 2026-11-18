import type { Step } from "./types";
// Scene identity is part of the key even when authors reuse a group name.
const sceneIds = new WeakMap<object, number>();
let nextSceneId = 0;
export function stageKey<T>(step: Step<T>) {
  if (!sceneIds.has(step.Scene)) sceneIds.set(step.Scene, nextSceneId++);
  return `${step.groupKey ?? step.id}:${sceneIds.get(step.Scene)}`;
}
