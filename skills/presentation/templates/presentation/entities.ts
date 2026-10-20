/** This presentation's layoutId namespace: an entity keeps its id across every step. */
export const ids = {
  topic: 'topic',
  idea: 'idea',
} as const

export type EntityId = (typeof ids)[keyof typeof ids]
