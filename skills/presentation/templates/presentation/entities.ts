/** Stable entity ids (the `layoutId` namespace) and the step at which each entity first appears. */
export const ENTITIES = {
  idea: { id: '__SLUG__-idea', since: 1 },
  detail: { id: '__SLUG__-detail', since: 2 },
  link: { id: '__SLUG__-link', since: 2 },
  result: { id: '__SLUG__-result', since: 3 },
} as const

export type EntityKey = keyof typeof ENTITIES

/** Diagram state of a step: the scene shows every entity introduced up to this step. */
export interface SceneState {
  upTo: number
}
