/** Stable entity ids (the `layoutId` namespace) and the step at which each entity first appears. */
export const ENTITIES = {
  idea: { id: 'hello-scene-idea', since: 1 },
  detail: { id: 'hello-scene-detail', since: 2 },
  link: { id: 'hello-scene-link', since: 2 },
  result: { id: 'hello-scene-result', since: 3 },
} as const

export type EntityKey = keyof typeof ENTITIES

/** Diagram state of a step: the scene shows every entity introduced up to this step. */
export interface SceneState {
  upTo: number
}
